import { z } from 'zod'

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1/chat/completions'
const DEFAULT_MODEL = 'anthropic/claude-haiku-4.5'

function getApiKey(): string {
  const key = process.env.OPENROUTER_API_KEY
  if (!key) throw new Error('OPENROUTER_API_KEY is not set')
  return key
}

// ---------------------------------------------------------------------------
// Extracted program schema (names, not UUIDs — resolved in Phase 5D)
// ---------------------------------------------------------------------------

const extractedLocationSchema = z.object({
  city: z.string(),
  country: z.string(),
  state: z.string().nullable().default(null),
})

const extractedAuditionSchema = z.object({
  city: z.string(),
  country: z.string(),
  time_slot: z.string().nullable().default(null),
  audition_fee: z.number().nullable().default(null),
  instructions: z.string().nullable().default(null),
  registration_url: z.string().url().nullable().default(null),
  instruments: z.array(z.string()).default([]),
})

export const extractedProgramSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable().default(null),
  start_date: z.string().nullable().default(null),
  end_date: z.string().nullable().default(null),
  application_deadline: z.string().nullable().default(null),
  tuition: z.number().nullable().default(null),
  application_fee: z.number().nullable().default(null),
  age_min: z.number().int().nullable().default(null),
  age_max: z.number().int().nullable().default(null),
  offers_scholarship: z.boolean().default(false),
  application_url: z.string().url().nullable().default(null),
  program_url: z.string().url().nullable().default(null),
  instruments: z.array(z.string()).default([]),
  categories: z.array(z.string()).default([]),
  locations: z.array(extractedLocationSchema).default([]),
  auditions: z.array(extractedAuditionSchema).default([]),
})

export type ExtractedProgram = z.infer<typeof extractedProgramSchema>

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------

export interface ExtractionSuccess {
  kind: 'success'
  program: ExtractedProgram
  confidence: number
  model: string
  tokens_in: number
  tokens_out: number
}

export interface ExtractionFailure {
  kind: 'error'
  message: string
  model: string | null
  tokens_in: number
  tokens_out: number
}

export type ExtractionResult = ExtractionSuccess | ExtractionFailure

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are a structured data extractor for YACTracker, a directory of Young Artist Programs (YAPs) in classical music and opera.

Given the HTML of a program's webpage, extract all available information into a JSON object. Follow these rules:

1. **name**: The official program name. Required.
2. **description**: A concise summary of the program (1-3 sentences). Do not copy entire paragraphs of marketing text.
3. **Dates**: Use ISO 8601 format (YYYY-MM-DD). If only a month/year is given, use the 1st of that month. If no year, assume the next occurrence.
4. **Tuition & fees**: In USD. If listed in another currency, convert approximately and note the original in description. If "free" or "no tuition", use 0.
5. **Age range**: Extract age_min and age_max if stated. Phrases like "18-30" → age_min: 18, age_max: 30. "18+" → age_min: 18, age_max: null.
6. **instruments**: List instrument names as they map to standard orchestral/vocal categories: Voice, Violin, Viola, Cello, Double Bass, Flute, Oboe, Clarinet, Bassoon, French Horn, Trumpet, Trombone, Tuba, Piano, Harp, Percussion, Composition, Conducting. Use these canonical names when possible.
7. **categories**: Classify the program into one or more of: Opera, Orchestral, Chamber Music, Art Song / Lieder, Musical Theatre, Baroque, Contemporary, Choral.
8. **locations**: Extract city + country (+ US state if applicable) for where the program takes place.
9. **auditions**: If audition information is on the page, extract each audition with its city, country, date/time, fee, and which instruments.
10. **URLs**: Extract application_url and program_url if present. Use absolute URLs.
11. **confidence**: Rate 0.0 to 1.0 how confident you are that the extraction is accurate and complete. Below 0.5 means the page likely isn't a YAP program page.

