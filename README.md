# Gr8r Studio

Gr8r Studio is a project and task workspace for planning work, tracking progress, and switching between a company view and a personal view. The app runs in the browser with local demo data, and it is structured so a real API can replace that data later.

## Features

- Workspace home with company health and a personal task view
- Projects, tasks, board and list views, calendar, and timeline
- Inbox, notifications, favorites, search, and activity
- Members, teams, profile, and workspace settings
- Archive and task details, including status, subtasks, and comments

## Stack

- Next.js 16 (App Router) and React 19
- TypeScript
- Zustand for client state
- Axios for HTTP, ready for a future API

## Project structure

```
src/
  app/          Routes and layouts only
  features/     Screens, UI, and feature logic
  components/   Shared layout, providers, and UI
  hooks/        Shared hooks
  lib/          Dates, seed data, workspace helpers, and the API client
  store/        Auth, workspace, view mode, and UI state
  styles/       Design tokens and global styles
  types/        Shared types
```

Route files re-export a feature page. Product code lives in `src/features`. Shared code stays in `src/components`, `src/hooks`, `src/lib`, and `src/store`.

`legacy/` keeps the previous static prototype. The running app does not use it.

## Getting started

Requires Node.js 20 or newer.

```bash
npm install
npm run dev
```

Open [http://localhost:3003](http://localhost:3003).

The first visit signs in as the demo user, Alex Morgan. Workspace data is stored in the browser under `gr8r.studio.v1`. Signing out and opening the login page accepts any email that contains `@` and a password of at least 4 characters.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the dev server on port 3003 |
| `npm run build` | Production build |
| `npm run start` | Serve the production build on port 3003 |
| `npm run lint` | Run ESLint |

## Environment

| Variable | Default | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001` | Base URL for the API client |

The current screens use local seed data. Set this variable when the app is connected to a backend.

## Deployment

The app deploys on Vercel from the repository root.

- Framework preset: Next.js
- Build command: `npm run build`
- Output directory: Next.js default
- Install command: `npm install`
