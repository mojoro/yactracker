'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'

export interface CreateProgramState {
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

export async function createProgram(
  _prev: CreateProgramState | null,
  formData: FormData,
): Promise<CreateProgramState> {
  const str = (k: string) => (formData.get(k) as string)?.trim() || null
  const num = (k: string) => {
    const v = str(k)
    if (v === null) return null
    const n = Number(v)
    return Number.isFinite(n) ? n : null
  }
  const int = (k: string) => {
    const n = num(k)
    return n !== null ? Math.round(n) : null
  }
  const date = (k: string) => {
    const v = str(k)
    if (!v) return null
    const d = new Date(v)
    return Number.isNaN(d.getTime()) ? null : d
  }

  const name = str('name')
  if (!name) return { error: 'Program name is required.' }

  // Parse combobox selections
  const instrumentItems = parseComboboxItems(formData.get('instruments') as string)
  const categoryItems = parseComboboxItems(formData.get('categories') as string)
  const locationItems = parseComboboxItems(formData.get('locations') as string)

  let programId: string

  try {
    // Resolve instruments — validate existing, create new
    const instrumentIds: string[] = []
    for (const item of instrumentItems) {
      if (item.is_new) {
        // Check if already exists (case-insensitive) before creating
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

    // Resolve categories
    const categoryIds: string[] = []
    for (const item of categoryItems) {
      if (item.is_new) {
        const existing = await prisma.category.findFirst({
          where: { name: { equals: item.name, mode: 'insensitive' } },
          select: { id: true },
        })
        if (existing) {
          categoryIds.push(existing.id)
        } else {
          const created = await prisma.category.create({
            data: { name: item.name },
            select: { id: true },
          })
          categoryIds.push(created.id)
        }
      } else {
        const exists = await prisma.category.findUnique({
          where: { id: item.id },
          select: { id: true },
        })
        if (!exists) return { error: `Category not found: ${item.name}` }
        categoryIds.push(item.id)
      }
    }

    // Resolve locations — "City, Country" format for new items
    const locationIds: string[] = []
    for (const item of locationItems) {
      if (item.is_new) {
        // name is "City, Country"
        const parts = item.name.split(',').map((s) => s.trim())
        const city = parts[0]
        const country = parts[1]
        if (!city || !country) return { error: `Invalid location format: ${item.name}. Use "City, Country".` }

        const existing = await prisma.location.findFirst({
          where: {
            city: { equals: city, mode: 'insensitive' },
            country: { equals: country, mode: 'insensitive' },
          },
          select: { id: true },
        })
        if (existing) {
          locationIds.push(existing.id)
        } else {
          const created = await prisma.location.create({
            data: { city, country },
            select: { id: true },
          })
          locationIds.push(created.id)
        }
      } else {
        const exists = await prisma.location.findUnique({
          where: { id: item.id },
          select: { id: true },
        })
        if (!exists) return { error: `Location not found: ${item.name}` }
        locationIds.push(item.id)
      }
    }

    // Create program + join rows in a transaction
    const program = await prisma.$transaction(async (tx) => {
      const prog = await tx.program.create({
        data: {
          name,
          description: str('description'),
          start_date: date('start_date'),
          end_date: date('end_date'),
          application_deadline: date('application_deadline'),
          tuition: num('tuition'),
          application_fee: num('application_fee'),
          age_min: int('age_min'),
          age_max: int('age_max'),
          offers_scholarship: formData.get('offers_scholarship') === 'true',
          program_url: str('program_url'),
          application_url: str('application_url'),
        },
        select: { id: true },
      })

      if (instrumentIds.length > 0) {
        await tx.programInstrument.createMany({
          data: instrumentIds.map((instrument_id) => ({
            program_id: prog.id,
            instrument_id,
          })),
        })
      }

      if (categoryIds.length > 0) {
        await tx.programCategory.createMany({
          data: categoryIds.map((category_id) => ({
            program_id: prog.id,
            category_id,
          })),
        })
      }

      if (locationIds.length > 0) {
        await tx.programLocation.createMany({
          data: locationIds.map((location_id) => ({
            program_id: prog.id,
            location_id,
          })),
        })
      }

      return prog
    })

    programId = program.id
  } catch (e) {
    console.error('[public] createProgram failed:', e)
    return { error: e instanceof Error ? e.message : String(e) }
  }

  revalidatePath('/programs')
  revalidatePath('/')
  redirect(`/programs/${programId}`)
}
