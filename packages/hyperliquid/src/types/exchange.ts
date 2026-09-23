export interface BuilderFeeApprovalAction {
  type: "approveBuilderFee";
  builder: string;
  maxFeeRate: number;
}

export interface BuilderFeeRequest {
  type: "maxBuilderFee";
  user: string;
  builder: string;
}

export interface MaxBuilderFeeResponse {
  maxFeeRate: number;
}

export interface ExchangeOrderAction {
  type: "order";
  orders: unknown[];
  grouping: "na";
  builder?: {
    b: string;
    f: number;
  };
}

export interface ExchangeActionRequest {
  action: unknown;
  nonce: number;
  signature: unknown;
  vaultAddress?: string;
  expiresAfter?: number;
}

export interface ExchangeResponse {
  status: string;
  response?: unknown;
}
