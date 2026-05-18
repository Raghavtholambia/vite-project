import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { generateTestWithAI } from "@/lib/ai/generate";
import { randomBytes } from "crypto";
import type { CreateTestPayload } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = createAdminClient();
    const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
    if (!profile || !["teacher", "admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Only teachers can create tests" }, { status: 403 });
    }

    const body = (await req.json()) as CreateTestPayload;
    const test_id = `examino-${Date.now()}-${body.subject.toLowerCase().replace(/\s+/g, "-")}-${body.chapter.toLowerCase().replace(/\s+/g, "-")}`;
    const seed = body.seed || randomBytes(8).toString("hex");

    // Generate questions via AI
    const generated = await generateTestWithAI({ ...body, test_id, seed });

    if (generated.error) {
      return NextResponse.json({ error: generated.error }, { status: 422 });
    }

    // Persist test
    const { data: test, error } = await admin.from("tests").insert({
      id: test_id,
      course: body.course,
      subject: body.subject,
      chapter: body.chapter,
      class_year: body.class_year,
      duration_minutes: body.duration_minutes,
      num_questions: body.num_questions,
      difficulty_mix: body.difficulty_mix,
      allow_negative_marking: body.allow_negative_marking ?? false,
      negative_per_wrong: body.negative_per_wrong ?? 0,
      question_types: body.question_types ?? ["mcq_single"],
      seed,
      scoring_scheme: body.scoring_scheme ?? { per_question: 4 },
      learning_objectives: body.learning_objectives,
      scheduled_unix: body.scheduled_unix ?? null,
      status: "draft",
      generated_json: generated,
      expected_max_score: generated.expected_max_score,
      grading_rules: generated.grading_rules,
      analytics_template: generated.analytics_template,
      deterministic_hash: generated.test_metadata?.deterministic_question_hash ?? null,
      created_by: user.id,
    }).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Persist questions individually
    if (generated.questions?.length) {
      await admin.from("questions").insert(
        generated.questions.map((q) => ({ ...q, test_id }))
      );
    }

    return NextResponse.json({ test_id: test.id, test, generated }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = createAdminClient();
    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const course = url.searchParams.get("course");

    let query = admin.from("tests").select("*").eq("created_by", user.id).order("created_at", { ascending: false });
    if (status) query = query.eq("status", status);
    if (course) query = query.eq("course", course);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ tests: data });
  } catch (err: unknown) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
