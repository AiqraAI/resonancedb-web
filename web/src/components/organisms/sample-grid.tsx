"use client"

import { Card, CardContent, CardFooter, CardHeader } from "@/components/molecules/card"
import { Button } from "@/components/atoms/button"
import { Activity, Download, Play } from "lucide-react"
import { Badge } from "@/components/atoms/badge"

// Mock data type until we integrate API
interface Sample {
    id: string
    material: string
    source: string
    tier: string
    duration: number
}

export function SampleGrid() {
    const samples: Sample[] = [
        { id: "1", material: "Aluminum 6061", source: "CNC Machine", tier: "Gold", duration: 1.2 },
        { id: "2", material: "PLA Plastic", source: "3D Printer", tier: "Silver", duration: 0.8 },
        { id: "3", material: "Steel Beam", source: "Bridge Sensor", tier: "Platinum", duration: 5.0 },
        { id: "4", material: "Glass Pane", source: "Window", tier: "Silver", duration: 0.5 },
    ]

    return (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {samples.map((sample) => (
                <Card key={sample.id} className="glass-card group overflow-hidden border-white/5 bg-white/5 hover:border-primary/50 transition-all duration-300">
                    <CardHeader className="p-0">
                        <div className="relative h-32 w-full bg-black/40 overflow-hidden">
                            {/* Mock waveform visualization */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-full h-1 bg-primary/20 group-hover:bg-primary/50 transition-colors"></div>
                                <div className="absolute w-full h-full opacity-30 bg-[url('/waveform-pattern.svg')]"></div>
                            </div>
                            <Badge variant="secondary" className="absolute top-2 right-2 bg-black/50 backdrop-blur-md border-white/10 text-xs">
                                {sample.duration}s
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4">
                        <h3 className="font-semibold text-lg text-white mb-1 group-hover:text-primary transition-colors">{sample.material}</h3>
                        <p className="text-sm text-zinc-400 flex items-center gap-2">
                            <Activity className="h-3 w-3" /> {sample.source}
                        </p>
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
