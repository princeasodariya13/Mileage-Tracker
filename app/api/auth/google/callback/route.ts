import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { db } from "@/lib/db";
import { createSession } from "@/lib/auth";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const h = headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
  const proto = h.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : `${proto}://${host}`)).replace(/\/+$/, "");
  const redirectUri = `${baseUrl}/api/auth/google/callback`;

  if (error || !code) {
    return NextResponse.redirect(`${baseUrl}/login?error=Google+sign+in+cancelled`);
  }

  const savedState = cookies().get("google_oauth_state")?.value;
  cookies().delete("google_oauth_state");

  if (!state || state !== savedState) {
    return NextResponse.redirect(`${baseUrl}/login?error=Invalid+OAuth+state`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${baseUrl}/login?error=Missing+Google+OAuth+credentials+in+.env`);
  }

  try {
    // Exchange authorization code for access token
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokens = await tokenRes.json();
    if (!tokenRes.ok || !tokens.access_token) {
      console.error("Google token exchange error:", tokens);
      return NextResponse.redirect(`${baseUrl}/login?error=Failed+to+exchange+Google+token`);
    }

    // Fetch user profile from Google
    const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    const googleUser = await userRes.json();
    if (!userRes.ok || !googleUser.email) {
      console.error("Google user profile error:", googleUser);
      return NextResponse.redirect(`${baseUrl}/login?error=Failed+to+fetch+Google+profile`);
    }

    const email = googleUser.email.toLowerCase().trim();
    const name = googleUser.name || googleUser.given_name || email.split("@")[0];
    const avatar = googleUser.picture || null;
    const googleId = googleUser.id;

    const d = await db();
    const users = d.collection("users");

    let user = await users.findOne({ email });

    if (!user) {
      // Create new user with Google account
      const result = await users.insertOne({
        name,
        email,
        avatar,
        googleId,
        address: "",
        createdAt: new Date(),
      });
      user = { _id: result.insertedId };
    } else {
      // Link Google ID and update avatar if not present
      await users.updateOne(
        { _id: user._id },
        {
          $set: {
            googleId: googleId || user.googleId,
            avatar: avatar || user.avatar,
            name: user.name || name,
          },
        }
      );
    }

    await createSession(user._id);
    return NextResponse.redirect(`${baseUrl}/app`);
  } catch (err: any) {
    console.error("Google OAuth error:", err);
    return NextResponse.redirect(`${baseUrl}/login?error=Google+authentication+failed`);
  }
}
