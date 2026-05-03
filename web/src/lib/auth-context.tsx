"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { useSession, signOut } from "next-auth/react"
import { api, getStoredApiKey, setStoredApiKey, clearStoredApiKey } from "@/lib/api"
import type { ContributorStats, ContributorTier, ContributorWithKey } from "@/lib/types"

interface AuthContextType {
    isAuthenticated: boolean
    isLoading: boolean
    user: ContributorStats | null
    authMethod: "api_key" | "oauth" | null
    login: (apiKey: string) => void
    logout: () => void
    register: (email: string, displayName?: string) => Promise<ContributorWithKey>
    refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const { data: session, status: sessionStatus } = useSession()
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [user, setUser] = useState<ContributorStats | null>(null)
    const [authMethod, setAuthMethod] = useState<"api_key" | "oauth" | null>(null)

    // Check for existing API key or OAuth session on mount
    useEffect(() => {
        const checkAuth = async () => {
            // 1. First check for API key
            const storedKey = getStoredApiKey()
            if (storedKey) {
                try {
                    const profile = await api.getProfile()
                    setUser(profile)
                    setIsAuthenticated(true)
                    setAuthMethod("api_key")
                    setIsLoading(false)
                    return
                } catch {
                    clearStoredApiKey()
                }
            }

            // 2. Check for OAuth session and link/create contributor
            if (sessionStatus === "authenticated" && session?.user?.email) {
                try {
                    // Call backend to find or create contributor
                    const result = await api.oauthLogin(
                        session.user.email,
                        session.user.name || null,
                        "oauth"
                    )

                    // If new user, store the API key
                    if (result.is_new_user && result.api_key) {
                        setStoredApiKey(result.api_key)
                    }

                    // Fetch full profile with API key if we have one
                    const storedKeyAfterOAuth = getStoredApiKey()
                    if (storedKeyAfterOAuth) {
                        try {
                            const profile = await api.getProfile()
                            setUser(profile)
                            setIsAuthenticated(true)
                            setAuthMethod("api_key")
                            setIsLoading(false)
                            return
                        } catch {
                            // Fall through to OAuth-only auth
                        }
                    }

                    // OAuth-only auth (existing user without stored key)
                    setIsAuthenticated(true)
                    setAuthMethod("oauth")
                    setUser({
                        id: result.id,
                        email: result.email,
                        display_name: result.display_name || undefined,
                        tier: result.tier as ContributorTier,
                        total_submissions: 0,
                        validated_submissions: 0,
                        rate_limit_per_hour: 100,
                        progress_to_next_tier: { current: 0, required: 50, next_tier: "BRONZE" },
                        created_at: new Date().toISOString(),
                    })
                    setIsLoading(false)
                    return
                } catch (error) {
                    console.error("OAuth login failed:", error)
                }
            }

            setIsLoading(sessionStatus === "loading")
        }
        checkAuth()
    }, [session, sessionStatus])

    const login = (apiKey: string) => {
        setStoredApiKey(apiKey)
        setIsAuthenticated(true)
        setAuthMethod("api_key")
        refreshUser()
    }

    const logout = async () => {
        clearStoredApiKey()
        setIsAuthenticated(false)
        setAuthMethod(null)
        setUser(null)
        // Also sign out from NextAuth if using OAuth
        if (authMethod === "oauth") {
            await signOut({ redirect: false })
        }
    }

    const register = async (email: string, displayName?: string) => {
        const result = await api.register({ email, display_name: displayName })
        setStoredApiKey(result.api_key)
        setIsAuthenticated(true)
        setAuthMethod("api_key")
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
                authMethod,
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

