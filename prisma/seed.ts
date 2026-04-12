import { config as loadEnv } from 'dotenv'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'

// Load env from .env.local first (preferred), then fall back to .env.
const envLocalPath = resolve(process.cwd(), '.env.local')
if (existsSync(envLocalPath)) {
  loadEnv({ path: envLocalPath })
}
loadEnv()

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL is not set')
}

const adapter = new PrismaNeon({ connectionString })
const prisma = new PrismaClient({ adapter })

// ---------------------------------------------------------------------------
// Reference data constants
// ---------------------------------------------------------------------------

const INSTRUMENT_NAMES = [
  'Voice',
  'Violin',
  'Viola',
  'Cello',
  'Double Bass',
  'Flute',
  'Oboe',
  'Clarinet',
  'Bassoon',
  'French Horn',
  'Trumpet',
  'Trombone',
  'Tuba',
  'Piano',
  'Harp',
  'Percussion',
  'Composition',
  'Conducting',
] as const

const CATEGORY_NAMES = [
  'Opera',
  'Orchestral',
  'Chamber Music',
  'Art Song / Lieder',
  'Musical Theatre',
  'Baroque',
  'Contemporary',
  'Choral',
] as const

// ---------------------------------------------------------------------------
// Locations with stable UUIDs
// ---------------------------------------------------------------------------

type LocationSeed = {
  id: string
  city: string
  country: string
  state: string | null
  address: string | null
}

const LOC_SALZBURG = '00000000-0000-0000-0000-000000000001'
const LOC_ASPEN = '00000000-0000-0000-0000-000000000002'
const LOC_TANGLEWOOD = '00000000-0000-0000-0000-000000000003'
const LOC_SANTA_FE = '00000000-0000-0000-0000-000000000004'
const LOC_GLYNDEBOURNE = '00000000-0000-0000-0000-000000000005'
const LOC_AIX = '00000000-0000-0000-0000-000000000006'
const LOC_SPOLETO = '00000000-0000-0000-0000-000000000007'
const LOC_BANFF = '00000000-0000-0000-0000-000000000008'
const LOC_RAVINIA = '00000000-0000-0000-0000-000000000009'
const LOC_BREVARD = '00000000-0000-0000-0000-000000000010'

const LOCATIONS: LocationSeed[] = [
  {
    id: LOC_SALZBURG,
    city: 'Salzburg',
    country: 'Austria',
    state: null,
    address: 'Herbert-von-Karajan-Platz 9, 5020 Salzburg',
  },
  {
    id: LOC_ASPEN,
    city: 'Aspen',
    country: 'United States',
    state: 'Colorado',
    address: '225 Music School Rd, Aspen, CO 81611',
  },
  {
    id: LOC_TANGLEWOOD,
    city: 'Lenox',
    country: 'United States',
    state: 'Massachusetts',
    address: '297 West St, Lenox, MA 01240',
  },
  {
    id: LOC_SANTA_FE,
    city: 'Santa Fe',
    country: 'United States',
    state: 'New Mexico',
    address: '301 Opera Dr, Santa Fe, NM 87506',
  },
  {
    id: LOC_GLYNDEBOURNE,
    city: 'Glyndebourne',
    country: 'United Kingdom',
    state: 'England',
    address: 'New Rd, Lewes BN8 5UU',
  },
  {
    id: LOC_AIX,
    city: 'Aix-en-Provence',
    country: 'France',
    state: null,
    address: "Palais de l'Ancien Archevêché, 13100 Aix-en-Provence",
  },
  {
    id: LOC_SPOLETO,
    city: 'Spoleto',
    country: 'Italy',
    state: null,
    address: 'Piazza del Duomo, 06049 Spoleto PG',
  },
  {
    id: LOC_BANFF,
    city: 'Banff',
    country: 'Canada',
    state: 'Alberta',
    address: '107 Tunnel Mountain Dr, Banff, AB T1L 1H5',
  },
  {
    id: LOC_RAVINIA,
    city: 'Highland Park',
    country: 'United States',
    state: 'Illinois',
    address: '200 Ravinia Park Rd, Highland Park, IL 60035',
  },
  {
    id: LOC_BREVARD,
    city: 'Brevard',
    country: 'United States',
    state: 'North Carolina',
    address: '349 Andante Ln, Brevard, NC 28712',
  },
]

// ---------------------------------------------------------------------------
// Programs
// ---------------------------------------------------------------------------

type ReviewSeed = {
  rating: number
  year_attended: number | null
  reviewer_name: string | null
  title: string | null
  body: string
}

type AuditionSeed = {
  location_id: string
  time_slot: Date | null
  audition_fee: number | null
  instructions: string | null
  registration_url: string | null
  instrument_names: string[]
}

type ProgramSeed = {
  id: string
  name: string
  description: string
  start_date: Date | null
  end_date: Date | null
  application_deadline: Date | null
  tuition: number | null
  application_fee: number | null
  age_min: number | null
  age_max: number | null
  offers_scholarship: boolean
  application_url: string | null
  program_url: string | null
  instrument_names: string[]
  category_names: string[]
  location_ids: string[]
  reviews: ReviewSeed[]
  auditions: AuditionSeed[]
}

