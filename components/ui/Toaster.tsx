'use client'

import { Toaster as SonnerToaster } from 'sonner'

export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      toastOptions={{
        style: {
          background: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          padding: '16px',
        },
        className: 'shadow-lg',
        duration: 4000,
      }}
      closeButton
    />
  )
}