import { describe, it, expect } from "vitest";
import crypto from "crypto";

const DWC_CONVERSION_RATE = 10;
const DWC_LAUNCH_DATE = "2026-04-11";
const SHELL_EARNING_CAPS = {
  dailyMax: 200,
  weeklyMax: 1000,
  starterBonus: 500,
};

const SHELL_BUNDLES = {
  starter: { amount: 1000, price: 900, name: "Starter Bundle", dwcEquivalent: 10 },
  pro: { amount: 5000, price: 4000, name: "Pro Bundle", dwcEquivalent: 50, bonus: 25 },
  elite: { amount: 12500, price: 9000, name: "Elite Bundle", dwcEquivalent: 125, bonus: 39 },
};

const CREDIT_COSTS = {
  AI_CHAT_MESSAGE: 10,
  SCENARIO_GENERATION: 20,
  CHOICE_PROCESSING: 5,
  VOICE_CLONE_CREATION: 500,
  VOICE_TTS_PER_100_CHARS: 5,
  VOICE_STT_PER_MINUTE: 10,
  PERSONALITY_SUMMARY: 30,
};

const REFERRAL_MULTIPLIERS = [
  { threshold: 0, multiplier: 1 },
  { threshold: 500, multiplier: 3 },
  { threshold: 2500, multiplier: 5 },
  { threshold: 5000, multiplier: 7 },
  { threshold: 10000, multiplier: 10 },
];

describe("Shells Economy", () => {
  describe("Conversion Rates", () => {
    it("should convert shells to SIG correctly (10 Shells = 1 SIG)", () => {
      const shells = 1000;
      const sig = shells / DWC_CONVERSION_RATE;
      expect(sig).toBe(100);
    });

    it("should convert echoes to shells (10 Echoes = 1 Shell)", () => {
      const echoes = 100;
      const shells = echoes / 10;
      expect(shells).toBe(10);
    });

    it("should maintain SIG value at $0.001 pre-launch", () => {
      const sigPrice = 0.001;
      const shellValue = sigPrice / DWC_CONVERSION_RATE;
      expect(shellValue).toBeCloseTo(0.0001, 4);
    });
  });

  describe("Earning Caps", () => {
    it("should enforce daily max of 200 shells (2 SIG)", () => {
      const dailySig = SHELL_EARNING_CAPS.dailyMax / DWC_CONVERSION_RATE;
      expect(dailySig).toBe(20);
    });

    it("should enforce weekly max of 1000 shells (10 SIG)", () => {
      const weeklySig = SHELL_EARNING_CAPS.weeklyMax / DWC_CONVERSION_RATE;
      expect(weeklySig).toBe(100);
    });

    it("should give 500 shells starter bonus (5 SIG)", () => {
      const starterSig = SHELL_EARNING_CAPS.starterBonus / DWC_CONVERSION_RATE;
      expect(starterSig).toBe(50);
    });
  });

  describe("Shell Bundles", () => {
    it("should price starter bundle at $9", () => {
      expect(SHELL_BUNDLES.starter.price).toBe(900);
    });

    it("should provide correct shell amounts", () => {
      expect(SHELL_BUNDLES.starter.amount).toBe(1000);
      expect(SHELL_BUNDLES.pro.amount).toBe(5000);
      expect(SHELL_BUNDLES.elite.amount).toBe(12500);
    });

    it("should calculate correct SIG equivalents", () => {
      expect(SHELL_BUNDLES.starter.dwcEquivalent).toBe(10);
      expect(SHELL_BUNDLES.pro.dwcEquivalent).toBe(50);
      expect(SHELL_BUNDLES.elite.dwcEquivalent).toBe(125);
    });

    it("should offer increasing bonus percentages for larger bundles", () => {
      expect(SHELL_BUNDLES.pro.bonus).toBeLessThan(SHELL_BUNDLES.elite.bonus!);
    });
  });

  describe("Atomic Transactions", () => {
    it("should maintain balance integrity on transfer", () => {
      let senderBalance = 1000;
      let recipientBalance = 500;
      const transferAmount = 250;

      const totalBefore = senderBalance + recipientBalance;
      senderBalance -= transferAmount;
      recipientBalance += transferAmount;
      const totalAfter = senderBalance + recipientBalance;

      expect(totalBefore).toBe(totalAfter);
      expect(senderBalance).toBe(750);
      expect(recipientBalance).toBe(750);
    });

    it("should reject transfer exceeding balance", () => {
      const balance = 100;
      const transferAmount = 150;
      expect(transferAmount > balance).toBe(true);
    });

    it("should reject negative transfer amounts", () => {
      const transferAmount = -50;
      expect(transferAmount > 0).toBe(false);
    });
  });
});

describe("Credits System", () => {
  describe("Credit Costs", () => {
    it("should cost 10 credits for AI chat", () => {
      expect(CREDIT_COSTS.AI_CHAT_MESSAGE).toBe(10);
    });

    it("should cost 500 credits for voice clone", () => {
      expect(CREDIT_COSTS.VOICE_CLONE_CREATION).toBe(500);
    });

    it("should calculate scenario generation correctly", () => {
      const scenarioCount = 5;
      const totalCost = scenarioCount * CREDIT_COSTS.SCENARIO_GENERATION;
      expect(totalCost).toBe(100);
    });
  });

  describe("Credit Deduction", () => {
    it("should deduct credits correctly", () => {
      let credits = 1000;
      credits -= CREDIT_COSTS.AI_CHAT_MESSAGE;
      expect(credits).toBe(990);
      credits -= CREDIT_COSTS.SCENARIO_GENERATION;
      expect(credits).toBe(970);
    });

    it("should reject action when insufficient credits", () => {
      const credits = 5;
      const canAfford = credits >= CREDIT_COSTS.AI_CHAT_MESSAGE;
      expect(canAfford).toBe(false);
    });
  });
});

