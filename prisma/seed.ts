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

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

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
const LOC_BANFF = '00000000-0000-0000-0000-000000000008'
const LOC_RAVINIA = '00000000-0000-0000-0000-000000000009'
const LOC_BREVARD = '00000000-0000-0000-0000-000000000010'
const LOC_SAN_FRANCISCO = '00000000-0000-0000-0000-000000000011'
const LOC_GRAZ = '00000000-0000-0000-0000-000000000012'

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
    city: 'Lewes',
    country: 'United Kingdom',
    state: 'England',
    address: 'New Rd, Glyndebourne, Lewes BN8 5UU',
  },
  {
    id: LOC_AIX,
    city: 'Aix-en-Provence',
    country: 'France',
    state: null,
    address: "Palais de l'Ancien Archevêché, 13100 Aix-en-Provence",
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
    address: '365 Andante Ln, Brevard, NC 28712',
  },
  {
    id: LOC_SAN_FRANCISCO,
    city: 'San Francisco',
    country: 'United States',
    state: 'California',
    address: '301 Van Ness Ave, San Francisco, CA 94102',
  },
  {
    id: LOC_GRAZ,
    city: 'Graz',
    country: 'Austria',
    state: null,
    address: 'Leonhardstraße 15, 8010 Graz',
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
  // -------------------------------------------------------------------------
  // 1. Salzburg Festival Young Singers Project
  // Source: salzburgerfestspiele.at, creativefellowship.org
  // -------------------------------------------------------------------------
  {
    id: '10000000-0000-0000-0000-000000000001',
    name: 'Salzburg Festival Young Singers Project',
    description:
      'An intensive vocal training program held during the Salzburg Festival. Participants receive masterclasses in song interpretation, language coaching, and repertoire work alongside Festival artists. The residency culminates in a final concert with the Mozarteum Orchestra Salzburg. All participants receive a full scholarship including an honorarium, travel allowance, and accommodation, funded by the Kühne Foundation. Approximately 14-15 singers are selected from around 800 applicants.',
    start_date: new Date('2026-07-17'),
    end_date: new Date('2026-08-09'),
    application_deadline: new Date('2025-09-30'),
    tuition: 0,
    application_fee: null,
    age_min: null,
    age_max: 30,
    offers_scholarship: true,
    application_url: 'https://www.salzburgerfestspiele.at/en/young-singers-project',
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
        audition_fee: null,
        instructions:
          'Prepare five contrasting arias in at least three languages. One aria will be chosen from your list.',
        registration_url: 'https://www.salzburgerfestspiele.at/en/young-singers-project',
        instrument_names: ['Voice'],
      },
    ],
  },

  // -------------------------------------------------------------------------
  // 2. Aspen Music Festival and School
  // Source: aspenmusicfestival.com (programs, fees, costs, fellowships)
  // -------------------------------------------------------------------------
  {
    id: '10000000-0000-0000-0000-000000000002',
    name: 'Aspen Music Festival and School',
    description:
      'A premier summer festival and school in the Rocky Mountains, founded in 1949. Nearly 500 young musicians study and perform in four orchestras, opera productions, chamber music, and solo repertoire alongside world-class faculty. Over 400 events each summer. The school provides over $3 million in financial assistance annually, and all applicants are automatically considered for fellowship awards covering tuition, room, and board.',
    start_date: new Date('2026-06-24'),
    end_date: new Date('2026-08-23'),
    application_deadline: new Date('2025-12-15'),
    tuition: 6275,
    application_fee: 60,
    age_min: null,
    age_max: null,
    offers_scholarship: true,
    application_url: 'https://students.aspenmusicfestival.com/apply/',
    program_url: 'https://www.aspenmusicfestival.com',
    instrument_names: [
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
    ],
    category_names: ['Orchestral', 'Chamber Music', 'Opera', 'Contemporary'],
    location_ids: [LOC_ASPEN],
    reviews: [
      {
        rating: 5,
        year_attended: 2024,
        reviewer_name: 'ViolaFellow',
        title: "The best orchestra training I've had",
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
        registration_url: 'https://students.aspenmusicfestival.com/apply/',
        instrument_names: ['Violin', 'Viola', 'Cello'],
      },
      {
        location_id: LOC_RAVINIA,
        time_slot: new Date('2026-01-25T13:00:00Z'),
        audition_fee: 0,
        instructions: 'Live auditions for winds and brass. 15-minute slots.',
        registration_url: 'https://students.aspenmusicfestival.com/apply/',
        instrument_names: ['Flute', 'Oboe', 'Clarinet', 'French Horn'],
      },
    ],
  },

  // -------------------------------------------------------------------------
  // 3. Tanglewood Music Center
  // Source: bso.org/tmc (program, fees, fellowship, application)
  // -------------------------------------------------------------------------
  {
    id: '10000000-0000-0000-0000-000000000003',
    name: 'Tanglewood Music Center',
    description:
      "The Boston Symphony Orchestra's elite summer academy for emerging professional musicians. Fellows work with BSO musicians and perform under world-renowned conductors including Music Director Andris Nelsons. Tracks in orchestral, chamber, vocal arts, composition, and conducting. Full fellowship covers tuition, housing, meals, and a stipend. A $250 registration fee is due upon acceptance.",
    start_date: new Date('2026-06-26'),
    end_date: new Date('2026-08-17'),
    application_deadline: new Date('2025-12-09'),
    tuition: 0,
    application_fee: 75,
    age_min: 18,
    age_max: 35,
    offers_scholarship: true,
    application_url: 'https://tanglewood.getacceptd.com/',
    program_url: 'https://www.bso.org/tmc',
    instrument_names: [
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
        registration_url: 'https://tanglewood.getacceptd.com/',
        instrument_names: ['Violin', 'Viola', 'Cello', 'Double Bass'],
      },
      {
        location_id: LOC_TANGLEWOOD,
        time_slot: new Date('2026-01-17T10:00:00Z'),
        audition_fee: 50,
        instructions: 'Conducting fellowship live auditions. Candidates lead a reading session.',
        registration_url: 'https://tanglewood.getacceptd.com/',
        instrument_names: ['Conducting'],
      },
    ],
  },

  // -------------------------------------------------------------------------
  // 4. Santa Fe Opera Apprentice Program for Singers
  // Source: santafeopera.org, yaptracker.com
  // -------------------------------------------------------------------------
  {
    id: '10000000-0000-0000-0000-000000000004',
    name: 'Santa Fe Opera Apprentice Program for Singers',
    description:
      'An internationally recognized training program where approximately 45 emerging professional opera singers are chosen each season. Apprentices serve as the seasonal chorus, sing featured and supporting roles in main stage operas, and perform in dedicated Apprentice Scenes and an Apprentice Concert with the Santa Fe Opera Orchestra. This is a paid position under an AGMA contract with weekly compensation and a housing stipend.',
    start_date: new Date('2026-06-01'),
    end_date: new Date('2026-08-29'),
    application_deadline: new Date('2025-11-01'),
    tuition: 0,
    application_fee: null,
    age_min: null,
    age_max: null,
    offers_scholarship: false,
    application_url: 'https://www.santafeopera.org/company/singers/singers-application-info/',
    program_url: 'https://www.santafeopera.org/company/singers/',
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
        audition_fee: null,
        instructions: 'Prepare five arias in multiple languages. Pianist provided.',
        registration_url: 'https://www.santafeopera.org/company/singers/singers-application-info/',
        instrument_names: ['Voice'],
      },
    ],
  },

  // -------------------------------------------------------------------------
  // 5. Jerwood Young Artists at Glyndebourne
  // Source: glyndebourne.com, operawire.com (2026 cohort)
  // -------------------------------------------------------------------------
  {
    id: '10000000-0000-0000-0000-000000000005',
    name: 'Jerwood Young Artists at Glyndebourne',
    description:
      'An internal development programme selecting 4-5 exceptionally talented singers from the Glyndebourne Chorus each season. Jerwood Young Artists perform small roles, understudy main-stage productions, and receive career-focused mentorship from leading conductors, directors, and vocal coaches across the full Festival and Tour seasons. Funded by Jerwood Arts. Note: this is not an open-application programme — artists are selected internally from the Glyndebourne Chorus.',
    start_date: new Date('2026-04-01'),
    end_date: new Date('2026-08-31'),
    application_deadline: null,
    tuition: 0,
    application_fee: null,
    age_min: null,
    age_max: null,
    offers_scholarship: false,
    application_url: null,
    program_url: 'https://www.glyndebourne.com/about-us/talent-development/jerwood-young-artists/',
    instrument_names: ['Voice'],
    category_names: ['Opera'],
    location_ids: [LOC_GLYNDEBOURNE],
    reviews: [
      {
        rating: 5,
        year_attended: 2024,
        reviewer_name: 'LondonSoprano',
        title: 'A benchmark programme',
        body: 'The coaching staff is world-class and the productions are genuinely beautiful. Being part of both the Festival and Tour seasons was invaluable.',
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
        body: 'For any young singer working in Britain, this is the programme to aim for.',
      },
    ],
    auditions: [],
  },

  // -------------------------------------------------------------------------
  // 6. Académie du Festival d'Aix-en-Provence
  // Source: festival-aix.com, academie.festival-aix.com, yaptracker.com
  // -------------------------------------------------------------------------
  {
    id: '10000000-0000-0000-0000-000000000006',
    name: "Académie du Festival d'Aix-en-Provence",
    description:
      "An international training institution founded in 1998 under Pierre Boulez's leadership. The Académie runs separate Voice and Instrumental/Composition residencies during the Festival, gathering early and mid-career artists for intensive work with internationally renowned artists. All expenses including masterclasses, accommodation, and round-trip travel are covered by the Festival. No age limit — selection is based on career stage, not age.",
    start_date: new Date('2026-06-22'),
    end_date: new Date('2026-07-21'),
    application_deadline: new Date('2025-10-12'),
    tuition: 0,
    application_fee: null,
    age_min: null,
    age_max: null,
    offers_scholarship: true,
    application_url: 'https://festival-aix.com/en/formations/2026-voice-residency',
    program_url: 'https://festival-aix.com/academie',
    instrument_names: ['Voice', 'Piano', 'Composition', 'Conducting'],
    category_names: ['Opera', 'Art Song / Lieder'],
    location_ids: [LOC_AIX],
    reviews: [
      {
        rating: 5,
        year_attended: 2024,
        reviewer_name: 'VocalCoachParis',
        title: 'Magical in Provence',
        body: 'Working with leading specialists in such a stunning location was inspiring. The concert opportunities were real and public.',
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
        time_slot: new Date('2025-10-20T10:00:00Z'),
        audition_fee: null,
        instructions: 'Prepare three contrasting works. Details vary by residency track.',
        registration_url: 'https://festival-aix.com/en/formations/2026-voice-residency',
        instrument_names: ['Voice', 'Piano'],
      },
    ],
  },

  // -------------------------------------------------------------------------
  // 7. Banff Centre — Chamber Music
  // Source: banffcentre.ca (programs, chamber-music-2026)
  // Note: formerly "Evolution: Classical" (discontinued after 2023)
  // -------------------------------------------------------------------------
  {
    id: '10000000-0000-0000-0000-000000000008',
    name: 'Banff Centre for Arts and Creativity — Chamber Music',
    description:
      'A collaborative chamber music residency in the Canadian Rockies led by the Parker Quartet. Individual musicians and established ensembles work with visiting faculty in intensive coaching sessions and public performances. Full tuition scholarship is automatic for all arts participants. Additional financial aid is available for accommodation and meals. Participants should expect to pay approximately CAD $1,200 for room and board after scholarship.',
    start_date: new Date('2026-07-05'),
    end_date: new Date('2026-07-26'),
    application_deadline: new Date('2026-02-15'),
    tuition: 2500,
    application_fee: 50,
    age_min: 18,
    age_max: null,
    offers_scholarship: true,
    application_url: 'https://www.banffcentre.ca/programs/music/chamber-music-2026',
    program_url: 'https://www.banffcentre.ca/music',
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
        body: "Travel is a haul but once you're there it's magical.",
      },
    ],
    auditions: [
      {
        location_id: LOC_BANFF,
        time_slot: new Date('2026-02-25T17:00:00Z'),
        audition_fee: 0,
        instructions: 'Video submission only. No live audition.',
        registration_url: 'https://www.banffcentre.ca/programs/music/chamber-music-2026',
        instrument_names: ['Violin', 'Cello', 'Piano'],
      },
      {
        location_id: LOC_BANFF,
        time_slot: new Date('2026-03-04T17:00:00Z'),
        audition_fee: 0,
        instructions: 'Composer portfolio review round.',
        registration_url: 'https://www.banffcentre.ca/programs/music/chamber-music-2026',
        instrument_names: ['Composition'],
      },
    ],
  },

  // -------------------------------------------------------------------------
  // 8. Steans Music Institute at Ravinia
  // Source: ravinia.org/programs/steans (programs, applications)
  // -------------------------------------------------------------------------
  {
    id: '10000000-0000-0000-0000-000000000009',
    name: 'Steans Music Institute at Ravinia',
    description:
      'An international training institute offering full-fellowship programs for exceptional emerging professional musicians. The Program for Piano and Strings features intensive chamber music coaching, while the separate Program for Singers focuses on art song and vocal repertoire. All fellows receive full tuition, accommodations, and meal service at no cost. No application fee.',
    start_date: new Date('2026-06-21'),
    end_date: new Date('2026-08-22'),
    application_deadline: new Date('2025-12-01'),
    tuition: 0,
    application_fee: 0,
    age_min: 17,
    age_max: 30,
    offers_scholarship: true,
    application_url: 'https://www.ravinia.org/programs/steans/applications',
    program_url: 'https://www.ravinia.org/programs/steans',
    instrument_names: ['Piano', 'Violin', 'Viola', 'Cello', 'Voice'],
    category_names: ['Chamber Music', 'Art Song / Lieder'],
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
        audition_fee: 0,
        instructions: 'Live audition required. Two contrasting chamber music excerpts plus solo work.',
        registration_url: 'https://www.ravinia.org/programs/steans/applications',
        instrument_names: ['Piano', 'Violin'],
      },
      {
        location_id: LOC_RAVINIA,
        time_slot: new Date('2025-12-15T10:00:00Z'),
        audition_fee: 0,
        instructions: 'Program for Singers auditions. Art song repertoire required.',
        registration_url: 'https://www.ravinia.org/programs/steans/applications',
        instrument_names: ['Voice'],
      },
    ],
  },

  // -------------------------------------------------------------------------
  // 9. Brevard Music Center Summer Institute
  // Source: brevardmusic.org (institute, college programs, opera)
  // -------------------------------------------------------------------------
  {
    id: '10000000-0000-0000-0000-000000000010',
    name: 'Brevard Music Center Summer Institute',
    description:
      'A comprehensive summer music festival and training institute in the Blue Ridge Mountains. Programs include orchestral studies, opera (Janiec Opera Company), composition, and jazz for college-age and high school students. Tuition includes housing, meals, health services, and concert admission. Over 80% of students receive scholarship support through merit-based, need-based, and opportunity scholarships.',
    start_date: new Date('2026-06-01'),
    end_date: new Date('2026-08-03'),
    application_deadline: new Date('2026-01-20'),
    tuition: 9400,
    application_fee: 65,
    age_min: 14,
    age_max: 29,
    offers_scholarship: true,
    application_url: 'https://www.brevardmusic.org/institute/',
    program_url: 'https://www.brevardmusic.org',
    instrument_names: [
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
      'Percussion',
      'Piano',
      'Harp',
      'Conducting',
      'Composition',
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
        body: "As a conducting fellow I got more rehearsal time than anywhere else I've been.",
      },
    ],
    auditions: [
      {
        location_id: LOC_BREVARD,
        time_slot: new Date('2026-01-10T10:00:00Z'),
        audition_fee: 50,
        instructions: 'Recorded prescreen, live callbacks in Brevard.',
        registration_url: 'https://www.brevardmusic.org/institute/',
        instrument_names: ['Violin', 'Cello', 'Flute'],
      },
      {
        location_id: LOC_BREVARD,
        time_slot: new Date('2026-01-17T10:00:00Z'),
        audition_fee: 50,
        instructions: 'Voice and opera program auditions.',
        registration_url: 'https://www.brevardmusic.org/institute/',
        instrument_names: ['Voice'],
      },
    ],
  },

  // -------------------------------------------------------------------------
  // 10. Merola Opera Program
  // Source: merola.org, sfopera.com/training/merola
  // CORRECTED: location is San Francisco, not Santa Fe
  // -------------------------------------------------------------------------
  {
    id: '10000000-0000-0000-0000-000000000011',
    name: 'Merola Opera Program',
    description:
      "San Francisco Opera's prestigious young artist training program. An intensive summer of coaching, masterclasses, and professional-quality opera productions, entirely free of charge. Participants receive a weekly stipend, round-trip transportation to San Francisco, and shared housing. Uniquely among young artist programs, Merola provides five years of post-program financial support for career development expenses. Approximately 28 artists are selected from over 1,500 applicants annually.",
    start_date: new Date('2026-06-04'),
    end_date: new Date('2026-08-15'),
    application_deadline: new Date('2025-11-05'),
    tuition: 0,
    application_fee: null,
    age_min: 20,
    age_max: 34,
    offers_scholarship: true,
    application_url: 'https://merola.org/apply/',
    program_url: 'https://merola.org',
    instrument_names: ['Voice', 'Piano'],
    category_names: ['Opera'],
    location_ids: [LOC_SAN_FRANCISCO],
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
        location_id: LOC_SAN_FRANCISCO,
        time_slot: new Date('2025-11-20T10:00:00Z'),
        audition_fee: null,
        instructions: 'Five-aria list required. Some candidates advance to coaching rounds.',
        registration_url: 'https://merola.org/apply/',
        instrument_names: ['Voice'],
      },
      {
        location_id: LOC_RAVINIA,
        time_slot: new Date('2025-11-27T10:00:00Z'),
        audition_fee: null,
        instructions: 'Midwest audition stop.',
        registration_url: 'https://merola.org/apply/',
        instrument_names: ['Voice', 'Piano'],
      },
    ],
  },

  // -------------------------------------------------------------------------
  // 11. American Institute of Musical Studies (AIMS)
  // Source: aimsgraz.com (program, voice, orchestra, fund-your-experience)
  // CORRECTED: location is Graz, not Salzburg
  // -------------------------------------------------------------------------
  {
    id: '10000000-0000-0000-0000-000000000012',
    name: 'American Institute of Musical Studies (AIMS)',
    description:
      'An intensive six-week summer program in Graz, Austria for singers, collaborative pianists, and orchestral musicians. International faculty lead training in opera, Lieder, and performance practice through the Opera Studio and Lieder Studio tracks. The AIMS Festival Orchestra is tuition-free and includes housing, meals, and German language classes. Vocal and piano program scholarships of 5-50% of tuition are available based on audition results. Operating annually since 1969.',
    start_date: new Date('2026-07-06'),
    end_date: new Date('2026-08-16'),
    application_deadline: new Date('2026-04-15'),
    tuition: 7500,
    application_fee: 250,
    age_min: 18,
    age_max: null,
    offers_scholarship: true,
    application_url: 'https://app.getacceptd.com/aims',
    program_url: 'https://aimsgraz.com',
    instrument_names: [
      'Voice',
      'Piano',
      'Violin',
      'Viola',
      'Cello',
      'Flute',
      'Oboe',
      'Clarinet',
      'French Horn',
      'Trumpet',
      'Trombone',
      'Tuba',
      'Percussion',
      'Harp',
    ],
    category_names: ['Opera', 'Art Song / Lieder', 'Orchestral'],
    location_ids: [LOC_GRAZ],
    reviews: [
      {
        rating: 4,
        year_attended: 2024,
        reviewer_name: 'LiederLover',
        title: 'German immersion at its best',
        body: 'Daily German lessons plus Lieder coaching made a measurable difference in my singing. Great social atmosphere too.',
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
        location_id: LOC_GRAZ,
        time_slot: new Date('2026-03-18T10:00:00Z'),
        audition_fee: null,
        instructions: 'Four arias including at least two in German.',
        registration_url: 'https://app.getacceptd.com/aims',
        instrument_names: ['Voice'],
      },
    ],
  },
]

