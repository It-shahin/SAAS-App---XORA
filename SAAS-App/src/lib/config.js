const getRequiredEnv = (key) => {
  const value = import.meta.env[key]
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}

export const APPWRITE_DATABASE_ID = getRequiredEnv('VITE_APPWRITE_DATABASE_ID')
export const APPWRITE_PROJECTS_COLLECTION_ID = getRequiredEnv('VITE_APPWRITE_PROJECTS_COLLECTION_ID')
export const APPWRITE_SHARES_COLLECTION_ID = getRequiredEnv('VITE_APPWRITE_SHARES_COLLECTION_ID')
export const APPWRITE_ASSETS_BUCKET_ID = getRequiredEnv('VITE_APPWRITE_ASSETS_BUCKET_ID')
export const APPWRITE_SCENES_COLLECTION_ID = getRequiredEnv('VITE_APPWRITE_SCENES_COLLECTION_ID')
export const APPWRITE_COMMENTS_COLLECTION_ID = getRequiredEnv('VITE_APPWRITE_COMMENTS_COLLECTION_ID')
export const APPWRITE_COLLABORATORS_COLLECTION_ID = getRequiredEnv('VITE_APPWRITE_COLLABORATORS_COLLECTION_ID')
export const APPWRITE_ASSETS_COLLECTION_ID = getRequiredEnv('VITE_APPWRITE_ASSETS_COLLECTION_ID')
export const RENDER_PROXY_URL = getRequiredEnv('VITE_RENDER_PROXY_URL')
