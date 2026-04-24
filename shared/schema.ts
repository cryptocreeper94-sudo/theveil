import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, serial, integer, real, jsonb, bigint } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export * from "./models/auth";

// Password Reset Tokens
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false).notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;

// AI Chat conversations
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull().default("general"),
  appId: text("app_id"),
  isPublic: boolean("is_public").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;

export const supportTickets = pgTable("support_tickets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  userEmail: text("user_email").notNull(),
  userName: text("user_name"),
  category: text("category").notNull().default("general"),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  status: text("status").notNull().default("open"),
  priority: text("priority").notNull().default("normal"),
  adminNotes: text("admin_notes"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertSupportTicketSchema = createInsertSchema(supportTickets).omit({
  id: true,
  status: true,
  adminNotes: true,
  resolvedAt: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSupportTicket = z.infer<typeof insertSupportTicketSchema>;
export type SupportTicket = typeof supportTickets.$inferSelect;

export const influencerApplications = pgTable("influencer_applications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull(),
  platform: text("platform").notNull(),
  handle: text("handle").notNull(),
  followers: text("followers"),
  contentType: text("content_type"),
  message: text("message"),
  status: text("status").notNull().default("pending"),
  adminNotes: text("admin_notes"),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertInfluencerApplicationSchema = createInsertSchema(influencerApplications).omit({
  id: true,
  status: true,
  adminNotes: true,
  reviewedAt: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertInfluencerApplication = z.infer<typeof insertInfluencerApplicationSchema>;
export type InfluencerApplication = typeof influencerApplications.$inferSelect;

export const ecosystemAppSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  description: z.string(),
  hook: z.string().optional(),
  tags: z.array(z.string()),
  gradient: z.string(),
  verified: z.boolean().optional(),
  featured: z.boolean().optional(),
  users: z.string().optional(),
  imagePrompt: z.string().optional(),
  url: z.string().optional(),
});

export type EcosystemApp = z.infer<typeof ecosystemAppSchema>;

export const blockchainStatsSchema = z.object({
  tps: z.string(),
  finalityTime: z.string(),
  avgCost: z.string(),
  activeNodes: z.string(),
  currentBlock: z.string(),
  networkHash: z.string(),
});

export type BlockchainStats = z.infer<typeof blockchainStatsSchema>;

export const pageViews = pgTable("page_views", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  pageSlug: text("page_slug").notNull(),
  visitorId: text("visitor_id").notNull(),
  referrer: text("referrer"),
  userAgent: text("user_agent"),
  host: text("host").default("dwsc.io"),
  country: text("country"),
  city: text("city"),
  deviceType: text("device_type"),
  browser: text("browser"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertPageViewSchema = createInsertSchema(pageViews).omit({
  id: true,
  timestamp: true,
});

export type InsertPageView = z.infer<typeof insertPageViewSchema>;
export type PageView = typeof pageViews.$inferSelect;

export const dailyMetrics = pgTable("daily_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: text("date").notNull(),
  pageSlug: text("page_slug").notNull(),
  totalViews: text("total_views").notNull().default("0"),
  uniqueVisitors: text("unique_visitors").notNull().default("0"),
});

export const insertDailyMetricsSchema = createInsertSchema(dailyMetrics).omit({
  id: true,
});

export type InsertDailyMetrics = z.infer<typeof insertDailyMetricsSchema>;
export type DailyMetrics = typeof dailyMetrics.$inferSelect;

export const analyticsOverviewSchema = z.object({
  totalViews: z.number(),
  uniqueVisitors: z.number(),
  todayViews: z.number(),
  topPages: z.array(z.object({
    page: z.string(),
    views: z.number(),
  })),
  topReferrers: z.array(z.object({
    referrer: z.string(),
    count: z.number(),
  })),
  dailyTrend: z.array(z.object({
    date: z.string(),
    views: z.number(),
    unique: z.number(),
  })),
});

export type AnalyticsOverview = z.infer<typeof analyticsOverviewSchema>;

export const apiKeys = pgTable("api_keys", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  keyHash: text("key_hash").notNull().unique(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  appName: text("app_name").notNull(),
  permissions: text("permissions").notNull().default("read,write"),
  rateLimit: text("rate_limit").notNull().default("1000"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastUsedAt: timestamp("last_used_at"),
});

export const insertApiKeySchema = createInsertSchema(apiKeys).omit({
  id: true,
  createdAt: true,
  lastUsedAt: true,
});

export type InsertApiKey = z.infer<typeof insertApiKeySchema>;
export type ApiKey = typeof apiKeys.$inferSelect;

export const transactionHashes = pgTable("transaction_hashes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  txHash: text("tx_hash").notNull().unique(),
  dataHash: text("data_hash").notNull(),
  category: text("category").notNull().default("general"),
  appId: text("app_id"),
  apiKeyId: text("api_key_id"),
  status: text("status").notNull().default("pending"),
  blockHeight: text("block_height"),
  gasUsed: text("gas_used"),
  fee: text("fee"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  confirmedAt: timestamp("confirmed_at"),
});

export const insertTransactionHashSchema = createInsertSchema(transactionHashes).omit({
  id: true,
  createdAt: true,
  confirmedAt: true,
});

export type InsertTransactionHash = z.infer<typeof insertTransactionHashSchema>;
export type TransactionHash = typeof transactionHashes.$inferSelect;

export const feeScheduleSchema = z.object({
  baseFee: z.number(),
  priorityFee: z.number(),
  maxFee: z.number(),
  feePerByte: z.number(),
  hashSubmissionFee: z.number(),
});

export type FeeSchedule = z.infer<typeof feeScheduleSchema>;

export const gasEstimateSchema = z.object({
  gasLimit: z.number(),
  gasPrice: z.number(),
  estimatedCost: z.string(),
  estimatedCostDWC: z.string(),
  estimatedCostUSD: z.string(),
});

export type GasEstimate = z.infer<typeof gasEstimateSchema>;

export const dualChainStamps = pgTable("dual_chain_stamps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  dataHash: text("data_hash").notNull(),
  appId: text("app_id").notNull(),
  appName: text("app_name"),
  category: text("category").notNull().default("release"),
  metadata: text("metadata"),
  darkwaveTxHash: text("darkwave_tx_hash"),
  darkwaveStatus: text("darkwave_status").notNull().default("pending"),
  darkwaveBlockHeight: text("darkwave_block_height"),
  solanaTxSignature: text("solana_tx_signature"),
  solanaStatus: text("solana_status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  confirmedAt: timestamp("confirmed_at"),
});

export const insertDualChainStampSchema = createInsertSchema(dualChainStamps).omit({
  id: true,
  createdAt: true,
  confirmedAt: true,
});

export type InsertDualChainStamp = z.infer<typeof insertDualChainStampSchema>;
export type DualChainStamp = typeof dualChainStamps.$inferSelect;

export const dualChainResultSchema = z.object({
  dataHash: z.string(),
  darkwave: z.object({
    success: z.boolean(),
    txHash: z.string().optional(),
    blockHeight: z.number().optional(),
    error: z.string().optional(),
  }).optional(),
  solana: z.object({
    success: z.boolean(),
    txSignature: z.string().optional(),
    error: z.string().optional(),
  }).optional(),
  allSuccessful: z.boolean(),
});

export type DualChainResult = z.infer<typeof dualChainResultSchema>;

export const TL_PREFIX = "TL";

export const ECOSYSTEM_APP_REGISTRY = [
  { id: 1, name: "Trust Layer Hub", prefix: "TH", domain: "trusthub.tlid.io" },
  { id: 2, name: "Trust Layer (L1)", prefix: "TL", domain: "dwtl.io" },
  { id: 3, name: "TrustHome", prefix: "TR", domain: "trusthome.tlid.io" },
  { id: 4, name: "TrustVault", prefix: "TV", domain: "trustvault.tlid.io" },
  { id: 5, name: "TLID.io", prefix: "TI", domain: "tlid.io" },
  { id: 6, name: "THE VOID", prefix: "VO", domain: "thevoid.tlid.io" },
  { id: 7, name: "Signal Chat", prefix: "SC", domain: "signalchat.tlid.io" },
  { id: 8, name: "DarkWave Studio", prefix: "DS", domain: "darkwavestudio.tlid.io" },
  { id: 9, name: "Guardian Shield", prefix: "GS", domain: "guardianshield.tlid.io" },
  { id: 10, name: "Guardian Scanner", prefix: "GN", domain: "guardianscanner.tlid.io" },
  { id: 11, name: "Guardian Screener", prefix: "GR", domain: "guardianscreener.tlid.io" },
  { id: 12, name: "TradeWorks AI", prefix: "TW", domain: "tradeworks.tlid.io" },
  { id: 13, name: "StrikeAgent", prefix: "SA", domain: "strikeagent.tlid.io" },
  { id: 14, name: "Pulse", prefix: "PU", domain: "pulse.tlid.io" },
  { id: 15, name: "Chronicles", prefix: "CH", domain: "chronicles.tlid.io" },
  { id: 16, name: "The Arcade", prefix: "AR", domain: "thearcade.tlid.io" },
  { id: 17, name: "Bomber", prefix: "BO", domain: "bomber.tlid.io" },
  { id: 18, name: "Trust Golf", prefix: "TG", domain: "trustgolf.tlid.io" },
  { id: 19, name: "ORBIT Staffing OS", prefix: "OR", domain: "orbit.tlid.io" },
  { id: 20, name: "Orby Commander", prefix: "OC", domain: "orby.tlid.io" },
  { id: 21, name: "GarageBot", prefix: "GB", domain: "garagebot.tlid.io" },
  { id: 22, name: "Lot Ops Pro", prefix: "LO", domain: "lotops.tlid.io" },
  { id: 23, name: "TORQUE", prefix: "TQ", domain: "torque.tlid.io" },
  { id: 24, name: "TL Driver Connect", prefix: "DC", domain: "driverconnect.tlid.io" },
  { id: 25, name: "VedaSolus", prefix: "VS", domain: "vedasolus.tlid.io" },
  { id: 26, name: "Verdara", prefix: "VD", domain: "verdara.tlid.io" },
  { id: 27, name: "Arbora", prefix: "AB", domain: "arbora.tlid.io" },
  { id: 28, name: "PaintPros", prefix: "PP", domain: "paintpros.tlid.io" },
  { id: 29, name: "Nashville Painting Professionals", prefix: "NP", domain: "nashvillepainting.tlid.io" },
  { id: 30, name: "Trust Book", prefix: "TB", domain: "trustbook.tlid.io" },
  { id: 31, name: "DarkWave Academy", prefix: "DA", domain: "darkwaveacademy.tlid.io" },
  { id: 32, name: "Happy Eats", prefix: "HE", domain: "happyeats.tlid.io" },
  { id: 33, name: "Brew & Board Coffee", prefix: "BB", domain: "brewandboard.tlid.io" },
  { id: 34, name: "TrustGen", prefix: "TN", domain: "trustgen.tlid.io" },
] as const;

export const hallmarks = pgTable("hallmarks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  hallmarkId: text("hallmark_id").notNull().unique(),
  thId: text("th_id").unique(),
  userId: integer("user_id"),
  verificationUrl: text("verification_url"),
  masterSequence: text("master_sequence").notNull(),
  subSequence: text("sub_sequence").notNull().default("01"),
  appId: text("app_id").notNull(),
  appName: text("app_name").notNull(),
  productName: text("product_name"),
  version: text("version"),
  releaseType: text("release_type").notNull().default("release"),
  dataHash: text("data_hash").notNull(),
  metadata: text("metadata"),
  qrCodeSvg: text("qr_code_svg"),
  verificationToken: text("verification_token"),
  darkwaveTxHash: text("darkwave_tx_hash"),
  darkwaveBlockHeight: text("darkwave_block_height"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  confirmedAt: timestamp("confirmed_at"),
});

export const hallmarkCounter = pgTable("hallmark_counter", {
  id: varchar("id").primaryKey().default("tl-master"),
  currentSequence: text("current_sequence").notNull().default("0"),
});

export const insertHallmarkSchema = createInsertSchema(hallmarks).omit({
  id: true,
  createdAt: true,
  confirmedAt: true,
});

export type InsertHallmark = z.infer<typeof insertHallmarkSchema>;
export type Hallmark = typeof hallmarks.$inferSelect;

export const hallmarkResponseSchema = z.object({
  hallmarkId: z.string(),
  appId: z.string(),
  appName: z.string(),
  productName: z.string().optional(),
  version: z.string().optional(),
  releaseType: z.string(),
  dataHash: z.string(),
  darkwave: z.object({
    txHash: z.string().optional(),
    blockHeight: z.string().optional(),
    status: z.string(),
    explorerUrl: z.string().optional(),
  }),
  createdAt: z.string(),
  verified: z.boolean(),
});

export type HallmarkResponse = z.infer<typeof hallmarkResponseSchema>;

// Hallmark Serial Ranges (12-digit system)
export const HALLMARK_SERIAL_RANGES = {
  GENESIS_FOUNDERS: { start: 1, end: 10000 },           // Ultra-rare first 10K
  LEGACY_FOUNDERS: { start: 10001, end: 50000 },        // Early adopters
  SPECIAL_RESERVE: { start: 50001, end: 300000 },       // Partnerships, events
  GENERAL_PUBLIC: { start: 300001, end: 999999999999 }, // Everyone else
} as const;

// User Hallmark Profiles (tracks their serial counter)
export const hallmarkProfiles = pgTable("hallmark_profiles", {
  userId: varchar("user_id").primaryKey(),
  avatarType: text("avatar_type").notNull().default("agent"),
  avatarId: text("avatar_id"),
  customAvatarUrl: text("custom_avatar_url"),
  currentSerial: integer("current_serial").notNull().default(0),
  preferredTemplate: text("preferred_template").default("classic"),
  displayName: text("display_name"),
  bio: text("bio"),
  tier: text("tier").notNull().default("GENERAL_PUBLIC"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Individual Hallmark Mints
export const hallmarkMints = pgTable("hallmark_mints", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  serialNumber: varchar("serial_number").notNull().unique(),
  globalSerial: text("global_serial").notNull().unique(),
  avatarSnapshot: text("avatar_snapshot"),
  templateUsed: text("template_used").notNull().default("classic"),
  payloadHash: varchar("payload_hash", { length: 128 }).notNull(),
  auditEventIds: text("audit_event_ids"),
  memoSignature: varchar("memo_signature", { length: 128 }),
  blockNumber: integer("block_number"),
  artworkUrl: text("artwork_url"),
  metadataUri: text("metadata_uri"),
  priceUsd: varchar("price_usd", { length: 20 }).notNull().default("0"),
  paymentProvider: text("payment_provider"),
  paymentId: varchar("payment_id"),
  status: text("status").notNull().default("draft"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  paidAt: timestamp("paid_at"),
  mintedAt: timestamp("minted_at"),
});

// Trust Stamps - blockchain audit trail for all user actions
export const trustStamps = pgTable("trust_stamps", {
  id: serial("id").primaryKey(),
  userId: text("user_id"),
  category: text("category").notNull(),
  data: text("data"),
  dataHash: text("data_hash").notNull(),
  txHash: text("tx_hash"),
  blockHeight: integer("block_height"),
  metadata: text("metadata"),
  status: text("status").notNull().default("confirmed"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type TrustStamp = typeof trustStamps.$inferSelect;

// Global Hallmark Counter (12-digit)
export const hallmarkGlobalCounter = pgTable("hallmark_global_counter", {
  id: varchar("id").primaryKey().default("global"),
  currentGlobalSerial: text("current_global_serial").notNull().default("0"),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const insertHallmarkProfileSchema = createInsertSchema(hallmarkProfiles).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertHallmarkMintSchema = createInsertSchema(hallmarkMints).omit({
  createdAt: true,
  paidAt: true,
  mintedAt: true,
});

export type InsertHallmarkProfile = z.infer<typeof insertHallmarkProfileSchema>;
export type HallmarkProfile = typeof hallmarkProfiles.$inferSelect;
export type InsertHallmarkMint = z.infer<typeof insertHallmarkMintSchema>;
export type HallmarkMint = typeof hallmarkMints.$inferSelect;

// Member Trust Cards - for business and individual memberships
export const memberTrustCards = pgTable("member_trust_cards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  trustNumber: varchar("trust_number", { length: 20 }).notNull().unique(),
  memberType: text("member_type").notNull().default("individual"), // individual, business
  memberTier: text("member_tier").notNull().default("pioneer"), // pioneer, guardian, enterprise
  displayName: text("display_name").notNull(),
  organizationName: text("organization_name"),
  dataHash: varchar("data_hash", { length: 128 }).notNull(),
  qrCodeSvg: text("qr_code_svg"),
  cardImageUrl: text("card_image_url"),
  darkwaveTxHash: varchar("darkwave_tx_hash", { length: 128 }),
  darkwaveBlockHeight: text("darkwave_block_height"),
  totalTransactions: integer("total_transactions").notNull().default(0),
  rewardPoints: integer("reward_points").notNull().default(0),
  verifiedAt: timestamp("verified_at"),
  status: text("status").notNull().default("active"), // active, suspended, expired
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
});

export const insertMemberTrustCardSchema = createInsertSchema(memberTrustCards).omit({
  id: true,
  createdAt: true,
  verifiedAt: true,
});

export type InsertMemberTrustCard = z.infer<typeof insertMemberTrustCardSchema>;
export type MemberTrustCard = typeof memberTrustCards.$inferSelect;

// Business Membership Applications - for verified business accounts
export const businessApplications = pgTable("business_applications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  businessName: text("business_name").notNull(),
  einNumber: text("ein_number").notNull(),
  website: text("website"),
  contactName: text("contact_name").notNull(),
  contactEmail: text("contact_email").notNull(),
  contactPhone: text("contact_phone"),
  businessDescription: text("business_description").notNull(),
  intendedUse: text("intended_use"),
  employeeCount: text("employee_count"),
  country: text("country").default("United States"),
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  mainStreet: boolean("main_street").default(false), // Legacy Main Street Program enrollment
  reviewedBy: text("reviewed_by"),
  reviewedAt: timestamp("reviewed_at"),
  reviewNotes: text("review_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertBusinessApplicationSchema = createInsertSchema(businessApplications).omit({
  id: true,
  status: true,
  mainStreet: true,
  reviewedBy: true,
  reviewedAt: true,
  reviewNotes: true,
  createdAt: true,
});

export type InsertBusinessApplication = z.infer<typeof insertBusinessApplicationSchema>;
export type BusinessApplication = typeof businessApplications.$inferSelect;

// Genesis Hallmark (the flagship first hallmark)
export const genesisHallmarkSchema = z.object({
  id: z.string(),
  globalSerial: z.string(),
  serialNumber: z.string(),
  payloadHash: z.string(),
  blockNumber: z.number().optional(),
  txHash: z.string().optional(),
  createdAt: z.string(),
  verificationUrl: z.string(),
  qrCodeData: z.string(),
});

export type GenesisHallmark = z.infer<typeof genesisHallmarkSchema>;

export const waitlist = pgTable("waitlist", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  feature: text("feature").notNull().default("dev-studio"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertWaitlistSchema = createInsertSchema(waitlist).omit({
  id: true,
  createdAt: true,
}).extend({
  email: z.string().email("Please enter a valid email address"),
});

export type InsertWaitlist = z.infer<typeof insertWaitlistSchema>;
export type Waitlist = typeof waitlist.$inferSelect;

export const usageLogs = pgTable("usage_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  apiKeyId: text("api_key_id").notNull(),
  endpoint: text("endpoint").notNull(),
  tokensUsed: text("tokens_used").notNull().default("0"),
  costCents: text("cost_cents").notNull().default("0"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertUsageLogSchema = createInsertSchema(usageLogs).omit({
  id: true,
  timestamp: true,
});

export type InsertUsageLog = z.infer<typeof insertUsageLogSchema>;
export type UsageLog = typeof usageLogs.$inferSelect;

export const developerBilling = pgTable("developer_billing", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  apiKeyId: text("api_key_id").notNull().unique(),
  stripeCustomerId: text("stripe_customer_id"),
  email: text("email").notNull(),
  totalUsageCents: text("total_usage_cents").notNull().default("0"),
  paidThroughCents: text("paid_through_cents").notNull().default("0"),
  lastBilledAt: timestamp("last_billed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertDeveloperBillingSchema = createInsertSchema(developerBilling).omit({
  id: true,
  createdAt: true,
  lastBilledAt: true,
});

export type InsertDeveloperBilling = z.infer<typeof insertDeveloperBillingSchema>;
export type DeveloperBilling = typeof developerBilling.$inferSelect;

export const studioProjects = pgTable("studio_projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  language: text("language").notNull().default("javascript"),
  isPublic: boolean("is_public").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertStudioProjectSchema = createInsertSchema(studioProjects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertStudioProject = z.infer<typeof insertStudioProjectSchema>;
export type StudioProject = typeof studioProjects.$inferSelect;

export const studioFiles = pgTable("studio_files", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: text("project_id").notNull(),
  path: text("path").notNull(),
  name: text("name").notNull(),
  content: text("content").notNull().default(""),
  language: text("language").notNull().default("plaintext"),
  isFolder: boolean("is_folder").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertStudioFileSchema = createInsertSchema(studioFiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertStudioFile = z.infer<typeof insertStudioFileSchema>;
export type StudioFile = typeof studioFiles.$inferSelect;

export const studioSecrets = pgTable("studio_secrets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: text("project_id").notNull(),
  key: text("key").notNull(),
  value: text("value").notNull(),
  environment: text("environment").notNull().default("shared"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertStudioSecretSchema = createInsertSchema(studioSecrets).omit({
  id: true,
  createdAt: true,
});

export type InsertStudioSecret = z.infer<typeof insertStudioSecretSchema>;
export type StudioSecret = typeof studioSecrets.$inferSelect;

export const studioConfigs = pgTable("studio_configs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: text("project_id").notNull(),
  key: text("key").notNull(),
  value: text("value").notNull(),
  environment: text("environment").notNull().default("shared"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertStudioConfigSchema = createInsertSchema(studioConfigs).omit({
  id: true,
  createdAt: true,
});

export type InsertStudioConfig = z.infer<typeof insertStudioConfigSchema>;
export type StudioConfig = typeof studioConfigs.$inferSelect;

export const studioCommits = pgTable("studio_commits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: text("project_id").notNull(),
  hash: text("hash").notNull(),
  parentHash: text("parent_hash"),
  message: text("message").notNull(),
  authorId: text("author_id").notNull(),
  branch: text("branch").notNull().default("main"),
  filesSnapshot: text("files_snapshot").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertStudioCommitSchema = createInsertSchema(studioCommits).omit({
  id: true,
  createdAt: true,
});

export type InsertStudioCommit = z.infer<typeof insertStudioCommitSchema>;
export type StudioCommit = typeof studioCommits.$inferSelect;

export const studioBranches = pgTable("studio_branches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: text("project_id").notNull(),
  name: text("name").notNull(),
  headCommitId: text("head_commit_id"),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertStudioBranchSchema = createInsertSchema(studioBranches).omit({
  id: true,
  createdAt: true,
});

export type InsertStudioBranch = z.infer<typeof insertStudioBranchSchema>;
export type StudioBranch = typeof studioBranches.$inferSelect;

export const studioRuns = pgTable("studio_runs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: text("project_id").notNull(),
  command: text("command").notNull(),
  status: text("status").notNull().default("pending"),
  output: text("output").notNull().default(""),
  exitCode: text("exit_code"),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const insertStudioRunSchema = createInsertSchema(studioRuns).omit({
  id: true,
  startedAt: true,
  completedAt: true,
});

export type InsertStudioRun = z.infer<typeof insertStudioRunSchema>;
export type StudioRun = typeof studioRuns.$inferSelect;

export const studioPreviews = pgTable("studio_previews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: text("project_id").notNull(),
  runId: text("run_id"),
  url: text("url"),
  status: text("status").notNull().default("pending"),
  port: text("port"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertStudioPreviewSchema = createInsertSchema(studioPreviews).omit({
  id: true,
  createdAt: true,
});

export type InsertStudioPreview = z.infer<typeof insertStudioPreviewSchema>;
export type StudioPreview = typeof studioPreviews.$inferSelect;

export const studioDeployments = pgTable("studio_deployments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: text("project_id").notNull(),
  status: text("status").notNull().default("pending"),
  url: text("url"),
  customDomain: text("custom_domain"),
  version: text("version").notNull().default("1"),
  commitHash: text("commit_hash"),
  buildLogs: text("build_logs").default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertStudioDeploymentSchema = createInsertSchema(studioDeployments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertStudioDeployment = z.infer<typeof insertStudioDeploymentSchema>;
export type StudioDeployment = typeof studioDeployments.$inferSelect;

export const studioCollaborators = pgTable("studio_collaborators", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: text("project_id").notNull(),
  userId: text("user_id").notNull(),
  role: text("role").notNull().default("editor"),
  cursorPosition: text("cursor_position"),
  lastActiveAt: timestamp("last_active_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertStudioCollaboratorSchema = createInsertSchema(studioCollaborators).omit({
  id: true,
  createdAt: true,
  lastActiveAt: true,
});

export type InsertStudioCollaborator = z.infer<typeof insertStudioCollaboratorSchema>;
export type StudioCollaborator = typeof studioCollaborators.$inferSelect;

export const chainBlocks = pgTable("chain_blocks", {
  height: text("height").primaryKey(),
  hash: text("hash").notNull().unique(),
  prevHash: text("prev_hash").notNull(),
  timestamp: timestamp("timestamp").notNull(),
  validator: text("validator").notNull(),
  merkleRoot: text("merkle_root").notNull(),
  txCount: text("tx_count").notNull().default("0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertChainBlockSchema = createInsertSchema(chainBlocks).omit({
  createdAt: true,
});

export type InsertChainBlock = z.infer<typeof insertChainBlockSchema>;
export type ChainBlock = typeof chainBlocks.$inferSelect;

export const chainTransactions = pgTable("chain_transactions", {
  hash: text("hash").primaryKey(),
  blockHeight: text("block_height").notNull(),
  fromAddress: text("from_address").notNull(),
  toAddress: text("to_address").notNull(),
  amount: text("amount").notNull(),
  nonce: text("nonce").notNull(),
  gasLimit: text("gas_limit").notNull(),
  gasPrice: text("gas_price").notNull(),
  data: text("data").default(""),
  signature: text("signature"),
  timestamp: timestamp("timestamp").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertChainTransactionSchema = createInsertSchema(chainTransactions).omit({
  createdAt: true,
});

export type InsertChainTransaction = z.infer<typeof insertChainTransactionSchema>;
export type ChainTransaction = typeof chainTransactions.$inferSelect;

export const chainAccounts = pgTable("chain_accounts", {
  address: text("address").primaryKey(),
  balance: text("balance").notNull().default("0"),
  nonce: text("nonce").notNull().default("0"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertChainAccountSchema = createInsertSchema(chainAccounts).omit({
  updatedAt: true,
});

export type InsertChainAccount = z.infer<typeof insertChainAccountSchema>;
export type ChainAccount = typeof chainAccounts.$inferSelect;

export const chainConfig = pgTable("chain_config", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Validators for Proof-of-Authority consensus
export const chainValidators = pgTable("chain_validators", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  address: text("address").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").notNull().default("active"), // active, inactive, suspended
  stake: text("stake").notNull().default("0"),
  blocksProduced: text("blocks_produced").notNull().default("0"),
  lastBlockAt: timestamp("last_block_at"),
  commission: text("commission").notNull().default("5"), // percentage
  uptime: text("uptime").notNull().default("100"),
  isFounder: boolean("is_founder").notNull().default(false),
  addedBy: text("added_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertChainValidatorSchema = createInsertSchema(chainValidators).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  blocksProduced: true,
  lastBlockAt: true,
  uptime: true,
});

export type InsertChainValidator = z.infer<typeof insertChainValidatorSchema>;
export type ChainValidator = typeof chainValidators.$inferSelect;

// Block Attestations for BFT Consensus
export const blockAttestations = pgTable("block_attestations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  blockHeight: text("block_height").notNull(),
  blockHash: text("block_hash").notNull(),
  validatorId: text("validator_id").notNull(),
  validatorAddress: text("validator_address").notNull(),
  signature: text("signature").notNull(),
  stake: text("stake").notNull(), // Validator's stake at time of attestation
  attestedAt: timestamp("attested_at").defaultNow().notNull(),
});

export const insertBlockAttestationSchema = createInsertSchema(blockAttestations).omit({
  id: true,
  attestedAt: true,
});
export type BlockAttestation = typeof blockAttestations.$inferSelect;
export type InsertBlockAttestation = z.infer<typeof insertBlockAttestationSchema>;

// Slashing Records for Validator Misbehavior
export const slashingRecords = pgTable("slashing_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  validatorId: text("validator_id").notNull(),
  validatorAddress: text("validator_address").notNull(),
  reason: text("reason").notNull(), // 'double_sign', 'downtime', 'invalid_block', 'censorship'
  blockHeight: text("block_height"),
  slashAmount: text("slash_amount").notNull(), // Amount slashed from stake
  evidence: text("evidence"), // JSON proof of misbehavior
  status: text("status").notNull().default("executed"), // 'pending', 'executed', 'appealed'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSlashingRecordSchema = createInsertSchema(slashingRecords).omit({
  id: true,
  createdAt: true,
});
export type SlashingRecord = typeof slashingRecords.$inferSelect;
export type InsertSlashingRecord = z.infer<typeof insertSlashingRecordSchema>;

// Consensus Epochs for tracking finality
export const consensusEpochs = pgTable("consensus_epochs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  epochNumber: integer("epoch_number").notNull().unique(),
  startBlock: text("start_block").notNull(),
  endBlock: text("end_block"),
  validatorSet: text("validator_set").notNull(), // JSON array of active validators
  totalStake: text("total_stake").notNull(),
  status: text("status").notNull().default("active"), // 'active', 'finalized'
  finalizedAt: timestamp("finalized_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertConsensusEpochSchema = createInsertSchema(consensusEpochs).omit({
  id: true,
  createdAt: true,
  finalizedAt: true,
});
export type ConsensusEpoch = typeof consensusEpochs.$inferSelect;
export type InsertConsensusEpoch = z.infer<typeof insertConsensusEpochSchema>;

// Cross-Chain Bridge Tables (Phase 1 - MVP Custodial Bridge)

export const bridgeLocks = pgTable("bridge_locks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fromAddress: text("from_address").notNull(),
  amount: text("amount").notNull(),
  targetChain: text("target_chain").notNull(),
  targetAddress: text("target_address").notNull(),
  txHash: text("tx_hash").notNull().unique(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  confirmedAt: timestamp("confirmed_at"),
});

export const insertBridgeLockSchema = createInsertSchema(bridgeLocks).omit({
  id: true,
  createdAt: true,
  confirmedAt: true,
});

export type InsertBridgeLock = z.infer<typeof insertBridgeLockSchema>;
export type BridgeLock = typeof bridgeLocks.$inferSelect;

export const bridgeMints = pgTable("bridge_mints", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  lockId: text("lock_id").notNull(),
  targetChain: text("target_chain").notNull(),
  targetAddress: text("target_address").notNull(),
  amount: text("amount").notNull(),
  targetTxHash: text("target_tx_hash"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const insertBridgeMintSchema = createInsertSchema(bridgeMints).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export type InsertBridgeMint = z.infer<typeof insertBridgeMintSchema>;
export type BridgeMint = typeof bridgeMints.$inferSelect;

export const bridgeBurns = pgTable("bridge_burns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sourceChain: text("source_chain").notNull(),
  sourceAddress: text("source_address").notNull(),
  amount: text("amount").notNull(),
  targetAddress: text("target_address").notNull(),
  sourceTxHash: text("source_tx_hash").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  confirmedAt: timestamp("confirmed_at"),
});

export const insertBridgeBurnSchema = createInsertSchema(bridgeBurns).omit({
  id: true,
  createdAt: true,
  confirmedAt: true,
});

export type InsertBridgeBurn = z.infer<typeof insertBridgeBurnSchema>;
export type BridgeBurn = typeof bridgeBurns.$inferSelect;

export const bridgeReleases = pgTable("bridge_releases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  burnId: text("burn_id").notNull(),
  toAddress: text("to_address").notNull(),
  amount: text("amount").notNull(),
  txHash: text("tx_hash"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const insertBridgeReleaseSchema = createInsertSchema(bridgeReleases).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export type InsertBridgeRelease = z.infer<typeof insertBridgeReleaseSchema>;
export type BridgeRelease = typeof bridgeReleases.$inferSelect;

// ============================================
// STAKING SYSTEM
// ============================================

export const stakingPools = pgTable("staking_pools", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull(),
  poolType: text("pool_type").notNull(), // 'liquid' | 'locked' | 'founders'
  apyBase: text("apy_base").notNull(), // Base APY percentage as string (e.g., "12.5")
  apyBoost: text("apy_boost").notNull().default("0"), // Bonus APY for streaks/badges
  lockDays: integer("lock_days").notNull().default(0), // 0 = no lock (liquid)
  minStake: text("min_stake").notNull().default("100"), // Minimum SIG to stake
  maxStake: text("max_stake"), // Optional maximum per user
  totalStaked: text("total_staked").notNull().default("0"),
  totalStakers: integer("total_stakers").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  startsAt: timestamp("starts_at"),
  endsAt: timestamp("ends_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertStakingPoolSchema = createInsertSchema(stakingPools).omit({
  id: true,
  createdAt: true,
});

export type InsertStakingPool = z.infer<typeof insertStakingPoolSchema>;
export type StakingPool = typeof stakingPools.$inferSelect;

export const userStakes = pgTable("user_stakes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  poolId: text("pool_id").notNull(),
  amount: text("amount").notNull(),
  pendingRewards: text("pending_rewards").notNull().default("0"),
  claimedRewards: text("claimed_rewards").notNull().default("0"),
  streakDays: integer("streak_days").notNull().default(0),
  status: text("status").notNull().default("active"), // 'active' | 'unstaking' | 'completed'
  lockedUntil: timestamp("locked_until"),
  stakedAt: timestamp("staked_at").defaultNow().notNull(),
  lastRewardAt: timestamp("last_reward_at").defaultNow().notNull(),
  unstakedAt: timestamp("unstaked_at"),
});

export const insertUserStakeSchema = createInsertSchema(userStakes).omit({
  id: true,
  stakedAt: true,
  lastRewardAt: true,
  unstakedAt: true,
});

export type InsertUserStake = z.infer<typeof insertUserStakeSchema>;
export type UserStake = typeof userStakes.$inferSelect;

export const stakingRewards = pgTable("staking_rewards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  stakeId: text("stake_id").notNull(),
  amount: text("amount").notNull(),
  rewardType: text("reward_type").notNull().default("staking"), // 'staking' | 'quest' | 'airdrop' | 'referral'
  status: text("status").notNull().default("pending"), // 'pending' | 'claimed'
  createdAt: timestamp("created_at").defaultNow().notNull(),
  claimedAt: timestamp("claimed_at"),
});

export const insertStakingRewardSchema = createInsertSchema(stakingRewards).omit({
  id: true,
  createdAt: true,
  claimedAt: true,
});

export type InsertStakingReward = z.infer<typeof insertStakingRewardSchema>;
export type StakingReward = typeof stakingRewards.$inferSelect;

export const stakingQuests = pgTable("staking_quests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  questType: text("quest_type").notNull(), // 'stake_amount' | 'stake_duration' | 'referral' | 'bridge' | 'social'
  requirement: text("requirement").notNull(), // JSON with quest requirements
  rewardDwt: text("reward_dwt").notNull(),
  rewardBadge: text("reward_badge"), // Optional NFT badge ID
  apyBoost: text("apy_boost").notNull().default("0"), // Bonus APY on completion
  isActive: boolean("is_active").notNull().default(true),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertStakingQuestSchema = createInsertSchema(stakingQuests).omit({
  id: true,
  createdAt: true,
});

export type InsertStakingQuest = z.infer<typeof insertStakingQuestSchema>;
export type StakingQuest = typeof stakingQuests.$inferSelect;

export const userQuestProgress = pgTable("user_quest_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  questId: text("quest_id").notNull(),
  progress: text("progress").notNull().default("0"), // Current progress value
  status: text("status").notNull().default("active"), // 'active' | 'completed' | 'claimed'
  completedAt: timestamp("completed_at"),
  claimedAt: timestamp("claimed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserQuestProgressSchema = createInsertSchema(userQuestProgress).omit({
  id: true,
  createdAt: true,
  completedAt: true,
  claimedAt: true,
});

export type InsertUserQuestProgress = z.infer<typeof insertUserQuestProgressSchema>;
export type UserQuestProgress = typeof userQuestProgress.$inferSelect;

export const stakingLeaderboard = pgTable("staking_leaderboard", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull().unique(),
  totalStaked: text("total_staked").notNull().default("0"),
  totalRewards: text("total_rewards").notNull().default("0"),
  longestStreak: integer("longest_streak").notNull().default(0),
  questsCompleted: integer("quests_completed").notNull().default(0),
  referralCount: integer("referral_count").notNull().default(0),
  rank: integer("rank"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertStakingLeaderboardSchema = createInsertSchema(stakingLeaderboard).omit({
  id: true,
  updatedAt: true,
});

export type InsertStakingLeaderboard = z.infer<typeof insertStakingLeaderboardSchema>;
export type StakingLeaderboard = typeof stakingLeaderboard.$inferSelect;

// ============================================
// TESTNET FAUCET
// ============================================

export const faucetClaims = pgTable("faucet_claims", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletAddress: text("wallet_address").notNull(),
  ipAddress: text("ip_address"),
  amount: text("amount").notNull().default("1000000000000000000000"), // 1000 SIG default
  txHash: text("tx_hash"),
  status: text("status").notNull().default("pending"), // 'pending' | 'completed' | 'failed'
  claimedAt: timestamp("claimed_at").defaultNow().notNull(),
});

export const insertFaucetClaimSchema = createInsertSchema(faucetClaims).omit({
  id: true,
  claimedAt: true,
});

export type InsertFaucetClaim = z.infer<typeof insertFaucetClaimSchema>;
export type FaucetClaim = typeof faucetClaims.$inferSelect;

// ============================================
// DEX / TOKEN SWAP
// ============================================

export const tokenPairs = pgTable("token_pairs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tokenA: text("token_a").notNull(), // e.g., "SIG"
  tokenB: text("token_b").notNull(), // e.g., "USDC"
  reserveA: text("reserve_a").notNull().default("0"),
  reserveB: text("reserve_b").notNull().default("0"),
  totalLiquidity: text("total_liquidity").notNull().default("0"),
  fee: text("fee").notNull().default("0.003"), // 0.3% default
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTokenPairSchema = createInsertSchema(tokenPairs).omit({
  id: true,
  createdAt: true,
});

export type InsertTokenPair = z.infer<typeof insertTokenPairSchema>;
export type TokenPair = typeof tokenPairs.$inferSelect;

export const swapTransactions = pgTable("swap_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id"),
  pairId: text("pair_id").notNull(),
  tokenIn: text("token_in").notNull(),
  tokenOut: text("token_out").notNull(),
  amountIn: text("amount_in").notNull(),
  amountOut: text("amount_out").notNull(),
  priceImpact: text("price_impact").notNull().default("0"),
  txHash: text("tx_hash"),
  status: text("status").notNull().default("completed"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSwapTransactionSchema = createInsertSchema(swapTransactions).omit({
  id: true,
  createdAt: true,
});

export type InsertSwapTransaction = z.infer<typeof insertSwapTransactionSchema>;
export type SwapTransaction = typeof swapTransactions.$inferSelect;

// ============================================
// NFT MARKETPLACE
// ============================================

export const nftCollections = pgTable("nft_collections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  symbol: text("symbol").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  bannerUrl: text("banner_url"),
  creatorId: text("creator_id"),
  floorPrice: text("floor_price").notNull().default("0"),
  totalVolume: text("total_volume").notNull().default("0"),
  itemCount: integer("item_count").notNull().default(0),
  ownerCount: integer("owner_count").notNull().default(0),
  isVerified: boolean("is_verified").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertNftCollectionSchema = createInsertSchema(nftCollections).omit({
  id: true,
  createdAt: true,
});

export type InsertNftCollection = z.infer<typeof insertNftCollectionSchema>;
export type NftCollection = typeof nftCollections.$inferSelect;

export const nfts = pgTable("nfts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tokenId: text("token_id").notNull(),
  collectionId: text("collection_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  attributes: text("attributes"), // JSON string of traits
  ownerId: text("owner_id"),
  creatorId: text("creator_id"),
  mintTxHash: text("mint_tx_hash"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertNftSchema = createInsertSchema(nfts).omit({
  id: true,
  createdAt: true,
});

export type InsertNft = z.infer<typeof insertNftSchema>;
export type Nft = typeof nfts.$inferSelect;

export const nftListings = pgTable("nft_listings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nftId: text("nft_id").notNull(),
  sellerId: text("seller_id").notNull(),
  price: text("price").notNull(),
  currency: text("currency").notNull().default("SIG"),
  status: text("status").notNull().default("active"), // active, sold, cancelled
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertNftListingSchema = createInsertSchema(nftListings).omit({
  id: true,
  createdAt: true,
});

export type InsertNftListing = z.infer<typeof insertNftListingSchema>;
export type NftListing = typeof nftListings.$inferSelect;

// ============================================
// TOKEN LAUNCHPAD
// ============================================

export const launchedTokens = pgTable("launched_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  symbol: text("symbol").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  totalSupply: text("total_supply").notNull(),
  decimals: integer("decimals").notNull().default(18),
  creatorId: text("creator_id").notNull(),
  creatorAddress: text("creator_address").notNull(),
  contractAddress: text("contract_address"),
  initialPrice: text("initial_price").notNull().default("0.001"),
  currentPrice: text("current_price").notNull().default("0.001"),
  marketCap: text("market_cap").notNull().default("0"),
  holders: integer("holders").notNull().default(1),
  website: text("website"),
  twitter: text("twitter"),
  telegram: text("telegram"),
  status: text("status").notNull().default("pending"), // pending, live, paused, ended
  launchType: text("launch_type").notNull().default("fair"), // fair, presale, auction
  txHash: text("tx_hash"),
  // Auto-liquidity settings
  autoLiquidityPercent: integer("auto_liquidity_percent").notNull().default(75), // 50-100%
  lpLockDays: integer("lp_lock_days").notNull().default(90), // LP token lock duration
  platformFeePercent: text("platform_fee_percent").notNull().default("2.5"), // DarkWave fee
  // Raised funds tracking
  raisedAmount: text("raised_amount").notNull().default("0"),
  softCap: text("soft_cap").notNull().default("1000"),
  hardCap: text("hard_cap").notNull().default("100000"),
  // Auto-created liquidity pool
  liquidityPoolId: text("liquidity_pool_id"),
  lpTokensLocked: text("lp_tokens_locked").notNull().default("0"),
  lpUnlockDate: timestamp("lp_unlock_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  launchedAt: timestamp("launched_at"),
});

export const insertLaunchedTokenSchema = createInsertSchema(launchedTokens).omit({
  id: true,
  createdAt: true,
  launchedAt: true,
  liquidityPoolId: true,
  lpTokensLocked: true,
  lpUnlockDate: true,
}).extend({
  autoLiquidityPercent: z.number().min(50).max(95).default(75),
  lpLockDays: z.number().min(30).max(365).default(90),
  softCap: z.string().default("1000"),
  hardCap: z.string().default("100000"),
});

export type InsertLaunchedToken = z.infer<typeof insertLaunchedTokenSchema>;
export type LaunchedToken = typeof launchedTokens.$inferSelect;

// ============================================
// LIQUIDITY POOLS
// ============================================

export const liquidityPools = pgTable("liquidity_pools", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tokenA: text("token_a").notNull(),
  tokenB: text("token_b").notNull(),
  reserveA: text("reserve_a").notNull().default("0"),
  reserveB: text("reserve_b").notNull().default("0"),
  totalLpTokens: text("total_lp_tokens").notNull().default("0"),
  fee: text("fee").notNull().default("0.003"),
  apr: text("apr").notNull().default("0"),
  volume24h: text("volume_24h").notNull().default("0"),
  tvl: text("tvl").notNull().default("0"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertLiquidityPoolSchema = createInsertSchema(liquidityPools).omit({
  id: true,
  createdAt: true,
});

export type InsertLiquidityPool = z.infer<typeof insertLiquidityPoolSchema>;
export type LiquidityPool = typeof liquidityPools.$inferSelect;

export const liquidityPositions = pgTable("liquidity_positions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  poolId: text("pool_id").notNull(),
  lpTokens: text("lp_tokens").notNull().default("0"),
  tokenADeposited: text("token_a_deposited").notNull().default("0"),
  tokenBDeposited: text("token_b_deposited").notNull().default("0"),
  earnedFees: text("earned_fees").notNull().default("0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertLiquidityPositionSchema = createInsertSchema(liquidityPositions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertLiquidityPosition = z.infer<typeof insertLiquidityPositionSchema>;
export type LiquidityPosition = typeof liquidityPositions.$inferSelect;

// ============================================
// PRICE HISTORY
// ============================================

export const priceHistory = pgTable("price_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  token: text("token").notNull(),
  price: text("price").notNull(),
  volume: text("volume").notNull().default("0"),
  marketCap: text("market_cap").notNull().default("0"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertPriceHistorySchema = createInsertSchema(priceHistory).omit({
  id: true,
});

export type InsertPriceHistory = z.infer<typeof insertPriceHistorySchema>;
export type PriceHistory = typeof priceHistory.$inferSelect;

// ============================================
// WEBHOOKS / EVENTS API
// ============================================

export const webhooks = pgTable("webhooks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  url: text("url").notNull(),
  secret: text("secret").notNull(),
  events: text("events").notNull(), // JSON array of event types
  isActive: boolean("is_active").notNull().default(true),
  failureCount: integer("failure_count").notNull().default(0),
  lastTriggeredAt: timestamp("last_triggered_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertWebhookSchema = createInsertSchema(webhooks).omit({
  id: true,
  createdAt: true,
  lastTriggeredAt: true,
});

export type InsertWebhook = z.infer<typeof insertWebhookSchema>;
export type Webhook = typeof webhooks.$inferSelect;

export const webhookLogs = pgTable("webhook_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  webhookId: text("webhook_id").notNull(),
  event: text("event").notNull(),
  payload: text("payload").notNull(),
  responseStatus: integer("response_status"),
  responseBody: text("response_body"),
  success: boolean("success").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertWebhookLogSchema = createInsertSchema(webhookLogs).omit({
  id: true,
  createdAt: true,
});

export type InsertWebhookLog = z.infer<typeof insertWebhookLogSchema>;
export type WebhookLog = typeof webhookLogs.$inferSelect;

// ============================================
// LIQUID STAKING (stSIG)
// ============================================

export const liquidStakingState = pgTable("liquid_staking_state", {
  id: varchar("id").primaryKey().default("main"),
  totalDwtStaked: text("total_dwt_staked").notNull().default("0"),
  totalStDwtSupply: text("total_st_dwt_supply").notNull().default("0"),
  exchangeRate: text("exchange_rate").notNull().default("1000000000000000000"),
  targetApy: text("target_apy").notNull().default("12"),
  lastAccruedAt: timestamp("last_accrued_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertLiquidStakingStateSchema = createInsertSchema(liquidStakingState).omit({
  updatedAt: true,
});

export type InsertLiquidStakingState = z.infer<typeof insertLiquidStakingStateSchema>;
export type LiquidStakingState = typeof liquidStakingState.$inferSelect;

export const liquidStakingPositions = pgTable("liquid_staking_positions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  stakedDwt: text("staked_dwt").notNull().default("0"),
  stDwtBalance: text("st_dwt_balance").notNull().default("0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertLiquidStakingPositionSchema = createInsertSchema(liquidStakingPositions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertLiquidStakingPosition = z.infer<typeof insertLiquidStakingPositionSchema>;
export type LiquidStakingPosition = typeof liquidStakingPositions.$inferSelect;

export const liquidStakingEvents = pgTable("liquid_staking_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  eventType: text("event_type").notNull(),
  dwtAmount: text("dwt_amount").notNull(),
  stDwtAmount: text("st_dwt_amount").notNull(),
  exchangeRate: text("exchange_rate").notNull(),
  txHash: text("tx_hash"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertLiquidStakingEventSchema = createInsertSchema(liquidStakingEvents).omit({
  id: true,
  createdAt: true,
});

export type InsertLiquidStakingEvent = z.infer<typeof insertLiquidStakingEventSchema>;
export type LiquidStakingEvent = typeof liquidStakingEvents.$inferSelect;

// ============================================
// BETA TESTERS & AIRDROP SYSTEM
// ============================================

export const betaTesterTiers = pgTable("beta_tester_tiers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  description: text("description"),
  allocation: text("allocation").notNull().default("0"),
  multiplier: text("multiplier").notNull().default("1"),
  maxMembers: integer("max_members"),
  benefits: text("benefits"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertBetaTesterTierSchema = createInsertSchema(betaTesterTiers).omit({
  id: true,
  createdAt: true,
});

export type InsertBetaTesterTier = z.infer<typeof insertBetaTesterTierSchema>;
export type BetaTesterTier = typeof betaTesterTiers.$inferSelect;

export const betaTesters = pgTable("beta_testers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id"),
  email: text("email"),
  walletAddress: text("wallet_address"),
  tierId: varchar("tier_id").references(() => betaTesterTiers.id),
  status: text("status").notNull().default("pending"),
  contributionScore: integer("contribution_score").notNull().default(0),
  contributionNotes: text("contribution_notes"),
  referralCode: text("referral_code"),
  referredBy: text("referred_by"),
  addedBy: text("added_by"),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertBetaTesterSchema = createInsertSchema(betaTesters).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  approvedAt: true,
});

export type InsertBetaTester = z.infer<typeof insertBetaTesterSchema>;
export type BetaTester = typeof betaTesters.$inferSelect;

export const airdropAllocations = pgTable("airdrop_allocations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  category: text("category").notNull().default("genesis"),
  totalAmount: text("total_amount").notNull().default("0"),
  claimedAmount: text("claimed_amount").notNull().default("0"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  isActive: boolean("is_active").notNull().default(false),
  requiresWhitelist: boolean("requires_whitelist").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAirdropAllocationSchema = createInsertSchema(airdropAllocations).omit({
  id: true,
  createdAt: true,
});

export type InsertAirdropAllocation = z.infer<typeof insertAirdropAllocationSchema>;
export type AirdropAllocation = typeof airdropAllocations.$inferSelect;

export const airdropClaims = pgTable("airdrop_claims", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  allocationId: varchar("allocation_id").references(() => airdropAllocations.id),
  userId: text("user_id"),
  walletAddress: text("wallet_address"),
  amount: text("amount").notNull().default("0"),
  status: text("status").notNull().default("pending"),
  claimTxHash: text("claim_tx_hash"),
  claimedAt: timestamp("claimed_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAirdropClaimSchema = createInsertSchema(airdropClaims).omit({
  id: true,
  createdAt: true,
  claimedAt: true,
});

export type InsertAirdropClaim = z.infer<typeof insertAirdropClaimSchema>;
export type AirdropClaim = typeof airdropClaims.$inferSelect;

export const tokenGifts = pgTable("token_gifts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  recipientUserId: text("recipient_user_id"),
  recipientEmail: text("recipient_email"),
  recipientWallet: text("recipient_wallet"),
  recipientName: text("recipient_name"),
  amount: text("amount").notNull().default("0"),
  reason: text("reason"),
  category: text("category").notNull().default("gift"),
  status: text("status").notNull().default("pending"),
  grantedBy: text("granted_by"),
  claimTxHash: text("claim_tx_hash"),
  claimedAt: timestamp("claimed_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTokenGiftSchema = createInsertSchema(tokenGifts).omit({
  id: true,
  createdAt: true,
  claimedAt: true,
});

export type InsertTokenGift = z.infer<typeof insertTokenGiftSchema>;
export type TokenGift = typeof tokenGifts.$inferSelect;

export const userXp = pgTable("user_xp", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  walletAddress: text("wallet_address"),
  totalXp: integer("total_xp").notNull().default(0),
  level: integer("level").notNull().default(1),
  currentLevelXp: integer("current_level_xp").notNull().default(0),
  nextLevelXp: integer("next_level_xp").notNull().default(100),
  tier: text("tier").notNull().default("bronze"),
  streakDays: integer("streak_days").notNull().default(0),
  lastActivityAt: timestamp("last_activity_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserXpSchema = createInsertSchema(userXp).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUserXp = z.infer<typeof insertUserXpSchema>;
export type UserXp = typeof userXp.$inferSelect;

export const quests = pgTable("quests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull().default("general"),
  xpReward: integer("xp_reward").notNull().default(10),
  tokenReward: text("token_reward").default("0"),
  icon: text("icon").default("star"),
  difficulty: text("difficulty").notNull().default("easy"),
  actionType: text("action_type").notNull(),
  actionTarget: text("action_target"),
  requiredCount: integer("required_count").notNull().default(1),
  isRepeatable: boolean("is_repeatable").notNull().default(false),
  cooldownHours: integer("cooldown_hours"),
  isActive: boolean("is_active").notNull().default(true),
  startsAt: timestamp("starts_at"),
  endsAt: timestamp("ends_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertQuestSchema = createInsertSchema(quests).omit({
  id: true,
  createdAt: true,
});

export type InsertQuest = z.infer<typeof insertQuestSchema>;
export type Quest = typeof quests.$inferSelect;

export const protocolMissions = pgTable("protocol_missions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  goal: text("goal").notNull(),
  currentProgress: text("current_progress").notNull().default("0"),
  targetProgress: text("target_progress").notNull(),
  rewardPool: text("reward_pool").notNull().default("0"),
  participantCount: integer("participant_count").notNull().default(0),
  status: text("status").notNull().default("active"),
  startsAt: timestamp("starts_at").notNull(),
  endsAt: timestamp("ends_at").notNull(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertProtocolMissionSchema = createInsertSchema(protocolMissions).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export type InsertProtocolMission = z.infer<typeof insertProtocolMissionSchema>;
export type ProtocolMission = typeof protocolMissions.$inferSelect;

export const socialLeaderboard = pgTable("social_leaderboard", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  totalVolume: text("total_volume").notNull().default("0"),
  totalTrades: integer("total_trades").notNull().default(0),
  profitLoss: text("profit_loss").notNull().default("0"),
  winRate: text("win_rate").notNull().default("0"),
  totalXp: integer("total_xp").notNull().default(0),
  rank: integer("rank"),
  tier: text("tier").notNull().default("bronze"),
  isPublic: boolean("is_public").notNull().default(true),
  referralCode: text("referral_code"),
  referralCount: integer("referral_count").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSocialLeaderboardSchema = createInsertSchema(socialLeaderboard).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSocialLeaderboard = z.infer<typeof insertSocialLeaderboardSchema>;
export type SocialLeaderboard = typeof socialLeaderboard.$inferSelect;

// Legacy Founder Program - Trust Layer Early Adopters
export const legacyFounders = pgTable("legacy_founders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull(),
  walletAddress: text("wallet_address"),
  paymentMethod: text("payment_method").notNull(), // 'stripe' or 'coinbase'
  paymentId: text("payment_id"), // Stripe session ID or Coinbase charge ID
  amountPaidCents: integer("amount_paid_cents").notNull().default(2400), // $24.00
  status: text("status").notNull().default("pending"), // pending, paid, airdrop_pending, completed
  airdropAmount: text("airdrop_amount").notNull().default("35000000000000000000000"), // 35,000 SIG (18 decimals)
  airdropTxHash: text("airdrop_tx_hash"),
  founderNumber: serial("founder_number"),
  referralCode: text("referral_code"),
  referredBy: text("referred_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  paidAt: timestamp("paid_at"),
  airdropDeliveredAt: timestamp("airdrop_delivered_at"),
});

export const insertLegacyFounderSchema = createInsertSchema(legacyFounders).omit({
  id: true,
  founderNumber: true,
  createdAt: true,
  paidAt: true,
  airdropDeliveredAt: true,
});

export type InsertLegacyFounder = z.infer<typeof insertLegacyFounderSchema>;
export type LegacyFounder = typeof legacyFounders.$inferSelect;

// Token allocation for transparency page
export const TOKEN_ALLOCATION = {
  publicSale: { amount: 40_000_000, percentage: 40, vesting: "None" },
  team: { amount: 15_000_000, percentage: 15, vesting: "6-month cliff, 12-month vest" },
  development: { amount: 20_000_000, percentage: 20, vesting: "Unlocked as needed" },
  marketing: { amount: 10_000_000, percentage: 10, vesting: "Unlocked" },
  liquidity: { amount: 10_000_000, percentage: 10, vesting: "Locked in DEX" },
  reserve: { amount: 5_000_000, percentage: 5, vesting: "12-month lock" },
} as const;

export const LEGACY_FOUNDER_CONFIG = {
  priceUsd: 24,
  priceCents: 2400,
  airdropTokens: 35000,
  maxSpots: 10000,
  deadline: new Date("2026-04-11T00:00:00Z"),
  regularPriceMonthly: 20,
  perks: [
    "Unlimited AI analysis (crypto & stocks)",
    "StrikeAgent sniper bot access",
    "Founding member badge",
    "Priority access to SIG staking pools",
    "Early access to all new features",
    "35,000 SIG token airdrop on launch",
    "No recurring billing after initial payment",
  ],
} as const;

export const APP_VERSION = "1.2.57";

export const referralTracking = pgTable("referral_tracking", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  referrerId: text("referrer_id").notNull(),
  referrerEmail: text("referrer_email"),
  referralCode: text("referral_code").notNull(),
  referredUserId: text("referred_user_id"),
  referredEmail: text("referred_email").notNull(),
  referralType: text("referral_type").notNull().default("founder"),
  status: text("status").notNull().default("pending"),
  bonusAmount: text("bonus_amount").notNull().default("0"),
  bonusPaid: boolean("bonus_paid").notNull().default(false),
  bonusTxHash: text("bonus_tx_hash"),
  convertedAt: timestamp("converted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertReferralTrackingSchema = createInsertSchema(referralTracking).omit({
  id: true,
  createdAt: true,
  convertedAt: true,
});

export type InsertReferralTracking = z.infer<typeof insertReferralTrackingSchema>;
export type ReferralTracking = typeof referralTracking.$inferSelect;

export const emailPreferences = pgTable("email_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull().unique(),
  email: text("email").notNull(),
  stakingRewards: boolean("staking_rewards").notNull().default(true),
  largeTransfers: boolean("large_transfers").notNull().default(true),
  bridgeNotifications: boolean("bridge_notifications").notNull().default(true),
  referralBonuses: boolean("referral_bonuses").notNull().default(true),
  securityAlerts: boolean("security_alerts").notNull().default(true),
  marketingUpdates: boolean("marketing_updates").notNull().default(false),
  weeklyDigest: boolean("weekly_digest").notNull().default(true),
  largeTransferThreshold: text("large_transfer_threshold").notNull().default("10000"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertEmailPreferencesSchema = createInsertSchema(emailPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertEmailPreferences = z.infer<typeof insertEmailPreferencesSchema>;
export type EmailPreferences = typeof emailPreferences.$inferSelect;

export const gameSubmissions = pgTable("game_submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  gameName: text("game_name").notNull(),
  description: text("description").notNull(),
  repoUrl: text("repo_url").notNull(),
  status: text("status").notNull().default("pending"),
  securityScore: integer("security_score"),
  fairnessScore: integer("fairness_score"),
  performanceScore: integer("performance_score"),
  uxScore: integer("ux_score"),
  codeQualityScore: integer("code_quality_score"),
  overallScore: integer("overall_score"),
  aiReview: text("ai_review"),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertGameSubmissionSchema = createInsertSchema(gameSubmissions).omit({
  id: true,
  createdAt: true,
  reviewedAt: true,
  securityScore: true,
  fairnessScore: true,
  performanceScore: true,
  uxScore: true,
  codeQualityScore: true,
  overallScore: true,
  aiReview: true,
  status: true,
});

export type InsertGameSubmission = z.infer<typeof insertGameSubmissionSchema>;
export type GameSubmission = typeof gameSubmissions.$inferSelect;

export const crashRounds = pgTable("crash_rounds", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roundNumber: serial("round_number"),
  serverSeed: text("server_seed").notNull(),
  serverSeedHash: text("server_seed_hash").notNull(),
  crashPoint: text("crash_point"),
  totalBets: text("total_bets").default("0"),
  totalPayout: text("total_payout").default("0"),
  status: text("status").notNull().default("pending"),
  startedAt: timestamp("started_at"),
  crashedAt: timestamp("crashed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const crashBets = pgTable("crash_bets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roundId: text("round_id").notNull(),
  oderId: text("user_id").notNull(),
  username: text("username").notNull(),
  betAmount: text("bet_amount").notNull(),
  autoCashout: text("auto_cashout"),
  cashoutMultiplier: text("cashout_multiplier"),
  payout: text("payout"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const gameChatMessages = pgTable("game_chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  gameType: text("game_type").notNull(),
  userId: text("user_id").notNull(),
  username: text("username").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const playerRewards = pgTable("player_rewards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  oderId: text("user_id").notNull(),
  pendingRewards: text("pending_rewards").notNull().default("0"),
  totalEarned: text("total_earned").notNull().default("0"),
  totalClaimed: text("total_claimed").notNull().default("0"),
  tier: text("tier").notNull().default("bronze"),
  totalWagered: text("total_wagered").notNull().default("0"),
  gamesPlayed: integer("games_played").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const gameAirdrops = pgTable("game_airdrops", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  poolAmount: text("pool_amount").notNull(),
  participantCount: integer("participant_count").notNull(),
  status: text("status").notNull().default("pending"),
  distributedAt: timestamp("distributed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type CrashRound = typeof crashRounds.$inferSelect;
export type CrashBet = typeof crashBets.$inferSelect;
export type GameChatMessage = typeof gameChatMessages.$inferSelect;
export type PlayerRewards = typeof playerRewards.$inferSelect;
export type GameAirdrop = typeof gameAirdrops.$inferSelect;

// Signal Chat - Ecosystem Identity & Messaging
export const chatUsers = pgTable("chat_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name").notNull(),
  avatarColor: text("avatar_color").notNull().default("#06b6d4"),
  role: text("role").notNull().default("member"),
  trustLayerId: text("trust_layer_id").unique(),
  isOnline: boolean("is_online").default(false),
  lastSeen: timestamp("last_seen").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const chatChannels = pgTable("chat_channels", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  description: text("description"),
  category: text("category").notNull().default("ecosystem"),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  channelId: varchar("channel_id").notNull().references(() => chatChannels.id),
  userId: varchar("user_id").notNull().references(() => chatUsers.id),
  content: text("content").notNull(),
  replyToId: varchar("reply_to_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertChatUserSchema = createInsertSchema(chatUsers).omit({ id: true, isOnline: true, lastSeen: true, createdAt: true });
export const insertChatChannelSchema = createInsertSchema(chatChannels).omit({ id: true, createdAt: true });
export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({ id: true, createdAt: true });

export type ChatUser = typeof chatUsers.$inferSelect;
export type InsertChatUser = z.infer<typeof insertChatUserSchema>;
export type ChatChannel = typeof chatChannels.$inferSelect;
export type InsertChatChannel = z.infer<typeof insertChatChannelSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;

// Player Gaming Stats - Complete History
export const playerGameHistory = pgTable("player_game_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  username: text("username").notNull(),
  gameType: text("game_type").notNull(), // crash, coinflip, slots
  betAmount: text("bet_amount").notNull(),
  multiplier: text("multiplier"), // for crash
  payout: text("payout").notNull(),
  profit: text("profit").notNull(), // can be negative
  outcome: text("outcome").notNull(), // win, loss, push
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPlayerGameHistorySchema = createInsertSchema(playerGameHistory).omit({
  id: true,
  createdAt: true,
});

export type InsertPlayerGameHistory = z.infer<typeof insertPlayerGameHistorySchema>;
export type PlayerGameHistory = typeof playerGameHistory.$inferSelect;

// Player Stats Summary - Aggregated data
export const playerStats = pgTable("player_stats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull().unique(),
  username: text("username").notNull(),
  totalGamesPlayed: integer("total_games_played").notNull().default(0),
  totalWagered: text("total_wagered").notNull().default("0"),
  totalWon: text("total_won").notNull().default("0"),
  totalLost: text("total_lost").notNull().default("0"),
  netProfit: text("net_profit").notNull().default("0"),
  winCount: integer("win_count").notNull().default(0),
  lossCount: integer("loss_count").notNull().default(0),
  winRate: text("win_rate").notNull().default("0"),
  bestMultiplier: text("best_multiplier").notNull().default("0"),
  currentStreak: integer("current_streak").notNull().default(0),
  bestStreak: integer("best_streak").notNull().default(0),
  level: integer("level").notNull().default(1),
  xp: integer("xp").notNull().default(0),
  xpToNextLevel: integer("xp_to_next_level").notNull().default(100),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
  lastPlayedAt: timestamp("last_played_at"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPlayerStatsSchema = createInsertSchema(playerStats).omit({
  id: true,
  joinedAt: true,
  updatedAt: true,
});

export type InsertPlayerStats = z.infer<typeof insertPlayerStatsSchema>;
export type PlayerStats = typeof playerStats.$inferSelect;

// Daily Profit Tracking for Charts
export const playerDailyProfit = pgTable("player_daily_profit", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  date: text("date").notNull(), // YYYY-MM-DD
  gamesPlayed: integer("games_played").notNull().default(0),
  wagered: text("wagered").notNull().default("0"),
  profit: text("profit").notNull().default("0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type PlayerDailyProfit = typeof playerDailyProfit.$inferSelect;

// ============================================
// SWEEPSTAKES SYSTEM (GC/SC)
// ============================================

// User sweepstakes balances
export const sweepsBalances = pgTable("sweeps_balances", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull().unique(),
  goldCoins: text("gold_coins").notNull().default("0"), // Purchased, no cash value
  sweepsCoins: text("sweeps_coins").notNull().default("0"), // Free bonus, redeemable
  totalGcPurchased: text("total_gc_purchased").notNull().default("0"),
  totalScEarned: text("total_sc_earned").notNull().default("0"),
  totalScRedeemed: text("total_sc_redeemed").notNull().default("0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSweepsBalanceSchema = createInsertSchema(sweepsBalances).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type SweepsBalance = typeof sweepsBalances.$inferSelect;
export type InsertSweepsBalance = z.infer<typeof insertSweepsBalanceSchema>;

// Coin pack purchases
export const sweepsPurchases = pgTable("sweeps_purchases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  packId: text("pack_id").notNull(), // starter, value, mega, whale
  packName: text("pack_name").notNull(),
  priceUsd: text("price_usd").notNull(),
  goldCoinsAmount: text("gold_coins_amount").notNull(),
  sweepsCoinsBonus: text("sweeps_coins_bonus").notNull(), // Free SC included
  stripePaymentId: text("stripe_payment_id"),
  status: text("status").notNull().default("pending"), // pending, completed, failed, refunded
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSweepsPurchaseSchema = createInsertSchema(sweepsPurchases).omit({
  id: true,
  createdAt: true,
});

export type SweepsPurchase = typeof sweepsPurchases.$inferSelect;
export type InsertSweepsPurchase = z.infer<typeof insertSweepsPurchaseSchema>;

// Free SC bonuses (daily login, social, AMOE)
export const sweepsBonuses = pgTable("sweeps_bonuses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  bonusType: text("bonus_type").notNull(), // daily_login, social_share, amoe_mail, signup, streak
  sweepsCoinsAmount: text("sweeps_coins_amount").notNull(),
  goldCoinsAmount: text("gold_coins_amount").notNull().default("0"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSweepsBonusSchema = createInsertSchema(sweepsBonuses).omit({
  id: true,
  createdAt: true,
});

export type SweepsBonus = typeof sweepsBonuses.$inferSelect;
export type InsertSweepsBonus = z.infer<typeof insertSweepsBonusSchema>;

// Daily login tracking
export const sweepsDailyLogin = pgTable("sweeps_daily_login", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  loginDate: text("login_date").notNull(), // YYYY-MM-DD
  streakDay: integer("streak_day").notNull().default(1), // 1-7 for weekly streak
  bonusClaimed: boolean("bonus_claimed").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type SweepsDailyLogin = typeof sweepsDailyLogin.$inferSelect;

// SC Redemptions to SIG
export const sweepsRedemptions = pgTable("sweeps_redemptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  sweepsCoinsAmount: text("sweeps_coins_amount").notNull(),
  dwcAmount: text("dwc_amount").notNull(), // 1:1 conversion
  walletAddress: text("wallet_address").notNull(),
  status: text("status").notNull().default("pending"), // pending, processing, completed, rejected
  kycVerified: boolean("kyc_verified").notNull().default(false),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSweepsRedemptionSchema = createInsertSchema(sweepsRedemptions).omit({
  id: true,
  createdAt: true,
  processedAt: true,
});

export type SweepsRedemption = typeof sweepsRedemptions.$inferSelect;
export type InsertSweepsRedemption = z.infer<typeof insertSweepsRedemptionSchema>;

// Game history for sweeps (tracks which currency used)
export const sweepsGameHistory = pgTable("sweeps_game_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  gameType: text("game_type").notNull(), // crash, coinflip, slots
  currencyType: text("currency_type").notNull(), // gc or sc
  betAmount: text("bet_amount").notNull(),
  multiplier: text("multiplier"),
  payout: text("payout").notNull(),
  profit: text("profit").notNull(),
  outcome: text("outcome").notNull(), // win, loss
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSweepsGameHistorySchema = createInsertSchema(sweepsGameHistory).omit({
  id: true,
  createdAt: true,
});

export type SweepsGameHistory = typeof sweepsGameHistory.$inferSelect;
export type InsertSweepsGameHistory = z.infer<typeof insertSweepsGameHistorySchema>;

// Coin pack definitions (not stored in DB, just types)
export const coinPackSchema = z.object({
  id: z.string(),
  name: z.string(),
  priceUsd: z.number(),
  goldCoins: z.number(),
  sweepsCoinsBonus: z.number(),
  popular: z.boolean().optional(),
  bestValue: z.boolean().optional(),
});

export type CoinPack = z.infer<typeof coinPackSchema>;

// ==================== SPADES CARD GAME ====================

// Spades games table
export const spadesGames = pgTable("spades_games", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  status: text("status").notNull().default("waiting"), // waiting, bidding, playing, finished
  gameMode: text("game_mode").notNull().default("vs_ai"), // vs_ai, multiplayer
  difficulty: text("difficulty").default("medium"), // easy, medium, hard (for AI games)
  targetScore: integer("target_score").notNull().default(500),
  currentRound: integer("current_round").notNull().default(1),
  currentTrick: integer("current_trick").notNull().default(1),
  currentPlayerIndex: integer("current_player_index").notNull().default(0),
  leadSuit: text("lead_suit"), // current trick's lead suit
  spadesbroken: boolean("spades_broken").notNull().default(false),
  team1Score: integer("team1_score").notNull().default(0),
  team2Score: integer("team2_score").notNull().default(0),
  team1Bags: integer("team1_bags").notNull().default(0),
  team2Bags: integer("team2_bags").notNull().default(0),
  team1RoundTricks: integer("team1_round_tricks").notNull().default(0),
  team2RoundTricks: integer("team2_round_tricks").notNull().default(0),
  team1Bid: integer("team1_bid"),
  team2Bid: integer("team2_bid"),
  cardsPlayed: text("cards_played").default("[]"), // JSON array of played cards in current trick
  winnerId: text("winner_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertSpadesGameSchema = createInsertSchema(spadesGames).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type SpadesGame = typeof spadesGames.$inferSelect;
export type InsertSpadesGame = z.infer<typeof insertSpadesGameSchema>;

// Spades players in a game
export const spadesPlayers = pgTable("spades_players", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  gameId: varchar("game_id").notNull(),
  oderId: text("user_id"), // null for AI players
  playerName: text("player_name").notNull(),
  isAI: boolean("is_ai").notNull().default(false),
  seatPosition: integer("seat_position").notNull(), // 0-3 (0=South/you, 1=West, 2=North/partner, 3=East)
  teamNumber: integer("team_number").notNull(), // 1 or 2 (positions 0,2 = team1, positions 1,3 = team2)
  hand: text("hand").default("[]"), // JSON array of cards
  bid: integer("bid"),
  tricksWon: integer("tricks_won").notNull().default(0),
  isConnected: boolean("is_connected").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSpadesPlayerSchema = createInsertSchema(spadesPlayers).omit({
  id: true,
  createdAt: true,
});

export type SpadesPlayer = typeof spadesPlayers.$inferSelect;
export type InsertSpadesPlayer = z.infer<typeof insertSpadesPlayerSchema>;

// Spades player stats (lifetime)
export const spadesStats = pgTable("spades_stats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  oderId: text("user_id").notNull().unique(),
  gamesPlayed: integer("games_played").notNull().default(0),
  gamesWon: integer("games_won").notNull().default(0),
  totalBids: integer("total_bids").notNull().default(0),
  bidsMade: integer("bids_made").notNull().default(0),
  nilBidsAttempted: integer("nil_bids_attempted").notNull().default(0),
  nilBidsSuccessful: integer("nil_bids_successful").notNull().default(0),
  blindNilsAttempted: integer("blind_nils_attempted").notNull().default(0),
  blindNilsSuccessful: integer("blind_nils_successful").notNull().default(0),
  totalBags: integer("total_bags").notNull().default(0),
  highestScore: integer("highest_score").notNull().default(0),
  currentStreak: integer("current_streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertSpadesStatsSchema = createInsertSchema(spadesStats).omit({
  id: true,
  updatedAt: true,
});

export type SpadesStats = typeof spadesStats.$inferSelect;
export type InsertSpadesStats = z.infer<typeof insertSpadesStatsSchema>;

// Card type for Spades
export const cardSchema = z.object({
  suit: z.enum(["spades", "hearts", "diamonds", "clubs"]),
  rank: z.enum(["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"]),
});

export type Card = z.infer<typeof cardSchema>;

// Development Roadmap Features - dual view (public & developer)
export const roadmapFeatures = pgTable("roadmap_features", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull().default("general"), // 'chronicles-estate', 'strategic', 'platform'
  status: text("status").notNull().default("pending"), // 'pending', 'in-progress', 'completed'
  priority: integer("priority").notNull().default(0),
  sortOrder: integer("sort_order").notNull().default(0),
  estimatedTime: text("estimated_time"),
  scheduledStart: timestamp("scheduled_start"),
  scheduledEnd: timestamp("scheduled_end"),
  visibility: text("visibility").notNull().default("public"), // 'public', 'internal'
  createdBy: text("created_by"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertRoadmapFeatureSchema = createInsertSchema(roadmapFeatures).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  completedAt: true,
});

export type RoadmapFeature = typeof roadmapFeatures.$inferSelect;
export type InsertRoadmapFeature = z.infer<typeof insertRoadmapFeatureSchema>;

export const roadmapVotes = pgTable("roadmap_votes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  featureId: varchar("feature_id").notNull().references(() => roadmapFeatures.id, { onDelete: "cascade" }),
  oderId: text("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertRoadmapVoteSchema = createInsertSchema(roadmapVotes).omit({
  id: true,
  createdAt: true,
});

export type RoadmapVote = typeof roadmapVotes.$inferSelect;
export type InsertRoadmapVote = z.infer<typeof insertRoadmapVoteSchema>;

// Crowdfunding System
export const crowdfundCampaigns = pgTable("crowdfund_campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  goalAmountCents: integer("goal_amount_cents").notNull().default(0),
  raisedAmountCents: integer("raised_amount_cents").notNull().default(0),
  currency: text("currency").notNull().default("USD"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCrowdfundCampaignSchema = createInsertSchema(crowdfundCampaigns).omit({
  id: true,
  raisedAmountCents: true,
  createdAt: true,
  updatedAt: true,
});

export type CrowdfundCampaign = typeof crowdfundCampaigns.$inferSelect;
export type InsertCrowdfundCampaign = z.infer<typeof insertCrowdfundCampaignSchema>;

export const crowdfundFeatures = pgTable("crowdfund_features", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").references(() => crowdfundCampaigns.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull().default("general"),
  goalAmountCents: integer("goal_amount_cents").notNull().default(0),
  raisedAmountCents: integer("raised_amount_cents").notNull().default(0),
  status: text("status").notNull().default("proposed"),
  priority: integer("priority").notNull().default(0),
  targetRelease: text("target_release"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCrowdfundFeatureSchema = createInsertSchema(crowdfundFeatures).omit({
  id: true,
  raisedAmountCents: true,
  createdAt: true,
  updatedAt: true,
});

export type CrowdfundFeature = typeof crowdfundFeatures.$inferSelect;
export type InsertCrowdfundFeature = z.infer<typeof insertCrowdfundFeatureSchema>;

export const crowdfundContributions = pgTable("crowdfund_contributions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").references(() => crowdfundCampaigns.id),
  featureId: varchar("feature_id").references(() => crowdfundFeatures.id),
  userId: text("user_id"),
  displayName: text("display_name"),
  amountCents: integer("amount_cents").notNull(),
  currency: text("currency").notNull().default("USD"),
  paymentMethod: text("payment_method").notNull().default("stripe"),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  cryptoTxHash: text("crypto_tx_hash"),
  transparencyHash: text("transparency_hash"),
  status: text("status").notNull().default("pending"),
  isAnonymous: boolean("is_anonymous").notNull().default(false),
  message: text("message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCrowdfundContributionSchema = createInsertSchema(crowdfundContributions).omit({
  id: true,
  transparencyHash: true,
  createdAt: true,
});

export type CrowdfundContribution = typeof crowdfundContributions.$inferSelect;
export type InsertCrowdfundContribution = z.infer<typeof insertCrowdfundContributionSchema>;

// Roadmap tables
export const roadmapPhases = pgTable("roadmap_phases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roadmapType: text("roadmap_type").notNull(), // "chronicles" or "ecosystem"
  name: text("name").notNull(),
  description: text("description").notNull(),
  order: integer("order").notNull().default(0),
  status: text("status").notNull().default("upcoming"), // upcoming, in_progress, completed
  targetDate: text("target_date"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertRoadmapPhaseSchema = createInsertSchema(roadmapPhases).omit({
  id: true,
  completedAt: true,
  createdAt: true,
});

export type RoadmapPhase = typeof roadmapPhases.$inferSelect;
export type InsertRoadmapPhase = z.infer<typeof insertRoadmapPhaseSchema>;

export const roadmapMilestones = pgTable("roadmap_milestones", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  phaseId: varchar("phase_id").references(() => roadmapPhases.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  order: integer("order").notNull().default(0),
  status: text("status").notNull().default("pending"), // pending, in_progress, completed
  isRequired: boolean("is_required").notNull().default(true),
  targetDate: text("target_date"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertRoadmapMilestoneSchema = createInsertSchema(roadmapMilestones).omit({
  id: true,
  completedAt: true,
  createdAt: true,
});

export type RoadmapMilestone = typeof roadmapMilestones.$inferSelect;
export type InsertRoadmapMilestone = z.infer<typeof insertRoadmapMilestoneSchema>;

// Token Presale tables
export const presalePurchases = pgTable("presale_purchases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id"),
  walletAddress: text("wallet_address"),
  buyerName: text("buyer_name"),
  email: text("email"),
  tokenAmount: integer("token_amount").notNull().default(0),
  usdAmountCents: integer("usd_amount_cents").notNull().default(0),
  paymentMethod: text("payment_method").notNull().default("stripe"),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  cryptoTxHash: text("crypto_tx_hash"),
  status: text("status").notNull().default("pending"),
  tier: text("tier").notNull().default("standard"),
  bonusPercentage: integer("bonus_percentage").notNull().default(0),
  referralCode: text("referral_code"),
  referredBy: text("referred_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPresalePurchaseSchema = createInsertSchema(presalePurchases).omit({
  id: true,
  createdAt: true,
});

export type PresalePurchase = typeof presalePurchases.$inferSelect;
export type InsertPresalePurchase = z.infer<typeof insertPresalePurchaseSchema>;

export const userTransactions = pgTable("user_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  amountCents: integer("amount_cents").notNull().default(0),
  tokenAmount: integer("token_amount"),
  txHash: text("tx_hash"),
  stripePaymentId: text("stripe_payment_id"),
  status: text("status").notNull().default("completed"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type UserTransaction = typeof userTransactions.$inferSelect;

export const presaleHolders = pgTable("presale_holders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletAddress: text("wallet_address").notNull().unique(),
  email: text("email"),
  totalTokens: integer("total_tokens").notNull().default(0),
  totalInvestedCents: integer("total_invested_cents").notNull().default(0),
  tier: text("tier").notNull().default("standard"),
  earlyAdopterRank: integer("early_adopter_rank"),
  bonusTokens: integer("bonus_tokens").notNull().default(0),
  referralCode: text("referral_code").unique(),
  referralCount: integer("referral_count").notNull().default(0),
  referralEarnings: integer("referral_earnings").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPresaleHolderSchema = createInsertSchema(presaleHolders).omit({
  id: true,
  earlyAdopterRank: true,
  createdAt: true,
  updatedAt: true,
});

export type PresaleHolder = typeof presaleHolders.$inferSelect;
export type InsertPresaleHolder = z.infer<typeof insertPresaleHolderSchema>;

// Blockchain Domain Service tables
export const blockchainDomains = pgTable("blockchain_domains", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(), // e.g., "alice" (without .tlid)
  tld: text("tld").notNull().default("tlid"), // top-level domain
  ownerAddress: text("owner_address").notNull(), // wallet address
  ownerUserId: text("owner_user_id"), // optional user ID
  registrationTxHash: text("registration_tx_hash"),
  registeredAt: timestamp("registered_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"), // null for lifetime ownership
  ownershipType: text("ownership_type").notNull().default("term"), // "term" or "lifetime"
  isPremium: boolean("is_premium").notNull().default(false),
  isProtected: boolean("is_protected").notNull().default(false), // reserved names
  primaryWallet: text("primary_wallet"), // default wallet resolution
  avatarUrl: text("avatar_url"),
  description: text("description"),
  website: text("website"),
  email: text("email"),
  twitter: text("twitter"),
  discord: text("discord"),
  telegram: text("telegram"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertBlockchainDomainSchema = createInsertSchema(blockchainDomains).omit({
  id: true,
  registeredAt: true,
  createdAt: true,
  updatedAt: true,
});

export type BlockchainDomain = typeof blockchainDomains.$inferSelect;
export type InsertBlockchainDomain = z.infer<typeof insertBlockchainDomainSchema>;

export const domainRecords = pgTable("domain_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  domainId: varchar("domain_id").notNull().references(() => blockchainDomains.id, { onDelete: "cascade" }),
  recordType: text("record_type").notNull(), // DNS: A, AAAA, CNAME, MX, TXT, URL, NS, SRV | Crypto: WALLET | Web3: CONTENT_HASH
  key: text("key").notNull(), // e.g., "@" for root, "www", "mail", or wallet types "eth", "sol", "btc"
  value: text("value").notNull(),
  ttl: integer("ttl").default(3600), // Time to live in seconds (default 1 hour)
  priority: integer("priority"), // For MX and SRV records
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertDomainRecordSchema = createInsertSchema(domainRecords).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type DomainRecord = typeof domainRecords.$inferSelect;
export type InsertDomainRecord = z.infer<typeof insertDomainRecordSchema>;

export const domainTransfers = pgTable("domain_transfers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  domainId: varchar("domain_id").notNull().references(() => blockchainDomains.id, { onDelete: "cascade" }),
  fromAddress: text("from_address").notNull(),
  toAddress: text("to_address").notNull(),
  txHash: text("tx_hash"),
  transferredAt: timestamp("transferred_at").defaultNow().notNull(),
});

export const insertDomainTransferSchema = createInsertSchema(domainTransfers).omit({
  id: true,
  transferredAt: true,
});

export type DomainTransfer = typeof domainTransfers.$inferSelect;
export type InsertDomainTransfer = z.infer<typeof insertDomainTransferSchema>;

// Domain pricing tiers
export const domainPricingSchema = z.object({
  length: z.number(), // character length
  priceUsd: z.number(), // annual price in USD
  priceDwc: z.number(), // annual price in SIG
});

export type DomainPricing = z.infer<typeof domainPricingSchema>;

// Chronicles Sponsorship System - Early Adopter Benefits
export const chronicleSponsorshipSlots = pgTable("chronicle_sponsorship_slots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eraId: text("era_id").notNull(), // Which historical era (e.g., "medieval", "renaissance")
  districtTier: text("district_tier").notNull(), // "prime", "signature", "emerging"
  locationName: text("location_name").notNull(), // Human-readable location name
  description: text("description"),
  capacity: integer("capacity").notNull().default(1), // How many businesses can share this slot
  currentOccupancy: integer("current_occupancy").notNull().default(0),
  status: text("status").notNull().default("available"), // "available", "claimed", "reserved"
  minimumDomainTier: text("minimum_domain_tier"), // Which domain tier qualifies ("ultra_premium", "premium", etc.)
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertChronicleSponsorshipSlotSchema = createInsertSchema(chronicleSponsorshipSlots).omit({
  id: true,
  currentOccupancy: true,
  createdAt: true,
  updatedAt: true,
});

export type ChronicleSponsorshipSlot = typeof chronicleSponsorshipSlots.$inferSelect;
export type InsertChronicleSponsorshipSlot = z.infer<typeof insertChronicleSponsorshipSlotSchema>;

// Domain sponsorship claims - links domains to sponsorship slots
export const domainSponsorshipClaims = pgTable("domain_sponsorship_claims", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  domainId: varchar("domain_id").notNull().references(() => blockchainDomains.id, { onDelete: "cascade" }),
  slotId: varchar("slot_id").notNull().references(() => chronicleSponsorshipSlots.id, { onDelete: "cascade" }),
  businessName: text("business_name"),
  businessUrl: text("business_url"),
  businessDescription: text("business_description"),
  verificationStatus: text("verification_status").notNull().default("pending"), // "pending", "verified", "rejected"
  activationDate: timestamp("activation_date"),
  expiryDate: timestamp("expiry_date"), // null for lifetime domain holders (36 months + renewal)
  engagementMetrics: text("engagement_metrics"), // JSON blob for impressions, clicks, conversions
  isEarlyAdopter: boolean("is_early_adopter").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertDomainSponsorshipClaimSchema = createInsertSchema(domainSponsorshipClaims).omit({
  id: true,
  verificationStatus: true,
  activationDate: true,
  engagementMetrics: true,
  createdAt: true,
  updatedAt: true,
});

export type DomainSponsorshipClaim = typeof domainSponsorshipClaims.$inferSelect;
export type InsertDomainSponsorshipClaim = z.infer<typeof insertDomainSponsorshipClaimSchema>;

// Early Adopter Program tracking
export const earlyAdopterProgram = pgTable("early_adopter_program", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  programName: text("program_name").notNull().default("Domain Launch"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  maxRegistrations: integer("max_registrations").notNull().default(5000),
  currentRegistrations: integer("current_registrations").notNull().default(0),
  discountPercent: integer("discount_percent").notNull().default(30),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type EarlyAdopterProgram = typeof earlyAdopterProgram.$inferSelect;

// Partner Access Requests - for studio partnership inquiries
export const partnerAccessRequests = pgTable("partner_access_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studioName: text("studio_name").notNull(),
  contactName: text("contact_name").notNull(),
  email: text("email").notNull(),
  website: text("website"),
  teamSize: text("team_size"),
  expertise: text("expertise"), // "graphics", "ai", "narrative", "full-stack", etc.
  previousProjects: text("previous_projects"),
  interestReason: text("interest_reason"),
  partnershipType: text("partnership_type"), // "co-dev", "graphics", "ai-tech"
  ndaAccepted: boolean("nda_accepted").notNull().default(false),
  status: text("status").notNull().default("pending"), // "pending", "approved", "rejected"
  accessCode: text("access_code"), // Generated on approval
  reviewedBy: text("reviewed_by"),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPartnerAccessRequestSchema = createInsertSchema(partnerAccessRequests).omit({
  id: true,
  status: true,
  accessCode: true,
  reviewedBy: true,
  reviewedAt: true,
  createdAt: true,
});

export type PartnerAccessRequest = typeof partnerAccessRequests.$inferSelect;
export type InsertPartnerAccessRequest = z.infer<typeof insertPartnerAccessRequestSchema>;

// Marketing Posts - Social media auto-deployment system
export const marketingPosts = pgTable("marketing_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  platform: text("platform").notNull(), // "twitter", "facebook", "telegram", "discord"
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  category: text("category").notNull().default("general"), // "vision", "tech", "community", "hype", "news"
  status: text("status").notNull().default("active"), // "active", "used", "archived"
  usedCount: integer("used_count").notNull().default(0),
  lastUsedAt: timestamp("last_used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMarketingPostSchema = createInsertSchema(marketingPosts).omit({
  id: true,
  usedCount: true,
  lastUsedAt: true,
  createdAt: true,
});

export type MarketingPost = typeof marketingPosts.$inferSelect;
export type InsertMarketingPost = z.infer<typeof insertMarketingPostSchema>;

// Marketing Deploy Logs - Track what was posted and when
export const marketingDeployLogs = pgTable("marketing_deploy_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").notNull(),
  platform: text("platform").notNull(),
  status: text("status").notNull().default("pending"), // "pending", "success", "failed"
  externalId: text("external_id"), // Tweet ID, Telegram message ID, etc.
  errorMessage: text("error_message"),
  deployedAt: timestamp("deployed_at").defaultNow().notNull(),
});

export const insertMarketingDeployLogSchema = createInsertSchema(marketingDeployLogs).omit({
  id: true,
  deployedAt: true,
});

export type MarketingDeployLog = typeof marketingDeployLogs.$inferSelect;
export type InsertMarketingDeployLog = z.infer<typeof insertMarketingDeployLogSchema>;

// Marketing Schedule Config - Platform settings and timing
export const marketingScheduleConfig = pgTable("marketing_schedule_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  platform: text("platform").notNull().unique(), // "twitter", "facebook", "telegram", "discord"
  isActive: boolean("is_active").notNull().default(false),
  intervalMinutes: integer("interval_minutes").notNull().default(180), // Default 3 hours
  lastDeployedAt: timestamp("last_deployed_at"),
  webhookUrl: text("webhook_url"), // For Discord
  channelId: text("channel_id"), // For Telegram
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type MarketingScheduleConfig = typeof marketingScheduleConfig.$inferSelect;

// =====================================================
// CHRONICLES PERSONALITY AI SYSTEM
// =====================================================
// The Personality AI adapts to become the player's "parallel self"
// in the DarkWave Chronicles fantasy world. It learns from:
// - Player choices and actions
// - Stated beliefs and values
// - Emotional responses to scenarios
// - Play style and decision patterns
//
// The AI uses a 5-Axis Emotion System:
// 1. Courage ↔ Fear
// 2. Hope ↔ Despair  
// 3. Trust ↔ Suspicion
// 4. Passion ↔ Apathy
// 5. Wisdom ↔ Recklessness
//
// The Belief System Layer tracks:
// - Worldview (optimist/realist/pessimist)
// - Moral compass (lawful/neutral/chaotic × good/neutral/evil)
// - Core values (justice, freedom, power, knowledge, love, etc.)
// - Political alignment (within game world factions)
// =====================================================

export const playerPersonalities = pgTable("player_personalities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull().unique(),
  
  // Identity
  playerName: text("player_name").notNull().default("Hero"),
  parallelSelfName: text("parallel_self_name"), // Name in Chronicles world
  
  // 5-Axis Emotion System (-100 to +100)
  courageFear: integer("courage_fear").notNull().default(0), // Positive = courage, Negative = fear
  hopeDespair: integer("hope_despair").notNull().default(0), // Positive = hope, Negative = despair
  trustSuspicion: integer("trust_suspicion").notNull().default(0), // Positive = trust, Negative = suspicion
  passionApathy: integer("passion_apathy").notNull().default(0), // Positive = passion, Negative = apathy
  wisdomRecklessness: integer("wisdom_recklessness").notNull().default(0), // Positive = wisdom, Negative = recklessness
  
  // Belief System Layer
  worldview: text("worldview").notNull().default("realist"), // "optimist", "realist", "pessimist"
  moralAlignment: text("moral_alignment").notNull().default("neutral_good"), // D&D style alignment
  coreValues: text("core_values").array().notNull().default(sql`'{}'::text[]`), // ["justice", "freedom", etc.]
  factionAffinity: text("faction_affinity"), // Which Chronicles faction they lean toward
  
  // Play Style Traits
  decisionStyle: text("decision_style").notNull().default("balanced"), // "impulsive", "analytical", "balanced", "intuitive"
  conflictApproach: text("conflict_approach").notNull().default("diplomatic"), // "aggressive", "diplomatic", "avoidant", "strategic"
  explorationStyle: text("exploration_style").notNull().default("thorough"), // "speedrun", "thorough", "completionist", "story_focused"
  
  // Personality Insights (AI-generated summaries)
  personalitySummary: text("personality_summary"),
  strengthsWeaknesses: text("strengths_weaknesses"),
  predictedArchetype: text("predicted_archetype"), // "Guardian", "Seeker", "Rebel", etc.
  
  // Season Zero Onboarding
  primaryTrait: text("primary_trait"), // leader, builder, explorer, diplomat, scholar, protector
  secondaryTrait: text("secondary_trait"),
  colorPreference: text("color_preference"), // blue, green, purple, gold, red, silver
  eraInterest: text("era_interest"), // ancient, medieval, renaissance, exploration, industrial, modern
  challengeResponse: text("challenge_response"), // persevere, adapt, collaborate, reflect
  
  // Audio Preferences
  audioPreference: text("audio_preference").default("curated"), // curated, spotify, silent
  audioMood: text("audio_mood"), // epic, calm, medieval, electronic, nature
  spotifyPlaylistId: text("spotify_playlist_id"), // User's chosen Spotify playlist
  
  // Learning Data
  totalChoicesMade: integer("total_choices_made").notNull().default(0),
  lastInteractionAt: timestamp("last_interaction_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPlayerPersonalitySchema = createInsertSchema(playerPersonalities).omit({
  id: true,
  totalChoicesMade: true,
  lastInteractionAt: true,
  createdAt: true,
  updatedAt: true,
});

export type PlayerPersonality = typeof playerPersonalities.$inferSelect;
export type InsertPlayerPersonality = z.infer<typeof insertPlayerPersonalitySchema>;

// Player Choice History - Tracks decisions for personality learning
export const playerChoices = pgTable("player_choices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  personalityId: varchar("personality_id").notNull(),
  
  // Context
  scenarioType: text("scenario_type").notNull(), // "moral_dilemma", "combat", "social", "exploration"
  scenarioDescription: text("scenario_description").notNull(),
  era: text("era"), // Which of the 70+ historical eras
  
  // Choice Made
  optionsPresented: text("options_presented").array().notNull(),
  chosenOption: text("chosen_option").notNull(),
  choiceReasoning: text("choice_reasoning"), // Optional player explanation
  
  // Impact Analysis (AI-generated)
  emotionalImpact: text("emotional_impact"), // JSON: { courageFear: +5, hopeDespair: -3, ... }
  alignmentImpact: text("alignment_impact"), // How this affects moral alignment
  
  chosenAt: timestamp("chosen_at").defaultNow().notNull(),
});

export const insertPlayerChoiceSchema = createInsertSchema(playerChoices).omit({
  id: true,
  emotionalImpact: true,
  alignmentImpact: true,
  chosenAt: true,
});

export type PlayerChoice = typeof playerChoices.$inferSelect;
export type InsertPlayerChoice = z.infer<typeof insertPlayerChoiceSchema>;

// Chronicles Game State - Persistent game progression per player
export const chroniclesGameState = pgTable("chronicles_game_state", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull().unique(),
  
  name: text("name").notNull().default("Traveler"),
  currentEra: text("current_era").notNull().default("modern"),
  
  level: integer("level").notNull().default(1),
  experience: integer("experience").notNull().default(0),
  shellsEarned: integer("shells_earned").notNull().default(0),
  
  wisdom: integer("wisdom").notNull().default(10),
  courage: integer("courage").notNull().default(10),
  compassion: integer("compassion").notNull().default(10),
  cunning: integer("cunning").notNull().default(10),
  influence: integer("influence").notNull().default(10),
  
  situationsCompleted: integer("situations_completed").notNull().default(0),
  decisionsRecorded: integer("decisions_recorded").notNull().default(0),
  npcsSpokenTo: text("npcs_spoken_to").array().notNull().default(sql`'{}'::text[]`),
  factionsJoined: text("factions_joined").array().notNull().default(sql`'{}'::text[]`),
  completedSituations: text("completed_situations").array().notNull().default(sql`'{}'::text[]`),
  achievements: text("achievements").array().notNull().default(sql`'{}'::text[]`),
  
  narrativeProgress: text("narrative_progress").notNull().default('{}'),
  activeQuests: text("active_quests").notNull().default('[]'),
  
  currentStreak: integer("current_streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  lastPlayedAt: timestamp("last_played_at"),
  
  portalCompleted: boolean("portal_completed").notNull().default(false),
  homeCity: text("home_city"),
  echoBalance: integer("echo_balance").notNull().default(0),
  inventory: text("inventory").notNull().default('[]'),
  lastOfflineCheck: timestamp("last_offline_check"),
  pendingEvents: text("pending_events").notNull().default('[]'),
  offlineSummary: text("offline_summary"),

  faithLevel: integer("faith_level").notNull().default(0),
  spiritualPath: text("spiritual_path"),
  sacredTextsRead: text("sacred_texts_read").notNull().default('[]'),
  servicesAttended: integer("services_attended").notNull().default(0),
  lastServiceAt: timestamp("last_service_at"),
  congregationId: text("congregation_id"),
  prayerStreak: integer("prayer_streak").notNull().default(0),
  lastPrayerAt: timestamp("last_prayer_at"),
  spiritualJournal: text("spiritual_journal").notNull().default('[]'),

  currentZone: text("current_zone"),
  currentActivity: text("current_activity"),

  tutorialStep: integer("tutorial_step").notNull().default(0),
  tutorialCompleted: boolean("tutorial_completed").notNull().default(false),

  gameLog: text("game_log").notNull().default('[]'),
  npcRelationships: text("npc_relationships").notNull().default('{}'),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertChroniclesGameStateSchema = createInsertSchema(chroniclesGameState).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type ChroniclesGameState = typeof chroniclesGameState.$inferSelect;
export type InsertChroniclesGameState = z.infer<typeof insertChroniclesGameStateSchema>;

// Player Estate - Persistent estate building data (one per era per player)
export const playerEstates = pgTable("player_estates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  era: text("era").notNull().default("modern"),
  
  gridData: text("grid_data").notNull().default('[]'),
  
  totalBuildings: integer("total_buildings").notNull().default(1),
  shellsSpent: integer("shells_spent").notNull().default(0),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPlayerEstateSchema = createInsertSchema(playerEstates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type PlayerEstate = typeof playerEstates.$inferSelect;
export type InsertPlayerEstate = z.infer<typeof insertPlayerEstateSchema>;

// =====================================================
// CITY ZONING & PLOT MARKETPLACE SYSTEM
// =====================================================

// City Zones - Define areas in the world with specific types
export const cityZones = pgTable("city_zones", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  era: text("era").notNull().default("present"), // Which era this zone belongs to
  name: text("name").notNull(),
  description: text("description"),
  
  // Zone type determines what can be built
  zoneType: text("zone_type").notNull(), // 'residential', 'commercial', 'civic', 'mixed', 'nature'
  
  // Zone boundaries (grid coordinates in the world map)
  gridX: integer("grid_x").notNull(),
  gridY: integer("grid_y").notNull(),
  width: integer("width").notNull().default(4),
  height: integer("height").notNull().default(4),
  
  // Stats
  totalPlots: integer("total_plots").notNull().default(16),
  occupiedPlots: integer("occupied_plots").notNull().default(0),
  
  // Era-specific styling
  architectureStyle: text("architecture_style"), // 'medieval', 'roman', 'victorian', 'modern', 'futuristic'
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCityZoneSchema = createInsertSchema(cityZones).omit({
  id: true,
  createdAt: true,
});

export type CityZone = typeof cityZones.$inferSelect;
export type InsertCityZone = z.infer<typeof insertCityZoneSchema>;

// Land Plots - Individual buildable plots within zones
export const landPlots = pgTable("land_plots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  zoneId: varchar("zone_id").notNull(),
  
  // Plot location within zone
  plotX: integer("plot_x").notNull(),
  plotY: integer("plot_y").notNull(),
  
  // Ownership
  ownerId: text("owner_id"), // null = available for purchase
  ownerType: text("owner_type").default("player"), // 'player', 'business', 'npc', 'civic'
  
  // Plot details
  plotSize: text("plot_size").notNull().default("standard"), // 'small', 'standard', 'large', 'premium'
  basePrice: integer("base_price").notNull().default(100), // in Shells
  currentPrice: integer("current_price").notNull().default(100), // market-adjusted
  
  // Building on this plot (JSON of building data)
  buildingData: text("building_data"), // JSON
  
  // For sale
  isForSale: boolean("is_for_sale").notNull().default(true),
  listingPrice: integer("listing_price"),
  
  purchasedAt: timestamp("purchased_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertLandPlotSchema = createInsertSchema(landPlots).omit({
  id: true,
  createdAt: true,
});

export type LandPlot = typeof landPlots.$inferSelect;
export type InsertLandPlot = z.infer<typeof insertLandPlotSchema>;

// Plot Marketplace Listings - Active sales/trades
export const plotListings = pgTable("plot_listings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  plotId: varchar("plot_id").notNull(),
  sellerId: text("seller_id").notNull(),
  
  listingType: text("listing_type").notNull().default("sale"), // 'sale', 'auction', 'trade'
  askingPrice: integer("asking_price").notNull(),
  
  // Auction fields
  currentBid: integer("current_bid"),
  highestBidderId: text("highest_bidder_id"),
  auctionEndsAt: timestamp("auction_ends_at"),
  
  status: text("status").notNull().default("active"), // 'active', 'sold', 'cancelled', 'expired'
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
});

export const insertPlotListingSchema = createInsertSchema(plotListings).omit({
  id: true,
  createdAt: true,
});

export type PlotListing = typeof plotListings.$inferSelect;
export type InsertPlotListing = z.infer<typeof insertPlotListingSchema>;

// =====================================================
// LIVING WORLD SYSTEM
// =====================================================

export const zonePresence = pgTable("zone_presence", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  era: text("era").notNull(),
  zoneId: text("zone_id").notNull(),
  activity: text("activity"),
  enteredAt: timestamp("entered_at").defaultNow().notNull(),
  lastHeartbeat: timestamp("last_heartbeat").defaultNow().notNull(),
  isActive: boolean("is_active").notNull().default(true),
});

export const insertZonePresenceSchema = createInsertSchema(zonePresence).omit({
  id: true,
  enteredAt: true,
  lastHeartbeat: true,
});

export type ZonePresence = typeof zonePresence.$inferSelect;
export type InsertZonePresence = z.infer<typeof insertZonePresenceSchema>;

export const minigameSessions = pgTable("minigame_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  era: text("era").notNull(),
  zoneId: text("zone_id").notNull(),
  gameType: text("game_type").notNull(),
  score: integer("score").notNull().default(0),
  highScore: integer("high_score").notNull().default(0),
  result: text("result"),
  echosEarned: integer("echos_earned").notNull().default(0),
  playedAt: timestamp("played_at").defaultNow().notNull(),
});

export const insertMinigameSessionSchema = createInsertSchema(minigameSessions).omit({
  id: true,
  playedAt: true,
});

export type MinigameSession = typeof minigameSessions.$inferSelect;
export type InsertMinigameSession = z.infer<typeof insertMinigameSessionSchema>;

// =====================================================
// LEGACY & FAMILY SYSTEM
// =====================================================

export const playerLegacy = pgTable("player_legacy", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  era: text("era").notNull(),
  characterName: text("character_name").notNull(),
  generation: integer("generation").notNull().default(1),
  parentLegacyId: varchar("parent_legacy_id"),
  
  birthYear: integer("birth_year").notNull().default(0),
  deathYear: integer("death_year"),
  causeOfDeath: text("cause_of_death"),
  
  profession: text("profession"),
  spouse: text("spouse"),
  children: integer("children").notNull().default(0),
  
  finalWisdom: integer("final_wisdom").notNull().default(10),
  finalCourage: integer("final_courage").notNull().default(10),
  finalCompassion: integer("final_compassion").notNull().default(10),
  finalCunning: integer("final_cunning").notNull().default(10),
  finalInfluence: integer("final_influence").notNull().default(10),
  
  inheritanceTraits: text("inheritance_traits").notNull().default('[]'),
  legacyScore: integer("legacy_score").notNull().default(0),
  epitaph: text("epitaph"),
  keyDecisions: text("key_decisions").notNull().default('[]'),
  
  isActive: boolean("is_active").notNull().default(true),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPlayerLegacySchema = createInsertSchema(playerLegacy).omit({ id: true, createdAt: true });
export type PlayerLegacy = typeof playerLegacy.$inferSelect;
export type InsertPlayerLegacy = z.infer<typeof insertPlayerLegacySchema>;

// =====================================================
// RELATIONSHIP SYSTEM  
// =====================================================

export const npcRelationships = pgTable("npc_relationships", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  npcId: text("npc_id").notNull(),
  era: text("era").notNull(),
  
  relationshipType: text("relationship_type").notNull().default("acquaintance"),
  affinity: integer("affinity").notNull().default(0),
  trust: integer("trust").notNull().default(0),
  fear: integer("fear").notNull().default(0),
  romance: integer("romance").notNull().default(0),
  rivalry: integer("rivalry").notNull().default(0),
  
  interactionCount: integer("interaction_count").notNull().default(0),
  lastInteraction: timestamp("last_interaction"),
  
  relationshipHistory: text("relationship_history").notNull().default('[]'),
  sharedMemories: text("shared_memories").notNull().default('[]'),
  giftsGiven: text("gifts_given").notNull().default('[]'),
  
  isRomanceable: boolean("is_romanceable").notNull().default(false),
  isRival: boolean("is_rival").notNull().default(false),
  isAlly: boolean("is_ally").notNull().default(false),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertNpcRelationshipSchema = createInsertSchema(npcRelationships).omit({ id: true, createdAt: true, updatedAt: true });
export type NpcRelationship = typeof npcRelationships.$inferSelect;
export type InsertNpcRelationship = z.infer<typeof insertNpcRelationshipSchema>;

// =====================================================
// DYNAMIC WORLD EVENTS
// =====================================================

export const worldEvents = pgTable("world_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  era: text("era").notNull(),
  eventType: text("event_type").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  
  severity: text("severity").notNull().default("minor"),
  affectedZones: text("affected_zones").notNull().default('[]'),
  
  startedAt: timestamp("started_at").defaultNow().notNull(),
  endsAt: timestamp("ends_at"),
  isActive: boolean("is_active").notNull().default(true),
  
  effects: text("effects").notNull().default('{}'),
  participantCount: integer("participant_count").notNull().default(0),
  outcome: text("outcome"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertWorldEventSchema = createInsertSchema(worldEvents).omit({ id: true, createdAt: true });
export type WorldEvent = typeof worldEvents.$inferSelect;
export type InsertWorldEvent = z.infer<typeof insertWorldEventSchema>;

export const worldEventParticipation = pgTable("world_event_participation", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull(),
  userId: text("user_id").notNull(),
  
  action: text("action").notNull(),
  contribution: integer("contribution").notNull().default(0),
  reward: text("reward"),
  
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

export const insertWorldEventParticipationSchema = createInsertSchema(worldEventParticipation).omit({ id: true, joinedAt: true });
export type WorldEventParticipation = typeof worldEventParticipation.$inferSelect;
export type InsertWorldEventParticipation = z.infer<typeof insertWorldEventParticipationSchema>;

// =====================================================
// HOME INTERIORS & PROPERTY SYSTEM
// =====================================================

export const homeInteriors = pgTable("home_interiors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  era: text("era").notNull(),
  
  homeLevel: integer("home_level").notNull().default(1),
  homeName: text("home_name").notNull().default("Starter Home"),
  homeType: text("home_type").notNull().default("cottage"),
  
  rooms: text("rooms").notNull().default('["living_room","bedroom","kitchen"]'),
  furniture: text("furniture").notNull().default('[]'),
  decorations: text("decorations").notNull().default('[]'),
  
  comfortLevel: integer("comfort_level").notNull().default(1),
  securityLevel: integer("security_level").notNull().default(1),
  storageCapacity: integer("storage_capacity").notNull().default(10),
  
  activeBuffs: text("active_buffs").notNull().default('[]'),
  visitors: text("visitors").notNull().default('[]'),
  lastVisitorAt: timestamp("last_visitor_at"),
  
  totalUpgrades: integer("total_upgrades").notNull().default(0),
  shellsInvested: integer("shells_invested").notNull().default(0),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertHomeInteriorSchema = createInsertSchema(homeInteriors).omit({ id: true, createdAt: true, updatedAt: true });
export type HomeInterior = typeof homeInteriors.$inferSelect;
export type InsertHomeInterior = z.infer<typeof insertHomeInteriorSchema>;

// =====================================================
// BLOCKCHAIN DECISION TRAIL
// =====================================================

export const decisionTrail = pgTable("decision_trail", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  era: text("era").notNull(),
  
  decisionType: text("decision_type").notNull(),
  situationTitle: text("situation_title").notNull(),
  choiceMade: text("choice_made").notNull(),
  
  consequences: text("consequences").notNull().default('{}'),
  statChanges: text("stat_changes").notNull().default('{}'),
  
  blockHash: text("block_hash").notNull(),
  previousHash: text("previous_hash").notNull().default("0x0"),
  blockNumber: integer("block_number").notNull().default(0),
  merkleRoot: text("merkle_root"),
  
  nonce: integer("nonce").notNull().default(0),
  difficulty: integer("difficulty").notNull().default(1),
  timestamp: bigint("timestamp", { mode: "number" }).notNull(),
  
  verified: boolean("verified").notNull().default(true),
  guardianSignature: text("guardian_signature"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertDecisionTrailSchema = createInsertSchema(decisionTrail).omit({ id: true, createdAt: true });
export type DecisionTrail = typeof decisionTrail.$inferSelect;
export type InsertDecisionTrail = z.infer<typeof insertDecisionTrailSchema>;

// =====================================================
// SEASON COMPLETION TRACKING
// =====================================================

export const seasonProgress = pgTable("season_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull().unique(),
  
  seasonId: text("season_id").notNull().default("season_zero"),
  
  erasExplored: text("eras_explored").notNull().default('[]'),
  questsCompleted: text("quests_completed").notNull().default('[]'),
  totalDecisions: integer("total_decisions").notNull().default(0),
  totalLegacies: integer("total_legacies").notNull().default(0),
  
  medievalProgress: integer("medieval_progress").notNull().default(0),
  wildwestProgress: integer("wildwest_progress").notNull().default(0),
  modernProgress: integer("modern_progress").notNull().default(0),
  
  finaleUnlocked: boolean("finale_unlocked").notNull().default(false),
  finaleCompleted: boolean("finale_completed").notNull().default(false),
  
  seasonScore: integer("season_score").notNull().default(0),
  completionRewards: text("completion_rewards").notNull().default('[]'),
  
  seasonOneUnlocked: boolean("season_one_unlocked").notNull().default(false),
  
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertSeasonProgressSchema = createInsertSchema(seasonProgress).omit({ id: true, createdAt: true, updatedAt: true });
export type SeasonProgress = typeof seasonProgress.$inferSelect;
export type InsertSeasonProgress = z.infer<typeof insertSeasonProgressSchema>;

// =====================================================
// PET & COMPANION SYSTEM
// =====================================================

export const playerPets = pgTable("player_pets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  era: text("era").notNull(),
  
  name: text("name").notNull(),
  species: text("species").notNull(),
  breed: text("breed").notNull(),
  emoji: text("emoji").notNull().default("🐾"),
  
  bondLevel: integer("bond_level").notNull().default(0),
  maxBond: integer("max_bond").notNull().default(100),
  happiness: integer("happiness").notNull().default(50),
  health: integer("health").notNull().default(100),
  energy: integer("energy").notNull().default(100),
  
  ageMonths: integer("age_months").notNull().default(3),
  stage: text("stage").notNull().default("young"),
  
  primaryAbility: text("primary_ability").notNull(),
  secondaryAbility: text("secondary_ability"),
  abilityLevel: integer("ability_level").notNull().default(1),
  
  traits: text("traits").notNull().default('[]'),
  appearance: text("appearance").notNull().default('{}'),
  
  totalFeedings: integer("total_feedings").notNull().default(0),
  totalTrainings: integer("total_trainings").notNull().default(0),
  totalPlaySessions: integer("total_play_sessions").notNull().default(0),
  adventuresCompleted: integer("adventures_completed").notNull().default(0),
  
  lastFed: timestamp("last_fed"),
  lastTrained: timestamp("last_trained"),
  lastPlayed: timestamp("last_played"),
  
  acquisitionMethod: text("acquisition_method").notNull().default("adopted"),
  legacyPetId: varchar("legacy_pet_id"),
  
  isActive: boolean("is_active").notNull().default(true),
  isCompanion: boolean("is_companion").notNull().default(false),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPlayerPetSchema = createInsertSchema(playerPets).omit({ id: true, createdAt: true, updatedAt: true });
export type PlayerPet = typeof playerPets.$inferSelect;
export type InsertPlayerPet = z.infer<typeof insertPlayerPetSchema>;

// Daily Login Rewards - Track player streaks and rewards
export const dailyLoginRewards = pgTable("daily_login_rewards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull().unique(),
  
  // Streak tracking
  currentStreak: integer("current_streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  totalLogins: integer("total_logins").notNull().default(0),
  
  // Last claim info
  lastClaimDate: timestamp("last_claim_date"),
  lastClaimReward: integer("last_claim_reward"),
  
  // Bonus multipliers
  streakMultiplier: real("streak_multiplier").notNull().default(1.0),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertDailyLoginRewardSchema = createInsertSchema(dailyLoginRewards).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type DailyLoginReward = typeof dailyLoginRewards.$inferSelect;
export type InsertDailyLoginReward = z.infer<typeof insertDailyLoginRewardSchema>;

// Business Claims - Real businesses claiming commercial plots
export const businessClaims = pgTable("business_claims", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  plotId: varchar("plot_id").notNull(),
  
  // Business info
  businessName: text("business_name").notNull(),
  businessType: text("business_type").notNull(), // 'retail', 'restaurant', 'service', 'entertainment'
  businessWebsite: text("business_website"),
  businessEmail: text("business_email").notNull(),
  
  // Owner info
  claimantUserId: text("claimant_user_id"),
  
  // Verification
  verificationStatus: text("verification_status").notNull().default("pending"), // 'pending', 'verified', 'rejected'
  verifiedAt: timestamp("verified_at"),
  
  // In-game presence
  storefrontData: text("storefront_data"), // JSON for in-game appearance
  isActive: boolean("is_active").notNull().default(false),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertBusinessClaimSchema = createInsertSchema(businessClaims).omit({
  id: true,
  createdAt: true,
});

export type BusinessClaim = typeof businessClaims.$inferSelect;
export type InsertBusinessClaim = z.infer<typeof insertBusinessClaimSchema>;

// Era Building Templates - Define what buildings look like in each era
export const eraBuildingTemplates = pgTable("era_building_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  era: text("era").notNull(),
  buildingType: text("building_type").notNull(), // matches BuildingType from frontend
  
  // Visual customization
  displayName: text("display_name").notNull(), // Era-specific name (e.g., "Villa" in Roman, "Cottage" in Medieval)
  iconEmoji: text("icon_emoji"),
  colorClass: text("color_class"), // Tailwind color class
  description: text("description"),
  
  // Era-specific stats
  baseCost: integer("base_cost").notNull().default(100),
  unlockLevel: integer("unlock_level").notNull().default(0),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type EraBuildingTemplate = typeof eraBuildingTemplates.$inferSelect;

// AI Conversation Memory - For context continuity
export const chroniclesConversations = pgTable("chronicles_conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  personalityId: varchar("personality_id").notNull(),
  
  // Conversation context
  era: text("era"),
  location: text("location"),
  npcName: text("npc_name"),
  
  // Messages
  messages: text("messages").notNull(), // JSON array of {role, content}
  
  // Summary for long-term memory
  conversationSummary: text("conversation_summary"),
  keyInsights: text("key_insights").array(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ChroniclesConversation = typeof chroniclesConversations.$inferSelect;

// =====================================================
// CHRONICLES GUILDS SYSTEM
// =====================================================
// In-game guilds are first-class gameplay entities that can optionally
// link to ChronoChat communities for cross-platform communication.
// Solo play remains fully functional without guilds.
// =====================================================

export const guilds = pgTable("guilds", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon").default("⚔️"),
  bannerUrl: text("banner_url"),
  
  // Ownership
  leaderId: text("leader_id").notNull(),
  
  // Settings
  isPublic: boolean("is_public").notNull().default(true),
  isRecruiting: boolean("is_recruiting").notNull().default(true),
  maxMembers: integer("max_members").notNull().default(50),
  
  // ChronoChat Link (optional)
  chronoChatCommunityId: varchar("chronochat_community_id"),
  isChronoLinkActive: boolean("is_chronolink_active").notNull().default(false),
  
  // Stats
  memberCount: integer("member_count").notNull().default(1),
  totalXp: integer("total_xp").notNull().default(0),
  level: integer("level").notNull().default(1),
  
  // Gameplay bonuses
  xpBonus: integer("xp_bonus").notNull().default(0), // Percentage bonus
  shellsBonus: integer("shells_bonus").notNull().default(0), // Percentage bonus
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertGuildSchema = createInsertSchema(guilds).omit({
  id: true,
  memberCount: true,
  totalXp: true,
  level: true,
  createdAt: true,
  updatedAt: true,
});

export type Guild = typeof guilds.$inferSelect;
export type InsertGuild = z.infer<typeof insertGuildSchema>;

export const guildMembers = pgTable("guild_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  guildId: varchar("guild_id").notNull(),
  userId: text("user_id").notNull(),
  
  // Role within guild
  role: text("role").notNull().default("member"), // leader, officer, member
  title: text("title"), // Custom title like "Champion", "Strategist"
  
  // Contribution tracking
  xpContributed: integer("xp_contributed").notNull().default(0),
  questsCompleted: integer("quests_completed").notNull().default(0),
  
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

export const insertGuildMemberSchema = createInsertSchema(guildMembers).omit({
  id: true,
  xpContributed: true,
  questsCompleted: true,
  joinedAt: true,
});

export type GuildMember = typeof guildMembers.$inferSelect;
export type InsertGuildMember = z.infer<typeof insertGuildMemberSchema>;

export const guildInvites = pgTable("guild_invites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  guildId: varchar("guild_id").notNull(),
  inviterId: text("inviter_id").notNull(),
  inviteeId: text("invitee_id"), // Null for open invite codes
  
  // Invite code for sharing
  code: text("code").notNull().unique(),
  
  // Limits
  maxUses: integer("max_uses"),
  useCount: integer("use_count").notNull().default(0),
  expiresAt: timestamp("expires_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type GuildInvite = typeof guildInvites.$inferSelect;

export const guildRoles = pgTable("guild_roles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  guildId: varchar("guild_id").notNull(),
  name: text("name").notNull(),
  color: text("color").default("#6366f1"),
  position: integer("position").notNull().default(0),
  
  // Permissions
  canInvite: boolean("can_invite").notNull().default(false),
  canKick: boolean("can_kick").notNull().default(false),
  canManageRoles: boolean("can_manage_roles").notNull().default(false),
  canManageSettings: boolean("can_manage_settings").notNull().default(false),
  canStartQuests: boolean("can_start_quests").notNull().default(false),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type GuildRole = typeof guildRoles.$inferSelect;

// =====================================================
// DARKWAVE CREDITS SYSTEM
// =====================================================
// Credits are the universal currency for AI-powered features
// Users purchase credits to interact with AI, train personalities,
// create voice clones, and prepare their "parallel self" for launch
// =====================================================

export const userCredits = pgTable("user_credits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull().unique(),
  
  // Credit Balance
  creditBalance: integer("credit_balance").notNull().default(0),
  lifetimeCreditsEarned: integer("lifetime_credits_earned").notNull().default(0),
  lifetimeCreditsSpent: integer("lifetime_credits_spent").notNull().default(0),
  
  // Bonus tracking
  bonusCredits: integer("bonus_credits").notNull().default(0), // From promotions, etc.
  
  // Rate limiting
  dailyUsageCount: integer("daily_usage_count").notNull().default(0),
  dailyUsageDate: text("daily_usage_date"), // YYYY-MM-DD format for daily reset
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserCreditsSchema = createInsertSchema(userCredits).omit({
  id: true,
  lifetimeCreditsEarned: true,
  lifetimeCreditsSpent: true,
  dailyUsageCount: true,
  dailyUsageDate: true,
  createdAt: true,
  updatedAt: true,
});

export type UserCredits = typeof userCredits.$inferSelect;
export type InsertUserCredits = z.infer<typeof insertUserCreditsSchema>;

// Credit Transactions - Purchase and usage history
export const creditTransactions = pgTable("credit_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  
  // Transaction details
  type: text("type").notNull(), // "purchase", "usage", "bonus", "refund"
  amount: integer("amount").notNull(), // Positive = credit, Negative = debit
  balanceAfter: integer("balance_after").notNull(),
  
  // Context
  description: text("description").notNull(),
  category: text("category"), // "voice_clone", "ai_chat", "scenario", "purchase"
  stripePaymentId: text("stripe_payment_id"), // For purchases
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCreditTransactionSchema = createInsertSchema(creditTransactions).omit({
  id: true,
  createdAt: true,
});

export type CreditTransaction = typeof creditTransactions.$inferSelect;
export type InsertCreditTransaction = z.infer<typeof insertCreditTransactionSchema>;

// Credit Packages - Available for purchase
export const creditPackages = pgTable("credit_packages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // "Starter", "Builder", "Architect", "Founder"
  credits: integer("credits").notNull(),
  bonusCredits: integer("bonus_credits").notNull().default(0),
  priceUsd: integer("price_usd").notNull(), // In cents
  stripePriceId: text("stripe_price_id"), // Optional: for recurring subscriptions
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type CreditPackage = typeof creditPackages.$inferSelect;

// =====================================================
// SUBSCRIPTION SYSTEM
// =====================================================
// Unified subscription management for Pulse Pro, StrikeAgent, and Complete Bundle
// Synced with main Pulse app structure
// =====================================================

export const subscriptionPlanIds = [
  "free",
  "basic",
  "premium",
  "pulse_pro",
  "strike_agent",
  "complete_bundle",
  "founder",
  "free_demo",
  "rm_monthly",
  "rm_annual",
  "legacy_founder",
] as const;

export type SubscriptionPlanId = typeof subscriptionPlanIds[number];

export const subscriptionStatuses = [
  "active",
  "inactive",
  "cancelled",
  "expired",
  "trialing",
  "past_due",
] as const;

export type SubscriptionStatus = typeof subscriptionStatuses[number];

export const subscriptions = pgTable("subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull().unique(),
  
  // Plan details
  plan: text("plan").notNull().default("free"), // free, pulse_pro, strike_agent, complete_bundle, founder, etc.
  status: text("status").notNull().default("inactive"), // active, inactive, cancelled, expired, trialing, past_due
  billingCycle: text("billing_cycle"), // "monthly", "annual", null for one-time
  
  // Stripe integration
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  stripePriceId: text("stripe_price_id"),
  
  // Period tracking
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  trialStart: timestamp("trial_start"),
  trialEnd: timestamp("trial_end"),
  
  // Founder/one-time specific
  founderPurchaseDate: timestamp("founder_purchase_date"),
  founderExpiryDate: timestamp("founder_expiry_date"),
  dwcTokensAllocated: integer("dwc_tokens_allocated").default(0), // 35,000 for founders
  
  // Cancellation tracking
  cancelledAt: timestamp("cancelled_at"),
  cancelReason: text("cancel_reason"),
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;

// Whitelisted Users - Bypass all limits
export const whitelistedUsers = pgTable("whitelisted_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull().unique(),
  reason: text("reason"), // "team", "beta_tester", "partner", etc.
  addedBy: text("added_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type WhitelistedUser = typeof whitelistedUsers.$inferSelect;

// =====================================================
// VOICE CLONING SYSTEM
// =====================================================
// Stores user voice samples for creating their parallel self's voice
// =====================================================

export const voiceSamples = pgTable("voice_samples", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  personalityId: varchar("personality_id"),
  
  // Sample info
  sampleUrl: text("sample_url"), // URL to stored audio file
  sampleDurationSec: integer("sample_duration_sec"),
  transcriptText: text("transcript_text"), // What they said
  
  // Voice clone status
  voiceCloneId: text("voice_clone_id"), // ID from ElevenLabs/Resemble
  voiceCloneProvider: text("voice_clone_provider"), // "elevenlabs", "resemble"
  cloneStatus: text("clone_status").notNull().default("pending"), // "pending", "processing", "ready", "failed"
  
  // Quality tracking
  qualityScore: integer("quality_score"), // 0-100 based on sample quality
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertVoiceSampleSchema = createInsertSchema(voiceSamples).omit({
  id: true,
  voiceCloneId: true,
  cloneStatus: true,
  qualityScore: true,
  createdAt: true,
  updatedAt: true,
});

export type VoiceSample = typeof voiceSamples.$inferSelect;
export type InsertVoiceSample = z.infer<typeof insertVoiceSampleSchema>;

// Voice Usage Tracking - For rate limiting voice API calls
export const voiceUsage = pgTable("voice_usage", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  
  // Usage tracking
  usageType: text("usage_type").notNull(), // "tts", "stt", "clone"
  creditsUsed: integer("credits_used").notNull(),
  charactersProcessed: integer("characters_processed"),
  durationMs: integer("duration_ms"),
  
  // Context
  sessionId: text("session_id"),
  provider: text("provider"), // "browser", "elevenlabs", "resemble"
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type VoiceUsage = typeof voiceUsage.$inferSelect;

// =====================================================
// VOICE COMMUNICATION SYSTEM
// =====================================================
// Real-time voice messaging between users and NPCs
// =====================================================

export const voiceChannelTypes = ["direct", "room", "npc_dialogue", "broadcast"] as const;
export type VoiceChannelType = typeof voiceChannelTypes[number];

export const voiceChannels = pgTable("voice_channels", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull().default("direct"),
  title: text("title"),
  description: text("description"),
  contextJson: text("context_json"),
  permissionsJson: text("permissions_json"),
  isActive: boolean("is_active").notNull().default(true),
  createdBy: text("created_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertVoiceChannelSchema = createInsertSchema(voiceChannels).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type VoiceChannel = typeof voiceChannels.$inferSelect;
export type InsertVoiceChannel = z.infer<typeof insertVoiceChannelSchema>;

export const voiceChannelMembers = pgTable("voice_channel_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  channelId: text("channel_id").notNull(),
  memberType: text("member_type").notNull().default("user"),
  memberId: text("member_id").notNull(),
  memberName: text("member_name"),
  role: text("role").notNull().default("speaker"),
  isMuted: boolean("is_muted").notNull().default(false),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
  leftAt: timestamp("left_at"),
});

export const insertVoiceChannelMemberSchema = createInsertSchema(voiceChannelMembers).omit({
  id: true,
  joinedAt: true,
  leftAt: true,
});

export type VoiceChannelMember = typeof voiceChannelMembers.$inferSelect;
export type InsertVoiceChannelMember = z.infer<typeof insertVoiceChannelMemberSchema>;

export const voiceMessageStatuses = ["draft", "queued", "processing", "ready", "failed", "expired"] as const;
export type VoiceMessageStatus = typeof voiceMessageStatuses[number];

export const voiceMessages = pgTable("voice_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  channelId: text("channel_id"),
  conversationId: text("conversation_id"),
  senderType: text("sender_type").notNull().default("user"),
  senderId: text("sender_id").notNull(),
  senderName: text("sender_name"),
  recipientId: text("recipient_id"),
  transcript: text("transcript").notNull(),
  audioUrl: text("audio_url"),
  durationMs: integer("duration_ms"),
  voiceProvider: text("voice_provider"),
  voiceCloneId: text("voice_clone_id"),
  creditsSpent: integer("credits_spent").notNull().default(0),
  status: text("status").notNull().default("queued"),
  errorMessage: text("error_message"),
  metadata: text("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  playedAt: timestamp("played_at"),
  expiresAt: timestamp("expires_at"),
});

export const insertVoiceMessageSchema = createInsertSchema(voiceMessages).omit({
  id: true,
  audioUrl: true,
  durationMs: true,
  status: true,
  errorMessage: true,
  createdAt: true,
  playedAt: true,
});

export type VoiceMessage = typeof voiceMessages.$inferSelect;
export type InsertVoiceMessage = z.infer<typeof insertVoiceMessageSchema>;

export const npcVoiceQueues = pgTable("npc_voice_queues", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  npcId: text("npc_id").notNull(),
  npcName: text("npc_name"),
  userId: text("user_id").notNull(),
  channelId: text("channel_id"),
  promptText: text("prompt_text").notNull(),
  userContextJson: text("user_context_json"),
  responseText: text("response_text"),
  audioUrl: text("audio_url"),
  voiceConfigId: text("voice_config_id"),
  status: text("status").notNull().default("pending"),
  priority: integer("priority").notNull().default(0),
  creditsSpent: integer("credits_spent").notNull().default(0),
  scheduledFor: timestamp("scheduled_for"),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertNpcVoiceQueueSchema = createInsertSchema(npcVoiceQueues).omit({
  id: true,
  responseText: true,
  audioUrl: true,
  status: true,
  processedAt: true,
  createdAt: true,
});

export type NpcVoiceQueue = typeof npcVoiceQueues.$inferSelect;
export type InsertNpcVoiceQueue = z.infer<typeof insertNpcVoiceQueueSchema>;

export const voiceSessions = pgTable("voice_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  channelId: text("channel_id").notNull(),
  provider: text("provider").notNull().default("webrtc"),
  state: text("state").notNull().default("idle"),
  participantCount: integer("participant_count").notNull().default(0),
  recordingUrl: text("recording_url"),
  startedAt: timestamp("started_at"),
  endedAt: timestamp("ended_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertVoiceSessionSchema = createInsertSchema(voiceSessions).omit({
  id: true,
  state: true,
  participantCount: true,
  recordingUrl: true,
  startedAt: true,
  endedAt: true,
  createdAt: true,
});

export type VoiceSession = typeof voiceSessions.$inferSelect;
export type InsertVoiceSession = z.infer<typeof insertVoiceSessionSchema>;

// =====================================================
// TREASURY ALLOCATION SYSTEM
// =====================================================
// Transparent allocation tracking for SIG treasury funds
// =====================================================

export const treasuryAllocationCategories = [
  "development",
  "marketing", 
  "staking_rewards",
  "team_founder",
  "operations",
  "reserve"
] as const;

export type TreasuryAllocationCategory = typeof treasuryAllocationCategories[number];

export const treasuryAllocations = pgTable("treasury_allocations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  category: text("category").notNull(), // development, marketing, staking_rewards, team_founder, operations, reserve
  percentage: integer("percentage").notNull(), // 30, 20, 20, 15, 10, 5
  label: text("label").notNull(), // "Development", "Marketing", etc.
  description: text("description"),
  color: text("color").notNull(), // Tailwind color for UI
  icon: text("icon"), // Icon name for UI
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertTreasuryAllocationSchema = createInsertSchema(treasuryAllocations).omit({
  id: true,
  updatedAt: true,
});

export type TreasuryAllocation = typeof treasuryAllocations.$inferSelect;
export type InsertTreasuryAllocation = z.infer<typeof insertTreasuryAllocationSchema>;

export const treasuryLedger = pgTable("treasury_ledger", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  category: text("category").notNull(), // Which allocation bucket
  amountDwc: text("amount_dwc").notNull(), // Amount in SIG
  amountUsd: text("amount_usd"), // Optional USD equivalent
  transactionType: text("transaction_type").notNull(), // "deposit", "withdrawal", "allocation"
  txHash: text("tx_hash"), // On-chain tx hash if applicable
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTreasuryLedgerSchema = createInsertSchema(treasuryLedger).omit({
  id: true,
  createdAt: true,
});

export type TreasuryLedgerEntry = typeof treasuryLedger.$inferSelect;
export type InsertTreasuryLedgerEntry = z.infer<typeof insertTreasuryLedgerSchema>;

// Protocol Fee Configuration (for display purposes)
export const protocolFeeConfigSchema = z.object({
  dexSwapFee: z.string(),
  nftMarketplaceFee: z.string(),
  bridgeFee: z.string(),
  launchpadFee: z.string(),
  stakingRewardsSource: z.string(),
});

export type ProtocolFeeConfig = z.infer<typeof protocolFeeConfigSchema>;

// =====================================================
// OWNER ADMIN PORTAL
// =====================================================

// Owner/Admin designation - who has access to owner portal
export const ownerAdmins = pgTable("owner_admins", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  email: text("email"),
  displayName: text("display_name"),
  role: text("role").notNull().default("admin"), // "owner" | "admin" | "moderator"
  hosts: text("hosts").array().default(sql`ARRAY['dwsc.io', 'yourlegacy.io']::text[]`), // Which hosts they can access
  permissions: text("permissions").array().default(sql`ARRAY['analytics', 'seo', 'marketing', 'rewards']::text[]`),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertOwnerAdminSchema = createInsertSchema(ownerAdmins).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type OwnerAdmin = typeof ownerAdmins.$inferSelect;
export type InsertOwnerAdmin = z.infer<typeof insertOwnerAdminSchema>;

// SEO Configuration per route/host
export const seoConfigs = pgTable("seo_configs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  host: text("host").notNull().default("dwsc.io"), // dwsc.io, yourlegacy.io, etc.
  route: text("route").notNull().default("/"), // /presale, /chronicles, etc.
  title: text("title"),
  description: text("description"),
  keywords: text("keywords"),
  ogTitle: text("og_title"),
  ogDescription: text("og_description"),
  ogImage: text("og_image"),
  ogType: text("og_type").default("website"),
  twitterCard: text("twitter_card").default("summary_large_image"),
  twitterTitle: text("twitter_title"),
  twitterDescription: text("twitter_description"),
  twitterImage: text("twitter_image"),
  canonicalUrl: text("canonical_url"),
  robots: text("robots").default("index, follow"),
  structuredData: text("structured_data"), // JSON-LD as string
  customTags: text("custom_tags"), // Additional meta tags as JSON
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertSeoConfigSchema = createInsertSchema(seoConfigs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type SeoConfig = typeof seoConfigs.$inferSelect;
export type InsertSeoConfig = z.infer<typeof insertSeoConfigSchema>;

// =====================================================
// REFERRAL & AFFILIATE SYSTEM
// =====================================================
// Multi-host referral program for dwsc.io and yourlegacy.io
// =====================================================

export const REFERRAL_HOSTS = ["dwsc.io", "yourlegacy.io"] as const;
export type ReferralHost = typeof REFERRAL_HOSTS[number];

export const AFFILIATE_TIERS = ["base", "silver", "gold", "platinum", "diamond"] as const;
export type AffiliateTier = typeof AFFILIATE_TIERS[number];

export const REFERRAL_STATUS = ["pending", "qualified", "converted", "expired", "fraud"] as const;
export type ReferralStatus = typeof REFERRAL_STATUS[number];

// Referral Codes - Unique codes per user per host
export const referralCodes = pgTable("referral_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  code: text("code").notNull().unique(),
  host: text("host").notNull().default("dwsc.io"),
  isActive: boolean("is_active").notNull().default(true),
  clickCount: integer("click_count").notNull().default(0),
  signupCount: integer("signup_count").notNull().default(0),
  conversionCount: integer("conversion_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertReferralCodeSchema = createInsertSchema(referralCodes).omit({
  id: true,
  clickCount: true,
  signupCount: true,
  conversionCount: true,
  createdAt: true,
  updatedAt: true,
});

export type ReferralCode = typeof referralCodes.$inferSelect;
export type InsertReferralCode = z.infer<typeof insertReferralCodeSchema>;

// Referrals - Tracks who referred whom
export const referrals = pgTable("referrals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  referrerId: text("referrer_id").notNull(),
  refereeId: text("referee_id").notNull(),
  referralCodeId: varchar("referral_code_id").references(() => referralCodes.id),
  host: text("host").notNull().default("dwsc.io"),
  status: text("status").notNull().default("pending"),
  referrerReward: integer("referrer_reward").notNull().default(0),
  refereeReward: integer("referee_reward").notNull().default(0),
  conversionValue: integer("conversion_value").default(0),
  commissionAmount: integer("commission_amount").default(0),
  qualifiedAt: timestamp("qualified_at"),
  convertedAt: timestamp("converted_at"),
  shellsPaid: boolean("shells_paid").default(false),
  shellsPaidAt: timestamp("shells_paid_at"),
  shellsAmount: integer("shells_amount").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertReferralSchema = createInsertSchema(referrals).omit({
  id: true,
  qualifiedAt: true,
  convertedAt: true,
  createdAt: true,
});

export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = z.infer<typeof insertReferralSchema>;

// Referral Events - Granular milestone tracking
export const referralEvents = pgTable("referral_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  referralId: varchar("referral_id").notNull().references(() => referrals.id, { onDelete: "cascade" }),
  eventType: text("event_type").notNull(),
  eventData: text("event_data"),
  creditsAwarded: integer("credits_awarded").default(0),
  commissionAwarded: integer("commission_awarded").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertReferralEventSchema = createInsertSchema(referralEvents).omit({
  id: true,
  createdAt: true,
});

export type ReferralEvent = typeof referralEvents.$inferSelect;
export type InsertReferralEvent = z.infer<typeof insertReferralEventSchema>;

// Affiliate Tiers - Configurable tier thresholds and perks
export const affiliateTiers = pgTable("affiliate_tiers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  host: text("host").notNull().default("dwsc.io"),
  minConversions: integer("min_conversions").notNull().default(0),
  minRevenue: integer("min_revenue").notNull().default(0),
  referrerRewardCredits: integer("referrer_reward_credits").notNull().default(250),
  refereeRewardCredits: integer("referee_reward_credits").notNull().default(100),
  commissionPercent: integer("commission_percent").notNull().default(10),
  badgeColor: text("badge_color").default("#06b6d4"),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAffiliateTierSchema = createInsertSchema(affiliateTiers).omit({
  id: true,
  createdAt: true,
});

export type AffiliateTierRecord = typeof affiliateTiers.$inferSelect;
export type InsertAffiliateTier = z.infer<typeof insertAffiliateTierSchema>;

// Commission Payouts - Disbursement ledger with full lifecycle tracking
export const commissionPayouts = pgTable("commission_payouts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  affiliateUserId: text("affiliate_user_id"),
  host: text("host").notNull().default("dwsc.io"),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull().default("USD"),
  status: text("status").notNull().default("pending"),
  payoutStatus: text("payout_status").notNull().default("accruing"),
  distributionMode: text("distribution_mode").notNull().default("cash"),
  amountDwc: text("amount_dwc"),
  exchangeRate: text("exchange_rate"),
  exchangeRateSource: text("exchange_rate_source"),
  treasuryTxHash: text("treasury_tx_hash"),
  payoutTransactionHash: text("payout_transaction_hash"),
  payoutMethod: text("payout_method"),
  paidAt: timestamp("paid_at"),
  orbitSyncStatus: text("orbit_sync_status").default("pending"),
  orbitSyncedAt: timestamp("orbit_synced_at"),
  stripePaymentIntent: text("stripe_payment_intent"),
  stripeSettlementStatus: text("stripe_settlement_status"),
  settledAt: timestamp("settled_at"),
  eligibleForPayoutAt: timestamp("eligible_for_payout_at"),
  payoutBatchId: text("payout_batch_id"),
  paymentMethod: text("payment_method"),
  paymentDetails: text("payment_details"),
  processedAt: timestamp("processed_at"),
  failureReason: text("failure_reason"),
  retryCount: integer("retry_count").default(0),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCommissionPayoutSchema = createInsertSchema(commissionPayouts).omit({
  id: true,
  treasuryTxHash: true,
  orbitSyncedAt: true,
  settledAt: true,
  eligibleForPayoutAt: true,
  processedAt: true,
  createdAt: true,
  updatedAt: true,
});

export type CommissionPayout = typeof commissionPayouts.$inferSelect;
export type InsertCommissionPayout = z.infer<typeof insertCommissionPayoutSchema>;

// User Affiliate Profile - Stores per-user affiliate status with wallet for SIG payouts
export const affiliateProfiles = pgTable("affiliate_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull().unique(),
  currentTier: text("current_tier").notNull().default("explorer"),
  totalReferrals: integer("total_referrals").notNull().default(0),
  qualifiedReferrals: integer("qualified_referrals").notNull().default(0),
  lifetimeConversions: integer("lifetime_conversions").notNull().default(0),
  lifetimeCreditsEarned: integer("lifetime_credits_earned").notNull().default(0),
  lifetimeCommissionEarned: integer("lifetime_commission_earned").notNull().default(0),
  pendingCommission: integer("pending_commission").notNull().default(0),
  paidCommission: integer("paid_commission").notNull().default(0),
  airdropBalance: integer("airdrop_balance").notNull().default(0),
  airdropBalanceDwc: text("airdrop_balance_dwc"),
  airdropStatus: text("airdrop_status").default("accumulating"),
  preferredHost: text("preferred_host").default("dwsc.io"),
  dwcWalletAddress: text("dwc_wallet_address"),
  walletVerified: boolean("wallet_verified").default(false),
  walletVerifiedAt: timestamp("wallet_verified_at"),
  minPayoutThreshold: integer("min_payout_threshold").default(5000),
  payoutMethod: text("payout_method").default("dwc"),
  payoutDetails: text("payout_details"),
  isAffiliate: boolean("is_affiliate").notNull().default(false),
  affiliateApprovedAt: timestamp("affiliate_approved_at"),
  lastPayoutAt: timestamp("last_payout_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertAffiliateProfileSchema = createInsertSchema(affiliateProfiles).omit({
  id: true,
  totalReferrals: true,
  qualifiedReferrals: true,
  lifetimeConversions: true,
  lifetimeCreditsEarned: true,
  lifetimeCommissionEarned: true,
  pendingCommission: true,
  paidCommission: true,
  airdropBalance: true,
  airdropBalanceDwc: true,
  airdropStatus: true,
  affiliateApprovedAt: true,
  createdAt: true,
  updatedAt: true,
});

export type AffiliateProfile = typeof affiliateProfiles.$inferSelect;
export type InsertAffiliateProfile = z.infer<typeof insertAffiliateProfileSchema>;

// =====================================================
// ECOSYSTEM AFFILIATE SYSTEM - Cross-Platform Integration
// Unified affiliate tracking for Trust Layer, TL Driver Connect, Happy Eats
// =====================================================

export const ecosystemAffiliates = pgTable("ecosystem_affiliates", {
  id: serial("id").primaryKey(),
  trustLayerId: text("trust_layer_id").notNull().unique(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  source: text("source").notNull().default("tl"),
  verified: boolean("verified").notNull().default(false),
  totalReferrals: integer("total_referrals").notNull().default(0),
  qualifiedReferrals: integer("qualified_referrals").notNull().default(0),
  totalEarningsCents: integer("total_earnings_cents").notNull().default(0),
  pendingBalanceCents: integer("pending_balance_cents").notNull().default(0),
  paidBalanceCents: integer("paid_balance_cents").notNull().default(0),
  status: text("status").notNull().default("active"),
  userId: text("user_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertEcosystemAffiliateSchema = createInsertSchema(ecosystemAffiliates).omit({
  id: true,
  totalReferrals: true,
  qualifiedReferrals: true,
  totalEarningsCents: true,
  pendingBalanceCents: true,
  paidBalanceCents: true,
  createdAt: true,
  updatedAt: true,
});

export type EcosystemAffiliate = typeof ecosystemAffiliates.$inferSelect;
export type InsertEcosystemAffiliate = z.infer<typeof insertEcosystemAffiliateSchema>;

export const ecosystemReferrals = pgTable("ecosystem_referrals", {
  id: serial("id").primaryKey(),
  affiliateId: integer("affiliate_id").notNull().references(() => ecosystemAffiliates.id),
  referredType: text("referred_type").notNull().default("vendor"),
  referredName: text("referred_name").notNull(),
  referredEmail: text("referred_email"),
  referredEntityId: integer("referred_entity_id"),
  platform: text("platform").notNull().default("tl"),
  status: text("status").notNull().default("pending"),
  activatedAt: timestamp("activated_at"),
  daysActive: integer("days_active").notNull().default(0),
  revenueGeneratedCents: integer("revenue_generated_cents").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertEcosystemReferralSchema = createInsertSchema(ecosystemReferrals).omit({
  id: true,
  activatedAt: true,
  daysActive: true,
  revenueGeneratedCents: true,
  createdAt: true,
});

export type EcosystemReferral = typeof ecosystemReferrals.$inferSelect;
export type InsertEcosystemReferral = z.infer<typeof insertEcosystemReferralSchema>;

export const ecosystemRewardsLedger = pgTable("ecosystem_rewards_ledger", {
  id: serial("id").primaryKey(),
  affiliateId: integer("affiliate_id").notNull().references(() => ecosystemAffiliates.id),
  referralId: integer("referral_id").references(() => ecosystemReferrals.id),
  type: text("type").notNull(),
  amountCents: integer("amount_cents").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull().default("held"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertEcosystemRewardSchema = createInsertSchema(ecosystemRewardsLedger).omit({
  id: true,
  paidAt: true,
  createdAt: true,
});

export type EcosystemReward = typeof ecosystemRewardsLedger.$inferSelect;
export type InsertEcosystemReward = z.infer<typeof insertEcosystemRewardSchema>;

// Fraud Flags - Soft indicators for suspicious activity
export const fraudFlags = pgTable("fraud_flags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  referralId: varchar("referral_id").references(() => referrals.id),
  userId: text("user_id"),
  flagType: text("flag_type").notNull(),
  reason: text("reason").notNull(),
  severity: text("severity").notNull().default("low"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  isResolved: boolean("is_resolved").notNull().default(false),
  resolvedBy: text("resolved_by"),
  resolvedAt: timestamp("resolved_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertFraudFlagSchema = createInsertSchema(fraudFlags).omit({
  id: true,
  isResolved: true,
  resolvedBy: true,
  resolvedAt: true,
  createdAt: true,
});

export type FraudFlag = typeof fraudFlags.$inferSelect;
export type InsertFraudFlag = z.infer<typeof insertFraudFlagSchema>;

// Referral reward constants
export const REFERRAL_REWARDS = {
  REFERRER_SIGNUP_BONUS: 250,
  REFEREE_SIGNUP_BONUS: 100,
  REFERRER_CONVERSION_BONUS: 500,
  COMMISSION_PERCENT_DEFAULT: 10,
} as const;

// ============================================
// HALLMARK AFFILIATE V2 TABLES
// ============================================

export const HALLMARK_AFFILIATE_TIERS = {
  base: { conversions: 0, rate: 10 },
  silver: { conversions: 5, rate: 12.5 },
  gold: { conversions: 15, rate: 15 },
  platinum: { conversions: 30, rate: 17.5 },
  diamond: { conversions: 50, rate: 20 },
} as const;

export const affiliateReferralsV2 = pgTable("affiliate_referrals_v2", {
  id: serial("id").primaryKey(),
  referrerId: integer("referrer_id").notNull(),
  referredUserId: integer("referred_user_id"),
  referralHash: text("referral_hash").notNull(),
  platform: text("platform").notNull().default("trustlayer"),
  status: text("status").notNull().default("pending"),
  convertedAt: timestamp("converted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAffiliateReferralV2Schema = createInsertSchema(affiliateReferralsV2).omit({
  id: true,
  convertedAt: true,
  createdAt: true,
});

export type AffiliateReferralV2 = typeof affiliateReferralsV2.$inferSelect;
export type InsertAffiliateReferralV2 = z.infer<typeof insertAffiliateReferralV2Schema>;

export const affiliateCommissionsV2 = pgTable("affiliate_commissions_v2", {
  id: serial("id").primaryKey(),
  referrerId: integer("referrer_id").notNull(),
  referralId: integer("referral_id"),
  amount: text("amount").notNull(),
  currency: text("currency").default("SIG"),
  tier: text("tier").default("base"),
  status: text("status").default("pending"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAffiliateCommissionV2Schema = createInsertSchema(affiliateCommissionsV2).omit({
  id: true,
  paidAt: true,
  createdAt: true,
});

export type AffiliateCommissionV2 = typeof affiliateCommissionsV2.$inferSelect;
export type InsertAffiliateCommissionV2 = z.infer<typeof insertAffiliateCommissionV2Schema>;

// ============================================
// COMMUNITY HUB
// ============================================

export const communities = pgTable("communities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon").default("⚡"),
  imageUrl: text("image_url"),
  ownerId: text("owner_id").notNull(),
  isVerified: boolean("is_verified").notNull().default(false),
  isPublic: boolean("is_public").notNull().default(true),
  memberCount: integer("member_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const communityChannels = pgTable("community_channels", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  communityId: varchar("community_id").notNull().references(() => communities.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull().default("chat"),
  position: integer("position").notNull().default(0),
  isLocked: boolean("is_locked").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const communityMembers = pgTable("community_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  communityId: varchar("community_id").notNull().references(() => communities.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  username: text("username").notNull(),
  role: text("role").notNull().default("member"),
  isOnline: boolean("is_online").notNull().default(false),
  lastSeenAt: timestamp("last_seen_at").defaultNow(),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

export const communityMessages = pgTable("community_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  channelId: varchar("channel_id").notNull().references(() => communityChannels.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  username: text("username").notNull(),
  content: text("content").notNull(),
  isBot: boolean("is_bot").notNull().default(false),
  replyToId: varchar("reply_to_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  editedAt: timestamp("edited_at"),
});

export const communityBots = pgTable("community_bots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  communityId: varchar("community_id").notNull().references(() => communities.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon").default("🤖"),
  webhookUrl: text("webhook_url"),
  apiKey: text("api_key"),
  isActive: boolean("is_active").notNull().default(true),
  permissions: text("permissions").default("read,write"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const messageReactions = pgTable("message_reactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  messageId: varchar("message_id").notNull().references(() => communityMessages.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  username: text("username").notNull(),
  emoji: text("emoji").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const messageAttachments = pgTable("message_attachments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  messageId: varchar("message_id").notNull().references(() => communityMessages.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  url: text("url").notNull(),
  filename: text("filename"),
  size: integer("size"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const memberTips = pgTable("member_tips", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fromUserId: text("from_user_id").notNull(),
  fromUsername: text("from_username").notNull(),
  toUserId: text("to_user_id").notNull(),
  toUsername: text("to_username").notNull(),
  communityId: varchar("community_id").notNull().references(() => communities.id, { onDelete: "cascade" }),
  amount: text("amount").notNull(),
  messageId: varchar("message_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCommunitySchema = createInsertSchema(communities).omit({
  id: true,
  memberCount: true,
  createdAt: true,
  updatedAt: true,
});

export const insertChannelSchema = createInsertSchema(communityChannels).omit({
  id: true,
  createdAt: true,
});

export const insertMemberSchema = createInsertSchema(communityMembers).omit({
  id: true,
  isOnline: true,
  lastSeenAt: true,
  joinedAt: true,
});

export const insertCommunityMessageSchema = createInsertSchema(communityMessages).omit({
  id: true,
  createdAt: true,
  editedAt: true,
});

export const insertBotSchema = createInsertSchema(communityBots).omit({
  id: true,
  createdAt: true,
});

export const insertReactionSchema = createInsertSchema(messageReactions).omit({
  id: true,
  createdAt: true,
});

export const insertAttachmentSchema = createInsertSchema(messageAttachments).omit({
  id: true,
  createdAt: true,
});

export const insertTipSchema = createInsertSchema(memberTips).omit({
  id: true,
  createdAt: true,
});

// =====================================================
// SHELLS ECONOMY SYSTEM (formerly "Orbs" - renamed for brand distinction)
// =====================================================

export const shellWallets = pgTable("orb_wallets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull().unique(),
  username: text("username").notNull(),
  balance: integer("balance").notNull().default(0),
  lockedBalance: integer("locked_balance").notNull().default(0),
  totalEarned: integer("total_earned").notNull().default(0),
  totalSpent: integer("total_spent").notNull().default(0),
  dailyEarned: integer("daily_earned").notNull().default(0),
  weeklyEarned: integer("weekly_earned").notNull().default(0),
  lastDailyReset: timestamp("last_daily_reset").defaultNow().notNull(),
  lastWeeklyReset: timestamp("last_weekly_reset").defaultNow().notNull(),
  starterBonusClaimed: boolean("starter_bonus_claimed").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const shellTransactions = pgTable("orb_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletId: varchar("wallet_id").notNull().references(() => shellWallets.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  type: text("type").notNull(), // 'earn', 'spend', 'tip_sent', 'tip_received', 'purchase', 'refund', 'conversion'
  amount: integer("amount").notNull(),
  balance: integer("balance").notNull(), // Balance after transaction
  description: text("description"),
  referenceId: text("reference_id"), // For linking to tips, purchases, etc.
  referenceType: text("reference_type"), // 'tip', 'stripe_payment', 'feature_unlock', etc.
  metadata: text("metadata"), // JSON string for extra data
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const shellConversionSnapshots = pgTable("orb_conversion_snapshots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  walletId: varchar("wallet_id").notNull().references(() => shellWallets.id),
  orbBalance: integer("orb_balance").notNull(),
  dwcAmount: text("dwc_amount").notNull(), // Conversion amount in SIG
  conversionRate: text("conversion_rate").notNull(),
  status: text("status").notNull().default("pending"), // 'pending', 'converted', 'claimed'
  snapshotAt: timestamp("snapshot_at").defaultNow().notNull(),
  convertedAt: timestamp("converted_at"),
});

export const insertShellWalletSchema = createInsertSchema(shellWallets).omit({
  id: true,
  balance: true,
  lockedBalance: true,
  totalEarned: true,
  totalSpent: true,
  dailyEarned: true,
  weeklyEarned: true,
  lastDailyReset: true,
  lastWeeklyReset: true,
  starterBonusClaimed: true,
  createdAt: true,
  updatedAt: true,
});

export const insertShellTransactionSchema = createInsertSchema(shellTransactions).omit({
  id: true,
  createdAt: true,
});

export type ShellWallet = typeof shellWallets.$inferSelect;
export type InsertShellWallet = z.infer<typeof insertShellWalletSchema>;
export type ShellTransaction = typeof shellTransactions.$inferSelect;
export type InsertShellTransaction = z.infer<typeof insertShellTransactionSchema>;
export type ShellConversionSnapshot = typeof shellConversionSnapshots.$inferSelect;

// Legacy aliases for backward compatibility
export const orbWallets = shellWallets;
export const orbTransactions = shellTransactions;
export const orbConversionSnapshots = shellConversionSnapshots;
export type OrbWallet = ShellWallet;
export type OrbTransaction = ShellTransaction;
export type OrbConversionSnapshot = ShellConversionSnapshot;

// Shell Purchase Receipts - Track all Stripe purchases of Shell bundles
export const shellPurchaseReceipts = pgTable("shell_purchase_receipts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  stripePaymentIntentId: text("stripe_payment_intent_id").notNull().unique(),
  stripeCustomerId: text("stripe_customer_id"),
  bundleKey: text("bundle_key").notNull(), // 'starter', 'pro', 'elite', 'founders'
  shellAmount: integer("shell_amount").notNull(),
  amountPaidCents: integer("amount_paid_cents").notNull(),
  currency: text("currency").notNull().default("usd"),
  status: text("status").notNull().default("completed"), // 'pending', 'completed', 'refunded', 'failed'
  conversionEligible: boolean("conversion_eligible").notNull().default(true),
  dwcConversionRate: text("dwc_conversion_rate"), // Rate at time of purchase (null until set)
  dwcConversionAmount: text("dwc_conversion_amount"), // Calculated SIG amount
  conversionStatus: text("conversion_status").default("pending"), // 'pending', 'converted', 'claimed'
  convertedAt: timestamp("converted_at"),
  metadata: text("metadata"), // JSON for extra data
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User Financial Consents - Track ToS acceptance for crypto/virtual currency
export const userFinancialConsents = pgTable("user_financial_consents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  consentType: text("consent_type").notNull(), // 'virtual_currency_tos', 'crypto_disclosure', 'dwc_conversion_terms'
  version: text("version").notNull(), // ToS version number
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  consentedAt: timestamp("consented_at").defaultNow().notNull(),
});

// Shell Bundle Products - Configuration for purchasable bundles
export const shellBundleProducts = pgTable("shell_bundle_products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bundleKey: text("bundle_key").notNull().unique(), // 'starter', 'pro', 'elite', 'founders'
  displayName: text("display_name").notNull(),
  shellAmount: integer("shell_amount").notNull(),
  priceUsdCents: integer("price_usd_cents").notNull(),
  stripePriceId: text("stripe_price_id"), // Stripe Price ID
  stripeProductId: text("stripe_product_id"), // Stripe Product ID
  bonusPercentage: integer("bonus_percentage").default(0), // Extra shells as bonus
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type ShellPurchaseReceipt = typeof shellPurchaseReceipts.$inferSelect;
export type UserFinancialConsent = typeof userFinancialConsents.$inferSelect;
export type ShellBundleProduct = typeof shellBundleProducts.$inferSelect;

// =====================================================
// CHRONOCHAT ENHANCED FEATURES
// =====================================================

// Direct Messages
export const dmConversations = pgTable("dm_conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  participant1Id: text("participant1_id").notNull(),
  participant1Name: text("participant1_name").notNull(),
  participant2Id: text("participant2_id").notNull(),
  participant2Name: text("participant2_name").notNull(),
  lastMessageAt: timestamp("last_message_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const directMessages = pgTable("direct_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull().references(() => dmConversations.id, { onDelete: "cascade" }),
  senderId: text("sender_id").notNull(),
  senderName: text("sender_name").notNull(),
  content: text("content").notNull(),
  attachmentUrl: text("attachment_url"),
  attachmentName: text("attachment_name"),
  attachmentType: text("attachment_type"),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Polls
export const communityPolls = pgTable("community_polls", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  channelId: varchar("channel_id").notNull().references(() => communityChannels.id, { onDelete: "cascade" }),
  creatorId: text("creator_id").notNull(),
  creatorName: text("creator_name").notNull(),
  question: text("question").notNull(),
  options: text("options").notNull(), // JSON array of options
  allowMultiple: boolean("allow_multiple").notNull().default(false),
  endsAt: timestamp("ends_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const pollVotes = pgTable("poll_votes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  pollId: varchar("poll_id").notNull().references(() => communityPolls.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  optionIndex: integer("option_index").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Scheduled Messages
export const scheduledMessages = pgTable("scheduled_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  channelId: varchar("channel_id").notNull().references(() => communityChannels.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  username: text("username").notNull(),
  content: text("content").notNull(),
  attachmentUrl: text("attachment_url"),
  scheduledFor: timestamp("scheduled_for").notNull(),
  status: text("status").notNull().default("pending"), // pending, sent, cancelled
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Community Roles with Permissions
export const communityRoles = pgTable("community_roles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  communityId: varchar("community_id").notNull().references(() => communities.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  color: text("color").default("#6366f1"),
  position: integer("position").notNull().default(0),
  permissions: text("permissions").notNull().default("read,write"), // comma-separated: read,write,pin,delete,kick,ban,manage_roles,manage_channels,admin
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Custom Emojis
export const customEmojis = pgTable("custom_emojis", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  communityId: varchar("community_id").notNull().references(() => communities.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  imageUrl: text("image_url").notNull(),
  uploaderId: text("uploader_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Notification Settings
export const memberNotificationSettings = pgTable("member_notification_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  communityId: varchar("community_id").notNull().references(() => communities.id, { onDelete: "cascade" }),
  channelId: varchar("channel_id"),
  level: text("level").notNull().default("all"), // all, mentions, muted
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Pinned Messages (linking table)
export const pinnedMessages = pgTable("pinned_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  messageId: varchar("message_id").notNull().references(() => communityMessages.id, { onDelete: "cascade" }),
  channelId: varchar("channel_id").notNull().references(() => communityChannels.id, { onDelete: "cascade" }),
  pinnedById: text("pinned_by_id").notNull(),
  pinnedAt: timestamp("pinned_at").defaultNow().notNull(),
});

// Thread support - add threadParentId to messages for threading
export const messageThreads = pgTable("message_threads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  parentMessageId: varchar("parent_message_id").notNull().references(() => communityMessages.id, { onDelete: "cascade" }),
  channelId: varchar("channel_id").notNull().references(() => communityChannels.id, { onDelete: "cascade" }),
  replyCount: integer("reply_count").notNull().default(0),
  lastReplyAt: timestamp("last_reply_at").defaultNow(),
});

// Insert schemas for new tables
export const insertDmConversationSchema = createInsertSchema(dmConversations).omit({ id: true, lastMessageAt: true, createdAt: true });
export const insertDirectMessageSchema = createInsertSchema(directMessages).omit({ id: true, isRead: true, createdAt: true });
export const insertPollSchema = createInsertSchema(communityPolls).omit({ id: true, createdAt: true });
export const insertPollVoteSchema = createInsertSchema(pollVotes).omit({ id: true, createdAt: true });
export const insertScheduledMessageSchema = createInsertSchema(scheduledMessages).omit({ id: true, status: true, createdAt: true });
export const insertCommunityRoleSchema = createInsertSchema(communityRoles).omit({ id: true, createdAt: true });
export const insertCustomEmojiSchema = createInsertSchema(customEmojis).omit({ id: true, createdAt: true });
export const insertNotificationSettingSchema = createInsertSchema(memberNotificationSettings).omit({ id: true, updatedAt: true });
export const insertPinnedMessageSchema = createInsertSchema(pinnedMessages).omit({ id: true, pinnedAt: true });
export const insertMessageThreadSchema = createInsertSchema(messageThreads).omit({ id: true, replyCount: true, lastReplyAt: true });

// Types for new tables
export type DmConversation = typeof dmConversations.$inferSelect;
export type InsertDmConversation = z.infer<typeof insertDmConversationSchema>;
export type DirectMessage = typeof directMessages.$inferSelect;
export type InsertDirectMessage = z.infer<typeof insertDirectMessageSchema>;
export type CommunityPoll = typeof communityPolls.$inferSelect;
export type InsertPoll = z.infer<typeof insertPollSchema>;
export type PollVote = typeof pollVotes.$inferSelect;
export type InsertPollVote = z.infer<typeof insertPollVoteSchema>;
export type ScheduledMessage = typeof scheduledMessages.$inferSelect;
export type InsertScheduledMessage = z.infer<typeof insertScheduledMessageSchema>;
export type CommunityRole = typeof communityRoles.$inferSelect;
export type InsertCommunityRole = z.infer<typeof insertCommunityRoleSchema>;
export type CustomEmoji = typeof customEmojis.$inferSelect;
export type InsertCustomEmoji = z.infer<typeof insertCustomEmojiSchema>;
export type MemberNotificationSetting = typeof memberNotificationSettings.$inferSelect;
export type InsertNotificationSetting = z.infer<typeof insertNotificationSettingSchema>;
export type PinnedMessage = typeof pinnedMessages.$inferSelect;
export type InsertPinnedMessage = z.infer<typeof insertPinnedMessageSchema>;
export type MessageThread = typeof messageThreads.$inferSelect;
export type InsertMessageThread = z.infer<typeof insertMessageThreadSchema>;

export type Community = typeof communities.$inferSelect;
export type InsertCommunity = z.infer<typeof insertCommunitySchema>;
export type CommunityChannel = typeof communityChannels.$inferSelect;
export type InsertChannel = z.infer<typeof insertChannelSchema>;
export type CommunityMember = typeof communityMembers.$inferSelect;
export type InsertMember = z.infer<typeof insertMemberSchema>;
export type CommunityMessage = typeof communityMessages.$inferSelect;
export type InsertCommunityMessage = z.infer<typeof insertCommunityMessageSchema>;
export type CommunityBot = typeof communityBots.$inferSelect;
export type InsertBot = z.infer<typeof insertBotSchema>;
export type MessageReaction = typeof messageReactions.$inferSelect;
export type InsertReaction = z.infer<typeof insertReactionSchema>;
export type MessageAttachment = typeof messageAttachments.$inferSelect;
export type InsertAttachment = z.infer<typeof insertAttachmentSchema>;
export type MemberTip = typeof memberTips.$inferSelect;
export type InsertTip = z.infer<typeof insertTipSchema>;

// ============================================
// GUARDIAN SECURITY PLATFORM TABLES
// ============================================

// Guardian Certifications - tracks audit certifications for projects
export const guardianCertifications = pgTable("guardian_certifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectName: text("project_name").notNull(),
  projectUrl: text("project_url"),
  contactEmail: text("contact_email").notNull(),
  tier: text("tier").notNull(), // 'self_cert', 'assurance_lite', 'guardian_premier'
  status: text("status").notNull().default("pending"), // 'pending', 'in_progress', 'completed', 'revoked'
  score: integer("score"), // 0-100 security score
  findings: text("findings"), // JSON string of findings
  reportHash: text("report_hash"), // SHA-256 hash of full report
  nftTokenId: text("nft_token_id"), // Token ID if minted as NFT
  blockchainTxHash: text("blockchain_tx_hash"), // Transaction hash of on-chain stamp
  stripePaymentId: text("stripe_payment_id"),
  userId: text("user_id"), // Owner's user ID
  validFrom: timestamp("valid_from"),
  validUntil: timestamp("valid_until"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Guardian Monitored Assets - contracts/wallets being monitored via Shield
export const guardianMonitoredAssets = pgTable("guardian_monitored_assets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  assetType: text("asset_type").notNull(), // 'contract', 'wallet', 'validator', 'bridge', 'pool'
  assetAddress: text("asset_address").notNull(),
  assetName: text("asset_name"),
  chainId: text("chain_id").notNull(), // 'dwsc', 'ethereum', 'solana', etc.
  status: text("status").notNull().default("active"), // 'active', 'paused', 'removed'
  alertChannels: text("alert_channels"), // JSON: { email: true, discord: '...', slack: '...' }
  monitoringTier: text("monitoring_tier").notNull(), // 'watch', 'shield', 'command'
  lastCheckedAt: timestamp("last_checked_at"),
  healthScore: integer("health_score"), // 0-100
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Guardian Incidents - security alerts and incidents detected
export const guardianIncidents = pgTable("guardian_incidents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  assetId: varchar("asset_id").references(() => guardianMonitoredAssets.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  severity: text("severity").notNull(), // 'critical', 'high', 'medium', 'low', 'info'
  incidentType: text("incident_type").notNull(), // 'rug_pull', 'governance_attack', 'unusual_activity', 'whale_movement', etc.
  title: text("title").notNull(),
  description: text("description").notNull(),
  evidence: text("evidence"), // JSON: { txHashes: [], screenshots: [], merkleProof: '' }
  status: text("status").notNull().default("open"), // 'open', 'acknowledged', 'investigating', 'resolved', 'false_positive'
  blockchainTxHash: text("blockchain_tx_hash"), // On-chain stamp of incident
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Guardian Blockchain Stamps - immutable on-chain records of all Guardian activities
export const guardianBlockchainStamps = pgTable("guardian_blockchain_stamps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  stampType: text("stamp_type").notNull(), // 'certification', 'payment', 'incident', 'report', 'nft_mint'
  referenceId: text("reference_id").notNull(), // ID of the related record
  referenceType: text("reference_type").notNull(), // 'certification', 'incident', 'asset', 'payment'
  dataHash: text("data_hash").notNull(), // SHA-256 hash of the stamped data
  merkleRoot: text("merkle_root"), // Merkle root if batched
  blockNumber: integer("block_number"),
  transactionHash: text("transaction_hash"),
  chainId: text("chain_id").notNull().default("dwsc"),
  status: text("status").notNull().default("pending"), // 'pending', 'confirmed', 'failed'
  metadata: text("metadata"), // JSON additional metadata
  createdAt: timestamp("created_at").defaultNow().notNull(),
  confirmedAt: timestamp("confirmed_at"),
});

// Guardian Subscriptions - Shield monitoring subscriptions
export const guardianSubscriptions = pgTable("guardian_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  tier: text("tier").notNull(), // 'watch', 'shield', 'command'
  status: text("status").notNull().default("active"), // 'active', 'paused', 'cancelled', 'expired'
  stripeSubscriptionId: text("stripe_subscription_id"),
  assetLimit: integer("asset_limit").notNull().default(5),
  currentAssetCount: integer("current_asset_count").notNull().default(0),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
  cancelledAt: timestamp("cancelled_at"),
});

// Insert schemas
export const insertGuardianCertificationSchema = createInsertSchema(guardianCertifications).omit({
  id: true, createdAt: true, updatedAt: true
});
export const insertGuardianMonitoredAssetSchema = createInsertSchema(guardianMonitoredAssets).omit({
  id: true, createdAt: true, lastCheckedAt: true
});
export const insertGuardianIncidentSchema = createInsertSchema(guardianIncidents).omit({
  id: true, createdAt: true, resolvedAt: true
});
export const insertGuardianBlockchainStampSchema = createInsertSchema(guardianBlockchainStamps).omit({
  id: true, createdAt: true, confirmedAt: true
});
export const insertGuardianSubscriptionSchema = createInsertSchema(guardianSubscriptions).omit({
  id: true, startedAt: true
});

// Types
export type GuardianCertification = typeof guardianCertifications.$inferSelect;
export type InsertGuardianCertification = z.infer<typeof insertGuardianCertificationSchema>;
export type GuardianMonitoredAsset = typeof guardianMonitoredAssets.$inferSelect;
export type InsertGuardianMonitoredAsset = z.infer<typeof insertGuardianMonitoredAssetSchema>;
export type GuardianIncident = typeof guardianIncidents.$inferSelect;
export type InsertGuardianIncident = z.infer<typeof insertGuardianIncidentSchema>;
export type GuardianBlockchainStamp = typeof guardianBlockchainStamps.$inferSelect;
export type InsertGuardianBlockchainStamp = z.infer<typeof insertGuardianBlockchainStampSchema>;
export type GuardianSubscription = typeof guardianSubscriptions.$inferSelect;
export type InsertGuardianSubscription = z.infer<typeof insertGuardianSubscriptionSchema>;

// ============================================
// ARCADE GAME LEADERBOARDS
// ============================================

export const arcadeLeaderboard = pgTable("arcade_leaderboard", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  game: text("game").notNull(), // 'pacman', 'galaga', 'snake', 'tetris', 'minesweeper'
  userId: text("user_id").notNull(),
  username: text("username"),
  score: integer("score").notNull(),
  level: integer("level"),
  metadata: text("metadata"), // JSON for game-specific data
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertArcadeLeaderboardSchema = createInsertSchema(arcadeLeaderboard).omit({
  id: true,
  createdAt: true,
});

export type ArcadeLeaderboardEntry = typeof arcadeLeaderboard.$inferSelect;
export type InsertArcadeLeaderboardEntry = z.infer<typeof insertArcadeLeaderboardSchema>;

// ============================================
// WALLET CLOUD BACKUPS
// ============================================

export const walletBackups = pgTable("wallet_backups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  backupName: text("backup_name").notNull().default("Primary Wallet"),
  encryptedData: text("encrypted_data").notNull(), // AES-256-GCM encrypted mnemonic
  walletAddresses: text("wallet_addresses"), // JSON of derived addresses for display
  deviceId: text("device_id"), // Optional device identifier
  isActive: boolean("is_active").notNull().default(true),
  lastSyncedAt: timestamp("last_synced_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertWalletBackupSchema = createInsertSchema(walletBackups).omit({
  id: true,
  createdAt: true,
  lastSyncedAt: true,
});

export type WalletBackup = typeof walletBackups.$inferSelect;
export type InsertWalletBackup = z.infer<typeof insertWalletBackupSchema>;

// ============================================
// WALLET BIOMETRIC CREDENTIALS
// Stores encrypted wallet password for fingerprint unlock
// ============================================

export const walletBiometricCredentials = pgTable("wallet_biometric_credentials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull().unique(), // One biometric credential per user
  encryptedPassword: text("encrypted_password").notNull(), // AES-256-GCM encrypted wallet password
  encryptionIv: text("encryption_iv").notNull(), // IV for decryption
  isActive: boolean("is_active").notNull().default(true),
  lastUsedAt: timestamp("last_used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertWalletBiometricCredentialSchema = createInsertSchema(walletBiometricCredentials).omit({
  id: true,
  createdAt: true,
  lastUsedAt: true,
});

export type WalletBiometricCredential = typeof walletBiometricCredentials.$inferSelect;
export type InsertWalletBiometricCredential = z.infer<typeof insertWalletBiometricCredentialSchema>;

// ============================================
// USER EXTERNAL WALLETS (Third-Party Wallets)
// ============================================

export const userExternalWallets = pgTable("user_external_wallets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  chain: text("chain").notNull(), // 'ethereum', 'solana', 'base', 'polygon', etc.
  address: text("address").notNull(),
  label: text("label"), // Optional friendly name
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserExternalWalletSchema = createInsertSchema(userExternalWallets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type UserExternalWallet = typeof userExternalWallets.$inferSelect;
export type InsertUserExternalWallet = z.infer<typeof insertUserExternalWalletSchema>;

// ============================================
// KYC VERIFICATION
// ============================================

export const kycVerifications = pgTable("kyc_verifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull().unique(),
  status: text("status").notNull().default("not_started"), // not_started, pending, verified, rejected
  fullName: text("full_name"),
  country: text("country"),
  verificationType: text("verification_type"), // basic, enhanced, institutional
  verifiedAt: timestamp("verified_at"),
  rejectionReason: text("rejection_reason"),
  metadata: text("metadata"), // JSON for additional data
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertKycVerificationSchema = createInsertSchema(kycVerifications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  verifiedAt: true,
});

export type KycVerification = typeof kycVerifications.$inferSelect;
export type InsertKycVerification = z.infer<typeof insertKycVerificationSchema>;

// ============================================
// GUARDIAN SECURITY SCORES - Real-time project ratings
// ============================================

export const guardianSecurityScores = pgTable("guardian_security_scores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: text("project_id").notNull(),
  projectName: text("project_name").notNull(),
  projectType: text("project_type").notNull(), // 'smart_contract', 'dapp', 'token', 'nft_collection', 'defi_protocol'
  contractAddress: text("contract_address"),
  chainId: text("chain_id").default("dwsc"),
  
  // Security Score Components (0-100 each)
  overallScore: integer("overall_score").notNull().default(0),
  codeQualityScore: integer("code_quality_score").notNull().default(0),
  vulnerabilityScore: integer("vulnerability_score").notNull().default(0),
  accessControlScore: integer("access_control_score").notNull().default(0),
  upgradeabilityScore: integer("upgradeability_score").notNull().default(0),
  testCoverageScore: integer("test_coverage_score").notNull().default(0),
  documentationScore: integer("documentation_score").notNull().default(0),
  
  // Status and Metadata
  status: text("status").notNull().default("pending"), // 'pending', 'analyzing', 'scored', 'certified', 'warning', 'critical'
  riskLevel: text("risk_level").notNull().default("unknown"), // 'low', 'medium', 'high', 'critical', 'unknown'
  certificationTier: text("certification_tier"), // null, 'self_cert', 'assurance_lite', 'guardian_premier'
  insuranceEligible: boolean("insurance_eligible").notNull().default(false),
  insuranceCoverage: text("insurance_coverage"), // Coverage amount in USD
  
  // Analysis Data
  lastScanHash: text("last_scan_hash"),
  issuesFound: integer("issues_found").notNull().default(0),
  criticalIssues: integer("critical_issues").notNull().default(0),
  warnings: integer("warnings").notNull().default(0),
  recommendations: text("recommendations"), // JSON array
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastScannedAt: timestamp("last_scanned_at"),
  certifiedAt: timestamp("certified_at"),
  expiresAt: timestamp("expires_at"),
});

export const insertGuardianSecurityScoreSchema = createInsertSchema(guardianSecurityScores).omit({
  id: true, createdAt: true, lastScannedAt: true, certifiedAt: true
});
export type GuardianSecurityScore = typeof guardianSecurityScores.$inferSelect;
export type InsertGuardianSecurityScore = z.infer<typeof insertGuardianSecurityScoreSchema>;

// ============================================
// CHRONOPASS IDENTITY - Unified cross-app identity with reputation
// ============================================

export const chronoPassIdentities = pgTable("chrono_pass_identities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull().unique(),
  displayName: text("display_name").notNull(),
  avatarUrl: text("avatar_url"),
  bannerUrl: text("banner_url"),
  bio: text("bio"),
  
  // Passkey/WebAuthn data
  passkeyCredentialId: text("passkey_credential_id"),
  passkeyPublicKey: text("passkey_public_key"),
  passkeyEnabled: boolean("passkey_enabled").notNull().default(false),
  
  // Reputation System (0-1000 scale)
  reputationScore: integer("reputation_score").notNull().default(100),
  trustLevel: text("trust_level").notNull().default("newcomer"), // 'newcomer', 'member', 'trusted', 'veteran', 'legend'
  verificationStatus: text("verification_status").notNull().default("unverified"), // 'unverified', 'email', 'phone', 'kyc', 'institutional'
  
  // Reputation Components
  communityScore: integer("community_score").notNull().default(0), // ChronoChat activity
  tradingScore: integer("trading_score").notNull().default(0), // DeFi activity
  gamingScore: integer("gaming_score").notNull().default(0), // Chronicles activity
  developerScore: integer("developer_score").notNull().default(0), // Developer contributions
  governanceScore: integer("governance_score").notNull().default(0), // Voting/proposals
  
  // Staking-based reputation boost
  shellsStaked: integer("shells_staked").notNull().default(0),
  dwcStaked: integer("dwc_staked").notNull().default(0),
  stakingBoostMultiplier: text("staking_boost_multiplier").default("1.0"),
  
  // Badges and achievements
  badges: text("badges"), // JSON array of earned badges
  titles: text("titles"), // JSON array of unlocked titles
  currentTitle: text("current_title"),
  
  // Cross-app access
  linkedApps: text("linked_apps"), // JSON array of connected apps
  apiAccessLevel: text("api_access_level").default("standard"), // 'standard', 'elevated', 'premium'
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastActiveAt: timestamp("last_active_at"),
});

export const insertChronoPassIdentitySchema = createInsertSchema(chronoPassIdentities).omit({
  id: true, createdAt: true, updatedAt: true, lastActiveAt: true
});
export type ChronoPassIdentity = typeof chronoPassIdentities.$inferSelect;
export type InsertChronoPassIdentity = z.infer<typeof insertChronoPassIdentitySchema>;

// ============================================
// EXPERIENCE SHARDS - Dedicated execution lanes with SLAs
// ============================================

export const experienceShards = pgTable("experience_shards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  shardType: text("shard_type").notNull(), // 'gaming', 'defi', 'nft', 'social', 'ai', 'custom'
  status: text("status").notNull().default("active"), // 'active', 'degraded', 'maintenance', 'offline'
  
  // Performance SLAs
  targetLatencyMs: integer("target_latency_ms").notNull().default(50),
  targetTps: integer("target_tps").notNull().default(10000),
  guaranteedUptime: text("guaranteed_uptime").default("99.9"),
  
  // Current Metrics
  currentLatencyMs: integer("current_latency_ms").notNull().default(0),
  currentTps: integer("current_tps").notNull().default(0),
  currentLoad: integer("current_load").notNull().default(0), // Percentage 0-100
  activeConnections: integer("active_connections").notNull().default(0),
  
  // Resource Allocation
  allocatedCpu: text("allocated_cpu").default("4"),
  allocatedMemoryGb: text("allocated_memory_gb").default("8"),
  allocatedStorageGb: text("allocated_storage_gb").default("100"),
  priorityLevel: integer("priority_level").notNull().default(1), // 1-10, higher = more priority
  
  // Autoscaling
  autoScaleEnabled: boolean("auto_scale_enabled").notNull().default(true),
  minInstances: integer("min_instances").notNull().default(1),
  maxInstances: integer("max_instances").notNull().default(10),
  currentInstances: integer("current_instances").notNull().default(1),
  
  // Billing
  pricePerRequestDwc: text("price_per_request_dwc").default("0.000001"),
  pricePerGbStorageDwc: text("price_per_gb_storage_dwc").default("0.01"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertExperienceShardSchema = createInsertSchema(experienceShards).omit({
  id: true, createdAt: true, updatedAt: true
});
export type ExperienceShard = typeof experienceShards.$inferSelect;
export type InsertExperienceShard = z.infer<typeof insertExperienceShardSchema>;

// Shard assignments - which apps/contracts run on which shards
export const shardAssignments = pgTable("shard_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  shardId: varchar("shard_id").notNull().references(() => experienceShards.id, { onDelete: "cascade" }),
  projectId: text("project_id").notNull(),
  projectName: text("project_name").notNull(),
  contractAddress: text("contract_address"),
  priority: integer("priority").notNull().default(1),
  rateLimitRps: integer("rate_limit_rps").default(1000),
  assignedAt: timestamp("assigned_at").defaultNow().notNull(),
});

export const insertShardAssignmentSchema = createInsertSchema(shardAssignments).omit({
  id: true, assignedAt: true
});
export type ShardAssignment = typeof shardAssignments.$inferSelect;
export type InsertShardAssignment = z.infer<typeof insertShardAssignmentSchema>;

// ============================================
// QUEST MINING - Verifiable contribution rewards
// ============================================

export const questDefinitions = pgTable("quest_definitions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  questType: text("quest_type").notNull(), // 'daily', 'weekly', 'seasonal', 'achievement', 'special'
  category: text("category").notNull(), // 'social', 'trading', 'gaming', 'development', 'governance', 'community'
  
  // Requirements
  requirements: text("requirements").notNull(), // JSON: action type, count, conditions
  verificationMethod: text("verification_method").notNull(), // 'automatic', 'oracle', 'manual', 'on_chain'
  
  // Rewards
  shellsReward: integer("shells_reward").notNull().default(0),
  dwcReward: text("dwc_reward").default("0"),
  reputationReward: integer("reputation_reward").notNull().default(0),
  badgeReward: text("badge_reward"), // Badge ID if completing unlocks a badge
  
  // Availability
  isActive: boolean("is_active").notNull().default(true),
  startsAt: timestamp("starts_at"),
  endsAt: timestamp("ends_at"),
  maxCompletions: integer("max_completions"), // null = unlimited
  currentCompletions: integer("current_completions").notNull().default(0),
  
  // Difficulty and prerequisites
  difficultyLevel: text("difficulty_level").notNull().default("easy"), // 'easy', 'medium', 'hard', 'legendary'
  prerequisiteQuestId: varchar("prerequisite_quest_id"),
  minReputationRequired: integer("min_reputation_required").default(0),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertQuestDefinitionSchema = createInsertSchema(questDefinitions).omit({
  id: true, createdAt: true, updatedAt: true, currentCompletions: true
});
export type QuestDefinition = typeof questDefinitions.$inferSelect;
export type InsertQuestDefinition = z.infer<typeof insertQuestDefinitionSchema>;

// User quest progress
export const questProgress = pgTable("quest_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  questId: varchar("quest_id").notNull().references(() => questDefinitions.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  
  status: text("status").notNull().default("in_progress"), // 'in_progress', 'completed', 'claimed', 'expired'
  progressData: text("progress_data"), // JSON: current progress toward requirements
  progressPercent: integer("progress_percent").notNull().default(0),
  
  // Verification
  verificationHash: text("verification_hash"), // On-chain proof
  verifiedAt: timestamp("verified_at"),
  
  // Claiming
  claimedAt: timestamp("claimed_at"),
  rewardTxHash: text("reward_tx_hash"),
  
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const insertQuestProgressSchema = createInsertSchema(questProgress).omit({
  id: true, startedAt: true, completedAt: true, claimedAt: true, verifiedAt: true
});
export type QuestProgress = typeof questProgress.$inferSelect;
export type InsertQuestProgress = z.infer<typeof insertQuestProgressSchema>;

// Quest seasons/leaderboards
export const questSeasons = pgTable("quest_seasons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  seasonNumber: integer("season_number").notNull(),
  
  startsAt: timestamp("starts_at").notNull(),
  endsAt: timestamp("ends_at").notNull(),
  
  // Prize pool
  totalPrizePoolDwc: text("total_prize_pool_dwc").default("0"),
  totalPrizePoolShells: integer("total_prize_pool_shells").default(0),
  
  // Tier rewards (JSON arrays)
  tierRewards: text("tier_rewards"), // Top 1, Top 10, Top 100, etc.
  
  status: text("status").notNull().default("upcoming"), // 'upcoming', 'active', 'ended', 'rewards_distributed'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertQuestSeasonSchema = createInsertSchema(questSeasons).omit({
  id: true, createdAt: true
});
export type QuestSeason = typeof questSeasons.$inferSelect;
export type InsertQuestSeason = z.infer<typeof insertQuestSeasonSchema>;

// Season leaderboards
export const questLeaderboard = pgTable("quest_leaderboard", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  seasonId: varchar("season_id").notNull().references(() => questSeasons.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  username: text("username"),
  
  totalPoints: integer("total_points").notNull().default(0),
  questsCompleted: integer("quests_completed").notNull().default(0),
  currentStreak: integer("current_streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  
  rank: integer("rank"),
  tier: text("tier").default("bronze"), // 'bronze', 'silver', 'gold', 'platinum', 'diamond', 'legendary'
  
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertQuestLeaderboardSchema = createInsertSchema(questLeaderboard).omit({
  id: true, updatedAt: true
});
export type QuestLeaderboardEntry = typeof questLeaderboard.$inferSelect;
export type InsertQuestLeaderboardEntry = z.infer<typeof insertQuestLeaderboardSchema>;

// ============================================
// REALITY LAYER ORACLES - On-chain notarization
// ============================================

export const realityOracles = pgTable("reality_oracles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  oracleType: text("oracle_type").notNull(), // 'game_outcome', 'esports', 'real_world', 'market_data', 'random', 'custom'
  description: text("description"),
  
  // Data Source
  sourceType: text("source_type").notNull(), // 'api', 'manual', 'consensus', 'multi_chain'
  sourceEndpoint: text("source_endpoint"),
  sourceChains: text("source_chains"), // JSON array for multi-chain verification
  
  // Status
  status: text("status").notNull().default("active"), // 'active', 'paused', 'deprecated'
  reliability: text("reliability").default("99.9"), // Percentage uptime
  lastUpdatedAt: timestamp("last_updated_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertRealityOracleSchema = createInsertSchema(realityOracles).omit({
  id: true, createdAt: true, lastUpdatedAt: true
});
export type RealityOracle = typeof realityOracles.$inferSelect;
export type InsertRealityOracle = z.infer<typeof insertRealityOracleSchema>;

// Oracle data feeds - individual data points
export const oracleDataFeeds = pgTable("oracle_data_feeds", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  oracleId: varchar("oracle_id").notNull().references(() => realityOracles.id, { onDelete: "cascade" }),
  
  feedKey: text("feed_key").notNull(), // Unique identifier like "chronicles_quest_123" or "match_456"
  feedType: text("feed_type").notNull(), // 'outcome', 'score', 'state', 'event'
  
  // Data
  dataValue: text("data_value").notNull(),
  dataHash: text("data_hash").notNull(), // SHA-256 hash for verification
  metadata: text("metadata"), // JSON additional context
  
  // Multi-chain notarization
  dwscTxHash: text("dwsc_tx_hash"),
  dwscBlockNumber: integer("dwsc_block_number"),
  ethereumTxHash: text("ethereum_tx_hash"),
  solanaTxHash: text("solana_tx_hash"),
  
  // Verification
  verificationCount: integer("verification_count").notNull().default(1),
  verifierAddresses: text("verifier_addresses"), // JSON array
  consensusReached: boolean("consensus_reached").notNull().default(false),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  confirmedAt: timestamp("confirmed_at"),
});

export const insertOracleDataFeedSchema = createInsertSchema(oracleDataFeeds).omit({
  id: true, createdAt: true, confirmedAt: true
});
export type OracleDataFeed = typeof oracleDataFeeds.$inferSelect;
export type InsertOracleDataFeed = z.infer<typeof insertOracleDataFeedSchema>;

// ============================================
// AI VERIFIED EXECUTION - Cryptographic proofs for AI decisions
// ============================================

export const aiExecutionProofs = pgTable("ai_execution_proofs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Request context
  requestId: text("request_id").notNull().unique(),
  requestType: text("request_type").notNull(), // 'game_decision', 'risk_assessment', 'content_generation', 'trading_signal'
  userId: text("user_id"),
  appId: text("app_id"),
  
  // Input/Output
  inputHash: text("input_hash").notNull(), // SHA-256 of input
  inputSummary: text("input_summary"), // Truncated/sanitized version
  outputHash: text("output_hash").notNull(), // SHA-256 of output
  outputSummary: text("output_summary"), // Truncated result
  
  // AI Model Info
  modelId: text("model_id").notNull(), // e.g., 'gpt-4', 'claude-3', 'dwsc-guardian-v1'
  modelVersion: text("model_version"),
  inferenceTimestamp: timestamp("inference_timestamp").notNull(),
  
  // Verification Proof
  proofType: text("proof_type").notNull().default("commitment"), // 'commitment', 'zk_proof', 'tee_attestation'
  proofData: text("proof_data").notNull(), // The actual cryptographic proof
  proofValid: boolean("proof_valid").notNull().default(true),
  
  // On-chain anchoring
  txHash: text("tx_hash"),
  blockNumber: integer("block_number"),
  
  // Metadata
  executionTimeMs: integer("execution_time_ms"),
  confidenceScore: text("confidence_score"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  verifiedAt: timestamp("verified_at"),
});

export const insertAiExecutionProofSchema = createInsertSchema(aiExecutionProofs).omit({
  id: true, createdAt: true, verifiedAt: true
});
export type AiExecutionProof = typeof aiExecutionProofs.$inferSelect;
export type InsertAiExecutionProof = z.infer<typeof insertAiExecutionProofSchema>;

// AI Model Registry - registered and verified AI models
export const aiModelRegistry = pgTable("ai_model_registry", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  modelId: text("model_id").notNull().unique(),
  modelName: text("model_name").notNull(),
  provider: text("provider").notNull(), // 'openai', 'anthropic', 'darkwave', 'custom'
  
  // Verification
  verified: boolean("verified").notNull().default(false),
  verificationHash: text("verification_hash"),
  auditorId: text("auditor_id"),
  
  // Capabilities
  capabilities: text("capabilities"), // JSON array
  maxTokens: integer("max_tokens"),
  supportedProofTypes: text("supported_proof_types"), // JSON array
  
  // Usage
  totalExecutions: integer("total_executions").notNull().default(0),
  averageLatencyMs: integer("average_latency_ms"),
  
  status: text("status").notNull().default("active"), // 'active', 'deprecated', 'suspended'
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertAiModelRegistrySchema = createInsertSchema(aiModelRegistry).omit({
  id: true, createdAt: true, updatedAt: true, totalExecutions: true
});
export type AiModelRegistryEntry = typeof aiModelRegistry.$inferSelect;
export type InsertAiModelRegistryEntry = z.infer<typeof insertAiModelRegistrySchema>;

// ============================================
// GUARDIAN STUDIO COPILOT - AI-powered contract generation
// ============================================

export const copilotSessions = pgTable("copilot_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  sessionName: text("session_name").notNull().default("Untitled Contract"),
  
  // Contract specification
  contractType: text("contract_type"), // 'token', 'nft', 'staking', 'dao', 'custom'
  specification: text("specification"), // Natural language description
  
  // Generated code
  generatedCode: text("generated_code"),
  codeLanguage: text("code_language").default("solidity"),
  
  // Audit results
  autoAuditScore: integer("auto_audit_score"),
  auditIssues: text("audit_issues"), // JSON array of issues
  auditPassed: boolean("audit_passed"),
  
  // Deployment
  deployedAddress: text("deployed_address"),
  deployedTxHash: text("deployed_tx_hash"),
  deployedAt: timestamp("deployed_at"),
  
  status: text("status").notNull().default("drafting"), // 'drafting', 'generated', 'auditing', 'passed', 'deployed', 'failed'
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCopilotSessionSchema = createInsertSchema(copilotSessions).omit({
  id: true, createdAt: true, updatedAt: true, deployedAt: true
});
export type CopilotSession = typeof copilotSessions.$inferSelect;
export type InsertCopilotSession = z.infer<typeof insertCopilotSessionSchema>;

// Copilot conversation history
export const copilotMessages = pgTable("copilot_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull().references(() => copilotSessions.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // 'user', 'assistant', 'system'
  content: text("content").notNull(),
  codeBlock: text("code_block"), // Extracted code if any
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCopilotMessageSchema = createInsertSchema(copilotMessages).omit({
  id: true, createdAt: true
});
export type CopilotMessage = typeof copilotMessages.$inferSelect;
export type InsertCopilotMessage = z.infer<typeof insertCopilotMessageSchema>;

// ============================================
// AI AGENT MARKETPLACE - Deploy autonomous AI agents on-chain
// ============================================

export const aiAgents = pgTable("ai_agents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorId: text("creator_id").notNull(),
  
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // 'trading', 'portfolio', 'quest', 'social', 'analytics', 'custom'
  avatar: text("avatar"),
  
  baseModel: text("base_model").notNull().default("gpt-4o"), // AI model used
  systemPrompt: text("system_prompt").notNull(),
  capabilities: text("capabilities"), // JSON array: ['trade', 'analyze', 'execute_quests', 'social_post']
  
  pricePerExecution: text("price_per_execution").notNull().default("1000000000000000000"), // 1 SIG in wei
  revenueShare: integer("revenue_share").notNull().default(80), // Creator gets 80%, platform 20%
  
  totalExecutions: integer("total_executions").notNull().default(0),
  totalEarnings: text("total_earnings").notNull().default("0"),
  rating: text("rating").default("0"),
  ratingCount: integer("rating_count").notNull().default(0),
  
  verified: boolean("verified").notNull().default(false),
  featured: boolean("featured").notNull().default(false),
  status: text("status").notNull().default("active"), // 'draft', 'active', 'paused', 'suspended'
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertAiAgentSchema = createInsertSchema(aiAgents).omit({
  id: true, createdAt: true, updatedAt: true, totalExecutions: true, totalEarnings: true, ratingCount: true
});
export type AiAgent = typeof aiAgents.$inferSelect;
export type InsertAiAgent = z.infer<typeof insertAiAgentSchema>;

export const aiAgentDeployments = pgTable("ai_agent_deployments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentId: varchar("agent_id").notNull().references(() => aiAgents.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  
  deploymentName: text("deployment_name").notNull(),
  configuration: text("configuration"), // JSON: custom parameters
  
  walletAddress: text("wallet_address"), // Agent's dedicated wallet
  allocatedBalance: text("allocated_balance").notNull().default("0"),
  
  autoExecute: boolean("auto_execute").notNull().default(false),
  executionSchedule: text("execution_schedule"), // Cron expression
  maxExecutionsPerDay: integer("max_executions_per_day").default(100),
  
  totalExecutions: integer("total_executions").notNull().default(0),
  totalSpent: text("total_spent").notNull().default("0"),
  
  status: text("status").notNull().default("active"), // 'active', 'paused', 'terminated'
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertAiAgentDeploymentSchema = createInsertSchema(aiAgentDeployments).omit({
  id: true, createdAt: true, updatedAt: true, totalExecutions: true, totalSpent: true
});
export type AiAgentDeployment = typeof aiAgentDeployments.$inferSelect;
export type InsertAiAgentDeployment = z.infer<typeof insertAiAgentDeploymentSchema>;

export const aiAgentExecutions = pgTable("ai_agent_executions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentId: varchar("agent_id").notNull().references(() => aiAgents.id),
  deploymentId: varchar("deployment_id").references(() => aiAgentDeployments.id),
  userId: text("user_id").notNull(),
  
  input: text("input").notNull(),
  output: text("output"),
  
  actions: text("actions"), // JSON array of actions taken
  executionProofId: varchar("execution_proof_id"),
  
  cost: text("cost").notNull().default("0"),
  creatorEarning: text("creator_earning").notNull().default("0"),
  platformFee: text("platform_fee").notNull().default("0"),
  
  executionTimeMs: integer("execution_time_ms"),
  tokensUsed: integer("tokens_used"),
  
  rating: integer("rating"), // 1-5 user rating
  feedback: text("feedback"),
  
  status: text("status").notNull().default("pending"), // 'pending', 'running', 'completed', 'failed'
  error: text("error"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const insertAiAgentExecutionSchema = createInsertSchema(aiAgentExecutions).omit({
  id: true, createdAt: true, completedAt: true
});
export type AiAgentExecution = typeof aiAgentExecutions.$inferSelect;
export type InsertAiAgentExecution = z.infer<typeof insertAiAgentExecutionSchema>;

// ============================================
// REAL-WORLD ASSET (RWA) TOKENIZATION
// ============================================

export const rwaAssets = pgTable("rwa_assets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  creatorId: text("creator_id").notNull(),
  
  name: text("name").notNull(),
  description: text("description").notNull(),
  assetType: text("asset_type").notNull(), // 'real_estate', 'equity', 'bond', 'commodity', 'collectible', 'invoice', 'ip_rights'
  
  legalEntity: text("legal_entity"),
  jurisdiction: text("jurisdiction"),
  
  documents: text("documents"), // JSON array of document URLs
  images: text("images"), // JSON array of image URLs
  
  valuation: text("valuation").notNull(), // Current valuation in USD cents
  valuationDate: timestamp("valuation_date").defaultNow().notNull(),
  valuationSource: text("valuation_source"),
  
  physicalAddress: text("physical_address"),
  gpsCoordinates: text("gps_coordinates"),
  
  custodian: text("custodian"),
  insuranceProvider: text("insurance_provider"),
  insuranceCoverage: text("insurance_coverage"),
  
  verified: boolean("verified").notNull().default(false),
  verifiedBy: text("verified_by"),
  verifiedAt: timestamp("verified_at"),
  
  status: text("status").notNull().default("pending"), // 'pending', 'verified', 'tokenized', 'suspended'
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertRwaAssetSchema = createInsertSchema(rwaAssets).omit({
  id: true, createdAt: true, updatedAt: true, verifiedAt: true
});
export type RwaAsset = typeof rwaAssets.$inferSelect;
export type InsertRwaAsset = z.infer<typeof insertRwaAssetSchema>;

export const rwaTokens = pgTable("rwa_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  assetId: varchar("asset_id").notNull().references(() => rwaAssets.id, { onDelete: "cascade" }),
  
  tokenSymbol: text("token_symbol").notNull(),
  tokenName: text("token_name").notNull(),
  
  totalSupply: text("total_supply").notNull(), // Total tokens issued
  pricePerToken: text("price_per_token").notNull(), // USD cents per token
  
  minInvestment: text("min_investment").notNull().default("10000"), // $100 minimum
  maxInvestment: text("max_investment"),
  
  dividendRate: text("dividend_rate"), // Annual dividend %
  dividendFrequency: text("dividend_frequency"), // 'monthly', 'quarterly', 'annually'
  
  lockupPeriod: integer("lockup_period"), // Days before tokens can be traded
  tradeable: boolean("tradeable").notNull().default(false),
  
  contractAddress: text("contract_address"),
  deployTxHash: text("deploy_tx_hash"),
  
  tokensSold: text("tokens_sold").notNull().default("0"),
  totalRaised: text("total_raised").notNull().default("0"),
  investorCount: integer("investor_count").notNull().default(0),
  
  status: text("status").notNull().default("offering"), // 'offering', 'funded', 'trading', 'matured', 'liquidated'
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertRwaTokenSchema = createInsertSchema(rwaTokens).omit({
  id: true, createdAt: true, updatedAt: true, tokensSold: true, totalRaised: true, investorCount: true
});
export type RwaToken = typeof rwaTokens.$inferSelect;
export type InsertRwaToken = z.infer<typeof insertRwaTokenSchema>;

export const rwaHoldings = pgTable("rwa_holdings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tokenId: varchar("token_id").notNull().references(() => rwaTokens.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  
  tokenBalance: text("token_balance").notNull(),
  purchasePrice: text("purchase_price").notNull(), // Average cost basis
  
  dividendsEarned: text("dividends_earned").notNull().default("0"),
  dividendsClaimed: text("dividends_claimed").notNull().default("0"),
  
  lockedUntil: timestamp("locked_until"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertRwaHoldingSchema = createInsertSchema(rwaHoldings).omit({
  id: true, createdAt: true, updatedAt: true
});
export type RwaHolding = typeof rwaHoldings.$inferSelect;
export type InsertRwaHolding = z.infer<typeof insertRwaHoldingSchema>;

export const rwaDividends = pgTable("rwa_dividends", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tokenId: varchar("token_id").notNull().references(() => rwaTokens.id, { onDelete: "cascade" }),
  
  amount: text("amount").notNull(), // Total dividend amount
  perTokenAmount: text("per_token_amount").notNull(),
  
  recordDate: timestamp("record_date").notNull(),
  paymentDate: timestamp("payment_date").notNull(),
  
  status: text("status").notNull().default("scheduled"), // 'scheduled', 'processing', 'paid'
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertRwaDividendSchema = createInsertSchema(rwaDividends).omit({
  id: true, createdAt: true
});
export type RwaDividend = typeof rwaDividends.$inferSelect;
export type InsertRwaDividend = z.infer<typeof insertRwaDividendSchema>;

// ============================================
// DARKWAVE CHRONICLES - GAMEPLAY SYSTEM
// ============================================

// Chronicles accounts - separate auth system for the game
export const chronicleAccounts = pgTable("chronicle_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  username: text("username").notNull().unique(),
  displayName: text("display_name").notNull(),
  email: text("email").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  passwordHash: text("password_hash").notNull(),
  
  // Optional link to main DWSC account (for cross-platform benefits)
  linkedUserId: text("linked_user_id"),
  
  // Session management
  lastLoginAt: timestamp("last_login_at"),
  sessionToken: text("session_token"),
  sessionExpiresAt: timestamp("session_expires_at"),
  
  isActive: boolean("is_active").notNull().default(true),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertChronicleAccountSchema = createInsertSchema(chronicleAccounts).omit({
  id: true, createdAt: true, updatedAt: true, lastLoginAt: true, sessionToken: true, sessionExpiresAt: true
});
export type ChronicleAccount = typeof chronicleAccounts.$inferSelect;
export type InsertChronicleAccount = z.infer<typeof insertChronicleAccountSchema>;

// Chronicles player characters/avatars
export const chronicleCharacters = pgTable("chronicle_characters", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  
  name: text("name").notNull(),
  title: text("title"), // "The Wanderer", "Lord of Flames"
  era: text("era").notNull().default("medieval"), // 'ancient', 'medieval', 'renaissance', 'industrial', 'modern', 'future'
  faction: text("faction"), // Player's chosen faction
  
  level: integer("level").notNull().default(1),
  experience: integer("experience").notNull().default(0),
  
  // Core attributes (5-Axis Emotion System inspired)
  wisdom: integer("wisdom").notNull().default(10),
  courage: integer("courage").notNull().default(10),
  compassion: integer("compassion").notNull().default(10),
  cunning: integer("cunning").notNull().default(10),
  influence: integer("influence").notNull().default(10),
  
  shellsEarned: text("shells_earned").notNull().default("0"),
  questsCompleted: integer("quests_completed").notNull().default(0),
  decisionsRecorded: integer("decisions_recorded").notNull().default(0),
  
  // Daily needs system (0-100 scale)
  energy: integer("energy").notNull().default(100),
  mood: integer("mood").notNull().default(75),
  health: integer("health").notNull().default(100),
  social: integer("social").notNull().default(50),
  hunger: integer("hunger").notNull().default(0), // 0 = full, 100 = starving
  
  // Check-in tracking
  lastCheckIn: timestamp("last_check_in"),
  lastNeedsUpdate: timestamp("last_needs_update"),
  checkInStreak: integer("check_in_streak").notNull().default(0),
  totalCheckIns: integer("total_check_ins").notNull().default(0),
  
  // Current location in world
  currentLocation: text("current_location").default("home"),
  currentActivity: text("current_activity"),
  
  avatarUrl: text("avatar_url"),
  isActive: boolean("is_active").notNull().default(true),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertChronicleCharacterSchema = createInsertSchema(chronicleCharacters).omit({
  id: true, createdAt: true, updatedAt: true
});
export type ChronicleCharacter = typeof chronicleCharacters.$inferSelect;
export type InsertChronicleCharacter = z.infer<typeof insertChronicleCharacterSchema>;

// Chronicles factions for political simulation
export const chronicleFactions = pgTable("chronicle_factions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  name: text("name").notNull(),
  description: text("description").notNull(),
  era: text("era").notNull(),
  
  ideology: text("ideology").notNull(), // 'order', 'chaos', 'balance', 'progress', 'tradition'
  color: text("color").notNull().default("#6366f1"),
  iconEmoji: text("icon_emoji").notNull().default("⚔️"),
  
  memberCount: integer("member_count").notNull().default(0),
  influence: integer("influence").notNull().default(100), // Faction power in the world
  treasury: text("treasury").notNull().default("0"), // SIG pooled by members
  
  leaderUserId: text("leader_user_id"),
  isPlayable: boolean("is_playable").notNull().default(true),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertChronicleFactionSchema = createInsertSchema(chronicleFactions).omit({
  id: true, createdAt: true
});
export type ChronicleFaction = typeof chronicleFactions.$inferSelect;
export type InsertChronicleFaction = z.infer<typeof insertChronicleFactionSchema>;

// Player faction reputation/standing
export const chronicleFactionStanding = pgTable("chronicle_faction_standing", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  characterId: varchar("character_id").notNull(),
  factionId: varchar("faction_id").notNull(),
  
  reputation: integer("reputation").notNull().default(0), // -1000 to +1000
  rank: text("rank").notNull().default("neutral"), // 'hostile', 'unfriendly', 'neutral', 'friendly', 'honored', 'exalted'
  
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertChronicleFactionStandingSchema = createInsertSchema(chronicleFactionStanding).omit({
  id: true, updatedAt: true
});
export type ChronicleFactionStanding = typeof chronicleFactionStanding.$inferSelect;

// Chronicles quest instances (active quests for players)
export const chronicleQuestInstances = pgTable("chronicle_quest_instances", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  characterId: varchar("character_id").notNull(),
  questId: varchar("quest_id").notNull(),
  
  status: text("status").notNull().default("active"), // 'active', 'completed', 'failed', 'abandoned'
  progress: integer("progress").notNull().default(0), // 0-100
  
  choicesMade: text("choices_made"), // JSON array of decision IDs
  branchPath: text("branch_path"), // Which story branch player is on
  
  shellsReward: text("shells_reward").notNull().default("0"),
  experienceReward: integer("experience_reward").notNull().default(0),
  
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const insertChronicleQuestInstanceSchema = createInsertSchema(chronicleQuestInstances).omit({
  id: true, startedAt: true
});
export type ChronicleQuestInstance = typeof chronicleQuestInstances.$inferSelect;

// Chronicle Proofs - On-chain attestations of player decisions (NFT-style)
export const chronicleProofs = pgTable("chronicle_proofs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  characterId: varchar("character_id").notNull(),
  userId: text("user_id").notNull(),
  
  proofType: text("proof_type").notNull(), // 'decision', 'achievement', 'quest_completion', 'faction_event'
  title: text("title").notNull(),
  description: text("description").notNull(),
  
  era: text("era").notNull(),
  questId: varchar("quest_id"),
  decisionData: text("decision_data"), // JSON with decision details
  
  // Blockchain attestation
  blockNumber: integer("block_number"),
  transactionHash: text("transaction_hash"),
  guardianSignature: text("guardian_signature"), // Ed25519 signature proving validity
  
  // Rewards
  shellsAwarded: text("shells_awarded").notNull().default("0"),
  dwcAwarded: text("dwc_awarded").notNull().default("0"),
  
  isSoulbound: boolean("is_soulbound").notNull().default(true), // Non-transferable
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertChronicleProofSchema = createInsertSchema(chronicleProofs).omit({
  id: true, createdAt: true
});
export type ChronicleProof = typeof chronicleProofs.$inferSelect;
export type InsertChronicleProof = z.infer<typeof insertChronicleProofSchema>;

// NPC state tracking for persistent world
export const chronicleNpcs = pgTable("chronicle_npcs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  name: text("name").notNull(),
  title: text("title"),
  era: text("era").notNull(),
  factionId: varchar("faction_id"),
  
  personality: text("personality").notNull(), // JSON with AI personality traits
  backstory: text("backstory"),
  
  // AI-driven state
  currentMood: text("current_mood").notNull().default("neutral"),
  disposition: integer("disposition").notNull().default(50), // 0-100 general friendliness
  
  // Location in game world
  location: text("location").notNull().default("capital_city"),
  isAlive: boolean("is_alive").notNull().default(true),
  
  // Guardian verification for AI decisions
  lastAiDecisionHash: text("last_ai_decision_hash"),
  decisionsVerified: integer("decisions_verified").notNull().default(0),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertChronicleNpcSchema = createInsertSchema(chronicleNpcs).omit({
  id: true, createdAt: true, updatedAt: true
});
export type ChronicleNpc = typeof chronicleNpcs.$inferSelect;

// Player-NPC interaction history
export const chronicleNpcInteractions = pgTable("chronicle_npc_interactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  characterId: varchar("character_id").notNull(),
  npcId: varchar("npc_id").notNull(),
  
  interactionType: text("interaction_type").notNull(), // 'dialogue', 'trade', 'combat', 'quest'
  outcome: text("outcome").notNull(), // 'positive', 'negative', 'neutral'
  
  dispositionChange: integer("disposition_change").notNull().default(0),
  dialogueSummary: text("dialogue_summary"),
  
  // AI verification
  aiModelUsed: text("ai_model_used"),
  aiProofHash: text("ai_proof_hash"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertChronicleNpcInteractionSchema = createInsertSchema(chronicleNpcInteractions).omit({
  id: true, createdAt: true
});
export type ChronicleNpcInteraction = typeof chronicleNpcInteractions.$inferSelect;

// Season Zero event tracking
export const chronicleSeasons = pgTable("chronicle_seasons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  name: text("name").notNull(),
  description: text("description").notNull(),
  seasonNumber: integer("season_number").notNull().default(0),
  
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  
  totalShellsPool: text("total_shells_pool").notNull().default("100000"),
  totalDwcPool: text("total_dwc_pool").notNull().default("10000"),
  
  participantCount: integer("participant_count").notNull().default(0),
  questsAvailable: integer("quests_available").notNull().default(0),
  
  isActive: boolean("is_active").notNull().default(false),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertChronicleSeasonSchema = createInsertSchema(chronicleSeasons).omit({
  id: true, createdAt: true
});
export type ChronicleSeason = typeof chronicleSeasons.$inferSelect;

// =====================================================
// CHRONICLES ADMIN PORTAL TABLES
// For game owner/developer management
// =====================================================

// Era configurations managed by admin
export const chronicleEraConfigs = pgTable("chronicle_era_configs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(), // 'medieval', 'renaissance', etc.
  name: text("name").notNull(),
  subtitle: text("subtitle"),
  description: text("description").notNull(),
  
  timelineOrder: integer("timeline_order").notNull().default(0),
  status: text("status").notNull().default("draft"), // 'draft', 'beta', 'live', 'archived'
  
  narrativeHook: text("narrative_hook"),
  primaryConflict: text("primary_conflict"),
  
  // Game settings
  difficulty: integer("difficulty").notNull().default(3), // 1-5
  economyMultiplier: text("economy_multiplier").notNull().default("1.0"),
  maxStorefronts: integer("max_storefronts").notNull().default(50),
  
  // AI settings
  aiPresetId: varchar("ai_preset_id"),
  voiceStyle: text("voice_style").default("period_appropriate"),
  
  // Visual
  thumbnailUrl: text("thumbnail_url"),
  bannerUrl: text("banner_url"),
  colorPrimary: text("color_primary").default("#06b6d4"),
  colorSecondary: text("color_secondary").default("#8b5cf6"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertChronicleEraConfigSchema = createInsertSchema(chronicleEraConfigs).omit({
  id: true, createdAt: true, updatedAt: true
});
export type ChronicleEraConfig = typeof chronicleEraConfigs.$inferSelect;
export type InsertChronicleEraConfig = z.infer<typeof insertChronicleEraConfigSchema>;

// Business storefronts - real businesses claiming in-game real estate
export const chronicleStorefronts = pgTable("chronicle_storefronts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  businessName: text("business_name").notNull(),
  businessType: text("business_type").notNull(), // 'tavern', 'trading_post', 'guild_hall', etc.
  ownerName: text("owner_name").notNull(),
  ownerEmail: text("owner_email").notNull(),
  ownerWallet: text("owner_wallet"),
  
  eraCode: text("era_code").notNull(), // which era this storefront is in
  locationSlug: text("location_slug").notNull(), // 'kings_market_stall_01'
  locationName: text("location_name").notNull(),
  
  description: text("description"),
  websiteUrl: text("website_url"),
  
  status: text("status").notNull().default("pending"), // 'pending', 'approved', 'active', 'suspended'
  
  // Blockchain verification
  onChainProofId: varchar("on_chain_proof_id"),
  verifiedAt: timestamp("verified_at"),
  
  // Lease terms
  leaseStartDate: timestamp("lease_start_date"),
  leaseEndDate: timestamp("lease_end_date"),
  shellsMonthly: text("shells_monthly").default("0"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertChronicleStorefrontSchema = createInsertSchema(chronicleStorefronts).omit({
  id: true, createdAt: true, updatedAt: true, verifiedAt: true
});
export type ChronicleStorefront = typeof chronicleStorefronts.$inferSelect;
export type InsertChronicleStorefront = z.infer<typeof insertChronicleStorefrontSchema>;

// Voice cloning configuration
export const chronicleVoiceConfigs = pgTable("chronicle_voice_configs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  name: text("name").notNull(),
  provider: text("provider").notNull().default("elevenlabs"), // 'elevenlabs', 'resemble', 'custom'
  modelId: text("model_id"),
  voiceId: text("voice_id"),
  
  defaultStyle: text("default_style").default("narrative"),
  pitch: text("pitch").default("1.0"),
  speed: text("speed").default("1.0"),
  stability: text("stability").default("0.5"),
  
  isDefault: boolean("is_default").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  
  usageCount: integer("usage_count").notNull().default(0),
  lastUsedAt: timestamp("last_used_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertChronicleVoiceConfigSchema = createInsertSchema(chronicleVoiceConfigs).omit({
  id: true, createdAt: true, updatedAt: true, lastUsedAt: true
});
export type ChronicleVoiceConfig = typeof chronicleVoiceConfigs.$inferSelect;
export type InsertChronicleVoiceConfig = z.infer<typeof insertChronicleVoiceConfigSchema>;

// Admin game settings - global configuration
export const chronicleAdminSettings = pgTable("chronicle_admin_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  category: text("category").notNull().default("general"), // 'general', 'ai', 'economy', 'display'
  description: text("description"),
  
  updatedBy: text("updated_by"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertChronicleAdminSettingSchema = createInsertSchema(chronicleAdminSettings).omit({
  id: true, updatedAt: true
});
export type ChronicleAdminSetting = typeof chronicleAdminSettings.$inferSelect;
export type InsertChronicleAdminSetting = z.infer<typeof insertChronicleAdminSettingSchema>;

// Chronicle Proof templates managed by admin
export const chronicleProofTemplates = pgTable("chronicle_proof_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  name: text("name").notNull(),
  description: text("description").notNull(),
  
  eraCode: text("era_code"), // null = available in all eras
  proofType: text("proof_type").notNull(), // 'decision', 'achievement', 'relationship', 'discovery'
  
  rewardType: text("reward_type").notNull().default("shells"), // 'shells', 'dwc', 'nft', 'badge'
  rewardAmount: text("reward_amount").notNull().default("0"),
  
  requirements: text("requirements"), // JSON of conditions
  
  isSeasonal: boolean("is_seasonal").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  
  timesAwarded: integer("times_awarded").notNull().default(0),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertChronicleProofTemplateSchema = createInsertSchema(chronicleProofTemplates).omit({
  id: true, createdAt: true, updatedAt: true
});
export type ChronicleProofTemplate = typeof chronicleProofTemplates.$inferSelect;
export type InsertChronicleProofTemplate = z.infer<typeof insertChronicleProofTemplateSchema>;

// ============================================
// CHRONICLES TIME TRAVEL SYSTEM - BETA SEASON 0
// ============================================

// Era definitions - Modern, Medieval, Wild West, etc.
export const chronicleEras = pgTable("chronicle_eras", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  code: text("code").notNull().unique(), // 'modern', 'medieval', 'wildwest'
  name: text("name").notNull(),
  description: text("description").notNull(),
  tagline: text("tagline").notNull(), // Short hook: "The Old West awaits"
  
  region: text("region").notNull().default("global"), // 'global', 'americas', 'europe', 'asia', 'africa'
  timePeriod: text("time_period").notNull(), // "1850-1900", "500-1500", etc.
  
  artifactsRequired: integer("artifacts_required").notNull().default(5), // Pieces needed to unlock
  isStartingEra: boolean("is_starting_era").notNull().default(false), // Modern is starting era
  isUnlocked: boolean("is_unlocked").notNull().default(false), // Global availability
  
  imageUrl: text("image_url"),
  portalImageUrl: text("portal_image_url"), // Portal visual for this era
  ambientDescription: text("ambient_description"), // What you see/hear when entering
  
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  isBeta: boolean("is_beta").notNull().default(true), // Beta flag
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertChronicleEraSchema = createInsertSchema(chronicleEras).omit({
  id: true, createdAt: true
});
export type ChronicleEra = typeof chronicleEras.$inferSelect;
export type InsertChronicleEra = z.infer<typeof insertChronicleEraSchema>;

// Artifacts/Runestones - collectible pieces that power time travel
export const chronicleArtifacts = pgTable("chronicle_artifacts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  eraCode: text("era_code").notNull(), // Which era this unlocks
  name: text("name").notNull(),
  description: text("description").notNull(),
  
  artifactType: text("artifact_type").notNull().default("runestone"), // 'runestone', 'relic', 'scroll', 'key'
  rarity: text("rarity").notNull().default("common"), // 'common', 'rare', 'epic', 'legendary'
  
  // Discovery hints
  hint: text("hint").notNull(), // Cryptic clue to find it
  riddleText: text("riddle_text"), // Optional riddle
  location: text("location").notNull(), // In-game location description
  
  // How to obtain
  obtainMethod: text("obtain_method").notNull().default("mission"), // 'mission', 'community', 'purchase', 'achievement'
  missionId: varchar("mission_id"), // Link to specific mission if applicable
  
  imageUrl: text("image_url"),
  glowColor: text("glow_color").notNull().default("#00ffff"), // Visual effect color
  
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertChronicleArtifactSchema = createInsertSchema(chronicleArtifacts).omit({
  id: true, createdAt: true
});
export type ChronicleArtifact = typeof chronicleArtifacts.$inferSelect;
export type InsertChronicleArtifact = z.infer<typeof insertChronicleArtifactSchema>;

// Player artifact collection
export const chroniclePlayerArtifacts = pgTable("chronicle_player_artifacts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  userId: text("user_id").notNull(),
  characterId: varchar("character_id"),
  artifactId: varchar("artifact_id").notNull(),
  
  discoveredAt: timestamp("discovered_at").defaultNow().notNull(),
  discoveryMethod: text("discovery_method").notNull(), // 'mission', 'riddle', 'community', 'gift'
  
  isEquipped: boolean("is_equipped").notNull().default(false), // Slotted in portal
});

export const insertChroniclePlayerArtifactSchema = createInsertSchema(chroniclePlayerArtifacts).omit({
  id: true, discoveredAt: true
});
export type ChroniclePlayerArtifact = typeof chroniclePlayerArtifacts.$inferSelect;
export type InsertChroniclePlayerArtifact = z.infer<typeof insertChroniclePlayerArtifactSchema>;

// Player era progress and lock status
export const chroniclePlayerEras = pgTable("chronicle_player_eras", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  userId: text("user_id").notNull(),
  characterId: varchar("character_id"),
  eraCode: text("era_code").notNull(),
  
  isUnlocked: boolean("is_unlocked").notNull().default(false),
  isCurrent: boolean("is_current").notNull().default(false), // Currently in this era
  
  artifactsCollected: integer("artifacts_collected").notNull().default(0),
  missionsCompleted: integer("missions_completed").notNull().default(0),
  communityPoints: integer("community_points").notNull().default(0), // From ChronoChat participation
  
  firstEnteredAt: timestamp("first_entered_at"),
  lastVisitedAt: timestamp("last_visited_at"),
  totalTimeSpent: integer("total_time_spent").notNull().default(0), // Minutes
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertChroniclePlayerEraSchema = createInsertSchema(chroniclePlayerEras).omit({
  id: true, createdAt: true, updatedAt: true
});
export type ChroniclePlayerEra = typeof chroniclePlayerEras.$inferSelect;
export type InsertChroniclePlayerEra = z.infer<typeof insertChroniclePlayerEraSchema>;

// Time Portal state for each player
export const chronicleTimePortals = pgTable("chronicle_time_portals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  userId: text("user_id").notNull().unique(),
  characterId: varchar("character_id"),
  
  currentEraCode: text("current_era_code").notNull().default("modern"),
  portalEnergy: integer("portal_energy").notNull().default(0), // Accumulated from artifacts
  
  lastTravelAt: timestamp("last_travel_at"),
  totalTravels: integer("total_travels").notNull().default(0),
  
  // Visual state
  portalStatus: text("portal_status").notNull().default("dormant"), // 'dormant', 'charging', 'ready', 'active'
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertChronicleTimePortalSchema = createInsertSchema(chronicleTimePortals).omit({
  id: true, createdAt: true, updatedAt: true
});
export type ChronicleTimePortal = typeof chronicleTimePortals.$inferSelect;
export type InsertChronicleTimePortal = z.infer<typeof insertChronicleTimePortalSchema>;

// Era-specific missions with hints and riddles
export const chronicleEraMissions = pgTable("chronicle_era_missions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  eraCode: text("era_code").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  
  missionType: text("mission_type").notNull().default("discovery"), // 'discovery', 'puzzle', 'conflict', 'social', 'exploration'
  difficulty: text("difficulty").notNull().default("normal"), // 'easy', 'normal', 'hard', 'legendary'
  
  // Story/Direction
  storyIntro: text("story_intro").notNull(), // Sets the scene
  hint1: text("hint1").notNull(), // First clue
  hint2: text("hint2"), // Second clue (if stuck)
  hint3: text("hint3"), // Final hint
  riddleText: text("riddle_text"), // Optional riddle to solve
  riddleAnswer: text("riddle_answer"), // Answer for validation
  
  // Conflict/Challenge
  hasConflict: boolean("has_conflict").notNull().default(false),
  conflictDescription: text("conflict_description"),
  conflictOptions: text("conflict_options"), // JSON array of choices
  
  // Requirements
  prerequisiteMissionId: varchar("prerequisite_mission_id"),
  minLevel: integer("min_level").notNull().default(1),
  
  // Rewards
  artifactRewardId: varchar("artifact_reward_id"), // Artifact earned on completion
  shellsReward: integer("shells_reward").notNull().default(10),
  experienceReward: integer("experience_reward").notNull().default(25),
  reputationReward: integer("reputation_reward").notNull().default(5),
  
  // Completion tracking
  timesCompleted: integer("times_completed").notNull().default(0),
  
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertChronicleEraMissionSchema = createInsertSchema(chronicleEraMissions).omit({
  id: true, createdAt: true
});
export type ChronicleEraMission = typeof chronicleEraMissions.$inferSelect;
export type InsertChronicleEraMission = z.infer<typeof insertChronicleEraMissionSchema>;

// Player mission progress
export const chronicleMissionProgress = pgTable("chronicle_mission_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  userId: text("user_id").notNull(),
  characterId: varchar("character_id"),
  missionId: varchar("mission_id").notNull(),
  
  status: text("status").notNull().default("available"), // 'available', 'active', 'completed', 'failed'
  hintsRevealed: integer("hints_revealed").notNull().default(0), // 0-3
  riddleSolved: boolean("riddle_solved").notNull().default(false),
  conflictChoiceMade: text("conflict_choice_made"), // Which option chosen
  
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertChronicleMissionProgressSchema = createInsertSchema(chronicleMissionProgress).omit({
  id: true, createdAt: true
});
export type ChronicleMissionProgress = typeof chronicleMissionProgress.$inferSelect;
export type InsertChronicleMissionProgress = z.infer<typeof insertChronicleMissionProgressSchema>;

// Daily Login Streaks - 24-hour real-time rule
export const chronicleLoginStreaks = pgTable("chronicle_login_streaks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  userId: text("user_id").notNull().unique(),
  
  currentStreak: integer("current_streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  totalLogins: integer("total_logins").notNull().default(0),
  
  lastLoginAt: timestamp("last_login_at"),
  lastRewardClaimedAt: timestamp("last_reward_claimed_at"),
  
  totalShellsEarned: integer("total_shells_earned").notNull().default(0),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertChronicleLoginStreakSchema = createInsertSchema(chronicleLoginStreaks).omit({
  id: true, createdAt: true, updatedAt: true
});
export type ChronicleLoginStreak = typeof chronicleLoginStreaks.$inferSelect;
export type InsertChronicleLoginStreak = z.infer<typeof insertChronicleLoginStreakSchema>;

// Daily Reward Claims - tracks individual reward claims
export const chronicleDailyRewards = pgTable("chronicle_daily_rewards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  userId: text("user_id").notNull(),
  
  day: integer("day").notNull(), // Day 1-7 in the streak cycle
  shellsAwarded: integer("shells_awarded").notNull(),
  bonusType: text("bonus_type"), // 'streak_bonus', 'milestone', 'weekly_jackpot'
  bonusAmount: integer("bonus_amount").default(0),
  
  claimedAt: timestamp("claimed_at").defaultNow().notNull(),
});

export const insertChronicleDailyRewardSchema = createInsertSchema(chronicleDailyRewards).omit({
  id: true, claimedAt: true
});
export type ChronicleDailyReward = typeof chronicleDailyRewards.$inferSelect;
export type InsertChronicleDailyReward = z.infer<typeof insertChronicleDailyRewardSchema>;

// =====================================================
// REPEATABLE QUEST SYSTEM - Infinite Progression
// =====================================================

// Quest Templates - Designer-editable content, no code changes needed
export const chronicleQuestTemplates = pgTable("chronicle_quest_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  code: text("code").notNull().unique(), // 'daily_npc_chat', 'weekly_build_5', etc.
  title: text("title").notNull(),
  description: text("description").notNull(),
  
  questType: text("quest_type").notNull().default("daily"), // 'daily', 'weekly', 'seasonal', 'achievement'
  category: text("category").notNull().default("social"), // 'social', 'building', 'exploration', 'story', 'trading'
  
  // Requirements
  requiredAction: text("required_action").notNull(), // 'npc_conversation', 'story_choice', 'estate_upgrade', 'mission_complete', 'era_visit'
  requiredCount: integer("required_count").notNull().default(1),
  requiredEra: text("required_era"), // null = any era
  
  // Rewards
  shellReward: integer("shell_reward").notNull().default(10),
  bonusShellReward: integer("bonus_shell_reward").default(0), // Extra for perfect completion
  experienceReward: integer("experience_reward").default(0),
  
  // Reset timing
  resetHours: integer("reset_hours").notNull().default(24), // 24 for daily, 168 for weekly
  
  // Availability
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertChronicleQuestTemplateSchema = createInsertSchema(chronicleQuestTemplates).omit({
  id: true, createdAt: true
});
export type ChronicleQuestTemplate = typeof chronicleQuestTemplates.$inferSelect;
export type InsertChronicleQuestTemplate = z.infer<typeof insertChronicleQuestTemplateSchema>;

// Player Quest Progress - Tracks individual completion toward templates
export const chronicleQuestProgress = pgTable("chronicle_quest_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  userId: text("user_id").notNull(),
  questTemplateId: varchar("quest_template_id").notNull(),
  
  currentProgress: integer("current_progress").notNull().default(0),
  completed: boolean("completed").notNull().default(false),
  
  // Reset tracking
  periodStartedAt: timestamp("period_started_at").defaultNow().notNull(), // When this period began
  completedAt: timestamp("completed_at"),
  rewardClaimedAt: timestamp("reward_claimed_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertChronicleQuestProgressSchema = createInsertSchema(chronicleQuestProgress).omit({
  id: true, createdAt: true
});
export type ChronicleQuestProgress = typeof chronicleQuestProgress.$inferSelect;
export type InsertChronicleQuestProgress = z.infer<typeof insertChronicleQuestProgressSchema>;

// =====================================================
// MIRROR-LIFE EXPERIENCE SYSTEM
// =====================================================

// Echo Persona - AI profile that evolves from player choices
export const echoPersonas = pgTable("echo_personas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  userId: text("user_id").notNull().unique(),
  
  // Personality vectors derived from choices
  personalityVectors: text("personality_vectors").default("{}"), // JSON: {compassion: 0.7, ambition: 0.4, ...}
  dominantTraits: text("dominant_traits").default("[]"), // JSON array of top 3 traits
  choicePatterns: text("choice_patterns").default("{}"), // JSON: patterns observed
  
  // Cached insights
  latestInsight: text("latest_insight"), // AI-generated insight about the player
  insightGeneratedAt: timestamp("insight_generated_at"),
  
  totalChoicesMade: integer("total_choices_made").notNull().default(0),
  totalNpcInteractions: integer("total_npc_interactions").notNull().default(0),
  totalBuildingsPlaced: integer("total_buildings_placed").notNull().default(0),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type EchoPersona = typeof echoPersonas.$inferSelect;

// Mirror Journal - AI summaries of player sessions
export const mirrorJournalEntries = pgTable("mirror_journal_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  userId: text("user_id").notNull(),
  
  summary: text("summary").notNull(), // AI-generated summary
  tone: text("tone"), // 'reflective', 'adventurous', 'cautious', etc.
  keyChoices: text("key_choices").default("[]"), // JSON array of significant choices
  emotionalArc: text("emotional_arc"), // 'rising', 'falling', 'steady', 'turbulent'
  
  sessionDurationMinutes: integer("session_duration_minutes"),
  actionsCount: integer("actions_count").default(0),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type MirrorJournalEntry = typeof mirrorJournalEntries.$inferSelect;

// Morning Pulse - Daily check-in state
export const chronicleDailyPulse = pgTable("chronicle_daily_pulse", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  userId: text("user_id").notNull(),
  pulseDate: text("pulse_date").notNull(), // YYYY-MM-DD format
  
  // Overnight accumulation
  overnightShellsEarned: integer("overnight_shells_earned").default(0),
  pendingQuestsCount: integer("pending_quests_count").default(0),
  activeAnomaliesCount: integer("active_anomalies_count").default(0),
  
  // State
  claimed: boolean("claimed").notNull().default(false),
  claimedAt: timestamp("claimed_at"),
  
  // Personalized message
  pulseMessage: text("pulse_message"), // AI-generated morning greeting
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ChronicleDailyPulse = typeof chronicleDailyPulse.$inferSelect;

// Veil Anomalies - Surprise events that break routine
export const veilAnomalies = pgTable("veil_anomalies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  code: text("code").notNull().unique(), // 'era_rift', 'shell_storm', etc.
  title: text("title").notNull(),
  description: text("description").notNull(),
  
  // Timing
  startAt: timestamp("start_at").notNull(),
  endAt: timestamp("end_at").notNull(),
  
  // Effect configuration
  effectType: text("effect_type").notNull(), // 'shell_multiplier', 'era_unlock', 'quest_bonus', 'npc_special'
  effectConfig: text("effect_config").default("{}"), // JSON with effect parameters
  
  // Scope
  isGlobal: boolean("is_global").notNull().default(true), // Affects all players
  targetEra: text("target_era"), // null = all eras
  
  // Visual
  glowColor: text("glow_color").default("cyan"), // For UI effects
  icon: text("icon").default("sparkles"),
  
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type VeilAnomaly = typeof veilAnomalies.$inferSelect;

// =====================================================
// SIMS-STYLE INTERIOR DOMICILE SYSTEM
// =====================================================

// Player's overall domicile/home interior
export const chronicleInteriors = pgTable("chronicle_interiors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  userId: text("user_id").notNull().unique(),
  
  // Current era theme
  activeEra: text("active_era").notNull().default("present"),
  
  // Domicile stats
  totalRooms: integer("total_rooms").notNull().default(1),
  currentRoomId: varchar("current_room_id"), // Which room player is in
  
  // Upgrades
  domicileLevel: integer("domicile_level").notNull().default(1),
  maxRooms: integer("max_rooms").notNull().default(4),
  
  // Stats affected by activities
  comfortLevel: integer("comfort_level").notNull().default(50), // 0-100
  cleanlinessLevel: integer("cleanliness_level").notNull().default(50),
  ambienceLevel: integer("ambience_level").notNull().default(50),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type ChronicleInterior = typeof chronicleInteriors.$inferSelect;

// Rooms within the domicile
export const chronicleRooms = pgTable("chronicle_rooms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  interiorId: varchar("interior_id").notNull(),
  userId: text("user_id").notNull(),
  
  name: text("name").notNull(), // "Living Room", "Bedchamber", "Workshop"
  roomType: text("room_type").notNull().default("living"), // 'living', 'bedroom', 'kitchen', 'workshop', 'study', 'garden'
  
  // Grid layout (like estate but for interior)
  gridWidth: integer("grid_width").notNull().default(6),
  gridHeight: integer("grid_height").notNull().default(6),
  layoutData: text("layout_data").default("[]"), // JSON grid of placed objects
  
  // Room stats
  isUnlocked: boolean("is_unlocked").notNull().default(true),
  unlockCost: integer("unlock_cost").default(0),
  
  // Era theming
  era: text("era").notNull().default("present"),
  
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type ChronicleRoom = typeof chronicleRooms.$inferSelect;

// Era-specific object catalog (furniture, appliances, decorations)
export const chronicleObjectCatalogs = pgTable("chronicle_object_catalogs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  code: text("code").notNull(), // 'present_tv', 'medieval_hearth', 'cyberpunk_holodisplay'
  name: text("name").notNull(),
  description: text("description").notNull(),
  
  // Era/timeline
  era: text("era").notNull(), // 'stone_age', 'medieval', 'present', 'cyberpunk', etc.
  category: text("category").notNull(), // 'furniture', 'appliance', 'decoration', 'utility', 'recreation'
  
  // Visual
  iconEmoji: text("icon_emoji").notNull().default("📦"),
  colorClass: text("color_class").default("bg-slate-500"),
  spriteUrl: text("sprite_url"), // For more detailed visuals
  
  // Placement
  gridWidth: integer("grid_width").notNull().default(1),
  gridHeight: integer("grid_height").notNull().default(1),
  allowedRoomTypes: text("allowed_room_types").default("[]"), // JSON array of room types
  
  // Cost
  shellCost: integer("shell_cost").notNull().default(10),
  unlockLevel: integer("unlock_level").notNull().default(0),
  
  // Interaction
  isInteractive: boolean("is_interactive").notNull().default(true),
  interactionVerbs: text("interaction_verbs").default("[]"), // JSON: ['watch', 'turn_on', 'sit']
  activityCategory: text("activity_category"), // 'comfort', 'intellect', 'creation', 'social', 'hygiene', 'food'
  
  // Activity effects
  comfortBonus: integer("comfort_bonus").default(0),
  entertainmentBonus: integer("entertainment_bonus").default(0),
  productivityBonus: integer("productivity_bonus").default(0),
  
  // Rewards for using
  shellsPerUse: integer("shells_per_use").default(0),
  useCooldownMinutes: integer("use_cooldown_minutes").default(60),
  
  // Time restrictions
  availableFromHour: integer("available_from_hour"), // null = always available
  availableToHour: integer("available_to_hour"),
  
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ChronicleObjectCatalog = typeof chronicleObjectCatalogs.$inferSelect;

// Objects placed in rooms
export const chronicleRoomObjects = pgTable("chronicle_room_objects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  roomId: varchar("room_id").notNull(),
  userId: text("user_id").notNull(),
  catalogId: varchar("catalog_id").notNull(),
  
  // Position in room grid
  gridX: integer("grid_x").notNull(),
  gridY: integer("grid_y").notNull(),
  rotation: integer("rotation").notNull().default(0), // 0, 90, 180, 270
  
  // Object state
  state: text("state").notNull().default("idle"), // 'idle', 'in_use', 'broken', 'upgrading'
  stateData: text("state_data").default("{}"), // JSON for object-specific state
  
  // Upgrades
  level: integer("level").notNull().default(1),
  condition: integer("condition").notNull().default(100), // 0-100, degrades over time
  
  // Usage tracking
  lastUsedAt: timestamp("last_used_at"),
  totalUses: integer("total_uses").notNull().default(0),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type ChronicleRoomObject = typeof chronicleRoomObjects.$inferSelect;

// Active activity sessions (player doing something with an object)
export const chronicleActivitySessions = pgTable("chronicle_activity_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  userId: text("user_id").notNull(),
  roomObjectId: varchar("room_object_id").notNull(),
  
  activityType: text("activity_type").notNull(), // 'watching_tv', 'cooking', 'reading', 'crafting'
  verb: text("verb").notNull(), // The interaction verb used
  
  // Timing
  startedAt: timestamp("started_at").defaultNow().notNull(),
  expectedEndAt: timestamp("expected_end_at").notNull(),
  completedAt: timestamp("completed_at"),
  
  // Progress
  durationMinutes: integer("duration_minutes").notNull(),
  progress: integer("progress").notNull().default(0), // 0-100
  
  // Rewards
  shellReward: integer("shell_reward").default(0),
  statBonuses: text("stat_bonuses").default("{}"), // JSON: {comfort: +5, intellect: +2}
  
  // Quest integration
  questProgressContributed: boolean("quest_progress_contributed").default(false),
  
  status: text("status").notNull().default("active"), // 'active', 'completed', 'cancelled'
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ChronicleActivitySession = typeof chronicleActivitySessions.$inferSelect;

// =====================================================
// COMMUNITY BUILDER PROGRAM
// Tier-based contribution system for community-driven development
// =====================================================

// Builder profiles - tracks a user's builder status and progression
export const communityBuilders = pgTable("community_builders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  userId: text("user_id").notNull().unique(),
  username: text("username").notNull(),
  displayName: text("display_name"),
  
  // Tier progression: explorer (1) -> artisan (2) -> architect (3) -> legend (4)
  tier: integer("tier").notNull().default(1),
  tierName: text("tier_name").notNull().default("Explorer"),
  
  // Experience and progression
  totalXp: integer("total_xp").notNull().default(0),
  currentLevelXp: integer("current_level_xp").notNull().default(0),
  level: integer("level").notNull().default(1),
  
  // Contribution stats
  totalContributions: integer("total_contributions").notNull().default(0),
  approvedContributions: integer("approved_contributions").notNull().default(0),
  rejectedContributions: integer("rejected_contributions").notNull().default(0),
  pendingContributions: integer("pending_contributions").notNull().default(0),
  
  // Rewards earned
  totalShellsEarned: integer("total_shells_earned").notNull().default(0),
  totalDwcEarned: text("total_dwc_earned").default("0"), // String for precision
  
  // Reputation
  reputationScore: integer("reputation_score").notNull().default(100), // 0-1000
  upvotesReceived: integer("upvotes_received").notNull().default(0),
  downvotesReceived: integer("downvotes_received").notNull().default(0),
  
  // Permissions (unlocked at higher tiers)
  canSubmitObjects: boolean("can_submit_objects").notNull().default(true),
  canSubmitQuests: boolean("can_submit_quests").notNull().default(false),
  canSubmitEras: boolean("can_submit_eras").notNull().default(false),
  canReviewContent: boolean("can_review_content").notNull().default(false),
  canVoteOnContent: boolean("can_vote_on_content").notNull().default(true),
  
  // Specializations (what they're known for)
  specializations: text("specializations").default("[]"), // JSON: ['object_design', 'quest_writing', 'era_creation']
  
  // Badges earned
  badges: text("badges").default("[]"), // JSON array of badge codes
  
  // Application status for tier upgrades
  tierUpgradeStatus: text("tier_upgrade_status").default("none"), // 'none', 'pending', 'approved', 'rejected'
  tierUpgradeAppliedAt: timestamp("tier_upgrade_applied_at"),
  
  isActive: boolean("is_active").notNull().default(true),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type CommunityBuilder = typeof communityBuilders.$inferSelect;

// Contribution types configuration
export const contributionTypes = pgTable("contribution_types", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  code: text("code").notNull().unique(), // 'object', 'quest', 'npc', 'era_variant', 'ambient_event', 'cosmetic'
  name: text("name").notNull(),
  description: text("description").notNull(),
  
  // Requirements
  minTier: integer("min_tier").notNull().default(1), // Minimum tier to submit this type
  requiresReview: boolean("requires_review").notNull().default(true),
  reviewerMinTier: integer("reviewer_min_tier").default(3), // Min tier to review this type
  
  // Rewards
  baseShellReward: integer("base_shell_reward").notNull().default(100),
  baseDwcReward: text("base_dwc_reward").default("0"),
  xpReward: integer("xp_reward").notNull().default(50),
  
  // Quality bonuses
  qualityMultipliers: text("quality_multipliers").default('{"standard": 1.0, "quality": 1.5, "exceptional": 2.0, "legendary": 3.0}'),
  
  // Voting thresholds
  votesRequiredForApproval: integer("votes_required_for_approval").default(5),
  approvalPercentRequired: integer("approval_percent_required").default(60), // 60% upvotes
  
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ContributionType = typeof contributionTypes.$inferSelect;

// Individual contributions submitted by builders
export const builderContributions = pgTable("builder_contributions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  builderId: varchar("builder_id").notNull().references(() => communityBuilders.id),
  userId: text("user_id").notNull(),
  
  // Type and content
  contributionTypeCode: text("contribution_type_code").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  
  // The actual content (JSON schema varies by type)
  contentData: text("content_data").notNull(), // JSON with type-specific structure
  
  // For era/object contributions
  targetEra: text("target_era"),
  category: text("category"),
  
  // Review process
  status: text("status").notNull().default("draft"), // 'draft', 'submitted', 'in_review', 'approved', 'rejected', 'live'
  submittedAt: timestamp("submitted_at"),
  reviewStartedAt: timestamp("review_started_at"),
  reviewCompletedAt: timestamp("review_completed_at"),
  
  // Voting
  upvotes: integer("upvotes").notNull().default(0),
  downvotes: integer("downvotes").notNull().default(0),
  voteScore: integer("vote_score").notNull().default(0), // upvotes - downvotes
  
  // Quality assessment
  qualityRating: text("quality_rating").default("standard"), // 'standard', 'quality', 'exceptional', 'legendary'
  
  // Reviewer notes
  reviewNotes: text("review_notes"),
  rejectionReason: text("rejection_reason"),
  
  // Rewards (set when approved)
  shellRewardAmount: integer("shell_reward_amount"),
  dwcRewardAmount: text("dwc_reward_amount"),
  xpRewardAmount: integer("xp_reward_amount"),
  rewardClaimedAt: timestamp("reward_claimed_at"),
  
  // If this went live, track usage
  timesUsedInGame: integer("times_used_in_game").default(0),
  playerRating: real("player_rating"), // 1-5 stars from players
  playerRatingCount: integer("player_rating_count").default(0),
  
  // Revenue share for premium content
  isPremium: boolean("is_premium").notNull().default(false),
  revenueSharePercent: integer("revenue_share_percent").default(0),
  totalRevenueEarned: integer("total_revenue_earned").default(0),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type BuilderContribution = typeof builderContributions.$inferSelect;

// Votes on contributions
export const contributionVotes = pgTable("contribution_votes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  contributionId: varchar("contribution_id").notNull().references(() => builderContributions.id),
  voterId: varchar("voter_id").notNull().references(() => communityBuilders.id),
  voterUserId: text("voter_user_id").notNull(),
  
  voteType: text("vote_type").notNull(), // 'up', 'down'
  
  // Optional feedback
  comment: text("comment"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ContributionVote = typeof contributionVotes.$inferSelect;

// Reviews by tier 3+ builders
export const contributionReviews = pgTable("contribution_reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  contributionId: varchar("contribution_id").notNull().references(() => builderContributions.id),
  reviewerId: varchar("reviewer_id").notNull().references(() => communityBuilders.id),
  reviewerUserId: text("reviewer_user_id").notNull(),
  
  // Review outcome
  decision: text("decision").notNull(), // 'approve', 'reject', 'request_changes'
  qualityRating: text("quality_rating"), // 'standard', 'quality', 'exceptional', 'legendary'
  
  // Detailed feedback
  feedback: text("feedback").notNull(),
  improvementSuggestions: text("improvement_suggestions"),
  
  // Checklist items
  meetsQualityStandards: boolean("meets_quality_standards").notNull(),
  isEraAppropriate: boolean("is_era_appropriate").notNull(),
  isBalanced: boolean("is_balanced").notNull(), // For gameplay elements
  hasNoOffensiveContent: boolean("has_no_offensive_content").notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ContributionReview = typeof contributionReviews.$inferSelect;

// Builder badges/achievements
export const builderBadges = pgTable("builder_badges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  code: text("code").notNull().unique(), // 'first_contribution', 'century_club', 'era_master', etc.
  name: text("name").notNull(),
  description: text("description").notNull(),
  
  // Visual
  iconEmoji: text("icon_emoji").notNull().default("🏅"),
  colorClass: text("color_class").default("bg-amber-500"),
  rarity: text("rarity").notNull().default("common"), // 'common', 'uncommon', 'rare', 'epic', 'legendary'
  
  // Requirements (JSON for flexibility)
  requirements: text("requirements").default("{}"), // e.g., {"approved_contributions": 10}
  
  // Rewards for earning
  shellReward: integer("shell_reward").default(0),
  xpReward: integer("xp_reward").default(0),
  
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type BuilderBadge = typeof builderBadges.$inferSelect;

// Tier requirements and benefits
export const builderTiers = pgTable("builder_tiers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  tier: integer("tier").notNull().unique(), // 1, 2, 3, 4
  name: text("name").notNull(), // 'Explorer', 'Artisan', 'Architect', 'Legend'
  description: text("description").notNull(),
  
  // Visual
  iconEmoji: text("icon_emoji").notNull(),
  colorClass: text("color_class").notNull(),
  
  // Requirements to reach this tier
  minLevel: integer("min_level").notNull().default(1),
  minApprovedContributions: integer("min_approved_contributions").notNull().default(0),
  minReputationScore: integer("min_reputation_score").notNull().default(0),
  requiresApplication: boolean("requires_application").notNull().default(false),
  
  // Permissions unlocked
  canSubmitObjects: boolean("can_submit_objects").notNull().default(true),
  canSubmitQuests: boolean("can_submit_quests").notNull().default(false),
  canSubmitNpcs: boolean("can_submit_npcs").notNull().default(false),
  canSubmitEras: boolean("can_submit_eras").notNull().default(false),
  canReviewContent: boolean("can_review_content").notNull().default(false),
  
  // Reward multipliers
  rewardMultiplier: real("reward_multiplier").notNull().default(1.0),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type BuilderTier = typeof builderTiers.$inferSelect;

// ============================================
// CHRONICLES LIFE SIMULATION TABLES
// ============================================

// Daily check-in log
export const chronicleCheckIns = pgTable("chronicle_check_ins", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  characterId: varchar("character_id").notNull(),
  userId: text("user_id").notNull(),
  
  // Check-in details
  checkInType: text("check_in_type").notNull().default("daily"), // 'daily', 'morning', 'evening', 'quick'
  moodBefore: integer("mood_before"),
  moodAfter: integer("mood_after"),
  energyBefore: integer("energy_before"),
  energyAfter: integer("energy_after"),
  
  // Activities chosen during check-in
  activitiesChosen: text("activities_chosen").default("[]"), // JSON array
  decisionsMade: text("decisions_made").default("[]"), // JSON array
  
  // Rewards earned
  shellsEarned: integer("shells_earned").default(0),
  xpEarned: integer("xp_earned").default(0),
  
  // Streak tracking
  streakDay: integer("streak_day").default(1),
  bonusMultiplier: real("bonus_multiplier").default(1.0),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ChronicleCheckIn = typeof chronicleCheckIns.$inferSelect;

// Player relationships with NPCs
export const chronicleRelationships = pgTable("chronicle_relationships", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  characterId: varchar("character_id").notNull(),
  npcId: varchar("npc_id").notNull(),
  
  // Relationship status
  relationshipType: text("relationship_type").notNull().default("acquaintance"), // 'stranger', 'acquaintance', 'friend', 'close_friend', 'romantic', 'partner', 'spouse', 'family'
  affection: integer("affection").notNull().default(0), // -100 to 100
  trust: integer("trust").notNull().default(0), // 0 to 100
  
  // Interaction history
  timesInteracted: integer("times_interacted").notNull().default(0),
  lastInteraction: timestamp("last_interaction"),
  giftsGiven: integer("gifts_given").default(0),
  questsCompletedTogether: integer("quests_completed_together").default(0),
  
  // Milestones
  milestones: text("milestones").default("[]"), // JSON array of relationship milestones reached
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type ChronicleRelationship = typeof chronicleRelationships.$inferSelect;

// Available activities in the world
export const chronicleActivities = pgTable("chronicle_activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  code: text("code").notNull().unique(), // 'sleep', 'eat', 'work', 'socialize', 'exercise'
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // 'basic_needs', 'social', 'work', 'leisure', 'self_improvement'
  
  // Location requirements
  era: text("era").default("all"), // 'all', 'modern', 'medieval', etc.
  location: text("location"), // null = can do anywhere
  
  // Duration
  durationMinutes: integer("duration_minutes").notNull().default(30),
  
  // Effects on needs
  energyChange: integer("energy_change").default(0),
  moodChange: integer("mood_change").default(0),
  healthChange: integer("health_change").default(0),
  socialChange: integer("social_change").default(0),
  hungerChange: integer("hunger_change").default(0),
  
  // Rewards
  shellReward: integer("shell_reward").default(0),
  xpReward: integer("xp_reward").default(0),
  
  // Requirements
  minEnergy: integer("min_energy").default(0),
  minMood: integer("min_mood").default(0),
  
  iconEmoji: text("icon_emoji").default("🎯"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ChronicleActivity = typeof chronicleActivities.$inferSelect;

// Locations in the world
export const chronicleLocations = pgTable("chronicle_locations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  code: text("code").notNull().unique(), // 'home', 'cafe', 'gym', 'park', 'office'
  name: text("name").notNull(),
  description: text("description").notNull(),
  era: text("era").notNull().default("modern"),
  
  // Location type
  locationType: text("location_type").notNull(), // 'residence', 'commercial', 'public', 'workplace', 'entertainment'
  
  // Available activities here
  availableActivities: text("available_activities").default("[]"), // JSON array of activity codes
  
  // NPCs that can be found here
  residentNpcs: text("resident_npcs").default("[]"), // JSON array of NPC IDs
  
  // Requirements to access
  unlockRequirement: text("unlock_requirement"), // null = always accessible
  
  iconEmoji: text("icon_emoji").default("📍"),
  imageUrl: text("image_url"),
  
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ChronicleLocation = typeof chronicleLocations.$inferSelect;

// ============================================
// ZEALY INTEGRATION - Community Quest Platform
// ============================================

// Maps Zealy quests to internal reward rules
export const zealyQuestMappings = pgTable("zealy_quest_mappings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  zealyQuestId: text("zealy_quest_id").notNull().unique(), // Zealy's quest identifier
  zealyQuestName: text("zealy_quest_name").notNull(),
  
  // Reward configuration
  shellsReward: integer("shells_reward").notNull().default(0),
  dwcReward: text("dwc_reward").default("0"),
  reputationReward: integer("reputation_reward").default(0),
  
  // Optional: Link to internal quest system
  internalQuestId: varchar("internal_quest_id"),
  
  // Caps and limits
  maxRewardsPerUser: integer("max_rewards_per_user").default(1),
  totalRewardsCap: integer("total_rewards_cap"), // null = unlimited
  currentRewards: integer("current_rewards").notNull().default(0),
  
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertZealyQuestMappingSchema = createInsertSchema(zealyQuestMappings).omit({
  id: true, createdAt: true, updatedAt: true, currentRewards: true
});
export type ZealyQuestMapping = typeof zealyQuestMappings.$inferSelect;
export type InsertZealyQuestMapping = z.infer<typeof insertZealyQuestMappingSchema>;

// Tracks all Zealy webhook events for idempotency and auditing
export const zealyQuestEvents = pgTable("zealy_quest_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Zealy identifiers
  zealyUserId: text("zealy_user_id").notNull(),
  zealyQuestId: text("zealy_quest_id").notNull(),
  zealyRequestId: text("zealy_request_id").notNull().unique(), // For idempotency
  zealyCommunityId: text("zealy_community_id"),
  
  // User mapping
  userId: text("user_id"), // Our internal user ID if matched
  walletAddress: text("wallet_address"),
  email: text("email"),
  discordId: text("discord_id"),
  twitterHandle: text("twitter_handle"),
  
  // Processing status
  status: text("status").notNull().default("pending"), // 'pending', 'processed', 'failed', 'rejected'
  errorMessage: text("error_message"),
  
  // Rewards granted
  shellsGranted: integer("shells_granted").default(0),
  dwcGranted: text("dwc_granted").default("0"),
  
  // Raw payload for debugging
  rawPayload: text("raw_payload"),
  
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertZealyQuestEventSchema = createInsertSchema(zealyQuestEvents).omit({
  id: true, createdAt: true, processedAt: true
});
export type ZealyQuestEvent = typeof zealyQuestEvents.$inferSelect;
export type InsertZealyQuestEvent = z.infer<typeof insertZealyQuestEventSchema>;

// ============================================
// SHELL REWARD PROFILES - Tier Multipliers
// ============================================

// Tracks user reward tiers and multipliers for the 90-day campaign
export const shellRewardProfiles = pgTable("shell_reward_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull().unique(),
  
  // Tier: 'participant', 'active', 'core', 'founders'
  tier: text("tier").notNull().default("participant"),
  multiplier: text("multiplier").notNull().default("1.0"), // 1.0, 1.5, 2.0
  
  // Tracking for tier calculation
  totalQuestsCompleted: integer("total_quests_completed").notNull().default(0),
  consecutiveDays: integer("consecutive_days").notNull().default(0),
  lastActiveDate: timestamp("last_active_date"),
  campaignStartDate: timestamp("campaign_start_date").defaultNow(),
  
  // Wallet status for redemption gating
  hasWallet: boolean("has_wallet").notNull().default(false),
  walletAddress: text("wallet_address"),
  walletVerifiedAt: timestamp("wallet_verified_at"),
  lastWalletReminder: timestamp("last_wallet_reminder"),
  
  // Zealy linking
  zealyUserId: text("zealy_user_id"),
  zealyUsername: text("zealy_username"),
  
  // Conversion tracking
  conversionEligible: boolean("conversion_eligible").notNull().default(true),
  shellsAtSnapshot: integer("shells_at_snapshot"),
  dwcConverted: text("dwc_converted"),
  conversionStatus: text("conversion_status").default("pending"), // 'pending', 'snapshotted', 'converted', 'claimed'
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertShellRewardProfileSchema = createInsertSchema(shellRewardProfiles).omit({
  id: true, createdAt: true, updatedAt: true
});
export type ShellRewardProfile = typeof shellRewardProfiles.$inferSelect;
export type InsertShellRewardProfile = z.infer<typeof insertShellRewardProfileSchema>;

// Shell Conversion Batches - For TGE mass conversion
export const shellConversionBatches = pgTable("shell_conversion_batches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  batchName: text("batch_name").notNull(), // e.g., "TGE_2026_04_11"
  conversionRate: text("conversion_rate").notNull(), // "100" = 100 shells per 1 SIG
  shellPrice: text("shell_price").notNull().default("0.001"), // $0.001 per shell
  dwcPrice: text("dwc_price").notNull().default("0.10"), // $0.10 per SIG at launch
  
  totalUsersProcessed: integer("total_users_processed").notNull().default(0),
  totalShellsConverted: integer("total_shells_converted").notNull().default(0),
  totalDwcMinted: text("total_dwc_minted").notNull().default("0"),
  
  status: text("status").notNull().default("pending"), // 'pending', 'processing', 'completed', 'failed'
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ShellConversionBatch = typeof shellConversionBatches.$inferSelect;

// ============================================
// PULSE AI PREDICTION SYSTEM
// Integrated from DarkWave Pulse for AI trading predictions
// ============================================

// Prediction Events - Every AI signal logged here
export const predictionEvents = pgTable('prediction_events', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: varchar('user_id', { length: 255 }),
  
  ticker: varchar('ticker', { length: 50 }).notNull(),
  assetType: varchar('asset_type', { length: 20 }).notNull().default('crypto'),
  priceAtPrediction: varchar('price_at_prediction', { length: 50 }).notNull(),
  
  signal: varchar('signal', { length: 20 }).notNull(),
  confidence: varchar('confidence', { length: 20 }),
  
  indicators: text('indicators').notNull(),
  
  bullishSignals: integer('bullish_signals').notNull().default(0),
  bearishSignals: integer('bearish_signals').notNull().default(0),
  signalsList: text('signals_list'),
  
  payloadHash: varchar('payload_hash', { length: 128 }).notNull(),
  auditEventId: varchar('audit_event_id', { length: 255 }),
  onchainSignature: varchar('onchain_signature', { length: 128 }),
  
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  stampedAt: timestamp('stamped_at'),
});

export type PredictionEvent = typeof predictionEvents.$inferSelect;

// Prediction Outcomes - Results at different time horizons
export const predictionOutcomes = pgTable('prediction_outcomes', {
  id: varchar('id', { length: 255 }).primaryKey(),
  predictionId: varchar('prediction_id', { length: 255 }).notNull(),
  
  horizon: varchar('horizon', { length: 20 }).notNull(),
  
  priceAtCheck: varchar('price_at_check', { length: 50 }).notNull(),
  priceChange: varchar('price_change', { length: 50 }).notNull(),
  priceChangePercent: varchar('price_change_percent', { length: 20 }).notNull(),
  
  outcome: varchar('outcome', { length: 20 }).notNull(),
  isCorrect: boolean('is_correct').notNull(),
  
  volatilityDuring: varchar('volatility_during', { length: 20 }),
  maxDrawdown: varchar('max_drawdown', { length: 20 }),
  maxGain: varchar('max_gain', { length: 20 }),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  evaluatedAt: timestamp('evaluated_at').defaultNow().notNull(),
});

export type PredictionOutcome = typeof predictionOutcomes.$inferSelect;

// Prediction Accuracy Stats - Aggregated accuracy metrics
export const predictionAccuracyStats = pgTable('prediction_accuracy_stats', {
  id: varchar('id', { length: 255 }).primaryKey(),
  
  ticker: varchar('ticker', { length: 50 }),
  signal: varchar('signal', { length: 20 }),
  horizon: varchar('horizon', { length: 20 }),
  
  totalPredictions: integer('total_predictions').notNull().default(0),
  correctPredictions: integer('correct_predictions').notNull().default(0),
  winRate: varchar('win_rate', { length: 10 }).notNull().default('0'),
  
  avgReturn: varchar('avg_return', { length: 20 }),
  avgWinReturn: varchar('avg_win_return', { length: 20 }),
  avgLossReturn: varchar('avg_loss_return', { length: 20 }),
  bestReturn: varchar('best_return', { length: 20 }),
  worstReturn: varchar('worst_return', { length: 20 }),
  
  currentStreak: integer('current_streak').default(0),
  longestWinStreak: integer('longest_win_streak').default(0),
  longestLossStreak: integer('longest_loss_streak').default(0),
  
  weightedWinRate: varchar('weighted_win_rate', { length: 10 }),
  
  lastPredictionAt: timestamp('last_prediction_at'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type PredictionAccuracyStat = typeof predictionAccuracyStats.$inferSelect;

// Strike Agent Predictions - Token discovery and snipe recommendations
export const strikeAgentPredictions = pgTable('strikeagent_predictions', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: varchar('user_id', { length: 255 }),
  
  tokenAddress: varchar('token_address', { length: 255 }).notNull(),
  tokenSymbol: varchar('token_symbol', { length: 50 }).notNull(),
  tokenName: varchar('token_name', { length: 255 }),
  dex: varchar('dex', { length: 50 }),
  chain: varchar('chain', { length: 50 }).notNull().default('solana'),
  
  priceUsd: varchar('price_usd', { length: 50 }).notNull(),
  priceSol: varchar('price_sol', { length: 50 }),
  marketCapUsd: varchar('market_cap_usd', { length: 50 }),
  liquidityUsd: varchar('liquidity_usd', { length: 50 }),
  tokenAgeMinutes: integer('token_age_minutes'),
  
  aiRecommendation: varchar('ai_recommendation', { length: 20 }).notNull(),
  aiScore: integer('ai_score').notNull(),
  aiReasoning: text('ai_reasoning'),
  
  safetyMetrics: text('safety_metrics'),
  movementMetrics: text('movement_metrics'),
  
  holderCount: integer('holder_count'),
  top10HoldersPercent: varchar('top10_holders_percent', { length: 20 }),
  botPercent: varchar('bot_percent', { length: 20 }),
  bundlePercent: varchar('bundle_percent', { length: 20 }),
  mintAuthorityActive: boolean('mint_authority_active'),
  freezeAuthorityActive: boolean('freeze_authority_active'),
  isHoneypot: boolean('is_honeypot'),
  liquidityLocked: boolean('liquidity_locked'),
  isPumpFun: boolean('is_pump_fun'),
  creatorWalletRisky: boolean('creator_wallet_risky'),
  
  payloadHash: varchar('payload_hash', { length: 128 }),
  onchainSignature: varchar('onchain_signature', { length: 128 }),
  
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  stampedAt: timestamp('stamped_at'),
});

export type StrikeAgentPrediction = typeof strikeAgentPredictions.$inferSelect;

// Strike Agent Outcomes - Track token performance after recommendation
export const strikeAgentOutcomes = pgTable('strikeagent_outcomes', {
  id: varchar('id', { length: 255 }).primaryKey(),
  predictionId: varchar('prediction_id', { length: 255 }).notNull(),
  
  horizon: varchar('horizon', { length: 20 }).notNull(),
  
  priceAtCheck: varchar('price_at_check', { length: 50 }).notNull(),
  priceChangePercent: varchar('price_change_percent', { length: 20 }).notNull(),
  
  marketCapAtCheck: varchar('market_cap_at_check', { length: 50 }),
  liquidityAtCheck: varchar('liquidity_at_check', { length: 50 }),
  holderCountAtCheck: integer('holder_count_at_check'),
  volumeChange: varchar('volume_change', { length: 20 }),
  
  isRugged: boolean('is_rugged').default(false),
  hit2x: boolean('hit_2x').default(false),
  hit5x: boolean('hit_5x').default(false),
  hit10x: boolean('hit_10x').default(false),
  maxGainPercent: varchar('max_gain_percent', { length: 20 }),
  maxDrawdownPercent: varchar('max_drawdown_percent', { length: 20 }),
  
  outcome: varchar('outcome', { length: 20 }).notNull(),
  isCorrect: boolean('is_correct').notNull(),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type StrikeAgentOutcome = typeof strikeAgentOutcomes.$inferSelect;

// Prediction Features - ML Feature Vectors (16 dimensions)
export const predictionFeatures = pgTable('prediction_features', {
  id: varchar('id', { length: 255 }).primaryKey(),
  predictionId: varchar('prediction_id', { length: 255 }).notNull(),
  horizon: varchar('horizon', { length: 20 }).notNull(),
  
  // Normalized Features (-1 to 1 or 0 to 1)
  rsiNormalized: varchar('rsi_normalized', { length: 20 }),
  macdSignal: varchar('macd_signal', { length: 20 }),
  macdStrength: varchar('macd_strength', { length: 20 }),
  
  // EMA Spreads
  ema9Spread: varchar('ema9_spread', { length: 20 }),
  ema21Spread: varchar('ema21_spread', { length: 20 }),
  ema50Spread: varchar('ema50_spread', { length: 20 }),
  ema200Spread: varchar('ema200_spread', { length: 20 }),
  
  // EMA Crossovers
  ema9Over21: boolean('ema9_over_21'),
  ema50Over200: boolean('ema50_over_200'),
  
  // Bollinger Band Position
  bbPosition: varchar('bb_position', { length: 20 }),
  bbWidth: varchar('bb_width', { length: 20 }),
  
  // Volume & Momentum
  volumeDeltaNorm: varchar('volume_delta_norm', { length: 20 }),
  spikeScoreNorm: varchar('spike_score_norm', { length: 20 }),
  volatilityNorm: varchar('volatility_norm', { length: 20 }),
  
  // Support/Resistance
  distanceToSupport: varchar('distance_to_support', { length: 20 }),
  distanceToResistance: varchar('distance_to_resistance', { length: 20 }),
  
  // Labels (from outcomes)
  priceChangePercent: varchar('price_change_percent', { length: 20 }),
  isWin: boolean('is_win'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type PredictionFeature = typeof predictionFeatures.$inferSelect;

// Prediction Model Versions - Trained ML Models
export const predictionModelVersions = pgTable('prediction_model_versions', {
  id: varchar('id', { length: 255 }).primaryKey(),
  
  modelName: varchar('model_name', { length: 100 }).notNull().default('logistic_v1'),
  horizon: varchar('horizon', { length: 20 }).notNull(),
  version: integer('version').notNull(),
  
  // Model Coefficients (JSON)
  coefficients: text('coefficients').notNull(),
  featureNames: text('feature_names').notNull(),
  
  // Training Metadata
  trainingSamples: integer('training_samples').notNull(),
  validationSamples: integer('validation_samples').notNull(),
  trainingDateRange: text('training_date_range'),
  
  // Performance Metrics
  accuracy: varchar('accuracy', { length: 10 }).notNull(),
  precision: varchar('precision', { length: 10 }),
  recall: varchar('recall', { length: 10 }),
  f1Score: varchar('f1_score', { length: 10 }),
  auroc: varchar('auroc', { length: 10 }),
  
  // Status
  status: varchar('status', { length: 20 }).notNull().default('training'),
  isActive: boolean('is_active').notNull().default(false),
  
  trainedAt: timestamp('trained_at').defaultNow().notNull(),
  activatedAt: timestamp('activated_at'),
  retiredAt: timestamp('retired_at'),
});

export type PredictionModelVersion = typeof predictionModelVersions.$inferSelect;

// Prediction Model Metrics - Rolling Performance
export const predictionModelMetrics = pgTable('prediction_model_metrics', {
  id: varchar('id', { length: 255 }).primaryKey(),
  modelVersionId: varchar('model_version_id', { length: 255 }).notNull(),
  
  // Time Window
  periodStart: timestamp('period_start').notNull(),
  periodEnd: timestamp('period_end').notNull(),
  
  // Performance
  predictionsCount: integer('predictions_count').notNull().default(0),
  correctCount: integer('correct_count').notNull().default(0),
  rollingAccuracy: varchar('rolling_accuracy', { length: 10 }),
  
  // Drift Detection
  featureDrift: varchar('feature_drift', { length: 20 }),
  performanceDrift: boolean('performance_drift').default(false),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type PredictionModelMetric = typeof predictionModelMetrics.$inferSelect;

// Strike Agent Signals - Top token signals from multi-chain scanning
export const strikeAgentSignals = pgTable('strike_agent_signals', {
  id: varchar('id', { length: 255 }).primaryKey(),
  tokenAddress: varchar('token_address', { length: 255 }).notNull(),
  tokenSymbol: varchar('token_symbol', { length: 50 }).notNull(),
  tokenName: varchar('token_name', { length: 255 }),
  chain: varchar('chain', { length: 50 }).notNull().default('solana'),
  priceUsd: varchar('price_usd', { length: 50 }),
  marketCapUsd: varchar('market_cap_usd', { length: 50 }),
  liquidityUsd: varchar('liquidity_usd', { length: 50 }),
  compositeScore: integer('composite_score').notNull().default(0),
  technicalScore: integer('technical_score').notNull().default(0),
  safetyScore: integer('safety_score').notNull().default(0),
  momentumScore: integer('momentum_score').notNull().default(0),
  mlConfidence: varchar('ml_confidence', { length: 20 }),
  indicators: text('indicators'),
  reasoning: text('reasoning'),
  rank: integer('rank').notNull().default(0),
  category: varchar('category', { length: 50 }).notNull().default('new'),
  dex: varchar('dex', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type StrikeAgentSignal = typeof strikeAgentSignals.$inferSelect;

// Blog Posts - AI-generated SEO content
export const blogPosts = pgTable('blog_posts', {
  id: varchar('id', { length: 255 }).primaryKey().default(sql`gen_random_uuid()`),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  title: text('title').notNull(),
  excerpt: text('excerpt').notNull(),
  content: text('content').notNull(),
  coverImage: text('cover_image'),
  
  // SEO fields
  metaTitle: text('meta_title'),
  metaDescription: text('meta_description'),
  keywords: text('keywords').array(),
  canonicalUrl: text('canonical_url'),
  
  // Organization
  category: varchar('category', { length: 100 }).notNull().default('general'),
  tags: text('tags').array(),
  
  // Author info
  authorName: text('author_name').default('DarkWave Team'),
  authorAvatar: text('author_avatar'),
  
  // Status
  status: varchar('status', { length: 20 }).notNull().default('draft'),
  featured: boolean('featured').default(false),
  readTimeMinutes: integer('read_time_minutes').default(5),
  viewCount: integer('view_count').default(0),
  
  // AI generation metadata
  aiGenerated: boolean('ai_generated').default(true),
  aiPrompt: text('ai_prompt'),
  
  publishedAt: timestamp('published_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const insertBlogPostSchema = createInsertSchema(blogPosts).omit({
  id: true,
  viewCount: true,
  createdAt: true,
  updatedAt: true,
});

export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;

// Bug Reports / Feedback System
export const feedbackReports = pgTable('feedback_reports', {
  id: serial('id').primaryKey(),
  userId: text('user_id'),
  userEmail: text('user_email'),
  userName: text('user_name'),
  
  // Report details
  type: varchar('type', { length: 50 }).notNull().default('bug'),
  category: varchar('category', { length: 100 }).notNull().default('general'),
  title: text('title').notNull(),
  description: text('description').notNull(),
  
  // For bug reports
  stepsToReproduce: text('steps_to_reproduce'),
  expectedBehavior: text('expected_behavior'),
  actualBehavior: text('actual_behavior'),
  
  // Screenshots/attachments (URLs)
  screenshots: text('screenshots').array(),
  
  // Context
  pageUrl: text('page_url'),
  browserInfo: text('browser_info'),
  deviceInfo: text('device_info'),
  
  // Status tracking
  status: varchar('status', { length: 30 }).notNull().default('new'),
  priority: varchar('priority', { length: 20 }).default('medium'),
  assignedTo: text('assigned_to'),
  
  // Admin notes
  adminNotes: text('admin_notes'),
  resolution: text('resolution'),
  resolvedAt: timestamp('resolved_at'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const insertFeedbackReportSchema = createInsertSchema(feedbackReports).omit({
  id: true,
  status: true,
  priority: true,
  assignedTo: true,
  adminNotes: true,
  resolution: true,
  resolvedAt: true,
  createdAt: true,
  updatedAt: true,
});

export type FeedbackReport = typeof feedbackReports.$inferSelect;
export type InsertFeedbackReport = z.infer<typeof insertFeedbackReportSchema>;

// ============================================
// GUARDIAN SCANNER - Community Intelligence
// ============================================

// Token Comments - Community feedback on tokens
export const tokenComments = pgTable('token_comments', {
  id: serial('id').primaryKey(),
  tokenAddress: text('token_address').notNull(),
  chain: varchar('chain', { length: 50 }).notNull(),
  userId: text('user_id').notNull(),
  userName: text('user_name'),
  userAvatar: text('user_avatar'),
  
  // Comment content
  content: text('content').notNull(),
  sentiment: varchar('sentiment', { length: 20 }), // bullish, bearish, warning, neutral
  
  // Voting
  upvotes: integer('upvotes').default(0).notNull(),
  downvotes: integer('downvotes').default(0).notNull(),
  
  // Moderation
  isHidden: boolean('is_hidden').default(false),
  hiddenReason: text('hidden_reason'),
  isAiFlagged: boolean('is_ai_flagged').default(false),
  aiFlagReason: text('ai_flag_reason'),
  
  // Status
  isVerifiedUser: boolean('is_verified_user').default(false),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const insertTokenCommentSchema = createInsertSchema(tokenComments).omit({
  id: true,
  upvotes: true,
  downvotes: true,
  isHidden: true,
  hiddenReason: true,
  isAiFlagged: true,
  aiFlagReason: true,
  createdAt: true,
  updatedAt: true,
});

export type TokenComment = typeof tokenComments.$inferSelect;
export type InsertTokenComment = z.infer<typeof insertTokenCommentSchema>;

// Comment Votes - Track who voted on what
export const commentVotes = pgTable('comment_votes', {
  id: serial('id').primaryKey(),
  commentId: integer('comment_id').notNull().references(() => tokenComments.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull(),
  voteType: varchar('vote_type', { length: 10 }).notNull(), // up, down
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type CommentVote = typeof commentVotes.$inferSelect;

// User Reputation - Track community standing
export const userReputation = pgTable('user_reputation', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().unique(),
  
  // Reputation scores
  reputationScore: integer('reputation_score').default(0).notNull(),
  accurateCalls: integer('accurate_calls').default(0).notNull(), // Correct warnings
  totalComments: integer('total_comments').default(0).notNull(),
  helpfulVotes: integer('helpful_votes').default(0).notNull(), // Upvotes received
  
  // Trust level
  trustLevel: varchar('trust_level', { length: 20 }).default('new').notNull(), // new, member, trusted, expert, flagged
  
  // Badges
  badges: text('badges').array(),
  
  // Moderation
  warningsReceived: integer('warnings_received').default(0),
  isShadowbanned: boolean('is_shadowbanned').default(false),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type UserReputation = typeof userReputation.$inferSelect;

// Token Creators - Track creators across launches
export const tokenCreators = pgTable('token_creators', {
  id: serial('id').primaryKey(),
  walletAddress: text('wallet_address').notNull(),
  chain: varchar('chain', { length: 50 }).notNull(),
  
  // Profile
  displayName: text('display_name'),
  isVerified: boolean('is_verified').default(false),
  
  // Stats
  totalLaunches: integer('total_launches').default(0).notNull(),
  successfulLaunches: integer('successful_launches').default(0).notNull(),
  ruggedLaunches: integer('rugged_launches').default(0).notNull(),
  
  // Trust
  trustScore: integer('trust_score').default(50).notNull(),
  badge: varchar('badge', { length: 20 }).default('new').notNull(), // new, verified, trusted, certified, flagged
  
  // Community reports
  totalReports: integer('total_reports').default(0),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type TokenCreator = typeof tokenCreators.$inferSelect;

// Creator Token History - All tokens launched by creator
export const creatorTokenHistory = pgTable('creator_token_history', {
  id: serial('id').primaryKey(),
  creatorId: integer('creator_id').notNull().references(() => tokenCreators.id, { onDelete: 'cascade' }),
  tokenAddress: text('token_address').notNull(),
  tokenName: text('token_name').notNull(),
  tokenSymbol: text('token_symbol').notNull(),
  chain: varchar('chain', { length: 50 }).notNull(),
  
  // Status
  status: varchar('status', { length: 20 }).notNull().default('active'), // active, rugged, abandoned, successful
  
  // Peak stats
  peakMarketCap: real('peak_market_cap'),
  peakHolders: integer('peak_holders'),
  
  // Rug details if applicable
  ruggedAt: timestamp('rugged_at'),
  rugType: varchar('rug_type', { length: 50 }), // liquidity_pull, slow_rug, honeypot, mint_dump
  
  launchedAt: timestamp('launched_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type CreatorTokenHistory = typeof creatorTokenHistory.$inferSelect;

// Rug Reports - Community rug pull reports
export const rugReports = pgTable('rug_reports', {
  id: serial('id').primaryKey(),
  tokenAddress: text('token_address').notNull(),
  chain: varchar('chain', { length: 50 }).notNull(),
  reporterId: text('reporter_id').notNull(),
  
  // Report details
  rugType: varchar('rug_type', { length: 50 }).notNull(), // liquidity_pull, slow_rug, honeypot, mint_dump, other
  description: text('description').notNull(),
  evidenceLinks: text('evidence_links').array(),
  
  // Verification
  isVerified: boolean('is_verified').default(false),
  verifiedBy: text('verified_by'),
  verifiedAt: timestamp('verified_at'),
  
  // Community validation
  confirmations: integer('confirmations').default(0),
  disputes: integer('disputes').default(0),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const insertRugReportSchema = createInsertSchema(rugReports).omit({
  id: true,
  isVerified: true,
  verifiedBy: true,
  verifiedAt: true,
  confirmations: true,
  disputes: true,
  createdAt: true,
});

export type RugReport = typeof rugReports.$inferSelect;
export type InsertRugReport = z.infer<typeof insertRugReportSchema>;

// Price Alerts - User-set price notifications
export const priceAlerts = pgTable('price_alerts', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  tokenAddress: text('token_address').notNull(),
  chain: varchar('chain', { length: 50 }).notNull(),
  tokenSymbol: text('token_symbol').notNull(),
  
  // Alert conditions
  alertType: varchar('alert_type', { length: 20 }).notNull(), // above, below, percent_up, percent_down
  targetPrice: real('target_price'),
  percentChange: real('percent_change'),
  
  // Current state
  priceAtCreation: real('price_at_creation').notNull(),
  
  // Status
  isActive: boolean('is_active').default(true).notNull(),
  isTriggered: boolean('is_triggered').default(false),
  triggeredAt: timestamp('triggered_at'),
  priceAtTrigger: real('price_at_trigger'),
  
  // Notification
  notifyEmail: boolean('notify_email').default(true),
  notifyPush: boolean('notify_push').default(false),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const insertPriceAlertSchema = createInsertSchema(priceAlerts).omit({
  id: true,
  isActive: true,
  isTriggered: true,
  triggeredAt: true,
  priceAtTrigger: true,
  createdAt: true,
});

export type PriceAlert = typeof priceAlerts.$inferSelect;
export type InsertPriceAlert = z.infer<typeof insertPriceAlertSchema>;

// Token Watchlist - User's saved tokens
export const tokenWatchlist = pgTable('token_watchlist', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  tokenAddress: text('token_address').notNull(),
  chain: varchar('chain', { length: 50 }).notNull(),
  tokenSymbol: text('token_symbol').notNull(),
  tokenName: text('token_name').notNull(),
  notes: text('notes'),
  addedAt: timestamp('added_at').defaultNow().notNull(),
});

export type TokenWatchlist = typeof tokenWatchlist.$inferSelect;

// Trust Documents - Official agreements recorded on-chain
export const trustDocuments = pgTable('trust_documents', {
  id: serial('id').primaryKey(),
  documentId: varchar('document_id', { length: 50 }).notNull().unique(),
  documentTitle: text('document_title').notNull(),
  partyA: text('party_a').notNull(),
  partyB: text('party_b').notNull(),
  partyBRole: text('party_b_role').notNull(),
  terms: jsonb('terms').notNull(),
  documentHash: text('document_hash').notNull(),
  acknowledgedAt: timestamp('acknowledged_at').defaultNow().notNull(),
  acknowledgedBy: text('acknowledged_by'),
  acknowledgedByUserId: text('acknowledged_by_user_id'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
});

export type TrustDocument = typeof trustDocuments.$inferSelect;

// Limit Orders - StrikeAgent sniper orders with entry/exit/stop-loss
export const limitOrders = pgTable('limit_orders', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: text('user_id').notNull(),
  tokenAddress: text('token_address').notNull(),
  tokenSymbol: text('token_symbol'),
  chain: varchar('chain', { length: 50 }).default('solana'),
  
  // Price targets
  entryPrice: real('entry_price'),
  exitPrice: real('exit_price'),
  stopLoss: real('stop_loss'),
  
  // Trade config
  buyAmountSol: real('buy_amount_sol').default(0.1),
  slotIndex: integer('slot_index').default(0), // 0-3 for 4-slot watchlist
  
  // Status: PENDING, WATCHING, READY_TO_EXECUTE, FILLED_ENTRY, READY_TO_EXIT, READY_TO_STOP, FILLED_EXIT, STOPPED_OUT, CANCELLED
  status: varchar('status', { length: 30 }).default('PENDING'),
  isActive: boolean('is_active').default(true),
  
  // Execution tracking
  walletAddress: text('wallet_address'),
  filledEntryPrice: real('filled_entry_price'),
  filledExitPrice: real('filled_exit_price'),
  filledAt: timestamp('filled_at'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const insertLimitOrderSchema = createInsertSchema(limitOrders).omit({
  id: true,
  status: true,
  isActive: true,
  filledEntryPrice: true,
  filledExitPrice: true,
  filledAt: true,
  createdAt: true,
  updatedAt: true,
});

export type LimitOrder = typeof limitOrders.$inferSelect;
export type InsertLimitOrder = z.infer<typeof insertLimitOrderSchema>;

// Guardian AI - AI Agent Certification System
export const aiAgentCertifications = pgTable('ai_agent_certifications', {
  id: varchar('id').primaryKey().default(sql`gen_random_uuid()`),
  
  // Agent identification
  agentName: text('agent_name').notNull(),
  agentSymbol: varchar('agent_symbol', { length: 20 }),
  agentType: varchar('agent_type', { length: 50 }).notNull(), // trading_bot, defi_agent, nft_agent, social_agent, analytics_agent, other
  description: text('description').notNull(),
  
  // Developer/Organization
  developerName: text('developer_name').notNull(),
  developerEmail: text('developer_email').notNull(),
  organizationName: text('organization_name'),
  website: text('website'),
  githubRepo: text('github_repo'),
  
  // Agent details
  contractAddress: text('contract_address'),
  tokenAddress: text('token_address'),
  chainDeployed: varchar('chain_deployed', { length: 50 }),
  apiEndpoint: text('api_endpoint'),
  documentationUrl: text('documentation_url'),
  
  // Certification tier
  certificationTier: varchar('certification_tier', { length: 30 }).notNull().default('basic'), // basic, advanced, enterprise
  
  // Assessment scores (0-100)
  securityScore: integer('security_score'),
  transparencyScore: integer('transparency_score'),
  reliabilityScore: integer('reliability_score'),
  complianceScore: integer('compliance_score'),
  overallTrustScore: integer('overall_trust_score'),
  
  // Behavioral analysis
  behaviorAnalysis: jsonb('behavior_analysis'),
  riskFactors: text('risk_factors').array(),
  capabilities: text('capabilities').array(),
  
  // Certification status
  status: varchar('status', { length: 30 }).notNull().default('pending'), // pending, under_review, certified, rejected, suspended, expired
  certificationNumber: varchar('certification_number', { length: 50 }).unique(),
  certifiedAt: timestamp('certified_at'),
  expiresAt: timestamp('expires_at'),
  
  // Review details
  reviewedBy: text('reviewed_by'),
  reviewNotes: text('review_notes'),
  lastAuditDate: timestamp('last_audit_date'),
  
  // Blockchain verification
  darkwaveTxHash: varchar('darkwave_tx_hash', { length: 128 }),
  darkwaveBlockHeight: text('darkwave_block_height'),
  
  // Payment
  paymentId: varchar('payment_id'),
  paymentStatus: varchar('payment_status', { length: 20 }).default('pending'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const insertAiAgentCertificationSchema = createInsertSchema(aiAgentCertifications).omit({
  id: true,
  securityScore: true,
  transparencyScore: true,
  reliabilityScore: true,
  complianceScore: true,
  overallTrustScore: true,
  behaviorAnalysis: true,
  status: true,
  certificationNumber: true,
  certifiedAt: true,
  expiresAt: true,
  reviewedBy: true,
  reviewNotes: true,
  lastAuditDate: true,
  darkwaveTxHash: true,
  darkwaveBlockHeight: true,
  paymentId: true,
  paymentStatus: true,
  createdAt: true,
  updatedAt: true,
});

export type AiAgentCertification = typeof aiAgentCertifications.$inferSelect;
export type InsertAiAgentCertification = z.infer<typeof insertAiAgentCertificationSchema>;

// Guardian AI Certification Tiers
export const GUARDIAN_AI_TIERS = {
  basic: {
    name: 'Guardian Basic',
    price: 999,
    priceDisplay: '$999',
    features: [
      'Automated behavioral analysis',
      'Basic security scan',
      'Transaction pattern review',
      'Public registry listing',
      'Guardian AI badge',
      '6-month certification validity',
    ],
    duration: '3-5 days',
  },
  advanced: {
    name: 'Guardian Advanced',
    price: 4999,
    priceDisplay: '$4,999',
    features: [
      'Everything in Basic',
      'Deep code review',
      'API security assessment',
      'Economic attack simulation',
      'Detailed trust scorecard',
      'Priority support',
      '12-month certification validity',
    ],
    duration: '1-2 weeks',
  },
  enterprise: {
    name: 'Guardian Enterprise',
    price: 14999,
    priceDisplay: '$14,999',
    features: [
      'Everything in Advanced',
      'Full source code audit',
      'Penetration testing',
      'Formal verification',
      'Custom compliance review',
      'Dedicated security analyst',
      'Guardian Shield monitoring',
      '24-month certification validity',
    ],
    duration: '3-4 weeks',
  },
} as const;

// =====================================================
// CHRONICLES MARKETPLACE & INVENTORY
// =====================================================

export const chronicleMarketplaceItems = pgTable("chronicle_marketplace_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  era: text("era").notNull(),
  category: text("category").notNull(),
  subcategory: text("subcategory"),
  iconEmoji: text("icon_emoji").notNull().default("📦"),
  shellCost: integer("shell_cost").notNull().default(10),
  unlockLevel: integer("unlock_level").notNull().default(0),
  isLimited: boolean("is_limited").notNull().default(false),
  stockQuantity: integer("stock_quantity"),
  isCraftable: boolean("is_craftable").notNull().default(false),
  rarity: text("rarity").notNull().default("common"),
  statBonus: text("stat_bonus").default("{}"),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertChronicleMarketplaceItemSchema = createInsertSchema(chronicleMarketplaceItems).omit({
  id: true, createdAt: true
});
export type ChronicleMarketplaceItem = typeof chronicleMarketplaceItems.$inferSelect;

export const chroniclePlayerInventory = pgTable("chronicle_player_inventory", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  itemCode: text("item_code").notNull(),
  quantity: integer("quantity").notNull().default(1),
  era: text("era").notNull(),
  acquiredVia: text("acquired_via").notNull().default("purchase"),
  equippedSlot: text("equipped_slot"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ChroniclePlayerInventoryItem = typeof chroniclePlayerInventory.$inferSelect;

export const chronicleCraftingRecipes = pgTable("chronicle_crafting_recipes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  era: text("era").notNull(),
  resultItemCode: text("result_item_code").notNull(),
  resultQuantity: integer("result_quantity").notNull().default(1),
  ingredients: text("ingredients").notNull().default("[]"),
  craftTimeMinutes: integer("craft_time_minutes").notNull().default(5),
  requiredLevel: integer("required_level").notNull().default(1),
  shellCost: integer("shell_cost").notNull().default(0),
  xpReward: integer("xp_reward").notNull().default(10),
  iconEmoji: text("icon_emoji").notNull().default("🔨"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ChronicleCraftingRecipe = typeof chronicleCraftingRecipes.$inferSelect;

// =====================================================
// CHRONICLES NPC CONVERSATIONS (Threaded)
// =====================================================

export const chronicleNpcConversations = pgTable("chronicle_npc_conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  npcName: text("npc_name").notNull(),
  era: text("era").notNull(),
  messageCount: integer("message_count").notNull().default(0),
  lastMessageAt: timestamp("last_message_at"),
  relationshipScore: integer("relationship_score").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ChronicleNpcConversation = typeof chronicleNpcConversations.$inferSelect;

export const chronicleNpcMessages = pgTable("chronicle_npc_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull(),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ChronicleNpcMessage = typeof chronicleNpcMessages.$inferSelect;

// =====================================================
// CHRONICLES NOTIFICATIONS
// =====================================================

export const chronicleNotifications = pgTable("chronicle_notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  iconEmoji: text("icon_emoji").default("🔔"),
  linkTo: text("link_to"),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ChronicleNotification = typeof chronicleNotifications.$inferSelect;

// =====================================================
// CHRONICLES DAILY SITUATION ASSIGNMENTS
// =====================================================

export const chronicleDailySituations = pgTable("chronicle_daily_situations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  situationId: text("situation_id").notNull(),
  era: text("era").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  isAiGenerated: boolean("is_ai_generated").notNull().default(false),
  isCompleted: boolean("is_completed").notNull().default(false),
  assignedDate: text("assigned_date").notNull(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const voidIds = pgTable("void_ids", {
  id: serial("id").primaryKey(),
  voidId: text("void_id").notNull().unique(),
  userId: integer("user_id").notNull(),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const voidStamps = pgTable("void_stamps", {
  id: serial("id").primaryKey(),
  voidId: text("void_id").notNull(),
  userId: integer("user_id").notNull(),
  stampHash: text("stamp_hash").notNull(),
  blockNumber: integer("block_number").notNull(),
  previousHash: text("previous_hash"),
  payload: jsonb("payload").notNull(),
  verified: boolean("verified").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const voidBridgeLinks = pgTable("void_bridge_links", {
  id: serial("id").primaryKey(),
  chatUserId: text("chat_user_id").notNull().unique(),
  userId: integer("user_id").notNull(),
  trustLayerId: text("trust_layer_id").notNull(),
  voidId: text("void_id"),
  displayName: text("display_name"),
  role: text("role").notNull().default("member"),
  linkedAt: timestamp("linked_at").defaultNow().notNull(),
});

export const insertVoidIdSchema = createInsertSchema(voidIds).omit({ id: true, createdAt: true });
export const insertVoidStampSchema = createInsertSchema(voidStamps).omit({ id: true, createdAt: true });
export const insertVoidBridgeLinkSchema = createInsertSchema(voidBridgeLinks).omit({ id: true, linkedAt: true });
export type VoidId = typeof voidIds.$inferSelect;
export type VoidStamp = typeof voidStamps.$inferSelect;
export type VoidBridgeLink = typeof voidBridgeLinks.$inferSelect;
export type InsertVoidId = z.infer<typeof insertVoidIdSchema>;
export type InsertVoidStamp = z.infer<typeof insertVoidStampSchema>;
export type InsertVoidBridgeLink = z.infer<typeof insertVoidBridgeLinkSchema>;

// =====================================================
// CHRONICLES GEOGRAPHIC WORLD SYSTEM
// Regions → Countries → States → Cities
// Content-pack based expansion system
// =====================================================

export const chronicleWorldRegions = pgTable("chronicle_world_regions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  contentPack: text("content_pack").notNull().default("base"),
  seasonLabel: text("season_label"),
  latitude: real("latitude").notNull().default(0),
  longitude: real("longitude").notNull().default(0),
  isUnlocked: boolean("is_unlocked").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertChronicleWorldRegionSchema = createInsertSchema(chronicleWorldRegions).omit({ id: true, createdAt: true });
export type ChronicleWorldRegion = typeof chronicleWorldRegions.$inferSelect;
export type InsertChronicleWorldRegion = z.infer<typeof insertChronicleWorldRegionSchema>;

export const chronicleCountries = pgTable("chronicle_countries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(),
  regionCode: text("region_code").notNull(),
  name: text("name").notNull(),
  medievalName: text("medieval_name"),
  wildwestName: text("wildwest_name"),
  modernName: text("modern_name"),
  description: text("description").notNull(),
  contentPack: text("content_pack").notNull().default("us"),
  latitude: real("latitude").notNull().default(0),
  longitude: real("longitude").notNull().default(0),
  isUnlocked: boolean("is_unlocked").notNull().default(false),
  isPlayable: boolean("is_playable").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertChronicleCountrySchema = createInsertSchema(chronicleCountries).omit({ id: true, createdAt: true });
export type ChronicleCountry = typeof chronicleCountries.$inferSelect;
export type InsertChronicleCountry = z.infer<typeof insertChronicleCountrySchema>;

export const chronicleStates = pgTable("chronicle_states", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(),
  countryCode: text("country_code").notNull(),
  name: text("name").notNull(),
  medievalName: text("medieval_name"),
  wildwestName: text("wildwest_name"),
  modernName: text("modern_name"),
  description: text("description").notNull(),
  latitude: real("latitude").notNull().default(0),
  longitude: real("longitude").notNull().default(0),
  isPlayable: boolean("is_playable").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertChronicleStateSchema = createInsertSchema(chronicleStates).omit({ id: true, createdAt: true });
export type ChronicleState = typeof chronicleStates.$inferSelect;
export type InsertChronicleState = z.infer<typeof insertChronicleStateSchema>;

export const chronicleCities = pgTable("chronicle_cities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(),
  stateCode: text("state_code").notNull(),
  countryCode: text("country_code").notNull(),
  name: text("name").notNull(),
  medievalName: text("medieval_name"),
  wildwestName: text("wildwest_name"),
  modernName: text("modern_name"),
  medievalDescription: text("medieval_description"),
  wildwestDescription: text("wildwest_description"),
  modernDescription: text("modern_description"),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  populationTier: text("population_tier").notNull().default("medium"),
  isCapital: boolean("is_capital").notNull().default(false),
  isStartingCity: boolean("is_starting_city").notNull().default(false),
  isDiscoverable: boolean("is_discoverable").notNull().default(true),
  isEasterEgg: boolean("is_easter_egg").notNull().default(false),
  easterEggDescription: text("easter_egg_description"),
  fogOfWar: boolean("fog_of_war").notNull().default(true),
  arrivalCinematicMedieval: text("arrival_cinematic_medieval"),
  arrivalCinematicWildwest: text("arrival_cinematic_wildwest"),
  arrivalCinematicModern: text("arrival_cinematic_modern"),
  ambientSoundMedieval: text("ambient_sound_medieval"),
  ambientSoundWildwest: text("ambient_sound_wildwest"),
  ambientSoundModern: text("ambient_sound_modern"),
  imageUrlMedieval: text("image_url_medieval"),
  imageUrlWildwest: text("image_url_wildwest"),
  imageUrlModern: text("image_url_modern"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertChronicleCitySchema = createInsertSchema(chronicleCities).omit({ id: true, createdAt: true });
export type ChronicleCity = typeof chronicleCities.$inferSelect;
export type InsertChronicleCity = z.infer<typeof insertChronicleCitySchema>;

// =====================================================
// CHRONICLES TRANSPORT & TRAVEL SYSTEM
// Era-specific modes, route planning, travel sessions
// =====================================================

export const chronicleTransportModes = pgTable("chronicle_transport_modes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  iconEmoji: text("icon_emoji").notNull().default("🚶"),
  speedMph: real("speed_mph").notNull(),
  costPerMile: real("cost_per_mile").notNull().default(0),
  availableInMedieval: boolean("available_in_medieval").notNull().default(false),
  availableInWildwest: boolean("available_in_wildwest").notNull().default(false),
  availableInModern: boolean("available_in_modern").notNull().default(false),
  routeType: text("route_type").notNull().default("road"),
  comfortRating: integer("comfort_rating").notNull().default(3),
  encounterFrequency: real("encounter_frequency").notNull().default(1.0),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertChronicleTransportModeSchema = createInsertSchema(chronicleTransportModes).omit({ id: true, createdAt: true });
export type ChronicleTransportMode = typeof chronicleTransportModes.$inferSelect;
export type InsertChronicleTransportMode = z.infer<typeof insertChronicleTransportModeSchema>;

export const chronicleTravelRoutes = pgTable("chronicle_travel_routes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fromCityCode: text("from_city_code").notNull(),
  toCityCode: text("to_city_code").notNull(),
  distanceMiles: real("distance_miles").notNull(),
  routeType: text("route_type").notNull().default("road"),
  difficulty: integer("difficulty").notNull().default(1),
  sceneryRating: integer("scenery_rating").notNull().default(3),
  dangerRating: integer("danger_rating").notNull().default(1),
  medievalDescription: text("medieval_description"),
  wildwestDescription: text("wildwest_description"),
  modernDescription: text("modern_description"),
  intermediateStops: text("intermediate_stops"),
  availableInMedieval: boolean("available_in_medieval").notNull().default(true),
  availableInWildwest: boolean("available_in_wildwest").notNull().default(true),
  availableInModern: boolean("available_in_modern").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertChronicleTravelRouteSchema = createInsertSchema(chronicleTravelRoutes).omit({ id: true, createdAt: true });
export type ChronicleTravelRoute = typeof chronicleTravelRoutes.$inferSelect;
export type InsertChronicleTravelRoute = z.infer<typeof insertChronicleTravelRouteSchema>;

export const chronicleTravelSessions = pgTable("chronicle_travel_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  characterId: varchar("character_id").notNull(),
  era: text("era").notNull(),
  routeId: varchar("route_id").notNull(),
  transportModeCode: text("transport_mode_code").notNull(),
  fromCityCode: text("from_city_code").notNull(),
  toCityCode: text("to_city_code").notNull(),
  distanceMiles: real("distance_miles").notNull(),
  speedMph: real("speed_mph").notNull(),
  travelType: text("travel_type").notNull().default("realtime"),
  status: text("status").notNull().default("in_progress"),
  progressPercent: real("progress_percent").notNull().default(0),
  currentMileMarker: real("current_mile_marker").notNull().default(0),
  echoCost: integer("echo_cost").notNull().default(0),
  xpEarned: integer("xp_earned").notNull().default(0),
  encountersTriggered: integer("encounters_triggered").notNull().default(0),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  estimatedArrival: timestamp("estimated_arrival"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertChronicleTravelSessionSchema = createInsertSchema(chronicleTravelSessions).omit({ id: true, createdAt: true, startedAt: true });
export type ChronicleTravelSession = typeof chronicleTravelSessions.$inferSelect;
export type InsertChronicleTravelSession = z.infer<typeof insertChronicleTravelSessionSchema>;

// =====================================================
// CHRONICLES TRAVEL ENCOUNTERS
// Random events during journeys
// =====================================================

export const chronicleTravelEncounters = pgTable("chronicle_travel_encounters", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  travelSessionId: varchar("travel_session_id").notNull(),
  userId: text("user_id").notNull(),
  era: text("era").notNull(),
  encounterType: text("encounter_type").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  choices: text("choices").notNull().default("[]"),
  choiceMade: text("choice_made"),
  outcome: text("outcome"),
  xpReward: integer("xp_reward").notNull().default(0),
  echoReward: integer("echo_reward").notNull().default(0),
  reputationChange: integer("reputation_change").notNull().default(0),
  mileMarker: real("mile_marker").notNull().default(0),
  isResolved: boolean("is_resolved").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertChronicleTravelEncounterSchema = createInsertSchema(chronicleTravelEncounters).omit({ id: true, createdAt: true });
export type ChronicleTravelEncounter = typeof chronicleTravelEncounters.$inferSelect;
export type InsertChronicleTravelEncounter = z.infer<typeof insertChronicleTravelEncounterSchema>;

// =====================================================
// CHRONICLES CITY NPC TEMPLATES
// Template-driven NPC generation per city/era
// =====================================================

export const chronicleNpcTemplates = pgTable("chronicle_npc_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(),
  archetype: text("archetype").notNull(),
  medievalRole: text("medieval_role"),
  wildwestRole: text("wildwest_role"),
  modernRole: text("modern_role"),
  personalityTraits: text("personality_traits").notNull().default("[]"),
  defaultFaction: text("default_faction"),
  dialogueThemes: text("dialogue_themes").notNull().default("[]"),
  questHooks: text("quest_hooks").notNull().default("[]"),
  defaultDisposition: integer("default_disposition").notNull().default(50),
  isCompanionEligible: boolean("is_companion_eligible").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertChronicleNpcTemplateSchema = createInsertSchema(chronicleNpcTemplates).omit({ id: true, createdAt: true });
export type ChronicleNpcTemplate = typeof chronicleNpcTemplates.$inferSelect;
export type InsertChronicleNpcTemplate = z.infer<typeof insertChronicleNpcTemplateSchema>;

export const chronicleCityNpcs = pgTable("chronicle_city_npcs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cityCode: text("city_code").notNull(),
  templateCode: text("template_code").notNull(),
  era: text("era").notNull(),
  name: text("name").notNull(),
  title: text("title"),
  backstory: text("backstory"),
  personality: text("personality").notNull().default("{}"),
  factionId: varchar("faction_id"),
  disposition: integer("disposition").notNull().default(50),
  isCompanion: boolean("is_companion").notNull().default(false),
  isAlive: boolean("is_alive").notNull().default(true),
  location: text("location").notNull().default("town_center"),
  schedule: text("schedule").notNull().default("{}"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertChronicleCityNpcSchema = createInsertSchema(chronicleCityNpcs).omit({ id: true, createdAt: true });
export type ChronicleCityNpc = typeof chronicleCityNpcs.$inferSelect;
export type InsertChronicleCityNpc = z.infer<typeof insertChronicleCityNpcSchema>;

// =====================================================
// CHRONICLES LEGACY & ACHIEVEMENT SYSTEM
// Cross-era legacy tracking, achievement stamps
// =====================================================

export const chronicleLegacyScores = pgTable("chronicle_legacy_scores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull().unique(),
  totalScore: integer("total_score").notNull().default(0),
  erasPlayed: integer("eras_played").notNull().default(0),
  citiesVisited: integer("cities_visited").notNull().default(0),
  decisionsRecorded: integer("decisions_recorded").notNull().default(0),
  questsCompleted: integer("quests_completed").notNull().default(0),
  npcRelationshipsBuilt: integer("npc_relationships_built").notNull().default(0),
  travelMilesLogged: real("travel_miles_logged").notNull().default(0),
  encountersResolved: integer("encounters_resolved").notNull().default(0),
  factionsJoined: integer("factions_joined").notNull().default(0),
  legacyTitle: text("legacy_title").notNull().default("Newcomer"),
  legacyRank: integer("legacy_rank").notNull().default(1),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertChronicleLegacyScoreSchema = createInsertSchema(chronicleLegacyScores).omit({ id: true, createdAt: true, updatedAt: true });
export type ChronicleLegacyScore = typeof chronicleLegacyScores.$inferSelect;
export type InsertChronicleLegacyScore = z.infer<typeof insertChronicleLegacyScoreSchema>;

export const chronicleAchievementStamps = pgTable("chronicle_achievement_stamps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull().default("exploration"),
  iconEmoji: text("icon_emoji").notNull().default("🏛️"),
  rarity: text("rarity").notNull().default("common"),
  medievalStyle: text("medieval_style"),
  wildwestStyle: text("wildwest_style"),
  modernStyle: text("modern_style"),
  xpReward: integer("xp_reward").notNull().default(50),
  echoReward: integer("echo_reward").notNull().default(10),
  isHidden: boolean("is_hidden").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertChronicleAchievementStampSchema = createInsertSchema(chronicleAchievementStamps).omit({ id: true, createdAt: true });
export type ChronicleAchievementStamp = typeof chronicleAchievementStamps.$inferSelect;
export type InsertChronicleAchievementStamp = z.infer<typeof insertChronicleAchievementStampSchema>;

export const chroniclePlayerStamps = pgTable("chronicle_player_stamps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  stampCode: text("stamp_code").notNull(),
  era: text("era").notNull(),
  cityCode: text("city_code"),
  earnedAt: timestamp("earned_at").defaultNow().notNull(),
  shareableImageUrl: text("shareable_image_url"),
});

export const insertChroniclePlayerStampSchema = createInsertSchema(chroniclePlayerStamps).omit({ id: true, earnedAt: true });
export type ChroniclePlayerStamp = typeof chroniclePlayerStamps.$inferSelect;
export type InsertChroniclePlayerStamp = z.infer<typeof insertChroniclePlayerStampSchema>;

export const chronicleCityReputations = pgTable("chronicle_city_reputations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  cityCode: text("city_code").notNull(),
  era: text("era").notNull(),
  reputation: integer("reputation").notNull().default(0),
  rank: text("rank").notNull().default("stranger"),
  visitCount: integer("visit_count").notNull().default(0),
  firstVisitAt: timestamp("first_visit_at"),
  lastVisitAt: timestamp("last_visit_at"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertChronicleCityReputationSchema = createInsertSchema(chronicleCityReputations).omit({ id: true, updatedAt: true });
export type ChronicleCityReputation = typeof chronicleCityReputations.$inferSelect;
export type InsertChronicleCityReputation = z.infer<typeof insertChronicleCityReputationSchema>;

// =====================================================
// CHRONICLES TRAVEL QUEST CHAINS
// Multi-city quest chains requiring geographic travel
// =====================================================

export const chronicleTravelQuests = pgTable("chronicle_travel_quests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  era: text("era").notNull(),
  difficulty: text("difficulty").notNull().default("normal"),
  totalSteps: integer("total_steps").notNull().default(1),
  xpReward: integer("xp_reward").notNull().default(100),
  echoReward: integer("echo_reward").notNull().default(50),
  stampReward: text("stamp_reward"),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertChronicleTravelQuestSchema = createInsertSchema(chronicleTravelQuests).omit({ id: true, createdAt: true });
export type ChronicleTravelQuest = typeof chronicleTravelQuests.$inferSelect;
export type InsertChronicleTravelQuest = z.infer<typeof insertChronicleTravelQuestSchema>;

export const chronicleTravelQuestSteps = pgTable("chronicle_travel_quest_steps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  questCode: text("quest_code").notNull(),
  stepNumber: integer("step_number").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  targetCityCode: text("target_city_code").notNull(),
  objectiveType: text("objective_type").notNull().default("arrive"),
  objectiveData: text("objective_data").notNull().default("{}"),
  dialogueOnArrival: text("dialogue_on_arrival"),
  xpReward: integer("xp_reward").notNull().default(25),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertChronicleTravelQuestStepSchema = createInsertSchema(chronicleTravelQuestSteps).omit({ id: true, createdAt: true });
export type ChronicleTravelQuestStep = typeof chronicleTravelQuestSteps.$inferSelect;
export type InsertChronicleTravelQuestStep = z.infer<typeof insertChronicleTravelQuestStepSchema>;

export const chroniclePlayerTravelQuests = pgTable("chronicle_player_travel_quests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  questCode: text("quest_code").notNull(),
  currentStep: integer("current_step").notNull().default(1),
  status: text("status").notNull().default("active"),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const insertChroniclePlayerTravelQuestSchema = createInsertSchema(chroniclePlayerTravelQuests).omit({ id: true, startedAt: true });
export type ChroniclePlayerTravelQuest = typeof chroniclePlayerTravelQuests.$inferSelect;
export type InsertChroniclePlayerTravelQuest = z.infer<typeof insertChroniclePlayerTravelQuestSchema>;

// =====================================================
// DAILY LIFE SYSTEM - Career, Needs, Routines
// =====================================================

export const playerCareers = pgTable("player_careers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  era: text("era").notNull(),
  occupation: text("occupation").notNull(),
  workplace: text("workplace").notNull(),
  rank: text("rank").notNull().default("apprentice"),
  shiftPreference: text("shift_preference").notNull().default("morning"),
  shiftStart: integer("shift_start").notNull().default(8),
  shiftEnd: integer("shift_end").notNull().default(16),
  dailyWage: integer("daily_wage").notNull().default(5),
  daysWorked: integer("days_worked").notNull().default(0),
  reputation: integer("reputation").notNull().default(50),
  skillLevel: integer("skill_level").notNull().default(1),
  specialization: text("specialization"),
  isActive: boolean("is_active").notNull().default(true),
  hiredAt: timestamp("hired_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPlayerCareerSchema = createInsertSchema(playerCareers).omit({ id: true, createdAt: true });
export type PlayerCareer = typeof playerCareers.$inferSelect;
export type InsertPlayerCareer = z.infer<typeof insertPlayerCareerSchema>;

export const playerNeeds = pgTable("player_needs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull().unique(),
  hunger: integer("hunger").notNull().default(80),
  energy: integer("energy").notNull().default(100),
  hygiene: integer("hygiene").notNull().default(90),
  social: integer("social").notNull().default(70),
  mood: integer("mood").notNull().default(75),
  health: integer("health").notNull().default(100),
  lastMealAt: timestamp("last_meal_at"),
  lastSleepAt: timestamp("last_sleep_at"),
  lastBathAt: timestamp("last_bath_at"),
  lastSocialAt: timestamp("last_social_at"),
  lastDecayAt: timestamp("last_decay_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPlayerNeedsSchema = createInsertSchema(playerNeeds).omit({ id: true, updatedAt: true });
export type PlayerNeeds = typeof playerNeeds.$inferSelect;
export type InsertPlayerNeeds = z.infer<typeof insertPlayerNeedsSchema>;

export const playerDailyLog = pgTable("player_daily_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  era: text("era").notNull(),
  gameDay: integer("game_day").notNull().default(1),
  wakeTime: integer("wake_time").notNull().default(7),
  sleepTime: integer("sleep_time").notNull().default(22),
  activitiesLog: text("activities_log").notNull().default('[]'),
  mealsEaten: integer("meals_eaten").notNull().default(0),
  workShiftCompleted: boolean("work_shift_completed").notNull().default(false),
  echoesEarned: integer("echoes_earned").notNull().default(0),
  notableEvents: text("notable_events").notNull().default('[]'),
  offlineHours: real("offline_hours").notNull().default(0),
  offlineRecap: text("offline_recap"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPlayerDailyLogSchema = createInsertSchema(playerDailyLog).omit({ id: true, createdAt: true });
export type PlayerDailyLog = typeof playerDailyLog.$inferSelect;
export type InsertPlayerDailyLog = z.infer<typeof insertPlayerDailyLogSchema>;

export const ebookPurchases = pgTable("ebook_purchases", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  bookId: text("book_id").notNull(),
  paymentIntentId: text("payment_intent_id"),
  stripeSessionId: text("stripe_session_id"),
  amount: integer("amount").notNull(),
  status: text("status").notNull().default("completed"),
  purchasedAt: timestamp("purchased_at").defaultNow().notNull(),
});

export const insertEbookPurchaseSchema = createInsertSchema(ebookPurchases).omit({ id: true, purchasedAt: true });
export type EbookPurchase = typeof ebookPurchases.$inferSelect;
export type InsertEbookPurchase = z.infer<typeof insertEbookPurchaseSchema>;

export const publishedBooks = pgTable("published_books", {
  id: serial("id").primaryKey(),
  authorId: text("author_id").notNull(),
  authorName: text("author_name").notNull(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull(),
  genre: text("genre").notNull(),
  category: text("category").default("nonfiction"),
  subcategory: text("subcategory"),
  tags: text("tags").array().default([]),
  price: integer("price").notNull(),
  coverImageUrl: text("cover_image_url"),
  manuscriptUrl: text("manuscript_url"),
  wordCount: integer("word_count"),
  chapterCount: integer("chapter_count"),
  rating: text("rating").default("0"),
  reviewCount: integer("review_count").default(0),
  sampleChapters: integer("sample_chapters").default(1),
  status: text("status").notNull().default("pending_review"),
  reviewNotes: text("review_notes"),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPublishedBookSchema = createInsertSchema(publishedBooks).omit({ id: true, submittedAt: true, publishedAt: true, createdAt: true });
export type PublishedBook = typeof publishedBooks.$inferSelect;
export type InsertPublishedBook = z.infer<typeof insertPublishedBookSchema>;

export const userLibrary = pgTable("user_library", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  bookId: text("book_id").notNull(),
  bookTitle: text("book_title").notNull(),
  bookSlug: text("book_slug").notNull(),
  coverImageUrl: text("cover_image_url"),
  source: text("source").notNull().default("purchase"),
  progress: integer("progress").default(0),
  lastReadAt: timestamp("last_read_at"),
  addedAt: timestamp("added_at").defaultNow().notNull(),
});

export const insertUserLibrarySchema = createInsertSchema(userLibrary).omit({ id: true, addedAt: true });
export type UserLibraryItem = typeof userLibrary.$inferSelect;
export type InsertUserLibraryItem = z.infer<typeof insertUserLibrarySchema>;

export const aiWritingSessions = pgTable("ai_writing_sessions", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  genre: text("genre"),
  category: text("category"),
  outline: text("outline"),
  currentChapter: integer("current_chapter").default(0),
  totalChapters: integer("total_chapters"),
  content: text("content"),
  status: text("status").notNull().default("planning"),
  messages: text("messages"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertAiWritingSessionSchema = createInsertSchema(aiWritingSessions).omit({ id: true, createdAt: true, updatedAt: true });
export type AiWritingSession = typeof aiWritingSessions.$inferSelect;
export type InsertAiWritingSession = z.infer<typeof insertAiWritingSessionSchema>;

export const userPhoneSettings = pgTable("user_phone_settings", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  phoneNumber: text("phone_number").notNull(),
  verified: boolean("verified").notNull().default(false),
  smsOptIn: boolean("sms_opt_in").notNull().default(false),
  smsOptInAt: timestamp("sms_opt_in_at"),
  verifiedAt: timestamp("verified_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserPhoneSettingsSchema = createInsertSchema(userPhoneSettings).omit({ id: true, createdAt: true, updatedAt: true });
export type UserPhoneSettings = typeof userPhoneSettings.$inferSelect;
export type InsertUserPhoneSettings = z.infer<typeof insertUserPhoneSettingsSchema>;

export const authorProfiles = pgTable("author_profiles", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  displayName: text("display_name").notNull(),
  bio: text("bio"),
  stripeConnectId: text("stripe_connect_id"),
  stripeOnboardingComplete: boolean("stripe_onboarding_complete").default(false),
  payoutEnabled: boolean("payout_enabled").default(false),
  totalEarningsCents: integer("total_earnings_cents").default(0),
  totalPaidOutCents: integer("total_paid_out_cents").default(0),
  pendingBalanceCents: integer("pending_balance_cents").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertAuthorProfileSchema = createInsertSchema(authorProfiles).omit({ id: true, createdAt: true, updatedAt: true });
export type AuthorProfile = typeof authorProfiles.$inferSelect;
export type InsertAuthorProfile = z.infer<typeof insertAuthorProfileSchema>;

export const authorEarnings = pgTable("author_earnings", {
  id: serial("id").primaryKey(),
  authorId: text("author_id").notNull(),
  bookId: text("book_id").notNull(),
  purchaseId: text("purchase_id").notNull(),
  grossAmountCents: integer("gross_amount_cents").notNull(),
  platformFeeCents: integer("platform_fee_cents").notNull(),
  authorEarningsCents: integer("author_earnings_cents").notNull(),
  status: text("status").notNull().default("pending"),
  stripeTransferId: text("stripe_transfer_id"),
  eligibleAt: timestamp("eligible_at"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAuthorEarningSchema = createInsertSchema(authorEarnings).omit({ id: true, createdAt: true });
export type AuthorEarning = typeof authorEarnings.$inferSelect;
export type InsertAuthorEarning = z.infer<typeof insertAuthorEarningSchema>;

export const studioCodeStamps = pgTable("studio_code_stamps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: text("project_id").notNull(),
  userId: text("user_id").notNull(),
  commitHash: text("commit_hash"),
  treeHash: text("tree_hash").notNull(),
  provenanceId: text("provenance_id"),
  txHash: text("tx_hash"),
  blockNumber: integer("block_number"),
  message: text("message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertStudioCodeStampSchema = createInsertSchema(studioCodeStamps).omit({
  id: true,
  createdAt: true,
});
export type InsertStudioCodeStamp = z.infer<typeof insertStudioCodeStampSchema>;
export type StudioCodeStamp = typeof studioCodeStamps.$inferSelect;

export const studioPipelineRuns = pgTable("studio_pipeline_runs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: text("project_id").notNull(),
  userId: text("user_id").notNull(),
  pipelineName: text("pipeline_name").notNull(),
  status: text("status").notNull().default("pending"),
  steps: text("steps").notNull().default("[]"),
  logs: text("logs").notNull().default(""),
  duration: integer("duration"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertStudioPipelineRunSchema = createInsertSchema(studioPipelineRuns).omit({
  id: true,
  createdAt: true,
});
export type InsertStudioPipelineRun = z.infer<typeof insertStudioPipelineRunSchema>;
export type StudioPipelineRun = typeof studioPipelineRuns.$inferSelect;

export const BOOK_CATEGORIES = {
  fiction: {
    label: "Fiction",
    subcategories: [
      "Literary Fiction", "Science Fiction", "Fantasy", "Mystery & Thriller",
      "Romance", "Horror", "Historical Fiction", "Adventure",
      "Dystopian", "Young Adult", "Short Stories", "Satire"
    ]
  },
  nonfiction: {
    label: "Non-Fiction",
    subcategories: [
      "Investigation", "History", "Science", "Philosophy", "Spirituality",
      "Technology", "Business", "Memoir & Biography", "Self-Help",
      "True Crime", "Politics", "Health & Wellness", "Education"
    ]
  }
} as const;

export const investorInvitePins = pgTable("investor_invite_pins", {
  id: serial("id").primaryKey(),
  pin: text("pin").notNull().unique(),
  label: text("label"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
  usedAt: timestamp("used_at"),
  usedBy: text("used_by"),
  active: boolean("active").notNull().default(true),
});

export const insertInvestorInvitePinSchema = createInsertSchema(investorInvitePins).omit({ id: true, createdAt: true });
export type InsertInvestorInvitePin = z.infer<typeof insertInvestorInvitePinSchema>;
export type InvestorInvitePin = typeof investorInvitePins.$inferSelect;
