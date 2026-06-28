/** Cheapest GA model — used for fill-in-the-blank, word forms, and other high-volume tasks. */
export const GEMINI_MODEL = 'gemini-3.1-flash-lite'

/** Reserved for future higher-quality tasks (e.g. crossword). Not currently used. */
export const GEMINI_MODEL_PREMIUM = 'gemini-3.5-flash'

function geminiApiUrl(model: string): string {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`
}

export type GeminiSentence = {
  word: string
  sentence: string
}

type GeminiResponse = {
  sentences: GeminiSentence[]
}

export type GeminiGradeBatch = {
  gradeLevel: string
  sentences: GeminiSentence[]
}

type GeminiMultiGradeResponse = {
  grades: GeminiGradeBatch[]
}

function getApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured')
  }
  return apiKey
}

function validateSentence(item: unknown): item is GeminiSentence {
  if (
    typeof item !== 'object' ||
    item === null ||
    typeof (item as GeminiSentence).word !== 'string' ||
    typeof (item as GeminiSentence).sentence !== 'string'
  ) {
    return false
  }
  if (!(item as GeminiSentence).sentence.includes('_____')) {
    throw new Error(`Sentence for "${(item as GeminiSentence).word}" must include a _____ blank`)
  }
  return true
}

function parseGeminiJson(text: string): GeminiResponse {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('Gemini returned invalid JSON')
  }

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('sentences' in parsed) ||
    !Array.isArray((parsed as GeminiResponse).sentences)
  ) {
    throw new Error('Gemini response missing sentences array')
  }

  const sentences = (parsed as GeminiResponse).sentences
  for (const item of sentences) {
    if (!validateSentence(item)) {
      throw new Error('Gemini response has invalid sentence shape')
    }
  }

  return parsed as GeminiResponse
}

function parseMultiGradeGeminiJson(text: string): GeminiMultiGradeResponse {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('Gemini returned invalid JSON')
  }

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('grades' in parsed) ||
    !Array.isArray((parsed as GeminiMultiGradeResponse).grades)
  ) {
    throw new Error('Gemini response missing grades array')
  }

  for (const grade of (parsed as GeminiMultiGradeResponse).grades) {
    if (
      typeof grade !== 'object' ||
      grade === null ||
      typeof grade.gradeLevel !== 'string' ||
      !Array.isArray(grade.sentences)
    ) {
      throw new Error('Gemini response has invalid grade shape')
    }
    for (const item of grade.sentences) {
      if (!validateSentence(item)) {
        throw new Error('Gemini response has invalid sentence shape')
      }
    }
  }

  return parsed as GeminiMultiGradeResponse
}

function geminiErrorMessage(status: number, body: string): string {
  if (status === 429) {
    return 'Gemini API rate limit reached (this is your Google AI quota, not Convex). Wait a minute and try again, or check usage at aistudio.google.com.'
  }
  if (status === 503) {
    return 'Gemini is temporarily overloaded. Please try again in a moment.'
  }
  return `Gemini API error (${status}): ${body.slice(0, 200)}`
}

const RETRYABLE_GEMINI_STATUSES = new Set([429, 500, 503])
const GEMINI_MAX_ATTEMPTS = 3

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchGeminiJsonOnce(prompt: string, model: string): Promise<string> {
  const apiKey = getApiKey()
  const response = await fetch(`${geminiApiUrl(model)}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.8,
      },
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    const error = new Error(geminiErrorMessage(response.status, body)) as Error & {
      status?: number
    }
    error.status = response.status
    throw error
  }

  const data = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) {
    throw new Error('Gemini returned an empty response')
  }

  return text
}

async function fetchGeminiJson(prompt: string, model = GEMINI_MODEL): Promise<string> {
  let lastError: Error | undefined

  for (let attempt = 0; attempt < GEMINI_MAX_ATTEMPTS; attempt++) {
    try {
      return await fetchGeminiJsonOnce(prompt, model)
    } catch (error) {
      if (!(error instanceof Error)) throw error
      lastError = error

      const status = (error as Error & { status?: number }).status
      const isLastAttempt = attempt === GEMINI_MAX_ATTEMPTS - 1
      if (
        status === undefined ||
        !RETRYABLE_GEMINI_STATUSES.has(status) ||
        isLastAttempt
      ) {
        throw error
      }

      await sleep(1000 * 2 ** attempt)
    }
  }

  throw lastError ?? new Error('Gemini request failed')
}

