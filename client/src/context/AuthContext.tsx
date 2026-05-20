import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"

export type HODDetails = {
  employeeId: number
  name: string
  email: string
}

export type AuthUser = {
  userId: number
  employeeId: number
  userName: string
  name: string
  email: string
  phone: string
  departmentId: number
  departmentName: string
  role: string
  departmentHod: HODDetails
}

// Data shape for the registration request
export type RegisterRequest = {
  employee_id: string
  first_name: string
  last_name: string
  user_name: string
  email: string
  mobile: string
  dept_id: string
  location?: string
  password?: string
}

type AuthContextValue = {
  isAuthenticated: boolean
  isLoading: boolean
  login: (identifier: string, password: string) => Promise<void>
  register: (data: RegisterRequest) => Promise<void>
  logout: () => void
  setSessionUser: (user: AuthUser) => void
  user: AuthUser | null
}

type LoginResponse = {
  session: {
    user: AuthUser
  }
}

export const STORAGE_KEY = "auth_session"
const API_URL = import.meta.env.VITE_API_URL ?? "/access-portal/api"

async function safeParseJson<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type")
  if (contentType && !contentType.includes("application/json")) {
    throw new Error("Server returned non-JSON response")
  }
  try {
    return await response.json()
  } catch (error) {
    throw new Error("Failed to parse server response")
  }
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const storedSession = localStorage.getItem(STORAGE_KEY)
    if (storedSession) {
      try {
        setUser(JSON.parse(storedSession) as AuthUser)
      } catch (e) {
        localStorage.removeItem(STORAGE_KEY)
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (identifier: string, password: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      })

      if (!response.ok) {
        throw new Error(
          response.status === 401 ? "Invalid credentials." : "Login failed."
        )
      }

      const payload = await safeParseJson<LoginResponse>(response)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload.session.user))
      setUser(payload.session.user)
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (data: RegisterRequest) => {
    setIsLoading(true)
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || "Registration failed.")
      }

      const payload = await safeParseJson<LoginResponse>(response)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload.session.user))
      setUser(payload.session.user)
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY)
    setUser(null)
  }

  const setSessionUser = (nextUser: AuthUser) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser))
    setUser(nextUser)
  }

  const value = useMemo(
    () => ({
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      register,
      logout,
      setSessionUser,
      user,
    }),
    [isLoading, user]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within AuthProvider")
  return context
}
