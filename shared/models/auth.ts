import { sql } from "drizzle-orm";
import { boolean, index, jsonb, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  username: varchar("username").unique(),
  displayName: varchar("display_name"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  signupPosition: varchar("signup_position"),
  pinHash: varchar("pin_hash"),
  passwordHash: varchar("password_hash"),
  phoneNumber: varchar("phone_number"),
  phoneVerified: boolean("phone_verified").default(false),
  emailVerified: boolean("email_verified").default(false),
  sessionToken: varchar("session_token"),
  sessionTokenExpiry: timestamp("session_token_expiry"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const emailVerificationCodes = pgTable("email_verification_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  email: varchar("email").notNull(),
  code: varchar("code").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  attempts: varchar("attempts").notNull().default("0"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type EmailVerificationCode = typeof emailVerificationCodes.$inferSelect;

// Early Adopter Tracking - cumulative purchases and donations
export const earlyAdopterStats = pgTable("early_adopter_stats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id).unique(),
  tokenPurchasePosition: varchar("token_purchase_position"),
  totalTokenPurchaseCents: varchar("total_token_purchase_cents").notNull().default("0"),
  crowdfundTotalCents: varchar("crowdfund_total_cents").notNull().default("0"),
  crowdfundTier: varchar("crowdfund_tier").default("none"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Signup counter for tracking early adopter positions
export const signupCounter = pgTable("signup_counter", {
  id: varchar("id").primaryKey().default("global"),
  currentPosition: varchar("current_position").notNull().default("0"),
  tokenPurchasePosition: varchar("token_purchase_position").notNull().default("0"),
});

export type EarlyAdopterStats = typeof earlyAdopterStats.$inferSelect;

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// WebAuthn passkeys storage table
export const passkeys = pgTable("passkeys", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  credentialId: varchar("credential_id").notNull().unique(),
  publicKey: varchar("public_key").notNull(),
  counter: varchar("counter").notNull().default("0"),
  deviceType: varchar("device_type"),
  transports: varchar("transports"),
  createdAt: timestamp("created_at").defaultNow(),
  lastUsedAt: timestamp("last_used_at"),
});

export type Passkey = typeof passkeys.$inferSelect;
export type InsertPasskey = typeof passkeys.$inferInsert;

// AI Credits for users - tracks balance for AI assistant usage
export const userAiCredits = pgTable("user_ai_credits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id).unique(),
  balanceCents: varchar("balance_cents").notNull().default("0"), // Credits in cents (100 = $1)
  totalPurchasedCents: varchar("total_purchased_cents").notNull().default("0"),
  totalUsedCents: varchar("total_used_cents").notNull().default("0"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UserAiCredits = typeof userAiCredits.$inferSelect;

// AI Usage logs for transparency
export const aiUsageLogs = pgTable("ai_usage_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  action: varchar("action").notNull(), // 'chat' or 'tts'
  costCents: varchar("cost_cents").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type AiUsageLog = typeof aiUsageLogs.$inferSelect;

// External wallet addresses for crypto purchases (Stripe onramp, etc.)
export const userExternalWallets = pgTable("user_external_wallets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  chain: varchar("chain").notNull(), // 'ethereum', 'solana', 'base', 'polygon', etc.
  address: varchar("address").notNull(),
  label: varchar("label"), // Optional nickname like "My MetaMask"
  isDefault: varchar("is_default").default("false"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UserExternalWallet = typeof userExternalWallets.$inferSelect;
export type InsertUserExternalWallet = typeof userExternalWallets.$inferInsert;

// Trust Layer Membership - Unified membership status across all entry points
export const trustLayerMemberships = pgTable("trust_layer_memberships", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  primaryUserId: varchar("primary_user_id").notNull().references(() => users.id).unique(),
  trustLayerId: varchar("trust_layer_id").notNull().unique(), // Format: TL-XXXXXX
  membershipStatus: varchar("membership_status").notNull().default("pending"), // pending, active, suspended
  membershipType: varchar("membership_type").notNull().default("individual"), // individual, business
  entryPoint: varchar("entry_point"), // Where they first signed up: tlid.io, dwtl.io, chronochat, etc.
  reconciliationStatus: varchar("reconciliation_status").notNull().default("pending"), // pending, completed
  notificationSent: boolean("notification_sent").default(false),
  notificationSentAt: timestamp("notification_sent_at"),
  mergedUserIds: jsonb("merged_user_ids").default("[]"), // Array of user IDs that were merged into this membership
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  activatedAt: timestamp("activated_at"), // When membership became active after reconciliation
});

export type TrustLayerMembership = typeof trustLayerMemberships.$inferSelect;
export type InsertTrustLayerMembership = typeof trustLayerMemberships.$inferInsert;

// Membership Reconciliation Queue - Tracks potential duplicate registrations
export const membershipReconciliationQueue = pgTable("membership_reconciliation_queue", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  email: varchar("email"),
  phoneNumber: varchar("phone_number"),
  potentialDuplicateOf: varchar("potential_duplicate_of"), // User ID of potential match
  matchType: varchar("match_type"), // email, phone, social_account, name_similarity
  matchConfidence: varchar("match_confidence").default("high"), // high, medium, low
  status: varchar("status").notNull().default("pending"), // pending, merged, rejected, auto_resolved
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: varchar("resolved_by"), // 'system' or admin user ID
  createdAt: timestamp("created_at").defaultNow(),
});

export type MembershipReconciliationQueue = typeof membershipReconciliationQueue.$inferSelect;
export type InsertMembershipReconciliationQueue = typeof membershipReconciliationQueue.$inferInsert;

// Membership Linked Accounts - Tracks all auth methods linked to a membership
export const membershipLinkedAccounts = pgTable("membership_linked_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  membershipId: varchar("membership_id").notNull().references(() => trustLayerMemberships.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  authProvider: varchar("auth_provider").notNull(), // firebase, email, google, apple, passkey
  providerAccountId: varchar("provider_account_id"), // External provider's user ID
  linkedAt: timestamp("linked_at").defaultNow(),
});

export type MembershipLinkedAccount = typeof membershipLinkedAccounts.$inferSelect;
export type InsertMembershipLinkedAccount = typeof membershipLinkedAccounts.$inferInsert;

// Ecosystem Apps - Registered external apps that can authenticate via Trust Layer SSO
export const ecosystemApps = pgTable("ecosystem_apps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  appName: varchar("app_name").notNull().unique(), // "GarageBot", "DarkWave", etc.
  appDisplayName: varchar("app_display_name").notNull(),
  appDescription: varchar("app_description"),
  appUrl: varchar("app_url").notNull(), // Base URL: https://garagebot.io
  callbackUrl: varchar("callback_url").notNull(), // OAuth callback: /auth/callback
  apiKey: varchar("api_key").notNull().unique(), // For server-to-server verification
  apiSecret: varchar("api_secret").notNull(), // HMAC signing secret
  logoUrl: varchar("logo_url"),
  isActive: boolean("is_active").default(true),
  permissions: jsonb("permissions").default([]), // ["read:profile", "read:membership"]
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type EcosystemApp = typeof ecosystemApps.$inferSelect;
export type InsertEcosystemApp = typeof ecosystemApps.$inferInsert;

// SSO Sessions - Track cross-app authentication sessions
export const ssoSessions = pgTable("sso_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  appId: varchar("app_id").notNull().references(() => ecosystemApps.id),
  ssoToken: varchar("sso_token").notNull().unique(), // Token sent to external app
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"), // One-time use tokens
  ipAddress: varchar("ip_address"),
  userAgent: varchar("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type SsoSession = typeof ssoSessions.$inferSelect;
export type InsertSsoSession = typeof ssoSessions.$inferInsert;

// User App Connections - Track which apps a user has connected
export const userAppConnections = pgTable("user_app_connections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  appId: varchar("app_id").notNull().references(() => ecosystemApps.id),
  connectedAt: timestamp("connected_at").defaultNow(),
  lastLoginAt: timestamp("last_login_at"),
  revokedAt: timestamp("revoked_at"),
});

export type UserAppConnection = typeof userAppConnections.$inferSelect;
export type InsertUserAppConnection = typeof userAppConnections.$inferInsert;
