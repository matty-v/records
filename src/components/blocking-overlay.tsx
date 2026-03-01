import { createContext, useContext, useState, useCallback } from 'react'
import { Spinner } from '@/components/ui/spinner'

interface BlockingOverlayContextValue {
  isBlocking: boolean
  message: string
  showOverlay: (message?: string) => void
  hideOverlay: () => void
  withOverlay: <T>(fn: () => Promise<T>, message?: string) => Promise<T>
}

const BlockingOverlayContext = createContext<BlockingOverlayContextValue | null>(null)

export function useBlockingOverlay(): BlockingOverlayContextValue {
  const ctx = useContext(BlockingOverlayContext)
  if (!ctx) {
    throw new Error('useBlockingOverlay must be used within BlockingOverlayProvider')
  }
  return ctx
}

export function BlockingOverlayProvider({ children }: { children: React.ReactNode }) {
  const [isBlocking, setIsBlocking] = useState(false)
  const [message, setMessage] = useState('Saving...')

  const showOverlay = useCallback((msg = 'Saving...') => {
    setMessage(msg)
    setIsBlocking(true)
  }, [])

  const hideOverlay = useCallback(() => {
    setIsBlocking(false)
  }, [])

  const withOverlay = useCallback(async <T,>(fn: () => Promise<T>, msg?: string): Promise<T> => {
    showOverlay(msg)
    try {
      return await fn()
    } finally {
      hideOverlay()
    }
  }, [showOverlay, hideOverlay])

  return (
    <BlockingOverlayContext.Provider value={{ isBlocking, message, showOverlay, hideOverlay, withOverlay }}>
      {children}
      {isBlocking && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          role="alert"
          aria-busy="true"
          aria-label={message}
        >
          <div className="flex flex-col items-center gap-3 rounded-xl bg-[var(--card)] border border-[rgba(0,212,255,0.2)] px-8 py-6 shadow-[0_0_40px_rgba(0,212,255,0.15)]">
            <Spinner size="lg" />
            <p className="text-sm text-muted-foreground font-light">{message}</p>
          </div>
        </div>
      )}
    </BlockingOverlayContext.Provider>
  )
}
