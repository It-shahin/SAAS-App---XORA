import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const checks = [
  { label: 'App routes', file: 'src/App.jsx' },
  { label: 'Project detail page', file: 'src/pages/ProjectDetail.jsx' },
  { label: 'Render text function', file: 'netlify/functions/render-text.js' },
  { label: 'Render status function', file: 'netlify/functions/render-status.js' },
  { label: 'Assets page', file: 'src/pages/Assets.jsx' },
  { label: 'Billing page', file: 'src/pages/Billing.jsx' },
  { label: 'Settings page', file: 'src/pages/ChangePassword.jsx' }
]

let hasFailure = false
for (const check of checks) {
  const fullPath = path.join(root, check.file)
  if (!fs.existsSync(fullPath)) {
    hasFailure = true
    console.error(`FAIL: ${check.label} missing -> ${check.file}`)
  } else {
    console.log(`OK: ${check.label}`)
  }
}

if (!process.env.SHOTSTACK_API_KEY) {
  console.warn('WARN: SHOTSTACK_API_KEY is not set in this shell environment.')
}

if (hasFailure) {
  process.exit(1)
}

console.log('MVP smoke check passed.')
