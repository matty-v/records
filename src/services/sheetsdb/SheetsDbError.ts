export class SheetsDbError extends Error {
  status: number
  response: unknown

  constructor(message: string, status: number, response: unknown) {
    super(message)
    this.name = 'SheetsDbError'
    this.status = status
    this.response = response
  }
}