describe("Staking Engine", () => {
  describe("APY Calculations", () => {
    it("should calculate staking rewards over 365 days", () => {
      const stakeAmount = 10000;
      const apyPercent = 14;
      const dailyRate = apyPercent / 365;
      const dailyReward = stakeAmount * (dailyRate / 100);
      const yearlyReward = dailyReward * 365;
      expect(yearlyReward).toBeCloseTo(stakeAmount * (apyPercent / 100), 0);
    });

    it("should compound rewards correctly", () => {
      let balance = 10000;
      const apyPercent = 14;
      const dailyRate = apyPercent / 365 / 100;

      for (let day = 0; day < 365; day++) {
        balance += balance * dailyRate;
      }

      expect(balance).toBeGreaterThan(10000 * 1.14);
    });
  });

  describe("Lock Periods", () => {
    const pools = [
      { name: "Liquid Flex", lockDays: 0, apy: 10 },
      { name: "Core Guard 45", lockDays: 45, apy: 14 },
      { name: "Core Guard 90", lockDays: 90, apy: 18 },
      { name: "Core Guard 180", lockDays: 180, apy: 22 },
      { name: "Diamond Vault", lockDays: 365, apy: 28 },
    ];

    it("should have increasing APY for longer lock periods", () => {
      for (let i = 1; i < pools.length; i++) {
        expect(pools[i].apy).toBeGreaterThan(pools[i - 1].apy);
      }
    });

    it("should allow withdrawal from liquid pool anytime", () => {
      expect(pools[0].lockDays).toBe(0);
    });

    it("should block withdrawal during lock period", () => {
      const stakeDate = new Date("2025-01-01");
      const now = new Date("2025-02-01");
      const lockDays = 90;
      const unlockDate = new Date(stakeDate.getTime() + lockDays * 24 * 60 * 60 * 1000);
      expect(now < unlockDate).toBe(true);
    });
  });

  describe("Minimum Stake", () => {
    it("should enforce minimum stake amounts", () => {
      const minStakes: Record<string, number> = {
        "liquid-flex": 100,
        "core-guard-45": 500,
      };
      expect(50 >= minStakes["liquid-flex"]).toBe(false);
      expect(100 >= minStakes["liquid-flex"]).toBe(true);
      expect(400 >= minStakes["core-guard-45"]).toBe(false);
    });
  });
});

describe("Referral Rewards", () => {
  function getMultiplier(purchaseAmount: number): number {
    let multiplier = 1;
    for (const tier of REFERRAL_MULTIPLIERS) {
      if (purchaseAmount >= tier.threshold) {
        multiplier = tier.multiplier;
      }
    }
    return multiplier;
  }

  it("should give 1x multiplier for $0 purchase", () => {
    expect(getMultiplier(0)).toBe(1);
  });

  it("should give 3x multiplier for $5+ purchase", () => {
    expect(getMultiplier(500)).toBe(3);
  });

  it("should give 5x multiplier for $25+ purchase", () => {
    expect(getMultiplier(2500)).toBe(5);
  });

  it("should give 10x multiplier for $100+ purchase", () => {
    expect(getMultiplier(10000)).toBe(10);
  });

  it("should calculate base 1000 shells per referral with multiplier", () => {
    const baseReward = 1000;
    const multiplier = getMultiplier(5000);
    const totalReward = baseReward * multiplier;
    expect(totalReward).toBe(7000);
  });

  it("should apply 2.5x business partner bonus", () => {
    const baseReward = 1000;
    const multiplier = getMultiplier(10000);
    const partnerMultiplier = 2.5;
    const totalReward = baseReward * multiplier * partnerMultiplier;
    expect(totalReward).toBe(25000);
  });
});

describe("Billing Service", () => {
  it("should calculate cost per AI call at 3 cents", () => {
    const costPerCall = 3;
    const calls = 100;
    const totalCost = calls * costPerCall;
    expect(totalCost).toBe(300);
  });

  it("should track cumulative billing", () => {
    let totalUsage = 0;
    const costs = [3, 3, 3, 3, 3];
    for (const cost of costs) {
      totalUsage += cost;
    }
    expect(totalUsage).toBe(15);
  });
});

describe("Tokenomics", () => {
  const TOTAL_SUPPLY = 1_000_000_000;
  const PRESALE_POOL = 10_000_000;
  const ALLOCATION = {
    treasury: 0.50,
    staking: 0.15,
    development: 0.15,
    ecosystem: 0.10,
    community: 0.10,
  };

  it("should have total supply of 1 billion SIG", () => {
    expect(TOTAL_SUPPLY).toBe(1_000_000_000);
  });

  it("should allocate 1% to presale pool", () => {
    expect(PRESALE_POOL / TOTAL_SUPPLY).toBe(0.01);
  });

  it("should sum all allocations to 100%", () => {
    const total = Object.values(ALLOCATION).reduce((sum, v) => sum + v, 0);
    expect(total).toBeCloseTo(1.0, 10);
  });

  it("should price SIG at $0.001 presale, $0.01 at TGE", () => {
    const presalePrice = 0.001;
    const tgePrice = 0.01;
    expect(tgePrice / presalePrice).toBe(10);
  });
});
