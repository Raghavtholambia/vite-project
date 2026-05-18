import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { gradeAttempt } from "@/lib/grading";
import type { SubmitAnswersPayload } from "@/lib/types";

// POST /api/tests/[id]/submit
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = createAdminClient();
    const body = (await req.json()) as SubmitAnswersPayload;

    const { data: test } = await admin.from("tests").select("*").eq("id", id).single();
    if (!test) return NextResponse.json({ error: "Test not found" }, { status: 404 });
    if (!["unlocked", "published"].includes(test.status)) {
      return NextResponse.json({ error: "Test is not active" }, { status: 403 });
    }

    const { data: questions } = await admin.from("questions").select("*").eq("test_id", id);
    const { data: profile } = await admin.from("profiles").select("rating").eq("id", user.id).single();

    const result = gradeAttempt(
      {
        answers: body.answers,
        time_per_question: body.time_per_question ?? {},
        focus_loss_count: body.focus_loss_count ?? 0,
      },
      questions ?? [],
      test.grading_rules,
      profile?.rating ?? 1000,
      test.analytics_template?.k_factor ?? 10
    );

    // Upsert attempt (one attempt per user per test)
    const { data: existing } = await admin
      .from("attempts")
      .select("id")
      .eq("test_id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    const attemptData = {
      test_id: id,
      user_id: user.id,
      answers: body.answers,
      score: result.score,
      max_score: result.max_score,
      focus_loss_count: body.focus_loss_count ?? 0,
      suspicious_score: result.suspicious_score,
      time_per_question: body.time_per_question ?? {},
      submitted_at: new Date().toISOString(),
      status: "graded",
      rating_delta: result.rating_delta,
      analytics: result.analytics,
    };

    if (existing) {
      await admin.from("attempts").update(attemptData).eq("id", existing.id);
    } else {
      await admin.from("attempts").insert(attemptData);
    }

    // Update user rating
    const newRating = Math.max(100, (profile?.rating ?? 1000) + result.rating_delta);
    await admin.from("profiles").update({ rating: newRating }).eq("id", user.id);

    return NextResponse.json({
      score: result.score,
      max_score: result.max_score,
      percentage: result.max_score > 0 ? Math.round((result.score / result.max_score) * 100) : 0,
      rating_delta: result.rating_delta,
      new_rating: newRating,
      suspicious_score: result.suspicious_score,
      per_question: result.per_question,
      analytics: result.analytics,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
