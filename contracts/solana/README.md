# wDWC Bridge - Solana Program

Wrapped DarkWave Coin (wDWC) bridge program for Solana, enabling cross-chain transfers between DarkWave Smart Chain (DSC) and Solana.

## Token Details

| Property | Value |
|----------|-------|
| Name | Wrapped DarkWave Coin |
| Symbol | wDWC |
| Decimals | 9 (Solana standard) |
| Network | Solana Devnet (testnet phase) |

## Upgradeability

This program uses the **BPF Upgradeable Loader**, which means:

1. **Program code can be upgraded** without changing the program ID
2. **All state (accounts) is preserved** during upgrades
3. **Upgrade authority** controls who can upgrade the program

### Upgrade Process

```bash
# Build the new version
anchor build

# Deploy upgrade (requires upgrade authority)
anchor upgrade target/deploy/wdwc_bridge.so --program-id DSCBridge111111111111111111111111111111111

# Transfer upgrade authority to multi-sig (recommended for production)
solana program set-upgrade-authority DSCBridge111111111111111111111111111111111 \
  --new-upgrade-authority <MULTISIG_ADDRESS>
```

### Security Features

1. **Protocol Versioning**: Every transaction includes `protocol_version` for compatibility tracking
2. **Upgrade Authority**: Separate from bridge authority, can be transferred to multi-sig
3. **Pause Mechanism**: Bridge can be paused in emergencies
4. **Event Logging**: All upgrades and authority changes emit events

## Deployment

### Prerequisites

1. Install Solana CLI: https://docs.solana.com/cli/install-solana-cli-tools
2. Install Anchor: https://www.anchor-lang.com/docs/installation
3. Fund your wallet with Devnet SOL: `solana airdrop 2`

### Devnet

```bash
# Configure for devnet
solana config set --url devnet

# Build
anchor build

# Deploy
anchor deploy

# Initialize bridge
anchor run initialize
```

### Mainnet

```bash
# Configure for mainnet
solana config set --url mainnet-beta

# Build with production settings
anchor build -- --features mainnet

# Deploy
anchor deploy

# IMPORTANT: Transfer upgrade authority to multi-sig
solana program set-upgrade-authority DSCBridge111111111111111111111111111111111 \
  --new-upgrade-authority <GOVERNANCE_MULTISIG>
```

## Bridge Flow

```
DarkWave Smart Chain              Solana
       |                            |
       | 1. User locks DWC          |
       |--------------------------->|
       |                            |
       | 2. Bridge mints wDWC       |
       |                            |
       |<---------------------------|
       | 3. User burns wDWC         |
       |                            |
       | 4. Bridge releases DWC     |
       |--------------------------->|
```

## Protocol Version History

| Version | Date | Changes |
|---------|------|---------|
| 1 | 2024-12 | Initial release with DSC branding, pause mechanism, upgrade authority |

## Architecture

```
BridgeState (PDA: "bridge")
├── authority: Pubkey (bridge operator)
├── wdwc_mint: Pubkey (SPL token mint)
├── upgrade_authority: Pubkey (can upgrade program)
├── protocol_version: u8 (current version)
├── is_paused: bool (emergency stop)
├── validators: Vec<Pubkey> (multi-sig committee)
└── stats: total_locked, total_minted, nonce

LockRecord (PDA: "lock" + lock_id)
├── lock_id: [u8; 32]
├── processed: bool
├── amount: u64
├── recipient: Pubkey
├── dsc_tx_hash: String
├── timestamp: i64
└── protocol_version: u8
```

## Events

- `BridgeMint` - wDWC minted after DWC locked on DSC
- `BridgeBurn` - wDWC burned to release DWC on DSC
- `ValidatorAdded` / `ValidatorRemoved` - Multi-sig changes
- `UpgradeAuthorityChanged` - Governance changes
- `BridgePaused` - Emergency pause/unpause

## Mint Authority

The bridge operator (Founders Validator) holds the mint authority. Only this wallet can mint new wDWC tokens when DWC is locked on DarkWave Smart Chain.

For production, transfer mint authority to a multi-sig governance wallet.