export async function generateGeminiJson(prompt: string): Promise<GeminiResponse> {
  const text = await fetchGeminiJson(prompt)
  return parseGeminiJson(text)
}

export async function generateGeminiMultiGradeJson(
  prompt: string,
): Promise<GeminiMultiGradeResponse> {
  const text = await fetchGeminiJson(prompt)
  return parseMultiGradeGeminiJson(text)
}

export function formatGradeForPrompt(gradeLevel: string): string {
  return gradeLevel === 'K' ? 'Kindergarten' : `Grade ${gradeLevel}`
}

function formatWordList(entries: Array<{ word: string; definition?: string }>): string {
  return entries
    .map((entry, index) => {
      const definition = entry.definition ? ` (${entry.definition})` : ''
      return `${index + 1}. ${entry.word}${definition}`
    })
    .join('\n')
}

function sentenceRulesForGrade(
  gradeLabel: string,
  entries: Array<{ word: string; definition?: string }>,
): string {
  return `Write exactly ${entries.length} sentences — one for each vocabulary word. Each sentence must:
- Use the matching vocabulary word (${entries.map((entry, index) => `sentence ${index + 1} uses "${entry.word}"`).join(', ')})
- Replace that vocabulary word with exactly five underscores: _____
- Be age-appropriate for ${gradeLabel}
- Be a complete, natural English sentence
- Contain only one blank`
}

export function buildMultiGradeBatchPrompt(input: {
  gradeLevels: string[]
  entries: Array<{ word: string; definition?: string }>
}): string {
  const wordList = formatWordList(input.entries)
  const gradeSections = input.gradeLevels
    .map((gradeLevel) => {
      const gradeLabel = formatGradeForPrompt(gradeLevel)
      return `### ${gradeLabel} (gradeLevel: "${gradeLevel}")
${sentenceRulesForGrade(gradeLabel, input.entries)}`
    })
    .join('\n\n')

  return `You are a teacher creating fill-in-the-blank vocabulary sentences for multiple grade levels.

Vocabulary words (same list for every grade; use each in order, one sentence per word):
${wordList}

Generate sentences for each grade level below. Sentences should differ by grade-appropriate vocabulary and complexity.

${gradeSections}

Return JSON only in this shape:
{
  "grades": [
    {
      "gradeLevel": "5",
      "sentences": [{ "word": "compare", "sentence": "We _____ the two texts." }]
    }
  ]
}`
}

export function buildRegeneratePrompt(input: {
  gradeLevel: string
  word: string
  definition?: string
  currentSentence?: string
}): string {
  const gradeLabel = formatGradeForPrompt(input.gradeLevel)
  const definitionLine = input.definition ? `\nDefinition: ${input.definition}` : ''
  const avoidLine = input.currentSentence
    ? `\nWrite a different sentence than this one: "${input.currentSentence}"`
    : ''

  return `You are a teacher creating one fill-in-the-blank vocabulary sentence.

Grade level: ${gradeLabel}
Vocabulary word: ${input.word}${definitionLine}${avoidLine}

Write one sentence that:
- Uses the vocabulary word "${input.word}" but replaces it with exactly five underscores: _____
- Is age-appropriate for ${gradeLabel}
- Is a complete, natural English sentence
- Contains only one blank

Return JSON only in this shape:
{ "sentences": [{ "word": "${input.word}", "sentence": "..." }] }`
}

export type GeminiWordFormItem = {
  label: string
  form: string
}

export type GeminiWordFormGroup = {
  baseWord: string
  forms: GeminiWordFormItem[]
}

type GeminiWordFormsResponse = {
  words: GeminiWordFormGroup[]
}

function validateWordFormItem(item: unknown): item is GeminiWordFormItem {
  return (
    typeof item === 'object' &&
    item !== null &&
    typeof (item as GeminiWordFormItem).label === 'string' &&
    typeof (item as GeminiWordFormItem).form === 'string' &&
    (item as GeminiWordFormItem).label.trim().length > 0 &&
    (item as GeminiWordFormItem).form.trim().length > 0
  )
}

