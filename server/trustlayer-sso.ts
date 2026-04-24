import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { db } from './db';
import { chatUsers } from '@shared/schema';
import { eq } from 'drizzle-orm';

const BCRYPT_ROUNDS = 12;
const JWT_EXPIRY = '7d';
const JWT_ISSUER = 'trust-layer-sso';

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET environment variable is required for SSO');
  return secret;
}

export function generateTrustLayerId(): string {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(4).toString('hex').slice(0, 8);
  return `tl-${timestamp}-${random}`;
}

function generateAvatarColor(): string {
  const colors = [
    '#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b',
    '#10b981', '#3b82f6', '#ef4444', '#14b8a6',
    '#a855f7', '#f97316', '#6366f1', '#84cc16',
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

export const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password || password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one uppercase letter' };
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one special character' };
  }
  return { valid: true };
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(userId: string, trustLayerId: string): string {
  return jwt.sign(
    { userId, trustLayerId, iss: JWT_ISSUER },
    getJwtSecret(),
    { expiresIn: JWT_EXPIRY }
  );
}

export function verifyToken(token: string): { userId: string; trustLayerId: string } | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as any;
    if (decoded.iss !== JWT_ISSUER) return null;
    return { userId: decoded.userId, trustLayerId: decoded.trustLayerId };
  } catch {
    return null;
  }
}

export async function registerUser(data: {
  username: string;
  email: string;
  password: string;
  displayName: string;
}) {
  const passwordCheck = validatePassword(data.password);
  if (!passwordCheck.valid) {
    throw new Error(passwordCheck.error);
  }

  const normalizedEmail = data.email.toLowerCase().trim();
  const normalizedUsername = data.username.toLowerCase().trim();

  const existing = await db.select().from(chatUsers)
    .where(eq(chatUsers.email, normalizedEmail))
    .limit(1);
  if (existing.length > 0) {
    throw new Error('Email already registered');
  }

  const existingUsername = await db.select().from(chatUsers)
    .where(eq(chatUsers.username, normalizedUsername))
    .limit(1);
  if (existingUsername.length > 0) {
    throw new Error('Username already taken');
  }

  const passwordHash = await hashPassword(data.password);
  const trustLayerId = generateTrustLayerId();
  const avatarColor = generateAvatarColor();

  const [user] = await db.insert(chatUsers).values({
    username: normalizedUsername,
    email: normalizedEmail,
    passwordHash,
    displayName: data.displayName,
    avatarColor,
    trustLayerId,
    role: 'member',
  }).returning();

  const token = generateToken(user.id, trustLayerId);

  return {
    user: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      email: user.email,
      avatarColor: user.avatarColor,
      role: user.role,
      trustLayerId: user.trustLayerId,
    },
    token,
  };
}

export async function loginUser(data: { username: string; password: string }) {
  const normalizedUsername = data.username.toLowerCase().trim();

  const [user] = await db.select().from(chatUsers)
    .where(eq(chatUsers.username, normalizedUsername))
    .limit(1);

  if (!user) {
    throw new Error('Invalid username or password');
  }

  const passwordValid = await verifyPassword(data.password, user.passwordHash);
  if (!passwordValid) {
    throw new Error('Invalid username or password');
  }

  const token = generateToken(user.id, user.trustLayerId!);

  return {
    user: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      email: user.email,
      avatarColor: user.avatarColor,
      role: user.role,
      trustLayerId: user.trustLayerId,
    },
    token,
  };
}

export async function getUserFromToken(token: string) {
  const decoded = verifyToken(token);
  if (!decoded) return null;

  const [user] = await db.select().from(chatUsers)
    .where(eq(chatUsers.id, decoded.userId))
    .limit(1);

  if (!user) return null;

  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    email: user.email,
    avatarColor: user.avatarColor,
    role: user.role,
    trustLayerId: user.trustLayerId,
  };
}
