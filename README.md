# Arrow Shift

A small browser puzzle: clear arrows exit the grid; every exit shifts the directions in its row or column.

## Stack

Vite, vanilla JavaScript, HTML and CSS geometry. Vitest covers the DOM-free game model.

## Commands

```bash
npm install
npm run dev
npm test
npm run build
```

The development server prints its local URL (normally `http://localhost:5173`).

Levels are data in `src/game/levels.js`. Pure movement, SHIFT and solver logic are in `src/game/model.js`.
