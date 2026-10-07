import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { randomBytes } from "crypto";

export async function GET(req: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { error: "Google Client ID is not configured in .env" },
      { status: 500 }
    );
  }

  const url = new URL(req.url);
  const h = headers();
  const host = h.get("x-forwarded-host") || h.get("host") || url.host;
  const proto = h.get("x-forwarded-proto") || (host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https");
  
  let origin = `${proto}://${host}`;
  if (host.startsWith("localhost") || host.startsWith("127.0.0.1")) {
    origin = `http://${host.includes(":") ? host : "localhost:3000"}`;
    // Always standardize to localhost:3000 if port 3000 is used
    if (host.includes("3000")) origin = "http://localhost:3000";
  } else if (process.env.NEXT_PUBLIC_APP_URL) {
    origin = process.env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, "");
  }
  
  const redirectUri = `${origin}/api/auth/google/callback`;
  console.log("[Google OAuth] Sending redirect_uri:", redirectUri);

  const state = randomBytes(16).toString("hex");
  cookies().set("google_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10, // 10 minutes
  });

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "offline",
    prompt: "select_account",
  });

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  return NextResponse.redirect(googleAuthUrl);
}
