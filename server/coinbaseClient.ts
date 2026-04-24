const COINBASE_COMMERCE_API = "https://api.commerce.coinbase.com";

export async function createCoinbaseCharge(options: {
  name: string;
  description: string;
  amountUsd: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}) {
  const apiKey = process.env.COINBASE_COMMERCE_API_KEY;
  if (!apiKey) {
    throw new Error("Coinbase Commerce API key not configured");
  }

  const response = await fetch(`${COINBASE_COMMERCE_API}/charges`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CC-Api-Key": apiKey,
      "X-CC-Version": "2018-03-22",
    },
    body: JSON.stringify({
      name: options.name,
      description: options.description,
      pricing_type: "fixed_price",
      local_price: {
        amount: options.amountUsd,
        currency: "USD",
      },
      redirect_url: options.successUrl,
      cancel_url: options.cancelUrl,
      metadata: options.metadata || {},
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error("Coinbase charge error:", error);
    throw new Error("Failed to create Coinbase charge");
  }

  const data = await response.json();
  return {
    id: data.data.id,
    code: data.data.code,
    hostedUrl: data.data.hosted_url,
    expiresAt: data.data.expires_at,
    addresses: data.data.addresses,
  };
}

export async function getCoinbaseCharge(chargeId: string) {
  const apiKey = process.env.COINBASE_COMMERCE_API_KEY;
  if (!apiKey) {
    throw new Error("Coinbase Commerce API key not configured");
  }

  const response = await fetch(`${COINBASE_COMMERCE_API}/charges/${chargeId}`, {
    headers: {
      "X-CC-Api-Key": apiKey,
      "X-CC-Version": "2018-03-22",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to get charge status");
  }

  const data = await response.json();
  const timeline = data.data.timeline || [];
  const latestStatus = timeline[timeline.length - 1]?.status || "NEW";
  
  return {
    id: data.data.id,
    status: latestStatus,
    confirmedAt: data.data.confirmed_at,
    metadata: data.data.metadata,
  };
}
