import { describe, it, expect } from 'vitest'
import { normalizeValue } from '../cache'

describe('normalizeValue', () => {
  describe('boolean', () => {
    it('normalizes TRUE to true', () => {
      expect(normalizeValue('TRUE', 'boolean')).toBe('true')
    })

    it('normalizes FALSE to false', () => {
      expect(normalizeValue('FALSE', 'boolean')).toBe('false')
    })

    it('normalizes mixed case', () => {
      expect(normalizeValue('True', 'boolean')).toBe('true')
      expect(normalizeValue('False', 'boolean')).toBe('false')
    })
  })

  describe('date', () => {
    it('preserves date+time from ISO string', () => {
      expect(normalizeValue('2026-03-03T14:30:00.000Z', 'date')).toBe('2026-03-03T14:30')
    })

    it('preserves date+time without seconds', () => {
      expect(normalizeValue('2026-03-03T09:15', 'date')).toBe('2026-03-03T09:15')
    })

    it('keeps date-only values as-is', () => {
      expect(normalizeValue('2026-03-03', 'date')).toBe('2026-03-03')
    })

    it('returns value unchanged if no date pattern matches', () => {
      expect(normalizeValue('not-a-date', 'date')).toBe('not-a-date')
    })
  })

  describe('other types', () => {
    it('returns text values unchanged', () => {
      expect(normalizeValue('hello', 'text')).toBe('hello')
    })

    it('returns number values unchanged', () => {
      expect(normalizeValue('42', 'number')).toBe('42')
    })
  })

  it('returns empty string unchanged', () => {
    expect(normalizeValue('', 'date')).toBe('')
    expect(normalizeValue('', 'boolean')).toBe('')
  })
})
