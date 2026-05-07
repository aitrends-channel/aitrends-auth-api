import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Admin-only endpoint for manually inviting a user (comps, support, etc.).
// Requires the X-Admin-Secret header matching ADMIN_SECRET in .env.
export async function POST(request: Request) {
  const adminSecret = request.headers.get("x-admin-secret");
  if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const email = (body.email ?? "").trim().toLowerCase();
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  const appUrl = process.env.DESKTOP_APP_URL ?? new URL(request.url).origin;

  const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${appUrl}/set-password`,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  if (data?.user) {
    await supabase.auth.admin.updateUserById(data.user.id, {
      app_metadata: { paid: true, invited_manually: true, invited_at: new Date().toISOString() },
    });
    await supabase.from("allowed_emails").upsert({ email });
  }

  return NextResponse.json({ success: true });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
