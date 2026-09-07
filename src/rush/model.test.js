import { describe, expect, it } from 'vitest';
import { createRushSession, recordRushBlocked, recordRushBoardClear, recordRushExit, tickRush } from './model.js';

describe('rush session', () => {
  it('scores exits with a capped combo and resets on blocked input', () => {
    let session = createRushSession();
    session = recordRushExit(session); session = recordRushExit(session); session = recordRushExit(session);
    expect(session.score).toBe(6);
    expect(session.combo).toBe(2);
    expect(recordRushBlocked(session).combo).toBe(0);
  });

  it('adds time and board bonus without exceeding the cap', () => {
    const session = recordRushBoardClear({ ...createRushSession(), timeLeft: 74 });
    expect(session.timeLeft).toBe(75);
    expect(session.score).toBe(10);
    expect(session.boards).toBe(1);
  });

  it('ends cleanly when the timer reaches zero', () => {
    const session = tickRush(createRushSession(), 60);
    expect(session.ended).toBe(true);
    expect(session.timeLeft).toBe(0);
  });
});
