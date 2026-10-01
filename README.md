# book-app-frontend

Web app for a personal book reading tracker. People create an account, log in,
and keep track of **their own** books: what they want to read, are reading,
have finished or gave up on, with dates and a rating.

**Live app:** https://book-app-frontend-lilac.vercel.app

The API lives in a separate repository, [`book-api`](https://github.com/marlondvg/book-api)
(Spring Boot). It runs on Render's free plan, which sleeps after a period
without traffic, so the first request after a pause can take about a minute.

## Features

- Register and log in. The session lasts as long as the API token (1 hour).
- Book list, newest first, filtered by status through the URL (`/?status=READING`).
- Add and edit books: title, author, pages, ISBN and cover image URL.
- Change a book's status (only the moves the API allows), rate finished or
  abandoned books from 1 to 5, and delete books.
- Start and finish dates are recorded in the user's own time zone.

## Stack

- React 19, TypeScript, Vite
- React Router, TanStack Query
- React Hook Form with zod
- Vitest, Testing Library, MSW

## Run it locally

Requirements: Node 24.

```bash
npm install
npm run dev        # http://localhost:5173
```

By default the app calls the API at `http://localhost:8080`. Either run
`book-api` locally (see its README; its default CORS setting allows
`http://localhost:5173`), or point the app at another API in `.env.local`:

```bash
VITE_API_URL=https://book-api-oasv.onrender.com
```

To use the deployed API from `localhost`, its `CORS_ALLOWED_ORIGINS` must
include `http://localhost:5173`.

## Scripts

```bash
npm run dev               # dev server with hot reload
npm run build             # type-check, then production build into dist/
npm run lint              # ESLint
npm test                  # Vitest in watch mode
npm test -- --run         # all tests once, as CI runs them
npm run preview           # serve the production build
```

CI (GitHub Actions) runs lint, tests and build on every pull request.

## Deployment

The app is deployed on Vercel from `main`. Every merge deploys to production,
and every pull request gets a preview deployment.

- **Build:** Vercel detects Vite (`npm run build`, output `dist`).
- **`VITE_API_URL`:** set in the Vercel project to `https://book-api-oasv.onrender.com`.
  Vite builds it into the bundle, so changing it requires a redeploy.
- **`vercel.json`:** sends every path except `/assets/` to `index.html`, so
  reloading a page such as `/books/new` works.
- **CORS:** on Render, the API's `CORS_ALLOWED_ORIGINS` must contain the
  production URL, `https://book-app-frontend-lilac.vercel.app` (no trailing
  slash). Preview deployments have their own URLs and are not allowed, so they
  can't call the API.

## Specs

Feature specs live in [`docs/specs/`](docs/specs).
