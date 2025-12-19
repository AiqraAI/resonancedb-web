"use client"

import { useEffect, useState } from "react"
import { Modal } from "@/components/molecules/modal"
import { VibrationChart } from "@/components/organisms/vibration-chart"
import { Badge } from "@/components/atoms/badge"
import { Button } from "@/components/atoms/button"
import { api } from "@/lib/api"
import type { SampleDetail } from "@/lib/types"
import { Download, Loader2, Activity, Thermometer, Scale, Layers, Zap } from "lucide-react"

interface SampleDetailModalProps {
    sampleId: string | null
    isOpen: boolean
    onClose: () => void
}

export function SampleDetailModal({ sampleId, isOpen, onClose }: SampleDetailModalProps) {
    const [sample, setSample] = useState<SampleDetail | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function fetchSample() {
            if (!sampleId) return

            setLoading(true)
            setError(null)

            try {
                const data = await api.getSample(sampleId)
                setSample(data)
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load sample")
            } finally {
                setLoading(false)
            }
        }

        if (isOpen && sampleId) {
            fetchSample()
        }
    }, [sampleId, isOpen])

    const handleDownload = () => {
        if (!sample) return

        const dataStr = JSON.stringify({
            material: sample.material,
            vibration: sample.vibration,
            sample_rate_hz: sample.sample_rate_hz,
            excitation: sample.excitation,
            source: sample.source,
            temperature_c: sample.temperature_c,
            thickness_mm: sample.thickness_mm,
            load_g: sample.load_g,
            mounting: sample.mounting,
            device: sample.device,
            notes: sample.notes,
        }, null, 2)

        const blob = new Blob([dataStr], { type: "application/json" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${sample.material.replace(/\s+/g, "_")}_${sample.id.slice(0, 8)}.json`
        a.click()
        URL.revokeObjectURL(url)
    }

    const handleClose = () => {
        setSample(null)
        onClose()
    }

    return (
        <Modal isOpen={isOpen} onClose={handleClose} size="xl">
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : error ? (
                <div className="p-6 text-center">
                    <p className="text-destructive">{error}</p>
                    <Button variant="outline" className="mt-4" onClick={handleClose}>Close</Button>
                </div>
            ) : sample ? (
                <div className="p-6 space-y-6">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-white">{sample.material}</h2>
                            <p className="text-sm text-muted-foreground mt-1">
                                ID: {sample.id.slice(0, 8)}... • {new Date(sample.created_at).toLocaleDateString()}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge
                                className={sample.validated ? "bg-green-500/80" : "bg-zinc-700"}
                            >
                                {sample.validated ? "Validated" : "Pending"}
                            </Badge>
                            <Button variant="outline" size="sm" onClick={handleDownload}>
                                <Download className="mr-2 h-4 w-4" />
                                Download JSON
                            </Button>
                        </div>
                    </div>

                    {/* Chart */}
                    <div className="rounded-xl border border-white/10 overflow-hidden">
                        <VibrationChart
                            data={sample.vibration}
                            sampleRate={sample.sample_rate_hz}
                            className="h-[300px]"
                            color="#a855f7"
                        />
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <MetadataCard
                            icon={<Activity className="h-4 w-4" />}
                            label="Sample Rate"
                            value={`${sample.sample_rate_hz} Hz`}
                        />
                        <MetadataCard
                            icon={<Zap className="h-4 w-4" />}
                            label="Excitation"
                            value={sample.excitation}
                        />
                        <MetadataCard
                            icon={<Layers className="h-4 w-4" />}
                            label="Source"
                            value={sample.source}
                        />
                        <MetadataCard
                            icon={<Activity className="h-4 w-4" />}
                            label="Duration"
                            value={`${(sample.vibration.length / sample.sample_rate_hz).toFixed(2)}s`}
                        />
                        {sample.temperature_c && (
                            <MetadataCard
                                icon={<Thermometer className="h-4 w-4" />}
                                label="Temperature"
                                value={`${sample.temperature_c}°C`}
                            />
                        )}
                        {sample.thickness_mm && (
                            <MetadataCard
                                icon={<Layers className="h-4 w-4" />}
                                label="Thickness"
                                value={`${sample.thickness_mm} mm`}
                            />
                        )}
                        {sample.load_g && (
                            <MetadataCard
                                icon={<Scale className="h-4 w-4" />}
                                label="Load"
                                value={`${sample.load_g} g`}
                            />
                        )}
                        {sample.device && (
                            <MetadataCard
                                icon={<Activity className="h-4 w-4" />}
                                label="Device"
                                value={sample.device}
                            />
                        )}
                    </div>

                    {/* Computed Features */}
                    {(sample.peak_frequency_hz || sample.energy) && (
                        <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                            <h4 className="text-sm font-medium text-primary mb-3">Computed Features</h4>
                            <div className="flex gap-6">
                                {sample.peak_frequency_hz && (
                                    <div>
                                        <p className="text-2xl font-bold text-white">{sample.peak_frequency_hz.toFixed(1)} Hz</p>
                                        <p className="text-xs text-muted-foreground">Peak Frequency</p>
                                    </div>
                                )}
                                {sample.energy && (
                                    <div>
                                        <p className="text-2xl font-bold text-white">{sample.energy.toFixed(4)}</p>
                                        <p className="text-xs text-muted-foreground">Energy</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Notes */}
                    {sample.notes && (
                        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                            <h4 className="text-sm font-medium text-muted-foreground mb-2">Notes</h4>
                            <p className="text-white">{sample.notes}</p>
                        </div>
                    )}
                </div>
            ) : null}
        </Modal>
    )
}

function MetadataCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="p-3 rounded-lg bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                {icon}
                <span className="text-xs">{label}</span>
            </div>
            <p className="text-sm font-medium text-white capitalize">{value}</p>
        </div>
    )
}
