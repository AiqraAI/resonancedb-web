"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MarketingLayout } from "@/components/templates/marketing-layout"
import { Button } from "@/components/atoms/button"
import { Input } from "@/components/atoms/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/molecules/card"
import { Label } from "@radix-ui/react-label"
import { useAuth } from "@/lib/auth-context"
import { Copy, CheckCircle2, AlertCircle, Key } from "lucide-react"

export default function RegisterPage() {
    const router = useRouter()
    const { register } = useAuth()

    const [email, setEmail] = useState("")
    const [displayName, setDisplayName] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [apiKey, setApiKey] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setIsLoading(true)

        try {
            const result = await register(email, displayName || undefined)
            setApiKey(result.api_key)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Registration failed")
        } finally {
            setIsLoading(false)
        }
    }

    const handleCopy = () => {
        if (apiKey) {
            navigator.clipboard.writeText(apiKey)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const handleContinue = () => {
        router.push("/dashboard")
    }

    return (
        <MarketingLayout>
            <div className="flex min-h-[80vh] items-center justify-center p-8">
                <Card className="glass-card w-full max-w-md">
                    {!apiKey ? (
                        <>
                            <CardHeader>
                                <CardTitle className="text-2xl">Join ResonanceDB</CardTitle>
                                <CardDescription>
                                    Start contributing vibration data and earn rewards.
                                </CardDescription>
                            </CardHeader>
                            <form onSubmit={handleSubmit}>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">Email Address</Label>
                                        <Input
                                            type="email"
                                            placeholder="researcher@university.edu"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">Display Name (optional)</Label>
                                        <Input
                                            type="text"
                                            placeholder="VibroMaster_99"
                                            value={displayName}
                                            onChange={(e) => setDisplayName(e.target.value)}
                                        />
                                    </div>

                                    {error && (
                                        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md border border-destructive/20">
                                            <AlertCircle className="h-4 w-4" />
                                            {error}
                                        </div>
                                    )}
                                </CardContent>
                                <CardFooter>
                                    <Button
                                        type="submit"
                                        variant="premium"
                                        className="w-full"
                                        disabled={isLoading || !email}
                                    >
                                        {isLoading ? "Creating Account..." : "Get API Key"}
                                    </Button>
                                </CardFooter>
                            </form>
                        </>
                    ) : (
                        <>
                            <CardHeader className="text-center">
                                <div className="mx-auto w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                                    <CheckCircle2 className="h-8 w-8 text-green-500" />
                                </div>
                                <CardTitle className="text-2xl">Welcome to ResonanceDB!</CardTitle>
                                <CardDescription>
                                    Your API key has been generated. <strong>Save it now</strong> — it won&apos;t be shown again.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="relative">
                                    <div className="flex gap-2">
                                        <Input
                                            value={apiKey}
                                            readOnly
                                            className="font-mono bg-black/40 border-primary/30 text-primary pr-12"
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
                                </div>
                                <div className="text-sm text-yellow-500/80 bg-yellow-500/10 p-3 rounded-md border border-yellow-500/20">
                                    <Key className="h-4 w-4 inline mr-2" />
                                    Store this key in a password manager or safe location.
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button variant="premium" className="w-full" onClick={handleContinue}>
                                    Continue to Dashboard
                                </Button>
                            </CardFooter>
                        </>
                    )}
                </Card>
            </div>
        </MarketingLayout>
    )
}
