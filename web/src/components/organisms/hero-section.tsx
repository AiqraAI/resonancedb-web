"use client"

import { Button } from "@/components/atoms/button"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

export function HeroSection() {
    return (
        <section className="relative flex min-h-[80vh] flex-col items-center justify-center overflow-hidden px-4 md:px-8">
            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] animate-blob mix-blend-screen"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] animate-blob animation-delay-2000 mix-blend-screen"></div>
            </div>

            <div className="relative z-10 mx-auto max-w-5xl text-center">
                <h1 className="mb-6 text-6xl font-bold tracking-tighter sm:text-7xl lg:text-8xl bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
                    Feel the <br />
                    <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 text-transparent bg-clip-text animate-pulse">Vibration</span>
                </h1>
                <p className="mx-auto mb-8 max-w-[600px] text-zinc-400 md:text-xl lg:text-2xl font-light leading-relaxed">
                    The open-source vibration fingerprint database. <br className="hidden md:inline" />
                    Identify materials, detect flaws, and sense the world through resonance.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <Link href="/register">
                        <Button variant="premium" size="xl" className="group min-w-[200px]">
                            Start Contributing
                            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </Link>
                    <Link href="/explore">
                        <Button variant="glass" size="xl" className="min-w-[200px]">
                            Explore Data
                        </Button>
                    </Link>
                </div>

                <div className="mt-16 inline-flex items-center gap-2 text-sm text-zinc-500 bg-white/5 px-6 py-2 rounded-full backdrop-blur-sm border border-white/5 hover:bg-white/10 transition-colors cursor-default">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                    <span className="font-medium text-zinc-300">System Operational</span>
                    <span className="mx-2 text-zinc-700">|</span>
                    <span className="font-mono text-zinc-400">1,204 Sampled Frequencies</span>
                </div>
            </div>

            {/* Decorative Grid */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] -z-20 opacity-20"></div>
        </section>
    )
}
