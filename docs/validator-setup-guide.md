# DarkWave Validator Node Setup Guide

## Quick Start (Cloud VPS)

### Step 1: Choose a Provider
Recommended cheap VPS providers ($5/month):
- **DigitalOcean** - https://digitalocean.com
- **Vultr** - https://vultr.com
- **Linode** - https://linode.com

### Step 2: Create a Droplet/VPS
1. Sign up for an account
2. Create a new VPS (called "Droplet" on DigitalOcean)
3. Choose these specs:
   - **OS**: Ubuntu 22.04 LTS
   - **Size**: Basic $5/month (1 vCPU, 1GB RAM, 25GB SSD)
   - **Region**: Choose closest to your users

### Step 3: Access Your VPS
```bash
ssh root@YOUR_VPS_IP
```

### Step 4: Install Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Step 5: Clone Validator Software
```bash
git clone https://github.com/darkwavestudios/dwsc-validator.git
cd dwsc-validator
npm install
```

### Step 6: Configure Validator
```bash
cp .env.example .env
nano .env
```

Edit with your validator details:
```
VALIDATOR_NAME=My-Validator-1
VALIDATOR_PRIVATE_KEY=your-private-key
NETWORK_URL=https://dwsc.io/api
```

### Step 7: Run Validator
```bash
npm run start
```

For background running:
```bash
npm install -g pm2
pm2 start npm --name "dwsc-validator" -- start
pm2 save
pm2 startup
```

---

## Recommended Setup: 3 Cloud Validators

For proper decentralization, run 3 validators in different regions:

| Validator | Provider | Region | Monthly Cost |
|-----------|----------|--------|--------------|
| Validator-1 | DigitalOcean | New York | $5 |
| Validator-2 | Vultr | Los Angeles | $5 |
| Validator-3 | Linode | Frankfurt | $5 |
| **Total** | | | **$15/month** |

---

## Validator Naming Convention

For Founders Validators, use this naming:
- `DarkWave-Founders-Alpha`
- `DarkWave-Founders-Beta`
- `DarkWave-Founders-Gamma`

---

## Quick Commands

Check validator status:
```bash
pm2 status
```

View logs:
```bash
pm2 logs dwsc-validator
```

Restart validator:
```bash
pm2 restart dwsc-validator
```

---

## Security Best Practices

1. **Firewall**: Only open required ports
```bash
ufw allow ssh
ufw allow 8545/tcp  # RPC if needed
ufw enable
```

2. **SSH Keys**: Disable password login
```bash
nano /etc/ssh/sshd_config
# Set: PasswordAuthentication no
systemctl restart sshd
```

3. **Updates**: Keep system updated
```bash
apt update && apt upgrade -y
```

---

## Support

- Discord: discord.gg/darkwave
- Email: validators@dwsc.io
- Docs: https://docs.dwsc.io
