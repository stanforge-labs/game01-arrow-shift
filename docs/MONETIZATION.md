# Arrow Shift monetization foundation

The current build contains only a conservative fullscreen-ad boundary for future platform testing.

- Puzzle: request only after the player presses **Next** from a victory result.
- Route: request only after the player presses **Next** from a completed route.
- Rush: request only after the player presses **Again** from a finished session.

Requests are gated by a 90-second gameplay session, at least two content completions, and a 120-second session cooldown. The ad wrapper owns `onOpen`/`onClose`/`onError`, pauses gameplay and audio through the shared pause-reason set, and always resolves so navigation cannot hang. Localhost uses a no-op fallback.

Rewarded video, purchases, forced authorization, leaderboards and any automatic ad at result time are intentionally not implemented.
