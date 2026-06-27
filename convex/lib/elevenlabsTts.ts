const DEFAULT_TTS_MODEL = 'eleven_flash_v2_5'

function formatElevenLabsErrorDetail(detail: unknown): string {
  if (detail == null) return ''
  if (typeof detail === 'string') return detail
  if (typeof detail === 'object') {
    const record = detail as { status?: string; message?: string }
    if (record.status && record.message) {
      return `${record.status}: ${record.message}`
    }
    if (record.message) return record.message
    if (record.status) return record.status
  }
  return JSON.stringify(detail)
}

async function readElevenLabsErrorDetail(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { detail?: unknown }
    return formatElevenLabsErrorDetail(body.detail)
  } catch {
    return ''
  }
}

export async function synthesizeSpeechBlob(
  apiKey: string,
  voiceId: string,
  text: string,
  speed?: number,
): Promise<Blob> {
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: DEFAULT_TTS_MODEL,
        ...(speed != null && {
          voice_settings: { speed },
        }),
      }),
    },
  )

  if (!response.ok) {
    const detail = await readElevenLabsErrorDetail(response)
    const suffix = detail ? ` — ${detail}` : ''
    throw new Error(`ElevenLabs TTS error: ${response.status}${suffix}`)
  }

  return new Blob([await response.arrayBuffer()], { type: 'audio/mpeg' })
}
