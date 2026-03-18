import { storage, ID } from './appwrite'

const BUCKET_ID = '69bab09f003754eae4c6'

export const uploadImage = async (file) => {
  const result = await storage.createFile({
    bucketId: BUCKET_ID,
    fileId: ID.unique(),
    file: file
  })

  // Build public URL
  const url = `${import.meta.env.VITE_APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${result.$id}/view?project=${import.meta.env.VITE_APPWRITE_PROJECT_ID}`

  return url
}
