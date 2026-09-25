import type { ExchangeResponse } from "../types/exchange.js";

export interface BuilderFeeInfoPort {
  maxBuilderFee(
    user: string,
    builder: string,
  ): Promise<{ maxFeeRate: number }>;

  createBuilderFeeApprovalAction(
    builder: string,
    maxFeeRate: number,
  ): unknown;
}

export interface BuilderFeeExchangePort {
  execute(
    action: unknown,
    nonce: number,
  ): Promise<ExchangeResponse>;
}

export interface BuilderApprovalState {
  user: string;
  builder: string;
  maxFeeRate: number;
  approvedAt: number;
}

export interface BuilderApprovalStore {
  get(
    user: string,
    builder: string,
  ): BuilderApprovalState | undefined;

  set(state: BuilderApprovalState): void;
}

export class InMemoryBuilderApprovalStore
  implements BuilderApprovalStore
{
  private readonly states =
    new Map<string, BuilderApprovalState>();

  private key(
    user: string,
    builder: string,
  ): string {
    return `${user.toLowerCase()}:${builder.toLowerCase()}`;
  }

  get(
    user: string,
    builder: string,
  ): BuilderApprovalState | undefined {
    return this.states.get(
      this.key(user, builder),
    );
  }

  set(
    state: BuilderApprovalState,
  ): void {
    this.states.set(
      this.key(state.user, state.builder),
      state,
    );
  }
}

export interface BuilderFeeServiceOptions {
  info: BuilderFeeInfoPort;
  exchange: BuilderFeeExchangePort;
  store?: BuilderApprovalStore;
}

export class BuilderFeeService {
  private readonly info: BuilderFeeInfoPort;
  private readonly exchange: BuilderFeeExchangePort;
  private readonly store: BuilderApprovalStore;

  constructor(
    options: BuilderFeeServiceOptions,
  ) {
    this.info = options.info;
    this.exchange = options.exchange;
    this.store =
      options.store ??
      new InMemoryBuilderApprovalStore();
  }

  async getMaxBuilderFee(
    user: string,
    builder: string,
  ): Promise<number> {
    const response =
      await this.info.maxBuilderFee(
        user,
        builder,
      );

    if (
      !Number.isSafeInteger(
        response.maxFeeRate,
      ) ||
      response.maxFeeRate <= 0
    ) {
      throw new Error(
        "Hyperliquid returned an invalid max builder fee rate",
      );
    }

    return response.maxFeeRate;
  }

  async approveBuilderFee(
    user: string,
    builder: string,
    maxFeeRate: number,
    nonce: number,
  ): Promise<BuilderApprovalState> {
    this.validateFeeRate(maxFeeRate);

    const remoteMax =
      await this.getMaxBuilderFee(
        user,
        builder,
      );

    if (maxFeeRate > remoteMax) {
      throw new Error(
        `Builder fee rate ${maxFeeRate} exceeds Hyperliquid maximum ${remoteMax}`,
      );
    }

    const action =
      this.info.createBuilderFeeApprovalAction(
        builder,
        maxFeeRate,
      );

    await this.exchange.execute(
      action,
      nonce,
    );

    const state: BuilderApprovalState = {
      user,
      builder,
      maxFeeRate,
      approvedAt: Date.now(),
    };

    this.store.set(state);

    return state;
  }

  getApproval(
    user: string,
    builder: string,
  ): BuilderApprovalState | undefined {
    return this.store.get(
      user,
      builder,
    );
  }

  assertApproved(
    user: string,
    builder: string,
    feeRate: number,
  ): BuilderApprovalState {
    this.validateFeeRate(feeRate);

    const approval =
      this.store.get(
        user,
        builder,
      );

    if (approval === undefined) {
      throw new Error(
        "Builder fee is not approved for this account",
      );
    }

    if (
      approval.maxFeeRate <
      feeRate
    ) {
      throw new Error(
        `Builder fee rate ${feeRate} exceeds approved maximum ${approval.maxFeeRate}`,
      );
    }

    return approval;
  }

  private validateFeeRate(
    feeRate: number,
  ): void {
    if (
      !Number.isSafeInteger(
        feeRate,
      ) ||
      feeRate <= 0
    ) {
      throw new Error(
        "Builder fee rate must be a positive safe integer",
      );
    }
  }
}
