/**
 * Testnet Service - Fetch real balances and send transactions on testnets
 * Uses public RPC endpoints for Ethereum Sepolia and Solana Devnet
 */

export interface TestnetBalance {
  chain: string;
  symbol: string;
  balance: string;
  balanceRaw: string;
  decimals: number;
  usdValue: number;
}

export interface TransactionRequest {
  chain: string;
  to: string;
  amount: string;
  from: string;
}

export interface TransactionResult {
  hash: string;
  status: 'pending' | 'confirmed' | 'failed';
  explorerUrl: string;
}

const TESTNET_RPC_ENDPOINTS: Record<string, string> = {
  ethereum: 'https://rpc.sepolia.org',
  solana: 'https://api.devnet.solana.com',
  polygon: 'https://rpc-amoy.polygon.technology',
  arbitrum: 'https://sepolia-rollup.arbitrum.io/rpc',
  base: 'https://sepolia.base.org',
  optimism: 'https://sepolia.optimism.io',
  bsc: 'https://data-seed-prebsc-1-s1.binance.org:8545',
  avalanche: 'https://api.avax-test.network/ext/bc/C/rpc',
};

const CHAIN_EXPLORERS: Record<string, string> = {
  ethereum: 'https://sepolia.etherscan.io/tx/',
  solana: 'https://explorer.solana.com/tx/',
  polygon: 'https://amoy.polygonscan.com/tx/',
  arbitrum: 'https://sepolia.arbiscan.io/tx/',
  base: 'https://sepolia.basescan.org/tx/',
  optimism: 'https://sepolia-optimism.etherscan.io/tx/',
  bsc: 'https://testnet.bscscan.com/tx/',
  avalanche: 'https://testnet.snowtrace.io/tx/',
  darkwave: '/explorer/tx/',
};

async function fetchEVMBalance(endpoint: string, address: string): Promise<{ balance: string; raw: string }> {
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_getBalance',
        params: [address, 'latest'],
      }),
    });
    
    const data = await response.json();
    if (data.error) {
      console.warn('RPC error:', data.error);
      return { balance: '0.0000', raw: '0' };
    }
    
    const balanceHex = data.result || '0x0';
    const balanceWei = BigInt(balanceHex);
    const balanceEth = Number(balanceWei) / 1e18;
    
    return { 
      balance: balanceEth.toFixed(6), 
      raw: balanceWei.toString() 
    };
  } catch (error) {
    console.error('EVM balance fetch error:', error);
    return { balance: '0.0000', raw: '0' };
  }
}

async function fetchSolanaBalance(address: string): Promise<{ balance: string; raw: string }> {
  try {
    const response = await fetch(TESTNET_RPC_ENDPOINTS.solana, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getBalance',
        params: [address],
      }),
    });
    
    const data = await response.json();
    if (data.error) {
      console.warn('Solana RPC error:', data.error);
      return { balance: '0.0000', raw: '0' };
    }
    
    const lamports = data.result?.value || 0;
    const solBalance = lamports / 1e9;
    
    return { 
      balance: solBalance.toFixed(6), 
      raw: lamports.toString() 
    };
  } catch (error) {
    console.error('Solana balance fetch error:', error);
    return { balance: '0.0000', raw: '0' };
  }
}

export async function fetchTestnetBalance(chain: string, address: string): Promise<TestnetBalance> {
  const symbols: Record<string, string> = {
    darkwave: 'SIG',
    ethereum: 'ETH',
    solana: 'SOL',
    polygon: 'MATIC',
    arbitrum: 'ETH',
    base: 'ETH',
    optimism: 'ETH',
    bsc: 'BNB',
    avalanche: 'AVAX',
  };
  
  const decimals: Record<string, number> = {
    solana: 9,
    darkwave: 18,
  };
  
  let balanceData = { balance: '0.0000', raw: '0' };
  
  if (chain === 'darkwave') {
    balanceData = { balance: '0.0000', raw: '0' };
  } else if (chain === 'solana') {
    balanceData = await fetchSolanaBalance(address);
  } else if (TESTNET_RPC_ENDPOINTS[chain]) {
    balanceData = await fetchEVMBalance(TESTNET_RPC_ENDPOINTS[chain], address);
  }
  
  return {
    chain,
    symbol: symbols[chain] || 'TOKEN',
    balance: balanceData.balance,
    balanceRaw: balanceData.raw,
    decimals: decimals[chain] || 18,
    usdValue: 0,
  };
}

export async function fetchAllTestnetBalances(addresses: Record<string, string>): Promise<TestnetBalance[]> {
  const chains = Object.keys(addresses).filter(chain => addresses[chain]);
  
  const balancePromises = chains.map(chain => 
    fetchTestnetBalance(chain, addresses[chain])
  );
  
  const results = await Promise.allSettled(balancePromises);
  
  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    }
    return {
      chain: chains[index],
      symbol: 'TOKEN',
      balance: '0.0000',
      balanceRaw: '0',
      decimals: 18,
      usdValue: 0,
    };
  });
}

export function getExplorerUrl(chain: string, txHash: string): string {
  const baseUrl = CHAIN_EXPLORERS[chain] || CHAIN_EXPLORERS.ethereum;
  const suffix = chain === 'solana' ? `?cluster=devnet` : '';
  return `${baseUrl}${txHash}${suffix}`;
}

export function getTestnetFaucetUrl(chain: string): string {
  const faucets: Record<string, string> = {
    ethereum: 'https://sepoliafaucet.com/',
    solana: 'https://faucet.solana.com/',
    polygon: 'https://faucet.polygon.technology/',
    arbitrum: 'https://www.alchemy.com/faucets/arbitrum-sepolia',
    base: 'https://www.alchemy.com/faucets/base-sepolia',
    optimism: 'https://www.alchemy.com/faucets/optimism-sepolia',
    bsc: 'https://testnet.bnbchain.org/faucet-smart',
    avalanche: 'https://faucet.avax.network/',
    darkwave: '/faucet',
  };
  
  return faucets[chain] || faucets.ethereum;
}

export function isTestnetSupported(chain: string): boolean {
  return chain in TESTNET_RPC_ENDPOINTS || chain === 'darkwave';
}

export function getTestnetName(chain: string): string {
  const names: Record<string, string> = {
    ethereum: 'Sepolia',
    solana: 'Devnet',
    polygon: 'Amoy',
    arbitrum: 'Sepolia',
    base: 'Sepolia',
    optimism: 'Sepolia',
    bsc: 'Testnet',
    avalanche: 'Fuji',
    darkwave: 'Testnet',
  };
  
  return names[chain] || 'Testnet';
}
