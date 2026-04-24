import { beforeAll, afterAll } from "vitest";

process.env.NODE_ENV = "test";
process.env.DATABASE_URL = process.env.DATABASE_URL || "postgresql://test:test@localhost:5432/test";

beforeAll(() => {
  console.log("[Test Setup] Test suite starting...");
});

afterAll(() => {
  console.log("[Test Setup] Test suite complete.");
});
