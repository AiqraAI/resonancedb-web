"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/molecules/card"
import { Button } from "@/components/atoms/button"
import { Activity, Download, Play, Loader2 } from "lucide-react"
import { Badge } from "@/components/atoms/badge"
import { api } from "@/lib/api"
import type { SampleListItem } from "@/lib/types"

export function SampleGrid() {
    const [samples, setSamples] = useState<SampleListItem[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchSamples() {
            try {
                const data = await api.listSamples(1, 4)
                setSamples(data.items)
            } catch (error) {
                console.error("Failed to fetch samples:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchSamples()
    }, [])

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[200px]">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
        )
    }

    if (samples.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No samples yet. Be the first to contribute!</p>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {samples.map((sample) => (
                <Card key={sample.id} className="glass-card group overflow-hidden border-white/5 bg-white/5 hover:border-primary/50 transition-all duration-300">
                    <CardHeader className="p-0">
                        <div className="relative h-32 w-full bg-black/40 overflow-hidden">
                            {/* Waveform visualization placeholder */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-full h-1 bg-primary/20 group-hover:bg-primary/50 transition-colors"></div>
                                <div className="absolute w-full h-full opacity-30 bg-[url('/waveform-pattern.svg')]"></div>
                            </div>
                            <Badge variant="secondary" className="absolute top-2 right-2 bg-black/50 backdrop-blur-md border-white/10 text-xs">
                                {sample.duration_seconds.toFixed(1)}s
                            </Badge>
                            <Badge
                                variant={sample.validated ? "default" : "secondary"}
                                className={`absolute top-2 left-2 text-xs ${sample.validated ? 'bg-green-500/80' : 'bg-zinc-700'}`}
                            >
                                {sample.validated ? "Validated" : "Pending"}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4">
                        <h3 className="font-semibold text-lg text-white mb-1 group-hover:text-primary transition-colors truncate">{sample.material}</h3>
                        <p className="text-sm text-zinc-400 flex items-center gap-2">
                            <Activity className="h-3 w-3" /> {sample.source} • {sample.sample_rate_hz} Hz
                        </p>
                        {sample.device && (
                            <p className="text-xs text-zinc-500 mt-1 truncate">{sample.device}</p>
                        )}
                    </CardContent>
                    <CardFooter className="p-4 pt-0 flex justify-between">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full hover:bg-primary/20 hover:text-primary">
                            <Play className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full hover:bg-white/10">
                            <Download className="h-4 w-4" />
                        </Button>
                    </CardFooter>
                </Card>
            ))}
        </div>
    )
}
