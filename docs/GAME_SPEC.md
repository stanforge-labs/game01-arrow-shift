# Arrow Shift — game spec

Arrow Shift is a calm, mobile-first grid puzzle. Tap an arrow only when its entire path to the board edge is clear. It exits the board; a blocked arrow gives a brief tactile shake.

Every successful exit triggers **SHIFT** after the exit animation: an exited left/right arrow rotates the remaining arrows in its original row 90° clockwise; an exited up/down arrow does the same for its original column. The removed arrow never rotates.

A level is complete when no arrows remain. If arrows remain and none can exit, it is a dead end. The MVP contains ten solver-validated levels, local progress, Russian and English UI, and no SDK, ads, shop or backend.
