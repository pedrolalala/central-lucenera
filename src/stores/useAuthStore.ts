import { useState, useEffect } from 'react'

const AUTH_KEY = '@lucenera:auth'
let isAuthed = localStorage.getItem(AUTH_KEY) === 'true'
const listeners = new Set<() => void>()

const notify = () => {
  listeners.forEach((listener) => listener())
}

const store = {
  login: () => {
    isAuthed = true
    localStorage.setItem(AUTH_KEY, 'true')
    notify()
  },
  logout: () => {
    isAuthed = false
    localStorage.removeItem(AUTH_KEY)
    notify()
  },
  get: () => isAuthed,
}

export default function useAuthStore() {
  const [isAuthenticated, setIsAuthenticated] = useState(store.get())

  useEffect(() => {
    const listener = () => setIsAuthenticated(store.get())
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }, [])

  return {
    isAuthenticated,
    login: store.login,
    logout: store.logout,
  }
}
