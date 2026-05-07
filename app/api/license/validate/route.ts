import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Validates a Gumroad license key against both Gumroad's API and our own
// paid user records. The desktop app can call this to verify a key directly.
export async function POST(request: Request) {
  const body = await request.json();
  const licenseKey = (body.license_key ?? "").trim();
  if (!licenseKey) return NextResponse.json({ error: "License key required" }, { status: 400 });

  // Check our own records first (faster, no external call)
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const localMatch = users.find(
    (u) => u.app_metadata?.license_key === licenseKey && u.app_metadata?.paid === true
  );
  if (localMatch) {
    return NextResponse.json({
      valid: true,
      email: localMatch.email,
      source: "local",
    });
  }

  // Fall back to Gumroad's license verification API
  if (!process.env.GUMROAD_PRODUCT_ID) {
    return NextResponse.json({ valid: false, error: "License not found" });
  }

  const gumRes = await fetch("https://api.gumroad.com/v2/licenses/verify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      product_id: process.env.GUMROAD_PRODUCT_ID,
      license_key: licenseKey,
    }),
  });

  const gum = await gumRes.json();
  if (!gum.success) {
    return NextResponse.json({ valid: false, error: gum.message ?? "Invalid license" });
  }

  const purchase = gum.purchase ?? {};
  return NextResponse.json({
    valid: true,
    email: purchase.email ?? null,
    refunded: purchase.refunded ?? false,
    disputed: purchase.disputed ?? false,
    created_at: purchase.created_at ?? null,
    source: "gumroad",
  });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
