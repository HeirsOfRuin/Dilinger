# Design

Stage 3 record. What the player sees (screens on paper), the systems added after
the kill gate, and the decisions log. Every system here has a row in the kill
gate (`sim/killgate.js`) before it gets a screen: a system that changes nothing
measurable is cut, not shipped.

## Screens (phone first, 390 x 844)

Same shape as *Dead or Alive*: one column, one decision per screen, every number
from `src/engine/derive.js`.

| Screen | Shows | Decides |
|---|---|---|
| Title | New game; paste a family code; continue; load a save code | Start |
| Creation | Name; best skill (driving, gun, nerve) or the grandfather's from the code; the opening (a farm the bank is taking, or a parole from Michigan City) | Who you are |
| **Month** (the hub) | Date and the Bureau's phase in one line ("June 1934: agents armed"); home state and St. Paul's status; cash, reward, Public Enemy rank; this month's risk at home, in words and a number; the gang; three lines of the papers | Plan a job, lie low, move the gang, see the doctor, disappear |
| Plan | Banks within a drive of home, each with take, tonight's risk and whether the drive home crosses a line; quiet or guns out; your own car or a stolen one | The job |
| Night | What happened, in plain words: the take, who was hurt, the road home | Continue |
| Map | Six states, the lines, home, heat by state, radio by state, St. Paul | Look |
| Gang | Each man by name and his mood in words; your girl and her friend | Bonus, send a man home |
| Papers | Dated history (Kansas City, Crown Point, Little Bohemia, the Biograph) and the real men (Dillinger, Nelson, Floyd, Bonnie and Clyde) as news only | Read |
| End | How it ended; 1935 if you were still free; the score; the family line | New game |

The real men never ride with you, and you never take part in a crime of
theirs. They are in the papers; your crimes are your own.

## Systems added in this stage

### Cars

The getaway car is stolen unless you own one. A stolen car taken over a state
line is a federal crime from the start (Dyer Act, 1919). Your own car, bought
under another name, carries no such mark, but its plates can be traced: every job
in it adds to the Bureau's file. A **Ford V-8** (bought, about $700) outruns most
police cars of 1933: tonight's risk falls. A **radio** in the car hears the police
bulletins where police radio exists. (Dillinger's letter praising the V-8, May
1934, is disputed; the game does not quote it.)

**Built and measured (row 6):** the V-8 cuts road captures by a third and lifts
getting out by about 4 points. **The radio was cut:** it changed nothing
measurable.

### Your girl, and her friend

You may take up with a woman. She rents rooms in her own name (lying low at home
is safer) and steadies the men. The Bureau can take her (Billie Frechette was
arrested 9 April 1934); she does not talk, but you lose her and the rooms.

Her friend is the betrayal arc. In 1934, with the federal reward on you and the
friend in trouble of her own (Ana Cumpanas faced deportation), the friend may sell
you. **The game warns first:** a month before she can sell, the papers or your
girl say the friend has been asking questions. Moving the gang out of her city
ends the risk. A player who reads the warning lives; one who ignores it is the
man outside the Biograph.

**Built and measured (row 7):** her rooms make home safer (police and Bureau x0.8);
for a player who heeds the warning she is a wash (18.1% either way); ignoring it
halves the chance of getting out and nearly doubles the chance of dying.

### Named men

Your men have names (fictional) and a mood shown in words. A man's doubt is what
makes him dangerous when you leave (he knows your new name).

**Trades were cut (row 8, round 3):** a gang with a driver, a gunman and a cool
head did no better than one with none. They come back with hiring, where choosing
a man is the decision a trade needs. Your own skill carries the idea instead:
driving (a third fewer caught on the road), the gun (half as many townsfolk
killed), nerve (a fifth fewer taken in the street). Each gets out about as often.

### The law, by name

The Bureau's men are named from the record: Melvin Purvis runs the Chicago
office. **Purvis as a mechanic was cut** (extra reach in Illinois and Indiana
changed nothing a careful player meets); he is a name in the papers. Local
sheriffs and police chiefs are fictional.

### The family code

Reads `DOAFAM1.` from *Dead or Alive*. What carries over, sixty years on:

