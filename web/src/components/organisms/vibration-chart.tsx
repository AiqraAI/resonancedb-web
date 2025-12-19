"use client"

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/molecules/card"
import { cn } from "@/lib/utils"

interface VibrationChartProps {
    data: number[]
    sampleRate: number
    className?: string
    color?: string
}

export function VibrationChart({ data, sampleRate, className, color = "#8884d8" }: VibrationChartProps) {
    // Downsample data for performance if too large
    const chartData = React.useMemo(() => {
        const step = Math.ceil(data.length / 1000) // Max 1000 points
        return data.filter((_, i) => i % step === 0).map((val, index) => ({
            index,
            time: (index * step / sampleRate).toFixed(3),
            value: val
        }))
    }, [data, sampleRate])

    return (
        <Card className={cn("glass-card w-full h-[400px]", className)}>
            <CardHeader>
                <CardTitle className="text-sm font-light tracking-widest uppercase text-muted-foreground">
                    Waveform Analysis
                </CardTitle>
            </CardHeader>
            <CardContent className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis
                            dataKey="time"
                            stroke="#666"
                            tick={{ fontSize: 10 }}
                            tickFormatter={(val) => `${val}s`}
                        />
                        <YAxis stroke="#666" tick={{ fontSize: 10 }} />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }}
                            itemStyle={{ color: '#fff' }}
                            formatter={(value: number | undefined) => [value ? value.toFixed(4) : "0", "Available g"]}
                            labelFormatter={(label) => `Time: ${label}s`}
                        />
                        <Line
                            type="monotone"
                            dataKey="value"
                            stroke={color}
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 6, fill: '#fff' }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}

import * as React from "react"
