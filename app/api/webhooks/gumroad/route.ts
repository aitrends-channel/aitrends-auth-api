import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Gumroad sends application/x-www-form-urlencoded POST requests.
// Secure the endpoint by appending ?secret=<GUMROAD_WEBHOOK_SECRET> to the URL
// in your Gumroad product dashboard.
export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");
  if (!secret || secret !== process.env.GUMROAD_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.text();
  const params = new URLSearchParams(body);

  const email = (params.get("email") ?? "").trim().toLowerCase();
  const saleId = params.get("sale_id") ?? "";
  const saleTimestamp = params.get("sale_timestamp") ?? new Date().toISOString();
  const licenseKey = params.get("license_key") ?? "";
  const isTest = params.get("test") === "true";
  const refunded = params.get("refunded") === "true";

  if (!email) return NextResponse.json({ error: "No email in payload" }, { status: 400 });
  if (isTest && process.env.NODE_ENV === "production") {
    return NextResponse.json({ skipped: "test_purchase" });
  }
  if (refunded) return NextResponse.json({ skipped: "refunded" });

  const paidMeta = {
    paid: true,
    paid_at: saleTimestamp,
    sale_id: saleId,
    license_key: licenseKey,
  };

  const appUrl = process.env.DESKTOP_APP_URL ?? new URL(request.url).origin;

  // Invite creates the Supabase user + sends the password-setup email
  const { data: invite, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${appUrl}/set-password`,
  });

  if (invite?.user) {
    await supabase.auth.admin.updateUserById(invite.user.id, { app_metadata: paidMeta });
  } else if (inviteError) {
    // User already exists — find them and update paid status (repeat purchase or re-invite)
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const existing = users.find((u) => u.email?.toLowerCase() === email);
    if (existing) {
      await supabase.auth.admin.updateUserById(existing.id, { app_metadata: paidMeta });
    } else {
      console.error("[gumroad] invite error:", inviteError.message);
      return NextResponse.json({ error: inviteError.message }, { status: 500 });
    }
  }

  // Keep allowed_emails in sync so the desktop app's fallback check still works
  await supabase.from("allowed_emails").upsert({ email });

  return NextResponse.json({ success: true });
}
