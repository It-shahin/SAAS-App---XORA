/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { ID, Query } from 'appwrite'
import { account, databases } from '../lib/appwrite'
import { useAuth } from './AuthContext'
import { APPWRITE_DATABASE_ID, APPWRITE_PROJECTS_COLLECTION_ID } from '../lib/config'

export const FREE_PLAN_LIMIT = 3
export const PRO_PLAN_LIMIT = 100

const ProjectsContext = createContext(null)

export const ProjectsProvider = ({ children }) => {
  const { user } = useAuth()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchProjects = useCallback(async () => {
    if (!user) {
      setProjects([])
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const result = await databases.listDocuments({
        databaseId: APPWRITE_DATABASE_ID,
        collectionId: APPWRITE_PROJECTS_COLLECTION_ID,
        queries: [Query.equal('userID', user.$id), Query.orderDesc('$createdAt')]
      })
      setProjects(result.documents)
    } catch (error) {
      console.error('Failed to fetch projects:', error)
      setProjects([])
    } finally {
      setLoading(false)
    }
  }, [user])

  const createProject = async (projectData) => {
    if (!user) {
      throw new Error('You must be logged in to create a project.')
    }

    const result = await databases.createDocument({
      databaseId: APPWRITE_DATABASE_ID,
      collectionId: APPWRITE_PROJECTS_COLLECTION_ID,
      documentId: ID.unique(),
      data: {
        title: projectData.title.trim(),
        description: (projectData.description || '').trim(),
        status: 'draft',
        userID: user.$id,
        mode: projectData.mode || 'text',
        sourceImageUrl: projectData.imageUrl || '',
        rendersUsed: 0
      }
    })

    // Optimistic update — prepend new project instead of re-fetching
    setProjects((prev) => [result, ...prev])
    return result
  }

  const deleteProject = async (projectId) => {
    await databases.deleteDocument({
      databaseId: APPWRITE_DATABASE_ID,
      collectionId: APPWRITE_PROJECTS_COLLECTION_ID,
      documentId: projectId
    })
    // Optimistic update — remove locally instead of re-fetching
    setProjects((prev) => prev.filter((p) => p.$id !== projectId))
  }

  const incrementUserRenders = async () => {
    const prefs = await account.getPrefs()
    const current = Number(prefs?.rendersUsed || 0)
    await account.updatePrefs({ ...prefs, rendersUsed: current + 1 })
  }

  const getUserRendersLeft = async () => {
    const prefs = await account.getPrefs()
    const limit = Number(prefs?.renderLimit || FREE_PLAN_LIMIT)
    return limit - Number(prefs?.rendersUsed || 0)
  }

  const getPlanInfo = async () => {
    const prefs = await account.getPrefs()
    return {
      plan: prefs?.plan || 'free',
      renderLimit: Number(prefs?.renderLimit || FREE_PLAN_LIMIT),
      rendersUsed: Number(prefs?.rendersUsed || 0)
    }
  }

  const upgradePlan = async () => {
    const prefs = await account.getPrefs()
    await account.updatePrefs({
      ...prefs,
      plan: 'pro',
      renderLimit: PRO_PLAN_LIMIT
    })
  }

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  return (
    <ProjectsContext.Provider
      value={{
        projects,
        loading,
        createProject,
        deleteProject,
        incrementUserRenders,
        getUserRendersLeft,
        getPlanInfo,
        upgradePlan,
        fetchProjects
      }}
    >
      {children}
    </ProjectsContext.Provider>
  )
}

export const useProjects = () => useContext(ProjectsContext)