const PROGRAMS: ProgramSeed[] = [
  {
    id: '10000000-0000-0000-0000-000000000001',
    name: 'Salzburg Festival Young Singers Project',
    description:
      'An intensive summer residency for emerging opera singers at one of the world\'s most prestigious festivals. Participants work with leading coaches, conductors, and directors while preparing chamber concerts and masterclasses. Full stipend and housing provided.',
    start_date: new Date('2026-07-20'),
    end_date: new Date('2026-08-30'),
    application_deadline: new Date('2026-01-15'),
    tuition: 0,
    application_fee: 75,
    age_min: 22,
    age_max: 32,
    offers_scholarship: true,
    application_url: 'https://www.salzburgerfestspiele.at/en/young-singers-project/apply',
    program_url: 'https://www.salzburgerfestspiele.at/en/young-singers-project',
    instrument_names: ['Voice'],
    category_names: ['Opera', 'Art Song / Lieder'],
    location_ids: [LOC_SALZBURG],
    reviews: [
      {
        rating: 5,
        year_attended: 2024,
        reviewer_name: 'Soprano2024',
        title: 'Life-changing experience',
        body: 'The coaching was world-class and the festival atmosphere unforgettable. I left with new repertoire and real career connections.',
      },
      {
        rating: 4,
        year_attended: 2023,
        reviewer_name: 'BaritoneBerlin',
        title: 'Incredible but intense',
        body: 'Long days and high expectations, but the payoff is enormous. Be prepared to work hard and soak it all in.',
      },
      {
        rating: 5,
        year_attended: 2023,
        reviewer_name: null,
        title: 'Top tier',
        body: 'Absolutely the pinnacle of European young artist training. Highly recommended for any serious singer.',
      },
    ],
    auditions: [
      {
        location_id: LOC_SALZBURG,
        time_slot: new Date('2025-11-12T10:00:00Z'),
        audition_fee: 50,
        instructions:
          'Prepare five contrasting arias in at least three languages. One aria will be chosen from your list.',
        registration_url: 'https://www.salzburgerfestspiele.at/en/ysp/auditions',
        instrument_names: ['Voice'],
      },
      {
        location_id: LOC_GLYNDEBOURNE,
        time_slot: new Date('2025-12-03T11:00:00Z'),
        audition_fee: 50,
        instructions: 'Same repertoire requirements as Salzburg auditions. Accompanist provided.',
        registration_url: 'https://www.salzburgerfestspiele.at/en/ysp/auditions',
        instrument_names: ['Voice'],
      },
    ],
  },
  {
    id: '10000000-0000-0000-0000-000000000002',
    name: 'Aspen Music Festival and School',
    description:
      'A nine-week summer festival in the Rocky Mountains combining orchestral, chamber, and contemporary music training. Fellows perform alongside renowned faculty and guest artists across multiple ensembles. Robust scholarship support available.',
    start_date: new Date('2026-06-25'),
    end_date: new Date('2026-08-23'),
    application_deadline: new Date('2026-02-01'),
    tuition: 6500,
    application_fee: 110,
    age_min: 17,
    age_max: 30,
    offers_scholarship: true,
    application_url: 'https://www.aspenmusicfestival.com/apply',
    program_url: 'https://www.aspenmusicfestival.com',
    instrument_names: [
      'Violin',
      'Viola',
      'Cello',
      'Double Bass',
      'Flute',
      'Oboe',
      'Clarinet',
      'Bassoon',
      'French Horn',
      'Trumpet',
      'Trombone',
      'Tuba',
      'Piano',
      'Harp',
      'Percussion',
      'Composition',
      'Conducting',
    ],
    category_names: ['Orchestral', 'Chamber Music', 'Contemporary'],
    location_ids: [LOC_ASPEN],
    reviews: [
      {
        rating: 5,
        year_attended: 2024,
        reviewer_name: 'ViolaFellow',
        title: 'The best orchestra training I\'ve had',
        body: 'Multiple orchestras, top conductors, and a beautiful setting. The repertoire was challenging and rewarding.',
      },
      {
        rating: 4,
        year_attended: 2025,
        reviewer_name: 'CelloDreamer',
        title: 'Competitive but worth it',
        body: 'You earn your spot every week, but the rehearsal time and performance opportunities are unmatched in the US.',
      },
      {
        rating: 3,
        year_attended: 2023,
        reviewer_name: 'OboeWanderer',
        title: 'Expensive without scholarship',
        body: 'Great program but tuition and housing in Aspen add up fast. Apply early for financial aid.',
      },
    ],
    auditions: [
      {
        location_id: LOC_ASPEN,
        time_slot: new Date('2026-01-18T09:00:00Z'),
        audition_fee: 0,
        instructions: 'Submit recorded audition via portal. Live callbacks by invitation only.',
        registration_url: 'https://www.aspenmusicfestival.com/apply',
        instrument_names: ['Violin', 'Viola', 'Cello'],
      },
      {
        location_id: LOC_RAVINIA,
        time_slot: new Date('2026-01-25T13:00:00Z'),
        audition_fee: 0,
        instructions: 'Live auditions for winds and brass. 15-minute slots.',
        registration_url: 'https://www.aspenmusicfestival.com/apply',
        instrument_names: ['Flute', 'Oboe', 'Clarinet', 'French Horn'],
      },
    ],
  },
  {
    id: '10000000-0000-0000-0000-000000000003',
    name: 'Tanglewood Music Center',
    description:
      'The Boston Symphony Orchestra\'s summer academy for the most gifted young professional musicians. Fellows receive full tuition, room, and board while working with BSO players, guest conductors, and new music specialists. Orchestral, chamber, contemporary, and conducting tracks.',
    start_date: new Date('2026-06-21'),
    end_date: new Date('2026-08-16'),
    application_deadline: new Date('2025-12-09'),
    tuition: 0,
    application_fee: 125,
    age_min: 18,
    age_max: 30,
    offers_scholarship: true,
    application_url: 'https://www.bso.org/tmc/apply',
    program_url: 'https://www.bso.org/tmc',
    instrument_names: [
      'Violin',
      'Viola',
      'Cello',
      'Double Bass',
      'Flute',
      'Oboe',
      'Clarinet',
      'Bassoon',
      'French Horn',
      'Trumpet',
      'Trombone',
      'Tuba',
      'Piano',
      'Harp',
      'Percussion',
      'Composition',
      'Conducting',
      'Voice',
    ],
    category_names: ['Orchestral', 'Chamber Music', 'Contemporary'],
    location_ids: [LOC_TANGLEWOOD],
    reviews: [
      {
        rating: 5,
        year_attended: 2024,
        reviewer_name: 'TMCFellow24',
        title: 'Unrivaled fellowship',
        body: 'Full funding, BSO coachings, and the legacy of Bernstein all in one place. The Festival of Contemporary Music was a career highlight.',
      },
      {
        rating: 5,
        year_attended: 2023,
        reviewer_name: null,
        title: 'Transformative',
        body: 'Every day was musically demanding in the best way. The other fellows become lifelong collaborators.',
      },
      {
        rating: 4,
        year_attended: 2022,
        reviewer_name: 'HornPlayerNYC',
        title: 'Brutal schedule, brilliant results',
        body: 'Not for the faint of heart. The amount of music you play in eight weeks is staggering.',
      },
    ],
    auditions: [
      {
        location_id: LOC_TANGLEWOOD,
        time_slot: new Date('2026-01-10T10:00:00Z'),
        audition_fee: 50,
        instructions:
          'Recorded prescreen required. Live callbacks held at Symphony Hall in Boston.',
        registration_url: 'https://www.bso.org/tmc/apply',
        instrument_names: ['Violin', 'Viola', 'Cello', 'Double Bass'],
      },
      {
        location_id: LOC_TANGLEWOOD,
        time_slot: new Date('2026-01-17T10:00:00Z'),
        audition_fee: 50,
        instructions: 'Conducting fellowship live auditions. Candidates lead a reading session.',
        registration_url: 'https://www.bso.org/tmc/apply',
        instrument_names: ['Conducting'],
      },
      {
        location_id: LOC_ASPEN,
        time_slot: new Date('2026-01-24T10:00:00Z'),
        audition_fee: 50,
        instructions: 'West coast live audition day for winds, brass, and percussion.',
        registration_url: 'https://www.bso.org/tmc/apply',
        instrument_names: ['Flute', 'Clarinet', 'Trumpet', 'Percussion'],
      },
    ],
  },
  {
    id: '10000000-0000-0000-0000-000000000004',
    name: 'Santa Fe Opera Apprentice Program',
    description:
      'A prestigious summer residency for emerging opera singers integrated into Santa Fe Opera\'s main season. Apprentices cover principal roles, perform in scenes programs, and receive intensive language, movement, and coaching sessions. Stipend and housing provided.',
    start_date: new Date('2026-05-25'),
    end_date: new Date('2026-08-30'),
    application_deadline: new Date('2025-11-01'),
    tuition: 0,
    application_fee: 85,
    age_min: 21,
    age_max: 30,
    offers_scholarship: true,
    application_url: 'https://www.santafeopera.org/apprentice/apply',
    program_url: 'https://www.santafeopera.org/apprentice',
    instrument_names: ['Voice'],
    category_names: ['Opera'],
    location_ids: [LOC_SANTA_FE],
    reviews: [
      {
        rating: 5,
        year_attended: 2024,
        reviewer_name: 'MezzoInTheDesert',
        title: 'Dream summer',
        body: 'Rehearsing alongside mainstage principals while covering roles was a phenomenal learning curve. The company treats apprentices with respect.',
      },
      {
        rating: 4,
        year_attended: 2023,
        reviewer_name: 'TenorTrail',
        title: 'Incredible opportunity',
        body: 'The altitude is tough, but the coaching and performance opportunities outweigh any hardship.',
      },
    ],
    auditions: [
      {
        location_id: LOC_SANTA_FE,
        time_slot: new Date('2025-11-15T09:30:00Z'),
        audition_fee: 60,
        instructions: 'Prepare five arias in multiple languages. Pianist provided.',
        registration_url: 'https://www.santafeopera.org/apprentice/apply',
        instrument_names: ['Voice'],
      },
      {
        location_id: LOC_RAVINIA,
        time_slot: new Date('2025-11-22T09:30:00Z'),
        audition_fee: 60,
        instructions: 'Midwest audition tour stop. Same repertoire requirements.',
        registration_url: 'https://www.santafeopera.org/apprentice/apply',
        instrument_names: ['Voice'],
      },
    ],
  },
  {
    id: '10000000-0000-0000-0000-000000000005',
    name: 'Glyndebourne Young Artists Programme',
    description:
      'A year-round development programme culminating in the Glyndebourne Festival season. Young artists understudy principal roles, perform in the Tour, and receive coaching in period style, English diction, and stagecraft. Salaried position.',
    start_date: new Date('2026-05-10'),
    end_date: new Date('2026-08-25'),
    application_deadline: new Date('2025-10-15'),
    tuition: 0,
    application_fee: null,
    age_min: 22,
    age_max: 32,
    offers_scholarship: true,
    application_url: 'https://www.glyndebourne.com/young-artists/apply',
    program_url: 'https://www.glyndebourne.com/young-artists',
    instrument_names: ['Voice'],
    category_names: ['Opera', 'Baroque'],
    location_ids: [LOC_GLYNDEBOURNE],
    reviews: [
      {
        rating: 5,
        year_attended: 2024,
        reviewer_name: 'LondonSoprano',
        title: 'A benchmark programme',
        body: 'The coaching staff is world-class and the productions are genuinely beautiful. A salaried position makes a huge difference.',
      },
      {
        rating: 4,
        year_attended: 2023,
        reviewer_name: null,
        title: 'Top UK opportunity',
        body: 'Long season with real performance experience on the Tour. Worth every minute.',
      },
      {
        rating: 5,
        year_attended: 2022,
        reviewer_name: 'CountertenorUK',
        title: 'Unmatched in the UK',
        body: 'For any young singer working in Britain, this is the program to aim for.',
      },
    ],
    auditions: [
      {
        location_id: LOC_GLYNDEBOURNE,
        time_slot: new Date('2025-09-20T10:00:00Z'),
        audition_fee: 0,
        instructions:
          'Prepare four arias including one in English. Recalls held at Glyndebourne.',
        registration_url: 'https://www.glyndebourne.com/young-artists/apply',
        instrument_names: ['Voice'],
      },
      {
        location_id: LOC_AIX,
        time_slot: new Date('2025-10-04T10:00:00Z'),
        audition_fee: 0,
        instructions: 'Continental European audition day.',
        registration_url: 'https://www.glyndebourne.com/young-artists/apply',
        instrument_names: ['Voice'],
      },
    ],
  },
  {
    id: '10000000-0000-0000-0000-000000000006',
    name: "Académie du Festival d'Aix",
    description:
      "The Festival d'Aix-en-Provence's academy gathers young singers, instrumentalists, and composers for an immersive residency combining opera, art song, and baroque performance. Participants work with leading European artists and present public concerts.",
    start_date: new Date('2026-07-01'),
    end_date: new Date('2026-07-24'),
    application_deadline: new Date('2026-01-31'),
    tuition: 0,
    application_fee: 60,
    age_min: 20,
    age_max: 30,
    offers_scholarship: true,
    application_url: 'https://academie.festival-aix.com/apply',
    program_url: 'https://academie.festival-aix.com',
    instrument_names: ['Voice', 'Violin', 'Viola', 'Cello', 'Composition'],
    category_names: ['Opera', 'Art Song / Lieder', 'Baroque'],
    location_ids: [LOC_AIX],
    reviews: [
      {
        rating: 5,
        year_attended: 2024,
        reviewer_name: 'BaroqueFlute',
        title: 'Magical in Provence',
        body: 'Working with leading baroque specialists in such a stunning location was inspiring. The concert opportunities were real and public.',
      },
      {
        rating: 4,
        year_attended: 2023,
        reviewer_name: 'SongComposer',
        title: 'Fantastic collaborative lab',
        body: 'Composers and singers worked together on new art song cycles. Loved the cross-disciplinary approach.',
      },
    ],
    auditions: [
      {
        location_id: LOC_AIX,
        time_slot: new Date('2026-02-14T10:00:00Z'),
        audition_fee: 40,
        instructions: 'Prepare three contrasting works including one baroque.',
        registration_url: 'https://academie.festival-aix.com/apply',
        instrument_names: ['Voice', 'Violin'],
      },
      {
        location_id: LOC_SALZBURG,
        time_slot: new Date('2026-02-21T10:00:00Z'),
        audition_fee: 40,
        instructions: 'Alternate European audition site.',
        registration_url: 'https://academie.festival-aix.com/apply',
        instrument_names: ['Voice', 'Composition'],
      },
    ],
  },
  {
    id: '10000000-0000-0000-0000-000000000007',
    name: 'Spoleto Festival dei Due Mondi — Accademia',
    description:
      'An Italian summer residency combining opera scenes, chamber music, and masterclasses in the medieval hilltop town of Spoleto. Participants perform in the festival\'s public series and work with Italian conservatory faculty.',
    start_date: new Date('2026-06-26'),
    end_date: new Date('2026-07-14'),
    application_deadline: new Date('2026-03-01'),
    tuition: 1500,
    application_fee: 70,
    age_min: 20,
    age_max: 32,
    offers_scholarship: true,
    application_url: 'https://www.festivaldispoleto.com/accademia/apply',
    program_url: 'https://www.festivaldispoleto.com/accademia',
    instrument_names: ['Voice', 'Violin', 'Viola', 'Cello', 'Piano'],
    category_names: ['Opera', 'Chamber Music'],
    location_ids: [LOC_SPOLETO],
    reviews: [
      {
        rating: 4,
        year_attended: 2024,
        reviewer_name: 'PianistRoma',
        title: 'Beautiful and intimate',
        body: 'The town itself adds so much to the experience. Small cohort means lots of coaching time.',
      },
      {
        rating: 3,
        year_attended: 2023,
        reviewer_name: 'StringQuartetUS',
        title: 'Good but disorganized',
        body: 'Musical content was strong but logistics could use some polish. Still, a memorable summer.',
      },
    ],
    auditions: [
      {
        location_id: LOC_SPOLETO,
        time_slot: new Date('2026-03-15T10:00:00Z'),
        audition_fee: 50,
        instructions: 'Live or recorded audition. Italian repertoire encouraged.',
        registration_url: 'https://www.festivaldispoleto.com/accademia/apply',
        instrument_names: ['Voice', 'Piano'],
      },
      {
        location_id: LOC_AIX,
        time_slot: new Date('2026-03-22T10:00:00Z'),
        audition_fee: 50,
        instructions: 'Regional Europe audition stop.',
        registration_url: 'https://www.festivaldispoleto.com/accademia/apply',
        instrument_names: ['Violin', 'Cello'],
      },
    ],
  },
  {
    id: '10000000-0000-0000-0000-000000000008',
    name: 'Banff Centre — Evolution: Classical',
    description:
      'A Canadian mountain residency focused on chamber music and contemporary performance practice. Participants work with visiting ensembles, commission new works, and present recitals in the Banff Centre\'s concert halls.',
    start_date: new Date('2026-07-05'),
    end_date: new Date('2026-07-26'),
    application_deadline: new Date('2026-02-15'),
    tuition: 2500,
    application_fee: 65,
    age_min: 18,
    age_max: 30,
    offers_scholarship: true,
    application_url: 'https://www.banffcentre.ca/evolution-classical/apply',
    program_url: 'https://www.banffcentre.ca/evolution-classical',
    instrument_names: [
      'Violin',
      'Viola',
      'Cello',
      'Piano',
      'Clarinet',
      'Flute',
      'Percussion',
      'Composition',
    ],
    category_names: ['Chamber Music', 'Contemporary'],
    location_ids: [LOC_BANFF],
    reviews: [
      {
        rating: 5,
        year_attended: 2025,
        reviewer_name: 'NewMusicNerd',
        title: 'Inspiring new music hub',
        body: 'Incredible resources, the mountains, and a tight-knit community of composers and performers. Premiered two pieces.',
      },
      {
        rating: 4,
        year_attended: 2024,
        reviewer_name: 'QuartetCanada',
        title: 'Perfect for chamber players',
        body: 'Three weeks of deep work on rep of your choice plus coaching from touring ensembles. Hard to beat.',
      },
      {
        rating: 4,
        year_attended: 2023,
        reviewer_name: null,
        title: 'Worth the flights',
        body: 'Travel is a haul but once you\'re there it\'s magical.',
      },
    ],
    auditions: [
      {
        location_id: LOC_BANFF,
        time_slot: new Date('2026-02-25T17:00:00Z'),
        audition_fee: 0,
        instructions: 'Video submission only. No live audition.',
        registration_url: 'https://www.banffcentre.ca/evolution-classical/apply',
        instrument_names: ['Violin', 'Cello', 'Piano'],
      },
      {
        location_id: LOC_BANFF,
        time_slot: new Date('2026-03-04T17:00:00Z'),
        audition_fee: 0,
        instructions: 'Composer portfolio review round.',
        registration_url: 'https://www.banffcentre.ca/evolution-classical/apply',
        instrument_names: ['Composition'],
      },
    ],
  },
  {
    id: '10000000-0000-0000-0000-000000000009',
    name: 'Ravinia Steans Music Institute — Program for Piano & Strings',
    description:
      'A full-fellowship chamber music residency at Ravinia outside Chicago. Pianists and string players are matched into ensembles and coached intensively by leading chamber musicians, culminating in public performances.',
    start_date: new Date('2026-06-08'),
    end_date: new Date('2026-07-12'),
    application_deadline: new Date('2025-12-01'),
    tuition: 0,
    application_fee: 95,
    age_min: 18,
    age_max: 30,
    offers_scholarship: true,
    application_url: 'https://www.ravinia.org/rsmi/apply',
    program_url: 'https://www.ravinia.org/rsmi',
    instrument_names: ['Piano', 'Violin', 'Viola', 'Cello'],
    category_names: ['Chamber Music'],
    location_ids: [LOC_RAVINIA],
    reviews: [
      {
        rating: 5,
        year_attended: 2024,
        reviewer_name: 'PianoFellow',
        title: 'Gold standard for chamber music',
        body: 'Full fellowship, daily coachings, and frequent public performances. The mentorship is genuinely transformative.',
      },
      {
        rating: 5,
        year_attended: 2023,
        reviewer_name: 'ViolaQuartet',
        title: 'Intensive and rewarding',
        body: 'You leave with new rep, new collaborators, and a much deeper understanding of chamber music.',
      },
    ],
    auditions: [
      {
        location_id: LOC_RAVINIA,
        time_slot: new Date('2025-12-08T10:00:00Z'),
        audition_fee: 50,
        instructions: 'Live audition required. Two contrasting chamber music excerpts plus solo work.',
        registration_url: 'https://www.ravinia.org/rsmi/apply',
        instrument_names: ['Piano', 'Violin'],
      },
      {
        location_id: LOC_TANGLEWOOD,
        time_slot: new Date('2025-12-15T10:00:00Z'),
        audition_fee: 50,
        instructions: 'East coast live audition day.',
        registration_url: 'https://www.ravinia.org/rsmi/apply',
        instrument_names: ['Viola', 'Cello'],
      },
    ],
  },
  {
    id: '10000000-0000-0000-0000-000000000010',
    name: 'Brevard Music Center Summer Institute',
    description:
      'A multi-week summer institute in the North Carolina mountains offering orchestral, opera, and chamber music training for students and emerging professionals. Festival performances feature students alongside artist faculty across six weeks.',
    start_date: new Date('2026-06-20'),
    end_date: new Date('2026-08-09'),
    application_deadline: new Date('2026-01-20'),
    tuition: 7500,
    application_fee: 100,
    age_min: 14,
    age_max: 29,
    offers_scholarship: true,
    application_url: 'https://www.brevardmusic.org/apply',
    program_url: 'https://www.brevardmusic.org',
    instrument_names: [
      'Voice',
      'Violin',
      'Viola',
      'Cello',
      'Double Bass',
      'Flute',
      'Clarinet',
      'Trumpet',
      'Trombone',
      'Percussion',
      'Piano',
      'Conducting',
    ],
    category_names: ['Orchestral', 'Opera', 'Chamber Music'],
    location_ids: [LOC_BREVARD],
    reviews: [
      {
        rating: 4,
        year_attended: 2024,
        reviewer_name: 'HighSchoolViolin',
        title: 'Great first festival',
        body: 'Good mix of younger students and emerging pros. The orchestra repertoire was ambitious and satisfying.',
      },
      {
        rating: 3,
        year_attended: 2023,
        reviewer_name: 'OperaTenor',
        title: 'Solid but variable',
        body: 'Experience depended a lot on which program you were in. Opera was strong, some chamber groups less so.',
      },
      {
        rating: 5,
        year_attended: 2022,
        reviewer_name: 'ConductingFellow',
        title: 'Huge podium time',
        body: 'As a conducting fellow I got more rehearsal time than anywhere else I\'ve been.',
      },
    ],
    auditions: [
      {
        location_id: LOC_BREVARD,
        time_slot: new Date('2026-01-10T10:00:00Z'),
        audition_fee: 50,
        instructions: 'Recorded prescreen, live callbacks in Brevard.',
        registration_url: 'https://www.brevardmusic.org/apply',
        instrument_names: ['Violin', 'Cello', 'Flute'],
      },
      {
        location_id: LOC_BREVARD,
        time_slot: new Date('2026-01-17T10:00:00Z'),
        audition_fee: 50,
        instructions: 'Voice and opera program auditions.',
        registration_url: 'https://www.brevardmusic.org/apply',
        instrument_names: ['Voice'],
      },
    ],
  },
  {
    id: '10000000-0000-0000-0000-000000000011',
    name: 'Merola Opera Program',
    description:
      'A highly selective summer training program for young opera singers, apprentice coaches, and stage directors. Merolini perform in a signature Grand Finale concert and two fully staged productions while receiving coaching from leading industry professionals.',
    start_date: new Date('2026-06-01'),
    end_date: new Date('2026-08-22'),
    application_deadline: new Date('2025-11-05'),
    tuition: 0,
    application_fee: 85,
    age_min: 23,
    age_max: 30,
    offers_scholarship: true,
    application_url: 'https://merola.org/apply',
    program_url: 'https://merola.org',
    instrument_names: ['Voice', 'Piano'],
    category_names: ['Opera'],
    location_ids: [LOC_SANTA_FE],
    reviews: [
      {
        rating: 5,
        year_attended: 2024,
        reviewer_name: 'MerolaAlum',
        title: 'Career-launching',
        body: 'The network and coaching set me up for everything that followed. Grand Finale is unforgettable.',
      },
      {
        rating: 5,
        year_attended: 2023,
        reviewer_name: null,
        title: 'World-class training',
        body: 'Language coaches, acting teachers, and conductors who actually care about your development.',
      },
      {
        rating: 4,
        year_attended: 2022,
        reviewer_name: 'ApprenticeCoach',
        title: 'Especially strong for coaches',
        body: 'As an apprentice coach I gained repertoire and connections I still rely on.',
      },
    ],
    auditions: [
      {
        location_id: LOC_SANTA_FE,
        time_slot: new Date('2025-11-20T10:00:00Z'),
        audition_fee: 60,
        instructions: 'Five-aria list required. Some candidates advance to coaching rounds.',
        registration_url: 'https://merola.org/apply',
        instrument_names: ['Voice'],
      },
      {
        location_id: LOC_RAVINIA,
        time_slot: new Date('2025-11-27T10:00:00Z'),
        audition_fee: 60,
        instructions: 'Midwest audition stop.',
        registration_url: 'https://merola.org/apply',
        instrument_names: ['Voice', 'Piano'],
      },
    ],
  },
  {
    id: '10000000-0000-0000-0000-000000000012',
    name: 'AIMS Summer Vocal Academy',
    description:
      'An intensive six-week European summer vocal academy focusing on German operatic and lieder repertoire. Singers receive daily coaching, language lessons, and masterclasses, culminating in public concerts and a stage audition tour.',
    start_date: new Date('2026-06-15'),
    end_date: new Date('2026-07-27'),
    application_deadline: new Date('2026-03-10'),
    tuition: 3800,
    application_fee: 90,
    age_min: 20,
    age_max: 35,
    offers_scholarship: true,
    application_url: 'https://www.aims-yap.example.org/apply',
    program_url: 'https://www.aims-yap.example.org',
    instrument_names: ['Voice'],
    category_names: ['Opera', 'Art Song / Lieder'],
    location_ids: [LOC_SALZBURG],
    reviews: [
      {
        rating: 4,
        year_attended: 2024,
        reviewer_name: 'LiederLover',
        title: 'German immersion at its best',
        body: 'Daily German lessons plus lieder coaching made a measurable difference in my singing. Great social atmosphere too.',
      },
      {
        rating: 3,
        year_attended: 2023,
        reviewer_name: 'AmericanBaritone',
        title: 'Good value in Europe',
        body: 'Not as prestigious as some but the coaching quality was high and the tuition manageable with a scholarship.',
      },
    ],
    auditions: [
      {
        location_id: LOC_SALZBURG,
        time_slot: new Date('2026-03-18T10:00:00Z'),
        audition_fee: 40,
        instructions: 'Four arias including at least two in German.',
        registration_url: 'https://www.aims-yap.example.org/apply',
        instrument_names: ['Voice'],
      },
      {
        location_id: LOC_GLYNDEBOURNE,
        time_slot: new Date('2026-03-25T10:00:00Z'),
        audition_fee: 40,
        instructions: 'UK audition stop. Accompanist provided.',
        registration_url: 'https://www.aims-yap.example.org/apply',
        instrument_names: ['Voice'],
      },
    ],
  },
]

