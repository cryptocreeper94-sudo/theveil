import { getUncachableStripeClient } from "./stripeClient";

interface ProductConfig {
  name: string;
  description: string;
  metadata?: Record<string, string>;
  prices: {
    nickname: string;
    unit_amount: number;
    currency: string;
    recurring?: { interval: "month" | "year" };
    metadata?: Record<string, string>;
  }[];
}

const PRODUCTS: ProductConfig[] = [
  {
    name: "SIG Token Presale",
    description: "Pre-launch purchase of Signal (SIG) tokens",
    metadata: { category: "token", tier: "presale" },
    prices: [
      { nickname: "Token Bundle - Starter", unit_amount: 2500, currency: "usd", metadata: { tokens: "5000" } },
      { nickname: "Token Bundle - Standard", unit_amount: 10000, currency: "usd", metadata: { tokens: "25000" } },
      { nickname: "Token Bundle - Premium", unit_amount: 50000, currency: "usd", metadata: { tokens: "150000" } },
      { nickname: "Token Bundle - Whale", unit_amount: 100000, currency: "usd", metadata: { tokens: "350000" } },
    ],
  },
  {
    name: "Crowdfund Donation",
    description: "Support the Trust Layer ecosystem development",
    metadata: { category: "donation", tier: "crowdfund" },
    prices: [
      { nickname: "Supporter Tier", unit_amount: 2500, currency: "usd", metadata: { tier: "supporter" } },
      { nickname: "Backer Tier", unit_amount: 10000, currency: "usd", metadata: { tier: "backer" } },
      { nickname: "Advocate Tier", unit_amount: 50000, currency: "usd", metadata: { tier: "advocate" } },
      { nickname: "Founder Tier", unit_amount: 200000, currency: "usd", metadata: { tier: "founder" } },
    ],
  },
  {
    name: "Pulse Pro",
    description: "AI-powered market intelligence - ML predictions, Fear & Greed tracking, accuracy analytics",
    metadata: { category: "subscription", tier: "pulse_pro" },
    prices: [
      { nickname: "Pulse Pro Monthly", unit_amount: 1499, currency: "usd", recurring: { interval: "month" } },
      { nickname: "Pulse Pro Yearly", unit_amount: 14999, currency: "usd", recurring: { interval: "year" } },
    ],
  },
  {
    name: "Strike Agent",
    description: "Solana memecoin sniper - AI risk scoring, honeypot detection, one-click Phantom integration",
    metadata: { category: "subscription", tier: "strike_agent" },
    prices: [
      { nickname: "Strike Agent Monthly", unit_amount: 3000, currency: "usd", recurring: { interval: "month" } },
      { nickname: "Strike Agent Yearly", unit_amount: 30000, currency: "usd", recurring: { interval: "year" } },
    ],
  },
  {
    name: "Trust Layer Complete",
    description: "Full access bundle - Pulse Pro + Strike Agent + Chronicles Pro at discounted rate",
    metadata: { category: "subscription", tier: "complete" },
    prices: [
      { nickname: "Trust Layer Complete Monthly", unit_amount: 3999, currency: "usd", recurring: { interval: "month" } },
      { nickname: "Trust Layer Complete Yearly", unit_amount: 39999, currency: "usd", recurring: { interval: "year" } },
    ],
  },
  {
    name: "Chronicles Pro",
    description: "Premium access to Chronicles with enhanced AI, voice cloning, and exclusive scenarios",
    metadata: { category: "subscription", tier: "chronicles_pro" },
    prices: [
      { nickname: "Chronicles Pro Monthly", unit_amount: 1999, currency: "usd", recurring: { interval: "month" } },
      { nickname: "Chronicles Pro Yearly", unit_amount: 19999, currency: "usd", recurring: { interval: "year" } },
    ],
  },
  {
    name: "Guardian Watch",
    description: "Basic blockchain security monitoring - Alerts and basic threat detection",
    metadata: { category: "subscription", tier: "guardian_watch" },
    prices: [
      { nickname: "Guardian Watch Monthly", unit_amount: 29900, currency: "usd", recurring: { interval: "month" } },
    ],
  },
  {
    name: "Guardian Shield",
    description: "Advanced security monitoring - 24/7 monitoring, multi-chain coverage, instant alerts",
    metadata: { category: "subscription", tier: "guardian_shield" },
    prices: [
      { nickname: "Guardian Shield Monthly", unit_amount: 99900, currency: "usd", recurring: { interval: "month" } },
    ],
  },
  {
    name: "Guardian Command",
    description: "Enterprise security suite - Dedicated team, custom integrations, priority response",
    metadata: { category: "subscription", tier: "guardian_command" },
    prices: [
      { nickname: "Guardian Command Monthly", unit_amount: 299900, currency: "usd", recurring: { interval: "month" } },
    ],
  },
  {
    name: "Guardian Assurance",
    description: "Full automated + AI security analysis with professional PDF report — Launch Pricing",
    metadata: { category: "service", tier: "guardian_assurance" },
    prices: [
      { nickname: "Guardian Assurance Audit", unit_amount: 49900, currency: "usd" },
    ],
  },
  {
    name: "Guardian Certified",
    description: "Manual expert review + remediation + on-chain badge + 30-day monitoring — Launch Pricing",
    metadata: { category: "service", tier: "guardian_certified" },
    prices: [
      { nickname: "Guardian Certified Audit", unit_amount: 249900, currency: "usd" },
    ],
  },
  {
    name: "Domain Registration",
    description: ".dwsc blockchain domain registration",
    metadata: { category: "domain" },
    prices: [
      { nickname: "Premium Domain (3 char) - Yearly", unit_amount: 35000, currency: "usd", recurring: { interval: "year" } },
      { nickname: "Standard Domain (4-5 char) - Yearly", unit_amount: 15000, currency: "usd", recurring: { interval: "year" } },
      { nickname: "Basic Domain (6+ char) - Yearly", unit_amount: 2500, currency: "usd", recurring: { interval: "year" } },
      { nickname: "Premium Domain Lifetime", unit_amount: 875000, currency: "usd" },
      { nickname: "Standard Domain Lifetime", unit_amount: 375000, currency: "usd" },
      { nickname: "Basic Domain Lifetime", unit_amount: 62500, currency: "usd" },
    ],
  },
  {
    name: "Orbs Currency Pack",
    description: "Purchase Orbs for use within the Trust Layer ecosystem",
    metadata: { category: "orbs" },
    prices: [
      { nickname: "500 Orbs", unit_amount: 499, currency: "usd", metadata: { orbs: "500" } },
      { nickname: "1200 Orbs", unit_amount: 999, currency: "usd", metadata: { orbs: "1200" } },
      { nickname: "3000 Orbs", unit_amount: 1999, currency: "usd", metadata: { orbs: "3000" } },
      { nickname: "8000 Orbs", unit_amount: 4999, currency: "usd", metadata: { orbs: "8000" } },
    ],
  },
];

