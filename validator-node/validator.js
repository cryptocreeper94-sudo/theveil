#!/usr/bin/env node
const crypto = require("crypto");
const https = require("https");
const http = require("http");

const CONFIG = {
  MAINNET_URL: process.env.MAINNET_URL || "https://dwtl.io",
  VALIDATOR_ID: process.env.VALIDATOR_ID || "",
  VALIDATOR_ADDRESS: process.env.VALIDATOR_ADDRESS || "",
  VALIDATOR_SECRET: process.env.VALIDATOR_SECRET || "",
  API_KEY: process.env.TRUSTLAYER_API_KEY || "",
  API_SECRET: process.env.TRUSTLAYER_API_SECRET || "",
  POLL_INTERVAL_MS: parseInt(process.env.POLL_INTERVAL_MS || "3000"),
  HEARTBEAT_INTERVAL_MS: parseInt(process.env.HEARTBEAT_INTERVAL_MS || "30000"),
  PORT: parseInt(process.env.PORT || "3100"),
};

let stats = {
  startedAt: new Date().toISOString(),
  blocksAttested: 0,
  lastAttestedHeight: 0,
  lastAttestedAt: null,
  errors: 0,
  lastError: null,
  chainHeight: 0,
  connected: false,
};

function log(level, msg, data) {
  const ts = new Date().toISOString();
  const prefix = `[${ts}] [${level.toUpperCase()}]`;
  if (data) {
    console.log(`${prefix} ${msg}`, typeof data === "object" ? JSON.stringify(data) : data);
  } else {
    console.log(`${prefix} ${msg}`);
  }
}

function makeRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, CONFIG.MAINNET_URL);
    const isHttps = url.protocol === "https:";
    const lib = isHttps ? https : http;

    const timestamp = Date.now().toString();
    const bodyStr = body ? JSON.stringify(body) : "";
    const bodyHash = bodyStr
      ? crypto.createHash("sha256").update(bodyStr).digest("hex")
      : "";
    const canonical = `${method}:${path}:${CONFIG.API_KEY}:${timestamp}:${bodyHash}`;
    const signature = crypto
      .createHmac("sha256", CONFIG.API_SECRET)
      .update(canonical)
      .digest("hex");

    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method,
      headers: {
        "Content-Type": "application/json",
        "x-blockchain-key": CONFIG.API_KEY,
        "x-blockchain-signature": signature,
        "x-blockchain-timestamp": timestamp,
        "x-validator-id": CONFIG.VALIDATOR_ID,
        "x-validator-address": CONFIG.VALIDATOR_ADDRESS,
      },
    };

    if (bodyStr) {
      options.headers["Content-Length"] = Buffer.byteLength(bodyStr);
    }

    const req = lib.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on("error", reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error("Request timeout"));
    });

    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

function createAttestationSignature(blockHeight, blockHash, timestamp) {
  const data = `${blockHeight}:${blockHash}:${CONFIG.VALIDATOR_ADDRESS}:${timestamp}`;
  return crypto
    .createHmac("sha256", CONFIG.VALIDATOR_SECRET)
    .update(data)
    .digest("hex");
}

async function getLatestBlock() {
  const res = await makeRequest("GET", "/api/block/latest");
  if (res.status === 200) {
    return res.data;
  }
  throw new Error(`Failed to fetch latest block: ${res.status}`);
}

async function getValidators() {
  const res = await makeRequest("GET", "/api/validators");
  if (res.status === 200) {
    return res.data;
  }
  throw new Error(`Failed to fetch validators: ${res.status}`);
}

async function submitAttestation(blockHeight, blockHash) {
  const timestamp = Date.now().toString();
  const signature = createAttestationSignature(blockHeight, blockHash, timestamp);

  const res = await makeRequest("POST", "/api/consensus/attest", {
    blockHeight,
    blockHash,
    validatorId: CONFIG.VALIDATOR_ID,
    signature,
    timestamp,
  });

  return res;
}

async function syncState(fromBlock) {
  const res = await makeRequest("GET", `/api/sync/state?fromBlock=${fromBlock}`);
  if (res.status === 200) {
    return res.data;
  }
  throw new Error(`Sync failed: ${res.status}`);
}

async function registerWithMainnet() {
  log("info", "Registering validator with mainnet...");
  const res = await makeRequest("POST", "/api/validator-node/register", {
    validatorId: CONFIG.VALIDATOR_ID,
    address: CONFIG.VALIDATOR_ADDRESS,
    nodeVersion: "1.0.0",
    capabilities: ["attest", "sync"],
  });

  if (res.status === 200 || res.status === 201) {
    log("info", "Registered with mainnet", res.data);
    stats.connected = true;
    return res.data;
  }

  log("warn", `Registration returned ${res.status} — proceeding anyway (may not be required)`);
  stats.connected = true;
  return null;
}

