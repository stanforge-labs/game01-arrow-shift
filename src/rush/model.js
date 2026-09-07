export const RUSH_DURATION = 60;
export const RUSH_MAX_TIME = 75;

export function createRushSession() {
  return { timeLeft: RUSH_DURATION, score: 0, combo: 0, boards: 0, ended: false, templateIndex: -1 };
}

export function recordRushExit(session) {
  if (session.ended) return session;
  const multiplier = Math.min(session.combo + 1, 3);
  return { ...session, score: session.score + multiplier, combo: Math.min(session.combo + 1, 2) };
}

export function recordRushBlocked(session) { return session.ended ? session : { ...session, combo: 0 }; }

export function recordRushBoardClear(session) {
  if (session.ended) return session;
  return { ...session, score: session.score + 10, boards: session.boards + 1, timeLeft: Math.min(session.timeLeft + 4, RUSH_MAX_TIME), combo: 0 };
}

export function tickRush(session, seconds = 1) {
  if (session.ended) return session;
  const timeLeft = Math.max(0, session.timeLeft - Math.max(0, seconds));
  return { ...session, timeLeft, ended: timeLeft <= 0 };
}

export function finishRush(session) { return { ...session, timeLeft: 0, ended: true }; }