If the page clearly is not a young artist program (e.g. a 404 page, a generic homepage, an unrelated site), return:
\`\`\`json
{"name": "", "confidence": 0.0}
\`\`\`

Respond with ONLY valid JSON matching the schema. No markdown fences, no commentary.`

// ---------------------------------------------------------------------------
// Main extraction function
// ---------------------------------------------------------------------------

/**
 * Send raw HTML to OpenRouter and extract structured program data.
 *
 * The HTML is trimmed to the first ~100k characters to stay within token
 * limits. Most YAP program pages are well under this.
 */
export async function extractProgram(
  html: string,
  opts?: { model?: string },
): Promise<ExtractionResult> {
  const model = opts?.model ?? DEFAULT_MODEL
  const trimmedHtml = html.slice(0, 100_000)

  let apiKey: string
  try {
    apiKey = getApiKey()
  } catch (e) {
    return {
      kind: 'error',
      message: e instanceof Error ? e.message : String(e),
      model: null,
      tokens_in: 0,
      tokens_out: 0,
    }
  }

  let body: OpenRouterResponse
  try {
    const res = await fetch(OPENROUTER_BASE_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://yactracker.com',
        'X-Title': 'YACTracker Import Pipeline',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: `Extract program information from this HTML:\n\n${trimmedHtml}`,
          },
        ],
        temperature: 0,
        response_format: { type: 'json_object' },
      }),
    })

    if (!res.ok) {
      const text = await res.text()
      return {
        kind: 'error',
        message: `OpenRouter API ${res.status}: ${text.slice(0, 500)}`,
        model,
        tokens_in: 0,
        tokens_out: 0,
      }
    }

    body = (await res.json()) as OpenRouterResponse
  } catch (e) {
    return {
      kind: 'error',
      message: `OpenRouter request failed: ${e instanceof Error ? e.message : String(e)}`,
      model,
      tokens_in: 0,
      tokens_out: 0,
    }
  }

  const tokens_in = body.usage?.prompt_tokens ?? 0
  const tokens_out = body.usage?.completion_tokens ?? 0
  const raw = body.choices?.[0]?.message?.content

  if (!raw) {
    return {
      kind: 'error',
      message: 'OpenRouter returned no content in response',
      model,
      tokens_in,
      tokens_out,
    }
  }

  // Parse and validate the JSON output
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return {
      kind: 'error',
      message: `Failed to parse LLM JSON: ${raw.slice(0, 200)}`,
      model,
      tokens_in,
      tokens_out,
    }
  }

  // Check for low-confidence "not a program" response
  const maybeEmpty = parsed as { name?: string; confidence?: number }
  if (maybeEmpty.name === '' || (maybeEmpty.confidence !== undefined && maybeEmpty.confidence < 0.1)) {
    return {
      kind: 'error',
      message: 'Page does not appear to be a young artist program',
      model,
      tokens_in,
      tokens_out,
    }
  }

  const result = extractedProgramSchema.safeParse(parsed)
  if (!result.success) {
    const issues = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`)
    return {
      kind: 'error',
      message: `Schema validation failed: ${issues.join('; ')}`,
      model,
      tokens_in,
      tokens_out,
    }
  }

  // Extract confidence from the raw parsed object (not in the zod schema since
  // it's metadata about the extraction, not about the program itself)
  const confidence = typeof (parsed as { confidence?: unknown }).confidence === 'number'
    ? (parsed as { confidence: number }).confidence
    : 0.5

  return {
    kind: 'success',
    program: result.data,
    confidence,
    model,
    tokens_in,
    tokens_out,
  }
}

// ---------------------------------------------------------------------------
// OpenRouter response shape (minimal typing for what we read)
// ---------------------------------------------------------------------------

interface OpenRouterResponse {
  choices?: Array<{
    message?: {
      content?: string
    }
  }>
  usage?: {
    prompt_tokens?: number
    completion_tokens?: number
  }
}
