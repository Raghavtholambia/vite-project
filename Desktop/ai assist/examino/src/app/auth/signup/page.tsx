"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import type { Course, Role } from "@/lib/types";
import { Suspense } from "react";

function SignupForm() {
  const searchParams = useSearchParams();
  const defaultRole = (searchParams.get("role") ?? "student") as Role;

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>(defaultRole);
  const [course, setCourse] = useState<Course>("JEE");
  const [classYear, setClassYear] = useState("11");
  const [school, setSchool] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { data, error: signupError } = await supabase.auth.signUp({ email, password });
    if (signupError) { setError(signupError.message); setLoading(false); return; }

    // Create profile
    await fetch("/api/auth/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ full_name: fullName, role, course, class_year: classYear, school }),
    });

    if (role === "teacher") router.push("/dashboard/teacher");
    else router.push("/dashboard/student");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--bg)" }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3"><BookOpen size={32} style={{ color: "var(--accent)" }} /></div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Create Account</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Join Examino for JEE & NEET preparation</p>
        </div>
        <form onSubmit={handleSignup} className="p-6 rounded-2xl space-y-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          {error && (
            <div className="p-3 rounded-lg text-sm" style={{ background: "#ef444422", color: "var(--red)", border: "1px solid var(--red)" }}>{error}</div>
          )}

          {/* Role Toggle */}
          <div className="flex gap-2 p-1 rounded-lg" style={{ background: "var(--bg-input)" }}>
            {(["student", "teacher"] as Role[]).map(r => (
              <button key={r} type="button" onClick={() => setRole(r)}
                className="flex-1 py-2 rounded-md text-sm font-medium capitalize transition-all"
                style={role === r ? { background: "var(--accent)", color: "#fff" } : { color: "var(--text-muted)" }}>
                {r}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Full Name</label>
            <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg text-sm outline-none"
              style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text)" }}
              placeholder="Aarav Sharma" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg text-sm outline-none"
              style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text)" }}
              placeholder="you@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Password</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg text-sm outline-none"
              style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text)" }}
              placeholder="Min. 6 characters" />
          </div>

          {role === "student" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Course</label>
                <select value={course} onChange={e => setCourse(e.target.value as Course)}
                  className="w-full px-4 py-2.5 rounded-lg text-sm outline-none"
                  style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text)" }}>
                  <option value="JEE">JEE</option>
                  <option value="NEET">NEET</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Class</label>
                <select value={classYear} onChange={e => setClassYear(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg text-sm outline-none"
                  style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text)" }}>
                  <option value="11">Class 11</option>
                  <option value="12">Class 12</option>
                  <option value="dropper">Dropper</option>
                </select>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>School / Institute</label>
            <input type="text" value={school} onChange={e => setSchool(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg text-sm outline-none"
              style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text)" }}
              placeholder="Optional" />
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-2.5 rounded-lg font-semibold text-sm transition-all"
            style={{ background: loading ? "var(--bg-input)" : "var(--accent)", color: loading ? "var(--text-muted)" : "#fff" }}>
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>
        <p className="text-center text-sm mt-4" style={{ color: "var(--text-muted)" }}>
          Already have an account?{" "}
          <Link href="/auth/login" style={{ color: "var(--accent)" }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}
