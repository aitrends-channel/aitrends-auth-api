import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  const body = await request.json();

  console.log("SUPABASE_URL:", process.env.SUPABASE_URL);
console.log("SERVICE_ROLE_KEY exists:", !!process.env.SUPABASE_SERVICE_ROLE_KEY);

  const email = (body.email ?? "").trim().toLowerCase();
  const firstName = body.first_name?.trim();
  const lastName = body.last_name?.trim();

  if (!email) {
    return NextResponse.json(
      { error: "Email is required" },
      { status: 400 }
    );
  }

  const appUrl =
    process.env.APP_URL ?? new URL(request.url).origin;

  const { data, error } =
    await supabase.auth.admin.inviteUserByEmail(email, {
      data: {
        first_name: firstName,
        last_name: lastName,
        full_name: `${firstName ?? ""} ${lastName ?? ""}`.trim(),
      },
      redirectTo: `${appUrl}/set-passpassword`,
    });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }

 
  return NextResponse.json({
    success: true,
    message: "Signup email sent",
  });
}