function parseWordFormsGeminiJson(text: string): GeminiWordFormsResponse {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('Gemini returned invalid JSON')
  }

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('words' in parsed) ||
    !Array.isArray((parsed as GeminiWordFormsResponse).words)
  ) {
    throw new Error('Gemini response missing words array')
  }

  for (const group of (parsed as GeminiWordFormsResponse).words) {
    if (
      typeof group !== 'object' ||
      group === null ||
      typeof group.baseWord !== 'string' ||
      !Array.isArray(group.forms) ||
      group.forms.length === 0
    ) {
      throw new Error('Gemini response has invalid word form group shape')
    }
    for (const item of group.forms) {
      if (!validateWordFormItem(item)) {
        throw new Error('Gemini response has invalid word form item shape')
      }
    }
  }

  return parsed as GeminiWordFormsResponse
}

export async function generateGeminiWordFormsJson(
  prompt: string,
): Promise<GeminiWordFormsResponse> {
  const text = await fetchGeminiJson(prompt)
  return parseWordFormsGeminiJson(text)
}

export function buildWordFormsBatchPrompt(input: {
  entries: Array<{ word: string; definition?: string }>
}): string {
  const wordList = formatWordList(input.entries)

  return `You are a teacher creating vocabulary word-form activities for English learners.

For each vocabulary word below, list common related word forms (inflections, derivatives, and parts of speech) that students should know. Include forms such as:
- verb: base, -ing, past tense, past participle (when applicable)
- noun forms (e.g. comparison, comparer)
- adjective/adverb forms when they exist

Use clear short labels (e.g. "verb (-ing)", "past tense", "noun", "adjective"). Provide 3–6 forms per word when possible. Only include real English forms of the same word family.

Vocabulary words:
${wordList}

Return JSON only in this shape:
{
  "words": [
    {
      "baseWord": "compare",
      "forms": [
        { "label": "verb (-ing)", "form": "comparing" },
        { "label": "past tense", "form": "compared" },
        { "label": "noun (person)", "form": "comparer" },
        { "label": "noun", "form": "comparison" },
        { "label": "adjective", "form": "comparable" }
      ]
    }
  ]
}`
}

export function buildWordFormsRegeneratePrompt(input: {
  word: string
  definition?: string
}): string {
  const definitionLine = input.definition ? `\nDefinition: ${input.definition}` : ''

  return `You are a teacher creating vocabulary word-form activities for English learners.

Vocabulary word: ${input.word}${definitionLine}

List common related word forms (inflections, derivatives, and parts of speech) for this word. Include forms such as verb tenses, nouns, adjectives, and adverbs when they exist. Use clear short labels. Provide 3–6 forms when possible.

Return JSON only in this shape:
{
  "words": [
    {
      "baseWord": "${input.word}",
      "forms": [
        { "label": "verb (-ing)", "form": "..." },
        { "label": "past tense", "form": "..." }
      ]
    }
  ]
}`
}

export type GeminiWordFormSentence = {
  baseWord: string
  form: string
  label: string
  sentence: string
}

export type GeminiWordFormSentenceGradeBatch = {
  gradeLevel: string
  sentences: GeminiWordFormSentence[]
}

type GeminiWordFormSentencesResponse = {
  grades: GeminiWordFormSentenceGradeBatch[]
}

function validateWordFormSentence(item: unknown): item is GeminiWordFormSentence {
  if (
    typeof item !== 'object' ||
    item === null ||
    typeof (item as GeminiWordFormSentence).baseWord !== 'string' ||
    typeof (item as GeminiWordFormSentence).form !== 'string' ||
    typeof (item as GeminiWordFormSentence).label !== 'string' ||
    typeof (item as GeminiWordFormSentence).sentence !== 'string'
  ) {
    return false
  }
  if (!(item as GeminiWordFormSentence).sentence.includes('_____')) {
    throw new Error(
      `Sentence for "${(item as GeminiWordFormSentence).form}" must include a _____ blank`,
    )
  }
  return true
}

function parseWordFormSentencesGeminiJson(text: string): GeminiWordFormSentencesResponse {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('Gemini returned invalid JSON')
  }

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('grades' in parsed) ||
    !Array.isArray((parsed as GeminiWordFormSentencesResponse).grades)
  ) {
    throw new Error('Gemini response missing grades array')
  }

  for (const grade of (parsed as GeminiWordFormSentencesResponse).grades) {
    if (
      typeof grade !== 'object' ||
      grade === null ||
      typeof grade.gradeLevel !== 'string' ||
      !Array.isArray(grade.sentences)
    ) {
      throw new Error('Gemini response has invalid word form sentence grade shape')
    }
    for (const item of grade.sentences) {
      if (!validateWordFormSentence(item)) {
        throw new Error('Gemini response has invalid word form sentence shape')
      }
    }
  }

  return parsed as GeminiWordFormSentencesResponse
}

