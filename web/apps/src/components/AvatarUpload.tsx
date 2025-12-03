'use client'

import { useState, useRef, useEffect } from 'react'
import { Camera, User, X, Link } from 'lucide-react'
import { uploadService } from '@/shared/lib/api-services'

interface AvatarUploadProps {
    value?: string
    onChange: (url: string) => void
    disabled?: boolean
}

export function AvatarUpload({ value, onChange, disabled = false }: AvatarUploadProps) {
    const [showUrlInput, setShowUrlInput] = useState(false)
    const [urlInputValue, setUrlInputValue] = useState('')
    const [isUploading, setIsUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const urlInputRef = useRef<HTMLDivElement>(null)

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Vui lòng chọn file ảnh')
            return
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            alert('Kích thước file không được vượt quá 5MB')
            return
        }

        setIsUploading(true)
        try {
            // Upload to S3 using admin upload API
            const result = await uploadService.uploadAvatar(file)
            onChange(result.avatarUrl)
        } catch (error: any) {
            console.error('Upload error:', error)
            alert(error.message || 'Lỗi khi upload ảnh')
        } finally {
            setIsUploading(false)
        }
    }

    const handleUrlSubmit = () => {
        if (urlInputValue.trim()) {
            onChange(urlInputValue.trim())
            setUrlInputValue('')
            setShowUrlInput(false)
        }
    }

    const handleUrlCancel = () => {
        setUrlInputValue('')
        setShowUrlInput(false)
    }

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation()
        onChange('')
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    // Handle click outside to close URL input
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (urlInputRef.current && !urlInputRef.current.contains(event.target as Node)) {
                setShowUrlInput(false)
                setUrlInputValue('')
            }
        }

        if (showUrlInput) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [showUrlInput])

    return (
        <div className="relative">
            {/* Hidden File Input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                disabled={disabled}
            />

            {/* Avatar Circle */}
            <button
                type="button"
                onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
                disabled={disabled || isUploading}
                className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-border hover:border-primary transition-colors cursor-pointer disabled:cursor-not-allowed bg-muted flex items-center justify-center group"
            >
                {isUploading ? (
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
                ) : value ? (
                    <>
                        <img src={value} alt="Avatar" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-colors flex items-center justify-center">
                            <Camera className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                    </>
                ) : (
                    <User className="h-10 w-10 text-muted-foreground" />
                )}

                {/* Remove Button */}
                {value && !disabled && !isUploading && (
                    <div
                        onClick={handleRemove}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors z-10 cursor-pointer"
                    >
                        <X className="h-3 w-3" />
                    </div>
                )}
            </button>

            {/* URL Input Button */}
            {!disabled && !isUploading && (
                <div
                    onClick={() => setShowUrlInput(true)}
                    className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full p-1 hover:bg-primary/90 transition-colors z-10 cursor-pointer"
                    title="Nhập URL ảnh"
                >
                    <Link className="h-3 w-3" />
                </div>
            )}

            {/* URL Input Modal/Dropdown */}
            {showUrlInput && !disabled && (
                <div
                    ref={urlInputRef}
                    className="absolute top-full left-0 mt-2 bg-background border border-border rounded-lg shadow-lg p-3 z-20 min-w-[280px]"
                >
                    <div className="space-y-2">
                        <label className="block text-xs font-medium text-foreground">Nhập URL ảnh</label>
                        <input
                            type="url"
                            value={urlInputValue}
                            onChange={e => setUrlInputValue(e.target.value)}
                            placeholder="https://example.com/image.jpg"
                            className="w-full px-2 py-1 text-sm bg-background text-foreground border border-border rounded focus:ring-2 focus:ring-primary focus:border-transparent"
                            onKeyDown={e => {
                                if (e.key === 'Enter') {
                                    handleUrlSubmit()
                                } else if (e.key === 'Escape') {
                                    handleUrlCancel()
                                }
                            }}
                            autoFocus
                        />
                        <div className="flex gap-2 justify-end">
                            <button
                                type="button"
                                onClick={handleUrlCancel}
                                className="px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                            >
                                Hủy
                            </button>
                            <button
                                type="button"
                                onClick={handleUrlSubmit}
                                className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                            >
                                Áp dụng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
