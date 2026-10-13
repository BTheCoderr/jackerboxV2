import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { Prisma } from "@/lib/prisma-client";
import { db } from "@/lib/db";
import { redis } from "@/lib/redis";
import { Ratelimit } from "@upstash/ratelimit";
import { createHash } from "node:crypto";

export const dynamic = "force-dynamic";

// Limits are shared across serverless instances, not process-local memory.
const signupsPerAddress = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(8, "1 h"),
  prefix: "jackerbox:signup:ip",
}) : null;
const signupsPerEmail = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, "1 h"),
  prefix: "jackerbox:signup:email",
}) : null;

function registrationClientIp(req: Request): string {
  // Netlify populates this header at its edge. Do not trust arbitrary
  // user-provided forwarded-for chains as the sole rate-limit identity.
  const ip = req.headers.get("x-nf-client-connection-ip");
  return ip && ip.length <= 64 ? ip : "unidentified-client";
}

async function guardSignup(req: Request, email: string): Promise<Response | null> {
  if (!signupsPerAddress || !signupsPerEmail) {
    return NextResponse.json(
      { message: "Registration is temporarily unavailable. Please try again later." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
  try {
    const emailKey = createHash("sha256").update(email).digest("hex");
    const [ipLimit, emailLimit] = await Promise.all([
      signupsPerAddress.limit(registrationClientIp(req)),
      signupsPerEmail.limit(emailKey),
    ]);
    if (ipLimit.success && emailLimit.success) return null;

    const reset = Math.max(ipLimit.success ? 0 : ipLimit.reset, emailLimit.success ? 0 : emailLimit.reset);
    const retryAfterSeconds = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
    return NextResponse.json(
      { message: "Too many registration attempts. Please wait before trying again." },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds), "Cache-Control": "no-store" } },
    );
  } catch {
    // A missing or unreachable shared limiter is not permission for unlimited signups.
    return NextResponse.json(
      { message: "Registration is temporarily unavailable. Please try again later." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}

const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().trim().toLowerCase().email("Please enter a valid email address").max(254),
  phone: z.preprocess(
    (value) => typeof value === "string" && value.trim() === "" ? undefined : value,
    z.string().trim().min(10, "Please enter a valid phone number").max(32).optional(),
  ),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
  userType: z.enum(["renter", "owner", "both"]).default("both"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid registration information", errors: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { name, email, phone, password, userType } = parsed.data;
    const denied = await guardSignup(req, email);
    if (denied) return denied;

    // Duplicate checks improve UX; the unique DB indexes remain authoritative.
    const existingUser = await db.user.findUnique({ where: { email }, select: { id: true } });
    if (existingUser) {
      return NextResponse.json({ message: "User with this email already exists" }, { status: 409 });
    }

    if (phone) {
      const existingPhone = await db.user.findUnique({ where: { phone }, select: { id: true } });
      if (existingPhone) {
        return NextResponse.json({ message: "User with this phone number already exists" }, { status: 409 });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await db.user.create({
      data: { name, email, phone, password: hashedPassword, userType },
      select: { id: true, name: true, email: true, userType: true },
    });

    // Never serialize password hashes, recovery tokens, roles or verification fields.
    return NextResponse.json({ user, message: "User created successfully" }, { status: 201 });
  } catch (error) {
    // Handle a concurrent registration hitting a unique constraint.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ message: "An account with these details already exists" }, { status: 409 });
    }
    console.error("Registration failed", error instanceof Error ? error.name : "UnknownError");
    return NextResponse.json({ message: "Unable to create your account right now. Please try again." }, { status: 500 });
  }
}
