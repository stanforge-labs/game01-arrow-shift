export function createAdGate({ now = () => Date.now(), minSessionMs = 90_000, cooldownMs = 120_000, minCompletions = 2 } = {}) {
  let startedAt = null;
  let lastShownAt = -Infinity;
  let completions = 0;

  return {
    recordGameplayStart() { if (startedAt === null) startedAt = now(); },
    recordCompletion() { completions += 1; },
    canRequest() { return startedAt !== null && now() - startedAt >= minSessionMs && completions >= minCompletions && now() - lastShownAt >= cooldownMs; },
    recordShown() { lastShownAt = now(); completions = 0; },
    getState() { return { startedAt, lastShownAt, completions }; },
  };
}