export async function generateGeminiWordFormSentencesJson(
  prompt: string,
): Promise<GeminiWordFormSentencesResponse> {
  const text = await fetchGeminiJson(prompt)
  return parseWordFormSentencesGeminiJson(text)
}

function formatWordFormsForPrompt(
  words: Array<{
    baseWord: string
    forms: Array<{ label: string; form: string }>
  }>,
): string {
  return words
    .map((word) => {
      const forms = word.forms
        .map((item) => `  - ${item.label}: ${item.form}`)
        .join('\n')
      return `${word.baseWord}:\n${forms}`
    })
    .join('\n\n')
}

function wordFormSentenceRulesForGrade(
  gradeLabel: string,
  words: Array<{
    baseWord: string
    forms: Array<{ label: string; form: string }>
  }>,
): string {
  const totalSentences = words.reduce((sum, word) => sum + word.forms.length, 0)
  const formList = words
    .flatMap((word) =>
      word.forms.map(
        (item) => `"${item.form}" (${word.baseWord}, ${item.label})`,
      ),
    )
    .join(', ')

  return `Write exactly ${totalSentences} sentences — one for each word form listed below. Each sentence must:
- Use the matching word form (${formList})
- Replace that word form with exactly five underscores: _____
- Include the form in parentheses after the blank, e.g. _____ (compared)
- Be age-appropriate for ${gradeLabel}
- Be a complete, natural English sentence
- Contain only one blank`
}

export function buildWordFormsSentencesBatchPrompt(input: {
  gradeLevels: string[]
  words: Array<{
    baseWord: string
    forms: Array<{ label: string; form: string }>
  }>
}): string {
  const wordFormsList = formatWordFormsForPrompt(input.words)
  const gradeSections = input.gradeLevels
    .map((gradeLevel) => {
      const gradeLabel = formatGradeForPrompt(gradeLevel)
      return `### ${gradeLabel} (gradeLevel: "${gradeLevel}")
${wordFormSentenceRulesForGrade(gradeLabel, input.words)}`
    })
    .join('\n\n')

  return `You are a teacher creating fill-in-the-blank sentences for vocabulary word forms.

Word forms (write one sentence per form for each grade level):
${wordFormsList}

Generate sentences for each grade level below. Sentences should differ by grade-appropriate vocabulary and complexity.

${gradeSections}

Return JSON only in this shape:
{
  "grades": [
    {
      "gradeLevel": "5",
      "sentences": [
        {
          "baseWord": "compare",
          "form": "compared",
          "label": "past tense",
          "sentence": "We _____ (compared) the two stories."
        }
      ]
    }
  ]
}`
}

export function buildWordFormsSentenceRegeneratePrompt(input: {
  gradeLevel: string
  baseWord: string
  form: string
  label: string
  definition?: string
  currentSentence?: string
}): string {
  const gradeLabel = formatGradeForPrompt(input.gradeLevel)
  const definitionLine = input.definition ? `\nDefinition: ${input.definition}` : ''
  const avoidLine = input.currentSentence
    ? `\nWrite a different sentence than this one: "${input.currentSentence}"`
    : ''

  return `You are a teacher creating one fill-in-the-blank sentence for a vocabulary word form.

Grade level: ${gradeLabel}
Base word: ${input.baseWord}${definitionLine}
Word form: ${input.form} (${input.label})${avoidLine}

Write one sentence that:
- Uses the word form "${input.form}" but replaces it with exactly five underscores: _____
- Includes the form in parentheses after the blank: _____ (${input.form})
- Is age-appropriate for ${gradeLabel}
- Is a complete, natural English sentence
- Contains only one blank

Return JSON only in this shape:
{
  "grades": [
    {
      "gradeLevel": "${input.gradeLevel}",
      "sentences": [
        {
          "baseWord": "${input.baseWord}",
          "form": "${input.form}",
          "label": "${input.label}",
          "sentence": "..."
        }
      ]
    }
  ]
}`
}

export function buildWordFormsSentencesForWordPrompt(input: {
  gradeLevels: string[]
  baseWord: string
  definition?: string
  forms: Array<{ label: string; form: string }>
}): string {
  return buildWordFormsSentencesBatchPrompt({
    gradeLevels: input.gradeLevels,
    words: [{ baseWord: input.baseWord, forms: input.forms }],
  })
}

