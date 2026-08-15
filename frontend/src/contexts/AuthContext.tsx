import React, { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'

interface User {
  id: string
  username: string
  email: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (access: string, refresh: string, userData: User) => void
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export const api = axios.create({
  baseURL: 'http://localhost:8000/api/',
})

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('user_data')
    return savedUser ? JSON.parse(savedUser) : null
  })
  
  const [token, setToken] = useState<string | null>(() => {
    const savedToken = localStorage.getItem('access_token')
    if (savedToken) {
      api.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`
    }
    return savedToken || null
  })

  const login = (access: string, refresh: string, userData: User) => {
    localStorage.setItem('access_token', access)
    localStorage.setItem('refresh_token', refresh)
    localStorage.setItem('user_data', JSON.stringify(userData))
    setToken(access)
    setUser(userData)
    api.defaults.headers.common['Authorization'] = `Bearer ${access}`
  }

  const logout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user_data')
    setToken(null)
    setUser(null)
    delete api.defaults.headers.common['Authorization']
    toast.success('Logged out successfully')
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
