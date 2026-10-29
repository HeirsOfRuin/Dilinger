// Every tuning number in one place, each with where it comes from.
import { turnOf } from './world.data.js';

export const CONFIG = {
  // ---- dates (checked; see docs/SPEC.md) ----
  kcMassacre: turnOf(1933, 5), // 17 June 1933
  fdic: turnOf(1934, 0), // 1 January 1934
  crownPoint: turnOf(1934, 2), // 3 March 1934
  crimeBills: turnOf(1934, 5), // signed 18 May 1934; in force for the June turn
  stPaulEnds: turnOf(1934, 6), // the layover arrangement gone by summer 1934

  // ---- the federal track ----
  // Share of the Bureau's attention on you that can turn into a catch, by phase.
  // Before Crown Point it can only push local police; after it, it hunts you by
  // name; after the bills it arrests and shoots.
  fedReach: { early: 0.15, named: 0.45, armed: 1.0 },
  fedCatch: 0.3, // monthly catch chance at attention 100 and full reach
  fedDecay: 0.93, // attention fades slowly: the Bureau keeps files
  fedJob: 3, // attention per job...
  fedDyer: 4, // ...more for a stolen car taken across a line (Dyer Act, 1919)
  fedKill: 25, // ...and per killing; double for a lawman
  fedLegend: 0.15, // ...and per point of Public Enemy rise
  fedKcBoost: 1.3, // after Kansas City the Bureau's gains run this much higher
  fedKilledShare: { early: 0.25, named: 0.35, armed: 0.6 }, // a catch that ends in a shooting

  // ---- local police ----
  heatJob: 40, // heat in the state you rob...
  heatKill: 30, // ...more for a killing
  heatBold: 15, // ...more for guns out and hostages on the running boards
  heatDecay: 0.55, // kept each month
  localCatch: 0.1, // monthly catch chance at heat 100, no radio
  radioX: 1.6, // radio makes local pursuit this much sharper
  // The line: pursuit you leave behind when you cross the same night. Local police
  // stop at it; once the Bureau is armed the men who matter do not.
  crossShake: 0.15, // share of tonight's local pursuit that follows you over
  crossShakeArmed: 1.15, // ...once agents are armed: roadblocks at the bridges and state lines, worse than staying
  getawayCatch: 0.1, // chance the posse catches you tonight at heat 100, staying
  crossCost: 300, // cars, gas, a strange town's rooms
  localKilledShare: 0.3,

  // ---- the job ----
  takeShare: [0.5, 0.95], // share of the vault you get out with
  guardShoot: 0.12, // chance of shooting per guard level...
  boldShoot: 0.25, // ...plus this for a bold approach
  quietTake: 0.85, // a quiet job gets this share of a bold one
  shootKill: 0.45, // a shooting kills someone this often
  shootLawman: 0.35, // ...and the dead man is a lawman this often
  shootManDown: 0.2, // one of yours dies in a shooting this often
  sceneCatch: 0.015, // taken at the scene, per guard level, in a radio state

  // ---- money ----
  startCash: 500,
  livingLeader: 500, // a month on the run: rooms, cars, guns, doctors
  livingMan: 200, // each man you keep
  leaderShare: 0.35, // your share of a take (the rest goes to the men)
  stPaulFee: 500, // a month under the layover arrangement
  lieLowCost: 200, // a month quiet anywhere else, beyond living

  // ---- Public Enemy and sympathy ----
  legendPerThousand: 0.6, // rank per $1,000 taken
  legendKill: 8,
  legendDecay: 0.9,
  sympathyStart: 60,
  sympathyKill: 12,
  sympathyKc: 6, // the public turns after Kansas City
  sympathyFdic: 10, // depositors stop losing their savings when you rob a bank

  // ---- hiding and informers ----
  hideRisk: 0.04,
  fedLieLow: 0.5, // the Bureau's chance while you keep off the streets
  fedStPaul: 0.4, // ...and under the layover arrangement, which tips you off
  fedDecayStPaul: 0.6, // ...and faster still where the police feed the Bureau nothing
  fedDecayLieLow: 0.85, // a trail goes cold faster when you stop making news // monthly risk where you lie low, at heat 100 (scaled by heat)
  stPaulX: 0.1, // risk multiplier under the layover arrangement
  lieLowHeat: 0.4, // heat kept in a month lying low (instead of heatDecay)
  rewardPerLegend: 150, // dollars of reward per point of Public Enemy rank
  rewardFed: 10000, // the federal reward, once the bills pass, at rank 60+
  informScale: 400000, // monthly sell-out chance = reward x disloyalty / this
  menStart: 3,
  loyaltyStart: 60,
  loyaltyShare: 0.004, // loyalty per dollar of a man's share, capped
  loyaltyShareCap: 8,
  loyaltyIdle: 3, // a month without a job
  loyaltyDeath: 6,

  // ---- getting out ----
  surgeryCost: 5000, // Dillinger paid about this, May 1934
  surgeryDeath: 0.04, // ether and a back-room doctor
  surgeryRecog: 0.45, // recognition with a new face
  disappearNeed: 21000, // cash to leave with: a name, a trade, a few years
  disappearMonths: 6, // quiet months before the world forgets you
  recogBase: 0.28,
  recogMenTalk: 0.6, // ...times this for each man's doubt (100 - loyalty), summed: the men know your new name // monthly recognition chance at Public Enemy 100 and attention 100
};
