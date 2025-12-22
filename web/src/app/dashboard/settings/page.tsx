"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/atoms/button"
import { Input } from "@/components/atoms/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/molecules/card"
import { Label } from "@radix-ui/react-label"
import { Copy, Key, Shield, User, CheckCircle2, Loader2, AlertTriangle, X } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { api, getStoredApiKey, setStoredApiKey } from "@/lib/api"
import type { ContributorStats } from "@/lib/types"

export default function SettingsPage() {
    const { user, isAuthenticated, refreshUser } = useAuth()
    const [profile, setProfile] = useState<ContributorStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [copied, setCopied] = useState(false)

    // Regenerate state
    const [showRegenerateModal, setShowRegenerateModal] = useState(false)
    const [regenerating, setRegenerating] = useState(false)
    const [newApiKey, setNewApiKey] = useState<string | null>(null)
    const [regenerateError, setRegenerateError] = useState<string | null>(null)

    // Get masked API key from storage
    const storedKey = getStoredApiKey()
    const maskedKey = storedKey
        ? `${storedKey.substring(0, 12)}${"•".repeat(20)}${storedKey.slice(-4)}`
        : "No API key stored"

    useEffect(() => {
        async function fetchProfile() {
            if (!isAuthenticated) {
                setLoading(false)
                return
            }
            try {
                const data = await api.getProfile()
                setProfile(data)
            } catch (error) {
                console.error("Failed to fetch profile:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchProfile()
    }, [isAuthenticated])

    const handleCopy = () => {
        if (storedKey) {
            navigator.clipboard.writeText(storedKey)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const handleRegenerateKey = async () => {
        setRegenerating(true)
        setRegenerateError(null)

        try {
            const result = await api.regenerateKey()
            setNewApiKey(result.api_key)
            setStoredApiKey(result.api_key)
            refreshUser()
        } catch (error) {
            setRegenerateError(error instanceof Error ? error.message : "Failed to regenerate key")
        } finally {
            setRegenerating(false)
        }
    }

    const handleCloseModal = () => {
        setShowRegenerateModal(false)
        setNewApiKey(null)
        setRegenerateError(null)
    }

    return (
        <div className="max-w-4xl space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-white mb-2">Account Settings</h2>
                <p className="text-muted-foreground">
                    Manage your profile, API keys, and security preferences.
                </p>
            </div>

            {!isAuthenticated && (
                <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-4">
                    <p className="text-yellow-400">You must be logged in to view settings.</p>
                </div>
            )}

            <div className="grid gap-6">
                {/* Profile Section */}
                <Card className="glass-card">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5 text-primary" />
                            Profile Information
                        </CardTitle>
                        <CardDescription>Your contributor profile details.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Display Name</Label>
                            <Input
                                value={profile?.email?.split("@")[0] || "—"}
                                disabled
                                className="opacity-70"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Email Address</Label>
                            <Input
                                value={profile?.email || "—"}
                                disabled
                                className="opacity-50"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Current Tier</Label>
                            <Input
                                value={profile?.tier ? profile.tier.charAt(0).toUpperCase() + profile.tier.slice(1) : "—"}
                                disabled
                                className="opacity-70 capitalize"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Member Since</Label>
                            <Input
                                value={profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "—"}
                                disabled
                                className="opacity-70"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* API Key Section */}
                <Card className="glass-card border-purple-500/20 bg-purple-500/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-purple-400">
                            <Key className="h-5 w-5" />
                            API Credentials
                        </CardTitle>
                        <CardDescription>
                            Use this key to authenticate requests from your Python scripts or IoT devices.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-2">
                            <Input
                                value={maskedKey}
                                readOnly
                                className="font-mono bg-black/40 border-purple-500/30 text-purple-300"
                            />
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={handleCopy}
                                className={copied ? "border-green-500 text-green-500" : ""}
                            >
                                {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            </Button>
                        </div>
                        <div className="text-sm text-yellow-500/80 bg-yellow-500/10 p-3 rounded-md border border-yellow-500/20">
                            <Shield className="h-4 w-4 inline mr-2" />
                            Keep this key secret. Do not commit it to public repositories.
                        </div>
                    </CardContent>
                    <CardFooter className="justify-between border-t border-purple-500/10 pt-6">
                        <p className="text-xs text-muted-foreground">
                            Last activity: {profile?.last_activity_at ? new Date(profile.last_activity_at).toLocaleString() : "Never"}
                        </p>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setShowRegenerateModal(true)}
                        >
                            Regenerate Key
                        </Button>
                    </CardFooter>
                </Card>
            </div>

            {/* Regenerate Confirmation Modal */}
            {showRegenerateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleCloseModal} />
                    <div className="relative z-10 w-full max-w-md p-6 rounded-2xl bg-zinc-900 border border-white/10 shadow-2xl animate-in fade-in zoom-in duration-200">
                        <button
                            onClick={handleCloseModal}
                            className="absolute top-4 right-4 text-muted-foreground hover:text-white"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        {!newApiKey ? (
                            <>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                                        <AlertTriangle className="h-6 w-6 text-red-500" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">Regenerate API Key?</h3>
                                        <p className="text-sm text-muted-foreground">This action is irreversible</p>
                                    </div>
                                </div>

                                <p className="text-sm text-zinc-400 mb-6">
                                    Your current API key will be <strong className="text-red-400">permanently invalidated</strong>.
                                    Any scripts or devices using the old key will stop working immediately.
                                </p>

                                {regenerateError && (
                                    <div className="mb-4 p-3 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                        {regenerateError}
                                    </div>
                                )}

                                <div className="flex gap-3 justify-end">
                                    <Button variant="ghost" onClick={handleCloseModal}>
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        onClick={handleRegenerateKey}
                                        disabled={regenerating}
                                    >
                                        {regenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        {regenerating ? "Regenerating..." : "Yes, Regenerate Key"}
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                                        <CheckCircle2 className="h-6 w-6 text-green-500" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">New Key Generated!</h3>
                                        <p className="text-sm text-muted-foreground">Save it now — it won&apos;t be shown again</p>
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <Input
                                        value={newApiKey}
                                        readOnly
                                        className="font-mono bg-black/40 border-green-500/30 text-green-300"
                                    />
                                </div>

                                <div className="flex justify-end">
                                    <Button variant="premium" onClick={handleCloseModal}>
                                        Done
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
