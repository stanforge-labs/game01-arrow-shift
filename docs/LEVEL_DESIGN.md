# Level design

All shipped levels live in `src/game/levels.js`, carry a short `designGoal`, and are validated by `npm run levels:report` plus the unit suite.

## Progression 1–30

- 1–3: one clear exit, then the first readable SHIFT.
- 4–6: horizontal/vertical line changes and short follow-up chains.
- 7–10: compact dependent sequences; the player starts planning one or two moves ahead.
- 11–15: two or three possible starts, with the first intentional dead-end choice at 15.
- 16–20: denser 5×5 layouts with intersecting rows and columns.
- 21–25: compact 5×5/6×6 planning problems with multiple SHIFT directions.
- 26–30: the densest 5×5/6×6 layouts; longer plans, but still solvable without brute-force guessing.

## Future level rules

- Use the smallest useful grid: 3×3, 4×4, 5×5, or 6×6.
- Give each level one clear design goal and make SHIFT matter after the onboarding set.
- Prefer a readable dependency or meaningful choice over random occupancy.
- Avoid mirrored copies, consecutive near-duplicates, all-free openings, and levels that require blind guessing.
- Every level must start in `playing`, have at least one available move, and have a solver result before it is shipped.
