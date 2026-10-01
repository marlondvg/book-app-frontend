# Spec: Send the user's time zone with status changes

## Goal

`startedAt` and `finishedAt` must show the user's local date. The backend
(book-api PR #13) now works out "today" in a time zone the client sends.
Without it, the backend uses UTC, so users west of UTC who start or finish a
book in the evening see tomorrow's date.

Out of scope: letting users pick or edit `startedAt` / `finishedAt`, storing a
time zone in the user profile, changing how dates are displayed.

## API contract (book-api)

`PUT /api/books/{id}/status`

```json
{ "status": "READING", "timeZone": "America/Bogota" }
```

- `timeZone`: optional IANA zone ID. Fixed offsets (`"+02:00"`) and `"UTC"`
  are also accepted.
- Missing, `null` or `""`: the backend uses UTC (the old behavior).
- Invalid zone: **400** `application/problem+json`, same as an unknown status.
  Nothing is changed.
- Response: unchanged (`BookResponse`; `startedAt` / `finishedAt` are
  `YYYY-MM-DD` strings with no time part).

No other endpoint changes. Backend spec:
`../book-api/docs/specs/status-date-timezone.md`.

## Changes

1. `src/books/books-api.ts` → `changeStatus(id, status)` sends
   `{ status, timeZone }`, where `timeZone` is
   `Intl.DateTimeFormat().resolvedOptions().timeZone`. Read it when the request
   is sent, not once at module load, so a user who travels gets the right zone.
   If the value is empty or undefined, leave `timeZone` out.
2. Put the lookup in a small helper (e.g. `userTimeZone()` in `src/lib/`) so
   tests can stub it.
3. `src/test/book-api.ts` (MSW mock): accept `timeZone` in the status body type.
   The mock doesn't need to compute dates.
4. Update tests that check the request body (e.g. `BookActions.test.tsx`
   expects `body: { status: 'READING' }`) to expect the `timeZone` too.

## Display rule (check, don't change unless broken)

Treat `startedAt` / `finishedAt` as calendar dates. Never pass them to
`new Date("2026-09-30")`: that parses as UTC midnight and shows Sept 29 west
of UTC. Format the string directly, or build the date from its parts.

## Acceptance criteria

- [ ] Every status change sends `timeZone` with the browser's IANA zone.
- [ ] `timeZone` is left out (not sent as `""` or `null`) when the browser
      doesn't provide one.
- [ ] Tests stub the zone (e.g. `America/Bogota`) and check it is in the body.
- [ ] Stored dates show the same day everywhere, with no shift of one day
      west of UTC.
- [ ] Order: deploy the backend first. Sending `timeZone` before PR #13 is
      deployed is harmless (the extra field is ignored), but dates stay in UTC
      until then.
- [ ] All frontend tests pass.
