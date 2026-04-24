import crypto from 'crypto';
import { db } from './db';
import { webhooks } from '@shared/schema';
import { eq } from 'drizzle-orm';

const PULSE_WEBHOOK_URL = process.env.PULSE_WEBHOOK_URL || '';
const PULSE_WEBHOOK_SECRET = process.env.PULSE_WEBHOOK_SECRET || '';

type WebhookEventType = 
  | 'swap.executed'
  | 'stake.created'
  | 'stake.claimed'
  | 'block.produced'
  | 'transaction.confirmed'
  | 'liquidity.added'
  | 'token.launched'
  | 'bridge.locked'
  | 'bridge.released';

interface WebhookPayload {
  event: WebhookEventType;
  data: Record<string, unknown>;
  signature: string;
  timestamp: number;
}

interface RegisteredWebhook {
  id: string;
  url: string;
  secret: string;
  events: WebhookEventType[];
  createdAt: Date;
  active: boolean;
}

class WebhookService {
  private registeredWebhooks: Map<string, RegisteredWebhook> = new Map();
  private initialized: boolean = false;

  constructor() {
    this.initialize();
  }
  
  private async initialize(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;
    
    // Register Pulse webhook from environment
    if (PULSE_WEBHOOK_URL && PULSE_WEBHOOK_SECRET) {
      this.registerWebhook({
        url: PULSE_WEBHOOK_URL,
        secret: PULSE_WEBHOOK_SECRET,
        events: [
          'swap.executed',
          'stake.created',
          'stake.claimed',
          'block.produced',
          'transaction.confirmed',
          'liquidity.added',
          'token.launched',
          'bridge.locked',
          'bridge.released'
        ]
      });
      console.log('[Webhooks] Trust Layer Pulse webhook registered');
    }
    
    // Hydrate from database
    try {
      const dbWebhooks = await db.select().from(webhooks).where(eq(webhooks.isActive, true));
      for (const wh of dbWebhooks) {
        const events = JSON.parse(wh.events || '[]') as WebhookEventType[];
        if (wh.url && wh.secret && events.length > 0) {
          this.registeredWebhooks.set(wh.id, {
            id: wh.id,
            url: wh.url,
            secret: wh.secret,
            events,
            createdAt: wh.createdAt || new Date(),
            active: true
          });
        }
      }
      console.log(`[Webhooks] Loaded ${dbWebhooks.length} webhooks from database`);
    } catch (error) {
      console.warn('[Webhooks] Could not load webhooks from database');
    }
  }

  private generateSignature(data: Record<string, unknown>, secret: string): string {
    return crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(data))
      .digest('hex');
  }

  private generateWebhookId(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  registerWebhook(config: { url: string; secret: string; events: WebhookEventType[] }): string {
    const id = this.generateWebhookId();
    this.registeredWebhooks.set(id, {
      id,
      url: config.url,
      secret: config.secret,
      events: config.events,
      createdAt: new Date(),
      active: true
    });
    return id;
  }

  unregisterWebhook(id: string): boolean {
    return this.registeredWebhooks.delete(id);
  }

  getRegisteredWebhooks(): RegisteredWebhook[] {
    return Array.from(this.registeredWebhooks.values());
  }

  async emit(event: WebhookEventType, data: Record<string, unknown>): Promise<void> {
    const webhooksForEvent = Array.from(this.registeredWebhooks.values())
      .filter(wh => wh.active && wh.events.includes(event));

    if (webhooksForEvent.length === 0) return;

    for (const webhook of webhooksForEvent) {
      const signature = this.generateSignature(data, webhook.secret);
      const payload: WebhookPayload = {
        event,
        data,
        signature,
        timestamp: Date.now()
      };

      this.sendWebhook(webhook.url, payload).catch(err => {
        console.error(`[Webhooks] Failed to send ${event} to ${webhook.url}:`, err.message);
      });
    }
  }

  private async sendWebhook(url: string, payload: WebhookPayload): Promise<void> {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': payload.signature,
          'X-Webhook-Timestamp': payload.timestamp.toString()
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      throw error;
    }
  }

  async emitSwapExecuted(txHash: string, fromToken: string, toToken: string, fromAmount: string, toAmount: string, walletAddress: string): Promise<void> {
    await this.emit('swap.executed', {
      txHash,
      fromToken,
      toToken,
      fromAmount,
      toAmount,
      walletAddress,
      timestamp: new Date().toISOString()
    });
  }

  async emitStakeCreated(positionId: string, amount: string, apy: number, lockPeriod: number, walletAddress: string): Promise<void> {
    await this.emit('stake.created', {
      positionId,
      amount,
      apy,
      lockPeriod,
      walletAddress,
      timestamp: new Date().toISOString()
    });
  }

  async emitStakeClaimed(positionId: string, rewardAmount: string, walletAddress: string): Promise<void> {
    await this.emit('stake.claimed', {
      positionId,
      rewardAmount,
      walletAddress,
      timestamp: new Date().toISOString()
    });
  }

  async emitBlockProduced(blockHeight: number, blockHash: string, txCount: number, validator: string): Promise<void> {
    await this.emit('block.produced', {
      blockHeight,
      blockHash,
      txCount,
      validator,
      timestamp: new Date().toISOString()
    });
  }

  async emitTransactionConfirmed(txHash: string, from: string, to: string, amount: string, type: string): Promise<void> {
    await this.emit('transaction.confirmed', {
      txHash,
      from,
      to,
      amount,
      type,
      timestamp: new Date().toISOString()
    });
  }

  async emitLiquidityAdded(poolId: string, token0: string, token1: string, amount0: string, amount1: string, lpTokens: string, walletAddress: string): Promise<void> {
    await this.emit('liquidity.added', {
      poolId,
      token0,
      token1,
      amount0,
      amount1,
      lpTokens,
      walletAddress,
      timestamp: new Date().toISOString()
    });
  }

  async emitTokenLaunched(tokenAddress: string, name: string, symbol: string, totalSupply: string, launchType: string): Promise<void> {
    await this.emit('token.launched', {
      tokenAddress,
      name,
      symbol,
      totalSupply,
      launchType,
      timestamp: new Date().toISOString()
    });
  }

  async emitBridgeLocked(txHash: string, amount: string, targetChain: string, walletAddress: string): Promise<void> {
    await this.emit('bridge.locked', {
      txHash,
      amount,
      targetChain,
      walletAddress,
      timestamp: new Date().toISOString()
    });
  }

  async emitBridgeReleased(txHash: string, amount: string, sourceChain: string, walletAddress: string): Promise<void> {
    await this.emit('bridge.released', {
      txHash,
      amount,
      sourceChain,
      walletAddress,
      timestamp: new Date().toISOString()
    });
  }
}

export const webhookService = new WebhookService();
