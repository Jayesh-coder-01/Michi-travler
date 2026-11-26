export const HERO_IMAGE =
  'https://images.unsplash.com/photo-1591600843182-a5e1c8e48b2d?auto=format&fit=crop&w=1400&q=85';

export const COASTAL_IMAGE =
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=85';

export const MOUNTAIN_IMAGE =
  'https://images.unsplash.com/photo-1464278533981-50106e6176b1?auto=format&fit=crop&w=1200&q=85';

export const CITY_IMAGE =
  'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1200&q=85';

export const WEEKEND_IMAGE =
  'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=85';

export const COVER_PRESETS = [
  { label: 'Cedar Forest', url: HERO_IMAGE },
  { label: 'Pacific Coast', url: COASTAL_IMAGE },
  { label: 'Alpine Ridge', url: MOUNTAIN_IMAGE },
  { label: 'City Dusk', url: CITY_IMAGE },
  { label: 'Lake Valley', url: WEEKEND_IMAGE },
];

export const JOURNEYS = [
  {
    id: 'hidden-shikoku',
    tag: 'Slow travel',
    route: 'TAKAMATSU → IYA VALLEY → KOCHI',
    routeStart: 'Takamatsu',
    routeEnd: 'Kochi',
    title: 'The Hidden Roads of Shikoku',
    days: 8,
    stopsCount: 7,
    meta: '8 days · 7 stops',
    image: HERO_IMAGE,
    author: {
      initials: 'MT',
      name: 'Mika Tanaka',
      handle: '@mika.moves',
    },
    profileAuthor: {
      initials: 'RN',
      name: 'Ren Nakamura',
      handle: '@renfinds',
    },
    likes: '1.2k',
    likesCount: 1200,
    thoughts: 48,
    summary:
      'Eight unhurried days tracing single-carriage mountain rails, vine bridges suspended over emerald gorges, and cedar-lined shrine approaches across Japan’s quietest island.',
    stops: [
      {
        name: 'Takamatsu',
        day: 'DAY 01',
        mode: 'ferry & rail',
        note: 'Early morning udon near the port before catching the Dosan Line south into the hills.',
        type: 'start',
      },
      {
        name: 'Iya Valley',
        day: 'DAY 03',
        mode: 'local train',
        note: 'Misty suspension bridges, thatched farmhouses, and cedar-scented air after afternoon rain.',
        type: 'waypoint',
        index: 1,
      },
      {
        name: 'Kochi',
        day: 'DAY 08',
        mode: 'coastal tram',
        note: 'Sunday market stalls, Pacific breeze at Katsurahama, and salt-grilled bonito at dusk.',
        type: 'end',
      },
    ],
  },
  {
    id: 'blue-line-south',
    tag: 'Coastal',
    route: 'KAMAKURA → SHIMODA → IZU',
    routeStart: 'Kamakura',
    routeEnd: 'Izu',
    title: 'A Blue Line South',
    days: 4,
    stopsCount: 5,
    meta: '4 days · 5 stops',
    image: COASTAL_IMAGE,
    author: {
      initials: 'AR',
      name: 'Alex Rivera',
      handle: '@alex.roams',
    },
    profileAuthor: {
      initials: 'AR',
      name: 'Alex Rivera',
      handle: '@alex.roams',
    },
    likes: '842',
    likesCount: 842,
    thoughts: 29,
    summary:
      'Following the Sagami Bay curve by local train and coastal footpath — stopping wherever the cliffs open to tidepools and quiet harbor bakeries.',
    stops: [
      {
        name: 'Kamakura',
        day: 'DAY 01',
        mode: 'enoden tram',
        note: 'Wooden tramcars brushing past hydrangea hedges and surfers walking barefoot to Yuigahama.',
        type: 'start',
      },
      {
        name: 'Shimoda',
        day: 'DAY 02',
        mode: 'super view odoriko',
        note: 'Whitewashed Perry Road lanes and quiet coves tucked behind pine headlands.',
        type: 'waypoint',
        index: 1,
      },
      {
        name: 'Izu',
        day: 'DAY 04',
        mode: 'coastal bus',
        note: 'Volcanic sea cliffs, warm mineral baths, and a slow sunset over Suruga Bay.',
        type: 'end',
      },
    ],
  },
  {
    id: 'where-alps-begin',
    tag: 'Mountain',
    route: 'MATSUMOTO → KAMIKOCHI → TAKAYAMA',
    routeStart: 'Matsumoto',
    routeEnd: 'Takayama',
    title: 'Where the Alps Begin',
    days: 6,
    stopsCount: 9,
    meta: '6 days · 9 stops',
    image: MOUNTAIN_IMAGE,
    author: {
      initials: 'NC',
      name: 'Nora Chen',
      handle: '@norawanders',
    },
    profileAuthor: {
      initials: 'RN',
      name: 'Ren Nakamura',
      handle: '@renfinds',
    },
    likes: '639',
    likesCount: 639,
    thoughts: 34,
    summary:
      'Crossing the Northern Japan Alps from castle town avenues to glacial riverbeds and cedar-timbered merchant streets.',
    stops: [
      {
        name: 'Matsumoto',
        day: 'DAY 01',
        mode: 'on foot',
        note: 'Black-walled castle moat at dawn and hand-roasted coffee along Nakamachi-dori.',
        type: 'start',
      },
      {
        name: 'Kamikochi',
        day: 'DAY 03',
        mode: 'alpine trail',
        note: 'Clear turquoise Azusa River water beneath snow-dusted Hotaka peaks.',
        type: 'waypoint',
        index: 1,
      },
      {
        name: 'Takayama',
        day: 'DAY 06',
        mode: 'mountain bus',
        note: 'Morning river markets, cedar sake breweries, and lantern-lit wooden eaves.',
        type: 'end',
      },
    ],
  },
  {
    id: 'edges-of-tokyo',
    tag: 'City edges',
    route: 'YANAKA → KIYOSUMI → TSUKISHIMA',
    routeStart: 'Yanaka',
    routeEnd: 'Tsukishima',
    title: 'Quiet Edges of the Metropolis',
    days: 3,
    stopsCount: 6,
    meta: '3 days · 6 stops',
    image: CITY_IMAGE,
    author: {
      initials: 'KS',
      name: 'Kenji Sato',
      handle: '@kenji.walks',
    },
    profileAuthor: {
      initials: 'RN',
      name: 'Ren Nakamura',
      handle: '@renfinds',
    },
    likes: '514',
    likesCount: 514,
    thoughts: 19,
    summary:
      'Walking the old shitamachi neighborhoods where wooden kissaten, canal bridges, and neighborhood bakeries outlast the neon skyline.',
    stops: [
      {
        name: 'Yanaka',
        day: 'DAY 01',
        mode: 'on foot',
        note: 'Morning light across temple roofs and quiet stairs down to Yanaka Ginza.',
        type: 'start',
      },
      {
        name: 'Kiyosumi',
        day: 'DAY 02',
        mode: 'subway & walk',
        note: 'Roastery warehouses along the Sumida River canals.',
        type: 'waypoint',
        index: 1,
      },
      {
        name: 'Tsukishima',
        day: 'DAY 03',
        mode: 'bridge walk',
        note: 'Lantern-lit side alleys and evening breeze off Tokyo Bay.',
        type: 'end',
      },
    ],
  },
  {
    id: 'lake-biwa-loop',
    tag: 'Weekend',
    route: 'OTSU → OMI-MAIKO → NAGAHAMA',
    routeStart: 'Otsu',
    routeEnd: 'Nagahama',
    title: 'Two Mornings Around Lake Biwa',
    days: 2,
    stopsCount: 4,
    meta: '2 days · 4 stops',
    image: WEEKEND_IMAGE,
    author: {
      initials: 'RN',
      name: 'Ren Nakamura',
      handle: '@renfinds',
    },
    profileAuthor: {
      initials: 'RN',
      name: 'Ren Nakamura',
      handle: '@renfinds',
    },
    likes: '428',
    likesCount: 428,
    thoughts: 15,
    summary:
      'A short weekend loop by lakeside train and rented bicycle, chasing pine beaches and quiet wooden boathouses.',
    stops: [
      {
        name: 'Otsu',
        day: 'DAY 01',
        mode: 'kosei line',
        note: 'Stepping off the train to still water and mist over Mount Hiei.',
        type: 'start',
      },
      {
        name: 'Omi-Maiko',
        day: 'DAY 01',
        mode: 'bicycle',
        note: 'White sand shoreline lined with wind-bent pine trees.',
        type: 'waypoint',
        index: 1,
      },
      {
        name: 'Nagahama',
        day: 'DAY 02',
        mode: 'local rail',
        note: 'Glassware studios and warm soba before heading back to Kyoto.',
        type: 'end',
      },
    ],
  },
];

