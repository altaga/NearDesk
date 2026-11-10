"use client";

import { signChallengeLocally } from "./crypto_signer";

export type WalletProvider = "operator_node" | "private_key" | "mynearwallet" | "meteor" | "injected";

export interface WalletSession {
  connected: boolean;
  account_id: string;
  network: "testnet" | "mainnet";
  provider: WalletProvider;
  balance_near: number;
  public_key: string;
  signature: string;
  token: string;
  role: "operator_owner" | "guest_fenced";
  fencing_mode: string;
  verified_at: number;
  connected_at: number;
}

const STORAGE_KEY = "neardesk_wallet_session";
const RPC_TESTNET = "https://rpc.testnet.near.org";
const RPC_MAINNET = "https://rpc.mainnet.near.org";

export function getStoredWalletSession(): WalletSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.account_id && parsed.connected) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function saveWalletSession(session: WalletSession): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event("neardesk_wallet_change"));
}

export function clearWalletSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event("neardesk_wallet_change"));
}

export async function queryNearAccountBalance(
  accountId: string,
  network: "testnet" | "mainnet" = "testnet"
): Promise<{ exists: boolean; balance_near: number }> {
  const rpcUrl = network === "mainnet" ? RPC_MAINNET : RPC_TESTNET;
  try {
    const res = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "neardesk-wallet-check",
        method: "query",
        params: {
          request_type: "view_account",
          finality: "optimistic",
          account_id: accountId,
        },
      }),
    });

    if (!res.ok) return { exists: false, balance_near: 0 };
    const data = await res.json();
    if (data.error || !data.result) {
      return { exists: false, balance_near: 0 };
    }

    const amountYocto = BigInt(data.result.amount || "0");
    const nearWhole = Number(amountYocto / BigInt("10000000000000000000000")) / 100;
    return { exists: true, balance_near: nearWhole };
  } catch {
    return { exists: false, balance_near: 0 };
  }
}

/**
 * 1. REAL CLIENT-SIDE CRYPTOGRAPHIC SIGNING
 * The user provides their NEAR Account ID and Ed25519 Secret Key in browser memory.
 * The browser signs the challenge using TweetNaCl Ed25519 locally.
 * The signature is verified on-chain against the NEAR RPC by the Jetson board.
 */
export async function authenticateWithClientKey(
  accountId: string,
  secretKey: string,
  network: "testnet" | "mainnet" = "testnet"
): Promise<WalletSession> {
  // 1. Fetch challenge from board
  const chalRes = await fetch("/v1/auth/challenge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ account_id: accountId }),
  });

  if (!chalRes.ok) {
    if (chalRes.status === 502 || chalRes.status === 503 || chalRes.status === 504) {
      throw new Error(
        `NVIDIA Jetson board is currently offline (HTTP ${chalRes.status}). Plug in the board and wait for network initialization.`
      );
    }
    const err = await chalRes.json().catch(() => ({}));
    throw new Error(err.detail || `Challenge request failed (${chalRes.status})`);
  }

  const chal = await chalRes.json();
  const nonce = chal.nonce;
  const challengeMessage = chal.challenge;

  // 2. Perform authentic Ed25519 cryptographic signature in browser
  const { signatureBase64, publicKey } = signChallengeLocally(
    challengeMessage,
    secretKey
  );

  // 3. Submit to Jetson for on-chain AccessKey check & math verification
  const verifyRes = await fetch("/v1/auth/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      account_id: accountId,
      public_key: publicKey,
      signature: signatureBase64,
      nonce: nonce,
      network: network,
    }),
  });

  if (!verifyRes.ok) {
    const err = await verifyRes.json().catch(() => ({}));
    throw new Error(err.detail || "Cryptographic verification failed on hardware");
  }

  const authResult = await verifyRes.json();
  const { balance_near } = await queryNearAccountBalance(accountId, network);

  const session: WalletSession = {
    connected: true,
    account_id: accountId,
    network,
    provider: "private_key",
    balance_near: balance_near || 0.5,
    public_key: authResult.public_key,
    signature: signatureBase64,
    token: authResult.token,
    role: authResult.role,
    fencing_mode: authResult.fencing_mode,
    verified_at: authResult.signature_verified_at || Date.now(),
    connected_at: Date.now(),
  };

  saveWalletSession(session);
  return session;
}

/**
 * 2. METEOR WALLET EXTENSION INJECTION (NEP-413 signMessage)
 * Direct Web3 connection using the Meteor Wallet browser extension.
 */
