import { encode } from "@msgpack/msgpack";
import {
  concatHex,
  getAddress,
  keccak256,
  toHex,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

import type { ExchangeSigner } from "./exchange-signer.js";

const ZERO_ADDRESS =
  "0x0000000000000000000000000000000000000000" as const;

const L1_DOMAIN = {
  name: "Exchange",
  version: "1",
  chainId: 1337,
  verifyingContract: ZERO_ADDRESS,
} as const;

const L1_TYPES = {
  Agent: [
    { name: "source", type: "string" },
    { name: "connectionId", type: "bytes32" },
  ],
} as const;

export interface HyperliquidL1SignerOptions {
  privateKey: Hex;
  isMainnet?: boolean;
}

export interface HyperliquidSignature {
  r: Hex;
  s: Hex;
  v: number;
}

function addressToBytes(address: string): Hex {
  const normalized = getAddress(address);
  return `0x${normalized.slice(2).toLowerCase()}`;
}

function encodeActionHash(
  action: unknown,
  vaultAddress: string | undefined,
  nonce: number,
  expiresAfter: number | undefined,
): Hex {
  if (!Number.isSafeInteger(nonce) || nonce < 0) {
    throw new Error("Invalid Hyperliquid nonce");
  }

  const encodedAction = encode(action);
  const nonceBytes = toHex(BigInt(nonce), { size: 8 });

  const vaultBytes = vaultAddress
    ? concatHex([
        "0x01",
        addressToBytes(vaultAddress),
      ])
    : "0x00";

  const expiresBytes =
    expiresAfter === undefined
      ? "0x"
      : concatHex([
          "0x00",
          toHex(BigInt(expiresAfter), { size: 8 }),
        ]);

  const packed = concatHex([
    toHex(encodedAction),
    nonceBytes,
    vaultBytes,
    expiresBytes,
  ]);

  return keccak256(packed);
}

function splitSignature(signature: Hex): HyperliquidSignature {
  if (signature.length !== 132) {
    throw new Error("Invalid EIP-712 signature length");
  }

  const r = `0x${signature.slice(2, 66)}` as Hex;
  const s = `0x${signature.slice(66, 130)}` as Hex;
  const recovery = Number.parseInt(signature.slice(130, 132), 16);

  if (recovery !== 0 && recovery !== 1 && recovery !== 27 && recovery !== 28) {
    throw new Error("Invalid EIP-712 recovery value");
  }

  const v = recovery < 27 ? recovery + 27 : recovery;

  return { r, s, v };
}

export class HyperliquidL1Signer implements ExchangeSigner {
  private readonly account;
  private readonly isMainnet: boolean;

  constructor(options: HyperliquidL1SignerOptions) {
    this.account = privateKeyToAccount(options.privateKey);
    this.isMainnet = options.isMainnet ?? true;
  }

  getAddress(): string {
    return this.account.address;
  }

  async signExchangeAction(
    action: unknown,
    nonce: number,
  ): Promise<HyperliquidSignature> {
    return this.signL1Action(action, nonce);
  }

  async signL1Action(
    action: unknown,
    nonce: number,
    vaultAddress?: string,
    expiresAfter?: number,
  ): Promise<HyperliquidSignature> {
    const connectionId = encodeActionHash(
      action,
      vaultAddress,
      nonce,
      expiresAfter,
    );

    const phantomAgent = {
      source: this.isMainnet ? "a" : "b",
      connectionId,
    };

    const signature = await this.account.signTypedData({
      domain: L1_DOMAIN,
      types: L1_TYPES,
      primaryType: "Agent",
      message: phantomAgent,
    });

    return splitSignature(signature);
  }
}
