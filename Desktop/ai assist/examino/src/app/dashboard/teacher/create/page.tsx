"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Zap, Plus, X } from "lucide-react";
import type { Course, QuestionType, CreateTestPayload } from "@/lib/types";

const SUBJECTS: Record<Course, string[]> = {
  JEE: ["Physics", "Chemistry", "Mathematics"],
  NEET: ["Physics", "Chemistry", "Biology"],
};

const CHAPTERS: Record<string, string[]> = {
  Physics: ["Kinematics", "Laws of Motion", "Work Energy Power", "Rotational Motion", "Gravitation", "Thermodynamics", "Electrostatics", "Current Electricity", "Magnetism", "Optics", "Modern Physics"],
  Chemistry: ["Atomic Structure", "Chemical Bonding", "Equilibrium", "Thermodynamics", "Electrochemistry", "Coordination Compounds", "Organic Chemistry Basics", "Hydrocarbons", "Aldehydes & Ketones", "Biomolecules"],
  Mathematics: ["Sets & Functions", "Trigonometry", "Algebra", "Coordinate Geometry", "Calculus", "Vectors & 3D", "Probability", "Statistics"],
  Biology: ["Cell Biology", "Genetics", "Evolution", "Human Physiology", "Plant Physiology", "Ecology", "Biotechnology", "Reproduction"],
};