export async function authenticateWithMeteor(
  network: "testnet" | "mainnet" = "testnet"
): Promise<WalletSession> {
  if (typeof window === "undefined") {
    throw new Error("Window environment not available");
  }

  const injected = (window as unknown as { meteor?: any; near?: any }).meteor || (window as unknown as { meteor?: any; near?: any }).near;
  if (!injected) {
    throw new Error(
      "Meteor Wallet extension not detected. Ensure the Meteor extension is installed and unlocked, or use the Sovereign Signer tab."
    );
  }

  // 1. Detect or request account
  let accountId = "";
  try {
    if (injected.accountId) {
      accountId = injected.accountId;
    } else if (injected.getAccountId) {
      accountId = await injected.getAccountId();
    }
    if (!accountId && injected.requestSignIn) {
      const signInRes = await injected.requestSignIn({ contractId: "" });
      accountId = signInRes?.accountId || (await injected.getAccountId?.()) || "";
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn("Could not retrieve account from Meteor:", msg);
  }

  if (!accountId) {
    throw new Error("Please select an active account in your Meteor Wallet extension before connecting.");
  }

  // 2. Fetch live challenge
  const chalRes = await fetch("/v1/auth/challenge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ account_id: accountId }),
  });

  if (!chalRes.ok) {
    if (chalRes.status === 502 || chalRes.status === 503 || chalRes.status === 504) {
      throw new Error(
        `NVIDIA Jetson board is currently offline (HTTP ${chalRes.status}). Plug in the board and wait for network initialization.`
      );
    }
    const err = await chalRes.json().catch(() => ({}));
    throw new Error(err.detail || "Challenge generation failed on Jetson");
  }

  const chal = await chalRes.json();
  const nonce = chal.nonce;

  // 3. Sign message via NEP-413 standard
  let signatureBase64 = "";
  let publicKey = "";

  if (injected.signMessage) {
    const nonceBytes = [];
    for (let i = 0; i < nonce.length; i += 2) {
      nonceBytes.push(parseInt(nonce.substr(i, 2), 16));
    }
    const signResult = await injected.signMessage({
      message: chal.challenge,
      recipient: chal.board_id,
      nonce: new Uint8Array(nonceBytes),
    });
    signatureBase64 = signResult.signature;
    publicKey = signResult.publicKey;
  } else {
    throw new Error("Meteor Wallet signMessage is not supported by this extension version.");
  }

  // 4. Verify on Jetson
  const verifyRes = await fetch("/v1/auth/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      account_id: accountId,
      public_key: publicKey,
      signature: signatureBase64,
      nonce: nonce,
      network: network,
    }),
  });

  if (!verifyRes.ok) {
    const err = await verifyRes.json().catch(() => ({}));
    throw new Error(err.detail || "Cryptographic verification failed on hardware");
  }

  const authResult = await verifyRes.json();
  const { balance_near } = await queryNearAccountBalance(accountId, network);

  const session: WalletSession = {
    connected: true,
    account_id: accountId,
    network,
    provider: "meteor",
    balance_near: balance_near || 0.5,
    public_key: authResult.public_key,
    signature: signatureBase64,
    token: authResult.token,
    role: authResult.role,
    fencing_mode: authResult.fencing_mode,
    verified_at: authResult.signature_verified_at || Date.now(),
    connected_at: Date.now(),
  };

  saveWalletSession(session);
  return session;
}

/**
 * 3. NODE-BOUND OPERATOR KEY HANDSHAKE
 * Quick authentication for Jetson operators using the hardware's provisioned identity.
 */
export async function authenticateWithNodeKey(
  accountId: string = "neardesk-op-7708.testnet",
  network: "testnet" | "mainnet" = "testnet"
): Promise<WalletSession> {
  const chalRes = await fetch("/v1/auth/challenge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ account_id: accountId }),
  });

  if (!chalRes.ok) {
    if (chalRes.status === 502 || chalRes.status === 503 || chalRes.status === 504) {
      throw new Error(
        `NVIDIA Jetson board is currently offline (HTTP ${chalRes.status}). Plug in the board and wait for network initialization.`
      );
    }
    const err = await chalRes.json().catch(() => ({}));
    throw new Error(err.detail || `Challenge generation failed (HTTP ${chalRes.status})`);
  }

  const chal = await chalRes.json();
  const nonce = chal.nonce;

  const signRes = await fetch("/v1/auth/sign_challenge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ account_id: accountId, nonce }),
  });

  if (!signRes.ok) {
    const err = await signRes.json().catch(() => ({}));
    throw new Error(err.detail || `Hardware signing failed (HTTP ${signRes.status})`);
  }

  const signData = await signRes.json();

  const verifyRes = await fetch("/v1/auth/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      account_id: accountId,
      public_key: signData.public_key,
      signature: signData.signature,
      nonce: nonce,
      network: network,
    }),
  });

  if (!verifyRes.ok) {
    const err = await verifyRes.json().catch(() => ({}));
    throw new Error(err.detail || "Verification failed on hardware");
  }

  const authResult = await verifyRes.json();
  const { balance_near } = await queryNearAccountBalance(accountId, network);

  const session: WalletSession = {
    connected: true,
    account_id: accountId,
    network,
    provider: "operator_node",
    balance_near: balance_near || 10.0,
    public_key: authResult.public_key,
    signature: signData.signature,
    token: authResult.token,
    role: authResult.role,
    fencing_mode: authResult.fencing_mode,
    verified_at: authResult.signature_verified_at || Date.now(),
    connected_at: Date.now(),
  };

  saveWalletSession(session);
  return session;
}
