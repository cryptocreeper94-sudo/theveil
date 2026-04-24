import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  type VerifiedRegistrationResponse,
  type VerifiedAuthenticationResponse,
} from "@simplewebauthn/server";
import { db } from "./db";
import { passkeys, users } from "@shared/models/auth";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";

const siteUrl = process.env.SITE_BASE_URL || 'https://trust-layer-1pji.onrender.com';
const rpID = new URL(siteUrl).hostname;
const origin = siteUrl;

interface StoredChallenge {
  challenge: string;
  expiresAt: number;
}

const challengeStore = new Map<string, StoredChallenge>();

function setChallenge(userId: string, challenge: string): void {
  challengeStore.set(userId, {
    challenge,
    expiresAt: Date.now() + 5 * 60 * 1000,
  });
}

function getChallenge(userId: string): string | null {
  const stored = challengeStore.get(userId);
  if (!stored) return null;
  if (Date.now() > stored.expiresAt) {
    challengeStore.delete(userId);
    return null;
  }
  return stored.challenge;
}

function clearChallenge(userId: string): void {
  challengeStore.delete(userId);
}

export async function getUserPasskeys(userId: string) {
  return await db.select().from(passkeys).where(eq(passkeys.userId, userId));
}

export async function getPasskeyByCredentialId(credentialId: string) {
  const results = await db.select().from(passkeys).where(eq(passkeys.credentialId, credentialId));
  return results[0] || null;
}

export async function startRegistration(userId: string, userEmail: string) {
  const userPasskeys = await getUserPasskeys(userId);

  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userName: userEmail,
    userDisplayName: userEmail.split("@")[0],
    attestationType: "none",
    excludeCredentials: userPasskeys.map((pk) => ({
      id: pk.credentialId,
      transports: pk.transports?.split(",") as any[] || undefined,
    })),
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "preferred",
      authenticatorAttachment: "platform",
    },
  });

  setChallenge(userId, options.challenge);
  return options;
}

export async function finishRegistration(
  userId: string,
  response: any
): Promise<{ success: boolean; message: string }> {
  const expectedChallenge = getChallenge(userId);
  if (!expectedChallenge) {
    return { success: false, message: "Challenge expired or not found" };
  }

  try {
    const verification: VerifiedRegistrationResponse = await verifyRegistrationResponse({
      response,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });

    if (!verification.verified || !verification.registrationInfo) {
      return { success: false, message: "Registration verification failed" };
    }

    const { credential, credentialDeviceType } = verification.registrationInfo;

    await db.insert(passkeys).values({
      id: crypto.randomUUID(),
      userId,
      credentialId: credential.id,
      publicKey: Buffer.from(credential.publicKey).toString("base64"),
      counter: String(credential.counter),
      deviceType: credentialDeviceType,
      transports: response.response.transports?.join(",") || null,
    });

    clearChallenge(userId);
    return { success: true, message: "Passkey registered successfully" };
  } catch (error) {
    console.error("WebAuthn registration error:", error);
    return { success: false, message: "Registration failed" };
  }
}

export async function startAuthentication(userId?: string) {
  let allowCredentials: { id: string; transports?: string[] }[] = [];

  if (userId) {
    const userPasskeys = await getUserPasskeys(userId);
    allowCredentials = userPasskeys.map((pk) => ({
      id: pk.credentialId,
      transports: pk.transports?.split(",") as any[] || undefined,
    }));
  }

  const options = await generateAuthenticationOptions({
    rpID,
    allowCredentials: allowCredentials.length > 0 ? allowCredentials as any : undefined,
    userVerification: "preferred",
  });

  const requestId = crypto.randomUUID();
  setChallenge(`auth:${requestId}`, options.challenge);
  return { ...options, requestId };
}

export function getAuthRequestId(requestId: string): string | null {
  return getChallenge(`auth:${requestId}`);
}

export async function finishAuthentication(
  response: any,
  requestId?: string
): Promise<{ success: boolean; user?: any; message: string }> {
  if (!requestId) {
    return { success: false, message: "Request ID required" };
  }
  const expectedChallenge = getChallenge(`auth:${requestId}`);

  if (!expectedChallenge) {
    return { success: false, message: "Challenge expired or not found" };
  }

  try {
    const passkey = await getPasskeyByCredentialId(response.id);
    if (!passkey) {
      return { success: false, message: "Passkey not found" };
    }

    const verification: VerifiedAuthenticationResponse = await verifyAuthenticationResponse({
      response,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: passkey.credentialId,
        publicKey: Buffer.from(passkey.publicKey, "base64"),
        counter: parseInt(passkey.counter, 10),
        transports: passkey.transports?.split(",") as any[] || undefined,
      },
    });

    if (!verification.verified) {
      return { success: false, message: "Authentication verification failed" };
    }

    await db
      .update(passkeys)
      .set({
        counter: String(verification.authenticationInfo.newCounter),
        lastUsedAt: new Date(),
      })
      .where(eq(passkeys.id, passkey.id));

    const userResults = await db.select().from(users).where(eq(users.id, passkey.userId));
    const user = userResults[0];

    clearChallenge(`auth:${requestId}`);
    return { success: true, user, message: "Authentication successful" };
  } catch (error) {
    console.error("WebAuthn authentication error:", error);
    return { success: false, message: "Authentication failed" };
  }
}

export async function deletePasskey(userId: string, passkeyId: string): Promise<boolean> {
  const result = await db
    .delete(passkeys)
    .where(and(eq(passkeys.id, passkeyId), eq(passkeys.userId, userId)))
    .returning();
  return result.length > 0;
}
