"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/molecules/card"
import { cn } from "@/lib/utils"
import { ArrowUpRight, ArrowDownRight, Activity } from "lucide-react"

interface StatCardProps {
    title: string
    value: string | number
    change?: string
    trend?: "up" | "down" | "neutral"
    icon?: React.ReactNode
    className?: string
}

export function StatCard({ title, value, change, trend, icon, className }: StatCardProps) {
    return (
        <Card className={cn("glass-card overflow-hidden transition-all hover:border-primary/50", className)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                </CardTitle>
                {icon || <Activity className="h-4 w-4 text-muted-foreground" />}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                    {value}
                </div>
                {change && (
                    <p className={cn("text-xs flex items-center mt-1",
                        trend === "up" ? "text-green-500" :
                            trend === "down" ? "text-red-500" : "text-muted-foreground"
                    )}>
                        {trend === "up" && <ArrowUpRight className="mr-1 h-3 w-3" />}
                        {trend === "down" && <ArrowDownRight className="mr-1 h-3 w-3" />}
                        {change}
                        <span className="ml-1 text-muted-foreground/50">from last month</span>
                    </p>
                )}

                {/* Abstract Sparkline Decoration */}
                <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
                    <svg width="100" height="40" viewBox="0 0 100 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M0 40L10 30L20 35L40 10L60 25L80 5L100 20V40H0Z" fill="currentColor" />
                    </svg>
                </div>
            </CardContent>
        </Card>
    )
}
