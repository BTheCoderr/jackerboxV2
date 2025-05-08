import { redis } from './config/security';
import { loginSecurity } from './config/security';

// Track login attempt
export async function trackLoginAttempt(email: string, ip: string, success: boolean): Promise<void> {
  const key = `login:attempts:${email}:${ip}`;
  const now = Date.now();

  // Get current attempts
  const attempts = await redis.get(key);
  const attemptData = attempts ? JSON.parse(attempts) : { count: 0, firstAttempt: now };

  // Update attempt data
  attemptData.count++;
  if (!success) {
    attemptData.lastFailedAttempt = now;
  } else {
    // Reset on successful login
    await redis.del(key);
    return;
  }

  // Store updated attempt data
  await redis.set(
    key,
    JSON.stringify(attemptData),
    'EX',
    loginSecurity.lockoutDuration
  );
}

// Check if account is locked
export async function isAccountLocked(email: string, ip: string): Promise<boolean> {
  const key = `login:attempts:${email}:${ip}`;
  const attempts = await redis.get(key);

  if (!attempts) return false;

  const attemptData = JSON.parse(attempts);
  return attemptData.count >= loginSecurity.maxAttempts;
}

// Get remaining attempts
export async function getRemainingAttempts(email: string, ip: string): Promise<number> {
  const key = `login:attempts:${email}:${ip}`;
  const attempts = await redis.get(key);

  if (!attempts) return loginSecurity.maxAttempts;

  const attemptData = JSON.parse(attempts);
  return Math.max(0, loginSecurity.maxAttempts - attemptData.count);
}

// Get lockout time remaining
export async function getLockoutTimeRemaining(email: string, ip: string): Promise<number> {
  const key = `login:attempts:${email}:${ip}`;
  const attempts = await redis.get(key);

  if (!attempts) return 0;

  const attemptData = JSON.parse(attempts);
  if (attemptData.count < loginSecurity.maxAttempts) return 0;

  const timeSinceLastAttempt = Date.now() - attemptData.lastFailedAttempt;
  return Math.max(0, loginSecurity.lockoutDuration - timeSinceLastAttempt);
}

// Reset login attempts
export async function resetLoginAttempts(email: string, ip: string): Promise<void> {
  const key = `login:attempts:${email}:${ip}`;
  await redis.del(key);
}

// Get all locked accounts
export async function getLockedAccounts(): Promise<Array<{ email: string; ip: string; attempts: number; lockedUntil: number }>> {
  const keys = await redis.keys('login:attempts:*');
  const lockedAccounts = [];

  for (const key of keys) {
    const attempts = await redis.get(key);
    if (!attempts) continue;

    const attemptData = JSON.parse(attempts);
    if (attemptData.count >= loginSecurity.maxAttempts) {
      const [, email, ip] = key.split(':');
      lockedAccounts.push({
        email,
        ip,
        attempts: attemptData.count,
        lockedUntil: attemptData.lastFailedAttempt + loginSecurity.lockoutDuration,
      });
    }
  }

  return lockedAccounts;
}

// Login attempt middleware
export async function checkLoginAttempts(email: string, ip: string): Promise<{ allowed: boolean; message?: string }> {
  if (await isAccountLocked(email, ip)) {
    const timeRemaining = await getLockoutTimeRemaining(email, ip);
    return {
      allowed: false,
      message: `Account is locked. Please try again in ${Math.ceil(timeRemaining / 1000 / 60)} minutes.`,
    };
  }

  const remainingAttempts = await getRemainingAttempts(email, ip);
  if (remainingAttempts <= 2) {
    return {
      allowed: true,
      message: `Warning: ${remainingAttempts} login attempts remaining before account lockout.`,
    };
  }

  return { allowed: true };
}

// Clean up expired login attempts
export async function cleanupLoginAttempts(): Promise<void> {
  const keys = await redis.keys('login:attempts:*');
  
  for (const key of keys) {
    const attempts = await redis.get(key);
    if (!attempts) continue;

    const attemptData = JSON.parse(attempts);
    const timeSinceLastAttempt = Date.now() - attemptData.lastFailedAttempt;

    if (timeSinceLastAttempt > loginSecurity.lockoutDuration) {
      await redis.del(key);
    }
  }
} 