import { getUncachableStripeClient } from '../server/stripeClient';

const PRESALE_TIERS = [
  {
    name: "DWC Genesis Tier",
    description: "Highest tier with 25% bonus tokens. Be among the first Genesis holders.",
    amount: 250000, // $2,500 in cents
    bonus: 25,
    metadata: {
      tier: "genesis",
      bonus_percent: "25",
      category: "presale"
    }
  },
  {
    name: "DWC Founder Tier",
    description: "Founder tier with 15% bonus tokens. Early supporter benefits.",
    amount: 50000, // $500 in cents
    bonus: 15,
    metadata: {
      tier: "founder",
      bonus_percent: "15",
      category: "presale"
    }
  },
  {
    name: "DWC Pioneer Tier",
    description: "Pioneer tier with 10% bonus tokens. Join the movement early.",
    amount: 10000, // $100 in cents
    bonus: 10,
    metadata: {
      tier: "pioneer",
      bonus_percent: "10",
      category: "presale"
    }
  },
  {
    name: "DWC Early Bird Tier",
    description: "Entry tier with 5% bonus tokens. Start your DWC journey.",
    amount: 2500, // $25 in cents
    bonus: 5,
    metadata: {
      tier: "early_bird",
      bonus_percent: "5",
      category: "presale"
    }
  },
];

async function seedPresaleProducts() {
  console.log("Creating DWC Presale products in Stripe...\n");
  
  const stripe = await getUncachableStripeClient();
  
  for (const tier of PRESALE_TIERS) {
    // Check if product already exists
    const existing = await stripe.products.search({
      query: `name:'${tier.name}'`
    });
    
    if (existing.data.length > 0) {
      console.log(`✓ ${tier.name} already exists (${existing.data[0].id})`);
      continue;
    }
    
    // Create product
    const product = await stripe.products.create({
      name: tier.name,
      description: tier.description,
      metadata: tier.metadata,
    });
    
    // Create price for the product
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: tier.amount,
      currency: "usd",
      metadata: tier.metadata,
    });
    
    console.log(`✓ Created ${tier.name}`);
    console.log(`  Product ID: ${product.id}`);
    console.log(`  Price ID: ${price.id}`);
    console.log(`  Amount: $${tier.amount / 100}`);
    console.log("");
  }
  
  console.log("\nPresale products created successfully!");
  console.log("Products will sync to database via webhooks.");
}

seedPresaleProducts().catch(console.error);
