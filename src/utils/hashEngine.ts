/**
 * Generates a SHA-256 hash of the student's data for tamper-proof verification.
 */
export async function generateSecurityHash(data: object): Promise<string> {
  const msgUint8 = new TextEncoder().encode(JSON.stringify(data));
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Verifies if the provided data matches the given hash.
 */
export async function verifySecurityHash(data: object, hash: string): Promise<boolean> {
  const generatedHash = await generateSecurityHash(data);
  return generatedHash === hash;
}
