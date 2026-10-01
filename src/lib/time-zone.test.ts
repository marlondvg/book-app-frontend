import { afterEach, describe, expect, it, vi } from 'vitest'
import { userTimeZone } from './time-zone.ts'

function stubResolvedTimeZone(timeZone: string | undefined) {
  const real = Intl.DateTimeFormat.prototype.resolvedOptions
  vi.spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions').mockImplementation(function (
    this: Intl.DateTimeFormat,
  ) {
    return { ...real.call(this), timeZone } as Intl.ResolvedDateTimeFormatOptions
  })
}

describe('userTimeZone', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("returns the browser's IANA zone", () => {
    // The test run's TZ, set in vite.config.ts.
    expect(userTimeZone()).toBe('America/Bogota')
  })

  it('returns undefined when the browser reports no zone', () => {
    stubResolvedTimeZone(undefined)
    expect(userTimeZone()).toBeUndefined()

    stubResolvedTimeZone('')
    expect(userTimeZone()).toBeUndefined()
  })
})
