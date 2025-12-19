"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { api, getStoredApiKey, setStoredApiKey, clearStoredApiKey } from "@/lib/api"
import type { ContributorStats, ContributorWithKey } from "@/lib/types"

interface AuthContextType {
    isAuthenticated: boolean
    isLoading: boolean
    user: ContributorStats | null
    login: (apiKey: string) => void
    logout: () => void
    register: (email: string, displayName?: string) => Promise<ContributorWithKey>
    refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [user, setUser] = useState<ContributorStats | null>(null)

    // Check for existing API key on mount
    useEffect(() => {
        const checkAuth = async () => {
            const storedKey = getStoredApiKey()
            if (storedKey) {
                try {
                    const profile = await api.getProfile()
                    setUser(profile)
                    setIsAuthenticated(true)
                } catch {
                    // Key is invalid, clear it
                    clearStoredApiKey()
                }
            }
            setIsLoading(false)
        }
        checkAuth()
    }, [])

    const login = (apiKey: string) => {
        setStoredApiKey(apiKey)
        setIsAuthenticated(true)
        refreshUser()
    }

    const logout = () => {
        clearStoredApiKey()
        setIsAuthenticated(false)
        setUser(null)
    }

    const register = async (email: string, displayName?: string) => {
        const result = await api.register({ email, display_name: displayName })
        // Store the API key
        setStoredApiKey(result.api_key)
        setIsAuthenticated(true)
        // Fetch full profile
        await refreshUser()
        return result
    }

    const refreshUser = async () => {
        try {
            const profile = await api.getProfile()
            setUser(profile)
        } catch (error) {
            console.error("Failed to refresh user:", error)
        }
    }

    return (
        <AuthContext.Provider
            value={{
                isAuthenticated,
                isLoading,
                user,
                login,
                logout,
                register,
                refreshUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider")
    }
    return context
}
