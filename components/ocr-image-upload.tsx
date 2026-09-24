'use client'

import { useEffect, useRef, useState } from 'react'
import { ImagePlus, Loader2, ScanText, X } from 'lucide-react'
import type { OcrReminderFields } from '@/lib/ocr'

interface OcrImageUploadProps {
  onExtracted: (fields: OcrReminderFields) => void
}

export default function OcrImageUpload({ onExtracted }: OcrImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [rawText, setRawText] = useState('')

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
  }, [previewUrl])

  const extract = async (file: File) => {
    setError('')
    setRawText('')
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('សូមជ្រើសរើសរូបភាព JPG, PNG ឬ WebP។')
      return
    }
    if (file.size > 4 * 1024 * 1024) {
      setError('រូបភាពត្រូវតែតូចជាង ៤ MB។')
      return
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(URL.createObjectURL(file))
    setIsLoading(true)

    try {
      const formData = new FormData()
      formData.append('image', file)
      const response = await fetch('/api/ocr', { method: 'POST', body: formData })
      const data = await response.json() as { error?: string; text?: string; fields?: OcrReminderFields }
      if (!response.ok || !data.fields) throw new Error(data.error ?? 'OCR failed')
      onExtracted(data.fields)
      setRawText(data.text ?? '')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'ការអានអក្សរមិនបានសម្រេច។')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/[0.035] p-3">
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') inputRef.current?.click()
        }}
        onDragOver={(event) => { event.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault()
          setIsDragging(false)
          const file = event.dataTransfer.files[0]
          if (file) void extract(file)
        }}
        className={`relative cursor-pointer rounded-lg border-2 border-dashed px-4 py-5 text-center transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 ${
          isDragging ? 'border-primary bg-primary/10' : 'border-primary/25 hover:border-primary/60 hover:bg-primary/5'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) void extract(file)
            event.target.value = ''
          }}
        />
        {previewUrl ? (
          <div className="mx-auto mb-3 h-24 w-24 overflow-hidden rounded-lg border border-border bg-background">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="Uploaded meeting document" className="h-full w-full object-cover" />
          </div>
        ) : (
          <ImagePlus className="mx-auto mb-2 h-7 w-7 text-primary" />
        )}
        <p className="text-sm font-semibold text-foreground">
          {isLoading ? 'កំពុងអានអក្សរ...' : 'អូសរូបភាពមកទីនេះ ឬចុចជ្រើសរើស'}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">ទាញយកចំណងជើង ទីតាំង កាលបរិច្ឆេទ ម៉ោង និងអ្នកចូលរួម</p>
        {isLoading && <Loader2 className="mx-auto mt-3 h-4 w-4 animate-spin text-primary" />}
      </div>

      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
      {rawText && !isLoading && (
        <details className="mt-3 text-xs">
          <summary className="flex cursor-pointer items-center gap-1 text-primary">
            <ScanText className="h-3.5 w-3.5" /> បង្ហាញអក្សរដែលបានអាន
          </summary>
          <pre className="mt-2 max-h-32 overflow-auto whitespace-pre-wrap rounded-md bg-background p-2 text-muted-foreground">{rawText}</pre>
        </details>
      )}
      {previewUrl && !isLoading && (
        <button
          type="button"
          onClick={() => {
            URL.revokeObjectURL(previewUrl)
            setPreviewUrl('')
            setRawText('')
          }}
          className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" /> លុបរូបភាព
        </button>
      )}
    </div>
  )
}
