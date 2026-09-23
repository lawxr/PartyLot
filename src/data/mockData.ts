import { User, Party, Crew, Expense, PotTransaction, Poll, ActivityItem, Member, TriviaQuestion, WhosMostLikelyQuestion, ThisOrThatQuestion } from '@/types';

export const CURRENT_USER: User = {
  id: 'u-law',
  name: 'Law',
  handle: '@law',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  gatheringsCount: 24,
  gamesCount: 142,
  peopleCount: 38,
  settlementsCount: 71,
  balance: 48.50,
};

export const INITIAL_MEMBERS: Member[] = [
  {
    id: 'u-law',
    name: 'Law',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    role: 'host',
    status: 'going',
    nightsTogether: 24,
  },
  {
    id: 'u-ana',
    name: 'Ana',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
    role: 'guest',
    status: 'going',
    nightsTogether: 12,
  },
  {
    id: 'u-carlos',
    name: 'Carlos',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    role: 'guest',
    status: 'going',
    nightsTogether: 9,
  },
  {
    id: 'u-sofi',
    name: 'Sofi',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
    role: 'guest',
    status: 'going',
    nightsTogether: 7,
  },
  {
    id: 'u-mateo',
    name: 'Mateo',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    role: 'guest',
    status: 'going',
    nightsTogether: 15,
  },
  {
    id: 'u-valen',
    name: 'Valen',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80',
    role: 'guest',
    status: 'going',
    nightsTogether: 6,
  },
  {
    id: 'u-nico',
    name: 'Nico',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=400&q=80',
    role: 'guest',
    status: 'going',
    nightsTogether: 11,
  },
  {
    id: 'u-camila',
    name: 'Camila',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
    role: 'guest',
    status: 'going',
    nightsTogether: 4,
  },
];

export const INITIAL_PARTIES: Party[] = [
  {
    id: 'p-404',
    code: '8F4K',
    title: '404 HOUSE',
    date: 'TONIGHT',
    time: '9:00 PM',
    location: 'Medellín · Penthouse 14',
    description: 'Music, games, pizza and questionable decisions. BYOB + sound system ready.',
    coverImage: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
    hostId: 'u-law',
    hostName: 'Law',
    members: INITIAL_MEMBERS,
    potBalance: 186.42,
    createdAt: '2026-09-22T18:00:00Z',
    status: 'live',
  },
  {
    id: 'p-rooftop',
    code: '9X2M',
    title: 'Rooftop Sessions',
    date: 'FRIDAY',
    time: '10:00 PM',
    location: 'El Poblado · Skyline Lounge',
    description: 'House beats, city lights, cold mezcal and open sunset terrace.',
    coverImage: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=1200&q=80',
    hostId: 'u-ana',
    hostName: 'Ana',
    members: INITIAL_MEMBERS.slice(0, 5),
    potBalance: 95.00,
    createdAt: '2026-09-21T12:00:00Z',
    status: 'upcoming',
  },
  {
    id: 'p-hackathon',
    code: '7W1P',
    title: 'After Midnight Crew',
    date: 'SATURDAY',
    time: '11:30 PM',
    location: 'Warehouse District · Secret Door',
    description: 'Bass heavy, strobe lights, flash photography only.',
    coverImage: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80',
    hostId: 'u-carlos',
    hostName: 'Carlos',
    members: INITIAL_MEMBERS.slice(1, 7),
    potBalance: 320.00,
    createdAt: '2026-09-20T10:00:00Z',
    status: 'upcoming',
  }
];

export const INITIAL_CREWS: Crew[] = [
  {
    id: 'c-404',
    name: '404 HOUSE',
    coverImage: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80',
    membersCount: 14,
    lastActivity: 'Active 12m ago',
  },
  {
    id: 'c-hackathon',
    name: 'Hackathon Crew',
    coverImage: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80',
    membersCount: 8,
    lastActivity: 'Active 2h ago',
  },
  {
    id: 'c-uni',
    name: 'Uni Friends',
    coverImage: 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&w=800&q=80',
    membersCount: 22,
    lastActivity: 'Active yesterday',
  }
];

