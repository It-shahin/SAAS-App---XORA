import { createContext, useContext, useEffect, useState } from 'react'
import { databases } from '../lib/appwrite'
import { useAuth } from './AuthContext'

// YOUR EXACT IDs FROM APPWRITE CONSOLE
const DATABASE_ID = '69ba0d06002eebdcbb81'   // ← your database ID
const COLLECTION_ID = 'projects' // ← your table/collection ID

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
      const userProjects = result.documents.filter(doc => doc.userId === user.$iD)
      setProjects(userProjects)
    } catch (error) {
      console.error('Failed to fetch projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const createProject = async (projectData) => {
  if (!user) throw new Error('Not logged in')
  try {
    const result = await databases.createDocument({
      databaseId: DATABASE_ID,
      collectionId: COLLECTION_ID,
      documentId: 'unique()',
      data: {
        title: projectData.title,
        description: projectData.description,
        status: 'draft',
        userID: user.$id
      }
    })
    await fetchProjects()
    return result
  } catch (error) {
    console.error('Failed to create project:', error)
    throw error
  }
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
      refetch: fetchProjects
    }}>
      {children}
    </ProjectsContext.Provider>
  )
}

export const useProjects = () => useContext(ProjectsContext)
