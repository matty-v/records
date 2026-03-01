import { useQuery } from '@tanstack/react-query'
import { db } from '@/lib/db'
import { refreshSchemaFromRemote } from '@/lib/cache'
import { groupBySheet } from '@/lib/schema-utils'
import type { SheetSchema } from '@/lib/types'

export function useSchema(sourceId: string | null, spreadsheetId: string | null) {
  return useQuery<SheetSchema[]>({
    queryKey: ['schema', sourceId],
    queryFn: async () => {
      if (!sourceId || !spreadsheetId) return []

      // Try IndexedDB cache first
      const cached = await db.schemas
        .filter((s) => s.localId.startsWith(`${sourceId}:`))
        .toArray()

      if (cached.length > 0) return groupBySheet(cached)

      // No cache — fetch from remote once
      const columns = await refreshSchemaFromRemote(sourceId, spreadsheetId)
      return groupBySheet(columns)
    },
    enabled: !!sourceId && !!spreadsheetId,
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
  })
}
