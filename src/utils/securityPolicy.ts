import type { SecurityPolicy } from '@/types';

const DEFAULT_SECURITY_POLICY: SecurityPolicy = {
  allowLegacyCustomScript: false,
  trustedScriptHashes: [],
  allowLegacyWsQueryAuth: false
};

let runtimeSecurityPolicy: SecurityPolicy = { ...DEFAULT_SECURITY_POLICY };

const normalizeHash = (hash: string) => hash.trim().toLowerCase();

const isHexHash = (hash: string) => /^[a-f0-9]{64}$/.test(hash);

export class SecurityPolicyError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'SecurityPolicyError';
    this.code = code;
  }
}

export const isSecurityPolicyError = (error: unknown): error is SecurityPolicyError => {
  return error instanceof SecurityPolicyError
    || (typeof error === 'object' && error !== null && (error as { name?: string }).name === 'SecurityPolicyError');
};

export const setSecurityPolicy = (policy: Partial<SecurityPolicy>) => {
  if (!policy || typeof policy !== 'object') return;

  const trustedScriptHashes = Array.isArray(policy.trustedScriptHashes)
    ? policy.trustedScriptHashes.map(normalizeHash).filter(isHexHash)
    : runtimeSecurityPolicy.trustedScriptHashes;

  runtimeSecurityPolicy = {
    allowLegacyCustomScript: policy.allowLegacyCustomScript ?? runtimeSecurityPolicy.allowLegacyCustomScript,
    trustedScriptHashes,
    allowLegacyWsQueryAuth: policy.allowLegacyWsQueryAuth ?? runtimeSecurityPolicy.allowLegacyWsQueryAuth
  };
};

export const getSecurityPolicy = (): SecurityPolicy => ({
  allowLegacyCustomScript: runtimeSecurityPolicy.allowLegacyCustomScript,
  trustedScriptHashes: [...runtimeSecurityPolicy.trustedScriptHashes],
  allowLegacyWsQueryAuth: runtimeSecurityPolicy.allowLegacyWsQueryAuth
});

// Minimal synchronous SHA-256 implementation for runtime allowlist checks.
// Based on the standard SHA-256 transform (32-bit operations, big-endian words).
export const sha256Hex = (input: string): string => {
  const rightRotate = (value: number, amount: number) => (value >>> amount) | (value << (32 - amount));
  const encoder = new TextEncoder();
  const bytes = Array.from(encoder.encode(input));
  const bitLength = bytes.length * 8;

  bytes.push(0x80);
  while ((bytes.length % 64) !== 56) bytes.push(0);

  const highBits = Math.floor(bitLength / 0x100000000);
  const lowBits = bitLength >>> 0;

  for (let i = 3; i >= 0; i -= 1) bytes.push((highBits >>> (i * 8)) & 0xff);
  for (let i = 3; i >= 0; i -= 1) bytes.push((lowBits >>> (i * 8)) & 0xff);

  const words: number[] = [];
  for (let i = 0; i < bytes.length; i += 4) {
    words.push((bytes[i] << 24) | (bytes[i + 1] << 16) | (bytes[i + 2] << 8) | bytes[i + 3]);
  }

  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  let h0 = 0x6a09e667;
  let h1 = 0xbb67ae85;
  let h2 = 0x3c6ef372;
  let h3 = 0xa54ff53a;
  let h4 = 0x510e527f;
  let h5 = 0x9b05688c;
  let h6 = 0x1f83d9ab;
  let h7 = 0x5be0cd19;

  const w = new Array<number>(64);
  for (let i = 0; i < words.length; i += 16) {
    for (let t = 0; t < 16; t += 1) w[t] = words[i + t] >>> 0;
    for (let t = 16; t < 64; t += 1) {
      const s0 = rightRotate(w[t - 15], 7) ^ rightRotate(w[t - 15], 18) ^ (w[t - 15] >>> 3);
      const s1 = rightRotate(w[t - 2], 17) ^ rightRotate(w[t - 2], 19) ^ (w[t - 2] >>> 10);
      w[t] = (((w[t - 16] + s0) >>> 0) + ((w[t - 7] + s1) >>> 0)) >>> 0;
    }

    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;
    let f = h5;
    let g = h6;
    let h = h7;

    for (let t = 0; t < 64; t += 1) {
      const s1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = ((((h + s1) >>> 0) + ((ch + k[t]) >>> 0)) >>> 0) + w[t];
      const s0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (s0 + maj) >>> 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }

    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
    h5 = (h5 + f) >>> 0;
    h6 = (h6 + g) >>> 0;
    h7 = (h7 + h) >>> 0;
  }

  const toHex = (n: number) => n.toString(16).padStart(8, '0');
  return `${toHex(h0)}${toHex(h1)}${toHex(h2)}${toHex(h3)}${toHex(h4)}${toHex(h5)}${toHex(h6)}${toHex(h7)}`;
};

export const isLegacyCustomScriptAllowed = (script: string) => {
  const policy = getSecurityPolicy();
  if (!policy.allowLegacyCustomScript) return false;
  const hash = sha256Hex(script);
  return policy.trustedScriptHashes.includes(hash);
};

export const isLoopbackHost = (host: string) => {
  const normalized = host.trim().toLowerCase();
  return normalized === 'localhost' || normalized === '127.0.0.1' || normalized === '::1' || normalized === '[::1]';
};

export const isSecureWsRequired = (url: string) => {
  try {
    const parsed = new URL(url);
    return !isLoopbackHost(parsed.hostname);
  } catch {
    return true;
  }
};

export const assertSecureRemoteWsUrl = (url: string) => {
  if (!isSecureWsRequired(url)) return;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'wss:') {
      throw new SecurityPolicyError('REMOTE_WSS_REQUIRED', 'Remote WebSocket must use wss:// for non-localhost targets');
    }
  } catch (error) {
    if (isSecurityPolicyError(error)) throw error;
    throw new SecurityPolicyError('REMOTE_WS_URL_INVALID', 'Remote WebSocket URL is invalid');
  }
};
