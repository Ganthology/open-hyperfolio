/**
 * Validates if a string is a valid Ethereum address format
 */
export function isValidAddress(address: string): boolean {
  return typeof address === 'string' && address.startsWith('0x') && address.length >= 6;
}

/**
 * Ensures input is converted to an array format
 * Useful for handling API responses that may not always return arrays
 */
export function ensureArrayFromUnknown(input: unknown): unknown[] {
  if (Array.isArray(input)) return input;
  if (input && typeof input === 'object') {
    return Object.entries(input as Record<string, unknown>).map(([key, value]) => ({ key, value }));
  }
  return [] as unknown[];
}
