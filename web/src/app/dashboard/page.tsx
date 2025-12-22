"use client"

import { useEffect, useState } from "react"
import { Activity, Database, Star, User, Loader2 } from "lucide-react"
import { StatCard } from "@/components/molecules/stat-card"
import { VibrationChart } from "@/components/organisms/vibration-chart"
import { SampleGrid } from "@/components/organisms/sample-grid"
import { Button } from "@/components/atoms/button"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"
import type { ContributorStats, SampleListItem, SampleDetail } from "@/lib/types"
import Link from "next/link"

export default function DashboardPage() {
    const { user, isAuthenticated, isLoading: authLoading } = useAuth()
    const [stats, setStats] = useState<ContributorStats | null>(null)
    const [recentSamples, setRecentSamples] = useState<SampleListItem[]>([])
    const [chartData, setChartData] = useState<number[]>([])
    const [chartSampleRate, setChartSampleRate] = useState(100)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchData() {
            try {
                // Fetch recent samples for activity feed
                const samplesData = await api.listSamples(1, 5)
                setRecentSamples(samplesData.items)

                // If there are samples, fetch the first one's vibration data for the chart
                if (samplesData.items.length > 0) {
                    try {
                        const sampleDetail = await api.getSample(samplesData.items[0].id)
                        setChartData(sampleDetail.vibration)
                        setChartSampleRate(sampleDetail.sample_rate_hz)
                    } catch (error) {
                        console.error("Failed to fetch sample detail:", error)
                    }
                }

                // Fetch user stats if authenticated
                if (isAuthenticated) {
                    const userStats = await api.getMyStats()
                    setStats(userStats)
                }
            } catch (error) {
                console.error("Failed to fetch data:", error)
            } finally {
                setLoading(false)
            }
        }

        if (!authLoading) {
            fetchData()
        }
    }, [isAuthenticated, authLoading])

    const tierColorMap: Record<string, string> = {
        starter: "text-zinc-400",
        bronze: "text-amber-600",
        silver: "text-slate-300",
        gold: "text-yellow-400",
        platinum: "text-purple-400",
    }

    // Helper to format time ago
    const timeAgo = (dateString: string) => {
        const now = new Date()
        const date = new Date(dateString)
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

        if (seconds < 60) return `${seconds}s ago`
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
        return `${Math.floor(seconds / 86400)}d ago`
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
                    <p className="text-yellow-400">You&apos;re not logged in. Register to track your contributions.</p>
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
                    {chartData.length > 0 ? (
                        <VibrationChart
                            data={chartData}
                            sampleRate={chartSampleRate}
                            className="h-[400px]"
                            color="#8884d8"
                        />
                    ) : (
                        <div className="rounded-xl border border-white/10 bg-white/5 h-[400px] flex flex-col items-center justify-center text-muted-foreground">
                            <Activity className="h-10 w-10 mb-3 opacity-50" />
                            <p className="text-sm">No vibration data available yet</p>
                            <Link href="/dashboard/submit" className="mt-4">
                                <Button variant="outline" size="sm">Submit Your First Sample</Button>
                            </Link>
                        </div>
                    )}
                </div>
                <div className="col-span-3">
                    <div className="rounded-xl border border-white/10 bg-white/5 p-6 h-[400px] overflow-hidden">
                        <h3 className="font-semibold text-lg mb-4">Recent Activity</h3>
                        {loading ? (
                            <div className="flex items-center justify-center h-[300px]">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            </div>
                        ) : recentSamples.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                                <Activity className="h-8 w-8 mb-2 opacity-50" />
                                <p className="text-sm">No recent activity</p>
                            </div>
                        ) : (
                            <div className="space-y-4 overflow-y-auto max-h-[320px]">
                                {recentSamples.map((sample) => (
                                    <div key={sample.id} className="flex items-center justify-between border-b border-white/5 pb-2 last:border-0">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-medium">
                                                {sample.material.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium truncate max-w-[150px]">{sample.material}</p>
                                                <p className="text-xs text-muted-foreground">{timeAgo(sample.created_at)}</p>
                                            </div>
                                        </div>
                                        <span className={`text-xs font-medium ${sample.validated ? 'text-green-500' : 'text-yellow-500'}`}>
                                            {sample.validated ? 'Validated' : 'Pending'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
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
