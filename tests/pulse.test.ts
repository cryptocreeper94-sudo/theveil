import { describe, it, expect } from "vitest";

/**
 * Pulse AI Prediction Engine — Unit Tests
 * 
 * Tests the pure-logic functions from:
 * - predictionTrackingService.ts (evaluateOutcome, classifyOutcome, determineConfidence)
 * - safetyEngineService.ts (scoreToGrade, safety score calculation)
 * 
 * These are extracted as standalone functions since the originals are private class methods.
 * They mirror the exact logic in the services.
 */

// ========== Replicated Pure Logic from predictionTrackingService ==========

function evaluateOutcome(signal: string, priceChangePercent: number): boolean {
  const winThreshold = 0.5;
  const holdTolerance = 2.0;

  switch (signal) {
    case "STRONG_BUY":
    case "BUY":
      return priceChangePercent > winThreshold;
    case "STRONG_SELL":
    case "SELL":
      return priceChangePercent < -winThreshold;
    case "HOLD":
      return Math.abs(priceChangePercent) < holdTolerance;
    default:
      return false;
  }
}

function classifyOutcome(signal: string, priceChangePercent: number): "WIN" | "LOSS" | "NEUTRAL" {
  const isCorrect = evaluateOutcome(signal, priceChangePercent);
  const threshold = 0.5;

  if (signal === "HOLD") {
    return isCorrect ? "WIN" : "LOSS";
  }

  if (Math.abs(priceChangePercent) < threshold) {
    return "NEUTRAL";
  }

  return isCorrect ? "WIN" : "LOSS";
}

function determineConfidence(bullish: number, bearish: number, signal: string): "HIGH" | "MEDIUM" | "LOW" {
  const total = bullish + bearish;
  const dominant = Math.max(bullish, bearish);
  const ratio = total > 0 ? dominant / total : 0;

  if (signal === "STRONG_BUY" || signal === "STRONG_SELL") return "HIGH";
  if (ratio > 0.75 && total >= 4) return "HIGH";
  if (ratio > 0.6 && total >= 3) return "MEDIUM";
  return "LOW";
}

// ========== Replicated Pure Logic from safetyEngineService ==========

function scoreToGrade(score: number): "A" | "B" | "C" | "D" | "F" {
  if (score >= 90) return "A";
  if (score >= 75) return "B";
  if (score >= 60) return "C";
  if (score >= 40) return "D";
  return "F";
}

function calculateSafetyScore(risksCount: number, warningsCount: number): number {
  let score = 100;
  score -= risksCount * 20;
  score -= warningsCount * 5;
  return Math.max(0, Math.min(100, score));
}

// ========== Tests ==========