export type GeminiCrosswordWord = {
  word: string
  definitions: string[]
}

export type GeminiCrosswordGradeBatch = {
  gradeLevel: string
  words: GeminiCrosswordWord[]
}

type GeminiCrosswordDefinitionsResponse = {
  grades: GeminiCrosswordGradeBatch[]
}

function validateCrosswordDefinitionItem(
  item: unknown,
  word: string,
): item is GeminiCrosswordWord {
  if (
    typeof item !== 'object' ||
    item === null ||
    typeof (item as GeminiCrosswordWord).word !== 'string' ||
    !Array.isArray((item as GeminiCrosswordWord).definitions)
  ) {
    return false
  }

  const definitions = (item as GeminiCrosswordWord).definitions
    .map((value) => (typeof value === 'string' ? value.trim() : ''))
    .filter(Boolean)

  if (definitions.length === 0 || definitions.length > 2) {
    throw new Error(`Crossword definitions for "${word}" must include 1–2 items`)
  }

  const normalizedWord = word.toLowerCase()
  for (const definition of definitions) {
    if (definition.toLowerCase().includes(normalizedWord)) {
      throw new Error(
        `Crossword definition for "${word}" must not contain the vocabulary word`,
      )
    }
  }

  return true
}

function parseCrosswordDefinitionsGeminiJson(
  text: string,
): GeminiCrosswordDefinitionsResponse {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('Gemini returned invalid JSON')
  }

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('grades' in parsed) ||
    !Array.isArray((parsed as GeminiCrosswordDefinitionsResponse).grades)
  ) {
    throw new Error('Gemini response missing grades array')
  }

  for (const grade of (parsed as GeminiCrosswordDefinitionsResponse).grades) {
    if (
      typeof grade !== 'object' ||
      grade === null ||
      typeof grade.gradeLevel !== 'string' ||
      !Array.isArray(grade.words)
    ) {
      throw new Error('Gemini response has invalid crossword grade shape')
    }
    for (const item of grade.words) {
      const word =
        typeof item === 'object' &&
        item !== null &&
        typeof (item as GeminiCrosswordWord).word === 'string'
          ? (item as GeminiCrosswordWord).word
          : 'word'
      if (!validateCrosswordDefinitionItem(item, word)) {
        throw new Error('Gemini response has invalid crossword word shape')
      }
    }
  }

  return parsed as GeminiCrosswordDefinitionsResponse
}

export async function generateGeminiCrosswordDefinitionsJson(
  prompt: string,
): Promise<GeminiCrosswordDefinitionsResponse> {
  const text = await fetchGeminiJson(prompt)
  return parseCrosswordDefinitionsGeminiJson(text)
}

function crosswordDefinitionRulesForGrade(
  gradeLabel: string,
  entries: Array<{ word: string; definition?: string }>,
): string {
  return `Write definitions for exactly ${entries.length} vocabulary words (${entries.map((entry, index) => `item ${index + 1}: "${entry.word}"`).join(', ')}).
For each word, provide 1–2 short, student-friendly definitions appropriate for ${gradeLabel}.
- Do not use the vocabulary word in any definition
- Keep each definition concise (one sentence or phrase)
- When two definitions are provided, they should offer different angles on meaning`
}

export function buildCrosswordDefinitionsPrompt(input: {
  gradeLevels: string[]
  entries: Array<{ word: string; definition?: string }>
}): string {
  const wordList = formatWordList(input.entries)
  const gradeSections = input.gradeLevels
    .map((gradeLevel) => {
      const gradeLabel = formatGradeForPrompt(gradeLevel)
      return `### ${gradeLabel} (gradeLevel: "${gradeLevel}")
${crosswordDefinitionRulesForGrade(gradeLabel, input.entries)}`
    })
    .join('\n\n')

  return `You are a teacher creating crossword puzzle clues (definitions) for English learners.

Vocabulary words (same list for every grade):
${wordList}

Generate crossword definitions for each grade level below. Definitions should differ by grade-appropriate vocabulary and complexity when multiple grades are requested.

${gradeSections}

Return JSON only in this shape:
{
  "grades": [
    {
      "gradeLevel": "5",
      "words": [
        {
          "word": "compare",
          "definitions": ["to examine how things are alike and different", "to look at two or more things side by side"]
        }
      ]
    }
  ]
}`
}
