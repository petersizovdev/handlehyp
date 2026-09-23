export interface NonceProvider {
  next(): number;
}

export class TimestampNonceProvider implements NonceProvider {
  next(): number {
    const nonce = Date.now();

    if (!Number.isSafeInteger(nonce) || nonce <= 0) {
      throw new Error("Invalid generated exchange nonce");
    }

    return nonce;
  }
}