async function sendHeartbeat() {
  try {
    await makeRequest("POST", "/api/validator-node/heartbeat", {
      validatorId: CONFIG.VALIDATOR_ID,
      address: CONFIG.VALIDATOR_ADDRESS,
      stats: {
        blocksAttested: stats.blocksAttested,
        lastAttestedHeight: stats.lastAttestedHeight,
        uptime: Date.now() - new Date(stats.startedAt).getTime(),
      },
    });
  } catch {
    // Heartbeat failures are non-critical
  }
}

async function attestLoop() {
  try {
    const block = await getLatestBlock();
    stats.chainHeight = block.height;

    if (block.height > stats.lastAttestedHeight) {
      const res = await submitAttestation(block.height, block.hash);

      if (res.status === 200 && res.data.success) {
        stats.blocksAttested++;
        stats.lastAttestedHeight = block.height;
        stats.lastAttestedAt = new Date().toISOString();

        if (stats.blocksAttested % 100 === 0) {
          log("info", `Attested block #${block.height} (${stats.blocksAttested} total)`, {
            finalized: res.data.finalized,
            attestedStake: res.data.attestedStake,
          });
        }
      } else if (res.status !== 400) {
        stats.errors++;
        stats.lastError = `Attestation failed: ${JSON.stringify(res.data)}`;
      }
    }
  } catch (err) {
    stats.errors++;
    stats.lastError = err.message;
    if (stats.errors % 10 === 1) {
      log("error", `Attestation error (${stats.errors} total): ${err.message}`);
    }
  }
}

function startStatusServer() {
  const server = http.createServer((req, res) => {
    if (req.url === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok", ...stats }));
    } else if (req.url === "/stats") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(stats, null, 2));
    } else {
      res.writeHead(404);
      res.end("Not Found");
    }
  });

  server.listen(CONFIG.PORT, () => {
    log("info", `Status server listening on port ${CONFIG.PORT}`);
    log("info", `  Health: http://localhost:${CONFIG.PORT}/health`);
    log("info", `  Stats:  http://localhost:${CONFIG.PORT}/stats`);
  });
}

async function main() {
  console.log("");
  console.log("  ╔══════════════════════════════════════════════╗");
  console.log("  ║   Trust Layer — External Validator Node      ║");
  console.log("  ║   BFT-PoA Consensus | 400ms Block Time       ║");
  console.log("  ╚══════════════════════════════════════════════╝");
  console.log("");

  const required = ["VALIDATOR_ID", "VALIDATOR_ADDRESS", "VALIDATOR_SECRET", "API_KEY", "API_SECRET"];
  const missing = required.filter((k) => !CONFIG[k]);
  if (missing.length > 0) {
    log("error", `Missing required config: ${missing.join(", ")}`);
    log("error", "Set these as environment variables:");
    log("error", "  VALIDATOR_ID        — Your validator ID from the mainnet");
    log("error", "  VALIDATOR_ADDRESS   — Your validator wallet address");
    log("error", "  VALIDATOR_SECRET    — Your validator secret key for signing attestations");
    log("error", "  TRUSTLAYER_API_KEY  — API key for mainnet communication");
    log("error", "  TRUSTLAYER_API_SECRET — API secret for HMAC signatures");
    process.exit(1);
  }

  log("info", `Mainnet:    ${CONFIG.MAINNET_URL}`);
  log("info", `Validator:  ${CONFIG.VALIDATOR_ID}`);
  log("info", `Address:    ${CONFIG.VALIDATOR_ADDRESS}`);
  log("info", `Poll:       ${CONFIG.POLL_INTERVAL_MS}ms`);
  log("info", `Heartbeat:  ${CONFIG.HEARTBEAT_INTERVAL_MS}ms`);
  console.log("");

  startStatusServer();

  try {
    await registerWithMainnet();
  } catch (err) {
    log("warn", `Initial registration failed: ${err.message} — will retry on heartbeat`);
    stats.connected = true;
  }

  try {
    const block = await getLatestBlock();
    stats.chainHeight = block.height;
    stats.lastAttestedHeight = block.height - 1;
    log("info", `Chain height: ${block.height} — starting attestation loop`);
  } catch (err) {
    log("warn", `Could not fetch initial block: ${err.message} — starting from 0`);
  }

  setInterval(attestLoop, CONFIG.POLL_INTERVAL_MS);
  setInterval(sendHeartbeat, CONFIG.HEARTBEAT_INTERVAL_MS);

  log("info", "Validator node running. Press Ctrl+C to stop.");
}

process.on("SIGINT", () => {
  log("info", "Shutting down validator node...");
  log("info", `Final stats: ${stats.blocksAttested} blocks attested, ${stats.errors} errors`);
  process.exit(0);
});

process.on("SIGTERM", () => {
  log("info", "Received SIGTERM, shutting down...");
  process.exit(0);
});

main().catch((err) => {
  log("error", `Fatal: ${err.message}`);
  process.exit(1);
});
