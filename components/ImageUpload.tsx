'use client'

import { useState, useRef } from 'react'
import { Upload, X } from 'lucide-react'

interface ImageUploadProps {
  onImageUpload: (file: File, preview: string) => void
  currentImage?: string | null
  placeholder?: string
  onRemove?: () => void
}

export default function ImageUpload({
  onImageUpload,
  currentImage,
  placeholder = '📷 Click to add image',
  onRemove,
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentImage || null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const url = e.target?.result as string
      setPreview(url)
      onImageUpload(file, url)
    }
    reader.readAsDataURL(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      handleFile(file)
    }
  }

  return (
    <div
      className={`relative rounded-xl border-2 border-dashed transition-all ${
        dragOver ? 'border-purple-500 bg-purple-50' : 'border-gray-300 hover:border-gray-400'
      } ${preview ? 'p-0' : 'p-8'}`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
        }}
      />

      {preview ? (
        <div className="relative group">
          <img src={preview} alt="Uploaded" className="w-full h-32 object-cover rounded-xl" />
          {onRemove && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setPreview(null)
                onRemove()
              }}
              className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-black/70 transition"
            >
              <X size={16} />
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 cursor-pointer">
          <div className="text-4xl">{placeholder}</div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Upload size={16} />
            Click to upload or drag & drop
          </div>
          <div className="text-xs text-gray-400">PNG, JPG, WebP (max 2MB)</div>
        </div>
      )}
    </div>
  )
}