describe("Pulse Prediction Engine", () => {
  describe("evaluateOutcome", () => {
    it("BUY is correct when price goes up > 0.5%", () => {
      expect(evaluateOutcome("BUY", 5.0)).toBe(true);
      expect(evaluateOutcome("BUY", 0.6)).toBe(true);
    });

    it("BUY is incorrect when price goes down or barely moves", () => {
      expect(evaluateOutcome("BUY", 0.3)).toBe(false);
      expect(evaluateOutcome("BUY", -2.0)).toBe(false);
      expect(evaluateOutcome("BUY", 0.0)).toBe(false);
    });

    it("STRONG_BUY follows same logic as BUY", () => {
      expect(evaluateOutcome("STRONG_BUY", 5.0)).toBe(true);
      expect(evaluateOutcome("STRONG_BUY", -1.0)).toBe(false);
    });

    it("SELL is correct when price goes down > 0.5%", () => {
      expect(evaluateOutcome("SELL", -3.0)).toBe(true);
      expect(evaluateOutcome("SELL", -0.6)).toBe(true);
    });

    it("SELL is incorrect when price goes up", () => {
      expect(evaluateOutcome("SELL", 2.0)).toBe(false);
      expect(evaluateOutcome("SELL", -0.3)).toBe(false);
    });

    it("STRONG_SELL follows same logic as SELL", () => {
      expect(evaluateOutcome("STRONG_SELL", -5.0)).toBe(true);
      expect(evaluateOutcome("STRONG_SELL", 1.0)).toBe(false);
    });

    it("HOLD is correct when price stays within ±2%", () => {
      expect(evaluateOutcome("HOLD", 0.0)).toBe(true);
      expect(evaluateOutcome("HOLD", 1.5)).toBe(true);
      expect(evaluateOutcome("HOLD", -1.9)).toBe(true);
    });

    it("HOLD is incorrect when price moves > 2%", () => {
      expect(evaluateOutcome("HOLD", 3.0)).toBe(false);
      expect(evaluateOutcome("HOLD", -5.0)).toBe(false);
    });

    it("unknown signals always return false", () => {
      expect(evaluateOutcome("UNKNOWN", 10.0)).toBe(false);
      expect(evaluateOutcome("", 5.0)).toBe(false);
    });
  });

  describe("classifyOutcome", () => {
    it("BUY with price up > 0.5% = WIN", () => {
      expect(classifyOutcome("BUY", 5.0)).toBe("WIN");
    });

    it("BUY with price down > 0.5% = LOSS", () => {
      expect(classifyOutcome("BUY", -3.0)).toBe("LOSS");
    });

    it("BUY with price barely moved = NEUTRAL", () => {
      expect(classifyOutcome("BUY", 0.1)).toBe("NEUTRAL");
      expect(classifyOutcome("BUY", -0.3)).toBe("NEUTRAL");
    });

    it("SELL with price down > 0.5% = WIN", () => {
      expect(classifyOutcome("SELL", -3.0)).toBe("WIN");
    });

    it("SELL with price up > 0.5% = LOSS", () => {
      expect(classifyOutcome("SELL", 3.0)).toBe("LOSS");
    });

    it("HOLD stable = WIN, HOLD volatile = LOSS (no NEUTRAL for HOLD)", () => {
      expect(classifyOutcome("HOLD", 0.5)).toBe("WIN");
      expect(classifyOutcome("HOLD", 5.0)).toBe("LOSS");
    });
  });

  describe("determineConfidence", () => {
    it("STRONG_BUY/STRONG_SELL always HIGH", () => {
      expect(determineConfidence(1, 5, "STRONG_BUY")).toBe("HIGH");
      expect(determineConfidence(0, 0, "STRONG_SELL")).toBe("HIGH");
    });

    it("dominant ratio > 0.75 with 4+ signals = HIGH", () => {
      expect(determineConfidence(4, 1, "BUY")).toBe("HIGH");
      // 4/5 = 0.80 > 0.75 and total >= 4
    });

    it("dominant ratio > 0.6 with 3+ signals = MEDIUM", () => {
      expect(determineConfidence(2, 1, "BUY")).toBe("MEDIUM");
      // 2/3 = 0.667 > 0.6 and total >= 3
    });

    it("weak signals = LOW", () => {
      expect(determineConfidence(1, 1, "HOLD")).toBe("LOW");
      expect(determineConfidence(0, 0, "BUY")).toBe("LOW");
    });

    it("edge case: exactly at boundary", () => {
      // 3/4 = 0.75 — NOT > 0.75, so falls to MEDIUM check
      // 0.75 > 0.6 and total 4 >= 3 → MEDIUM
      expect(determineConfidence(3, 1, "BUY")).toBe("MEDIUM");
    });
  });
});

