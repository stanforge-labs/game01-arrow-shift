# Arrow Shift — game spec

Arrow Shift is a calm, mobile-first grid puzzle. Tap an arrow only when its entire path to the board edge is clear. It exits the board; a blocked arrow gives a brief tactile shake.

Every successful exit triggers **SHIFT** after the exit animation: an exited left/right arrow rotates the remaining arrows in its original row 90° clockwise; an exited up/down arrow does the same for its original column. The removed arrow never rotates.

From level 10 the set also introduces **Pinned Arrows**. A pinned arrow occupies a normal cell, blocks paths, and can exit when its path is clear. Once it exits it is removed like any other arrow. SHIFT still passes through its row or column, but a pinned arrow keeps its current direction while regular arrows on that line rotate normally.

From level 20 the set adds **Barriers**. A barrier occupies a cell, has no direction, cannot be clicked or removed, and blocks an arrow's physical path. SHIFT passes through barrier cells unchanged: regular arrows still rotate, pinned arrows still hold, and barriers remain fixed. Victory still depends only on `arrows.length === 0`, so barriers may remain on a completed board.

A level is complete when no arrows remain. If arrows remain and none can exit, it is a dead end. The first playable set contains thirty solver-validated levels, local progress, Russian and English UI, and no SDK, ads, shop or backend.

The product shell uses three in-app screens: Home, Levels and Game. Home offers Play/Continue, level selection, language and sound controls. Levels shows completed, unlocked and locked level tokens; in development all levels are selectable. Production progress stores the highest unlocked level and the last played level without saving an unfinished puzzle state. Web Audio provides short procedural tactile SFX and can be disabled in settings.

Route's first two levels show compact Start/Target labels as onboarding; later levels rely on the plated symbols. Rush shows a brief `+4s` clear bonus beside the timer, and each mode uses a restrained procedural background pattern.

Gameplay result states share one ResultCard flow: a solid card centered over the board, a readable title, then full-width primary and secondary actions. Utility navigation uses the same custom SVG controls on every screen.

Route has twelve manual directional-path boards. Each has one edge or board-cell Start with an initial direction, arrow cells that take over the signal's exit direction when entered, and a full-cell Target. The player rotates regular arrows clockwise before Run; the signal moves cell by cell from Start and succeeds only when its next move enters Target. Empty cells, barriers, out-of-board movement and repeated `(row, col, direction)` states fail the route. Pinned arrows keep their direction and cannot rotate. Rush uses twenty-four validated Puzzle templates in a sixty-second session: exits score points, clearing a board adds time and a clear bonus, and blocked taps reset the combo. Both modes are local-only and do not change Puzzle rules.
