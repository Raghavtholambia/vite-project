import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// POST /api/auth/profile — upsert profile after sign-up
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = createAdminClient();
    const body = await req.json();

    const { data, error } = await admin.from("profiles").upsert({
      id: user.id,
      email: user.email!,
      full_name: body.full_name ?? null,
      role: body.role ?? "student",
      school: body.school ?? null,
      course: body.course ?? null,
      class_year: body.class_year ?? null,
    }, { onConflict: "id" }).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ profile: data });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// GET /api/auth/profile — fetch own profile
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = createAdminClient();
    const { data, error } = await admin.from("profiles").select("*").eq("id", user.id).single();
    if (error) return NextResponse.json({ error: error.message }, { status: 404 });
    return NextResponse.json({ profile: data });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
