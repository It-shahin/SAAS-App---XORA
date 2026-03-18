import { createContext, useContext, useEffect, useState } from 'react'
import { account, databases } from '../lib/appwrite'
import { useAuth } from './AuthContext'

const DATABASE_ID = '69ba0d06002eebdcbb81'
const COLLECTION_ID = 'projects'
export const FREE_PLAN_LIMIT = 3

const ProjectsContext = createContext(null)

export const ProjectsProvider = ({ children }) => {
  const { user } = useAuth()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchProjects = async () => {
    if (!user) {
      setProjects([])
      setLoading(false)
      return
    }
    try {
      const result = await databases.listDocuments({
        databaseId: DATABASE_ID,
        collectionId: COLLECTION_ID
      })
      const userProjects = result.documents.filter(doc => doc.userID === user.$id) // ← fixed typo
      setProjects(userProjects)
    } catch (error) {
      console.error('Failed to fetch projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const createProject = async (projectData) => {
    try {
      const result = await databases.createDocument({
        databaseId: DATABASE_ID,
        collectionId: COLLECTION_ID,
        documentId: 'unique()',
        data: {
          title: projectData.title,
          description: projectData.description,
          style: projectData.style,
          status: 'draft',
          userID: user.$id,
          mode: projectData.mode || 'text',
          sourceImageUrl: projectData.imageUrl || '',
          rendersUsed: 0  // ← initialize counter
        }
      })
      await fetchProjects()
      return result
    } catch (error) {
      console.error('Failed to create project:', error)
      throw error
    }
  }

  // ← moved INSIDE provider so it can access fetchProjects
  const incrementUserRenders = async () => {
  const prefs = await account.getPrefs()
  const current = prefs.rendersUsed || 0
  await account.updatePrefs({ rendersUsed: current + 1 })
}

// Call this to get renders left
const getUserRendersLeft = async () => {
  const prefs = await account.getPrefs()
  return FREE_PLAN_LIMIT - (prefs.rendersUsed || 0)
}

  const deleteProject = async (projectId) => {
    try {
      await databases.deleteDocument({
        databaseId: DATABASE_ID,
        collectionId: COLLECTION_ID,
        documentId: projectId
      })
      await fetchProjects()
    } catch (error) {
      console.error('Failed to delete project:', error)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [user])

  return (
    <ProjectsContext.Provider value={{
    projects,
    loading,
    createProject,
    deleteProject,
    incrementUserRenders  // ← add this
  }}>
    {children}
  </ProjectsContext.Provider>
  )
}

export const useProjects = () => useContext(ProjectsContext)
