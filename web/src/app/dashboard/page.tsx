"use client"

import { useEffect, useState } from "react"
import { Activity, Clock, Database, Star, User } from "lucide-react"
import { StatCard } from "@/components/molecules/stat-card"
import { VibrationChart } from "@/components/organisms/vibration-chart"
import { SampleGrid } from "@/components/organisms/sample-grid"
import { Button } from "@/components/atoms/button"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"
import type { ContributorStats } from "@/lib/types"
import Link from "next/link"

export default function DashboardPage() {
    const { user, isAuthenticated, isLoading: authLoading } = useAuth()
    const [stats, setStats] = useState<ContributorStats | null>(null)
    const [loading, setLoading] = useState(true)

    // Mock data for chart - simple sine wave
    const mockData = Array.from({ length: 1000 }, (_, i) => Math.sin(i * 0.1) * 0.5 + Math.sin(i * 0.5) * 0.2)

    useEffect(() => {
        async function fetchStats() {
            if (!isAuthenticated) {
                setLoading(false)
                return
            }
            try {
                const data = await api.getMyStats()
                setStats(data)
            } catch (error) {
                console.error("Failed to fetch stats:", error)
            } finally {
                setLoading(false)
            }
        }
        if (!authLoading) {
            fetchStats()
        }
    }, [isAuthenticated, authLoading])

    const tierColorMap: Record<string, string> = {
        starter: "text-zinc-400",
        bronze: "text-amber-600",
        silver: "text-slate-300",
        gold: "text-yellow-400",
        platinum: "text-purple-400",
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-white">Overview</h2>
                    {stats && (
                        <p className={`text-sm ${tierColorMap[stats.tier] || "text-muted-foreground"}`}>
                            {stats.tier.charAt(0).toUpperCase() + stats.tier.slice(1)} Tier
                        </p>
                    )}
                </div>
                <div className="flex items-center space-x-2">
                    <Button variant="outline">Download Report</Button>
                    <Link href="/dashboard/submit">
                        <Button variant="premium">New Submission</Button>
                    </Link>
                </div>
            </div>

            {!isAuthenticated && !authLoading && (
                <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-4 flex items-center justify-between">
                    <p className="text-yellow-400">You're not logged in. Register to track your contributions.</p>
                    <Link href="/register">
                        <Button variant="outline" size="sm">Register</Button>
                    </Link>
                </div>
            )}

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="My Submissions"
                    value={stats?.total_submissions ?? "—"}
                    change={stats?.validated_submissions ? `${stats.validated_submissions} validated` : undefined}
                    trend="neutral"
                    icon={<Database className="h-4 w-4 text-muted-foreground" />}
                />
                <StatCard
                    title="Rate Limit"
                    value={stats?.rate_limit_per_hour ? `${stats.rate_limit_per_hour}/hr` : "—"}
                    icon={<Activity className="h-4 w-4 text-muted-foreground" />}
                />
                <StatCard
                    title="Tier Progress"
                    value={stats?.progress_to_next_tier
                        ? `${stats.progress_to_next_tier.current}/${stats.progress_to_next_tier.required}`
                        : "Max Tier"
                    }
                    change={stats?.progress_to_next_tier?.next_tier}
                    trend="up"
                    icon={<Star className="h-4 w-4 text-muted-foreground" />}
                />
                <StatCard
                    title="Member Since"
                    value={stats?.created_at
                        ? new Date(stats.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })
                        : "—"
                    }
                    icon={<User className="h-4 w-4 text-muted-foreground" />}
                />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <div className="col-span-4">
                    <VibrationChart
                        data={mockData}
                        sampleRate={100}
                        className="h-[400px]"
                        color="#8884d8"
                    />
                </div>
                <div className="col-span-3">
                    <div className="rounded-xl border border-white/10 bg-white/5 p-6 h-[400px]">
                        <h3 className="font-semibold text-lg mb-4">Recent Activity</h3>
                        <div className="space-y-4">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="flex items-center justify-between border-b border-white/5 pb-2 last:border-0">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs">
                                            Si
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">Silicon Wafer</p>
                                            <p className="text-xs text-muted-foreground">Uploaded 2m ago</p>
                                        </div>
                                    </div>
                                    <span className="text-xs text-green-500 font-medium">+10 pts</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-white">Latest Contributions</h3>
                    <Link href="/dashboard/explore">
                        <Button variant="link" className="text-primary">View All</Button>
                    </Link>
                </div>
                <SampleGrid />
            </div>
        </div>
    )
}