| From the code | In 1933 |
|---|---|
| `takesAfter` gun / nerve / horse | your best skill: gun, nerve, driving |
| Peak legend, townsfolk killed | the papers find the name once you are known: a folk hero's grandson (sympathy up) or a murderer's (sympathy down) |
| Heirloom revolver | Public Enemy rank starts a little higher when the papers find it |
| Cash | a little: sixty years and a depression ate most of it |
| Farm | the opening: the bank is foreclosing it |
| Friends who kept faith | one man in your gang is a friend's grandson: loyal |
| Men who sold him | the informers start keener |
| Sheriffs with a grudge | the Bureau's file starts open |

**Built and measured (row 9):** a real code from a retired *Dead or Alive* game
reads, names the grandson, sets his skill and start, and changes the chance of
getting out by 0 points. A story and a start, not a different game.

## Decisions log

| Date | Decision | Why |
|---|---|---|
| 2026-10-29 | Real names, fictional player, one-month turns, plain violence, Bonnie and Clyde in the papers only, own repository | Author, on the frame |
| 2026-10-30 | The gang has a home; robbing over the line is the crossing | St. Paul could not matter as a hiding place (kill gate round 1) |
| 2026-10-30 | Iowa added | A St. Paul gang had five small towns in reach and starved |
| 2026-10-30 | 1935 epilogue, not a win | Still at large is not free (Floyd, Nelson, the Barkers, Karpis) |
| 2026-10-30 | The betrayal is warned a month ahead | Correct-but-silent is broken: a sell-out with no sign teaches nothing |
| 2026-10-30 | Real men never ride with the player | A fictional man in a real man's crime rewrites the record |
| 2026-10-30 | Cut: car radio, Purvis's extra reach, men's trades | The kill gate showed no measurable effect |
| 2026-10-30 | Skills rebalanced to leave different marks at equal odds | Nerve was the best skill by 6 points |

## Checked this stage

Mason City, 13 March 1934, about $52,000; Lincoln Court Apartments, St. Paul, 31
March 1934; Billie Frechette arrested 9 April 1934; Floyd killed 22 October 1934;
Nelson 27 November 1934; Fred and Ma Barker 16 January 1935; Karpis found 1 May
1936, arrested 2 May; Ana Cumpanas's deportation deal. The Ford letter is
disputed and is not quoted.

## The slice (2026-10-30)

Built: title, creation (name, skill, family code), the month screen, plan, the
night's report, move, get out, gang, map, papers, end, help. Saves in the browser
and as a text code (`PE1.`); the family code is read on the creation screen.

Proved, not just written:
- **The forecasts are the outcomes** (test/forecast.test.js): over 5,580 real jobs
  the plan screen said 4.6% taken that month and 4.9% were; over 2,449 months
  lying low, 5.3% said and 5.4% happened. The first version said 4.0% for jobs:
  it left out the Bureau's file and the reward growing from the job itself, and
  undersold the danger. Fixed before shipping.
- **The phone test** (tools/smoke.mjs) plays whole games through the screens at 390
  x 844: no script errors, nothing wider than the phone, no button under 32px,
  every screen reached, a save survives a reload and travels as a code. It found:
  the help link too small to tap; map labels running out of their states; an old
  message left on the end screen. All fixed.
- **The plan screen tells the whole cost.** It first showed only the street and the
  road; a job in your home state looked safe while it brought the heat to your
  door for the rest of the month. It now shows the month after, and the total.

Hiring is in (a stake of $300, up to five men). The kill gate shows no gain for a
careful player (row 10, 18.1% vs 19.6%, noise): careful gangs rarely lose men.
It stays as a way back after losses, not a strategy.
A man sent home still knows your new name: he counts when you disappear.

## Incidents and the lodge (2026-10-31)

**Incidents** (src/data/incidents.data.js, eleven of them): a question in about
one month of three, answered before the month's action. A farm auction, a
reporter, a crooked detective, a man who wants to go home, a wound gone bad, a
bartender's payroll tip, a farm boy who wants to ride, a newspaper photograph, a
curious landlady, the relief line, a man who says the split is unfair. The stakes
under each answer are worded from its effects, and an unknown effect is an error.
Kill gate rows 11a-c.

**The lodge**: a resort lodge in the Wisconsin woods (after Little Bohemia, April
1934) as a home. No police for miles and less of the Bureau; but from Crown Point
on the agents ask at the resorts, and the keeper's chance of calling them grows
with the reward. It is shown as its own line in the month's danger. Kill gate
rows 12 and 12b: no help to a careful man who leaves by spring 1934; a real help
to one still riding when St. Paul closes.
