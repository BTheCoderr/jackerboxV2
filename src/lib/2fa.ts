import { authenticator } from 'otplib';
import { redis } from './config/security';
import { twoFactorConfig } from './config/security';
import { randomBytes, createHash } from 'crypto';
import QRCode from 'qrcode';

// Configure TOTP
authenticator.options = {
  digits: twoFactorConfig.digits,
  step: twoFactorConfig.period,
  window: 1, // Allow 1 step before/after for clock drift
};

// Generate a new secret
export function generateSecret(): string {
  return authenticator.generateSecret();
}

// Generate QR code for 2FA setup
export async function generateQRCode(email: string): Promise<string> {
  const secret = generateSecret();
  const otpauth = authenticator.keyuri(
    email,
    twoFactorConfig.issuer,
    secret
  );

  // Store secret temporarily (24 hour expiry)
  await redis.set(
    `2fa:setup:${email}`,
    secret,
    'EX',
    24 * 60 * 60
  );

  // Generate QR code
  return QRCode.toDataURL(otpauth);
}

// Verify 2FA token
export async function verifyToken(email: string, token: string): Promise<boolean> {
  // Get user's 2FA secret
  const secret = await redis.get(`2fa:user:${email}`);
  if (!secret) return false;

  // Verify token
  return authenticator.verify({ token, secret });
}

// Enable 2FA for user
export async function enable2FA(email: string, token: string): Promise<boolean> {
  // Get temporary secret from setup
  const tempSecret = await redis.get(`2fa:setup:${email}`);
  if (!tempSecret) return false;

  // Verify token with temporary secret
  const isValid = authenticator.verify({ token, secret: tempSecret });
  if (!isValid) return false;

  // Store permanent secret
  await redis.set(`2fa:user:${email}`, tempSecret);

  // Clean up temporary secret
  await redis.del(`2fa:setup:${email}`);

  return true;
}

// Disable 2FA for user
export async function disable2FA(email: string, token: string): Promise<boolean> {
  // Verify token before disabling
  const isValid = await verifyToken(email, token);
  if (!isValid) return false;

  // Remove 2FA secret
  await redis.del(`2fa:user:${email}`);
  return true;
}

// Check if 2FA is enabled for user
export async function is2FAEnabled(email: string): Promise<boolean> {
  const secret = await redis.get(`2fa:user:${email}`);
  return !!secret;
}

// Generate backup codes
export async function generateBackupCodes(email: string): Promise<string[]> {
  const codes = Array.from({ length: 10 }, () =>
    randomBytes(4).toString('hex').toUpperCase()
  );

  // Store hashed backup codes
  const hashedCodes = codes.map((code) => {
    const hash = createHash('sha256').update(code).digest('hex');
    return hash;
  });

  await redis.set(
    `2fa:backup:${email}`,
    JSON.stringify(hashedCodes),
    'EX',
    365 * 24 * 60 * 60 // 1 year expiry
  );

  return codes;
}

// Verify backup code
export async function verifyBackupCode(email: string, code: string): Promise<boolean> {
  const storedCodes = await redis.get(`2fa:backup:${email}`);
  if (!storedCodes) return false;

  const hashedCodes: string[] = JSON.parse(storedCodes);
  const hash = createHash('sha256').update(code).digest('hex');

  // Check if code exists
  const index = hashedCodes.indexOf(hash);
  if (index === -1) return false;

  // Remove used code
  hashedCodes.splice(index, 1);
  await redis.set(
    `2fa:backup:${email}`,
    JSON.stringify(hashedCodes),
    'EX',
    365 * 24 * 60 * 60
  );

  return true;
}

// Get remaining backup codes
export async function getRemainingBackupCodes(email: string): Promise<number> {
  const storedCodes = await redis.get(`2fa:backup:${email}`);
  if (!storedCodes) return 0;

  const hashedCodes: string[] = JSON.parse(storedCodes);
  return hashedCodes.length;
}

// 2FA middleware
export async function require2FA(request: Request): Promise<Response | null> {
  const email = request.headers.get('x-user-email');
  if (!email) return null;

  const isEnabled = await is2FAEnabled(email);
  if (!isEnabled) return null;

  const token = request.headers.get('x-2fa-token');
  if (!token) {
    return new Response(
      JSON.stringify({ error: '2FA token required' }),
      { status: 401 }
    );
  }

  const isValid = await verifyToken(email, token);
  if (!isValid) {
    return new Response(
      JSON.stringify({ error: 'Invalid 2FA token' }),
      { status: 401 }
    );
  }

  return null;
} 