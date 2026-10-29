# Public Enemy: 1933 (working title), one-page spec

The sequel to *Dead or Alive* (HeirsOfRuin/Wild-West). Frame and the author's
decisions: Wild-West `docs/SEQUEL-1933.md`. This page is what gets built.

## Pitch

May 1933 to December 1934, the Midwest. Banks are foreclosing on farms and a bank
robber can be cheered again. You are a fictional robber among real ones (Dillinger,
Nelson, Van Meter) and real lawmen (Purvis and the Bureau). Optionally you are the
grandchild of a *Dead or Alive* outlaw who got away with it. In twenty months the
federal government goes from having no gun, no arrest power and no jurisdiction
over bank robbery to hunting you across every state line. The game is how long
you last, who sells you, and whether you can vanish before the net closes.

## Core loop (one turn = one month, 20 turns)

1. **Choose:** a job (a bank, a police arsenal, a jail break), lie low (where, at
   what cost), move to another state, or buy your way out (a new face, a new name).
2. **The job:** plan with roles (wheelman, inside man, lookout), resolve it from the
   same formulas the forecast shows.
3. **The getaway:** the decision this game is about: **cross a state line tonight,
   or go to ground here.** Its value changes by date (below).
4. **The month passes:** local heat cools, federal attention does not; papers,
   radio, informers, your own men.

## The three pressures

| Pressure | What it is | How it changes |
|---|---|---|
| Local police and sheriffs | Heat per state; stops at the state line | Police radio arrives city by city: faster posses where it exists |
| The Bureau | One number on you, rising with your name and your killings | Its reach steps up by date (below); it follows across lines |
| Informers | Reward x disloyalty, among your men, your girl, your landlords | The reward grows with your Public Enemy rank |

## The federal track (checked dates)

| From | In the world | In the game |
|---|---|---|
| May 1933 | The Bureau has no general arrest power and no guns; a stolen car driven across a state line is already federal (Dyer Act, 1919) | Crossing after a job in a stolen car marks you a little; mostly the line shakes pursuit |
| June 1933 | Kansas City Massacre (17 June): four lawmen and their prisoner killed at Union Station | The public turns a little; the Bureau starts to care |
| March 1934 | Crown Point escape (3 March) in a stolen car taken across the Indiana line | The Bureau has a named case on you; reach rises |
| June 1934 | Crime bills signed 18 May 1934: robbing a national or member bank is federal; agents may arrest and carry guns | Full reach; crossing a line no longer shakes anyone that matters |

## Other dated events (checked)

May 1933 Dillinger paroled; 26 Sept 1933 ten men out of Michigan City with guns
smuggled in; 12 Oct 1933 Lima jail break, Sheriff Jess Sarber killed; 1 Jan 1934
deposit insurance (a bank loss stops being a farmer's loss: sympathy falls); 22-23
April 1934 Little Bohemia, the agents kill a bystander (Eugene Boiseneau) and lose an
agent; late May 1934 Dillinger's plastic surgery (Loeser); 22 July 1934 the
Biograph Theatre; 1933-34 the St. Paul "layover" arrangement breaks after the Hamm
and Bremer kidnappings and the federal men arrive.

## Win, loss, end

- **Win (rare, 15-20% for a careful player):** disappear: enough cash, a new face,
  then six quiet months somewhere nobody looks without being recognised.
- **Loss:** killed, taken, or sold. Still robbing banks at the end of 1934 is not a
  win: the epilogue says what the Bureau did with the men still at large.
- **Score:** months free, money kept, Public Enemy peak, townsfolk and lawmen killed
  (shown plainly).

## The family code

Reads `DOAFAM1.` from *Dead or Alive* (the only link between the repositories).
Without one, the player makes a character. Mapping as in the frame: family name,
best skill (horse becomes driving), heirloom revolver, a farm the bank is
foreclosing (the opening), grandsons of friends and of men who sold him.

## First playable scope

Five states (Indiana, Illinois, Ohio, Wisconsin, Minnesota), about 12 towns and two
cities (Chicago, St. Paul); targets: banks, police arsenals, one jail; 6-8 named
men; the federal track; radio by state; one betrayal arc; the family code read.

## Proof before screens (the kill gate)

Numbers only, fixed bot policies on the same seeds, every gap with its noise floor:

1. **The line by date:** crossing after a job cuts the chance of being caught next
   month in 1933 by a real margin; by mid-1934 the margin is gone or reversed.
2. **The federal track ends careers:** the same careful policy in a world where the
   1934 laws never pass lives measurably longer in 1934.
3. **Disappearing is reachable but rare:** careful 15-20%; never quitting near 0%.
4. **St. Paul matters while it lasts:** lying low there pays until it ends.

## Assumptions and risks

- Police radio dates by state are game assumptions, not sourced history; labelled
  so in the data.
- Twenty turns is short: each must carry a decision. If the kill gate shows months
  with nothing to choose, add incidents before adding systems.
- Real names: real men appear as they were; the player's character is the only
  invention, and is never written into a real man's crime.
