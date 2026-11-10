import nacl from "tweetnacl";
import bs58 from "bs58";

export interface KeypairInfo {
  accountId: string;
  publicKey: string;
  secretKeyBase58: string;
}

/**
 * Parses a NEAR secret key string (supports "ed25519:<base58>" or raw "<base58>")
 * Returns a 64-byte secret key Uint8Array (seed + public key) or 32-byte seed.
 */
export function parseNearPrivateKey(secretKeyStr: string): nacl.SignKeyPair {
  const cleaned = secretKeyStr.trim().replace(/^ed25519:/i, "");
  const decoded = bs58.decode(cleaned);

  if (decoded.length === 64) {
    return nacl.sign.keyPair.fromSecretKey(decoded);
  } else if (decoded.length === 32) {
    return nacl.sign.keyPair.fromSeed(decoded);
  } else {
    throw new Error(
      `Invalid private key length (${decoded.length} bytes). Expected 32 or 64 bytes.`
    );
  }
}

/**
 * Signs an arbitrary UTF-8 challenge message with an Ed25519 secret key.
 * Returns Base64 encoded 64-byte signature and the "ed25519:<base58>" public key.
 */
export function signChallengeLocally(
  message: string,
  secretKeyStr: string
): { signatureBase64: string; publicKey: string } {
  const keyPair = parseNearPrivateKey(secretKeyStr);
  const messageBytes = new TextEncoder().encode(message);
  
  // Detached 64-byte Ed25519 signature
  const signatureBytes = nacl.sign.detached(messageBytes, keyPair.secretKey);
  
  // Base64 string for transmission
  let binary = "";
  for (let i = 0; i < signatureBytes.length; i++) {
    binary += String.fromCharCode(signatureBytes[i]);
  }
  const signatureBase64 = btoa(binary);

  // NEAR public key format: ed25519:<base58>
  const publicKey = "ed25519:" + bs58.encode(keyPair.publicKey);

  return {
    signatureBase64,
    publicKey,
  };
}

/**
 * Generates a fresh ephemeral Ed25519 keypair in browser memory
 */
export function generateEphemeralKeypair(): {
  publicKey: string;
  secretKey: string;
} {
  const kp = nacl.sign.keyPair();
  return {
    publicKey: "ed25519:" + bs58.encode(kp.publicKey),
    secretKey: "ed25519:" + bs58.encode(kp.secretKey),
  };
}