// ---------------------------------------------------------------------------
// Main seed
// ---------------------------------------------------------------------------

async function main() {
  // Clean slate — wipe all program-related data before re-seeding
  console.log('Cleaning existing data...')
  await prisma.programCandidate.deleteMany()
  await prisma.importRun.deleteMany()
  await prisma.importSource.deleteMany()
  await prisma.auditionInstrument.deleteMany()
  await prisma.audition.deleteMany()
  await prisma.review.deleteMany()
  await prisma.programInstrument.deleteMany()
  await prisma.programCategory.deleteMany()
  await prisma.programLocation.deleteMany()
  await prisma.programProduction.deleteMany()
  await prisma.program.deleteMany()

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
    const slug = toSlug(program.name)

    await prisma.program.upsert({
      where: { id: program.id },
      update: {
        name: program.name,
        slug,
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
        slug,
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

    // Reviews skipped — production seed starts with 0 reviews

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

  // Multiple sources per program allow the scraping pipeline to combine
  // information from several pages into one complete extraction.
  const importSources = [
    // --- Salzburg YSP ---
    { name: 'Salzburg YSP — Main', url: 'https://www.salzburgerfestspiele.at/en/young-singers-project', program_id: '10000000-0000-0000-0000-000000000001' },
    { name: 'Salzburg YSP — Talent Development', url: 'https://www.salzburgerfestspiele.at/en/talent-development', program_id: '10000000-0000-0000-0000-000000000001' },

    // --- Aspen ---
    { name: 'Aspen — Programs of Study', url: 'https://www.aspenmusicfestival.com/students-welcome/admissions/programs-of-study/', program_id: '10000000-0000-0000-0000-000000000002' },
    { name: 'Aspen — Fees & Deadlines', url: 'https://www.aspenmusicfestival.com/students-welcome/admissions/application-fees-and-deadlines', program_id: '10000000-0000-0000-0000-000000000002' },
    { name: 'Aspen — Costs & Payment', url: 'https://www.aspenmusicfestival.com/students-welcome/admissions/costs-payment-and-refund-policy', program_id: '10000000-0000-0000-0000-000000000002' },
    { name: 'Aspen — Fellowships', url: 'https://www.aspenmusicfestival.com/students-welcome/admissions/fellowships-and-financial-assistance', program_id: '10000000-0000-0000-0000-000000000002' },

    // --- TMC ---
    { name: 'TMC — Main', url: 'https://www.bso.org/tmc', program_id: '10000000-0000-0000-0000-000000000003' },
    { name: 'TMC — Fees & Requirements', url: 'https://www.bso.org/tmc/program-fees-and-requirements', program_id: '10000000-0000-0000-0000-000000000003' },
    { name: 'TMC — Fellowships', url: 'https://www.bso.org/tmc/fellowship-programs', program_id: '10000000-0000-0000-0000-000000000003' },

    // --- Santa Fe Opera ---
    { name: 'Santa Fe Opera — Singers', url: 'https://www.santafeopera.org/company/singers/', program_id: '10000000-0000-0000-0000-000000000004' },
    { name: 'Santa Fe Opera — Application Info', url: 'https://www.santafeopera.org/company/singers/singers-application-info/', program_id: '10000000-0000-0000-0000-000000000004' },

    // --- Glyndebourne ---
    { name: 'Glyndebourne — Jerwood Young Artists', url: 'https://www.glyndebourne.com/about-us/talent-development/jerwood-young-artists/', program_id: '10000000-0000-0000-0000-000000000005' },

    // --- Aix ---
    { name: 'Aix — Académie', url: 'https://festival-aix.com/academie', program_id: '10000000-0000-0000-0000-000000000006' },
    { name: 'Aix — 2026 Voice Residency', url: 'https://festival-aix.com/en/formations/2026-voice-residency', program_id: '10000000-0000-0000-0000-000000000006' },

    // --- Banff ---
    { name: 'Banff — Music Programs', url: 'https://www.banffcentre.ca/music', program_id: '10000000-0000-0000-0000-000000000008' },
    { name: 'Banff — Chamber Music 2026', url: 'https://www.banffcentre.ca/programs/music/chamber-music-2026', program_id: '10000000-0000-0000-0000-000000000008' },

    // --- Ravinia ---
    { name: 'Ravinia — Steans Institute', url: 'https://www.ravinia.org/programs/steans', program_id: '10000000-0000-0000-0000-000000000009' },
    { name: 'Ravinia — Applications', url: 'https://www.ravinia.org/programs/steans/applications', program_id: '10000000-0000-0000-0000-000000000009' },

    // --- Brevard ---
    { name: 'Brevard — Institute', url: 'https://www.brevardmusic.org/institute/', program_id: '10000000-0000-0000-0000-000000000010' },
    { name: 'Brevard — Opera', url: 'https://www.brevardmusic.org/institute/college/opera/', program_id: '10000000-0000-0000-0000-000000000010' },

    // --- Merola ---
    { name: 'Merola — Main', url: 'https://merola.org', program_id: '10000000-0000-0000-0000-000000000011' },
    { name: 'Merola — Apply', url: 'https://merola.org/apply/', program_id: '10000000-0000-0000-0000-000000000011' },
    { name: 'Merola — SF Opera', url: 'https://www.sfopera.com/training/merola/', program_id: '10000000-0000-0000-0000-000000000011' },

    // --- AIMS ---
    { name: 'AIMS — Main', url: 'https://aimsgraz.com', program_id: '10000000-0000-0000-0000-000000000012' },
    { name: 'AIMS — The Program', url: 'https://aimsgraz.com/the-program/', program_id: '10000000-0000-0000-0000-000000000012' },
    { name: 'AIMS — Voice', url: 'https://aimsgraz.com/the-program/voice/', program_id: '10000000-0000-0000-0000-000000000012' },
    { name: 'AIMS — Fund Your Experience', url: 'https://aimsgraz.com/the-program/fund-your-experience/', program_id: '10000000-0000-0000-0000-000000000012' },
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
