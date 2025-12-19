"use client"

import Link from "next/link"
import { Activity, Menu } from "lucide-react"
import { Button } from "@/components/atoms/button"

export function Navbar() {
    return (
        <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/60 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 max-w-screen-2xl items-center">
                <div className="mr-4 flex">
                    <Link href="/" className="mr-6 flex items-center space-x-2">
                        <Activity className="h-6 w-6 text-primary" />
                        <span className="hidden font-bold sm:inline-block bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                            ResonanceDB
                        </span>
                    </Link>
                    <nav className="flex items-center space-x-6 text-sm font-medium">
                        <Link
                            href="/explore"
                            className="transition-colors hover:text-foreground/80 text-foreground/60"
                        >
                            Explore
                        </Link>
                        <Link
                            href="/docs"
                            className="transition-colors hover:text-foreground/80 text-foreground/60"
                        >
                            Docs
                        </Link>
                        <Link
                            href="/leaderboard"
                            className="transition-colors hover:text-foreground/80 text-foreground/60"
                        >
                            Leaderboard
                        </Link>
                    </nav>
                </div>
                <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
                    <div className="w-full flex-1 md:w-auto md:flex-none">
                        {/* Search Atom could go here */}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="text-foreground/60">
                            Log In
                        </Button>
                        <Button variant="glow" size="sm">
                            Sign Up
                        </Button>
                    </div>
                </div>
            </div>
        </header>
    )
}
