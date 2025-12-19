"use client"

import * as React from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/atoms/input"
import { cn } from "@/lib/utils"

export function SearchInput({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
    return (
        <div className={cn("relative", className)}>
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
                type="search"
                placeholder="Search samples, materials..."
                className="pl-10 bg-white/5 border-white/10 focus-visible:bg-white/10 transition-colors"
                {...props}
            />
        </div>
    )
}
