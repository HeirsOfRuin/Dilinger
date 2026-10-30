// The papers. Dated items are from the record (checked: docs/SPEC.md and
// docs/DESIGN.md, "Checked this stage"); each shows in the month it happened.
// The real men are news only: they never ride with you.
import { turnOf } from './world.data.js';

export const HISTORY = [
  { t: turnOf(1933, 4), text: 'Indiana paroles a bank robber named John Dillinger after eight and a half years inside. His friends are still in Michigan City.' },
  { t: turnOf(1933, 5), text: 'Kansas City, Union Station: four lawmen and their prisoner, Frank Nash, shot dead in the parking lot. Washington promises a war on crime.' },
  { t: turnOf(1933, 5), text: 'St. Paul brewer William Hamm kidnapped; ransom paid. The St. Paul police say they know nothing.' },
  { t: turnOf(1933, 8), text: 'Ten convicts walk out of the Indiana State Prison at Michigan City with guns smuggled in to them.' },
  { t: turnOf(1933, 8), text: 'Memphis: "Machine Gun" Kelly taken without a shot. The papers start calling federal agents "G-men".' },
  { t: turnOf(1933, 9), text: 'Lima, Ohio: men posing as officers free Dillinger from the county jail. Sheriff Jess Sarber is shot dead in front of his wife.' },
  { t: turnOf(1933, 11), text: 'Prohibition is over. The bootleggers need a new trade; some already have one.' },
  { t: turnOf(1934, 0), text: 'Federal deposit insurance begins. A robbed bank no longer ruins the farmers who kept their savings in it.' },
  { t: turnOf(1934, 0), text: 'St. Paul banker Edward Bremer kidnapped. The federal men are coming to St. Paul.' },
  { t: turnOf(1934, 0), text: 'Tucson: Dillinger and his gang taken without a shot after a hotel fire. He is flown to Indiana.' },
  { t: turnOf(1934, 2), text: 'Crown Point, Indiana: Dillinger walks out of the "escape-proof" jail with a gun carved from wood, and drives the sheriff\'s car over the Illinois line. Now it is federal.' },
  { t: turnOf(1934, 2), text: 'Mason City, Iowa: the First National Bank robbed of about $52,000. Townspeople shot at from the running boards.' },
  { t: turnOf(1934, 2), text: 'St. Paul, Lincoln Court Apartments: Dillinger shoots his way past federal agents at his own door.' },
  { t: turnOf(1934, 3), text: 'Chicago: federal agents arrest Billie Frechette, Dillinger\'s girl. She says nothing.' },
  { t: turnOf(1934, 3), text: 'Little Bohemia Lodge, Wisconsin: agents fire on a car of departing customers and kill a CCC worker. Baby Face Nelson kills an agent. Every outlaw gets away.' },
  { t: turnOf(1934, 4), text: 'The President signs the crime bills: robbing a member bank is a federal crime, and federal agents may now arrest and carry guns.' },
  { t: turnOf(1934, 4), text: 'Louisiana: Bonnie Parker and Clyde Barrow shot to pieces in their car by a posse on a country road.' },
  { t: turnOf(1934, 5), text: 'The Attorney General names John Dillinger Public Enemy Number One: $10,000 for his capture, $5,000 for word of where he is.' },
  { t: turnOf(1934, 6), text: 'Chicago, the Biograph Theater: John Dillinger shot dead by federal agents as he leaves a picture show. A woman in an orange skirt walked out beside him.' },
  { t: turnOf(1934, 9), text: 'East Liverpool, Ohio: Charles "Pretty Boy" Floyd shot dead in a farm field by federal agents and local police.' },
  { t: turnOf(1934, 10), text: 'Barrington, Illinois: Baby Face Nelson kills two federal agents and dies of his wounds the same night. His body is left in a ditch.' },
];

// Lines for months without history: the country, plainly.
export const FILLER = [
  'Another farm auction: the neighbours bid a dollar for every lot and hand the farm back.',
  'A bank in a county seat closes its doors for good. The line outside waits until dark.',
  'The relief office opens an hour late. The line is already round the block.',
  'A newsreel shows the President promising a new deal. The audience claps, then goes home hungry.',
  'Dust out west. The trains east are full of men looking for work.',
  'A sheriff tells the papers the radio car will end bank robbery for good.',
];

// Lines that report you. {name} is your name, {town} the town.
export const ABOUT_YOU = {
  job: 'The {town} bank robbed in broad daylight. Witnesses say the leader was polite.',
  jobKilled: 'The {town} bank robbed; a man shot dead on the floor. The papers want the gang hanged.',
  rank: 'The papers have a name for the {town} robber now: {name}.',
};
