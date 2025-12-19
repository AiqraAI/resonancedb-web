"use client"

import { useState, useEffect } from "react"
import { VibrationChart } from "@/components/organisms/vibration-chart"
import { Button } from "@/components/atoms/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/molecules/card"
import { Play, Pause, RefreshCw, Settings2 } from "lucide-react"
import { Input } from "@/components/atoms/input"
import { Label } from "@radix-ui/react-label"

export default function VisualizePage() {
    const [isPlaying, setIsPlaying] = useState(false)
    const [data, setData] = useState<number[]>([])
    const [frequency, setFrequency] = useState(10) // Simulation param

    // Simulate real-time data stream
    useEffect(() => {
        if (!isPlaying) return

        const interval = setInterval(() => {
            setData(prev => {
                const t = Date.now() / 1000
                const newVal = Math.sin(t * frequency) * 0.5 + Math.random() * 0.1
                const newData = [...prev, newVal]
                if (newData.length > 200) newData.shift() // Keep window fixed
                return newData
            })
        }, 50)

        return () => clearInterval(interval)
    }, [isPlaying, frequency])

    // Initialize with some static data
    useEffect(() => {
        setData(Array.from({ length: 200 }, () => 0))
    }, [])

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-white mb-2">Real-time Visualization</h2>
                    <p className="text-muted-foreground">Monitor sensor feeds and analyze vibration patterns.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant={isPlaying ? "destructive" : "premium"} onClick={() => setIsPlaying(!isPlaying)}>
                        {isPlaying ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                        {isPlaying ? "Stop Stream" : "Start Stream"}
                    </Button>
                    <Button variant="outline" onClick={() => setData(Array.from({ length: 200 }, () => 0))}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Reset
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-4">
                <div className="md:col-span-3">
                    <VibrationChart
                        data={data}
                        sampleRate={20}
                        className="h-[500px]"
                        color={isPlaying ? "#22c55e" : "#64748b"}
                    />
                </div>

                <div className="space-y-6">
                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Settings2 className="h-4 w-4" />
                                Controls
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Simulated Frequency (Hz)</Label>
                                <div className="flex gap-2">
                                    <Input
                                        type="number"
                                        value={frequency}
                                        onChange={(e) => setFrequency(Number(e.target.value))}
                                        className="bg-white/5"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Amplitude Gain</Label>
                                <input type="range" className="w-full accent-primary" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="glass-card bg-primary/10 border-primary/20">
                        <CardHeader>
                            <CardTitle className="text-sm text-primary">Live Stats</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-mono font-bold text-white">
                                {(data[data.length - 1] || 0).toFixed(3)} g
                            </div>
                            <p className="text-xs text-primary/70 mt-1">Current Peak Value</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
