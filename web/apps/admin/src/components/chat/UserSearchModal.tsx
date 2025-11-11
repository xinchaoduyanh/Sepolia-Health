'use client'

import { useState } from 'react'
import {
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogOverlay,
    DialogTitle,
} from '@workspace/ui/components/Dialog'
import { Button } from '@workspace/ui/components/Button'
import { Input } from '@workspace/ui/components/Textfield'
import { Avatar, AvatarFallback, AvatarImage } from '@workspace/ui/components/Avatar'
import { Search, User, Loader2, AlertCircle } from 'lucide-react'
import { chatService, UserSearchResult } from '@/shared/lib/api-services/chat.service'
import { toast } from '@workspace/ui/components/Sonner'
import { useChat } from '@/contexts/ChatContext'

interface UserSearchModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onUserSelected: (channelId: string) => void
}

export function UserSearchModal({ open, onOpenChange, onUserSelected }: UserSearchModalProps) {
    const [email, setEmail] = useState('')
    const [searchResult, setSearchResult] = useState<UserSearchResult | null>(null)
    const [isSearching, setIsSearching] = useState(false)
    const [isCreatingChat, setIsCreatingChat] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const { client, isConnected } = useChat()

    const handleSearch = async () => {
        if (!email.trim()) {
            setError('Vui lòng nhập email')
            return
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            setError('Email không hợp lệ')
            return
        }

        setIsSearching(true)
        setError(null)
        setSearchResult(null)

        try {
            const result = await chatService.searchUser(email.trim())
            setSearchResult(result)
        } catch (err: any) {
            console.error('Search user error:', err)
            setError(err?.response?.data?.message || 'Không tìm thấy user với email này')
            setSearchResult(null)
        } finally {
            setIsSearching(false)
        }
    }

    const handleStartChat = async () => {
        if (!searchResult || !isConnected || !client) {
            toast.error({
                title: 'Lỗi',
                description: 'Chat chưa sẵn sàng',
            })
            return
        }

        setIsCreatingChat(true)
        try {
            const response = await chatService.startDirectChat(searchResult.email)

            // Select the channel - this will trigger channel reload in parent
            onUserSelected(response.channelId)
            toast.success({
                title: 'Thành công',
                description: `Đã tạo cuộc trò chuyện với ${searchResult.name}`,
            })

            // Close modal and reset
            onOpenChange(false)
            setEmail('')
            setSearchResult(null)
            setError(null)
        } catch (err: any) {
            console.error('Start chat error:', err)
            toast.error({
                title: 'Lỗi',
                description: err?.response?.data?.message || 'Không thể tạo cuộc trò chuyện',
            })
        } finally {
            setIsCreatingChat(false)
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSearch()
        }
    }

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .toUpperCase()
            .slice(0, 2)
    }

    const getRoleLabel = (role: string) => {
        const roleMap: Record<string, string> = {
            PATIENT: 'Bệnh nhân',
            DOCTOR: 'Bác sĩ',
            RECEPTIONIST: 'Lễ tân',
            ADMIN: 'Quản trị viên',
        }
        return roleMap[role] || role
    }

    return (
        <DialogOverlay isOpen={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Tìm kiếm người dùng</DialogTitle>
                    <DialogDescription>Nhập email để tìm kiếm và bắt đầu cuộc trò chuyện</DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Search Input */}
                    <div className="space-y-2">
                        <div className="flex gap-2">
                            <Input
                                type="email"
                                placeholder="Nhập email..."
                                value={email}
                                onChange={e => {
                                    setEmail(e.target.value)
                                    setError(null)
                                    setSearchResult(null)
                                }}
                                onKeyPress={handleKeyPress}
                                className="flex-1"
                                disabled={isSearching || isCreatingChat}
                            />
                            <Button
                                onClick={handleSearch}
                                isDisabled={isSearching || isCreatingChat || !email.trim()}
                                variant="default"
                            >
                                {isSearching ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Search className="h-4 w-4" />
                                )}
                            </Button>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                                <AlertCircle className="h-4 w-4" />
                                <span>{error}</span>
                            </div>
                        )}
                    </div>

                    {/* Search Result */}
                    {searchResult && (
                        <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50">
                            <div className="flex items-center gap-3 mb-4">
                                <Avatar className="h-12 w-12">
                                    <AvatarImage src={searchResult.avatar} alt={searchResult.name} />
                                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold">
                                        {getInitials(searchResult.name)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-foreground dark:text-gray-100 truncate">
                                        {searchResult.name}
                                    </h3>
                                    <p className="text-sm text-muted-foreground truncate">{searchResult.email}</p>
                                    <div className="mt-1">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                            {getRoleLabel(searchResult.role)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <Button
                                onClick={handleStartChat}
                                isDisabled={isCreatingChat || !isConnected}
                                className="w-full"
                                variant="default"
                            >
                                {isCreatingChat ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Đang tạo cuộc trò chuyện...
                                    </>
                                ) : (
                                    <>
                                        <User className="h-4 w-4 mr-2" />
                                        Bắt đầu trò chuyện
                                    </>
                                )}
                            </Button>
                        </div>
                    )}

                    {!searchResult && !error && !isSearching && (
                        <div className="text-center py-8 text-muted-foreground">
                            <Search className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Nhập email để tìm kiếm người dùng</p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </DialogOverlay>
    )
}
