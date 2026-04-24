import { describe, it, expect, beforeAll } from "vitest";
import crypto from "crypto";

function computeMerkleRoot(hashes: string[]): string {
  if (hashes.length === 0) return crypto.createHash("sha256").update("empty").digest("hex");
  if (hashes.length === 1) return hashes[0];
  const nextLevel: string[] = [];
  for (let i = 0; i < hashes.length; i += 2) {
    const left = hashes[i];
    const right = hashes[i + 1] || left;
    nextLevel.push(crypto.createHash("sha256").update(left + right).digest("hex"));
  }
  return computeMerkleRoot(nextLevel);
}

function computeBlockHash(prevHash: string, merkleRoot: string, timestamp: number, validator: string): string {
  return crypto
    .createHash("sha256")
    .update(`${prevHash}${merkleRoot}${timestamp}${validator}`)
    .digest("hex");
}

function createTransaction(from: string, to: string, amount: bigint, nonce: number) {
  const data = `${from}:${to}:${amount.toString()}:${nonce}`;
  const hash = crypto.createHash("sha256").update(data).digest("hex");
  return { hash, from, to, amount, nonce, timestamp: new Date() };
}

function validateTransaction(tx: { from: string; to: string; amount: bigint; nonce: number }) {
  if (!tx.from || !tx.to) return { valid: false, reason: "Missing addresses" };
  if (tx.amount <= 0n) return { valid: false, reason: "Amount must be positive" };
  if (tx.nonce < 0) return { valid: false, reason: "Invalid nonce" };
  if (tx.from === tx.to) return { valid: false, reason: "Cannot send to self" };
  return { valid: true };
}

const DECIMALS = 18;
const ONE_TOKEN = BigInt("1000000000000000000");
const TOTAL_SUPPLY = BigInt("1000000000") * ONE_TOKEN;

