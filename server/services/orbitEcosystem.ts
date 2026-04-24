import crypto from 'crypto';

const ORBIT_HUB_URL = process.env.ORBIT_HUB_URL || 'https://orbitstaffing.io';
const ORBIT_API_KEY = process.env.ORBIT_HUB_API_KEY!;
const ORBIT_WEBHOOK_SECRET = process.env.ORBIT_HUB_API_SECRET!;

export class OrbitEcosystemClient {
  private async request<T>(endpoint: string, method: string, body?: any): Promise<T> {
    const response = await fetch(`${ORBIT_HUB_URL}/api/ecosystem${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': ORBIT_API_KEY,
        'X-API-Secret': ORBIT_WEBHOOK_SECRET,
        'X-App-Name': 'DWSC Treasury',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) throw new Error(`ORBIT API error: ${response.status}`);
    return response.json();
  }

  async reportFinancialEvent(event: {
    eventType: 'revenue' | 'expense' | 'payout' | 'adjustment';
    grossAmount: number;
    netAmount?: number;
    description: string;
    productCode?: string;
    periodStart?: string;
    periodEnd?: string;
    metadata?: Record<string, any>;
  }) {
    return fetch(`${ORBIT_HUB_URL}/api/financial-hub/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': ORBIT_API_KEY,
        'X-API-Secret': ORBIT_WEBHOOK_SECRET,
      },
      body: JSON.stringify({
        sourceSystem: 'dwsc-treasury',
        sourceAppId: 'dw_app_dwsc',
        ...event,
      }),
    }).then(r => r.json());
  }

  async reportTreasuryMovement(movement: {
    movementType: 'transfer' | 'investment' | 'reserve' | 'payout';
    amount: number;
    fromAccount?: string;
    toAccount?: string;
    description: string;
    metadata?: Record<string, any>;
  }) {
    return this.reportFinancialEvent({
      eventType: 'adjustment',
      grossAmount: movement.amount,
      description: `Treasury ${movement.movementType}: ${movement.description}`,
      productCode: 'dwsc-treasury',
      metadata: {
        movementType: movement.movementType,
        fromAccount: movement.fromAccount,
        toAccount: movement.toAccount,
        ...movement.metadata,
      },
    });
  }

  async reportBlockchainActivity(activity: {
    txHash: string;
    chain: string;
    activityType: 'mint' | 'transfer' | 'swap' | 'stake' | 'yield';
    tokenSymbol?: string;
    amount: number;
    usdValue?: number;
    metadata?: Record<string, any>;
  }) {
    const { txHash, chain, activityType, tokenSymbol, amount, usdValue, ...rest } = activity;
    return this.reportFinancialEvent({
      eventType: activityType === 'yield' ? 'revenue' : 'adjustment',
      grossAmount: usdValue || amount,
      description: `Blockchain ${activityType}: ${tokenSymbol || ''} on ${chain}`,
      productCode: 'dwsc-treasury',
      metadata: {
        blockchain: true,
        txHash,
        chain,
        activityType,
        tokenSymbol,
        amount,
        usdValue,
        ...rest,
      },
    });
  }

  async syncContractors(contractors: Array<{
    externalId: string; name: string; email: string;
    phone?: string; skills?: string[]; status: 'active' | 'inactive';
  }>) {
    return this.request('/sync/contractors', 'POST', { contractors });
  }

  async sync1099Payments(year: number, payments: Array<{
    contractorId: string; contractorName: string;
    totalPaid: number; taxWithheld?: number;
  }>) {
    return this.request('/sync/1099', 'POST', { year, payments });
  }

  async logActivity(action: string, details?: Record<string, any>) {
    return this.request('/logs', 'POST', { action, details });
  }

  async checkStatus() {
    return this.request('/status', 'GET', null);
  }
}

export const orbitClient = new OrbitEcosystemClient();
