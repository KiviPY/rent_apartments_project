import { createContext, useContext, useEffect, useState } from "react"
import { api, setToken, clearToken } from "../api"

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [account, setAccount] = useState(undefined) // undefined = загружается

  // При старте пробуем восстановить сессию через refresh токен
  useEffect(() => {
    const refresh = localStorage.getItem("refresh")
    if (!refresh) { setAccount(null); return }

    api.refresh()
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => {
        setToken(data.access)
        return api.me()
      })
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => setAccount(data))
      .catch(() => {
        localStorage.removeItem("refresh")
        clearToken()
        setAccount(null)
      })
  }, [])

  const login = (tokens, user) => {
    setToken(tokens.access)
    localStorage.setItem("refresh", tokens.refresh)
    setAccount(user)
  }

  const logout = async () => {
    await api.logout().catch(() => {})
    clearToken()
    localStorage.removeItem("refresh")
    setAccount(null)
  }

  return (
    <AuthContext.Provider value={{ account, setAccount, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)