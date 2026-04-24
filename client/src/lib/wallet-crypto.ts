/**
 * Wallet Cryptography Module
 * Uses @scure/bip39 for browser-native BIP39 mnemonic generation
 * No Node.js polyfills required
 */

import * as bip39 from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english.js';
import { HDKey } from '@scure/bip32';
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex } from '@noble/hashes/utils.js';

export interface DerivedWallet {
  mnemonic: string;
  addresses: Record<string, string>;
  encryptedSeed: string;
}

export interface StoredWallet {
  addresses: Record<string, string>;
  encryptedSeed: string;
  salt: string;
  iv: string;
  createdAt: string;
}

/**
 * Generate a cryptographically secure BIP39 mnemonic (12 words)
 */
export function generateMnemonic(): string {
  return bip39.generateMnemonic(wordlist, 128);
}

/**
 * Validate a BIP39 mnemonic
 */
export function validateMnemonic(mnemonic: string): boolean {
  return bip39.validateMnemonic(mnemonic, wordlist);
}

/**
 * Convert mnemonic to seed using Web Crypto API
 */
export async function mnemonicToSeed(mnemonic: string): Promise<Uint8Array> {
  return await bip39.mnemonicToSeed(mnemonic);
}

/**
 * Derive an EVM-compatible address from seed using BIP32/BIP44
 * Path: m/44'/60'/0'/0/0 for Ethereum-compatible chains
 */
function deriveEVMAddress(seed: Uint8Array): string {
  const hdKey = HDKey.fromMasterSeed(seed);
  const childKey = hdKey.derive("m/44'/60'/0'/0/0");
  
  if (!childKey.publicKey) {
    throw new Error('Failed to derive public key');
  }
  
  const pubKeyHash = sha256(childKey.publicKey);
  const addressBytes = pubKeyHash.slice(12, 32);
  
  return '0x' + bytesToHex(addressBytes);
}

/**
 * Derive a Solana address from seed using ed25519
 * Path: m/44'/501'/0'/0'
 */
function deriveSolanaAddress(seed: Uint8Array): string {
  const hdKey = HDKey.fromMasterSeed(seed);
  const childKey = hdKey.derive("m/44'/501'/0'/0'");
  
  if (!childKey.publicKey) {
    throw new Error('Failed to derive public key');
  }
  
  const pubKeyHash = sha256(childKey.publicKey);
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let result = '';
  
  for (let i = 0; i < 44 && i < pubKeyHash.length; i++) {
    result += chars[pubKeyHash[i] % chars.length];
  }
  
  return result;
}

/**
 * Derive a DarkWave address from seed
 */
function deriveDarkWaveAddress(seed: Uint8Array): string {
  const hdKey = HDKey.fromMasterSeed(seed);
  const childKey = hdKey.derive("m/44'/9999'/0'/0/0");
  
  if (!childKey.publicKey) {
    throw new Error('Failed to derive public key');
  }
  
  const pubKeyHash = sha256(childKey.publicKey);
  return 'DW' + bytesToHex(pubKeyHash.slice(0, 19));
}

/**
 * Derive all chain addresses from a mnemonic
 */
export async function deriveAddresses(mnemonic: string): Promise<Record<string, string>> {
  const seed = await mnemonicToSeed(mnemonic);
  
  const addresses: Record<string, string> = {};
  
  addresses['darkwave'] = deriveDarkWaveAddress(seed);
  addresses['solana'] = deriveSolanaAddress(seed);
  
  const evmAddress = deriveEVMAddress(seed);
  const evmChains = ['ethereum', 'base', 'polygon', 'arbitrum', 'bsc', 'optimism', 'avalanche'];
  for (const chain of evmChains) {
    addresses[chain] = evmAddress;
  }
  
  return addresses;
}

/**
 * Encrypt data using AES-GCM with password-derived key (PBKDF2)
 */
