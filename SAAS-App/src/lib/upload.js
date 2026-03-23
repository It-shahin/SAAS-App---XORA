import { storage, ID } from './appwrite'
import { APPWRITE_ASSETS_BUCKET_ID } from './config'

export const uploadImage = async (file) => {
  if (!file) {
    throw new Error('No file selected.')
  }

  const result = await storage.createFile({
    bucketId: APPWRITE_ASSETS_BUCKET_ID,
    fileId: ID.unique(),
    file: file
  })

  // Build public URL
  const url = `${import.meta.env.VITE_APPWRITE_ENDPOINT}/storage/buckets/${APPWRITE_ASSETS_BUCKET_ID}/files/${result.$id}/view?project=${import.meta.env.VITE_APPWRITE_PROJECT_ID}`

  return url
}
