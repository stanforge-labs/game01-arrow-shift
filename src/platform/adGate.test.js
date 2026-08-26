import { describe, expect, it } from 'vitest';
import { createAdGate } from './adGate.js';

describe('fullscreen ad session gate', () => {
  it('requires elapsed gameplay and two completions', () => {
    let clock = 0;
    const gate = createAdGate({ now: () => clock, minSessionMs: 90, cooldownMs: 120, minCompletions: 2 });
    gate.recordGameplayStart();
    gate.recordCompletion(); clock = 100;
    expect(gate.canRequest()).toBe(false);
    gate.recordCompletion();
    expect(gate.canRequest()).toBe(true);
  });

  it('enforces cooldown after a shown ad', () => {
    let clock = 100;
    const gate = createAdGate({ now: () => clock, minSessionMs: 0, cooldownMs: 120, minCompletions: 0 });
    gate.recordGameplayStart();
    expect(gate.canRequest()).toBe(true);
    gate.recordShown();
    expect(gate.canRequest()).toBe(false);
    clock = 220;
    expect(gate.canRequest()).toBe(true);
  });
});
