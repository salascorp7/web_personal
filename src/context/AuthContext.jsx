import { createContext, useContext, useState, useCallback } from 'react'

const TOKEN_KEY = 'salascorp_token'
const USER_KEY  = 'salascorp_user'

function parseJwt(token) {
  try { return JSON.parse(atob(token.split('.')[1])) }
  catch { return null }
}

function isTokenValid(token) {
  if (!token) return false
  const payload = parseJwt(token)
  if (!payload) return false
  return payload.exp * 1000 > Date.now()
}

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const t = localStorage.getItem(TOKEN_KEY)
    if (!isTokenValid(t)) {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      return null
    }
    const stored = localStorage.getItem(USER_KEY)
    return stored ? JSON.parse(stored) : null
  })

  const login = useCallback(async (googleCredential) => {
    const res = await fetch('/api/auth/google', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ credential: googleCredential }),
    })

    let data = {}
    try { data = await res.json() } catch {
      throw new Error('El servidor no responde. ¿Está corriendo node server.js?')
    }

    if (!res.ok) throw new Error(data.error || 'Error de autenticación')

    const userData = { name: data.name, email: data.email, role: data.role, picture: data.picture }
    localStorage.setItem(TOKEN_KEY, data.token)
    localStorage.setItem(USER_KEY, JSON.stringify(userData))
    setUser(userData)
    return data
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setUser(null)
  }, [])

  const getToken = useCallback(() => localStorage.getItem(TOKEN_KEY), [])

  return (
    <AuthContext.Provider value={{
      user,
      isAdmin:         user?.role === 'admin',
      isAuthenticated: !!user,
      login,
      logout,
      getToken,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
