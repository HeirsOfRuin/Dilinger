# Public Enemy: 1933 (working title)

The sequel to *Dead or Alive* (HeirsOfRuin/Wild-West). A bank robber in the
Midwest, May 1933 to December 1934, while the federal law learns faster than you
do. One turn a month.

Status: **spec and kill gate done; no screens yet.**

- `docs/SPEC.md`: the one-page spec, with the checked dates.
- `docs/KILLGATE.md`: what the numbers prove and what is open.
- `src/engine`: the pure engine (`act(state, action)`), seeded and deterministic.
- `src/data`: every tuning number and the map.
- `sim`: bot policies and the kill gate.

```
npm test               # engine contracts
npm run killgate       # the kill gate, 400 seeds per policy
```

Built with the Game Workshop process (HeirsOfRuin/Game-Workshop).
