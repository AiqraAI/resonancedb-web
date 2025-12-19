"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/molecules/card"
import { Badge } from "@/components/atoms/badge"
import { Trophy, Medal, Award, Loader2 } from "lucide-react"
import { api } from "@/lib/api"
import type { LeaderboardEntry } from "@/lib/types"

export default function LeaderboardPage() {
    const [entries, setEntries] = useState<LeaderboardEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [totalContributors, setTotalContributors] = useState(0)

    useEffect(() => {
        async function fetchLeaderboard() {
            try {
                const data = await api.getLeaderboard(10)
                setEntries(data.entries)
                setTotalContributors(data.total_contributors)
            } catch (error) {
                console.error("Failed to fetch leaderboard:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchLeaderboard()
    }, [])

    const tierColorMap: Record<string, string> = {
        starter: "bg-zinc-700",
        bronze: "bg-amber-700",
        silver: "bg-slate-400",
        gold: "bg-yellow-500",
        platinum: "bg-purple-500",
    }

    // Get top 3 for podium (or empty placeholders)
    const podiumUsers = [
        entries[1] || null, // Silver
        entries[0] || null, // Gold (center)
        entries[2] || null, // Bronze
    ]

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-white mb-2">Top Contributors</h2>
                <p className="text-muted-foreground">
                    Recognizing the most active contributors mapping the physical world.
                    <span className="ml-2 text-primary font-medium">{totalContributors} total contributors</span>
                </p>
            </div>

            {entries.length > 0 && (
                <div className="grid gap-6 md:grid-cols-3">
                    {podiumUsers.map((user, i) => (
                        user && (
                            <Card key={user.rank} className={`glass-card border-white/10 ${i === 1 ? 'border-primary/50 shadow-[0_0_30px_rgba(124,58,237,0.2)] scale-105 z-10' : 'mt-8 bg-white/5'}`}>
                                <CardHeader className="text-center pb-2">
                                    <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-tr from-white/10 to-white/5 flex items-center justify-center mb-2 border border-white/10">
                                        {i === 1 && <Trophy className="h-8 w-8 text-yellow-400" />}
                                        {i === 0 && <Medal className="h-8 w-8 text-zinc-300" />}
                                        {i === 2 && <Award className="h-8 w-8 text-amber-700" />}
                                    </div>
                                    <CardTitle className="text-lg">{user.display_name || user.github_username || `User #${user.rank}`}</CardTitle>
                                    <Badge variant="outline" className="mx-auto mt-2 border-white/20 text-muted-foreground capitalize">{user.tier}</Badge>
                                </CardHeader>
                                <CardContent className="text-center">
                                    <p className="text-3xl font-bold text-white">{user.validated_submissions}</p>
                                    <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Validated Samples</p>
                                </CardContent>
                            </Card>
                        )
                    ))}
                </div>
            )}

            <Card className="glass-card">
                <CardHeader>
                    <CardTitle>Global Rankings</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {entries.slice(3).map((user) => (
                            <div key={user.rank} className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/5">
                                <div className="flex items-center gap-4">
                                    <span className="text-lg font-bold text-muted-foreground w-8">#{user.rank}</span>
                                    <div>
                                        <p className="font-medium text-white">{user.display_name || user.github_username || "Anonymous"}</p>
                                        <p className="text-xs text-muted-foreground">{user.validated_submissions} validated submissions</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <Badge className={`${tierColorMap[user.tier] || 'bg-zinc-700'} text-white capitalize`}>
                                        {user.tier}
                                    </Badge>
                                </div>
                            </div>
                        ))}
                        {entries.length === 0 && (
                            <p className="text-center text-muted-foreground py-8">No contributors yet. Be the first!</p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
