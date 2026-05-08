import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

//Public signup endpoint for users to create an account and receive a password setup link.
export async function POST(request: Request) {
  const body = await request.json();
  const email = (body.email ?? "").trim().toLowerCase();
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  const appUrl = process.env.APP_URL ?? new URL(request.url).origin;

  const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${appUrl}/set-password`,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  if (data?.user) {
    await supabase.auth.admin.updateUserById(data.user.id, {
      app_metadata: { paid: false, signed_up_at: new Date().toISOString() },
    });
    await supabase.from("allowed_emails").upsert({ email });
  }

  return NextResponse.json({ success: true });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
