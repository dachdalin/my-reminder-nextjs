import { NextResponse } from 'next/server'
import { getAuthUserId } from '@/lib/action-result'
import { parseOcrReminderFields } from '@/lib/ocr'

const MAX_IMAGE_BYTES = 4 * 1024 * 1024
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

export async function POST(request: Request) {
  const authResult = await getAuthUserId()
  if (!authResult.success) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'OCR is not configured.' }, { status: 503 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('image')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Image file is required.' }, { status: 400 })
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: 'Only JPG, PNG, or WebP images are supported.' }, { status: 400 })
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: 'Image must be smaller than 4 MB.' }, { status: 400 })
    }

    const content = Buffer.from(await file.arrayBuffer()).toString('base64')
    const visionResponse = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [{
            image: { content },
            features: [{ type: 'DOCUMENT_TEXT_DETECTION' }],
            imageContext: { languageHints: ['km', 'en'] },
          }],
        }),
      }
    )

    const data = await visionResponse.json() as {
      responses?: Array<{ fullTextAnnotation?: { text?: string }; error?: { message?: string } }>
    }
    const response = data.responses?.[0]
    if (!visionResponse.ok || response?.error) {
      console.error('[OCR] Vision API error:', response?.error?.message ?? visionResponse.status)
      return NextResponse.json({ error: 'Text extraction failed.' }, { status: 502 })
    }

    const text = response?.fullTextAnnotation?.text?.trim() ?? ''
    if (!text) {
      return NextResponse.json({ error: 'No readable text found.' }, { status: 422 })
    }

    return NextResponse.json({ text, fields: parseOcrReminderFields(text) })
  } catch (error) {
    console.error('[OCR] Request failed:', error)
    return NextResponse.json({ error: 'Text extraction failed.' }, { status: 500 })
  }
}
