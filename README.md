# Trimix AI

A full-stack video generation workspace that combines a React interface, Appwrite services, and server-side Shotstack rendering.

## Overview

Trimix AI lets authenticated users create text-based or image-based video projects, organize reusable media, and track rendering progress from a single workspace. Appwrite provides account sessions, document persistence, and file storage; a local Node.js proxy or Netlify Functions keeps Shotstack requests on the server. The repository implements an MVP workflow from project creation and scene editing through rendering, playback, and configurable sharing.

## Features

- Email/password registration, login, logout, recovery, and password changes through Appwrite.
- Protected dashboard, project, asset, usage, and settings routes.
- Create, edit, list, and delete text-to-video or image-to-video projects.
- Edit scene text and duration metadata.
- Customize title and body colors, font sizes, alignment, vertical position, backgrounds, and optional music.
- Persist render options per project and restore them on later visits.
- Submit Shotstack renders through server-side proxy endpoints and poll queue status until completion.
- Recover projects left in a processing state after an interrupted render.
- Upload, search, reuse, link, and remove account-scoped Appwrite media assets.
- Create share pages with expiry, password-prompt, and download-toggle options at the UI layer.
- Store project comments and collaborator email lists, with mail-client invitations.
- Track render usage and free/pro plan state; no payment processor is integrated.

## Tech Stack

### Frontend

- React 19
- React Router 7
- Tailwind CSS 3
- Vite 7
- clsx, react-countup, react-scroll, and react-slidedown

### Backend and Services

- Appwrite Account, Databases, and Storage
- Netlify Functions
- Node.js local render proxy
- Shotstack stage API

### Tooling and Deployment

- Netlify
- ESLint 9
- npm
- Structural MVP smoke script

## Architecture

```text
React SPA
├── Appwrite Account ───────────────► sessions and password recovery
├── Appwrite Databases/Storage ─────► projects, scenes, assets, comments, shares
└── Render client
    └── local Node proxy or Netlify Functions
        └── Shotstack API ──────────► render job status and generated video URL
```

`AuthContext` owns the Appwrite session state, while `ProjectsContext` coordinates project lists, quota preferences, and project mutations. Route-level pages use those contexts plus focused modules for Appwrite configuration, asset upload, collaboration records, and render requests. Production API routes are mapped to three Netlify Functions by `netlify.toml`; local development can use the equivalent Node proxy.

Appwrite database collections and their permission rules are managed outside this repository. The configured resources must match the identifiers below before the application can load.

## Getting Started

### Prerequisites

- A recent Node.js release and npm
- An Appwrite project with Account, Databases, and Storage configured
- A Shotstack stage API key

### Installation

```bash
git clone https://github.com/It-shahin/SAAS-App---XORA.git
cd SAAS-App---XORA/SAAS-App
npm ci --legacy-peer-deps
```

The legacy peer-resolution flag is currently required because `react-slidedown` does not declare React 19 compatibility. Replace or upgrade that dependency before returning to a standard `npm ci` workflow.

### Environment Variables

Create `SAAS-App/.env` for local development:

```env
VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=
VITE_APPWRITE_DATABASE_ID=
VITE_APPWRITE_PROJECTS_COLLECTION_ID=
VITE_APPWRITE_SHARES_COLLECTION_ID=
VITE_APPWRITE_ASSETS_BUCKET_ID=
VITE_APPWRITE_SCENES_COLLECTION_ID=
VITE_APPWRITE_COMMENTS_COLLECTION_ID=
VITE_APPWRITE_COLLABORATORS_COLLECTION_ID=
VITE_APPWRITE_ASSETS_COLLECTION_ID=
VITE_RENDER_PROXY_URL=http://localhost:8787

SHOTSTACK_API_KEY=
RENDER_PROXY_PORT=8787
```

`RENDER_PROXY_PORT` is optional and defaults to `8787`. `SHOTSTACK_API_KEY` is server-only: configure it in the Netlify environment for deployment and never expose it with a `VITE_` prefix. For the Netlify redirects in this repository, set `VITE_RENDER_PROXY_URL=/` in the production build environment.

### Running Locally

Start the render proxy in one terminal:

```bash
npm run dev:proxy
```

Start the Vite application in a second terminal:

```bash
npm run dev
```

### Validation Commands

```bash
npm run lint
npm run smoke:mvp
npm run build
```

`smoke:mvp` verifies that the core MVP files are present; it is not an end-to-end test suite.

## Project Structure

```text
SAAS-App/
├── netlify/functions/   # Production Shotstack proxy endpoints
├── scripts/             # MVP structure smoke check
├── server/              # Local Node.js render proxy
├── src/components/      # Reusable and project-specific UI
├── src/context/         # Authentication and project state
├── src/lib/             # Appwrite, uploads, collaboration, and rendering
├── src/pages/           # Route-level application screens
├── src/sections/        # Public landing-page sections
└── netlify.toml         # Build, function, API, and SPA routing
```

## Key Technical Highlights

- Third-party render calls are centralized behind server-side adapters so the production Shotstack key does not need to enter the browser bundle.
- Render jobs use explicit queue states, four-second polling, timeout recovery, and persisted completion URLs.
- Project render styling is serialized to Appwrite after a debounce and restored when the project reopens.
- Account-scoped queries and ownership checks separate each user's projects and reusable assets in the client workflow.
- The same client render interface works with a local Node server and production Netlify Functions.

## Security Notes

- Treat Appwrite collection and bucket permissions as the authorization boundary; client-side route and owner checks are not sufficient on their own.
- Add authentication, authorization, abuse controls, and rate limiting to the render endpoints before a public production launch.
- Move share expiry, password verification, and download policy enforcement to a server-side layer before using share links for sensitive media.
- Enforce plans and render quotas on trusted server infrastructure before connecting a payment provider.

## Future Improvements

- Add automated unit, integration, and end-to-end tests for authentication, project ownership, rendering, and sharing.
- Version the required Appwrite collection attributes, indexes, and permissions as infrastructure configuration.
- Add server-authoritative entitlements and a real billing integration if paid plans are introduced.

## Author

**Chahin Boudra**

- GitHub: [It-shahin](https://github.com/It-shahin)
- LinkedIn: [chahin-boudra](https://www.linkedin.com/in/chahin-boudra/)
