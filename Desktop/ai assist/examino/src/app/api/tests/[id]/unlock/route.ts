import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { randomInt } from "crypto";

// POST /api/tests/[id]/unlock  — teacher provides OTP to unlock test
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
    const body = await req.json() as { otp?: string; action?: "generate" | "verify" };

    const { data: test } = await admin.from("tests").select("*").eq("id", id).single();
    if (!test) return NextResponse.json({ error: "Test not found" }, { status: 404 });

    // Teacher generates OTP
    if (body.action === "generate") {
      const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
      if (!profile || !["teacher", "admin"].includes(profile.role)) {
        return NextResponse.json({ error: "Only teachers can generate OTP" }, { status: 403 });
      }
      if (test.created_by !== user.id && profile.role !== "admin") {
        return NextResponse.json({ error: "Not your test" }, { status: 403 });
      }
      const otp = String(randomInt(100000, 999999));
      const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await admin.from("tests").update({
        teacher_otp: otp,
        otp_expires_at: expires.toISOString(),
        status: "published",
      }).eq("id", id);
      return NextResponse.json({ otp, expires_at: expires.toISOString(), message: "Share this OTP with students to start the test." });
    }

    // Student verifies OTP to start
    if (body.action === "verify" || body.otp) {
      if (!body.otp) return NextResponse.json({ error: "OTP required" }, { status: 400 });
      if (test.status === "closed") return NextResponse.json({ error: "Test is closed" }, { status: 410 });
      if (test.teacher_otp !== body.otp) return NextResponse.json({ error: "Invalid OTP" }, { status: 401 });
      if (test.otp_expires_at && new Date(test.otp_expires_at) < new Date()) {
        return NextResponse.json({ error: "OTP expired" }, { status: 401 });
      }
      // Mark as unlocked
      await admin.from("tests").update({ status: "unlocked" }).eq("id", id);
      return NextResponse.json({ unlocked: true, test_id: id, message: "Test unlocked. You may now start." });
    }

    return NextResponse.json({ error: "Specify action: generate or verify" }, { status: 400 });
  } catch (err: unknown) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
