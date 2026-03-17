import { createContext, useContext, useEffect, useState } from 'react'
import { account, ID } from '../lib/appwrite'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    account.get()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  const signup = async (email, password, name) => {
    await account.create(ID.unique(), email, password, name)
    return login(email, password)
  }

  const login = async (email, password) => {
    await account.createEmailPasswordSession(email, password)
    const u = await account.get()
    setUser(u)
    return u
  }

  const logout = async () => {
    await account.deleteSession('current')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signup, login, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
