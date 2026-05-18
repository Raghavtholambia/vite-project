import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// GET /api/tests/[id]/questions — fetch questions for an unlocked test
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = createAdminClient();
    const { data: test } = await admin.from("tests").select("*").eq("id", id).single();
    if (!test) return NextResponse.json({ error: "Test not found" }, { status: 404 });

    if (!["unlocked", "published"].includes(test.status)) {
      const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
      const isTeacher = profile?.role === "teacher" || profile?.role === "admin";
      if (!isTeacher || test.created_by !== user.id) {
        return NextResponse.json({ error: "Test is not yet unlocked" }, { status: 403 });
      }
    }

    // Strip correct_answer and explanation for students
    const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
    const isTeacher = profile?.role === "teacher" || profile?.role === "admin";

    const { data: questions } = await admin
      .from("questions")
      .select("*")
      .eq("test_id", id)
      .order("created_at");

    const sanitized = isTeacher
      ? questions
      : questions?.map(({ correct_answer, explanation, ...q }) => q);

    return NextResponse.json({
      test_id: id,
      duration_minutes: test.duration_minutes,
      subject: test.subject,
      chapter: test.chapter,
      course: test.course,
      allow_negative_marking: test.allow_negative_marking,
      scoring_scheme: test.scoring_scheme,
      integrity_hash: test.deterministic_hash,
      questions: sanitized,
    });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
