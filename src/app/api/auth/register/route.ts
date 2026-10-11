import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { Prisma } from "@/lib/prisma-client";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

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
