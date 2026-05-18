"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Clock, AlertTriangle, CheckCircle, ChevronLeft, ChevronRight, Send, Eye
} from "lucide-react";
import type { Question, QuestionOption } from "@/lib/types";

type FetchedTest = {
  test_id: string;
  duration_minutes: number;
  subject: string;
  chapter: string;
  course: string;
  allow_negative_marking: boolean;
  scoring_scheme: { per_question: number };
  integrity_hash: string;
  questions: Question[];
};

type GradeResult = {
  score: number;
  max_score: number;
  percentage: number;
  rating_delta: number;
  new_rating: number;
  suspicious_score: number;
  per_question: Record<string, { earned: number; max: number; correct: boolean }>;
  analytics: {
    topic_accuracy: Record<string, { correct: number; total: number }>;
    focus_loss_count: number;
    questions_attempted: number;
    total_questions: number;
  };
};

export default function TestPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [testData, setTestData] = useState<FetchedTest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [started, setStarted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<GradeResult | null>(null);

  // Answers: questionId -> answer value
  const [answers, setAnswers] = useState<Record<string, number | number[] | string>>({});
  // Time per question tracking
  const timePerQ = useRef<Record<string, number>>({});
  const questionStartTime = useRef<number>(Date.now());
  const [currentQ, setCurrentQ] = useState(0);

  // Timer
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Anti-cheat
  const [focusLoss, setFocusLoss] = useState(0);
  const [showFocusWarning, setShowFocusWarning] = useState(false);
  const focusLossRef = useRef(0);
  const isFullscreen = useRef(false);

  // Fetch test
  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/tests/${id}/questions`);
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Failed to load test");
        setLoading(false);
        return;
      }
      const data = await res.json() as FetchedTest;
      setTestData(data);
      setTimeLeft(data.duration_minutes * 60);
      setLoading(false);
    })();
  }, [id]);

  // Anti-cheat: Visibility API + window blur
  useEffect(() => {
    if (!started) return;

    function handleVisibilityChange() {
      if (document.hidden) {
        focusLossRef.current += 1;
        setFocusLoss(focusLossRef.current);
        setShowFocusWarning(true);
        setTimeout(() => setShowFocusWarning(false), 3000);
      }
    }
    function handleBlur() {
      focusLossRef.current += 1;
      setFocusLoss(focusLossRef.current);
      setShowFocusWarning(true);
      setTimeout(() => setShowFocusWarning(false), 3000);
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
    };
  }, [started]);

  // Timer countdown
  useEffect(() => {
    if (!started || submitted) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [started, submitted]);

  // Track time per question on navigation
  const recordTimeForCurrentQ = useCallback(() => {
    if (!testData) return;
    const qId = testData.questions[currentQ]?.id;
    if (!qId) return;
    const elapsed = (Date.now() - questionStartTime.current) / 1000;
    timePerQ.current[qId] = (timePerQ.current[qId] ?? 0) + elapsed;
    questionStartTime.current = Date.now();
  }, [currentQ, testData]);

  function goToQuestion(idx: number) {
    recordTimeForCurrentQ();
    setCurrentQ(idx);
    questionStartTime.current = Date.now();
  }

  function startTest() {
    // Try fullscreen
    document.documentElement.requestFullscreen?.().catch(() => {});
    setStarted(true);
    questionStartTime.current = Date.now();
  }

  async function handleSubmit() {
    if (submitted) return;
    recordTimeForCurrentQ();
    setSubmitted(true);
    clearInterval(timerRef.current!);
    // Exit fullscreen
    document.exitFullscreen?.().catch(() => {});

    const res = await fetch(`/api/tests/${id}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        answers,
        time_per_question: timePerQ.current,
        focus_loss_count: focusLossRef.current,
      }),
    });
    const data = await res.json();
    setResult(data);
  }

  function setAnswer(qId: string, val: number | number[] | string) {
    setAnswers(prev => ({ ...prev, [qId]: val }));
  }

  function toggleMultiAnswer(qId: string, idx: number) {
    const current = (answers[qId] as number[]) ?? [];
    if (current.includes(idx)) {
      setAnswer(qId, current.filter(i => i !== idx));
    } else {
      setAnswer(qId, [...current, idx]);
    }
  }

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
      <div className="text-sm" style={{ color: "var(--text-muted)" }}>Loading test...</div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--bg)" }}>
      <div className="text-center max-w-sm">
        <AlertTriangle size={40} className="mx-auto mb-4" style={{ color: "var(--red)" }} />
        <p className="font-semibold mb-2" style={{ color: "var(--text)" }}>Cannot load test</p>
        <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>{error}</p>
        <button onClick={() => router.push("/dashboard/student")} className="px-4 py-2 rounded-lg text-sm" style={{ background: "var(--accent)", color: "#fff" }}>
          Back to Dashboard
        </button>
      </div>
    </div>
  );

  // Result screen
  if (result) return (
    <div className="min-h-screen p-6" style={{ background: "var(--bg)" }}>
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <CheckCircle size={48} className="mx-auto mb-4" style={{ color: "#22c55e" }} />
          <h1 className="text-3xl font-black mb-2" style={{ color: "var(--text)" }}>Test Submitted!</h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>{testData?.subject} — {testData?.chapter}</p>
        </div>

        {/* Score Card */}
        <div className="p-6 rounded-2xl mb-6 text-center" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <div className="text-5xl font-black mb-2" style={{ color: result.percentage >= 60 ? "#22c55e" : "#ef4444" }}>
            {result.percentage}%
          </div>
          <div className="text-lg mb-1" style={{ color: "var(--text)" }}>{result.score} / {result.max_score} marks</div>
          <div className="flex items-center justify-center gap-1 text-sm" style={{ color: (result.rating_delta ?? 0) >= 0 ? "#22c55e" : "#ef4444" }}>
            {(result.rating_delta ?? 0) >= 0 ? "+" : ""}{result.rating_delta} rating → {result.new_rating}
          </div>
        </div>

        {/* Analytics */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 rounded-xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>Questions Attempted</p>
            <p className="text-xl font-bold" style={{ color: "var(--text)" }}>{result.analytics?.questions_attempted} / {result.analytics?.total_questions}</p>
          </div>
          <div className="p-4 rounded-xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>Focus Losses</p>
            <p className="text-xl font-bold" style={{ color: focusLoss > 2 ? "#f59e0b" : "var(--text)" }}>{focusLoss}</p>
          </div>
        </div>

        {/* Topic Accuracy */}
        {result.analytics?.topic_accuracy && Object.keys(result.analytics.topic_accuracy).length > 0 && (
          <div className="p-5 rounded-xl mb-6" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <h3 className="font-semibold mb-3" style={{ color: "var(--text)" }}>Topic Accuracy</h3>
            {Object.entries(result.analytics.topic_accuracy).map(([topic, { correct, total }]) => (
              <div key={topic} className="mb-2">
                <div className="flex justify-between text-xs mb-1">
                  <span style={{ color: "var(--text-muted)" }}>{topic}</span>
                  <span style={{ color: "var(--text)" }}>{correct}/{total}</span>
                </div>
                <div className="h-1.5 rounded-full" style={{ background: "var(--bg-input)" }}>
                  <div className="h-1.5 rounded-full transition-all" style={{ width: `${(correct / total) * 100}%`, background: correct / total >= 0.6 ? "#22c55e" : "#ef4444" }} />
                </div>
              </div>
            ))}
          </div>
        )}

        <button onClick={() => router.push("/dashboard/student")} className="w-full py-3 rounded-xl font-semibold"
          style={{ background: "var(--accent)", color: "#fff" }}>
          Back to Dashboard
        </button>
      </div>
    </div>
  );

  // Pre-start screen
  if (!started) return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--bg)" }}>
      <div className="max-w-md w-full text-center">
        <div className="p-8 rounded-2xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--text)" }}>{testData?.subject}</h1>
          <p className="mb-1" style={{ color: "var(--text-muted)" }}>{testData?.chapter}</p>
          <div className="flex justify-center gap-6 text-sm my-6" style={{ color: "var(--text-muted)" }}>
            <span><Clock size={13} className="inline mr-1" />{testData?.duration_minutes} minutes</span>
            <span>{testData?.questions.length} questions</span>
          </div>
          <div className="p-3 rounded-lg mb-6 text-left" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <p className="text-xs font-semibold mb-1" style={{ color: "var(--yellow)" }}>Important Instructions</p>
            <ul className="text-xs space-y-1" style={{ color: "var(--text-muted)" }}>
              <li>• Do not switch tabs or minimize the window</li>
              <li>• Tab switches are recorded as focus losses</li>
              <li>• Test will auto-submit when time runs out</li>
              <li>• Fullscreen will be enabled for better focus</li>
              {testData?.allow_negative_marking && <li>• Negative marking is enabled — wrong answers deduct marks</li>}
            </ul>
          </div>
          <button onClick={startTest} className="w-full py-3 rounded-xl font-bold"
            style={{ background: "var(--accent)", color: "#fff" }}>
            Start Test
          </button>
        </div>
      </div>
    </div>
  );

  const q = testData!.questions[currentQ];
  const answered = Object.keys(answers).length;
  const isAnswered = (qId: string) => {
    const a = answers[qId];
    if (a === undefined || a === null) return false;
    if (Array.isArray(a)) return a.length > 0;
    if (typeof a === "string") return a.trim() !== "";
    return true;
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>
      {/* Focus Warning Banner */}
      {showFocusWarning && (
        <div className="fixed top-0 left-0 right-0 z-50 p-3 text-center text-sm font-semibold"
          style={{ background: "#f59e0b", color: "#000" }}>
          <AlertTriangle size={14} className="inline mr-2" />
          Warning: Tab/window switch detected! Focus losses: {focusLoss}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b" style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}>
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>{testData?.subject} — {testData?.chapter}</span>
          {focusLoss > 0 && (
            <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
              style={{ background: "#f59e0b22", color: "#f59e0b" }}>
              <Eye size={10} /> {focusLoss} focus loss{focusLoss !== 1 ? "es" : ""}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-sm font-mono font-bold"
            style={{ color: timeLeft < 300 ? "var(--red)" : "var(--text)" }}>
            <Clock size={14} />
            {formatTime(timeLeft)}
          </div>
          <button onClick={handleSubmit}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold"
            style={{ background: "var(--accent)", color: "#fff" }}>
            <Send size={13} /> Submit
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Question Panel */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: "var(--bg-input)", color: "var(--text-muted)" }}>
                  Q{currentQ + 1} of {testData!.questions.length}
                </span>
                <span className="text-xs capitalize" style={{ color: "var(--text-muted)" }}>{q.type.replace("_", " ")}</span>
              </div>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>{q.points} pts</span>
            </div>

            <p className="text-base leading-relaxed mb-6" style={{ color: "var(--text)" }}>{q.stem}</p>

            {/* MCQ Single */}
            {q.type === "mcq_single" && (
              <div className="space-y-3">
                {q.options.map((opt: QuestionOption, oi: number) => {
                  const selected = answers[q.id] === oi;
                  return (
                    <button key={opt.id} onClick={() => setAnswer(q.id, oi)}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all text-sm"
                      style={{
                        background: selected ? "var(--accent-soft)" : "var(--bg-card)",
                        border: `1px solid ${selected ? "var(--accent)" : "var(--border)"}`,
                        color: selected ? "var(--accent)" : "var(--text)",
                      }}>
                      <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                        style={{ background: selected ? "var(--accent)" : "var(--bg-input)", color: selected ? "#fff" : "var(--text-muted)" }}>
                        {String.fromCharCode(65 + oi)}
                      </span>
                      {opt.text}
                    </button>
                  );
                })}
              </div>
            )}

            {/* MCQ Multi */}
            {q.type === "mcq_multi" && (
              <div className="space-y-3">
                <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>Select all that apply</p>
                {q.options.map((opt: QuestionOption, oi: number) => {
                  const selected = ((answers[q.id] as number[]) ?? []).includes(oi);
                  return (
                    <button key={opt.id} onClick={() => toggleMultiAnswer(q.id, oi)}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all text-sm"
                      style={{
                        background: selected ? "var(--accent-soft)" : "var(--bg-card)",
                        border: `1px solid ${selected ? "var(--accent)" : "var(--border)"}`,
                        color: selected ? "var(--accent)" : "var(--text)",
                      }}>
                      <span className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold shrink-0"
                        style={{ background: selected ? "var(--accent)" : "var(--bg-input)", color: selected ? "#fff" : "var(--text-muted)" }}>
                        {selected ? "✓" : String.fromCharCode(65 + oi)}
                      </span>
                      {opt.text}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Integer */}
            {q.type === "integer" && (
              <div>
                <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>Enter your numeric answer</p>
                <input
                  type="number"
                  value={(answers[q.id] as string) ?? ""}
                  onChange={e => setAnswer(q.id, e.target.value)}
                  className="px-4 py-3 rounded-xl text-sm outline-none w-48"
                  style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text)" }}
                  placeholder="Enter number"
                />
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8">
              <button onClick={() => goToQuestion(Math.max(0, currentQ - 1))} disabled={currentQ === 0}
                className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm"
                style={{ background: "var(--bg-card)", color: currentQ === 0 ? "var(--text-dim)" : "var(--text)", border: "1px solid var(--border)" }}>
                <ChevronLeft size={14} /> Previous
              </button>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>{answered}/{testData!.questions.length} answered</span>
              <button onClick={() => goToQuestion(Math.min(testData!.questions.length - 1, currentQ + 1))}
                disabled={currentQ === testData!.questions.length - 1}
                className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm"
                style={{ background: "var(--bg-card)", color: currentQ === testData!.questions.length - 1 ? "var(--text-dim)" : "var(--text)", border: "1px solid var(--border)" }}>
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Question Palette */}
        <div className="w-56 p-4 border-l overflow-y-auto" style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}>
          <p className="text-xs font-semibold mb-3" style={{ color: "var(--text-muted)" }}>Question Palette</p>
          <div className="grid grid-cols-4 gap-1.5">
            {testData!.questions.map((q, i) => {
              const active = i === currentQ;
              const done = isAnswered(q.id);
              return (
                <button key={q.id} onClick={() => goToQuestion(i)}
                  className="w-9 h-9 rounded-lg text-xs font-bold transition-all"
                  style={{
                    background: active ? "var(--accent)" : done ? "#22c55e22" : "var(--bg-input)",
                    color: active ? "#fff" : done ? "#22c55e" : "var(--text-muted)",
                    border: `1px solid ${active ? "var(--accent)" : done ? "#22c55e44" : "var(--border)"}`,
                  }}>
                  {i + 1}
                </button>
              );
            })}
          </div>
          <div className="mt-4 space-y-1.5">
            <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
              <div className="w-3 h-3 rounded" style={{ background: "var(--accent)" }} /> Current
            </div>
            <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
              <div className="w-3 h-3 rounded" style={{ background: "#22c55e44" }} /> Answered
            </div>
            <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
              <div className="w-3 h-3 rounded" style={{ background: "var(--bg-input)" }} /> Not visited
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
