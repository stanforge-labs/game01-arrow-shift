import { describe, expect, it, vi } from 'vitest';
import { BLOCKED_EVENTS, installInputProtection } from './inputProtection.js';

function fakeRoot() {
  const listeners = new Map();
  return {
    addEventListener(type, handler, options) { listeners.set(type, { handler, options }); },
    removeEventListener(type) { listeners.delete(type); },
    dispatch(type) { const event = { preventDefault: vi.fn() }; listeners.get(type)?.handler(event); return event; },
    listener(type) { return listeners.get(type); },
  };
}

describe('game input protection', () => {
  it('installs capture guards for browser interaction chrome', () => {
    const root = fakeRoot();
    const dispose = installInputProtection(root);
    for (const type of BLOCKED_EVENTS) {
      expect(root.listener(type)?.options).toEqual({ capture: true });
      expect(root.dispatch(type).preventDefault).toHaveBeenCalledTimes(1);
    }
    dispose();
    expect(root.listener('contextmenu')).toBeUndefined();
  });

  it('does not install a global touchstart blocker', () => {
    expect(BLOCKED_EVENTS).not.toContain('touchstart');
  });
});
