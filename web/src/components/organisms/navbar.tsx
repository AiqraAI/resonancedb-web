"use client"

import { useState } from "react"
import Link from "next/link"
import { Activity, Menu, X } from "lucide-react"
import { Button } from "@/components/atoms/button"
import { useAuth } from "@/lib/auth-context"

export function Navbar() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const { isAuthenticated, isLoading } = useAuth()

    const navLinks = [
        { href: "/explore", label: "Explore" },
        { href: "/docs", label: "Docs" },
        { href: "/leaderboard", label: "Leaderboard" },
    ]

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
                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="transition-colors hover:text-foreground/80 text-foreground/60"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>
                </div>
                <div className="flex flex-1 items-center justify-end space-x-2">
                    {/* Desktop Auth Buttons */}
                    <div className="hidden md:flex items-center gap-2">
                        {!isLoading && (
                            isAuthenticated ? (
                                <Link href="/dashboard">
                                    <Button variant="glow" size="sm">
                                        Dashboard
                                    </Button>
                                </Link>
                            ) : (
                                <>
                                    <Link href="/login">
                                        <Button variant="ghost" size="sm" className="text-foreground/60">
                                            Log In
                                        </Button>
                                    </Link>
                                    <Link href="/register">
                                        <Button variant="glow" size="sm">
                                            Sign Up
                                        </Button>
                                    </Link>
                                </>
                            )
                        )}
                    </div>
                    {/* Mobile Menu Button */}
                    <Button
                        variant="ghost"
                        size="sm"
                        className="md:hidden h-9 w-9 p-0"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        aria-label="Toggle menu"
                    >
                        {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </Button>
                </div>
            </div>

            {/* Mobile Menu Panel */}
            {mobileMenuOpen && (
                <div className="md:hidden border-t border-white/5 bg-background/95 backdrop-blur-xl animate-in slide-in-from-top-2">
                    <nav className="container py-4 space-y-1">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="block px-4 py-3 text-sm font-medium text-foreground/80 hover:bg-white/5 rounded-lg transition-colors"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                {link.label}
                            </Link>
                        ))}
                        <div className="border-t border-white/10 my-2"></div>
                        {!isLoading && (
                            isAuthenticated ? (
                                <Link
                                    href="/dashboard"
                                    className="block px-4 py-3 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href="/login"
                                        className="block px-4 py-3 text-sm font-medium text-foreground/80 hover:bg-white/5 rounded-lg transition-colors"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        Log In
                                    </Link>
                                    <Link
                                        href="/register"
                                        className="block px-4 py-3 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        Sign Up
                                    </Link>
                                </>
                            )
                        )}
                    </nav>
                </div>
            )}
        </header>
    )
}

