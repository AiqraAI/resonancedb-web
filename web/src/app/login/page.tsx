"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MarketingLayout } from "@/components/templates/marketing-layout"
import { Button } from "@/components/atoms/button"
import { Input } from "@/components/atoms/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/molecules/card"
import { Label } from "@radix-ui/react-label"
import { useAuth } from "@/lib/auth-context"
import { AlertCircle, Key, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function LoginPage() {
    const router = useRouter()
    const { login } = useAuth()

    const [apiKey, setApiKey] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setIsLoading(true)

        try {
            // Basic validation
            if (!apiKey.trim()) {
                throw new Error("API Key is required")
            }

            if (!apiKey.startsWith("rdb_")) {
                throw new Error("Invalid API Key format. Keys start with 'rdb_'")
            }

            // Attempt login (this updates context state)
            login(apiKey)

            // Redirect to dashboard
            router.push("/dashboard")
        } catch (err) {
            setError(err instanceof Error ? err.message : "Login failed")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <MarketingLayout>
            <div className="flex min-h-[80vh] items-center justify-center p-8">
                <Card className="glass-card w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-2xl">Welcome Back</CardTitle>
                        <CardDescription>
                            Enter your API key to access your dashboard.
                        </CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">API Key</Label>
                                <div className="relative">
                                    <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="password"
                                        placeholder="rdb_live_..."
                                        value={apiKey}
                                        onChange={(e) => setApiKey(e.target.value)}
                                        className="pl-9 font-mono"
                                        required
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md border border-destructive/20">
                                    <AlertCircle className="h-4 w-4" />
                                    {error}
                                </div>
                            )}

                            <div className="text-xs text-muted-foreground text-center">
                                Don&apos;t have an account?{" "}
                                <Link href="/register" className="text-primary hover:underline">
                                    Register here
                                </Link>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button
                                type="submit"
                                variant="premium"
                                className="w-full"
                                disabled={isLoading || !apiKey}
                            >
                                {isLoading ? "Authenticating..." : "Log In"}
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </MarketingLayout>
    )
}
