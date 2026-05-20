import { loginApi, meApi } from "@/Api/authApi"
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
  userName: string
  email?: string
  phone?: string | number
  departmentId?: number
  deptId?: number
  role: string
  location?: string
  name?: string
  employeeId?: number
  departmentName?: string
  departmentHod?: HODDetails
}

export type ApiLoginResponse = {
  userId: number
  userName: string
  email: string | null
  mobile: number | string
  deptId: number
  userRole: string
  location?: string
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

type LoginResponse = ApiLoginResponse

export const STORAGE_KEY = "auth_session"
const API_URL = import.meta.env.VITE_API_URL ?? "/access-portal/api"

function normalizeUser(payload: ApiLoginResponse): AuthUser {
  return {
    userId: payload.userId,
    userName: payload.userName,
    email: payload.email ?? undefined,
    phone: payload.mobile,
    departmentId: payload.deptId,
    deptId: payload.deptId,
    role: payload.userRole,
    location: payload.location,
    name: payload.userName,
  }
}

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
        fetchUserDetails(JSON.parse(storedSession).userId)
      } catch (e) {
        localStorage.removeItem(STORAGE_KEY)
      }
    }
    setIsLoading(false)
  }, [])

  //call meApi after login to get user details with pass userid and get data from response and set in user state and session storage
  const fetchUserDetails = async (userId: number) => {
    try {
      const userDetails = await meApi(userId)
      const sessionUser = normalizeUser(userDetails)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionUser))
      setUser(sessionUser)
    } catch (error) {
      console.error("Failed to fetch user details:", error)
    }
  }

  const login = async (identifier: string, password: string) => {
    setIsLoading(true)
    try {
      const payload = await loginApi({ identifier, password }) as LoginResponse
      const sessionUser = normalizeUser(payload)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionUser))
      setUser(sessionUser)
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

      const payload = await safeParseJson<ApiLoginResponse>(response)
      const sessionUser = normalizeUser(payload)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionUser))
      setUser(sessionUser)
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
