// Questions the month asks. Each binds the people and places it needs (or says
// it cannot happen now), and each option's effects are plain data: the stakes a
// player reads are worded from these effects by src/engine/incidents.js, and an
// effect key it does not know is an error.
//
// Effect keys: cash, sympathy, heatHome, fed, legend, loyaltyAll, loyaltyMan,
// manLeaves (he goes home loyal), recruit (a new man, loyalty), tip (a bank's
// payroll day), chance { p, win, lose }, manDies.

export const INCIDENTS = [
  {
    id: 'auction',
    when: (s, h) => (s.t >= 1 ? { state: h.homeName } : null),
    text: (b) => `A farm auction outside a ${b.state} county seat. The bank is selling a widow's place for the note: $800.`,
    options: [
      { id: 'pay', label: 'Pay off the note, in cash, at the auctioneer\'s table', effects: { cash: -800, sympathy: 8, legend: 4, fed: 2 } },
      { id: 'bid', label: 'Stand at the back while the neighbours bid a dollar a lot', effects: { sympathy: 2 } },
      { id: 'leave', label: 'Keep driving', effects: {} },
    ],
  },
  {
    id: 'reporter',
    when: (s) => (s.legend >= 20 ? {} : null),
    text: () => 'A reporter from a Chicago paper has found a way to get word to you. He wants your side of it, in your own words.',
    options: [
      { id: 'talk', label: 'Give him an hour and a good story', effects: { legend: 10, sympathy: 4, fed: 15 } },
      { id: 'no', label: 'Send word back: no', effects: {} },
    ],
  },
  {
    id: 'detective',
    when: (s, h) => (s.heat[s.at] >= 20 ? { state: h.homeName } : null),
    text: (b) => `A ${b.state} detective sergeant sends a message through a bartender: for $1,000 he will lose your file for a while.`,
    options: [
      { id: 'pay', label: 'Pay him', effects: { cash: -1000, heatHome: -60, fed: -5 } },
      { id: 'no', label: 'Do not trust him', effects: {} },
    ],
  },
  {
    id: 'homesick',
    when: (s, h) => h.oneMan((m) => m.loyalty >= 40),
    text: (b) => `${b.manName} wants to go home to his mother's farm. He has had enough.`,
    options: [
      { id: 'go', label: 'Let him go with $500 and your thanks', effects: { cash: -500, manLeaves: true } },
      { id: 'stay', label: 'Tell him he goes when the gang goes', effects: { loyaltyMan: -30 } },
    ],
  },
  {
    id: 'wounded',
    when: (s, h) => (s.stats.jobs >= 1 ? h.oneMan(() => true) : null),
    text: (b) => `${b.manName} took a ricochet in the leg on the last job and it has gone bad. A doctor who asks no questions wants $400.`,
    options: [
      { id: 'doctor', label: 'Pay the doctor', effects: { cash: -400, loyaltyMan: 10 } },
      { id: 'self', label: 'Clean it yourselves with whiskey', effects: { chance: { p: 0.6, win: { loyaltyMan: -10 }, lose: { manDies: true, loyaltyAll: -10 } } } },
    ],
  },
  {
    id: 'payroll',
    when: (s, h) => h.nearTown(),
    text: (b) => `A bartender says the ${b.townName} bank takes in the mill payroll on the last Friday of the month. He wants $200 for the day and the hour.`,
    options: [
      { id: 'buy', label: 'Pay him for it', effects: { cash: -200, tip: true } },
      { id: 'no', label: 'Bartenders talk both ways', effects: {} },
    ],
  },
  {
    id: 'farmboy',
    when: (s) => (s.men.length < 5 && s.legend >= 10 ? {} : null),
    text: () => 'A farm boy who lost his family\'s place to the bank asks to ride with you. He has a shotgun and nothing else.',
    options: [
      { id: 'take', label: 'Take him on', effects: { recruit: 70 } },
      { id: 'home', label: 'Give him $50 and send him home', effects: { cash: -50, sympathy: 2 } },
    ],
  },
  {
    id: 'photograph',
    when: (s) => (s.stats.jobs >= 2 ? {} : null),
    text: () => 'A newspaper photographer caught your face on the running board of the getaway car. He will sell the plate before it runs: $500.',
    options: [
      { id: 'buy', label: 'Buy the plate and break it', effects: { cash: -500, fed: -10 } },
      { id: 'let', label: 'Let them print it', effects: { fed: 18, legend: 8 } },
    ],
  },
  {
    id: 'landlady',
    when: (s) => (s.cash >= 3000 ? {} : null),
    text: () => 'The landlady asks why you always pay in new bills, and why the men come and go at night.',
    options: [
      { id: 'pay', label: 'Pay her three months ahead and tip her well: $300', effects: { cash: -300 } },
      { id: 'shrug', label: 'Tell her you sell insurance', effects: { chance: { p: 0.5, win: {}, lose: { fed: 18, heatHome: 30 } } } },
    ],
  },
  {
    id: 'relief',
    when: (s) => (s.cash >= 2000 ? {} : null),
    text: () => 'The line outside the relief office runs round the block in the snow and the sleet.',
    options: [
      { id: 'give', label: 'Leave $500 with the priest who runs it', effects: { cash: -500, sympathy: 6 } },
      { id: 'pass', label: 'Walk past', effects: {} },
    ],
  },
  {
    id: 'grumbling',
    when: (s, h) => h.oneMan((m) => m.loyalty < 55),
    text: (b) => `${b.manName} says the split is not fair: you take the most and he takes the risk.`,
    options: [
      { id: 'raise', label: 'Give him $400 from your share', effects: { cash: -400, loyaltyMan: 15 } },
      { id: 'face', label: 'Remind him who planned the jobs', effects: { chance: { p: 0.5, win: { loyaltyMan: 5 }, lose: { loyaltyMan: -25, loyaltyAll: -5 } } } },
    ],
  },
];
