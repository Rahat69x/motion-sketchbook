import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { findUserById, findUserByEmail, createUser } from "./db";
import { User, UserPublicProfile } from "./types";

const JWT_SECRET = process.env.JWT_SECRET || "resumeforge-super-secure-production-jwt-token-key-2026";
export const COOKIE_NAME = "rf_session_token";

interface TokenPayload {
  userId: string;
  email: string;
}

export function hashPassword(password: string): string {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(password, salt);
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function signSessionToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifySessionToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export function toPublicProfile(user: User): UserPublicProfile {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    university: user.university || "University Student",
    degree: user.degree || "Undergraduate Candidate",
    graduationYear: user.graduationYear || 2026,
    targetRole: user.targetRole || "Software Engineer",
  };
}

/**
 * Server-side helper to get the currently authenticated user from cookies.
 */
export async function getSessionUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = verifySessionToken(token);
  if (!payload || !payload.userId) return null;

  const user = findUserById(payload.userId);
  return user || null;
}

/**
 * Enforces authentication on server actions and API routes.
 */
export async function requireAuthUser(): Promise<User> {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("Unauthorized. Please log in to continue.");
  }
  return user;
}
