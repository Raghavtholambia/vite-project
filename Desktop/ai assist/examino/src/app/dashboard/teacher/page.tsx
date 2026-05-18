"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BookOpen, Plus, LogOut, BarChart3, Clock, CheckCircle, Lock, Unlock } from "lucide-react";
import type { Test } from "@/lib/types";

export default function TeacherDashboard() {
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{ full_name: string; rating: number } | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }
      const { data: p } = await supabase.from("profiles").select("full_name,rating,role").eq("id", user.id).single();
      if (!p || p.role === "student") { router.push("/dashboard/student"); return; }
      setProfile(p);
      const res = await fetch("/api/tests/create");
      if (res.ok) { const data = await res.json(); setTests(data.tests ?? []); }
      setLoading(false);
    })();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  async function generateOTP(testId: string) {
    const res = await fetch(`/api/tests/${testId}/unlock`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "generate" }),
    });
    const data = await res.json();
    if (data.otp) {
      alert(`OTP for students: ${data.otp}\nExpires: ${new Date(data.expires_at).toLocaleString()}`);
      // Refresh tests list
      const r2 = await fetch("/api/tests/create");
      if (r2.ok) { const d = await r2.json(); setTests(d.tests ?? []); }
    } else {
      alert(data.error ?? "Failed to generate OTP");
    }
  }

  const statusColors: Record<string, string> = {
    draft: "#f59e0b",
    published: "#6c63ff",
    unlocked: "#22c55e",
    closed: "#8892b0",
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      {/* Top bar */}
      <nav className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-2">
          <BookOpen size={22} style={{ color: "var(--accent)" }} />
          <span className="font-bold" style={{ color: "var(--text)" }}>Examino</span>
          <span className="text-xs px-2 py-0.5 rounded-full ml-2" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>Teacher</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>{profile?.full_name}</span>
          <button onClick={handleLogout} className="flex items-center gap-1 text-sm" style={{ color: "var(--text-muted)" }}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>My Tests</h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Create, manage, and share AI-generated tests</p>
          </div>
          <Link href="/dashboard/teacher/create" className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm"
            style={{ background: "var(--accent)", color: "#fff" }}>
            <Plus size={16} /> Create Test
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Tests", value: tests.length, icon: BookOpen },
            { label: "Published", value: tests.filter(t => t.status !== "draft").length, icon: CheckCircle },
            { label: "Active", value: tests.filter(t => t.status === "unlocked").length, icon: Unlock },
            { label: "Rating", value: Math.round(profile?.rating ?? 1000), icon: BarChart3 },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="p-4 rounded-xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2 mb-1">
                <Icon size={14} style={{ color: "var(--accent)" }} />
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</span>
              </div>
              <div className="text-2xl font-bold" style={{ color: "var(--text)" }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Tests list */}
        {loading ? (
          <div className="text-center py-12" style={{ color: "var(--text-muted)" }}>Loading tests...</div>
        ) : tests.length === 0 ? (
          <div className="text-center py-16 rounded-2xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <BookOpen size={40} className="mx-auto mb-4" style={{ color: "var(--text-dim)" }} />
            <p className="font-medium mb-2" style={{ color: "var(--text)" }}>No tests yet</p>
            <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>Create your first AI-generated test</p>
            <Link href="/dashboard/teacher/create" className="px-5 py-2 rounded-lg text-sm font-semibold"
              style={{ background: "var(--accent)", color: "#fff" }}>Create Test</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {tests.map(test => (
              <div key={test.id} className="p-5 rounded-xl flex items-center justify-between gap-4"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-semibold" style={{ color: "var(--text)" }}>{test.subject} — {test.chapter}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full capitalize"
                      style={{ background: `${statusColors[test.status]}22`, color: statusColors[test.status] }}>
                      {test.status}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: "var(--bg-input)", color: "var(--text-muted)" }}>{test.course}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs" style={{ color: "var(--text-muted)" }}>
                    <span><Clock size={11} className="inline mr-1" />{test.duration_minutes} min</span>
                    <span>{test.num_questions} questions</span>
                    <span>Class {test.class_year}</span>
                    <span>Max: {test.expected_max_score} pts</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link href={`/dashboard/teacher/tests/${test.id}`}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium"
                    style={{ background: "var(--bg-input)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
                    View
                  </Link>
                  {test.status === "draft" || test.status === "published" ? (
                    <button onClick={() => generateOTP(test.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1"
                      style={{ background: "var(--accent-soft)", color: "var(--accent)", border: "1px solid var(--accent)" }}>
                      <Lock size={11} /> Get OTP
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
