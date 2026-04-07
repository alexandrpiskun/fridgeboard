# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server with HMR
npm run build     # Build for production (output: dist/)
npm run lint      # Run ESLint
npm run preview   # Preview production build locally
npm run deploy    # Build and deploy to GitHub Pages (gh-pages -d dist)
```

No test suite is configured.

## Architecture

This is a single-component React app. `main.jsx` renders `ScheduleTable` directly (the `App` component in `App.jsx` is unused).

**`src/schedule-table.jsx`** — the entire application. Key concepts:

- **Data model**: each row has `{ id, text, status, weeks[], span: {from, to}, cellStates }`. `cellStates` is keyed by day (`M`, `Tu`, etc.), and each day holds a `week` map keyed by week number: `{ [weekNum]: { state, color } }`.
- **Cell states**: cycle left-click through `none → selected → partial → filled`. Right-click cycles color (`black → red → green → blue`). Visual rendering uses inline styles via `getCellStyle()` and canvas-generated diagonal patterns for `partial`.
- **Week tracking**: weeks are ISO-style integers (1–52) derived from `getDateWeek()`. Navigation with `prevWeek`/`nextWeek` buttons.
- **Row visibility filter**: rows are shown if `currentWeek` is within `[span.from, span.to]`, or if the row is still active (`status === 'A'`) and was started before `currentWeek`.
- **Persistence**: all state saved/loaded from `localStorage` under key `schedule-table-data`.
- **Migration**: `migrate()` runs on load to upgrade older stored data shapes to the current schema.
- **Drag-and-drop**: HTML5 drag API for row reordering.

**Deployment**: Vite base is `/fridgeboard/` for GitHub Pages at `https://alexandrpiskun.github.io/fridgeboard`.