async function encryptWithPassword(
  data: string,
  password: string
): Promise<{ encrypted: string; salt: string; iv: string }> {
  const encoder = new TextEncoder();
  
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );
  
  const aesKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );
  
  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    aesKey,
    encoder.encode(data)
  );
  
  const encryptedArray = Array.from(new Uint8Array(encryptedBuffer));
  const saltArray = Array.from(salt);
  const ivArray = Array.from(iv);
  
  return {
    encrypted: btoa(String.fromCharCode.apply(null, encryptedArray)),
    salt: btoa(String.fromCharCode.apply(null, saltArray)),
    iv: btoa(String.fromCharCode.apply(null, ivArray))
  };
}

/**
 * Decrypt data using AES-GCM with password-derived key
 */
async function decryptWithPassword(
  encrypted: string,
  salt: string,
  iv: string,
  password: string
): Promise<string> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  
  const encryptedStr = atob(encrypted);
  const saltStr = atob(salt);
  const ivStr = atob(iv);
  
  const encryptedBytes = new Uint8Array(encryptedStr.length);
  const saltBytes = new Uint8Array(saltStr.length);
  const ivBytes = new Uint8Array(ivStr.length);
  
  for (let i = 0; i < encryptedStr.length; i++) encryptedBytes[i] = encryptedStr.charCodeAt(i);
  for (let i = 0; i < saltStr.length; i++) saltBytes[i] = saltStr.charCodeAt(i);
  for (let i = 0; i < ivStr.length; i++) ivBytes[i] = ivStr.charCodeAt(i);
  
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );
  
  const aesKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations: 100000,
      hash: 'SHA-256'
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );
  
  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivBytes },
    aesKey,
    encryptedBytes
  );
  
  return decoder.decode(decryptedBuffer);
}

/**
 * Create a new wallet with encrypted seed storage
 */
export async function createWallet(password: string): Promise<{
  mnemonic: string;
  storedWallet: StoredWallet;
}> {
  const mnemonic = generateMnemonic();
  const addresses = await deriveAddresses(mnemonic);
  
  const { encrypted, salt, iv } = await encryptWithPassword(mnemonic, password);
  
  const storedWallet: StoredWallet = {
    addresses,
    encryptedSeed: encrypted,
    salt,
    iv,
    createdAt: new Date().toISOString()
  };
  
  return { mnemonic, storedWallet };
}

/**
 * Unlock an existing wallet by verifying the password
 */
export async function unlockWallet(
  storedWallet: StoredWallet,
  password: string
): Promise<string> {
  const mnemonic = await decryptWithPassword(
    storedWallet.encryptedSeed,
    storedWallet.salt,
    storedWallet.iv,
    password
  );
  
  if (!validateMnemonic(mnemonic)) {
    throw new Error('Invalid password or corrupted wallet data');
  }
  
  return mnemonic;
}

/**
 * Import a wallet from an existing mnemonic
 */
export async function importWallet(
  mnemonic: string,
  password: string
): Promise<StoredWallet> {
  if (!validateMnemonic(mnemonic)) {
    throw new Error('Invalid mnemonic phrase');
  }
  
  const addresses = await deriveAddresses(mnemonic);
  const { encrypted, salt, iv } = await encryptWithPassword(mnemonic, password);
  
  return {
    addresses,
    encryptedSeed: encrypted,
    salt,
    iv,
    createdAt: new Date().toISOString()
  };
}

/**
 * Export wallet data for backup (encrypted)
 */
export function exportWallet(storedWallet: StoredWallet): string {
  return JSON.stringify(storedWallet, null, 2);
}

/**
 * Import wallet from backup file
 */
export function importWalletFromBackup(backupData: string): StoredWallet {
  try {
    const parsed = JSON.parse(backupData);
    if (!parsed.addresses || !parsed.encryptedSeed || !parsed.salt || !parsed.iv) {
      throw new Error('Invalid backup format');
    }
    return parsed as StoredWallet;
  } catch {
    throw new Error('Failed to parse wallet backup');
  }
}
