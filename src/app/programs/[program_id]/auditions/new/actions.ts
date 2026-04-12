'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'

export interface CreateAuditionState {
  error?: string
}

interface ComboboxItem {
  id: string
  name: string
  is_new: boolean
}

function parseComboboxItems(raw: string | null): ComboboxItem[] {
  if (!raw) return []
  try {
    const arr = JSON.parse(raw)
    if (!Array.isArray(arr)) return []
    return arr.filter(
      (item: unknown): item is ComboboxItem =>
        typeof item === 'object' &&
        item !== null &&
        'id' in item &&
        'name' in item &&
        'is_new' in item,
    )
  } catch {
    return []
  }
}

export async function createAudition(
  _prev: CreateAuditionState | null,
  formData: FormData,
): Promise<CreateAuditionState> {
  const str = (k: string) => (formData.get(k) as string)?.trim() || null

  // Honeypot
  if (str('url_confirm')) return { error: '' }

  const programId = formData.get('program_id') as string
  if (!programId) return { error: 'Missing program ID.' }

  // Verify program exists
  const program = await prisma.program.findUnique({
    where: { id: programId },
    select: { id: true },
  })
  if (!program) return { error: 'Program not found.' }

  const num = (k: string) => {
    const v = str(k)
    if (v === null) return null
    const n = Number(v)
    return Number.isFinite(n) ? n : null
  }

  const auditionFee = num('audition_fee')
  if (auditionFee !== null && auditionFee < 0) return { error: 'Audition fee cannot be negative.' }

  const instructions = str('instructions')
  if (instructions && instructions.length > 5000) return { error: 'Instructions too long (max 5000 characters).' }

  const registrationUrl = str('registration_url')
  if (registrationUrl && !/^https?:\/\//.test(registrationUrl)) return { error: 'Registration URL must start with http:// or https://.' }
  if (registrationUrl && registrationUrl.length > 2000) return { error: 'Registration URL is too long.' }

  // Location — required, single selection
  const locationItems = parseComboboxItems(formData.get('location') as string)
  if (locationItems.length === 0) return { error: 'Location is required.' }
  const locItem = locationItems[0]

  let locationId: string
  if (locItem.is_new) {
    const parts = locItem.name.split(',').map((s) => s.trim())
    const city = parts[0]
    const country = parts[1]
    if (!city || !country) return { error: `Invalid location format: ${locItem.name}. Use "City, Country".` }

    const existing = await prisma.location.findFirst({
      where: {
        city: { equals: city, mode: 'insensitive' },
        country: { equals: country, mode: 'insensitive' },
      },
      select: { id: true },
    })
    if (existing) {
      locationId = existing.id
    } else {
      const created = await prisma.location.create({
        data: { city, country },
        select: { id: true },
      })
      locationId = created.id
    }
  } else {
    const exists = await prisma.location.findUnique({
      where: { id: locItem.id },
      select: { id: true },
    })
    if (!exists) return { error: `Location not found: ${locItem.name}` }
    locationId = locItem.id
  }

  // Instruments
  const instrumentItems = parseComboboxItems(formData.get('instruments') as string)
  for (const item of [...instrumentItems, locItem]) {
    if (!item.name.trim()) return { error: 'Empty names are not allowed.' }
    if (item.name.length > 100) return { error: `Name too long: "${item.name.slice(0, 30)}..." (max 100 characters).` }
  }
  const instrumentIds: string[] = []
  for (const item of instrumentItems) {
    if (item.is_new) {
      const existing = await prisma.instrument.findFirst({
        where: { name: { equals: item.name, mode: 'insensitive' } },
        select: { id: true },
      })
      if (existing) {
        instrumentIds.push(existing.id)
      } else {
        const created = await prisma.instrument.create({
          data: { name: item.name },
          select: { id: true },
        })
        instrumentIds.push(created.id)
      }
    } else {
      const exists = await prisma.instrument.findUnique({
        where: { id: item.id },
        select: { id: true },
      })
      if (!exists) return { error: `Instrument not found: ${item.name}` }
      instrumentIds.push(item.id)
    }
  }

  // Time slot
  const timeSlotStr = str('time_slot')
  let timeSlot: Date | null = null
  if (timeSlotStr) {
    const d = new Date(timeSlotStr)
    if (Number.isNaN(d.getTime())) return { error: 'Invalid time slot.' }
    timeSlot = d
  }

  try {
    await prisma.$transaction(async (tx) => {
      const audition = await tx.audition.create({
        data: {
          program_id: programId,
          location_id: locationId,
          time_slot: timeSlot,
          audition_fee: auditionFee,
          instructions,
          registration_url: registrationUrl,
        },
        select: { id: true },
      })
      if (instrumentIds.length > 0) {
        await tx.auditionInstrument.createMany({
          data: instrumentIds.map((instrument_id) => ({
            audition_id: audition.id,
            instrument_id,
          })),
        })
      }
    })
  } catch (e) {
    console.error('[public] createAudition failed:', e)
    return { error: e instanceof Error ? e.message : String(e) }
  }

  revalidatePath(`/programs/${programId}`)
  revalidatePath('/programs')
  redirect(`/programs/${programId}`)
}
