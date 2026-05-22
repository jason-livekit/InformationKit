/**
 * Compact, URL-safe id generation. Crypto-strong randomness if available, fallback to Math.random.
 */
function randomBytesHex(count: number): string {
  const c = globalThis.crypto;
  if (c && typeof c.getRandomValues === 'function') {
    const arr = new Uint8Array(count);
    c.getRandomValues(arr);
    return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
  }
  let out = '';
  for (let i = 0; i < count; i++) {
    out += Math.floor(Math.random() * 256)
      .toString(16)
      .padStart(2, '0');
  }
  return out;
}

export function makeId(prefix: string): string {
  return `${prefix}${Date.now().toString(36)}_${randomBytesHex(4)}`;
}

const SLUG_ALPHABET = 'abcdefghijkmnopqrstuvwxyz23456789';

export function makeSlug(words = 3): string {
  const c = globalThis.crypto;
  const len = words * 4;
  let out = '';
  if (c && typeof c.getRandomValues === 'function') {
    const arr = new Uint8Array(len);
    c.getRandomValues(arr);
    for (let i = 0; i < len; i++) {
      out += SLUG_ALPHABET[arr[i]! % SLUG_ALPHABET.length];
      if ((i + 1) % 4 === 0 && i !== len - 1) out += '-';
    }
  } else {
    for (let i = 0; i < len; i++) {
      out += SLUG_ALPHABET[Math.floor(Math.random() * SLUG_ALPHABET.length)];
      if ((i + 1) % 4 === 0 && i !== len - 1) out += '-';
    }
  }
  return out;
}
