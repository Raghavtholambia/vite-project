"use client";
import Link from "next/link";
import { BookOpen, Zap, Shield, BarChart3, CheckCircle } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-2">
          <BookOpen size={24} style={{ color: "var(--accent)" }} />
          <span className="text-xl font-bold" style={{ color: "var(--text)" }}>Examino</span>
        </div>
        <div className="flex gap-3">
          <Link href="/auth/login" className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ color: "var(--text-muted)", border: "1px solid var(--border)" }}>
            Sign In
          </Link>
          <Link href="/auth/signup" className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ background: "var(--accent)", color: "#fff" }}>
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="text-center px-6 py-24 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-6"
          style={{ background: "var(--accent-soft)", color: "var(--accent)", border: "1px solid var(--accent)" }}>
          <Zap size={12} /> AI-Powered JEE & NEET Preparation
        </div>
        <h1 className="text-5xl font-black mb-6 leading-tight" style={{ color: "var(--text)" }}>
          Crack JEE & NEET with<br />
          <span style={{ color: "var(--accent)" }}>Intelligent Practice</span>
        </h1>
        <p className="text-lg mb-10 max-w-2xl mx-auto" style={{ color: "var(--text-muted)" }}>
          AI-generated chapter-wise tests, real-time grading, Elo rating, and anti-cheat proctoring.
          Built for serious aspirants and their teachers.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/auth/signup?role=student" className="px-8 py-3 rounded-xl font-semibold text-base transition-all hover:scale-105"
            style={{ background: "var(--accent)", color: "#fff" }}>
            I'm a Student
          </Link>
          <Link href="/auth/signup?role=teacher" className="px-8 py-3 rounded-xl font-semibold text-base transition-all hover:scale-105"
            style={{ background: "var(--bg-card)", color: "var(--text)", border: "1px solid var(--border)" }}>
            I'm a Teacher
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-16 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: Zap, title: "AI Test Generation", desc: "GPT-4o generates chapter-wise JEE/NEET tests instantly with difficulty mix control." },
            { icon: BarChart3, title: "Smart Analytics", desc: "Per-topic accuracy, time analysis, and Elo-based rating after every test." },
            { icon: Shield, title: "Anti-Cheat Proctoring", desc: "Focus-loss detection, integrity hash verification, and optional webcam proctoring." },
            { icon: CheckCircle, title: "OTP-Controlled Tests", desc: "Teachers issue OTP to start tests. Deterministic generation ensures same test for all." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="p-6 rounded-2xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                style={{ background: "var(--accent-soft)" }}>
                <Icon size={20} style={{ color: "var(--accent)" }} />
              </div>
              <h3 className="font-bold mb-2" style={{ color: "var(--text)" }}>{title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-16 max-w-3xl mx-auto text-center">
        <h2 className="text-3xl font-bold mb-12" style={{ color: "var(--text)" }}>How It Works</h2>
        <div className="space-y-6">
          {[
            { step: "01", title: "Teacher Creates Test", desc: "Configure subject, chapter, difficulty mix. AI generates questions in seconds." },
            { step: "02", title: "OTP Issued in Class", desc: "Teacher shares a 6-digit OTP. Students enter OTP to unlock the test." },
            { step: "03", title: "Students Take Test", desc: "Timed, monitored with focus-loss detection and question integrity checks." },
            { step: "04", title: "Instant Grading & Rating", desc: "Scores computed immediately. Ratings updated with Elo-like formula." },
          ].map(({ step, title, desc }) => (
            <div key={step} className="flex gap-6 text-left p-5 rounded-xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <div className="text-3xl font-black shrink-0" style={{ color: "var(--accent)" }}>{step}</div>
              <div>
                <h4 className="font-semibold mb-1" style={{ color: "var(--text)" }}>{title}</h4>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-8 text-sm" style={{ color: "var(--text-dim)", borderTop: "1px solid var(--border)" }}>
        © 2026 Examino. Built for JEE & NEET aspirants.
      </footer>
    </div>
  );
}
