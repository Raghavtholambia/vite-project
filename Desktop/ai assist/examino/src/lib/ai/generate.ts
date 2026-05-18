import { createHash } from "crypto";
import OpenAI from "openai";
import type { CreateTestPayload, GeneratedTestJSON } from "@/lib/types";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function buildPrompt(payload: CreateTestPayload & { test_id: string; seed: string }): string {
  const {
    test_id, course, subject, chapter, class_year, duration_minutes,
    num_questions, difficulty_mix, allow_negative_marking, negative_per_wrong,
    question_types, seed, scoring_scheme, learning_objectives,
    scheduled_unix, produce_explanations, max_explanation_words,
  } = payload;

  return `You are a strict academic content generator for the Examino platform (JEE/NEET focused).
Output ONLY valid JSON — no prose, no markdown fences.

Generate a complete test JSON object with this exact top-level shape:
{
  "test_metadata": { "test_id","course","subject","chapter","scheduled_unix","duration_minutes","seed","deterministic_question_hash" },
  "questions": [ ...question objects ],
  "grading_rules": { ... },
  "expected_max_score": number,
  "analytics_template": { ... },
  "notes": "...",
  "error": null
}

INPUT CONTEXT:
- test_id: "${test_id}"
- course: "${course}"
- class_or_year: "${class_year}"
- subject: "${subject}"
- chapter: "${chapter}"
- scheduled_unix: ${scheduled_unix ?? Math.floor(Date.now() / 1000)}
- duration_minutes: ${duration_minutes}
- num_questions: ${num_questions}
- difficulty_mix: ${JSON.stringify(difficulty_mix)}
- allow_negative_marking: ${allow_negative_marking ?? false}
- negative_per_wrong: ${negative_per_wrong ?? 0}
- question_types: ${JSON.stringify(question_types ?? ["mcq_single"])}
- seed: "${seed}"
- scoring_scheme: ${JSON.stringify(scoring_scheme ?? { per_question: 4 })}
- learning_objectives: ${JSON.stringify(learning_objectives)}
- max_explanation_words: ${max_explanation_words ?? 60}
- produce_explanations: ${produce_explanations ?? true}
- output_hash_salt: "examino-secret-salt-2026"

RULES:
1. Generate exactly ${num_questions} questions covering the learning_objectives and chapter.
2. Use difficulty_mix: easy=${difficulty_mix.easy}, medium=${difficulty_mix.medium}, hard=${difficulty_mix.hard}.
3. For each question include:
   - id: deterministic hex string derived from seed + index (simulate sha1)
   - type: one of ${JSON.stringify(question_types ?? ["mcq_single"])}
   - stem: clear question text appropriate for ${course} ${class_year}
   - options: array of {id, text} objects (3-4 options for MCQ; [] for integer)
   - correct_answer: 0-based index for mcq_single, array of indices for mcq_multi, number for integer
   - difficulty: 1=easy, 3=medium, 5=hard (consistent with difficulty_mix)
   - bloom_level: one of ["remember","understand","apply","analyze","evaluate","create"]
   - tags: subset of learning_objectives
   - est_time_seconds: recommended seconds (total must be <= ${duration_minutes * 60})
   - explanation: concise solution <= ${max_explanation_words ?? 60} words${produce_explanations ? "" : " (omit if produce_explanations false)"}
   - points: ${scoring_scheme?.per_question ?? 4} for correct
4. grading_rules must include:
   - mcq_single: {correct: points, wrong: -${negative_per_wrong ?? 0}}
   - mcq_multi: {formula: "points * (correct_selected/total_correct) - penalty_per_wrong_selected", penalty_per_incorrect: ${negative_per_wrong ?? 0}}
   - integer: {correct: points, wrong: 0, tolerance: 0}
5. expected_max_score = sum of all question points
6. analytics_template must include metrics list, rating_formula (Elo-like delta = K*(score-expected)/max_score), k_factor, suspicious_threshold
7. notes must mention: browser locking limitations, Visibility API tab-blur detection, teacher OTP flow, integrity hash, and optional webcam proctoring.
8. deterministic_question_hash = SHA256 of (all question ids + correct answers joined + seed + "examino-secret-salt-2026")

Return ONLY valid JSON.`;
}

export async function generateTestWithAI(
  payload: CreateTestPayload & { test_id: string }
): Promise<GeneratedTestJSON> {
  const seed = payload.seed || `${payload.test_id}-${Date.now()}`;
  const prompt = buildPrompt({ ...payload, seed });

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.1,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are an expert JEE/NEET question generator. Output only valid JSON matching the exact schema provided. No markdown, no extra text.",
      },
      { role: "user", content: prompt },
    ],
  });

  const raw = completion.choices[0].message.content ?? "{}";
  const parsed = JSON.parse(raw) as GeneratedTestJSON;

  // Server-side recompute integrity hash
  if (parsed.questions?.length) {
    const hashInput =
      parsed.questions.map((q) => q.id + JSON.stringify(q.correct_answer)).join("") +
      seed +
      (process.env.OUTPUT_HASH_SALT ?? "examino-secret-salt-2026");
    const hash = createHash("sha256").update(hashInput).digest("hex");
    if (parsed.test_metadata) {
      parsed.test_metadata.deterministic_question_hash = hash;
    }
  }

  return parsed;
}

export function verifyIntegrityHash(testJson: GeneratedTestJSON, seed: string): boolean {
  if (!testJson.questions?.length) return false;
  const hashInput =
    testJson.questions.map((q) => q.id + JSON.stringify(q.correct_answer)).join("") +
    seed +
    (process.env.OUTPUT_HASH_SALT ?? "examino-secret-salt-2026");
  const expected = createHash("sha256").update(hashInput).digest("hex");
  return testJson.test_metadata?.deterministic_question_hash === expected;
}
