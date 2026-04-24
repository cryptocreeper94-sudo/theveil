import { Buffer } from 'buffer';

if (typeof globalThis.Buffer === 'undefined') {
  (globalThis as any).Buffer = Buffer;
}

if (typeof globalThis.process === 'undefined') {
  (globalThis as any).process = { env: {} };
}

if (typeof window !== 'undefined') {
  (window as any).Buffer = Buffer;
  if (!(window as any).process) {
    (window as any).process = { env: {} };
  }
}

export const polyfillsReady = true;