export default function CreateTestPage() {
  const [course, setCourse] = useState<Course>("JEE");
  const [subject, setSubject] = useState("Physics");
  const [chapter, setChapter] = useState("Electrostatics");
  const [classYear, setClassYear] = useState("12");
  const [duration, setDuration] = useState(60);
  const [numQ, setNumQ] = useState(10);
  const [easy, setEasy] = useState(3);
  const [medium, setMedium] = useState(5);
  const [hard, setHard] = useState(2);
  const [negMark, setNegMark] = useState(false);
  const [negVal, setNegVal] = useState(1);
  const [perQ, setPerQ] = useState(4);
  const [qTypes, setQTypes] = useState<QuestionType[]>(["mcq_single"]);
  const [objectives, setObjectives] = useState<string[]>(["Coulomb's law", "Electric field", "Electric potential"]);
  const [objInput, setObjInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  function toggleType(t: QuestionType) {
    setQTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  }

  function addObjective() {
    const v = objInput.trim();
    if (v && !objectives.includes(v)) setObjectives(p => [...p, v]);
    setObjInput("");
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (easy + medium + hard !== numQ) { setError(`Difficulty mix must sum to ${numQ}`); return; }
    if (qTypes.length === 0) { setError("Select at least one question type"); return; }
    if (objectives.length === 0) { setError("Add at least one learning objective"); return; }
    setLoading(true);
    setError("");

    const payload: CreateTestPayload = {
      course, subject, chapter, class_year: classYear,
      duration_minutes: duration, num_questions: numQ,
      difficulty_mix: { easy, medium, hard },
      allow_negative_marking: negMark, negative_per_wrong: negMark ? negVal : 0,
      question_types: qTypes,
      scoring_scheme: { per_question: perQ },
      learning_objectives: objectives,
      produce_explanations: true, max_explanation_words: 60,
    };

    const res = await fetch("/api/tests/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Failed to create test"); setLoading(false); return; }
    router.push(`/dashboard/teacher/tests/${data.test_id}`);
  }

  const label = "block text-sm font-medium mb-1.5";
  const input = "w-full px-4 py-2.5 rounded-lg text-sm outline-none";
  const inputStyle = { background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text)" };

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <nav className="flex items-center gap-3 px-6 py-4 border-b" style={{ borderColor: "var(--border)" }}>
        <Link href="/dashboard/teacher" className="flex items-center gap-1 text-sm" style={{ color: "var(--text-muted)" }}>
          <ArrowLeft size={16} /> Back
        </Link>
        <span style={{ color: "var(--text-dim)" }}>/</span>
        <span className="text-sm font-medium" style={{ color: "var(--text)" }}>Create Test</span>
      </nav>
      <div className="max-w-2xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Create AI Test</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>GPT-4o generates your questions based on these settings</p>
        </div>

        <form onSubmit={handleCreate} className="space-y-6">
          {error && <div className="p-3 rounded-lg text-sm" style={{ background: "#ef444422", color: "var(--red)", border: "1px solid var(--red)" }}>{error}</div>}

          {/* Course + Subject + Chapter */}
          <div className="p-5 rounded-xl space-y-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <h3 className="font-semibold text-sm" style={{ color: "var(--text)" }}>Test Content</h3>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={label} style={{ color: "var(--text-muted)" }}>Course</label>
                <select value={course} onChange={e => { setCourse(e.target.value as Course); setSubject(SUBJECTS[e.target.value as Course][0]); }} className={input} style={inputStyle}>
                  <option>JEE</option><option>NEET</option>
                </select>
              </div>
              <div>
                <label className={label} style={{ color: "var(--text-muted)" }}>Subject</label>
                <select value={subject} onChange={e => { setSubject(e.target.value); setChapter(CHAPTERS[e.target.value]?.[0] ?? ""); }} className={input} style={inputStyle}>
                  {SUBJECTS[course].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className={label} style={{ color: "var(--text-muted)" }}>Class</label>
                <select value={classYear} onChange={e => setClassYear(e.target.value)} className={input} style={inputStyle}>
                  <option value="11">Class 11</option><option value="12">Class 12</option><option value="dropper">Dropper</option>
                </select>
              </div>
            </div>
            <div>
              <label className={label} style={{ color: "var(--text-muted)" }}>Chapter</label>
              <select value={chapter} onChange={e => setChapter(e.target.value)} className={input} style={inputStyle}>
                {(CHAPTERS[subject] ?? []).map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Test Structure */}
          <div className="p-5 rounded-xl space-y-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <h3 className="font-semibold text-sm" style={{ color: "var(--text)" }}>Test Structure</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={label} style={{ color: "var(--text-muted)" }}>Questions</label>
                <input type="number" min={1} max={50} value={numQ} onChange={e => setNumQ(Number(e.target.value))} className={input} style={inputStyle} />
              </div>
              <div>
                <label className={label} style={{ color: "var(--text-muted)" }}>Duration (min)</label>
                <input type="number" min={5} max={180} value={duration} onChange={e => setDuration(Number(e.target.value))} className={input} style={inputStyle} />
              </div>
            </div>
            <div>
              <label className={label} style={{ color: "var(--text-muted)" }}>Difficulty Mix (Easy / Medium / Hard = {numQ})</label>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <span className="text-xs mb-1 block" style={{ color: "#22c55e" }}>Easy</span>
                  <input type="number" min={0} value={easy} onChange={e => setEasy(Number(e.target.value))} className={input} style={inputStyle} />
                </div>
                <div>
                  <span className="text-xs mb-1 block" style={{ color: "#f59e0b" }}>Medium</span>
                  <input type="number" min={0} value={medium} onChange={e => setMedium(Number(e.target.value))} className={input} style={inputStyle} />
                </div>
                <div>
                  <span className="text-xs mb-1 block" style={{ color: "#ef4444" }}>Hard</span>
                  <input type="number" min={0} value={hard} onChange={e => setHard(Number(e.target.value))} className={input} style={inputStyle} />
                </div>
              </div>
            </div>
            <div>
              <label className={label} style={{ color: "var(--text-muted)" }}>Points per Question</label>
              <input type="number" min={1} max={10} value={perQ} onChange={e => setPerQ(Number(e.target.value))} className={input} style={{ ...inputStyle, width: "8rem" }} />
            </div>
            <div>
              <label className={label} style={{ color: "var(--text-muted)" }}>Question Types</label>
              <div className="flex gap-2 flex-wrap">
                {(["mcq_single", "mcq_multi", "integer"] as QuestionType[]).map(t => (
                  <button key={t} type="button" onClick={() => toggleType(t)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={qTypes.includes(t) ? { background: "var(--accent)", color: "#fff" } : { background: "var(--bg-input)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
                    {t.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Marking Scheme */}
          <div className="p-5 rounded-xl space-y-3" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <h3 className="font-semibold text-sm" style={{ color: "var(--text)" }}>Marking Scheme</h3>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={negMark} onChange={e => setNegMark(e.target.checked)} />
              <span className="text-sm" style={{ color: "var(--text)" }}>Enable negative marking</span>
            </label>
            {negMark && (
              <div>
                <label className={label} style={{ color: "var(--text-muted)" }}>Marks deducted per wrong answer</label>
                <input type="number" min={0.25} max={4} step={0.25} value={negVal} onChange={e => setNegVal(Number(e.target.value))} className={input} style={{ ...inputStyle, width: "8rem" }} />
              </div>
            )}
          </div>

          {/* Learning Objectives */}
          <div className="p-5 rounded-xl space-y-3" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <h3 className="font-semibold text-sm" style={{ color: "var(--text)" }}>Learning Objectives / Topic Tags</h3>
            <div className="flex gap-2">
              <input value={objInput} onChange={e => setObjInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addObjective(); } }}
                className={`flex-1 ${input}`} style={inputStyle} placeholder="e.g. Gauss's law" />
              <button type="button" onClick={addObjective} className="px-3 py-2 rounded-lg" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
                <Plus size={16} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {objectives.map(o => (
                <span key={o} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs"
                  style={{ background: "var(--accent-soft)", color: "var(--accent)", border: "1px solid var(--accent)" }}>
                  {o}
                  <button type="button" onClick={() => setObjectives(p => p.filter(x => x !== o))}><X size={10} /></button>
                </span>
              ))}
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
            style={{ background: loading ? "var(--bg-input)" : "var(--accent)", color: loading ? "var(--text-muted)" : "#fff" }}>
            {loading ? <>Generating with AI — this takes ~15s...</> : <><Zap size={16} /> Generate Test with AI</>}
          </button>
        </form>
      </div>
    </div>
  );
}
