"use client"

import * as React from "react"
import { UploadCloud, FileJson, X, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/atoms/button"

interface FileUploadProps {
    onFileSelect: (file: File) => void
    accept?: string
    maxSize?: number // in bytes
    className?: string
}

export function FileUpload({ onFileSelect, accept = ".json", maxSize = 5242880, className }: FileUploadProps) {
    const [dragActive, setDragActive] = React.useState(false)
    const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
    const [error, setError] = React.useState<string | null>(null)
    const inputRef = React.useRef<HTMLInputElement>(null)

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true)
        } else if (e.type === "dragleave") {
            setDragActive(false)
        }
    }

    const validateFile = (file: File) => {
        if (accept && !file.name.endsWith(accept.replace("*", ""))) {
            setError(`Invalid file type. Please upload a ${accept} file.`)
            return false
        }
        if (file.size > maxSize) {
            setError(`File too large. Max size is ${maxSize / 1024 / 1024}MB.`)
            return false
        }
        return true
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0]
            if (validateFile(file)) {
                setSelectedFile(file)
                setError(null)
                onFileSelect(file)
            }
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault()
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]
            if (validateFile(file)) {
                setSelectedFile(file)
                setError(null)
                onFileSelect(file)
            }
        }
    }

    const removeFile = () => {
        setSelectedFile(null)
        setError(null)
        if (inputRef.current) {
            inputRef.current.value = ""
        }
    }

    return (
        <div className={cn("w-full", className)}>
            <div
                className={cn(
                    "relative flex flex-col items-center justify-center w-full min-h-[200px] rounded-xl border-2 border-dashed transition-all duration-300",
                    dragActive
                        ? "border-primary bg-primary/10 scale-[1.01]"
                        : "border-white/10 bg-black/20 hover:bg-black/40 hover:border-white/20",
                    error ? "border-destructive/50 bg-destructive/5" : "",
                    "glass-card"
                )}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                <input
                    ref={inputRef}
                    type="file"
                    className="hidden"
                    accept={accept}
                    onChange={handleChange}
                />

                {selectedFile ? (
                    <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                        <div className="h-16 w-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                            <CheckCircle2 className="h-8 w-8 text-green-500" />
                        </div>
                        <p className="text-lg font-medium text-white">{selectedFile.name}</p>
                        <p className="text-sm text-zinc-400 mt-1">
                            {(selectedFile.size / 1024).toFixed(2)} KB
                        </p>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); removeFile(); }}
                            className="mt-4 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                            Remove
                        </Button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center text-center p-8">
                        <div className={cn("h-16 w-16 rounded-full bg-white/5 flex items-center justify-center mb-4 transition-transform duration-300", dragActive ? "scale-110" : "")}>
                            <UploadCloud className="h-8 w-8 text-primary" />
                        </div>
                        <p className="mb-2 text-lg font-medium text-white">
                            Drag & Drop or <span className="text-primary cursor-pointer hover:underline" onClick={() => inputRef.current?.click()}>Choose File</span>
                        </p>
                        <p className="text-sm text-zinc-500">
                            Supported formats: JSON (ResonanceDB Schema)
                        </p>
                        {error && (
                            <p className="mt-4 text-sm text-destructive bg-destructive/10 px-3 py-1 rounded-full animate-pulse">
                                {error}
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
