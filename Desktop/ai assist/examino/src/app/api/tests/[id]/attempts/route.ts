import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// GET /api/tests/[id]/attempts — teacher views all attempts; student views own
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
    const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).single();
    const isTeacher = ["teacher", "admin"].includes(profile?.role ?? "");

    let query = admin.from("attempts").select("*").eq("test_id", id);
    if (!isTeacher) query = query.eq("user_id", user.id);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ attempts: data });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
