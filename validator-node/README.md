# Trust Layer — External Validator Node

A standalone validator node that connects to the Trust Layer mainnet (dwtl.io) and submits block attestations for BFT-PoA consensus.

## Requirements

- Node.js 18+
- A registered validator on Trust Layer mainnet
- TRUSTLAYER_API_KEY and TRUSTLAYER_API_SECRET

## Quick Start

### 1. Deploy a Server

Spin up a VPS on DigitalOcean, AWS, Linode, etc. Recommended:
- **DigitalOcean**: Basic Droplet, $6/mo (1 vCPU, 1GB RAM)
- **AWS**: t3.micro
- **Any VPS** with Node.js 18+

### 2. Copy Files

Copy the `validator-node/` directory to your server:

```bash
scp -r validator-node/ root@your-server-ip:/opt/trustlayer-validator/
```

### 3. Set Environment Variables

Create a `.env` file or export these:

```bash
export MAINNET_URL="https://dwtl.io"
export VALIDATOR_ID="your-validator-id"
export VALIDATOR_ADDRESS="0xYourValidatorWalletAddress"
export VALIDATOR_SECRET="your-validator-secret-key"
export TRUSTLAYER_API_KEY="your-api-key"
export TRUSTLAYER_API_SECRET="your-api-secret"
export PORT=3100
```

**Where to get these values:**
- `VALIDATOR_ID`: Returned when your validator was registered on mainnet
- `VALIDATOR_ADDRESS`: Your validator's wallet address (0x format)
- `VALIDATOR_SECRET`: A secret key you generate for signing attestations. Generate one with: `openssl rand -hex 32`
- `TRUSTLAYER_API_KEY` / `TRUSTLAYER_API_SECRET`: Get from Jason or the Trust Layer admin

### 4. Start the Node

```bash
cd /opt/trustlayer-validator
node validator.js
```

You'll see:
```
  ╔══════════════════════════════════════════════╗
  ║   Trust Layer — External Validator Node      ║
  ║   BFT-PoA Consensus | 400ms Block Time       ║
  ╚══════════════════════════════════════════════╝

[INFO] Mainnet:    https://dwtl.io
[INFO] Validator:  your-validator-id
[INFO] Address:    0xYourAddress
[INFO] Chain height: 5700000 — starting attestation loop
[INFO] Validator node running.
```

### 5. Run as a Service (Recommended)

Create a systemd service for auto-restart:

```bash
sudo cat > /etc/systemd/system/trustlayer-validator.service << 'EOF'
[Unit]
Description=Trust Layer Validator Node
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/trustlayer-validator
ExecStart=/usr/bin/node validator.js
Restart=always
RestartSec=5
Environment=MAINNET_URL=https://dwtl.io
Environment=VALIDATOR_ID=your-validator-id
Environment=VALIDATOR_ADDRESS=0xYourAddress
Environment=VALIDATOR_SECRET=your-secret
Environment=TRUSTLAYER_API_KEY=your-api-key
Environment=TRUSTLAYER_API_SECRET=your-api-secret
Environment=PORT=3100

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable trustlayer-validator
sudo systemctl start trustlayer-validator
```

Check status:
```bash
sudo systemctl status trustlayer-validator
sudo journalctl -u trustlayer-validator -f
```

## Health Check

The node runs a local HTTP server for monitoring:

```bash
# Health check
curl http://localhost:3100/health

# Detailed stats
curl http://localhost:3100/stats
```

Returns:
```json
{
  "status": "ok",
  "blocksAttested": 1542,
  "lastAttestedHeight": 5702100,
  "chainHeight": 5702100,
  "connected": true,
  "errors": 0,
  "startedAt": "2026-03-04T15:30:00.000Z"
}
```

## How It Works

1. **Polls** the mainnet every 400ms for the latest block
2. **Signs** an attestation: `HMAC-SHA256(blockHeight:blockHash:validatorAddress:timestamp)`
3. **Submits** the attestation to `POST /api/consensus/attest`
4. **Heartbeat** every 30 seconds to report node health
5. When **67%+ of total stake** attests to a block, it reaches **BFT finality**

## Network Requirements

- Outbound HTTPS to dwtl.io (port 443)
- Inbound port 3100 (optional, for health checks)
- Low latency connection preferred (< 100ms to mainnet)

## Consensus Parameters

| Parameter | Value |
|-----------|-------|
| Block Time | 400ms |
| Quorum Threshold | 67% (BFT) |
| Minimum Stake | 1,000 SIG |
| Slashing Penalty | 5% of stake |
| Downtime Tolerance | 50 blocks |
| Epoch Length | 100 blocks |

## Multiple Validators

You can run multiple validator nodes on different servers. Each needs its own:
- Unique `VALIDATOR_ID` and `VALIDATOR_ADDRESS`
- Its own `VALIDATOR_SECRET`
- Same `TRUSTLAYER_API_KEY` and `TRUSTLAYER_API_SECRET`

## Troubleshooting

**"Missing required config"** — Set all 5 environment variables listed above.

**"Validator not found"** — Your validator needs to be registered on mainnet first via `POST /api/validators/register`.

**High error count** — Check network connectivity to dwtl.io. The node auto-retries.

**"soft-finalized without full quorum"** — This means not enough validators are attesting. Add more validator nodes to reach 67% stake coverage.