async function seedProducts() {
  console.log("Starting Stripe product seeding...\n");
  
  const stripe = await getUncachableStripeClient();
  const createdProducts: { product: string; prices: string[] }[] = [];

  for (const config of PRODUCTS) {
    console.log(`Creating product: ${config.name}`);
    
    const existingProducts = await stripe.products.search({
      query: `name:'${config.name.replace(/'/g, "\\'")}'`,
    });

    let product;
    if (existingProducts.data.length > 0) {
      console.log(`  Product already exists: ${existingProducts.data[0].id}`);
      product = existingProducts.data[0];
    } else {
      product = await stripe.products.create({
        name: config.name,
        description: config.description,
        metadata: config.metadata || {},
      });
      console.log(`  Created product: ${product.id}`);
    }

    const priceIds: string[] = [];
    
    for (const priceConfig of config.prices) {
      const existingPrices = await stripe.prices.list({
        product: product.id,
        active: true,
        limit: 100,
      });

      const matchingPrice = existingPrices.data.find(
        (p) => p.nickname === priceConfig.nickname
      );

      if (matchingPrice) {
        console.log(`    Price already exists: ${priceConfig.nickname} (${matchingPrice.id})`);
        priceIds.push(matchingPrice.id);
      } else {
        const priceParams: any = {
          product: product.id,
          nickname: priceConfig.nickname,
          unit_amount: priceConfig.unit_amount,
          currency: priceConfig.currency,
          metadata: priceConfig.metadata || {},
        };

        if (priceConfig.recurring) {
          priceParams.recurring = priceConfig.recurring;
        }

        const price = await stripe.prices.create(priceParams);
        console.log(`    Created price: ${priceConfig.nickname} (${price.id}) - $${(priceConfig.unit_amount / 100).toFixed(2)}`);
        priceIds.push(price.id);
      }
    }

    createdProducts.push({ product: product.id, prices: priceIds });
    console.log("");
  }

  console.log("\n=== STRIPE PRODUCT SEEDING COMPLETE ===\n");
  console.log("Products and Price IDs for reference:\n");
  
  for (let i = 0; i < PRODUCTS.length; i++) {
    console.log(`${PRODUCTS[i].name}:`);
    console.log(`  Product ID: ${createdProducts[i].product}`);
    console.log(`  Price IDs:`);
    for (let j = 0; j < createdProducts[i].prices.length; j++) {
      console.log(`    - ${PRODUCTS[i].prices[j].nickname}: ${createdProducts[i].prices[j]}`);
    }
    console.log("");
  }

  console.log("Webhooks are automatically managed by stripe-replit-sync.");
  console.log("Run `syncBackfill()` to sync these products to your database.");
}

seedProducts().catch(console.error);
