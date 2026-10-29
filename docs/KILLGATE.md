# Kill gate: results (2026-10-29)

Numbers only, before any screens. `node sim/killgate.js 400`: 400 seeds per
policy, the same seeds for every policy. A gap is REAL only when it is wider than
its noise floor (2 standard errors of the difference). The model is the engine's
first cut (`src/engine`), not a throwaway: the game will be built on it.

## The policies

| Policy | Plays |
|---|---|
| careful | best job in reach by take against risk; crosses a line when the numbers say so; lies low when the month's risk passes 10%; buys a new face, then disappears once it has $21,000 |
| nocross / alwayscross / coin | careful, but never / always / at random crosses the line after a job |
| greedy | careful, but stays for $15,000 more before leaving |
| stayer | careful, but never leaves |
| bold | careful, with guns out instead of a quiet job |
| timid | careful, but lies low at 6% risk |
| reckless | bold, never crosses, never lies low |
| nostpaul | careful, never uses the St. Paul arrangement |

## Claims and what the numbers say

### 1. The state line changes value by date: PASSED

Paired: every job a careful player chose, replayed from the same state with the
same dice, once crossing and once staying (10 replays each).

| Phase | Caught that night or month, stayed | Crossed | Gap | Floor |
|---|---|---|---|---|
| May 1933 to Feb 1934 (Bureau unarmed) | 13.9% | 6.1% | -7.8 | 0.5 |
| Mar to May 1934 (after Crown Point) | 22.2% | 12.6% | -9.6 | 3.4 |
| June 1934 on (crime bills in force) | 37.1% | 32.5% | -4.6 | 8.0 (noise) |

Crossing halves the risk until the laws pass; after that the gain is inside the
noise. Every job is also more dangerous in 1934, by about three times.

### 2. The 1934 laws end careers: PASSED (for the player who stays)

| Comparison | Got out | Killed |
|---|---|---|
| greedy, real 1934 / laws never pass | 3.3% / 7.0% (REAL) | 25.5% / 11.8% (REAL) |
| careful / greedy, real 1934 | 18.5% / 3.3% (REAL) | 12.0% / 25.5% (REAL) |
| stayer, real 1934 / laws never pass | 0% / 0% | 26.8% / 12.0% (REAL) |

The laws turn arrests into shootings and punish leaving late. A careful player
who leaves by spring 1934 is barely touched by them (18.5% vs 19.8%, noise):
that is the period's lesson, and the game should make a player feel it coming
(the papers, the Bureau's named list) rather than hide it.

### 3. Disappearing is reachable but rare: PASSED

careful 18.5% (author's band 15-20%). Never leaving: 0%. Reckless: 9.5% and
killed 25.8% (both REAL). Median career 10 months; Dillinger's was about 14.

Most careful players who leave are caught in the quiet months after: the men
you leave behind know your new name (recognition grows with each man's doubt).
A new face and loyal men are what get you out.

### 4. St. Paul matters while it lasts: FAILED (open)

careful 18.5% vs never using St. Paul 15.5%: a 3-point gap inside a 5.3-point
floor. The bot lies low only about one month a game, so a place to lie low
cannot matter much. Proposed for the design stage: St. Paul as a **home base**
(where the gang lives between jobs, not a place to hide after one), with the
arrangement's end in summer 1934 forcing a move. Not built until the design
says so; until then the kill gate keeps printing this row.

## Trades the gate shows (not faults)

- **Bold vs quiet:** the same chance of getting out (15.3% vs 18.5%, noise) but
  more townsfolk killed (median 1 vs 0). A choice of character, not of odds.
- **Timid vs careful:** the same chance of getting out, more killed (17.3% vs
  12.0%): hiding too often burns the money you need to leave before 1934.
- **Never crossing:** the same chance of getting out, but careers half as long
  (6 months vs 10) and more killed (18.5% vs 12.0%).

## Exploits found and closed during the gate

| Found | Fix |
|---|---|
| Careers of six months: nobody reached 1934, so the laws could not matter | Local catch and getaway risk halved; street capture in cities cut to 1.5% per guard level |
| Bold beat quiet outright (34% vs 22%) | Bold adds heat; quiet jobs take 85% of a bold one, not 75% |
| Rob hard in 1933 and leave before the laws: 32% wins | The men you leave know your new name; recognition scales with their doubt |
| Crossing paid in 1934 as well as in 1933 | Roadblocks at bridges and lines once the Bureau is armed (crossing risk x1.15) |
| Lying low never paid | Lying low halves the Bureau's chance and cools its trail faster |

## Open before design

1. St. Paul as home base (claim 4).
2. The epilogue for men still at large at December 1934 (2.5% of careful, 19% of
   stayers): what the Bureau did next, from the record (Floyd, Nelson, the Barkers).
3. Cars, radio in your own car, the moll, named men and lawmen, the family code:
   none modelled yet. Each must pass its own row in this gate before it is built.
