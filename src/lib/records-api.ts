import { SheetsDbClient } from '@/services/sheetsdb'
import { API_BASE_URL } from '@/config/constants'

export function getSheetsClient(spreadsheetId: string): SheetsDbClient {
  return new SheetsDbClient({
    baseUrl: API_BASE_URL,
    spreadsheetId,
  })
}

export async function isApiReachable(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`)
    return response.ok
  } catch {
    return false
  }
}
