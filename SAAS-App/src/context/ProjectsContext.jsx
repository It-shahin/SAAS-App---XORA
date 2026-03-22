import { createContext, useContext, useEffect, useState } from 'react'
import { ID, Query } from 'appwrite'
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

    setLoading(true)
    try {
      const result = await databases.listDocuments({
        databaseId: DATABASE_ID,
        collectionId: COLLECTION_ID,
        queries: [Query.equal('userID', user.$id), Query.orderDesc('$createdAt')]
      })
      setProjects(result.documents)
    } catch (error) {
      console.error('Failed to fetch projects:', error)
      setProjects([])
    } finally {
      setLoading(false)
    }
  }

  const createProject = async (projectData) => {
    if (!user) {
      throw new Error('You must be logged in to create a project.')
    }

    const result = await databases.createDocument({
      databaseId: DATABASE_ID,
      collectionId: COLLECTION_ID,
      documentId: ID.unique(),
      data: {
        title: projectData.title.trim(),
        description: (projectData.description || '').trim(),
        style: projectData.style,
        status: 'draft',
        userID: user.$id,
        mode: projectData.mode || 'text',
        sourceImageUrl: projectData.imageUrl || '',
        rendersUsed: 0
      }
    })

    await fetchProjects()
    return result
  }

  const incrementUserRenders = async () => {
    const prefs = await account.getPrefs()
    const current = Number(prefs?.rendersUsed || 0)
    await account.updatePrefs({ ...prefs, rendersUsed: current + 1 })
  }

  const getUserRendersLeft = async () => {
    const prefs = await account.getPrefs()
    return FREE_PLAN_LIMIT - Number(prefs?.rendersUsed || 0)
  }

  const deleteProject = async (projectId) => {
    await databases.deleteDocument({
      databaseId: DATABASE_ID,
      collectionId: COLLECTION_ID,
      documentId: projectId
    })
    await fetchProjects()
  }

  useEffect(() => {
    fetchProjects()
  }, [user])

  return (
    <ProjectsContext.Provider
      value={{
        projects,
        loading,
        createProject,
        deleteProject,
        incrementUserRenders,
        getUserRendersLeft,
        fetchProjects
      }}
    >
      {children}
    </ProjectsContext.Provider>
  )
}

export const useProjects = () => useContext(ProjectsContext)

