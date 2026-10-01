import { describe, expect, it } from 'vitest'
import { makeBook } from '../test/books.ts'
import { allowedTransitions, allowsRating, lostOnStatusChange } from './status-rules.ts'

describe('status rules', () => {
  it('matches the transition table of book-api', () => {
    expect(allowedTransitions('TO_READ')).toEqual(['READING', 'READ', 'ABANDONED'])
    expect(allowedTransitions('READING')).toEqual(['TO_READ', 'READ', 'ABANDONED'])
    expect(allowedTransitions('READ')).toEqual(['READING'])
    expect(allowedTransitions('ABANDONED')).toEqual(['TO_READ', 'READING'])
  })

  it('allows rating only finished or abandoned books', () => {
    expect(allowsRating('READ')).toBe(true)
    expect(allowsRating('ABANDONED')).toBe(true)
    expect(allowsRating('TO_READ')).toBe(false)
    expect(allowsRating('READING')).toBe(false)
  })

  describe('lostOnStatusChange', () => {
    const finished = makeBook({
      status: 'READ',
      rating: 4,
      startedAt: '2026-08-01',
      finishedAt: '2026-08-20',
    })

    it('lists the rating and finish date when re-reading', () => {
      expect(lostOnStatusChange(finished, 'READING')).toEqual(['rating', 'finish date'])
    })

    it('lists everything when moving back to To read', () => {
      const abandoned = { ...finished, status: 'ABANDONED' as const }
      expect(lostOnStatusChange(abandoned, 'TO_READ')).toEqual([
        'rating',
        'start date',
        'finish date',
      ])
    })

    it('lists only what the book has', () => {
      const started = makeBook({ status: 'READING', startedAt: '2026-08-01' })
      expect(lostOnStatusChange(started, 'TO_READ')).toEqual(['start date'])
      expect(lostOnStatusChange(makeBook({ status: 'READ' }), 'READING')).toEqual([])
    })

    it('is empty for moves that clear nothing', () => {
      expect(lostOnStatusChange(finished, 'ABANDONED')).toEqual([])
      expect(lostOnStatusChange(makeBook({ status: 'READING' }), 'READ')).toEqual([])
    })
  })
})