export const INITIAL_COMMENTS = {
  'hidden-shikoku': [
    {
      id: 'c1',
      author: 'Alex Rivera',
      handle: '@alex.roams',
      text: 'That morning udon stop near Takamatsu port is unforgettable. Did you catch the 7:12 Dosan Line?',
      time: '2 days ago',
    },
    {
      id: 'c2',
      author: 'Nora Chen',
      handle: '@norawanders',
      text: 'Saved this for October — the cedar mist in Iya Valley looks unreal.',
      time: '5 days ago',
    },
  ],
};

export const EXPLORE_CATEGORIES = [
  'All journeys',
  'Slow travel',
  'Coastal',
  'Mountain',
  'City edges',
  'Weekend',
];

export const PRINCIPLE_ITEMS = [
  {
    number: '01',
    title: 'Start somewhere',
    description: 'The first pin is an invitation, not a finish line.',
    borderColor: 'var(--accent)',
  },
  {
    number: '02',
    title: 'Follow the thread',
    description: 'Collect the unexpected turns and small discoveries.',
    borderColor: 'var(--sky)',
  },
  {
    number: '03',
    title: 'Leave a trace',
    description: 'Make the way easier for the next person.',
    borderColor: 'var(--sunshine)',
  },
];

export const PROFILE_USER = {
  initials: 'RN',
  name: 'Ren Nakamura',
  handle: '@renfinds',
  location: 'Kyoto, Japan',
  bio: 'Collecting slow train lines, cedar trails, and quiet morning bakeries between Kyoto and the sea.',
  coverImage: MOUNTAIN_IMAGE,
  stats: [
    { value: '14', label: 'journeys' },
    { value: '8', label: 'countries' },
    { value: '2.4k', label: 'followers' },
    { value: '186', label: 'following' },
  ],
  tabs: ['Overview', 'Trips', 'Field notes', 'Photos', 'Videos'],
};
