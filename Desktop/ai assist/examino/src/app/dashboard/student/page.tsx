"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BookOpen, BarChart3, LogOut, Trophy, Key } from "lucide-react";
import type { Attempt } from "@/lib/types";

export default function StudentDashboard() {
  const [profile, setProfile] = useState<{ full_name: string; rating: number; course: string; class_year: string } | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [availableTests, setAvailableTests] = useState<Record<string, unknown>[]>([]);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }
      const { data: p } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (!p) { router.push("/auth/login"); return; }
      if (p.role === "teacher") { router.push("/dashboard/teacher"); return; }
      setProfile(p);

      // Fetch student's attempts
      const { data: atts } = await supabase.from("attempts").select("*").eq("user_id", user.id).order("started_at", { ascending: false });
      setAttempts(atts ?? []);

      // Fetch available unlocked tests
      const { data: tests } = await supabase.from("tests").select("id,subject,chapter,course,duration_minutes,num_questions,expected_max_score,status").in("status", ["unlocked", "published"]);
      setAvailableTests(tests ?? []);

      setLoading(false);
    })();
  }, []);

  async function handleOTPJoin(e: React.FormEvent) {
    e.preventDefault();
    setOtpLoading(true);
    setOtpError("");
    // Find test with this OTP
    const { data: tests } = await supabase.from("tests").select("id,teacher_otp,status,otp_expires_at").in("status", ["published", "unlocked"]);
    const matched = tests?.find(t => t.teacher_otp === otp);
    if (!matched) { setOtpError("Invalid OTP. Please check with your teacher."); setOtpLoading(false); return; }
    if (matched.otp_expires_at && new Date(matched.otp_expires_at) < new Date()) {
      setOtpError("OTP has expired. Ask your teacher to regenerate."); setOtpLoading(false); return;
    }
    router.push(`/test/${matched.id}`);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  const avgScore = attempts.length
    ? Math.round(attempts.reduce((s, a) => s + (a.score ?? 0), 0) / attempts.length * 10) / 10
    : 0;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <nav className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-2">
          <BookOpen size={22} style={{ color: "var(--accent)" }} />
          <span className="font-bold" style={{ color: "var(--text)" }}>Examino</span>
          <span className="text-xs px-2 py-0.5 rounded-full ml-2" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>{profile?.course}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>{profile?.full_name}</span>
          <button onClick={handleLogout} className="flex items-center gap-1 text-sm" style={{ color: "var(--text-muted)" }}>
            <LogOut size={16} />
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Rating", value: Math.round(profile?.rating ?? 1000), icon: Trophy, color: "#f59e0b" },
            { label: "Tests Taken", value: attempts.length, icon: BookOpen, color: "var(--accent)" },
            { label: "Avg Score", value: avgScore, icon: BarChart3, color: "#22c55e" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="p-4 rounded-xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2 mb-1">
                <Icon size={14} style={{ color }} />
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</span>
              </div>
              <div className="text-2xl font-bold" style={{ color: "var(--text)" }}>{value}</div>
            </div>
          ))}
        </div>

        {/* OTP Join */}
        <div className="p-5 rounded-2xl mb-6" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <h3 className="font-semibold mb-3 flex items-center gap-2" style={{ color: "var(--text)" }}>
            <Key size={16} style={{ color: "var(--accent)" }} /> Join Test with OTP
          </h3>
          <form onSubmit={handleOTPJoin} className="flex gap-3">
            <input value={otp} onChange={e => setOtp(e.target.value)}
              placeholder="Enter 6-digit OTP from teacher"
              className="flex-1 px-4 py-2.5 rounded-lg text-sm outline-none"
              style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text)" }}
              maxLength={6} />
            <button type="submit" disabled={otpLoading || otp.length < 4}
              className="px-5 py-2.5 rounded-lg font-semibold text-sm"
              style={{ background: "var(--accent)", color: "#fff" }}>
              {otpLoading ? "..." : "Join"}
            </button>
          </form>
          {otpError && <p className="text-xs mt-2" style={{ color: "var(--red)" }}>{otpError}</p>}
        </div>

        {/* Available Tests */}
        {availableTests.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold mb-3" style={{ color: "var(--text)" }}>Available Tests</h3>
            <div className="space-y-2">
              {availableTests.map(t => (
                <div key={String(t.id)} className="flex items-center justify-between p-4 rounded-xl"
                  style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                  <div>
                    <p className="font-medium text-sm" style={{ color: "var(--text)" }}>{String(t.subject)} — {String(t.chapter)}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{String(t.course)} · {String(t.duration_minutes)} min · {String(t.num_questions)} questions</p>
                  </div>
                  <Link href={`/test/${t.id}`}
                    className="px-4 py-1.5 rounded-lg text-sm font-medium"
                    style={{ background: "var(--accent)", color: "#fff" }}>
                    Start
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Past Attempts */}
        <div>
          <h3 className="font-semibold mb-3" style={{ color: "var(--text)" }}>Test History</h3>
          {attempts.length === 0 ? (
            <div className="text-center py-10 rounded-xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>No tests taken yet. Join a test with an OTP!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {attempts.map(a => (
                <div key={a.id} className="flex items-center justify-between p-4 rounded-xl"
                  style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{a.test_id.split("-").slice(1, 3).join(" ")}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                      {a.submitted_at ? new Date(a.submitted_at).toLocaleDateString() : "In progress"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold" style={{ color: a.score !== null && a.max_score ? (a.score / a.max_score > 0.6 ? "#22c55e" : "#ef4444") : "var(--text)" }}>
                      {a.score ?? "—"} / {a.max_score ?? "—"}
                    </p>
                    {a.rating_delta !== null && (
                      <p className="text-xs" style={{ color: (a.rating_delta ?? 0) >= 0 ? "#22c55e" : "#ef4444" }}>
                        {(a.rating_delta ?? 0) >= 0 ? "+" : ""}{a.rating_delta} rating
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