export const INITIAL_EXPENSES: Expense[] = [
  {
    id: 'e-1',
    partyId: 'p-404',
    description: 'Sourdough Artisanal Pizza',
    amount: 82.00,
    paidById: 'u-law',
    paidByName: 'Law',
    paidByAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    splitBetweenIds: ['u-law', 'u-ana', 'u-carlos', 'u-sofi', 'u-mateo', 'u-valen'],
    createdAt: '8:45 PM',
  },
  {
    id: 'e-2',
    partyId: 'p-404',
    description: 'Cocktail Mix & Ice',
    amount: 124.00,
    paidById: 'u-ana',
    paidByName: 'Ana',
    paidByAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
    splitBetweenIds: ['u-law', 'u-ana', 'u-carlos', 'u-sofi', 'u-mateo'],
    createdAt: '9:15 PM',
  },
  {
    id: 'e-3',
    partyId: 'p-404',
    description: 'Group Van / Uber XL',
    amount: 31.00,
    paidById: 'u-carlos',
    paidByName: 'Carlos',
    paidByAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    splitBetweenIds: ['u-law', 'u-ana', 'u-carlos', 'u-sofi'],
    createdAt: '9:40 PM',
  }
];

export const INITIAL_TRANSACTIONS: PotTransaction[] = [
  {
    id: 'tx-1',
    partyId: 'p-404',
    type: 'add',
    amount: 50.00,
    description: 'Host initial seed',
    userName: 'Law',
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    timestamp: '7:30 PM',
  },
  {
    id: 'tx-2',
    partyId: 'p-404',
    type: 'add',
    amount: 25.00,
    description: 'Pot contribution',
    userName: 'Ana',
    userAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
    timestamp: '8:10 PM',
  },
  {
    id: 'tx-3',
    partyId: 'p-404',
    type: 'spend',
    amount: 42.00,
    description: 'Midnight snacks run',
    userName: 'Pizza Bot',
    userAvatar: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=400&q=80',
    timestamp: '9:25 PM',
  },
  {
    id: 'tx-4',
    partyId: 'p-404',
    type: 'add',
    amount: 15.00,
    description: 'Snack contribution',
    userName: 'Carlos',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    timestamp: '9:50 PM',
  },
  {
    id: 'tx-5',
    partyId: 'p-404',
    type: 'add',
    amount: 10.00,
    description: 'Energy drinks supply',
    userName: 'Ana',
    userAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
    timestamp: '10:02 PM',
  }
];

export const INITIAL_POLLS: Poll[] = [
  {
    id: 'poll-1',
    partyId: 'p-404',
    question: 'WHAT SHOULD WE ORDER?',
    options: [
      { id: 'opt-1', label: 'Truffle Pizza', votes: 7, voters: ['u-law', 'u-sofi', 'u-mateo'] },
      { id: 'opt-2', label: 'Smash Burgers', votes: 4, voters: ['u-ana', 'u-carlos'] },
      { id: 'opt-3', label: 'Birria Tacos', votes: 3, voters: ['u-valen'] },
    ],
    totalVotes: 14,
    userVoteId: 'opt-1',
    createdAt: '8:30 PM',
  },
  {
    id: 'poll-2',
    partyId: 'p-404',
    question: "WHO'S ARRIVING LAST?",
    options: [
      { id: 'opt-4', label: 'Carlos (guaranteed)', votes: 9, voters: ['u-law', 'u-ana', 'u-sofi'] },
      { id: 'opt-5', label: 'Valen', votes: 3, voters: ['u-mateo'] },
      { id: 'opt-6', label: 'Nico', votes: 2, voters: [] },
    ],
    totalVotes: 14,
    createdAt: '8:50 PM',
  },
  {
    id: 'poll-3',
    partyId: 'p-404',
    question: 'WHERE DO WE GO AFTER?',
    options: [
      { id: 'opt-7', label: 'Rooftop Lounge', votes: 8, voters: ['u-law', 'u-carlos'] },
      { id: 'opt-8', label: 'Secret Warehouse Club', votes: 5, voters: ['u-ana'] },
      { id: 'opt-9', label: 'Sleep is for the weak', votes: 1, voters: [] },
    ],
    totalVotes: 14,
    createdAt: '9:20 PM',
  }
];

export const INITIAL_ACTIVITIES: ActivityItem[] = [
  {
    id: 'act-1',
    partyId: 'p-404',
    type: 'join',
    text: 'Carlos joined the party',
    time: '8m ago',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'act-2',
    partyId: 'p-404',
    type: 'pot',
    text: 'Ana added $10 to the pot',
    time: '15m ago',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'act-3',
    partyId: 'p-404',
    type: 'poll',
    text: 'Law created a poll: "WHAT SHOULD WE ORDER?"',
    time: '24m ago',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'act-4',
    partyId: 'p-404',
    type: 'game',
    text: "Sofi won Who's Most Likely",
    time: '35m ago',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'act-5',
    partyId: 'p-404',
    type: 'expense',
    text: 'Law added expense: Sourdough Artisanal Pizza ($82)',
    time: '48m ago',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  }
];

