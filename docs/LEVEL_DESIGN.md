# Level design

All shipped levels live in `src/game/levels.js`, carry a short `designGoal`, and are validated by `npm run levels:report` plus the unit suite.

## Progression 1–30

- 1–3: one clear exit, then the first readable SHIFT.
- 4–6: horizontal/vertical line changes and short follow-up chains.
- 7–9: fuller regular-arrow problems where SHIFT and order matter before any new element appears.
- 10: first pinned arrow; the opening line makes the difference between a rotating regular arrow and a held pinned arrow visible.
- 11–14: short pinned-arrow exercises, alternating horizontal and vertical SHIFT and then using two fixed directions.
- 15–19: regular and pinned combinations with meaningful choices and two- to three-step planning.
- 20: first Barrier; one readable blocked path establishes that it is fixed board geometry, not a removable token.
- 21–23: Barrier-only planning, using one or two fixed cells so the new rule can be learned separately.
- 24–26: regular + pinned + Barrier combinations where a line must be opened before a held direction is useful.
- 27–30: final mixed problems with two to three Barriers, pinned holds and order-sensitive SHIFT sequences.

## Future level rules

- Use the smallest useful grid: 3×3, 4×4, 5×5, or 6×6.
- Give each level one clear design goal and make SHIFT matter after the onboarding set.
- Introduce pinned arrows once at level 10, then use them as a planning constraint rather than decoration.
- Keep pinned arrows explicit in definitions and verify that the solver encounters a held pinned arrow on the shipped solution.
- Introduce Barriers once at level 20; use one to four only when a fixed cell changes a meaningful path or order.
- Barriers must be outside arrow cells, never become moves, and must remain unchanged through SHIFT and victory.
- Prefer a readable dependency or meaningful choice over random occupancy.
- Avoid mirrored copies, consecutive near-duplicates, all-free openings, and levels that require blind guessing.
- Every level must start in `playing`, have at least one available move, and have a solver result before it is shipped.
