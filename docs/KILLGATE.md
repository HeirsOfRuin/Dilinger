# Kill gate: results

Numbers only, before any screens. `node sim/killgate.js 400`: 400 seeds per
policy, the same seeds for every policy. A gap is REAL only when it is wider than
its noise floor (2 standard errors of the difference). The model is the engine's
first cut (`src/engine`), not a throwaway: the game will be built on it.

Round 2 (2026-10-30): the gang has a home; St. Paul is a place to live; Iowa
added; 1935 epilogue. Round 1 results are in git history (commit 766375e).

## The policies

| Policy | Plays |
|---|---|
| careful | the best job within a drive of home, by take against risk; moves home when another state is clearly safer (St. Paul, while it holds); lies low when the month's risk at home passes 10%; buys a new face, then disappears once it has $16,000 |
| nocross / alwayscross / coin | careful, but robs only in its home state / only over the line / either at random |
| greedy | careful, but stays for $8,000 more before leaving |
| stayer | careful, but never leaves |
| bold | careful, with guns out instead of a quiet job |
| timid | careful, but lies low at 6% risk |
| nostpaul | careful, never lives in St. Paul |
| homebody | careful, never moves house |
| reckless | bold, robs only at home, never lies low, never moves |

## Claims and what the numbers say

### 1. The state line changes value by date: PASSED

Paired: every job a careful player chose, replayed from the same state with the
same dice, once with the gang living in the town's state and once living over the
line, with the same heat at home (10 replays each). Caught that night or that month.

| Phase | Rob at home | Rob over the line | Gap | Floor |
|---|---|---|---|---|
| May 1933 to Feb 1934 (Bureau unarmed) | 11.7% | 4.5% | -7.2 | 0.5 |
| Mar to May 1934 (after Crown Point) | 20.2% | 12.9% | -7.3 | 1.5 |
| June 1934 on (crime bills in force) | 26.8% | 22.9% | -3.9 | 3.6 |

The line cuts the risk by about 60% before the laws and by about 15% after. It
does not go to zero, because a line between the job and your bed still keeps the
local heat off your door; what it no longer stops is the Bureau.

### 2. The 1934 laws end careers: PASSED

| Comparison | Got out | Killed |
|---|---|---|
| careful, real 1934 / laws never pass | 18.8% / 23.0% (noise) | 24.8% / 9.8% (REAL) |
| greedy, real 1934 / laws never pass | 1.3% / 6.3% (REAL) | 37.3% / 14.2% (REAL) |
| careful / greedy, real 1934 | 18.8% / 1.3% (REAL) | 24.8% / 37.3% (REAL) |
| stayer, real 1934 / laws never pass | 0% / 0% | 37.8% / 17.5% (REAL) |

The laws more than double the killing and punish leaving late.

### 3. Disappearing is reachable but rare: PASSED

careful 18.8% (author's band 15-20%). Never leaving 0%. Reckless 0.8%. Robbing
only at home 0%. Median career 12 months; Dillinger's was about 14.

### 4. St. Paul matters while it lasts: PASSED

careful 18.8% vs never living there 13.0% (REAL); captured 48.8% vs 60.5% (REAL).
The cost: a careful gang still living there when the arrangement ends is raided,
which is most of why careful is killed 24.8% of the time against 20.3% without St.
Paul (noise, but the direction the record gives).

## 1935: the epilogue for men still free

Of the games still running at December 1934 (stayer, careful and greedy
together, 238 games): 39% killed in 1935, 26% taken, 3% sold, 33% never taken
but never free. Most of the real men still at large in late 1934 were dead or in
prison by 1936.

## Trades the gate shows (not faults)

- **Bold vs quiet:** the same chance of getting out (14.8% vs 18.8%, noise),
  shorter careers (9 months vs 12) and more townsfolk killed (median 1 vs 0).
- **Timid vs careful:** no difference. Lying low sooner neither helps nor hurts;
  where you live matters more than how often you hide.
- **Robbing only over the line:** 11.0% (REAL loss): the towns near home run dry
  and a gang that will not rob nearby runs short.

## Exploits found and closed

| Round | Found | Fix |
|---|---|---|
| 1 | Careers of six months: nobody reached 1934 | Local catch and getaway risk halved; city street capture cut |
| 1 | Bold beat quiet outright (34% vs 22%) | Bold adds heat; quiet jobs take 85% of a bold one |
| 1 | Rob hard in 1933, leave before the laws: 32% | The men you leave know your new name |
| 1 | Crossing paid as much in 1934 | Roadblocks at bridges and lines once agents are armed |
| 1 | Lying low never paid | Lying low halves the Bureau's chance and cools its trail |
| 2 | St. Paul was a money trap ($1,600 a month against five small towns): 1% got out | The fee cut to $250; Iowa added; the price of leaving set to $16,000 |

## Open before design

1. **Moving house is only St. Paul.** careful never moves anywhere else (the
   homebody row equals nostpaul). Whether other moves matter waits for the
   design stage: tourist courts and lodges (Little Bohemia) are the candidates.
2. Cars, radio in your own car, the girlfriend, named men and lawmen, the family
   code: none modelled yet. Each gets its own row here before it is built.
3. The 1935 dates in the epilogue text (Floyd, Nelson, the Barkers, Karpis) and
   the Mason City and Lincoln Court dates are from general knowledge and still to
   be checked against a source before they appear as game text.
