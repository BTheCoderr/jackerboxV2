import { redis } from './config/security';
import { sessionConfig } from './config/security';
import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

// Session interface
interface Session {
  userId: string;
  createdAt: number;
  lastActivity: number;
  deviceInfo: string;
  ipAddress: string;
}

// Generate a new session ID
function generateSessionId(): string {
  return randomBytes(32).toString('hex');
}

// Create a new session
export async function createSession(
  userId: string,
  deviceInfo: string,
  ipAddress: string
): Promise<string> {
  const sessionId = generateSessionId();
  const now = Date.now();

  const session: Session = {
    userId,
    createdAt: now,
    lastActivity: now,
    deviceInfo,
    ipAddress,
  };

  // Store session in Redis
  await redis.set(`session:${sessionId}`, JSON.stringify(session), {
    ex: sessionConfig.maxAge
  });

  // Add session to user's active sessions
  await redis.sadd(`user:${userId}:sessions`, sessionId);

  return sessionId;
}

// Get session data
export async function getSession(sessionId: string): Promise<Session | null> {
  const sessionData = await redis.get<string>(`session:${sessionId}`);
  if (!sessionData) return null;
  return JSON.parse(sessionData);
}

// Update session activity
export async function updateSessionActivity(sessionId: string): Promise<void> {
  const session = await getSession(sessionId);
  if (!session) return;

  session.lastActivity = Date.now();
  await redis.set(`session:${sessionId}`, JSON.stringify(session), {
    ex: sessionConfig.maxAge
  });
}

// Delete session
export async function deleteSession(sessionId: string): Promise<void> {
  const session = await getSession(sessionId);
  if (!session) return;

  // Remove session from Redis
  await redis.del(`session:${sessionId}`);

  // Remove session from user's active sessions
  await redis.srem(`user:${session.userId}:sessions`, sessionId);
}

// Delete all user sessions
export async function deleteAllUserSessions(userId: string): Promise<void> {
  const sessions = await redis.smembers<string[]>(`user:${userId}:sessions`);
  
  // Delete each session
  await Promise.all(
    sessions.map(async (sessionId) => {
      await redis.del(`session:${sessionId}`);
    })
  );

  // Delete the sessions set
  await redis.del(`user:${userId}:sessions`);
}

// Check if session is expired
export function isSessionExpired(session: Session): boolean {
  const now = Date.now();
  const inactiveTime = now - session.lastActivity;
  return inactiveTime > sessionConfig.maxAge * 1000;
}

// Session middleware
export async function sessionMiddleware(request: Request) {
  const sessionId = request.headers.get('x-session-id');
  if (!sessionId) {
    return NextResponse.json(
      { error: 'Session ID required' },
      { status: 401 }
    );
  }

  const session = await getSession(sessionId);
  if (!session) {
    return NextResponse.json(
      { error: 'Invalid session' },
      { status: 401 }
    );
  }

  if (isSessionExpired(session)) {
    await deleteSession(sessionId);
    return NextResponse.json(
      { error: 'Session expired' },
      { status: 401 }
    );
  }

  // Update session activity
  await updateSessionActivity(sessionId);

  // Add session info to request headers
  const response = NextResponse.next();
  response.headers.set('x-user-id', session.userId);
  return response;
}

// Get active sessions for a user
export async function getUserSessions(userId: string): Promise<Session[]> {
  const sessionIds = await redis.smembers<string[]>(`user:${userId}:sessions`);
  const sessions = await Promise.all(
    sessionIds.map(async (sessionId) => {
      const session = await getSession(sessionId);
      return session;
    })
  );
  return sessions.filter((session): session is Session => session !== null);
}

// Clean up expired sessions
export async function cleanupExpiredSessions(): Promise<void> {
  const keys = await redis.keys('session:*');
  
  for (const key of keys) {
    const sessionData = await redis.get<string>(key);
    if (!sessionData) continue;

    const session: Session = JSON.parse(sessionData);
    if (isSessionExpired(session)) {
      const sessionId = key.replace('session:', '');
      await deleteSession(sessionId);
    }
  }
} 