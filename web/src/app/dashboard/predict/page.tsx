"use client"

import { useState } from "react"
import { FileUpload } from "@/components/molecules/file-upload"
import { Button } from "@/components/atoms/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/molecules/card"
import { VibrationChart } from "@/components/organisms/vibration-chart"
import { api } from "@/lib/api"
import type { PredictResponse } from "@/lib/types"
import { AlertCircle, Brain, Loader2, Sparkles, BarChart3 } from "lucide-react"

export default function PredictPage() {
    const [file, setFile] = useState<File | null>(null)
    const [vibrationData, setVibrationData] = useState<number[]>([])
    const [sampleRate, setSampleRate] = useState(100)
    const [isPredicting, setIsPredicting] = useState(false)
    const [prediction, setPrediction] = useState<PredictResponse | null>(null)
    const [error, setError] = useState<string | null>(null)

    const handleFileSelect = async (selectedFile: File) => {
        setFile(selectedFile)
        setError(null)
        setPrediction(null)

        const reader = new FileReader()
        reader.onload = (e) => {
            try {
                const json = JSON.parse(e.target?.result as string)
                if (json.vibration && Array.isArray(json.vibration)) {
                    setVibrationData(json.vibration)
                    if (json.sample_rate_hz) setSampleRate(json.sample_rate_hz)
                } else {
                    setError("JSON must contain a 'vibration' array")
                }
            } catch {
                setError("Invalid JSON file")
            }
        }
        reader.readAsText(selectedFile)
    }

    const handlePredict = async () => {
        if (vibrationData.length === 0) return

        setIsPredicting(true)
        setError(null)

        try {
            const result = await api.predict({
                vibration: vibrationData,
                sample_rate_hz: sampleRate,
            })
            setPrediction(result)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Prediction failed")
        } finally {
            setIsPredicting(false)
        }
    }

    const getConfidenceColor = (confidence: number) => {
        if (confidence >= 0.8) return "text-green-500"
        if (confidence >= 0.5) return "text-yellow-500"
        return "text-red-500"
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-white mb-2">
                    <Sparkles className="inline mr-2 h-8 w-8 text-primary" />
                    Material Prediction
                </h2>
                <p className="text-muted-foreground">
                    Upload vibration data and let our AI identify the material.
                </p>
            </div>

            <Card className="glass-card">
                <CardHeader>
                    <CardTitle>Upload Vibration Data</CardTitle>
                    <CardDescription>
                        Select a JSON file containing vibration data (must have a 'vibration' array).
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <FileUpload onFileSelect={handleFileSelect} />
                </CardContent>
            </Card>

            {vibrationData.length > 0 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-5">
                    <div className="w-full overflow-hidden rounded-xl">
                        <VibrationChart
                            data={vibrationData.slice(0, 1000)}
                            sampleRate={sampleRate}
                            className="h-[250px]"
                            color="#a855f7"
                        />
                    </div>

                    <div className="flex justify-center">
                        <Button
                            variant="premium"
                            size="lg"
                            onClick={handlePredict}
                            disabled={isPredicting}
                            className="px-12"
                        >
                            {isPredicting ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Analyzing...
                                </>
                            ) : (
                                <>
                                    <Brain className="mr-2 h-5 w-5" />
                                    Predict Material
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            )}

            {error && (
                <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-4 rounded-xl border border-destructive/20">
                    <AlertCircle className="h-5 w-5" />
                    {error}
                </div>
            )}

            {prediction && (
                <div className="space-y-6 animate-in fade-in zoom-in-95">
                    {/* Main Prediction Result */}
                    <Card className="glass-card border-primary/30 bg-primary/5">
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <p className="text-sm text-muted-foreground uppercase tracking-widest mb-2">Predicted Material</p>
                                <h3 className="text-4xl font-bold text-white capitalize mb-4">{prediction.prediction}</h3>
                                <div className="flex items-center justify-center gap-2">
                                    <span className="text-sm text-muted-foreground">Confidence:</span>
                                    <span className={`text-2xl font-bold ${getConfidenceColor(prediction.confidence)}`}>
                                        {(prediction.confidence * 100).toFixed(1)}%
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Probabilities */}
                    {prediction.probabilities && Object.keys(prediction.probabilities).length > 0 && (
                        <Card className="glass-card">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <BarChart3 className="h-5 w-5" />
                                    Class Probabilities
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {Object.entries(prediction.probabilities)
                                    .sort(([, a], [, b]) => b - a)
                                    .map(([material, prob]) => (
                                        <div key={material} className="space-y-1">
                                            <div className="flex justify-between text-sm">
                                                <span className="capitalize text-white">{material}</span>
                                                <span className="text-muted-foreground">{(prob * 100).toFixed(1)}%</span>
                                            </div>
                                            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-primary transition-all duration-500"
                                                    style={{ width: `${prob * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                            </CardContent>
                        </Card>
                    )}

                    {/* Extracted Features */}
                    {prediction.features && Object.keys(prediction.features).length > 0 && (
                        <Card className="glass-card">
                            <CardHeader>
                                <CardTitle>Extracted Features</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {Object.entries(prediction.features).map(([name, value]) => (
                                        <div key={name} className="p-3 rounded-lg bg-white/5 border border-white/10">
                                            <p className="text-xs text-muted-foreground capitalize">{name.replace(/_/g, " ")}</p>
                                            <p className="text-lg font-mono font-bold text-white">
                                                {typeof value === "number" ? value.toFixed(4) : value}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}
        </div>
    )
}
