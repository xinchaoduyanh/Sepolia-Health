'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@workspace/ui/components/Button'
import { Badge } from '@workspace/ui/components/Badge'
import { Avatar, AvatarFallback } from '@workspace/ui/components/Avatar'
import { Skeleton } from '@workspace/ui/components/Skeleton'
import { TextareaField } from '@workspace/ui/components/InputField'
import { ArrowLeft, Eye, ThumbsUp, ThumbsDown, MessageCircle, CheckCircle2, Trash2, Star } from 'lucide-react'
import {
    useQuestion,
    useCreateAnswer,
    useVoteQuestion,
    useVoteAnswer,
    useSetBestAnswer,
    useDeleteAnswer,
} from '@/shared/hooks'
import { useAuth } from '@/shared/hooks/useAuth'
import type { Answer } from '@/shared/lib/api-services'
import {
    DialogOverlay,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@workspace/ui/components/Dialog'

interface PageProps {
    params: Promise<{ id: string }>
}

export default function QuestionDetailPage({ params }: PageProps) {
    const router = useRouter()
    const resolvedParams = React.use(params)
    const questionId = parseInt(resolvedParams.id)
    const { user } = useAuth()

    const [answerContent, setAnswerContent] = useState('')
    const [showAnswerForm, setShowAnswerForm] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [answerToDelete, setAnswerToDelete] = useState<number | null>(null)
    // Track user votes
    const [questionVote, setQuestionVote] = useState<'UP' | 'DOWN' | null>(null)
    const [answerVotes, setAnswerVotes] = useState<Record<number, 'UP' | 'DOWN' | null>>({})

    const { data: question, isLoading } = useQuestion(questionId)
    const createAnswer = useCreateAnswer()
    const voteQuestion = useVoteQuestion()
    const voteAnswer = useVoteAnswer()
    const setBestAnswer = useSetBestAnswer()
    const deleteAnswer = useDeleteAnswer()

    const isQuestionAuthor = question?.author.id === user?.id

    const handleVoteQuestion = async (voteType: 'UP' | 'DOWN') => {
        try {
            await voteQuestion.mutateAsync({ id: questionId, data: { voteType } })
            // Update local state
            if (questionVote === voteType) {
                // If clicking the same vote, remove it (toggle off)
                setQuestionVote(null)
            } else {
                // Otherwise, set the new vote
                setQuestionVote(voteType)
            }
        } catch (error) {
            console.error('Vote error:', error)
        }
    }

    const handleVoteAnswer = async (answerId: number, voteType: 'UP' | 'DOWN') => {
        try {
            await voteAnswer.mutateAsync({ id: answerId, data: { voteType } })
            // Update local state
            const currentVote = answerVotes[answerId]
            if (currentVote === voteType) {
                // If clicking the same vote, remove it (toggle off)
                setAnswerVotes(prev => ({ ...prev, [answerId]: null }))
            } else {
                // Otherwise, set the new vote
                setAnswerVotes(prev => ({ ...prev, [answerId]: voteType }))
            }
        } catch (error) {
            console.error('Vote error:', error)
        }
    }

    const handleCreateAnswer = async () => {
        if (!answerContent.trim()) {
            return
        }

        try {
            await createAnswer.mutateAsync({
                questionId,
                data: { content: answerContent },
            })
            setAnswerContent('')
            setShowAnswerForm(false)
        } catch (error) {
            console.error('Create answer error:', error)
        }
    }

    const handleSetBestAnswer = async (answerId: number) => {
        try {
            await setBestAnswer.mutateAsync({
                questionId,
                data: { answerId },
            })
        } catch (error) {
            console.error('Set best answer error:', error)
        }
    }

    const handleDeleteAnswer = async () => {
        if (!answerToDelete) return

        try {
            await deleteAnswer.mutateAsync(answerToDelete)
            setDeleteDialogOpen(false)
            setAnswerToDelete(null)
        } catch (error) {
            console.error('Delete answer error:', error)
        }
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
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

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-32" />
                <div className="bg-card rounded-lg border border-border p-6 space-y-4">
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-24" />
                        </div>
                    </div>
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-20 w-full" />
                </div>
            </div>
        )
    }

    if (!question) {
        return (
            <div className="space-y-6">
                <Button variant="ghost" size="sm" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Quay lại
                </Button>
                <div className="bg-card rounded-lg border border-border p-12 text-center">
                    <MessageCircle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">Không tìm thấy câu hỏi</h3>
                </div>
            </div>
        )
    }

    const sortedAnswers = [...(question.answers || [])].sort((a, b) => {
        if (a.isBestAnswer) return -1
        if (b.isBestAnswer) return 1
        return b.voteScore - a.voteScore
    })

    return (
        <div className="space-y-6">
            {/* Back Button */}
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Quay lại
            </Button>

            {/* Question Card */}
            <div className="bg-card rounded-lg shadow-sm border border-border p-6">
                {/* Author Info */}
                <div className="flex items-start gap-4 mb-4">
                    <Avatar className="h-12 w-12">
                        <AvatarFallback className={getRoleBadgeColor(question.author.role)}>
                            {question.author.fullName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="font-semibold text-foreground">{question.author.fullName}</span>
                            <Badge variant="secondary" className={getRoleBadgeColor(question.author.role)}>
                                {getRoleLabel(question.author.role)}
                            </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{formatDate(question.createdAt)}</p>
                    </div>
                </div>

                {/* Title */}
                <h1 className="text-2xl font-bold text-foreground mb-4">{question.title}</h1>

                {/* Content */}
                <p className="text-base text-foreground mb-4 whitespace-pre-wrap">{question.content}</p>

                {/* Tags */}
                {question.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                        {question.tags.map(tag => (
                            <Badge key={tag.id} variant="outline">
                                {tag.name}
                            </Badge>
                        ))}
                    </div>
                )}

                {/* Stats & Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                            <Eye className="h-4 w-4" />
                            <span>{question.views}</span>
                        </div>
                        <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                            <MessageCircle className="h-4 w-4" />
                            <span className="font-medium">{question.answerCount}</span>
                        </div>
                    </div>

                    {/* Vote Buttons */}
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleVoteQuestion('UP')}
                            className={`gap-1 ${
                                questionVote === 'UP'
                                    ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800'
                                    : ''
                            }`}
                        >
                            <ThumbsUp className="h-4 w-4" />
                            <span>{question.upvotes}</span>
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleVoteQuestion('DOWN')}
                            className={`gap-1 ${
                                questionVote === 'DOWN'
                                    ? 'bg-red-600 text-white border-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800'
                                    : ''
                            }`}
                        >
                            <ThumbsDown className="h-4 w-4" />
                            <span>{question.downvotes}</span>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Answers Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-foreground">Câu trả lời ({question.answerCount})</h2>
                    <Button onClick={() => setShowAnswerForm(!showAnswerForm)}>
                        {showAnswerForm ? 'Hủy' : 'Trả lời câu hỏi'}
                    </Button>
                </div>

                {/* Answer Form */}
                {showAnswerForm && (
                    <div className="bg-card rounded-lg shadow-sm border border-border p-6">
                        <TextareaField
                            placeholder="Viết câu trả lời của bạn..."
                            value={answerContent}
                            onChange={e => setAnswerContent(e.target.value)}
                            className="min-h-[120px] mb-4"
                        />
                        <div className="flex justify-end gap-2">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowAnswerForm(false)
                                    setAnswerContent('')
                                }}
                            >
                                Hủy
                            </Button>
                            <Button
                                onClick={handleCreateAnswer}
                                isDisabled={!answerContent.trim() || createAnswer.isPending}
                            >
                                {createAnswer.isPending ? 'Đang gửi...' : 'Gửi câu trả lời'}
                            </Button>
                        </div>
                    </div>
                )}

                {/* Answers List */}
                {sortedAnswers.length === 0 ? (
                    <div className="bg-card rounded-lg border border-border p-12 text-center">
                        <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                        <h3 className="text-base font-semibold text-foreground mb-1">Chưa có câu trả lời nào</h3>
                        <p className="text-sm text-muted-foreground">Hãy là người đầu tiên trả lời câu hỏi này!</p>
                    </div>
                ) : (
                    sortedAnswers.map((answer: Answer) => {
                        const answerRoleBadge = getRoleBadgeColor(answer.author.role)
                        const canDelete = answer.author.id === user?.id || isQuestionAuthor

                        return (
                            <div
                                key={answer.id}
                                className={`bg-card rounded-lg shadow-sm border-2 p-6 ${
                                    answer.isBestAnswer ? 'border-green-500 dark:border-green-700' : 'border-border'
                                }`}
                            >
                                {/* Best Answer Badge */}
                                {answer.isBestAnswer && (
                                    <div className="flex items-center gap-2 mb-3 text-green-600 dark:text-green-400">
                                        <CheckCircle2 className="h-5 w-5" />
                                        <span className="text-sm font-semibold">Câu trả lời tốt nhất</span>
                                    </div>
                                )}

                                {/* Author Info */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10">
                                            <AvatarFallback className={answerRoleBadge}>
                                                {answer.author.fullName.charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                                <span className="font-medium text-foreground">
                                                    {answer.author.fullName}
                                                </span>
                                                {answer.author.role === 'DOCTOR' && (
                                                    <Badge variant="secondary" className={answerRoleBadge}>
                                                        {getRoleLabel(answer.author.role)}
                                                    </Badge>
                                                )}
                                                {answer.author.id === question.author.id && (
                                                    <Badge
                                                        variant="secondary"
                                                        className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                                                    >
                                                        Tác giả câu hỏi
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                {formatDate(answer.createdAt)}
                                            </p>
                                        </div>
                                    </div>

                                    {canDelete && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                setAnswerToDelete(answer.id)
                                                setDeleteDialogOpen(true)
                                            }}
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>

                                {/* Content */}
                                <p className="text-sm text-foreground mb-4 whitespace-pre-wrap">{answer.content}</p>

                                {/* Actions */}
                                <div className="flex items-center justify-between pt-4 border-t border-border">
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleVoteAnswer(answer.id, 'UP')}
                                            className={`gap-1 ${
                                                answerVotes[answer.id] === 'UP'
                                                    ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800'
                                                    : ''
                                            }`}
                                        >
                                            <ThumbsUp className="h-4 w-4" />
                                            <span>{answer.upvotes}</span>
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleVoteAnswer(answer.id, 'DOWN')}
                                            className={`gap-1 ${
                                                answerVotes[answer.id] === 'DOWN'
                                                    ? 'bg-red-600 text-white border-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800'
                                                    : ''
                                            }`}
                                        >
                                            <ThumbsDown className="h-4 w-4" />
                                            <span>{answer.downvotes}</span>
                                        </Button>
                                    </div>

                                    {isQuestionAuthor && !answer.isBestAnswer && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleSetBestAnswer(answer.id)}
                                            className="gap-2 text-green-600 border-green-500 hover:bg-green-50 dark:hover:bg-green-950"
                                        >
                                            <Star className="h-4 w-4" />
                                            Chọn là câu trả lời tốt nhất
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )
                    })
                )}
            </div>

            {/* Delete Confirmation Dialog */}
            <DialogOverlay isOpen={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Xác nhận xóa</DialogTitle>
                        <DialogDescription>
                            Bạn có chắc chắn muốn xóa câu trả lời này? Hành động này không thể hoàn tác.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                            Hủy
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteAnswer} isDisabled={deleteAnswer.isPending}>
                            {deleteAnswer.isPending ? 'Đang xóa...' : 'Xóa'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </DialogOverlay>
        </div>
    )
}