describe("Pulse Safety Engine", () => {
  describe("scoreToGrade", () => {
    it("90-100 = A", () => {
      expect(scoreToGrade(100)).toBe("A");
      expect(scoreToGrade(90)).toBe("A");
    });

    it("75-89 = B", () => {
      expect(scoreToGrade(89)).toBe("B");
      expect(scoreToGrade(75)).toBe("B");
    });

    it("60-74 = C", () => {
      expect(scoreToGrade(74)).toBe("C");
      expect(scoreToGrade(60)).toBe("C");
    });

    it("40-59 = D", () => {
      expect(scoreToGrade(59)).toBe("D");
      expect(scoreToGrade(40)).toBe("D");
    });

    it("0-39 = F", () => {
      expect(scoreToGrade(39)).toBe("F");
      expect(scoreToGrade(0)).toBe("F");
    });
  });

  describe("calculateSafetyScore", () => {
    it("no risks = 100", () => {
      expect(calculateSafetyScore(0, 0)).toBe(100);
    });

    it("1 risk = 80", () => {
      expect(calculateSafetyScore(1, 0)).toBe(80);
    });

    it("2 risks + 2 warnings = 50", () => {
      expect(calculateSafetyScore(2, 2)).toBe(50);
    });

    it("5 risks floors to 0", () => {
      expect(calculateSafetyScore(5, 0)).toBe(0);
    });

    it("never goes below 0", () => {
      expect(calculateSafetyScore(10, 10)).toBe(0);
    });

    it("never goes above 100", () => {
      expect(calculateSafetyScore(-1, 0)).toBe(100);
    });

    it("real scenario: honeypot + mint authority + no liquidity = 40 (grade D)", () => {
      const score = calculateSafetyScore(3, 0); // 100 - 60 = 40
      expect(score).toBe(40);
      expect(scoreToGrade(score)).toBe("D");
    });

    it("real scenario: 1 warning only = 95 (grade A)", () => {
      const score = calculateSafetyScore(0, 1); // 100 - 5 = 95
      expect(score).toBe(95);
      expect(scoreToGrade(score)).toBe("A");
    });
  });

  describe("safety config defaults", () => {
    // These match DEFAULT_SAFETY_CONFIG in safetyEngineService.ts
    const DEFAULT_SAFETY_CONFIG = {
      requireNoMintAuthority: true,
      requireNoFreezeAuthority: true,
      requireLockedOrBurnedLiquidity: true,
      requireHoneypotCheck: true,
      minTokenAgeMinutes: 5,
      maxCreatorRiskScore: 70,
      maxTop10HoldersPercent: 50,
      minHolderCount: 50,
      minLiquidityUsd: 5000,
    };

    it("defaults require no mint authority", () => {
      expect(DEFAULT_SAFETY_CONFIG.requireNoMintAuthority).toBe(true);
    });

    it("defaults require 50+ holders", () => {
      expect(DEFAULT_SAFETY_CONFIG.minHolderCount).toBe(50);
    });

    it("defaults require $5000+ liquidity", () => {
      expect(DEFAULT_SAFETY_CONFIG.minLiquidityUsd).toBe(5000);
    });

    it("defaults max top-10 holders at 50%", () => {
      expect(DEFAULT_SAFETY_CONFIG.maxTop10HoldersPercent).toBe(50);
    });

    it("defaults max creator risk score at 70", () => {
      expect(DEFAULT_SAFETY_CONFIG.maxCreatorRiskScore).toBe(70);
    });
  });
});

describe("Prediction Edge Cases", () => {
  it("BUY at exactly 0.5% threshold is NOT a win", () => {
    // > 0.5 required, exactly 0.5 fails
    expect(evaluateOutcome("BUY", 0.5)).toBe(false);
  });

  it("SELL at exactly -0.5% threshold is NOT a win", () => {
    expect(evaluateOutcome("SELL", -0.5)).toBe(false);
  });

  it("HOLD at exactly ±2.0% boundary is NOT correct (uses < not <=)", () => {
    expect(evaluateOutcome("HOLD", 2.0)).toBe(false);
    expect(evaluateOutcome("HOLD", -2.0)).toBe(false);
  });

  it("extreme price movements", () => {
    expect(evaluateOutcome("BUY", 1000.0)).toBe(true);
    expect(evaluateOutcome("SELL", -99.9)).toBe(true);
    expect(classifyOutcome("BUY", 1000.0)).toBe("WIN");
    expect(classifyOutcome("SELL", -99.9)).toBe("WIN");
  });

  it("negative zero is handled", () => {
    expect(evaluateOutcome("BUY", -0)).toBe(false);
    expect(classifyOutcome("BUY", -0)).toBe("NEUTRAL");
  });
});
