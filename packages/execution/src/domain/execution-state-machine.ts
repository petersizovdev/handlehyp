import type { ExecutionState } from "./execution-types.js";

export type ExecutionEvent =
  | "attempt_maker"
  | "order_accepted"
  | "partially_filled"
  | "fully_filled"
  | "timeout"
  | "attempt_fallback"
  | "fallback_filled"
  | "fallback_partial"
  | "complete"
  | "cancel"
  | "fail";

const TRANSITIONS: Record<
  ExecutionState,
  Record<ExecutionEvent, ExecutionState | null>
> = {
  pending: {
    attempt_maker: "maker_attempt",
    order_accepted: null,
    partially_filled: null,
    fully_filled: null,
    timeout: null,
    attempt_fallback: null,
    fallback_filled: null,
    fallback_partial: null,
    complete: null,
    cancel: "cancelled",
    fail: "failed",
  },
  maker_attempt: {
    attempt_maker: null,
    order_accepted: "monitoring",
    partially_filled: "partially_filled",
    fully_filled: "filled_maker",
    timeout: null,
    attempt_fallback: null,
    fallback_filled: null,
    fallback_partial: null,
    complete: null,
    cancel: "cancelled",
    fail: "failed",
  },
  monitoring: {
    attempt_maker: null,
    order_accepted: null,
    partially_filled: "partially_filled",
    fully_filled: "filled_maker",
    timeout: "timeout",
    attempt_fallback: null,
    fallback_filled: null,
    fallback_partial: null,
    complete: null,
    cancel: "cancelled",
    fail: "failed",
  },
  partially_filled: {
    attempt_maker: "maker_attempt",
    order_accepted: null,
    partially_filled: null,
    fully_filled: "filled_maker",
    timeout: "timeout",
    attempt_fallback: null,
    fallback_filled: null,
    fallback_partial: null,
    complete: null,
    cancel: "cancelled",
    fail: "failed",
  },
  filled_maker: {
    attempt_maker: null,
    order_accepted: null,
    partially_filled: null,
    fully_filled: null,
    timeout: null,
    attempt_fallback: null,
    fallback_filled: null,
    fallback_partial: null,
    complete: "completed",
    cancel: null,
    fail: null,
  },
  timeout: {
    attempt_maker: null,
    order_accepted: null,
    partially_filled: null,
    fully_filled: null,
    timeout: null,
    attempt_fallback: "fallback_attempt",
    fallback_filled: null,
    fallback_partial: null,
    complete: null,
    cancel: "cancelled",
    fail: "failed",
  },
  fallback_attempt: {
    attempt_maker: null,
    order_accepted: null,
    partially_filled: null,
    fully_filled: null,
    timeout: null,
    attempt_fallback: null,
    fallback_filled: "filled_taker",
    fallback_partial: "filled_taker",
    complete: null,
    cancel: "cancelled",
    fail: "failed",
  },
  filled_taker: {
    attempt_maker: null,
    order_accepted: null,
    partially_filled: null,
    fully_filled: null,
    timeout: null,
    attempt_fallback: null,
    fallback_filled: null,
    fallback_partial: null,
    complete: "completed",
    cancel: null,
    fail: null,
  },
  completed: {
    attempt_maker: null,
    order_accepted: null,
    partially_filled: null,
    fully_filled: null,
    timeout: null,
    attempt_fallback: null,
    fallback_filled: null,
    fallback_partial: null,
    complete: null,
    cancel: null,
    fail: null,
  },
  cancelled: {
    attempt_maker: null,
    order_accepted: null,
    partially_filled: null,
    fully_filled: null,
    timeout: null,
    attempt_fallback: null,
    fallback_filled: null,
    fallback_partial: null,
    complete: null,
    cancel: null,
    fail: null,
  },
  failed: {
    attempt_maker: null,
    order_accepted: null,
    partially_filled: null,
    fully_filled: null,
    timeout: null,
    attempt_fallback: null,
    fallback_filled: null,
    fallback_partial: null,
    complete: null,
    cancel: null,
    fail: null,
  },
};

const TERMINAL_STATES: Set<ExecutionState> = new Set([
  "filled_maker",
  "filled_taker",
  "completed",
  "cancelled",
  "failed",
]);

export class ExecutionStateMachine {
  private state: ExecutionState;

  constructor(
    state: ExecutionState = "pending",
  ) {
    this.state = state;
  }

  get current(): ExecutionState {
    return this.state;
  }

  get isTerminal(): boolean {
    return TERMINAL_STATES.has(this.state);
  }

  transition(
    event: ExecutionEvent,
  ): ExecutionState {
    const nextState =
      TRANSITIONS[this.state][event];

    if (nextState === null) {
      throw new Error(
        `Invalid transition from ${this.state} on ${event}`,
      );
    }

    this.state = nextState;
    return this.state;
  }
}