// ---------------------------------------------------------------------------
// Main seed
// ---------------------------------------------------------------------------

async function main() {
  console.log('Seeding instruments...')
  const instrumentIdByName = new Map<string, string>()
  for (const name of INSTRUMENT_NAMES) {
    const row = await prisma.instrument.upsert({
      where: { name },
      update: {},
      create: { name },
    })
    instrumentIdByName.set(name, row.id)
  }

  console.log('Seeding categories...')
  const categoryIdByName = new Map<string, string>()
  for (const name of CATEGORY_NAMES) {
    const row = await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    })
    categoryIdByName.set(name, row.id)
  }

  console.log('Seeding locations...')
  for (const loc of LOCATIONS) {
    await prisma.location.upsert({
      where: { id: loc.id },
      update: {
        city: loc.city,
        country: loc.country,
        state: loc.state,
        address: loc.address,
      },
      create: {
        id: loc.id,
        city: loc.city,
        country: loc.country,
        state: loc.state,
        address: loc.address,
      },
    })
  }

  console.log('Seeding programs...')
  for (const program of PROGRAMS) {
    await prisma.program.upsert({
      where: { id: program.id },
      update: {
        name: program.name,
        description: program.description,
        start_date: program.start_date,
        end_date: program.end_date,
        application_deadline: program.application_deadline,
        tuition: program.tuition,
        application_fee: program.application_fee,
        age_min: program.age_min,
        age_max: program.age_max,
        offers_scholarship: program.offers_scholarship,
        application_url: program.application_url,
        program_url: program.program_url,
      },
      create: {
        id: program.id,
        name: program.name,
        description: program.description,
        start_date: program.start_date,
        end_date: program.end_date,
        application_deadline: program.application_deadline,
        tuition: program.tuition,
        application_fee: program.application_fee,
        age_min: program.age_min,
        age_max: program.age_max,
        offers_scholarship: program.offers_scholarship,
        application_url: program.application_url,
        program_url: program.program_url,
      },
    })

    // Reset join rows for this program
    await prisma.programInstrument.deleteMany({ where: { program_id: program.id } })
    await prisma.programCategory.deleteMany({ where: { program_id: program.id } })
    await prisma.programLocation.deleteMany({ where: { program_id: program.id } })

    // Reset children (auditions have their own join rows)
    const existingAuditions = await prisma.audition.findMany({
      where: { program_id: program.id },
      select: { id: true },
    })
    if (existingAuditions.length > 0) {
      await prisma.auditionInstrument.deleteMany({
        where: { audition_id: { in: existingAuditions.map((a) => a.id) } },
      })
      await prisma.audition.deleteMany({ where: { program_id: program.id } })
    }
    await prisma.review.deleteMany({ where: { program_id: program.id } })

    // Program instruments
    for (const instrumentName of program.instrument_names) {
      const instrumentId = instrumentIdByName.get(instrumentName)
      if (!instrumentId) {
        console.warn(
          `  [warn] program "${program.name}" references unknown instrument "${instrumentName}"; skipping.`,
        )
        continue
      }
      await prisma.programInstrument.create({
        data: { program_id: program.id, instrument_id: instrumentId },
      })
    }

    // Program categories
    for (const categoryName of program.category_names) {
      const categoryId = categoryIdByName.get(categoryName)
      if (!categoryId) {
        console.warn(
          `  [warn] program "${program.name}" references unknown category "${categoryName}"; skipping.`,
        )
        continue
      }
      await prisma.programCategory.create({
        data: { program_id: program.id, category_id: categoryId },
      })
    }

    // Program locations
    for (const locationId of program.location_ids) {
      await prisma.programLocation.create({
        data: { program_id: program.id, location_id: locationId },
      })
    }

    // Reviews
    for (const review of program.reviews) {
      await prisma.review.create({
        data: {
          program_id: program.id,
          rating: review.rating,
          year_attended: review.year_attended,
          reviewer_name: review.reviewer_name,
          title: review.title,
          body: review.body,
        },
      })
    }

    // Auditions (with instrument join rows)
    for (const audition of program.auditions) {
      const created = await prisma.audition.create({
        data: {
          program_id: program.id,
          location_id: audition.location_id,
          time_slot: audition.time_slot,
          audition_fee: audition.audition_fee,
          instructions: audition.instructions,
          registration_url: audition.registration_url,
        },
      })
      for (const instrumentName of audition.instrument_names) {
        const instrumentId = instrumentIdByName.get(instrumentName)
        if (!instrumentId) continue
        await prisma.auditionInstrument.create({
          data: { audition_id: created.id, instrument_id: instrumentId },
        })
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Import sources — canonical URLs for the scraping pipeline
  // ---------------------------------------------------------------------------

  const importSources = [
    {
      name: 'Salzburg Festival Young Singers Project',
      url: 'https://www.salzburgfestival.at/young-singers-project',
      program_id: '10000000-0000-0000-0000-000000000001',
    },
    {
      name: 'Aspen Music Festival and School',
      url: 'https://www.aspenmusicfestival.com/school/',
      program_id: '10000000-0000-0000-0000-000000000002',
    },
    {
      name: 'Tanglewood Music Center',
      url: 'https://www.bso.org/tanglewood/tmc',
      program_id: '10000000-0000-0000-0000-000000000003',
    },
    {
      name: 'Santa Fe Opera Apprentice Program',
      url: 'https://www.santafeopera.org/about/apprentice-singers',
      program_id: '10000000-0000-0000-0000-000000000004',
    },
    {
      name: 'Glyndebourne Young Artists Programme',
      url: 'https://www.glyndebourne.com/discover/young-artists/',
      program_id: '10000000-0000-0000-0000-000000000005',
    },
    {
      name: "Académie du Festival d'Aix",
      url: 'https://festival-aix.com/en/academie',
      program_id: '10000000-0000-0000-0000-000000000006',
    },
    {
      name: 'Spoleto Festival dei Due Mondi — Accademia',
      url: 'https://www.festivaldispoleto.com/en/',
      program_id: '10000000-0000-0000-0000-000000000007',
    },
    {
      name: 'Banff Centre — Evolution: Classical',
      url: 'https://www.banffcentre.ca/programs/evolution-classical',
      program_id: '10000000-0000-0000-0000-000000000008',
    },
    {
      name: 'Ravinia Steans Music Institute',
      url: 'https://www.ravinia.org/page/steans',
      program_id: '10000000-0000-0000-0000-000000000009',
    },
    {
      name: 'Brevard Music Center Summer Institute',
      url: 'https://www.brevardmusic.org/summer-institute',
      program_id: '10000000-0000-0000-0000-000000000010',
    },
    {
      name: 'Merola Opera Program',
      url: 'https://merola.org/',
      program_id: '10000000-0000-0000-0000-000000000011',
    },
    {
      name: 'AIMS Summer Vocal Academy',
      url: 'https://www.aims.co.at/',
      program_id: '10000000-0000-0000-0000-000000000012',
    },
  ]

  for (const source of importSources) {
    await prisma.importSource.upsert({
      where: { url: source.url },
      create: {
        name: source.name,
        url: source.url,
        status: 'active',
        program_id: source.program_id,
      },
      update: {
        name: source.name,
        program_id: source.program_id,
      },
    })
  }

  const counts = {
    instruments: await prisma.instrument.count(),
    categories: await prisma.category.count(),
    locations: await prisma.location.count(),
    programs: await prisma.program.count(),
    reviews: await prisma.review.count(),
    auditions: await prisma.audition.count(),
    program_instruments: await prisma.programInstrument.count(),
    program_categories: await prisma.programCategory.count(),
    program_locations: await prisma.programLocation.count(),
    audition_instruments: await prisma.auditionInstrument.count(),
    import_sources: await prisma.importSource.count(),
  }
  console.log('Seed complete:', counts)
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
