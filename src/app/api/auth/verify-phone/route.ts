import { NextResponse } from 'next/server';
import { z } from 'zod';
import { hash, compare } from 'bcryptjs';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/session';
import { generateVerificationCode, sendPhoneOwnershipCode } from '@/lib/phone-verification';

const phoneSchema = z.object({ phone: z.string().regex(/^\+[1-9]\d{7,14}$/, 'Use E.164 format such as +14015550100') });
const confirmSchema = phoneSchema.extend({ code: z.string().regex(/^\d{6}$/) });
const OTP_TTL_MS = 10 * 60 * 1000;
const SEND_COOLDOWN_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;

export async function POST(req: Request) {
  const current = await getCurrentUser();
  if (!current) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
    return NextResponse.json({ message: 'Phone verification is not configured' }, { status: 503 });
  }
  const parsed = phoneSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: 'Enter a valid international phone number' }, { status: 400 });
  const { phone } = parsed.data;
  try {
    const other = await db.user.findFirst({ where: { phone, id: { not: current.id } }, select: { id: true } });
    if (other) return NextResponse.json({ message: 'Phone number already registered' }, { status: 409 });
    const code = generateVerificationCode();
    const token = await hash(code, 10);
    const now = new Date();
    const issued = await db.user.updateMany({
      where: {
        id: current.id,
        OR: [
          { phoneVerificationSentAt: null },
          { phoneVerificationSentAt: { lte: new Date(now.getTime() - SEND_COOLDOWN_MS) } },
        ],
      },
      data: {
        phone,
        phoneVerified: false,
        verificationToken: token,
        phoneVerificationExpiresAt: new Date(now.getTime() + OTP_TTL_MS),
        phoneVerificationSentAt: now,
        phoneVerificationAttempts: 0,
      },
    });
    if (issued.count !== 1) return NextResponse.json({ message: 'Please wait before requesting another code' }, { status: 429 });
    const sent = await sendPhoneOwnershipCode(phone, code);
    if (!sent) {
      await db.user.updateMany({
        where: { id: current.id, verificationToken: token },
        data: { verificationToken: null, phoneVerificationExpiresAt: null },
      });
      return NextResponse.json({ message: 'Unable to send SMS. Try again later.' }, { status: 503 });
    }
    return NextResponse.json({ success: true, message: 'Verification code sent' });
  } catch (error) {
    console.error('Phone OTP issuance failed', error);
    return NextResponse.json({ message: 'Unable to start verification' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const current = await getCurrentUser();
  if (!current) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  const parsed = confirmSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: 'Invalid phone or code' }, { status: 400 });
  try {
    const user = await db.user.findUnique({
      where: { id: current.id },
      select: {
        phone: true,
        verificationToken: true,
        phoneVerificationExpiresAt: true,
        phoneVerificationAttempts: true,
      },
    });
    const now = new Date();
    if (!user || user.phone !== parsed.data.phone || !user.verificationToken ||
        !user.phoneVerificationExpiresAt || user.phoneVerificationExpiresAt <= now ||
        user.phoneVerificationAttempts >= MAX_ATTEMPTS) {
      return NextResponse.json({ message: 'Code expired or unavailable. Request a new code.' }, { status: 400 });
    }
    const valid = await compare(parsed.data.code, user.verificationToken);
    if (!valid) {
      await db.user.updateMany({
        where: { id: current.id, verificationToken: user.verificationToken, phoneVerificationAttempts: { lt: MAX_ATTEMPTS } },
        data: { phoneVerificationAttempts: { increment: 1 } },
      });
      return NextResponse.json({ message: 'Incorrect verification code' }, { status: 400 });
    }
    const confirmed = await db.user.updateMany({
      where: {
        id: current.id, phone: parsed.data.phone,
        verificationToken: user.verificationToken,
        phoneVerificationExpiresAt: { gt: now },
        phoneVerificationAttempts: { lt: MAX_ATTEMPTS },
      },
      data: {
        phoneVerified: true,
        verificationToken: null,
        phoneVerificationExpiresAt: null,
        phoneVerificationAttempts: 0,
      },
    });
    if (!confirmed.count) return NextResponse.json({ message: 'Code expired or already used' }, { status: 409 });
    return NextResponse.json({ success: true, message: 'Phone ownership verified' });
  } catch (error) {
    console.error('Phone OTP validation failed', error);
    return NextResponse.json({ message: 'Unable to verify code' }, { status: 500 });
  }
}
