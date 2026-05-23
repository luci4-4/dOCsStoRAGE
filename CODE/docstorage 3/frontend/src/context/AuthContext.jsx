import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('ds_user'))
    } catch {
      return null
    }
  })

  const login = async (username, password) => {
    const { data } = await api.post('/login_check', { username, password })
    localStorage.setItem('ds_token', data.token)
    const payload = JSON.parse(atob(data.token.split('.')[1]))
    const u = { username: payload.username || username, roles: payload.roles || [] }
    localStorage.setItem('ds_user', JSON.stringify(u))
    setUser(u)
  }

  const logout = () => {
    localStorage.removeItem('ds_token')
    localStorage.removeItem('ds_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
