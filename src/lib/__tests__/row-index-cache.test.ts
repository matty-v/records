import { describe, it, expect, beforeEach } from 'vitest'
import {
  getRowIndex,
  setRowIndex,
  deleteRowIndex,
  populateFromRows,
  clearRowIndexCache,
} from '../row-index-cache'

beforeEach(() => {
  clearRowIndexCache()
})

describe('row-index-cache', () => {
  it('returns undefined for unknown keys', () => {
    expect(getRowIndex('Sheet1', 'abc')).toBeUndefined()
  })

  it('stores and retrieves a row index', () => {
    setRowIndex('Sheet1', 'abc', 5)
    expect(getRowIndex('Sheet1', 'abc')).toBe(5)
  })

  it('isolates keys by sheet name', () => {
    setRowIndex('Sheet1', 'abc', 5)
    setRowIndex('Sheet2', 'abc', 10)
    expect(getRowIndex('Sheet1', 'abc')).toBe(5)
    expect(getRowIndex('Sheet2', 'abc')).toBe(10)
  })

  it('deletes a row index', () => {
    setRowIndex('Sheet1', 'abc', 5)
    deleteRowIndex('Sheet1', 'abc')
    expect(getRowIndex('Sheet1', 'abc')).toBeUndefined()
  })

  it('populateFromRows sets indices starting at row 2', () => {
    populateFromRows('Sheet1', [
      { id: 'aaa' },
      { id: 'bbb' },
      { id: 'ccc' },
    ])
    expect(getRowIndex('Sheet1', 'aaa')).toBe(2)
    expect(getRowIndex('Sheet1', 'bbb')).toBe(3)
    expect(getRowIndex('Sheet1', 'ccc')).toBe(4)
  })

  it('populateFromRows clears previous entries for the same sheet', () => {
    setRowIndex('Sheet1', 'old', 99)
    populateFromRows('Sheet1', [{ id: 'new' }])
    expect(getRowIndex('Sheet1', 'old')).toBeUndefined()
    expect(getRowIndex('Sheet1', 'new')).toBe(2)
  })

  it('populateFromRows does not affect other sheets', () => {
    setRowIndex('Sheet2', 'keep', 7)
    populateFromRows('Sheet1', [{ id: 'abc' }])
    expect(getRowIndex('Sheet2', 'keep')).toBe(7)
  })

  it('populateFromRows skips rows without id', () => {
    populateFromRows('Sheet1', [{ id: 'aaa' }, {}, { id: 'ccc' }])
    expect(getRowIndex('Sheet1', 'aaa')).toBe(2)
    expect(getRowIndex('Sheet1', 'ccc')).toBe(4)
  })

  it('clearRowIndexCache removes all entries', () => {
    setRowIndex('Sheet1', 'a', 1)
    setRowIndex('Sheet2', 'b', 2)
    clearRowIndexCache()
    expect(getRowIndex('Sheet1', 'a')).toBeUndefined()
    expect(getRowIndex('Sheet2', 'b')).toBeUndefined()
  })
})
