'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { BsSearchField } from '@workspace/ui/components/Searchfield'
import { BsSelect } from '@workspace/ui/components/Select'
import { Badge } from '@workspace/ui/components/Badge'
import { Avatar, AvatarFallback } from '@workspace/ui/components/Avatar'
import { Skeleton } from '@workspace/ui/components/Skeleton'
import { Pagination } from '@workspace/ui/components/Pagination'
import { MessageSquare, Eye, ThumbsUp, CheckCircle2, MessageCircle } from 'lucide-react'
import { useQuestions, usePopularTags } from '@/shared/hooks'
import type { Question } from '@/shared/lib/api-services'

// Skeleton loading component
const SkeletonCard = () => (
    <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-start gap-4 mb-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1">
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-3 w-24" />
            </div>
        </div>
        <Skeleton className="h-6 w-full mb-2" />
        <Skeleton className="h-4 w-3/4 mb-4" />
        <div className="flex gap-2 mb-4">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-24" />
        </div>
        <div className="flex gap-4">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
        </div>
    </div>
)

export default function QnaListPage() {
    const router = useRouter()
    const [searchTerm, setSearchTerm] = useState('')
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>('')
    const [currentPage, setCurrentPage] = useState(1)
    const [selectedTagId, setSelectedTagId] = useState<string>('')
    const [sortBy, setSortBy] = useState<'newest' | 'mostVoted' | 'mostAnswered' | 'unanswered'>('newest')
    const itemsPerPage = 10

    // Debounce search term
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm)
        }, 500)

        return () => clearTimeout(timer)
    }, [searchTerm])

    const queryParams = useMemo(() => {
        const params: any = {
            page: currentPage,
            limit: itemsPerPage,
            sortBy,
        }

        if (debouncedSearchTerm) {
            params.search = debouncedSearchTerm
        }

        if (selectedTagId) {
            params.tagIds = [parseInt(selectedTagId)]
        }

        return params
    }, [currentPage, debouncedSearchTerm, selectedTagId, sortBy])

    const handleSearchChange = useCallback((value: string) => {
        setSearchTerm(value)
        setCurrentPage(1)
    }, [])

    const handlePageChange = useCallback((page: number) => {
        setCurrentPage(page)
    }, [])

    // Fetch data
    const { data: questionsResponse, isLoading } = useQuestions(queryParams)
    const { data: tagsResponse } = usePopularTags()

    const questions = questionsResponse?.questions || []
    const totalPages = Math.ceil((questionsResponse?.total || 0) / itemsPerPage)
    const tags = tagsResponse?.tags || []

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1)
    }, [selectedTagId, sortBy])

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        const now = new Date()
        const diff = now.getTime() - date.getTime()
        const days = Math.floor(diff / (1000 * 60 * 60 * 24))

        if (days === 0) return 'Hôm nay'
        if (days === 1) return 'Hôm qua'
        if (days < 7) return `${days} ngày trước`
        if (days < 30) return `${Math.floor(days / 7)} tuần trước`
        return date.toLocaleDateString('vi-VN')
    }

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'DOCTOR':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
            case 'PATIENT':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
            case 'ADMIN':
                return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
        }
    }

    const getRoleLabel = (role: string) => {
        switch (role) {
            case 'DOCTOR':
                return 'Bác sĩ'
            case 'PATIENT':
                return 'Bệnh nhân'
            case 'ADMIN':
                return 'Admin'
            default:
                return 'Người dùng'
        }
    }

    const sortOptions = [
        { id: 'newest', name: 'Mới nhất' },
        { id: 'mostVoted', name: 'Nhiều vote nhất' },
        { id: 'mostAnswered', name: 'Nhiều câu trả lời' },
        { id: 'unanswered', name: 'Chưa có câu trả lời' },
    ]

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Hỏi đáp cộng đồng</h1>
                    <p className="text-sm text-muted-foreground mt-1">Xem và trả lời các câu hỏi từ cộng đồng</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-card rounded-lg shadow-sm border border-border p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                        <BsSearchField
                            placeholder="Tìm kiếm câu hỏi..."
                            value={searchTerm}
                            onChange={handleSearchChange}
                            className="w-full"
                        />
                    </div>
                    <div>
                        <BsSelect
                            placeholder="Sắp xếp theo"
                            selectedKey={sortBy}
                            onSelectionChange={key => {
                                setSortBy(key as any)
                            }}
                            options={sortOptions}
                            className="w-full"
                        />
                    </div>
                    <div>
                        <BsSelect
                            placeholder="Chọn tag"
                            selectedKey={selectedTagId || null}
                            onSelectionChange={key => {
                                setSelectedTagId((key as string) || '')
                            }}
                            options={[
                                { id: '', name: 'Tất cả tags' },
                                ...(Array.isArray(tags) && tags.length > 0
                                    ? tags.map(t => ({ id: t.id.toString(), name: t.name }))
                                    : []),
                            ]}
                            className="w-full"
                        />
                    </div>
                </div>

                {/* Popular Tags */}
                {tags.length > 0 && (
                    <div>
                        <p className="text-sm font-medium text-foreground mb-2">Tags phổ biến:</p>
                        <div className="flex flex-wrap gap-2">
                            {tags.slice(0, 8).map(tag => (
                                <Badge
                                    key={tag.id}
                                    variant={selectedTagId === tag.id.toString() ? 'default' : 'outline'}
                                    className="cursor-pointer hover:bg-primary hover:text-white transition-colors"
                                    onClick={() =>
                                        setSelectedTagId(prev => (prev === tag.id.toString() ? '' : tag.id.toString()))
                                    }
                                >
                                    {tag.name}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Questions List */}
            <div className="space-y-4">
                {isLoading ? (
                    <>
                        {[...Array(5)].map((_, idx) => (
                            <SkeletonCard key={idx} />
                        ))}
                    </>
                ) : questions.length === 0 ? (
                    <div className="bg-card rounded-lg border border-border p-12 text-center">
                        <MessageSquare className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold text-foreground mb-2">Chưa có câu hỏi nào</h3>
                        <p className="text-sm text-muted-foreground">
                            Không tìm thấy câu hỏi nào phù hợp với bộ lọc của bạn
                        </p>
                    </div>
                ) : (
                    questions.map((question: Question) => {
                        const roleBadgeColor = getRoleBadgeColor(question.author.role)
                        return (
                            <div
                                key={question.id}
                                className="bg-card rounded-lg border border-border p-6 hover:shadow-md transition-shadow cursor-pointer"
                                onClick={() => router.push(`/dashboard/doctor/qna/${question.id}`)}
                            >
                                {/* Author Info */}
                                <div className="flex items-start gap-3 mb-4">
                                    <Avatar className="h-10 w-10">
                                        <AvatarFallback className={roleBadgeColor}>
                                            {question.author.fullName.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-medium text-foreground">
                                                {question.author.fullName}
                                            </span>
                                            <Badge variant="secondary" className={roleBadgeColor}>
                                                {getRoleLabel(question.author.role)}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {formatDate(question.createdAt)}
                                        </p>
                                    </div>
                                </div>

                                {/* Question Title */}
                                <h3 className="text-lg font-bold text-foreground mb-2 hover:text-primary transition-colors">
                                    {question.title}
                                </h3>

                                {/* Question Content Preview */}
                                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{question.content}</p>

                                {/* Tags */}
                                {question.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {question.tags.map(tag => (
                                            <Badge key={tag.id} variant="outline" className="text-xs">
                                                {tag.name}
                                            </Badge>
                                        ))}
                                    </div>
                                )}

                                {/* Stats */}
                                <div className="flex items-center gap-4 text-sm">
                                    <div className="flex items-center gap-1 text-muted-foreground">
                                        <Eye className="h-4 w-4" />
                                        <span>{question.views}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                                        <ThumbsUp className="h-4 w-4" />
                                        <span className="font-medium">{question.voteScore}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                                        <MessageCircle className="h-4 w-4" />
                                        <span className="font-medium">{question.answerCount}</span>
                                    </div>
                                    {question.hasBestAnswer && (
                                        <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                                            <CheckCircle2 className="h-4 w-4" />
                                            <span className="text-xs font-medium">Đã giải đáp</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="bg-card rounded-lg shadow-sm border border-border px-6 py-4 flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                        Hiển thị {(currentPage - 1) * itemsPerPage + 1} đến{' '}
                        {Math.min(currentPage * itemsPerPage, questionsResponse?.total || 0)} trong tổng số{' '}
                        {questionsResponse?.total || 0} câu hỏi
                    </div>
                    <Pagination value={currentPage} pageCount={totalPages} onChange={handlePageChange} />
                </div>
            )}
        </div>
    )
}