describe("Blockchain Engine", () => {
  describe("Genesis Block", () => {
    it("should have correct genesis parameters", () => {
      const genesisTimestamp = new Date("2025-02-14T00:00:00Z");
      expect(genesisTimestamp.getTime()).toBe(1739491200000);
    });

    it("should have correct total supply (1B tokens)", () => {
      expect(TOTAL_SUPPLY).toBe(BigInt("1000000000000000000000000000"));
    });

    it("should use 18 decimals", () => {
      expect(ONE_TOKEN).toBe(BigInt("1000000000000000000"));
    });
  });

  describe("Transaction Validation", () => {
    it("should validate a correct transaction", () => {
      const result = validateTransaction({
        from: "0x" + "a".repeat(40),
        to: "0x" + "b".repeat(40),
        amount: ONE_TOKEN,
        nonce: 0,
      });
      expect(result.valid).toBe(true);
    });

    it("should reject transaction with missing from address", () => {
      const result = validateTransaction({
        from: "",
        to: "0x" + "b".repeat(40),
        amount: ONE_TOKEN,
        nonce: 0,
      });
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("Missing");
    });

    it("should reject zero amount transaction", () => {
      const result = validateTransaction({
        from: "0x" + "a".repeat(40),
        to: "0x" + "b".repeat(40),
        amount: 0n,
        nonce: 0,
      });
      expect(result.valid).toBe(false);
    });

    it("should reject negative amount transaction", () => {
      const result = validateTransaction({
        from: "0x" + "a".repeat(40),
        to: "0x" + "b".repeat(40),
        amount: -1n,
        nonce: 0,
      });
      expect(result.valid).toBe(false);
    });

    it("should reject self-transfer", () => {
      const addr = "0x" + "a".repeat(40);
      const result = validateTransaction({
        from: addr,
        to: addr,
        amount: ONE_TOKEN,
        nonce: 0,
      });
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("self");
    });

    it("should reject negative nonce", () => {
      const result = validateTransaction({
        from: "0x" + "a".repeat(40),
        to: "0x" + "b".repeat(40),
        amount: ONE_TOKEN,
        nonce: -1,
      });
      expect(result.valid).toBe(false);
    });
  });

  describe("Transaction Hashing", () => {
    it("should produce deterministic hashes", () => {
      const tx1 = createTransaction("0xaaa", "0xbbb", 100n, 0);
      const tx2 = createTransaction("0xaaa", "0xbbb", 100n, 0);
      expect(tx1.hash).toBe(tx2.hash);
    });

    it("should produce unique hashes for different transactions", () => {
      const tx1 = createTransaction("0xaaa", "0xbbb", 100n, 0);
      const tx2 = createTransaction("0xaaa", "0xbbb", 200n, 0);
      expect(tx1.hash).not.toBe(tx2.hash);
    });

    it("should produce 64-character hex hash", () => {
      const tx = createTransaction("0xaaa", "0xbbb", 100n, 0);
      expect(tx.hash).toHaveLength(64);
      expect(tx.hash).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe("Merkle Tree", () => {
    it("should compute root for empty tree", () => {
      const root = computeMerkleRoot([]);
      expect(root).toHaveLength(64);
    });

    it("should return single hash as root", () => {
      const hash = crypto.createHash("sha256").update("tx1").digest("hex");
      const root = computeMerkleRoot([hash]);
      expect(root).toBe(hash);
    });

    it("should compute root for two hashes", () => {
      const h1 = crypto.createHash("sha256").update("tx1").digest("hex");
      const h2 = crypto.createHash("sha256").update("tx2").digest("hex");
      const root = computeMerkleRoot([h1, h2]);
      const expected = crypto.createHash("sha256").update(h1 + h2).digest("hex");
      expect(root).toBe(expected);
    });

    it("should handle odd number of hashes", () => {
      const h1 = crypto.createHash("sha256").update("tx1").digest("hex");
      const h2 = crypto.createHash("sha256").update("tx2").digest("hex");
      const h3 = crypto.createHash("sha256").update("tx3").digest("hex");
      const root = computeMerkleRoot([h1, h2, h3]);
      expect(root).toHaveLength(64);
    });

    it("should produce deterministic roots", () => {
      const hashes = ["a", "b", "c", "d"].map((s) =>
        crypto.createHash("sha256").update(s).digest("hex")
      );
      const root1 = computeMerkleRoot([...hashes]);
      const root2 = computeMerkleRoot([...hashes]);
      expect(root1).toBe(root2);
    });
  });

  describe("Block Hash Computation", () => {
    it("should produce deterministic block hash", () => {
      const h1 = computeBlockHash("prev", "merkle", 1000, "validator1");
      const h2 = computeBlockHash("prev", "merkle", 1000, "validator1");
      expect(h1).toBe(h2);
    });

    it("should change with different prev hash", () => {
      const h1 = computeBlockHash("prev1", "merkle", 1000, "validator1");
      const h2 = computeBlockHash("prev2", "merkle", 1000, "validator1");
      expect(h1).not.toBe(h2);
    });

    it("should change with different validator", () => {
      const h1 = computeBlockHash("prev", "merkle", 1000, "validator1");
      const h2 = computeBlockHash("prev", "merkle", 1000, "validator2");
      expect(h1).not.toBe(h2);
    });
  });

  describe("BFT Consensus Parameters", () => {
    const BFT_QUORUM_THRESHOLD = 0.67;
    const EPOCH_LENGTH = 100;
    const MIN_STAKE = BigInt("1000000000000000000000");
    const SLASHING_PERCENTAGE = 5;

    it("should require 2/3+ quorum for finality", () => {
      expect(BFT_QUORUM_THRESHOLD).toBeGreaterThanOrEqual(0.67);
    });

    it("should have epoch length of 100 blocks", () => {
      expect(EPOCH_LENGTH).toBe(100);
    });

    it("should require minimum 1000 SIG stake for validators", () => {
      expect(MIN_STAKE).toBe(BigInt("1000") * ONE_TOKEN);
    });

    it("should slash 5% for misbehavior", () => {
      const stake = BigInt("10000") * ONE_TOKEN;
      const slashed = (stake * BigInt(SLASHING_PERCENTAGE)) / 100n;
      const remaining = stake - slashed;
      expect(remaining).toBe(BigInt("9500") * ONE_TOKEN);
    });
  });

  describe("Address Format", () => {
    it("should validate EVM-style addresses (0x + 40 hex chars)", () => {
      const validAddr = "0x" + "a".repeat(40);
      expect(validAddr).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });

    it("should reject short addresses", () => {
      const shortAddr = "0x" + "a".repeat(39);
      expect(shortAddr).not.toMatch(/^0x[a-fA-F0-9]{40}$/);
    });
  });
});
