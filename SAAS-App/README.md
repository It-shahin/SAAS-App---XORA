# SAAS App — Xora / Trimix AI

A React + Vite + Tailwind SaaS application for AI-powered video generation, built with Appwrite as the backend.

## Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS
- **Backend / Auth / DB:** Appwrite
- **Video Rendering:** Shotstack API
- **Deployment:** Netlify

## Getting Started

### 1. Install dependencies

```bash
cd SAAS-App
npm install
```

### 2. Set up environment variables

Create a `.env` file inside `SAAS-App/` with the following:

```env
VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=your_project_id
VITE_APPWRITE_DATABASE_ID=your_database_id
VITE_APPWRITE_PROJECTS_COLLECTION_ID=your_projects_collection_id
VITE_APPWRITE_SHARES_COLLECTION_ID=your_shares_collection_id
VITE_SHOTSTACK_API_KEY=your_shotstack_key
```

### 3. Run locally

```bash
npm run dev
```

### 4. Build for production

```bash
npm run build
```

## Project Structure

```
src/
  pages/        # Route-level page components
  components/   # Reusable UI components
    project/    # ProjectDetail sub-components (StyleOptions, SharePanel, etc.)
  context/      # React Context providers (Auth, Projects)
  lib/          # Appwrite client, Shotstack, helpers
  sections/     # Landing page sections
  constants/    # Static data
```

## Deployment

The app is configured for Netlify via `netlify.toml`. Make sure to set all environment variables in the Netlify dashboard under **Site Settings → Environment Variables**.
