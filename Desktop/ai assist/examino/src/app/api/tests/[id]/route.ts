import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// GET /api/tests/[id] — fetch test metadata
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
    const { data: test, error } = await admin.from("tests").select("*").eq("id", id).single();
    if (error || !test) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
    const isTeacher = ["teacher", "admin"].includes(profile?.role ?? "");

    // Hide OTP and generated_json answers from students
    const safe = isTeacher
      ? test
      : { ...test, teacher_otp: undefined, generated_json: undefined };

    return NextResponse.json({ test: safe });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// PATCH /api/tests/[id] — update test status or metadata
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = createAdminClient();
    const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
    if (!["teacher", "admin"].includes(profile?.role ?? "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const allowed = ["status", "scheduled_unix", "duration_minutes"];
    const updates: Record<string, unknown> = {};
    for (const k of allowed) if (body[k] !== undefined) updates[k] = body[k];

    const { data, error } = await admin.from("tests").update(updates).eq("id", id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ test: data });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
