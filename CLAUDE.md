# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Frontend for a personal book reading tracker. The backend is `book-api`, a Spring Boot app in the sibling directory `../book-api`. Its `AGENTS.md` and `docs/specs/*.md` are the source of truth for endpoints, request/response shapes, status rules and error responses. Read the relevant spec before building a feature against the API.

Deployment target is Vercel. The live API is `https://book-api-oasv.onrender.com`, which runs on Render's free plan and can take about a minute to wake up.

## Commands

```bash
npm run dev                            # Vite dev server on http://localhost:5173
npm run build                          # tsc -b (type-check) then vite build
npm run lint                           # ESLint
npm test                               # Vitest in watch mode
npm test -- --run                      # all tests once (what CI runs)
npm test -- --run src/lib/api-client.test.ts   # a single file
npm test -- --run -t "problem details"         # tests whose name matches
```

CI (`.github/workflows/ci.yml`) runs lint, tests and build on every PR and on pushes to `main`.

To run against a local backend: `JWT_SECRET=$(openssl rand -base64 48) ./gradlew bootRun` in `../book-api`. The API's default CORS setting allows `http://localhost:5173`, so keep the Vite dev port. `VITE_API_URL` sets the API base URL (default `http://localhost:8080`). See `.env.example`, and put overrides in `.env.local`.

## Architecture

- `src/main.tsx` creates the React Query client and the browser router. `src/routes.tsx` holds the route tree as a plain `RouteObject[]`, so tests render the same tree with a memory router.
- `src/lib/api-client.ts`: every API call goes through `apiFetch<T>(path, { method, body })`.
  - It sends JSON and adds `Authorization: Bearer <token>` when `setTokenProvider` returns a token. The auth layer registers that provider, so the client never imports auth code.
  - Any non-2xx response throws `ApiError`, built from the backend's RFC 9457 problem details: `status`, `title`, `detail`, and `fieldErrors` from the `errors` list returned on validation failures.
  - A 204 response resolves to `undefined`.
- `src/lib/query-client.ts`: queries don't retry on `ApiError` 4xx responses, only on network and 5xx errors.
- Pages go in `src/pages/`, shared components in `src/components/`. Styling is plain CSS files next to components, using the variables in `src/index.css`.
- Forms: react-hook-form with zod v4 schemas through `@hookform/resolvers`. Keep schemas in line with the backend's Bean Validation rules.

## Testing

- Vitest with jsdom. `src/test/setup.ts` loads jest-dom matchers and starts a shared MSW server (`src/test/server.ts`) with `onUnhandledRequest: 'error'`, so any request a test doesn't mock fails the test.
- Mock the API with `server.use(http.get(`${API_URL}/api/...`, ...))`. `API_URL` is `http://api.test`, forced through `test.env` in `vite.config.ts`, so tests ignore local `.env` files. Handlers reset after each test.
- `renderRoute(path)` in `src/test/render.tsx` renders the real route tree with a fresh query client that doesn't retry.
- Import `describe`/`it`/`expect` from `vitest` (globals are off).

## TypeScript / lint constraints

`tsconfig.app.json` (it covers `src/`) enables:
- `verbatimModuleSyntax`: type-only imports must use `import type`.
- `erasableSyntaxOnly`: no `enum`, `namespace`, or constructor parameter properties. Use union types or `as const` objects.
- `noUnusedLocals` / `noUnusedParameters`: unused code fails `npm run build`, not just lint.
- Relative imports use explicit `.ts`/`.tsx` extensions.

ESLint enforces `react-hooks` rules and `react-refresh` (component files should export only components). Lint is not type-aware.

## Workflow

Same conventions as the backend: Conventional Commits (`feat:`, `fix:`, `chore:`, ...), one feature per `feat/<name>` or `chore/<name>` branch and PR, never commit directly to `main`.
