import { useState, useCallback, useMemo } from 'react'
import { LOCAL_STORAGE_KEYS } from '@/config/constants'
import type { RecordSource } from '@/lib/types'

function generateId(): string {
  return crypto.randomUUID()
}

function getSources(): RecordSource[] {
  const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.SOURCES)
  if (!raw) return []
  try {
    return JSON.parse(raw) as RecordSource[]
  } catch {
    return []
  }
}

function saveSources(sources: RecordSource[]): void {
  localStorage.setItem(LOCAL_STORAGE_KEYS.SOURCES, JSON.stringify(sources))
}

function getActiveSourceId(): string | null {
  return localStorage.getItem(LOCAL_STORAGE_KEYS.ACTIVE_SOURCE_ID)
}

function setActiveSourceIdStorage(id: string): void {
  localStorage.setItem(LOCAL_STORAGE_KEYS.ACTIVE_SOURCE_ID, id)
}

export function useSources() {
  const [sources, setSourcesState] = useState<RecordSource[]>(getSources)
  const [activeSourceId, setActiveSourceIdState] = useState<string | null>(getActiveSourceId)

  const activeSource = useMemo(
    () => sources.find((s) => s.id === activeSourceId) ?? null,
    [sources, activeSourceId]
  )

  const setActiveSourceId = useCallback((id: string) => {
    setActiveSourceIdStorage(id)
    setActiveSourceIdState(id)
  }, [])

  const addSource = useCallback((name: string, spreadsheetId: string): RecordSource => {
    const source: RecordSource = {
      id: generateId(),
      name,
      spreadsheetId,
    }
    setSourcesState((prev) => {
      const updated = [...prev, source]
      saveSources(updated)
      return updated
    })
    return source
  }, [])

  const updateSource = useCallback((id: string, updates: Partial<Omit<RecordSource, 'id'>>) => {
    setSourcesState((prev) => {
      const updated = prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
      saveSources(updated)
      return updated
    })
  }, [])

  const removeSource = useCallback((id: string) => {
    setSourcesState((prev) => {
      const updated = prev.filter((s) => s.id !== id)
      saveSources(updated)
      return updated
    })
    setActiveSourceIdState((prev) => {
      if (prev === id) {
        const remaining = getSources().filter((s) => s.id !== id)
        const newActiveId = remaining.length > 0 ? remaining[0].id : null
        if (newActiveId) {
          setActiveSourceIdStorage(newActiveId)
        } else {
          localStorage.removeItem(LOCAL_STORAGE_KEYS.ACTIVE_SOURCE_ID)
        }
        return newActiveId
      }
      return prev
    })
  }, [])

  return {
    sources,
    activeSource,
    setActiveSourceId,
    addSource,
    updateSource,
    removeSource,
  }
}
