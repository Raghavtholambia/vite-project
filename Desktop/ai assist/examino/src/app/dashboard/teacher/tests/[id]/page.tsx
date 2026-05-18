"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Lock, Copy, CheckCircle, Clock, AlertTriangle, Users } from "lucide-react";
import type { Test, Question } from "@/lib/types";

export default function TeacherTestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [test, setTest] = useState<Test | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [attempts, setAttempts] = useState<Record<string, unknown>[]>([]);
  const [otp, setOtp] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const [tr, qr, ar] = await Promise.all([
        fetch(`/api/tests/${id}`),
        fetch(`/api/tests/${id}/questions`),
        fetch(`/api/tests/${id}/attempts`),
      ]);
      if (tr.ok) { const d = await tr.json(); setTest(d.test); }
      if (qr.ok) { const d = await qr.json(); setQuestions(d.questions ?? []); }
      if (ar.ok) { const d = await ar.json(); setAttempts(d.attempts ?? []); }
      setLoading(false);
    })();
  }, [id]);

  async function getOTP() {
    const res = await fetch(`/api/tests/${id}/unlock`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "generate" }),
    });
    const data = await res.json();
    if (data.otp) setOtp(data.otp);
    else alert(data.error ?? "Error");
  }

  const difficultyLabel = (d: number) => d <= 2 ? "Easy" : d <= 3 ? "Medium" : "Hard";
  const difficultyColor = (d: number) => d <= 2 ? "#22c55e" : d <= 3 ? "#f59e0b" : "#ef4444";

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
      <div className="text-sm" style={{ color: "var(--text-muted)" }}>Loading test...</div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <nav className="flex items-center gap-3 px-6 py-4 border-b" style={{ borderColor: "var(--border)" }}>
        <Link href="/dashboard/teacher" className="flex items-center gap-1 text-sm" style={{ color: "var(--text-muted)" }}>
          <ArrowLeft size={16} /> Back
        </Link>
        <span style={{ color: "var(--text-dim)" }}>/</span>
        <span className="text-sm font-medium" style={{ color: "var(--text)" }}>{test?.subject} — {test?.chapter}</span>
      </nav>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Test Header */}
        <div className="p-6 rounded-2xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold mb-1" style={{ color: "var(--text)" }}>{test?.subject} — {test?.chapter}</h1>
              <div className="flex items-center gap-3 text-xs flex-wrap" style={{ color: "var(--text-muted)" }}>
                <span>{test?.course} · Class {test?.class_year}</span>
                <span><Clock size={11} className="inline mr-1" />{test?.duration_minutes} min</span>
                <span>{test?.num_questions} questions</span>
                <span>Max {test?.expected_max_score} pts</span>
                <span className="capitalize px-2 py-0.5 rounded-full"
                  style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>{test?.status}</span>
              </div>
            </div>
            <button onClick={getOTP}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm shrink-0"
              style={{ background: "var(--accent)", color: "#fff" }}>
              <Lock size={14} /> {otp ? "Refresh OTP" : "Get OTP"}
            </button>
          </div>

          {otp && (
            <div className="mt-4 p-4 rounded-xl flex items-center justify-between"
              style={{ background: "var(--accent-soft)", border: "1px solid var(--accent)" }}>
              <div>
                <p className="text-xs mb-1" style={{ color: "var(--accent)" }}>Share this OTP with your students</p>
                <span className="text-3xl font-black tracking-widest" style={{ color: "var(--text)" }}>{otp}</span>
              </div>
              <button onClick={() => navigator.clipboard.writeText(otp)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs"
                style={{ background: "var(--bg-card)", color: "var(--text-muted)" }}>
                <Copy size={12} /> Copy
              </button>
            </div>
          )}
        </div>

        {/* Integrity hash */}
        {test?.deterministic_hash && (
          <div className="p-3 rounded-lg flex items-center gap-2" style={{ background: "#22c55e11", border: "1px solid #22c55e33" }}>
            <CheckCircle size={14} style={{ color: "#22c55e" }} />
            <span className="text-xs" style={{ color: "#22c55e" }}>Integrity Hash: </span>
            <code className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{test.deterministic_hash.slice(0, 40)}...</code>
          </div>
        )}

        {/* Attempts */}
        {attempts.length > 0 && (
          <div className="p-5 rounded-2xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--text)" }}>
              <Users size={16} style={{ color: "var(--accent)" }} /> Submissions ({attempts.length})
            </h3>
            <div className="space-y-2">
              {attempts.map((a: Record<string, unknown>) => (
                <div key={a.id as string} className="flex items-center justify-between px-4 py-3 rounded-lg"
                  style={{ background: "var(--bg-input)" }}>
                  <span className="text-sm" style={{ color: "var(--text-muted)" }}>{String(a.user_id).slice(0, 8)}...</span>
                  <div className="flex items-center gap-4 text-sm">
                    <span style={{ color: "var(--text)" }}>{String(a.score)} / {String(a.max_score)}</span>
                    {Number(a.suspicious_score) > 0.4 && (
                      <span className="flex items-center gap-1 text-xs" style={{ color: "#f59e0b" }}>
                        <AlertTriangle size={11} /> Suspicious
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Questions Preview */}
        <div className="space-y-4">
          <h3 className="font-semibold" style={{ color: "var(--text)" }}>Questions ({questions.length})</h3>
          {questions.map((q, i) => (
            <div key={q.id} className="p-5 rounded-xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: "var(--bg-input)", color: "var(--text-muted)" }}>Q{i + 1}</span>
                  <span className="text-xs px-2 py-0.5 rounded" style={{ background: `${difficultyColor(q.difficulty)}22`, color: difficultyColor(q.difficulty) }}>
                    {difficultyLabel(q.difficulty)}
                  </span>
                  <span className="text-xs capitalize" style={{ color: "var(--text-dim)" }}>{q.bloom_level}</span>
                </div>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>{q.est_time_seconds}s · {q.points} pts</span>
              </div>
              <p className="text-sm mb-3" style={{ color: "var(--text)" }}>{q.stem}</p>
              {q.type !== "integer" && q.options?.map((opt, oi) => (
                <div key={opt.id} className="flex items-center gap-2 py-1.5 px-3 rounded-lg mb-1 text-sm"
                  style={{
                    background: (Array.isArray(q.correct_answer) ? q.correct_answer.includes(oi) : q.correct_answer === oi)
                      ? "#22c55e22" : "var(--bg-input)",
                    color: (Array.isArray(q.correct_answer) ? q.correct_answer.includes(oi) : q.correct_answer === oi)
                      ? "#22c55e" : "var(--text-muted)",
                  }}>
                  <span className="font-bold text-xs">{String.fromCharCode(65 + oi)}.</span> {opt.text}
                </div>
              ))}
              {q.type === "integer" && (
                <div className="text-sm py-1.5 px-3 rounded-lg" style={{ background: "#22c55e22", color: "#22c55e" }}>
                  Answer: {String(q.correct_answer)}
                </div>
              )}
              {q.explanation && (
                <div className="mt-3 p-3 rounded-lg text-xs leading-relaxed" style={{ background: "var(--bg)", color: "var(--text-muted)" }}>
                  Explanation: {q.explanation}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
