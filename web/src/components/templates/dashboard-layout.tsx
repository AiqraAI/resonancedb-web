"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Activity, BarChart2, FileUp, Home, LayoutDashboard, Settings, LogOut, Brain, Search, Menu, X } from "lucide-react"
import { Button } from "@/components/atoms/button"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"

interface DashboardLayoutProps {
    children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
    const pathname = usePathname()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const { user, logout, isAuthenticated } = useAuth()

    const allNavItems = [
        { href: "/dashboard", icon: LayoutDashboard, label: "Overview", authRequired: false },
        { href: "/dashboard/submit", icon: FileUp, label: "New Submission", authRequired: true },
        { href: "/dashboard/predict", icon: Brain, label: "Predict", authRequired: false },
        { href: "/dashboard/explore", icon: Search, label: "Explore", authRequired: false },
        { href: "/dashboard/visualize", icon: Activity, label: "Visualize", authRequired: false },
        { href: "/dashboard/leaderboard", icon: BarChart2, label: "Leaderboard", authRequired: false },
        { href: "/dashboard/settings", icon: Settings, label: "Settings", authRequired: true },
    ]

    // Filter nav items based on auth state
    const navItems = allNavItems.filter(item => !item.authRequired || isAuthenticated)

    const handleLogout = () => {
        logout()
        setMobileMenuOpen(false)
    }

    return (
        <div className="min-h-screen bg-background flex">
            {/* Desktop Sidebar */}
            <aside className="w-64 border-r border-white/5 bg-black/20 backdrop-blur-xl hidden md:flex flex-col">
                <div className="h-16 flex items-center px-6 border-b border-white/5">
                    <Link href="/" className="flex items-center space-x-2">
                        <Activity className="h-6 w-6 text-primary" />
                        <span className="font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                            ResonanceDB
                        </span>
                    </Link>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-2">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href
                        const Icon = item.icon
                        return (
                            <Link key={item.href} href={item.href}>
                                <Button
                                    variant={isActive ? "glass" : "ghost"}
                                    className={cn("w-full justify-start", isActive ? "bg-white/5 text-white" : "text-muted-foreground")}
                                >
                                    <Icon className="mr-3 h-4 w-4" />
                                    {item.label}
                                </Button>
                            </Link>
                        )
                    })}
                </nav>

                <div className="p-4 border-t border-white/5">
                    <div className="flex items-center gap-3 px-2 mb-4">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500"></div>
                        <div>
                            <p className="text-sm font-medium text-white">{user?.email?.split("@")[0] || "Guest User"}</p>
                            <p className="text-xs text-muted-foreground capitalize">{user?.tier || "Starter"} Tier</p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-red-500 hover:text-red-400 hover:bg-red-500/10"
                        onClick={handleLogout}
                    >
                        <LogOut className="mr-3 h-4 w-4" />
                        Log Out
                    </Button>
                </div>
            </aside>

            {/* Mobile Sidebar Overlay */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* Mobile Sidebar Drawer */}
            <aside className={cn(
                "fixed inset-y-0 left-0 z-50 w-72 border-r border-white/5 bg-background/95 backdrop-blur-xl flex flex-col transform transition-transform duration-300 ease-in-out md:hidden",
                mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="h-16 flex items-center justify-between px-6 border-b border-white/5">
                    <Link href="/" className="flex items-center space-x-2" onClick={() => setMobileMenuOpen(false)}>
                        <Activity className="h-6 w-6 text-primary" />
                        <span className="font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                            ResonanceDB
                        </span>
                    </Link>
                    <Button variant="ghost" size="sm" className="h-9 w-9 p-0" onClick={() => setMobileMenuOpen(false)}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href
                        const Icon = item.icon
                        return (
                            <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)}>
                                <Button
                                    variant={isActive ? "glass" : "ghost"}
                                    className={cn("w-full justify-start", isActive ? "bg-white/5 text-white" : "text-muted-foreground")}
                                >
                                    <Icon className="mr-3 h-4 w-4" />
                                    {item.label}
                                </Button>
                            </Link>
                        )
                    })}
                </nav>

                <div className="p-4 border-t border-white/5">
                    <div className="flex items-center gap-3 px-2 mb-4">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500"></div>
                        <div>
                            <p className="text-sm font-medium text-white">{user?.email?.split("@")[0] || "Guest User"}</p>
                            <p className="text-xs text-muted-foreground capitalize">{user?.tier || "Starter"} Tier</p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-red-500 hover:text-red-400 hover:bg-red-500/10"
                        onClick={handleLogout}
                    >
                        <LogOut className="mr-3 h-4 w-4" />
                        Log Out
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
                <header className="h-16 border-b border-white/5 flex items-center justify-between px-4 md:px-6 bg-background/50 backdrop-blur-md sticky top-0 z-10 text-sm">
                    <div className="flex items-center gap-3">
                        {/* Mobile Menu Button */}
                        <Button
                            variant="ghost"
                            size="sm"
                            className="md:hidden h-9 w-9 p-0"
                            onClick={() => setMobileMenuOpen(true)}
                            aria-label="Open menu"
                        >
                            <Menu className="h-5 w-5" />
                        </Button>
                        {/* Breadcrumb */}
                        <div className="text-muted-foreground hidden sm:block">
                            Dashboard / <span className="text-foreground">{navItems.find(i => i.href === pathname)?.label || "Overview"}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="sm">Help</Button>
                    </div>
                </header>
                <div className="flex-1 overflow-auto p-4 md:p-8">
                    {children}
                </div>
            </main>
        </div>
    )
}

