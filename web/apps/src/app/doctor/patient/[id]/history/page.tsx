'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { usePatientMedicalHistory } from '@/shared/hooks'
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/Card'
import { Badge } from '@workspace/ui/components/Badge'
import { Skeleton } from '@workspace/ui/components/Skeleton'
import {
    ArrowLeft,
    Calendar,
    User,
    Stethoscope,
    History,
    Home,
    Loader2,
} from 'lucide-react'
import { formatDate, formatTime } from '@/util/datetime'

export default function PatientHistoryPage() {
    const { id } = useParams()
    const router = useRouter()
    const patientProfileId = Number(id)
    const [page, setPage] = useState(1)

    const { data: historyData, isLoading, error } = usePatientMedicalHistory(
        patientProfileId,
        !!patientProfileId,
        { page, limit: 10, sortBy: 'startTime', sortOrder: 'desc' }
    )

    // Show error state
    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="p-4 bg-red-100 rounded-full mb-4 inline-block">
                        <History className="h-16 w-16 text-red-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">Lỗi tải dữ liệu</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        Không thể tải lịch sử khám bệnh. Vui lòng thử lại.
                    </p>
                    <button
                        onClick={() => router.back()}
                        className="px-4 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                        Quay lại
                    </button>
                </div>
            </div>
        )
    }

    if (isLoading) {
        return (
            <div className="space-y-6">
                {/* Header Skeleton */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-10 w-10 rounded-lg" />
                        <div className="space-y-2">
                            <Skeleton className="h-8 w-64" />
                            <Skeleton className="h-4 w-48" />
                        </div>
                    </div>
                    <Skeleton className="h-10 w-32 rounded-lg" />
                </div>

                {/* Cards Skeleton - giống structure thật */}
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <Card key={i} className="border-2">
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 space-y-3">
                                        <div className="flex items-center gap-2">
                                            <Skeleton className="h-6 w-24 rounded-full" />
                                            <Skeleton className="h-4 w-32" />
                                        </div>
                                        <Skeleton className="h-6 w-48" />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Skeleton className="h-5 w-full" />
                                <Skeleton className="h-5 w-3/4" />
                                <div className="space-y-2">
                                    <Skeleton className="h-20 w-full rounded-lg" />
                                    <Skeleton className="h-20 w-full rounded-lg" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Pagination Skeleton */}
                <div className="flex items-center justify-center gap-2 pt-4">
                    <Skeleton className="h-10 w-20 rounded-lg" />
                    <Skeleton className="h-10 w-32 rounded-lg" />
                    <Skeleton className="h-10 w-20 rounded-lg" />
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-muted rounded-lg transition-colors border border-border"
                    >
                        <ArrowLeft className="h-5 w-5 text-foreground" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Lịch sử khám bệnh</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            {historyData?.total || 0} lượt khám đã hoàn thành
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => router.push('/doctor')}
                    className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-lg transition-colors"
                >
                    <Home className="h-4 w-4" />
                    Về trang chủ
                </button>
            </div>

            {/* History List */}
            {!historyData?.data || historyData.data.length === 0 ? (
                <Card className="border-2">
                    <CardContent className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="p-4 bg-muted/50 rounded-full mb-4">
                            <History className="h-16 w-16 text-muted-foreground" />
                        </div>
                        <h3 className="text-xl font-semibold text-foreground mb-2">Chưa có lịch sử khám</h3>
                        <p className="text-sm text-muted-foreground">
                            Bệnh nhân chưa có lịch khám đã hoàn thành nào
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {historyData.data.map((apt) => (
                        <Card key={apt.id} className="border-2 hover:border-primary/50 transition-colors">
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Badge className="bg-green-100 text-green-800 border-green-300">
                                                Đã hoàn thành
                                            </Badge>
                                            <span className="text-sm text-muted-foreground">
                                                {formatDate(apt.startTime.toString())}
                                            </span>
                                        </div>
                                        <h4 className="font-bold text-lg text-foreground">
                                            {apt.service?.name}
                                        </h4>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {apt.doctor && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <Stethoscope className="h-4 w-4 text-primary" />
                                        <span className="text-muted-foreground">Bác sĩ:</span>
                                        <span className="font-medium text-foreground">
                                            BS. {apt.doctor.lastName} {apt.doctor.firstName}
                                        </span>
                                    </div>
                                )}

                                <div className="flex items-center gap-2 text-sm">
                                    <Calendar className="h-4 w-4 text-primary" />
                                    <span className="text-muted-foreground">Thời gian:</span>
                                    <span className="font-medium text-foreground">
                                        {formatTime(apt.startTime.toString())} - {formatTime(apt.endTime.toString())}
                                    </span>
                                </div>

                                {apt.result?.diagnosis && (
                                    <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 border-l-4 border-blue-500">
                                        <p className="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-2">
                                            CHẨN ĐOÁN
                                        </p>
                                        <p className="text-sm text-foreground">{apt.result.diagnosis}</p>
                                    </div>
                                )}

                                {apt.result?.prescription && (
                                    <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-4 border-l-4 border-green-500">
                                        <p className="text-xs font-semibold text-green-900 dark:text-green-100 mb-2">
                                            ĐƠN THUỐC
                                        </p>
                                        <p className="text-sm text-foreground whitespace-pre-wrap">
                                            {apt.result.prescription}
                                        </p>
                                    </div>
                                )}

                                {apt.result?.notes && (
                                    <div className="bg-gray-50 dark:bg-gray-950/20 rounded-lg p-4 border-l-4 border-gray-500">
                                        <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 mb-2">
                                            GHI CHÚ
                                        </p>
                                        <p className="text-sm text-foreground">{apt.result.notes}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}

                    {/* Pagination */}
                    {historyData.total > historyData.limit && (
                        <div className="flex items-center justify-center gap-2 pt-4">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-primary/20"
                            >
                                Trước
                            </button>
                            <span className="text-sm text-muted-foreground px-4">
                                Trang {page} / {Math.ceil(historyData.total / historyData.limit)}
                            </span>
                            <button
                                onClick={() => setPage((p) => Math.min(Math.ceil(historyData.total / historyData.limit), p + 1))}
                                disabled={page >= Math.ceil(historyData.total / historyData.limit)}
                                className="px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-primary/20"
                            >
                                Sau
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
