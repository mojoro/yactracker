export interface CursorPageMeta {
  next: string | null
  prev: string | null
  total_items: number
}

export interface ListResponse<T> {
  items: T[]
  meta: CursorPageMeta
}

export interface BareListResponse<T> {
  items: T[]
}

export interface Instrument {
  id: string
  name: string
}

/** Sort instruments alphabetically with "Voice" pinned first. */
export function sortInstruments<T extends { name: string }>(items: T[]): T[] {
  return items.toSorted((a, b) => {
    if (a.name === 'Voice') return -1
    if (b.name === 'Voice') return 1
    return a.name.localeCompare(b.name)
  })
}

export interface Category {
  id: string
  name: string
}

export interface Location {
  id: string
  city: string
  country: string
  state: string | null
  address: string | null
}

export interface Program {
  id: string
  slug: string
  name: string
  description: string | null
  start_date: string | null
  end_date: string | null
  application_deadline: string | null
  tuition: number | null
  application_fee: number | null
  age_min: number | null
  age_max: number | null
  offers_scholarship: boolean
  application_url: string | null
  program_url: string | null
  average_rating: number | null
  review_count: number
  instruments: Instrument[]
  categories: Category[]
  locations: Location[]
  created_at: string
  updated_at: string
}

export interface Review {
  id: string
  program_id: string
  rating: number
  year_attended: number | null
  reviewer_name: string | null
  title: string | null
  body: string
  helpful_count: number
  created_at: string
  updated_at: string
}

export interface Audition {
  id: string
  program_id: string
  location_id: string
  location: Location
  time_slot: string | null
  audition_fee: number | null
  instructions: string | null
  registration_url: string | null
  instruments: Instrument[]
  created_at: string
  updated_at: string
}

export interface Production {
  id: string
  title: string
  composer: string | null
}

export interface Problem {
  type: string
  title: string
  status: number
  detail?: string
  instance?: string
}
