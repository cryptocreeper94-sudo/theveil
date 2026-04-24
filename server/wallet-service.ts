import { Connection, PublicKey, LAMPORTS_PER_SOL, SystemProgram, Transaction, Keypair } from '@solana/web3.js';
import { ethers } from 'ethers';
import bs58 from 'bs58';
import crypto from 'crypto';

const HELIUS_API_KEY = process.env.HELIUS_API_KEY;
const SOLANA_RPC = HELIUS_API_KEY 
  ? `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`
  : 'https://api.mainnet-beta.solana.com';

const SUPPORTED_CHAINS: Record<string, ChainConfig> = {
  darkwave: { id: 'darkwave', name: 'Trust Layer', symbol: 'SIG', coinType: 60, rpcUrl: 'native', chainId: 7777, explorer: '/explorer', isNative: true },
  solana: { id: 'solana', name: 'Solana', symbol: 'SOL', coinType: 501, rpcUrl: SOLANA_RPC, explorer: 'https://solscan.io' },
  ethereum: { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', coinType: 60, rpcUrl: 'https://eth.llamarpc.com', chainId: 1, explorer: 'https://etherscan.io' },
  base: { id: 'base', name: 'Base', symbol: 'ETH', coinType: 60, rpcUrl: 'https://mainnet.base.org', chainId: 8453, explorer: 'https://basescan.org' },
  polygon: { id: 'polygon', name: 'Polygon', symbol: 'MATIC', coinType: 60, rpcUrl: 'https://polygon-rpc.com', chainId: 137, explorer: 'https://polygonscan.com' },
  arbitrum: { id: 'arbitrum', name: 'Arbitrum', symbol: 'ETH', coinType: 60, rpcUrl: 'https://arb1.arbitrum.io/rpc', chainId: 42161, explorer: 'https://arbiscan.io' },
  bsc: { id: 'bsc', name: 'BNB Chain', symbol: 'BNB', coinType: 60, rpcUrl: 'https://bsc-dataseed.binance.org', chainId: 56, explorer: 'https://bscscan.com' },
  optimism: { id: 'optimism', name: 'Optimism', symbol: 'ETH', coinType: 60, rpcUrl: 'https://mainnet.optimism.io', chainId: 10, explorer: 'https://optimistic.etherscan.io' },
  avalanche: { id: 'avalanche', name: 'Avalanche', symbol: 'AVAX', coinType: 60, rpcUrl: 'https://api.avax.network/ext/bc/C/rpc', chainId: 43114, explorer: 'https://snowtrace.io' },
};

interface ChainConfig {
  id: string;
  name: string;
  symbol: string;
  coinType: number;
  rpcUrl: string;
  chainId?: number;
  explorer: string;
  isNative?: boolean;
}

interface DerivedAccount {
  chain: string;
  address: string;
  path: string;
}

interface BalanceResult {
  balance: string;
  usd: number;
  symbol: string;
}

interface TransactionResult {
  success: boolean;
  txHash: string;
  explorerUrl: string;
}

class MultiChainWalletService {
  private solanaConnection: Connection;
  private evmProviders: Map<string, ethers.JsonRpcProvider> = new Map();
  
  constructor() {
    this.solanaConnection = new Connection(SOLANA_RPC, 'confirmed');
    for (const [chain, config] of Object.entries(SUPPORTED_CHAINS)) {
      if (chain !== 'solana' && chain !== 'darkwave' && config.rpcUrl !== 'native') {
        try {
          this.evmProviders.set(chain, new ethers.JsonRpcProvider(config.rpcUrl));
        } catch (error) {
          console.warn(`[Wallet] Failed to initialize ${chain} provider`);
        }
      }
    }
  }

  generateMnemonic(wordCount: 12 | 24 = 12): string {
    const entropy = crypto.randomBytes(wordCount === 12 ? 16 : 32);
    return ethers.Mnemonic.fromEntropy(entropy).phrase;
  }

  validateMnemonic(mnemonic: string): boolean {
    try { 
      ethers.Mnemonic.fromPhrase(mnemonic.trim()); 
      return true; 
    } catch { 
      return false; 
    }
  }

  encryptMnemonic(mnemonic: string, password: string): string {
    const salt = crypto.randomBytes(16);
    const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    let encrypted = cipher.update(mnemonic, 'utf8', 'hex') + cipher.final('hex');
    return Buffer.concat([salt, iv, cipher.getAuthTag(), Buffer.from(encrypted, 'hex')]).toString('base64');
  }

  decryptMnemonic(encryptedData: string, password: string): string {
    const data = Buffer.from(encryptedData, 'base64');
    const salt = data.subarray(0, 16);
    const iv = data.subarray(16, 32);
    const authTag = data.subarray(32, 48);
    const encrypted = data.subarray(48);
    const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
  }

  deriveAddresses(mnemonic: string): DerivedAccount[] {
    const accounts: DerivedAccount[] = [];
    const hdNode = ethers.HDNodeWallet.fromPhrase(mnemonic);
    
    for (const [chainId, config] of Object.entries(SUPPORTED_CHAINS)) {
      if (chainId === 'solana') {
        try {
          const bip39 = require('bip39');
          const { derivePath } = require('ed25519-hd-key');
          const seed = bip39.mnemonicToSeedSync(mnemonic);
          const { key } = derivePath("m/44'/501'/0'/0'", seed.toString('hex'));
          accounts.push({ 
            chain: 'solana', 
            address: Keypair.fromSeed(key).publicKey.toBase58(), 
            path: "m/44'/501'/0'/0'" 
          });
        } catch (error) {
          console.warn('[Wallet] Solana derivation failed');
        }
      } else {
        const evmPath = `m/44'/${config.coinType}'/0'/0/0`;
        const evmNode = hdNode.derivePath(evmPath);
        accounts.push({ chain: chainId, address: evmNode.address, path: evmPath });
      }
    }
    return accounts;
  }

  getPrivateKey(mnemonic: string, chain: string): string {
    if (chain === 'solana') {
      const bip39 = require('bip39');
      const { derivePath } = require('ed25519-hd-key');
      const seed = bip39.mnemonicToSeedSync(mnemonic);
      const { key } = derivePath("m/44'/501'/0'/0'", seed.toString('hex'));
      return bs58.encode(Keypair.fromSeed(key).secretKey);
    }
    const config = SUPPORTED_CHAINS[chain];
    const evmPath = `m/44'/${config?.coinType || 60}'/0'/0/0`;
    return ethers.HDNodeWallet.fromPhrase(mnemonic).derivePath(evmPath).privateKey;
  }

  async getBalance(chain: string, address: string): Promise<BalanceResult> {
    const config = SUPPORTED_CHAINS[chain];
    
    if (chain === 'darkwave') {
      return { balance: '0', usd: 0, symbol: 'SIG' };
    }
    
    if (chain === 'solana') {
      try {
        const lamports = await this.solanaConnection.getBalance(new PublicKey(address));
        const solBalance = lamports / LAMPORTS_PER_SOL;
        const priceData = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd')
          .then(r => r.json())
          .catch(() => ({}));
        return { 
          balance: solBalance.toFixed(6), 
          usd: solBalance * (priceData.solana?.usd || 0), 
          symbol: 'SOL' 
        };
      } catch (error) {
        return { balance: '0', usd: 0, symbol: 'SOL' };
      }
    }
    
    const provider = this.evmProviders.get(chain);
    if (!provider) {
      return { balance: '0', usd: 0, symbol: config?.symbol || 'ETH' };
    }
    
    try {
      const balanceWei = await provider.getBalance(address);
      const balanceEth = parseFloat(ethers.formatEther(balanceWei));
      const coinId = chain === 'polygon' ? 'matic-network' : 
                     chain === 'bsc' ? 'binancecoin' : 
                     chain === 'avalanche' ? 'avalanche-2' : 'ethereum';
      const priceData = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`)
        .then(r => r.json())
        .catch(() => ({}));
      return { 
        balance: balanceEth.toFixed(6), 
        usd: balanceEth * (priceData[coinId]?.usd || 0), 
        symbol: config.symbol 
      };
    } catch (error) {
      return { balance: '0', usd: 0, symbol: config?.symbol || 'ETH' };
    }
  }

  async sendTransaction(chain: string, mnemonic: string, to: string, amount: string): Promise<TransactionResult> {
    if (chain === 'darkwave') {
      throw new Error('Use Trust Layer native transaction API');
    }
    
    if (chain === 'solana') {
      const keypair = Keypair.fromSecretKey(bs58.decode(this.getPrivateKey(mnemonic, 'solana')));
      const tx = new Transaction().add(
        SystemProgram.transfer({ 
          fromPubkey: keypair.publicKey, 
          toPubkey: new PublicKey(to), 
          lamports: Math.floor(parseFloat(amount) * LAMPORTS_PER_SOL) 
        })
      );
      tx.recentBlockhash = (await this.solanaConnection.getLatestBlockhash()).blockhash;
      tx.feePayer = keypair.publicKey;
      const sig = await this.solanaConnection.sendTransaction(tx, [keypair]);
      await this.solanaConnection.confirmTransaction(sig);
      return { success: true, txHash: sig, explorerUrl: `https://solscan.io/tx/${sig}` };
    }
    
    const provider = this.evmProviders.get(chain);
    if (!provider) {
      throw new Error(`Provider not available for ${chain}`);
    }
    
    const wallet = new ethers.Wallet(this.getPrivateKey(mnemonic, chain), provider);
    const tx = await wallet.sendTransaction({ to, value: ethers.parseEther(amount) });
    await tx.wait();
    return { 
      success: true, 
      txHash: tx.hash, 
      explorerUrl: `${SUPPORTED_CHAINS[chain].explorer}/tx/${tx.hash}` 
    };
  }

  getSupportedChains() { 
    return Object.values(SUPPORTED_CHAINS); 
  }
  
  createWalletId(): string { 
    return crypto.randomBytes(16).toString('hex'); 
  }
  
  generateDarkWaveAddress(): string {
    const bytes = crypto.randomBytes(20);
    return 'DW' + bytes.toString('hex');
  }
}

export const walletService = new MultiChainWalletService();
export { SUPPORTED_CHAINS };
export type { ChainConfig, DerivedAccount, BalanceResult, TransactionResult };
