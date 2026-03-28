import { ID, Query } from 'appwrite'
import { account, databases } from './appwrite'
import {
  APPWRITE_ASSETS_COLLECTION_ID,
  APPWRITE_COLLABORATORS_COLLECTION_ID,
  APPWRITE_COMMENTS_COLLECTION_ID,
  APPWRITE_DATABASE_ID,
  APPWRITE_SCENES_COLLECTION_ID
} from './config'

const getUserId = async () => {
  const user = await account.get()
  return user.$id
}

export const getScenes = async (projectId) => {
  const docs = await databases.listDocuments({
    databaseId: APPWRITE_DATABASE_ID,
    collectionId: APPWRITE_SCENES_COLLECTION_ID,
    queries: [Query.equal('projectId', projectId), Query.limit(1)]
  })
  const doc = docs.documents[0]
  return doc ? JSON.parse(doc.items || '[]') : []
}

export const saveScenes = async (projectId, scenes) => {
  const userID = await getUserId()
  const docs = await databases.listDocuments({
    databaseId: APPWRITE_DATABASE_ID,
    collectionId: APPWRITE_SCENES_COLLECTION_ID,
    queries: [Query.equal('projectId', projectId), Query.limit(1)]
  })
  const payload = { projectId, userID, items: JSON.stringify(scenes) }
  if (docs.documents[0]) {
    return databases.updateDocument({
      databaseId: APPWRITE_DATABASE_ID,
      collectionId: APPWRITE_SCENES_COLLECTION_ID,
      documentId: docs.documents[0].$id,
      data: payload
    })
  }
  return databases.createDocument({
    databaseId: APPWRITE_DATABASE_ID,
    collectionId: APPWRITE_SCENES_COLLECTION_ID,
    documentId: ID.unique(),
    data: payload
  })
}

export const getCollaborators = async (projectId) => {
  const docs = await databases.listDocuments({
    databaseId: APPWRITE_DATABASE_ID,
    collectionId: APPWRITE_COLLABORATORS_COLLECTION_ID,
    queries: [Query.equal('projectId', projectId), Query.limit(1)]
  })
  const doc = docs.documents[0]
  return doc ? JSON.parse(doc.emails || '[]') : []
}

export const saveCollaborators = async (projectId, collaborators) => {
  const userID = await getUserId()
  const docs = await databases.listDocuments({
    databaseId: APPWRITE_DATABASE_ID,
    collectionId: APPWRITE_COLLABORATORS_COLLECTION_ID,
    queries: [Query.equal('projectId', projectId), Query.limit(1)]
  })
  const payload = { projectId, userID, emails: JSON.stringify(collaborators) }
  if (docs.documents[0]) {
    return databases.updateDocument({
      databaseId: APPWRITE_DATABASE_ID,
      collectionId: APPWRITE_COLLABORATORS_COLLECTION_ID,
      documentId: docs.documents[0].$id,
      data: payload
    })
  }
  return databases.createDocument({
    databaseId: APPWRITE_DATABASE_ID,
    collectionId: APPWRITE_COLLABORATORS_COLLECTION_ID,
    documentId: ID.unique(),
    data: payload
  })
}

export const getComments = async (projectId) => {
  const docs = await databases.listDocuments({
    databaseId: APPWRITE_DATABASE_ID,
    collectionId: APPWRITE_COMMENTS_COLLECTION_ID,
    queries: [Query.equal('projectId', projectId), Query.orderDesc('$createdAt'), Query.limit(100)]
  })
  return docs.documents
}

export const addComment = async (projectId, text, author) => {
  const userID = await getUserId()
  return databases.createDocument({
    databaseId: APPWRITE_DATABASE_ID,
    collectionId: APPWRITE_COMMENTS_COLLECTION_ID,
    documentId: ID.unique(),
    data: { projectId, userID, text, author }
  })
}

export const listAssets = async () => {
  const userID = await getUserId()
  const docs = await databases.listDocuments({
    databaseId: APPWRITE_DATABASE_ID,
    collectionId: APPWRITE_ASSETS_COLLECTION_ID,
    queries: [Query.equal('userID', userID), Query.orderDesc('$createdAt'), Query.limit(200)]
  })
  return docs.documents
}

export const addAsset = async (name, url) => {
  const userID = await getUserId()
  return databases.createDocument({
    databaseId: APPWRITE_DATABASE_ID,
    collectionId: APPWRITE_ASSETS_COLLECTION_ID,
    documentId: ID.unique(),
    data: { userID, name, url }
  })
}

export const removeAsset = async (id) => {
  const userID = await getUserId()
  const doc = await databases.getDocument({
    databaseId: APPWRITE_DATABASE_ID,
    collectionId: APPWRITE_ASSETS_COLLECTION_ID,
    documentId: id
  })
  if (doc.userID !== userID) {
    throw new Error('You do not have permission to delete this asset.')
  }
  return databases.deleteDocument({
    databaseId: APPWRITE_DATABASE_ID,
    collectionId: APPWRITE_ASSETS_COLLECTION_ID,
    documentId: id
  })
}
