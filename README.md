# Public Enemy: 1933 (working title)

The sequel to *Dead or Alive* (HeirsOfRuin/Wild-West). A bank robber in the
Midwest, May 1933 to December 1934, while the federal law learns faster than you
do. One turn a month.

Status: **playable on a phone.** All the screens, saves and save codes, the
family code from *Dead or Alive*, a single-file build and an offline web build.

- `docs/SPEC.md`: the one-page spec, with the checked dates.
- `docs/KILLGATE.md`: what the numbers prove and what is open.
- `docs/DESIGN.md`: the screens on paper, the systems, and the decisions log.
- `src/engine`: the pure engine (`act(state, action)`), seeded and deterministic.
- `src/data`: every tuning number and the map.
- `sim`: bot policies and the kill gate.

```
npm test               # engine contracts, and the forecasts against the outcomes
npm run killgate       # the kill gate (node sim/killgate.js 800 for the recorded numbers)
npm run build          # dist/public-enemy.html (one file), the embed, dist/site/ (offline)
npm run check-bundle   # the one file opens from file://; the site installs and works offline
npm run smoke          # whole games through the screens at 390 x 844
```

Play: open `dist/public-enemy.html` after `npm run build`, or `npm run serve` and
open http://localhost:8000.

Built with the Game Workshop process (HeirsOfRuin/Game-Workshop).
