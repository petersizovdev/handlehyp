import { describe, expect, it } from "vitest";
import { ExecutionStateMachine } from "../../domain/execution-state-machine.js";

describe("ExecutionStateMachine", () => {
  it("starts in the pending state", () => {
    const sm = new ExecutionStateMachine();

    expect(sm.current).toBe("pending");
    expect(sm.isTerminal).toBe(false);
  });

  it("accepts a custom initial state", () => {
    const sm = new ExecutionStateMachine("monitoring");

    expect(sm.current).toBe("monitoring");
  });

  it("transitions pending to maker_attempt to monitoring", () => {
    const sm = new ExecutionStateMachine();

    sm.transition("attempt_maker");

    expect(sm.current).toBe("maker_attempt");

    sm.transition("order_accepted");

    expect(sm.current).toBe("monitoring");
  });

  it("transitions monitoring to fully_filled to filled_maker", () => {
    const sm = new ExecutionStateMachine();

    sm.transition("attempt_maker");
    sm.transition("order_accepted");
    sm.transition("fully_filled");

    expect(sm.current).toBe("filled_maker");
    expect(sm.isTerminal).toBe(true);
  });

  it("transitions monitoring to partially_filled", () => {
    const sm = new ExecutionStateMachine();

    sm.transition("attempt_maker");
    sm.transition("order_accepted");
    sm.transition("partially_filled");

    expect(sm.current).toBe("partially_filled");
    expect(sm.isTerminal).toBe(false);
  });

  it("transitions timeout to fallback_attempt to filled_taker", () => {
    const sm = new ExecutionStateMachine();

    sm.transition("attempt_maker");
    sm.transition("order_accepted");
    sm.transition("timeout");

    expect(sm.current).toBe("timeout");

    sm.transition("attempt_fallback");
    sm.transition("fallback_filled");

    expect(sm.current).toBe("filled_taker");
    expect(sm.isTerminal).toBe(true);
  });

  it("transitions filled_maker to completed", () => {
    const sm = new ExecutionStateMachine("filled_maker");

    sm.transition("complete");

    expect(sm.current).toBe("completed");
    expect(sm.isTerminal).toBe(true);
  });

  it("transitions filled_taker to completed", () => {
    const sm = new ExecutionStateMachine("filled_taker");

    sm.transition("complete");

    expect(sm.current).toBe("completed");
    expect(sm.isTerminal).toBe(true);
  });

  it("allows attempt_maker from partially_filled", () => {
    const sm = new ExecutionStateMachine("partially_filled");

    sm.transition("attempt_maker");

    expect(sm.current).toBe("maker_attempt");
  });

  it("marks completed as terminal", () => {
    const sm = new ExecutionStateMachine("completed");

    expect(sm.isTerminal).toBe(true);
  });

  it("throws on invalid transition", () => {
    const sm = new ExecutionStateMachine();

    expect(() => sm.transition("fully_filled")).toThrow(
      "Invalid transition",
    );
  });

  it("does not allow events in terminal states", () => {
    const sm = new ExecutionStateMachine("filled_maker");

    expect(() => sm.transition("attempt_fallback")).toThrow(
      "Invalid transition",
    );
  });

  it("allows cancel from non-terminal states", () => {
    const sm = new ExecutionStateMachine();

    sm.transition("attempt_maker");
    sm.transition("cancel");

    expect(sm.current).toBe("cancelled");
    expect(sm.isTerminal).toBe(true);
  });
});
