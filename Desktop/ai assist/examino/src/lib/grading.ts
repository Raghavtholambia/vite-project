import type { Attempt, GradingRules, Question } from "@/lib/types";

interface GradeResult {
  score: number;
  max_score: number;
  per_question: Record<string, { earned: number; max: number; correct: boolean }>;
  suspicious_score: number;
  analytics: Record<string, unknown>;
  rating_delta: number;
}

export function gradeAttempt(
  attempt: Pick<Attempt, "answers" | "time_per_question" | "focus_loss_count">,
  questions: Question[],
  rules: GradingRules,
  userRating: number,
  kFactor = 10
): GradeResult {
  let score = 0;
  const max_score = questions.reduce((s, q) => s + q.points, 0);
  const per_question: Record<string, { earned: number; max: number; correct: boolean }> = {};

  for (const q of questions) {
    const submitted = attempt.answers[q.id];
    let earned = 0;
    let correct = false;

    if (q.type === "mcq_single") {
      if (submitted !== undefined && submitted !== null) {
        if (Number(submitted) === Number(q.correct_answer)) {
          earned = q.points;
          correct = true;
        } else {
          earned = rules.mcq_single?.wrong ?? 0;
        }
      }
    } else if (q.type === "mcq_multi") {
      const correctSet = (q.correct_answer as number[]).map(Number);
      const submittedArr = Array.isArray(submitted) ? (submitted as number[]).map(Number) : [];
      const correctSelected = submittedArr.filter((s) => correctSet.includes(s)).length;
      const wrongSelected = submittedArr.filter((s) => !correctSet.includes(s)).length;
      const penalty = wrongSelected * (rules.mcq_multi?.penalty_per_incorrect ?? 0);
      earned = submittedArr.length
        ? q.points * (correctSelected / correctSet.length) - penalty
        : 0;
      earned = Math.max(0, earned);
      correct = correctSelected === correctSet.length && wrongSelected === 0;
    } else if (q.type === "integer") {
      const tolerance = rules.integer?.tolerance ?? 0;
      if (submitted !== undefined && submitted !== null) {
        const diff = Math.abs(Number(submitted) - Number(q.correct_answer));
        if (diff <= tolerance) {
          earned = q.points;
          correct = true;
        }
      }
    }

    per_question[q.id] = { earned, max: q.points, correct };
    score += earned;
  }

  score = Math.round(score * 100) / 100;

  // Suspicious score: based on focus losses
  const focusLoss = attempt.focus_loss_count ?? 0;
  const suspicious_score = Math.min(1, focusLoss / 5);

  // Elo-like rating delta
  const ratingNorm = Math.min(1, Math.max(0, (userRating - 500) / 1000));
  const expected = max_score * ratingNorm;
  const rating_delta = max_score > 0 ? kFactor * ((score - expected) / max_score) : 0;

  // Per-topic analytics
  const topicAccuracy: Record<string, { correct: number; total: number }> = {};
  for (const q of questions) {
    for (const tag of q.tags ?? []) {
      if (!topicAccuracy[tag]) topicAccuracy[tag] = { correct: 0, total: 0 };
      topicAccuracy[tag].total++;
      if (per_question[q.id]?.correct) topicAccuracy[tag].correct++;
    }
  }

  return {
    score,
    max_score,
    per_question,
    suspicious_score,
    rating_delta: Math.round(rating_delta * 100) / 100,
    analytics: {
      topic_accuracy: topicAccuracy,
      focus_loss_count: focusLoss,
      time_per_question: attempt.time_per_question,
      questions_attempted: Object.keys(attempt.answers).length,
      total_questions: questions.length,
    },
  };
}
