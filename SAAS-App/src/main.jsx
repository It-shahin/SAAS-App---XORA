import React, { lazy, Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'

const requiredSettings = [
  'VITE_APPWRITE_PROJECT_ID',
  'VITE_APPWRITE_DATABASE_ID',
  'VITE_APPWRITE_PROJECTS_COLLECTION_ID',
  'VITE_APPWRITE_SHARES_COLLECTION_ID',
  'VITE_APPWRITE_ASSETS_BUCKET_ID',
  'VITE_APPWRITE_SCENES_COLLECTION_ID',
  'VITE_APPWRITE_COMMENTS_COLLECTION_ID',
  'VITE_APPWRITE_COLLABORATORS_COLLECTION_ID',
  'VITE_APPWRITE_ASSETS_COLLECTION_ID',
]
const isConfigured = requiredSettings.every((key) => Boolean(import.meta.env[key]))
const ConfiguredApp = lazy(() => import('./configured-app.jsx'))

ReactDOM.createRoot(document.getElementById('root')).render(
  isConfigured ? (
    <Suspense fallback={<main className="min-h-screen grid place-items-center bg-[#080b18] text-white">Loading…</main>}>
      <ConfiguredApp />
    </Suspense>
  ) : (
    <main className="min-h-screen flex items-center justify-center bg-[#080b18] px-6 text-white">
      <section className="max-w-xl rounded-3xl border border-white/10 bg-white/5 p-10 text-center">
        <p className="mb-4 text-sm uppercase tracking-widest text-purple-300">Trimix AI</p>
        <h1 className="mb-4 text-4xl font-bold">We're getting things ready</h1>
        <p className="text-lg text-white/70">This workspace is waiting for its service setup. Please check back soon.</p>
      </section>
    </main>
  )
)
