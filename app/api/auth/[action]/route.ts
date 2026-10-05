import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createSession, destroySession, sameOriginOk } from "@/lib/auth";

export async function POST(req: Request, { params }: { params: { action: string } }) {
  if (!sameOriginOk()) return NextResponse.json({ error: "Bad request origin." }, { status: 403 });

  if (params.action === "logout") {
    await destroySession();
    return NextResponse.json({ ok: true });
  }

  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const address = typeof body?.address === "string" ? body.address.trim() : "";
  const confirmPassword = typeof body?.confirmPassword === "string" ? body.confirmPassword : "";

  const users = (await db()).collection("users");

  if (params.action === "signup") {
    if (!name || name.length < 2 || name.length > 100) {
      return NextResponse.json({ error: "Please enter your full name (at least 2 characters)." }, { status: 422 });
    }
    if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 254) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 422 });
    }
    if (password.length < 8 || password.length > 128) {
      return NextResponse.json({ error: "Password must be at least 8 characters long." }, { status: 422 });
    }
    if (confirmPassword && password !== confirmPassword) {
      return NextResponse.json({ error: "Passwords do not match." }, { status: 422 });
    }

    await users.createIndex({ email: 1 }, { unique: true });
    try {
      const r = await users.insertOne({
        name,
        address: address || "",
        email,
        passwordHash: await bcrypt.hash(password, 12),
        createdAt: new Date(),
      });
      await createSession(r.insertedId);
      return NextResponse.json({ ok: true });
    } catch {
      return NextResponse.json({ error: "That email is already registered." }, { status: 409 });
    }
  }

  if (params.action === "login") {
    const u = await users.findOne({ email });
    if (!u || !(await bcrypt.compare(password, u.passwordHash)))
      return NextResponse.json({ error: "Email or password is incorrect." }, { status: 401 });
    await createSession(u._id);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
