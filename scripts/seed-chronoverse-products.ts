import { getUncachableStripeClient } from '../server/stripeClient';

const CHRONOVERSE_PLANS = [
  {
    name: "Chronoverse+ Monthly",
    description: "Full access to the Chronoverse. All levels, multiplayer, level editor, code lab. Cancel anytime.",
    amount: 499, // $4.99/mo
    interval: "month" as const,
    metadata: {
      tier: "chronoverse_plus",
      product: "chronoverse",
      category: "subscription",
    }
  },
  {
    name: "Chronoverse+ Annual",
    description: "Chronoverse+ for a full year — save 17%. All features included. Cancel anytime.",
    amount: 4999, // $49.99/yr
    interval: "year" as const,
    metadata: {
      tier: "chronoverse_plus_annual",
      product: "chronoverse",
      category: "subscription",
    }
  },
  {
    name: "Chronoverse Family Monthly",
    description: "Up to 4 kids on one plan. Multiplayer, level editor, code lab, parent dashboard. Cancel anytime.",
    amount: 799, // $7.99/mo
    interval: "month" as const,
    metadata: {
      tier: "chronoverse_family",
      product: "chronoverse",
      category: "subscription",
    }
  },
  {
    name: "Chronoverse Family Annual",
    description: "Family plan for a full year — save 17%. Up to 4 kids. Cancel anytime.",
    amount: 7999, // $79.99/yr
    interval: "year" as const,
    metadata: {
      tier: "chronoverse_family_annual",
      product: "chronoverse",
      category: "subscription",
    }
  },
];

async function seedChronoverseProducts() {
  console.log("Creating Chronoverse subscription products in Stripe...\n");
  
  const stripe = await getUncachableStripeClient();
  
  for (const plan of CHRONOVERSE_PLANS) {
    // Check if product already exists
    const existing = await stripe.products.search({
      query: `name:'${plan.name}'`
    });
    
    if (existing.data.length > 0) {
      console.log(`✓ ${plan.name} already exists (${existing.data[0].id})`);
      continue;
    }
    
    // Create product
    const product = await stripe.products.create({
      name: plan.name,
      description: plan.description,
      metadata: plan.metadata,
    });
    
    // Create recurring price
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: plan.amount,
      currency: "usd",
      recurring: { interval: plan.interval },
      metadata: plan.metadata,
    });
    
    console.log(`✓ Created ${plan.name}`);
    console.log(`  Product ID: ${product.id}`);
    console.log(`  Price ID: ${price.id}`);
    console.log(`  Amount: $${plan.amount / 100}/${plan.interval}`);
    console.log("");
  }
  
  console.log("\nChronoverse products created successfully!");
  console.log("Add the Price IDs to your CHRONOVERSE_PRICE_IDS env vars.");
}

seedChronoverseProducts().catch(console.error);
