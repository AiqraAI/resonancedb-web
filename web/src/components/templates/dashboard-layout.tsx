"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Activity, BarChart2, FileUp, Home, LayoutDashboard, Settings, LogOut, Brain, Search } from "lucide-react"
import { Button } from "@/components/atoms/button"
import { cn } from "@/lib/utils"

interface DashboardLayoutProps {
    children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
    const pathname = usePathname()

    const navItems = [
        { href: "/dashboard", icon: LayoutDashboard, label: "Overview" },
        { href: "/dashboard/submit", icon: FileUp, label: "New Submission" },
        { href: "/dashboard/predict", icon: Brain, label: "Predict" },
        { href: "/dashboard/explore", icon: Search, label: "Explore" },
        { href: "/dashboard/visualize", icon: Activity, label: "Visualize" },
        { href: "/dashboard/leaderboard", icon: BarChart2, label: "Leaderboard" },
        { href: "/dashboard/settings", icon: Settings, label: "Settings" },
    ]

    return (
        <div className="min-h-screen bg-background flex">
            {/* Sidebar */}
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
                            <p className="text-sm font-medium text-white">Guest User</p>
                            <p className="text-xs text-muted-foreground">Starter Tier</p>
                        </div>
                    </div>
                    <Link href="/">
                        <Button variant="ghost" className="w-full justify-start text-red-500 hover:text-red-400 hover:bg-red-500/10">
                            <LogOut className="mr-3 h-4 w-4" />
                            Log Out
                        </Button>
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
                <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-background/50 backdrop-blur-md sticky top-0 z-10 text-sm">
                    <div className="md:hidden">
                        {/* Mobile Menu Trigger would go here */}
                        <Activity className="h-6 w-6 text-primary" />
                    </div>
                    <div className="hidden md:block text-muted-foreground">
                        Dashboard / <span className="text-foreground">{navItems.find(i => i.href === pathname)?.label || "Overview"}</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="sm">Help</Button>
                    </div>
                </header>
                <div className="flex-1 overflow-auto p-6 md:p-8">
                    {children}
                </div>
            </main>
        </div>
    )
}
