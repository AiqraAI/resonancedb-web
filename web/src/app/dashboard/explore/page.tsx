"use client"

import { useEffect, useState, useCallback } from "react"
import { SearchInput } from "@/components/molecules/search-input"
import { Button } from "@/components/atoms/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/molecules/card"
import { Badge } from "@/components/atoms/badge"
import { Filter, Activity, Loader2, Search, X } from "lucide-react"
import { api } from "@/lib/api"
import type { SampleListItem } from "@/lib/types"
import { SampleDetailModal } from "@/components/organisms/sample-detail-modal"

export default function ExplorePage() {
    const [samples, setSamples] = useState<SampleListItem[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [sourceFilter, setSourceFilter] = useState<string | null>(null)
    const [page, setPage] = useState(1)
    const [hasMore, setHasMore] = useState(true)
    const [total, setTotal] = useState(0)
    const [selectedSampleId, setSelectedSampleId] = useState<string | null>(null)

    const fetchSamples = useCallback(async (reset = false) => {
        setLoading(true)
        try {
            const currentPage = reset ? 1 : page
            const data = await api.listSamples(currentPage, 12, searchQuery || undefined)

            if (reset) {
                setSamples(data.items)
                setPage(1)
            } else {
                setSamples(prev => [...prev, ...data.items])
            }

            setHasMore(data.has_next)
            setTotal(data.total)
        } catch (error) {
            console.error("Failed to fetch samples:", error)
        } finally {
            setLoading(false)
        }
    }, [page, searchQuery])

    useEffect(() => {
        fetchSamples(true)
    }, [searchQuery])

    const handleLoadMore = () => {
        setPage(prev => prev + 1)
    }

    useEffect(() => {
        if (page > 1) {
            fetchSamples(false)
        }
    }, [page])

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value)
    }

    const clearFilters = () => {
        setSearchQuery("")
        setSourceFilter(null)
    }

    // Filter samples client-side by source if filter is applied
    const filteredSamples = sourceFilter
        ? samples.filter(s => s.source === sourceFilter)
        : samples

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-white mb-2">Explore Sample Database</h2>
                <p className="text-muted-foreground">
                    Browse, search, and analyze vibration fingerprints from around the world.
                    <span className="ml-2 text-primary font-medium">{total} samples available</span>
                </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
                <div className="w-full sm:max-w-md relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="search"
                        placeholder="Search by material name..."
                        value={searchQuery}
                        onChange={handleSearch}
                        className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-white placeholder:text-muted-foreground"
                    />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                    {["real", "simulation", "phone_sensor"].map(source => (
                        <Button
                            key={source}
                            variant={sourceFilter === source ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSourceFilter(sourceFilter === source ? null : source)}
                            className="capitalize"
                        >
                            {source.replace("_", " ")}
                        </Button>
                    ))}
                    {(searchQuery || sourceFilter) && (
                        <Button variant="ghost" size="sm" onClick={clearFilters}>
                            <X className="mr-1 h-3 w-3" />
                            Clear
                        </Button>
                    )}
                </div>
            </div>

            {loading && samples.length === 0 ? (
                <div className="flex items-center justify-center min-h-[300px]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : filteredSamples.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                    <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">No samples found</p>
                    <p className="text-sm">Try a different search term or upload some data!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredSamples.map((sample) => (
                        <Card
                            key={sample.id}
                            className="glass-card group overflow-hidden border-white/5 bg-white/5 hover:border-primary/50 transition-all duration-300 cursor-pointer"
                            onClick={() => setSelectedSampleId(sample.id)}
                        >
                            <CardHeader className="p-0">
                                <div className="relative h-24 w-full bg-black/40 overflow-hidden flex items-center justify-center">
                                    <div className="w-full h-1 bg-primary/30"></div>
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
                                <h3 className="font-semibold text-lg text-white mb-1 group-hover:text-primary transition-colors truncate">
                                    {sample.material}
                                </h3>
                                <p className="text-sm text-zinc-400 flex items-center gap-2">
                                    <Activity className="h-3 w-3" />
                                    {sample.source} • {sample.sample_rate_hz} Hz
                                </p>
                                {sample.device && (
                                    <p className="text-xs text-zinc-500 mt-1 truncate">{sample.device}</p>
                                )}
                            </CardContent>
                            <CardFooter className="p-4 pt-0 flex justify-between text-xs text-muted-foreground">
                                <span>{sample.vibration_length.toLocaleString()} points</span>
                                <span>{new Date(sample.created_at).toLocaleDateString()}</span>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}

            {hasMore && filteredSamples.length > 0 && (
                <div className="flex justify-center pt-8">
                    <Button
                        variant="ghost"
                        size="lg"
                        className="text-muted-foreground hover:text-white"
                        onClick={handleLoadMore}
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {loading ? "Loading..." : "Load More Samples"}
                    </Button>
                </div>
            )}

            {/* Sample Detail Modal */}
            <SampleDetailModal
                sampleId={selectedSampleId}
                isOpen={!!selectedSampleId}
                onClose={() => setSelectedSampleId(null)}
            />
        </div>
    )
}
