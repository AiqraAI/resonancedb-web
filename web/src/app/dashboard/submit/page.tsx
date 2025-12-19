"use client"

import { FileUpload } from "@/components/molecules/file-upload"
import { Button } from "@/components/atoms/button"
import { Input } from "@/components/atoms/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/molecules/card"
import { Label } from "@radix-ui/react-label"
import { useState } from "react"
import { VibrationChart } from "@/components/organisms/vibration-chart"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react"
import type { SampleCreate } from "@/lib/types"

export default function SubmitPage() {
    const router = useRouter()
    const { isAuthenticated } = useAuth()
    const [file, setFile] = useState<File | null>(null)
    const [previewData, setPreviewData] = useState<number[]>([])
    const [parsedJson, setParsedJson] = useState<Partial<SampleCreate> | null>(null)

    // Form state for overrides
    const [material, setMaterial] = useState("")
    const [device, setDevice] = useState("")
    const [excitation, setExcitation] = useState("")
    const [sampleRate, setSampleRate] = useState("")

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const handleFileSelect = async (selectedFile: File) => {
        setFile(selectedFile)
        setError(null)

        const reader = new FileReader()
        reader.onload = (e) => {
            try {
                const json = JSON.parse(e.target?.result as string)
                setParsedJson(json)

                if (json.vibration && Array.isArray(json.vibration)) {
                    setPreviewData(json.vibration.slice(0, 1000))
                }
                // Auto-fill form from JSON
                if (json.material) setMaterial(json.material)
                if (json.device) setDevice(json.device)
                if (json.excitation) setExcitation(json.excitation)
                if (json.sample_rate_hz) setSampleRate(String(json.sample_rate_hz))
            } catch (err) {
                setError("Invalid JSON file")
            }
        }
        reader.readAsText(selectedFile)
    }

    const handleSubmit = async () => {
        if (!parsedJson?.vibration || !isAuthenticated) return

        setIsSubmitting(true)
        setError(null)

        try {
            const payload: SampleCreate = {
                material: material || parsedJson.material || "unknown",
                vibration: parsedJson.vibration,
                sample_rate_hz: Number(sampleRate) || parsedJson.sample_rate_hz || 100,
                excitation: excitation || parsedJson.excitation || "manual_tap",
                source: parsedJson.source || "real",
                device: device || parsedJson.device,
            }

            await api.submitSample(payload)
            setSuccess(true)

            // Redirect after short delay
            setTimeout(() => router.push("/dashboard"), 2000)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Submission failed")
        } finally {
            setIsSubmitting(false)
        }
    }

    if (success) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
                <div className="mx-auto w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-6">
                    <CheckCircle2 className="h-10 w-10 text-green-500" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Sample Submitted!</h2>
                <p className="text-muted-foreground">Redirecting to dashboard...</p>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-white mb-2">Submit Sample</h2>
                <p className="text-muted-foreground">
                    Contribute to the ResonanceDB by uploading your vibration samples.
                </p>
            </div>

            {!isAuthenticated && (
                <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-4">
                    <p className="text-yellow-400">You must be logged in to submit samples.</p>
                </div>
            )}

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="glass-card md:col-span-2">
                    <CardHeader>
                        <CardTitle>Upload JSON Data</CardTitle>
                        <CardDescription>
                            Drag and drop your recording file here. Must follow the ResonanceDB Schema.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <FileUpload onFileSelect={handleFileSelect} />
                    </CardContent>
                </Card>

                {file && (
                    <div className="md:col-span-2 space-y-6 animate-in fade-in slide-in-from-bottom-5">
                        <Card className="glass-card">
                            <CardHeader>
                                <CardTitle>Metadata</CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Material Name</Label>
                                    <Input
                                        placeholder="e.g. Aluminum 6061"
                                        value={material}
                                        onChange={(e) => setMaterial(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Device Source</Label>
                                    <Input
                                        placeholder="e.g. MPU-6050"
                                        value={device}
                                        onChange={(e) => setDevice(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Excitation Method</Label>
                                    <Input
                                        placeholder="e.g. manual_tap"
                                        value={excitation}
                                        onChange={(e) => setExcitation(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Sampling Rate (Hz)</Label>
                                    <Input
                                        placeholder="e.g. 100"
                                        value={sampleRate}
                                        onChange={(e) => setSampleRate(e.target.value)}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {previewData.length > 0 && (
                            <div className="w-full overflow-hidden rounded-xl">
                                <VibrationChart
                                    data={previewData}
                                    sampleRate={Number(sampleRate) || 100}
                                    className="h-[300px]"
                                    color="#a855f7"
                                />
                            </div>
                        )}

                        {error && (
                            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md border border-destructive/20">
                                <AlertCircle className="h-4 w-4" />
                                {error}
                            </div>
                        )}

                        <div className="flex justify-end gap-4 pt-4">
                            <Button variant="ghost" onClick={() => router.back()}>Cancel</Button>
                            <Button
                                variant="premium"
                                className="px-8"
                                onClick={handleSubmit}
                                disabled={isSubmitting || !isAuthenticated}
                            >
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isSubmitting ? "Submitting..." : "Submit Contribution"}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