export const WHOS_MOST_LIKELY_QUESTIONS: WhosMostLikelyQuestion[] = [
  {
    id: 'wml-1',
    question: 'Who is most likely to disappear for three days and come back like nothing happened?',
    votes: { 'u-carlos': 6, 'u-ana': 3, 'u-sofi': 2, 'u-mateo': 1 },
  },
  {
    id: 'wml-2',
    question: 'Who is most likely to DJ all night and refuse to pass the aux cord?',
    votes: { 'u-law': 8, 'u-mateo': 2, 'u-nico': 1 },
  },
  {
    id: 'wml-3',
    question: 'Who is most likely to adopt a stray animal on the way home?',
    votes: { 'u-sofi': 7, 'u-valen': 4, 'u-camila': 1 },
  },
  {
    id: 'wml-4',
    question: 'Who is most likely to order $150 worth of midnight delivery for themselves?',
    votes: { 'u-carlos': 5, 'u-law': 4, 'u-ana': 2 },
  },
];

export const THIS_OR_THAT_QUESTIONS: ThisOrThatQuestion[] = [
  {
    id: 'tot-1',
    optionA: 'BEACH SUNRISE',
    optionB: 'ROOFTOP 4AM',
    votesA: 9,
    votesB: 14,
  },
  {
    id: 'tot-2',
    optionA: 'TEQUILA SHOTS',
    optionB: 'DIRTY GIN MARTINI',
    votesA: 16,
    votesB: 7,
  },
  {
    id: 'tot-3',
    optionA: 'AFTERPARTY TILL NOON',
    optionB: 'BED & COMFORT FOOD',
    votesA: 11,
    votesB: 12,
  },
  {
    id: 'tot-4',
    optionA: 'UNRELEASED TECHNO',
    optionB: '2000s REGGAETON CLASSICS',
    votesA: 13,
    votesB: 10,
  }
];

export const TRIVIA_QUESTIONS: TriviaQuestion[] = [
  {
    id: 't-1',
    question: 'Who once accidentally locked everyone on the balcony during a rainstorm?',
    options: ['Carlos', 'Ana', 'Law', 'Sofi'],
    correctIndex: 0,
    explanation: 'Carlos tried to shut out the smoke alarm and locked the latch!',
  },
  {
    id: 't-2',
    question: 'What is the unofficial house cocktail recipe invented at 404?',
    options: ['Mezcal + Grapefruit + Spicy Salt', 'Vodka + Cold Brew + Red Bull', 'Tequila + Champagne + Lime', 'Gin + Coconut Water + Matcha'],
    correctIndex: 2,
    explanation: 'The famous "Golden Spark" – lethal and bubbly.',
  },
  {
    id: 't-3',
    question: 'How many slices of pizza were consumed in a single night at the last gathering?',
    options: ['18 slices', '32 slices', '48 slices', 'Who was counting?'],
    correctIndex: 2,
    explanation: '6 full large pizzas completely demolished by 2:30 AM.',
  },
  {
    id: 't-4',
    question: 'Which crew member holds the record for fastest RSVP (under 4 seconds)?',
    options: ['Law', 'Ana', 'Mateo', 'Valen'],
    correctIndex: 1,
    explanation: 'Ana got the push notification and pressed going before the app finished loading.',
  },
  {
    id: 't-5',
    question: 'Where was the original Partylot prototype sketched on a napkin?',
    options: ['Rooftop in Medellín', 'Tokyo ramen shop', 'Berlin club line', 'Bogotá café'],
    correctIndex: 0,
    explanation: 'Drawn on a cocktail napkin during a 3AM balcony session.',
  }
];

export const SAMPLE_PARTY_COVERS = [
  {
    id: 'cov-1',
    name: 'Flash House Party',
    url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'cov-2',
    name: 'Rooftop Neon',
    url: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'cov-3',
    name: 'Warehouse Vibe',
    url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'cov-4',
    name: 'Warm Balcony Sunset',
    url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'cov-5',
    name: 'Midnight Disco',
    url: 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&w=1200&q=80',
  },
];
