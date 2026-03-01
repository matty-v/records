import { useState, useMemo } from 'react'
import type { SheetSchema } from '@/lib/types'

export function useSheets(schemas: SheetSchema[]) {
  const sheetNames = useMemo(() => schemas.map((s) => s.sheetName), [schemas])

  const [activeSheet, setActiveSheet] = useState<string | null>(null)

  const currentSheet = activeSheet && sheetNames.includes(activeSheet)
    ? activeSheet
    : sheetNames[0] ?? null

  const currentSchema = useMemo(
    () => schemas.find((s) => s.sheetName === currentSheet) ?? null,
    [schemas, currentSheet]
  )

  return {
    sheetNames,
    activeSheet: currentSheet,
    setActiveSheet,
    currentSchema,
  }
}
