import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createHash, randomBytes } from "crypto";
import { ObjectId } from "mongodb";
import { db } from "./db";

const COOKIE = "session";
const sha = (s: string) => createHash("sha256").update(s).digest("hex");

// Permanent session: 10 years (persists permanently until explicit logout)
const PERMANENT_SESSION_DAYS = 3650;
const PERMANENT_SESSION_MS = PERMANENT_SESSION_DAYS * 864e5;
const PERMANENT_SESSION_SECONDS = PERMANENT_SESSION_DAYS * 24 * 60 * 60;

export async function createSession(userId: ObjectId) {
  const token = randomBytes(32).toString("hex");
  const d = await db();
  await d.collection("sessions").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  const expiresAt = new Date(Date.now() + PERMANENT_SESSION_MS);
  await d.collection("sessions").insertOne({ userId, tokenHash: sha(token), expiresAt, createdAt: new Date() });
  cookies().set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
    maxAge: PERMANENT_SESSION_SECONDS,
  });
}

export async function destroySession() {
  const t = cookies().get(COOKIE)?.value;
  if (t) await (await db()).collection("sessions").deleteOne({ tokenHash: sha(t) });
  cookies().delete(COOKIE);
}

export async function getUser() {
  const t = cookies().get(COOKIE)?.value;
  if (!t) return null;
  const d = await db();
  const s = await d.collection("sessions").findOne({ tokenHash: sha(t), expiresAt: { $gt: new Date() } });
  if (!s) return null;
  return d.collection("users").findOne({ _id: s.userId });
}

export async function requireUser() {
  const u = await getUser();
  if (!u) redirect("/login");
  return u;
}

// Basic CSRF guard for mutating API calls: custom header + same-origin.
export function sameOriginOk() {
  const h = headers();
  const origin = h.get("origin");
  const host = h.get("host");
  if (h.get("x-requested-with") !== "fetch") return false;
  if (origin && host && new URL(origin).host !== host) return false;
  return true;
}
