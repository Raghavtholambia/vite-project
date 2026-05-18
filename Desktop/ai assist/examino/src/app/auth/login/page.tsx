"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BookOpen, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setLoading(false); return; }
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", (await supabase.auth.getUser()).data.user?.id ?? "").single();
    if (profile?.role === "teacher" || profile?.role === "admin") {
      router.push("/dashboard/teacher");
    } else {
      router.push("/dashboard/student");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--bg)" }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3"><BookOpen size={32} style={{ color: "var(--accent)" }} /></div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Welcome back</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Sign in to your Examino account</p>
        </div>
        <form onSubmit={handleLogin} className="p-6 rounded-2xl space-y-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          {error && (
            <div className="p-3 rounded-lg text-sm" style={{ background: "#ef444422", color: "var(--red)", border: "1px solid var(--red)" }}>{error}</div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-all"
              style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text)" }}
              placeholder="you@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Password</label>
            <div className="relative">
              <input type={showPw ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg text-sm outline-none pr-10"
                style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text)" }}
                placeholder="••••••••" />
              <button type="button" onClick={() => setShowPw(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: "var(--text-muted)" }}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-2.5 rounded-lg font-semibold text-sm transition-all"
            style={{ background: loading ? "var(--bg-input)" : "var(--accent)", color: loading ? "var(--text-muted)" : "#fff" }}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
        <p className="text-center text-sm mt-4" style={{ color: "var(--text-muted)" }}>
          No account?{" "}
          <Link href="/auth/signup" style={{ color: "var(--accent)" }}>Sign up</Link>
        </p>
      </div>
    </div>
  );
}
