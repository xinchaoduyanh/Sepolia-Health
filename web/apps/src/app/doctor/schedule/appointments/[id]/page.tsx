'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useDoctorAppointment, useCreateOrUpdateAppointmentResult } from '@/shared/hooks'
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/Card'
import { Badge } from '@workspace/ui/components/Badge'
import { Skeleton } from '@workspace/ui/components/Skeleton'
import {
    ArrowLeft,
    Calendar,
    Clock,
    User,
    Stethoscope,
    Building2,
    FileText,
    Star,
    CheckCircle2,
    XCircle,
    Save,
    Loader2,
    AlertCircle,
    History,
    Home,
} from 'lucide-react'
import { formatDate, formatTime } from '@/util/datetime'

const getStatusBadge = (status: string) => {
    switch (status) {
        case 'UPCOMING':
            return {
                label: 'Sắp tới',
                className:
                    'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 border-blue-300 dark:border-blue-700',
            }
        case 'ON_GOING':
            return {
                label: 'Đang diễn ra',
                className:
                    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700',
            }
        case 'COMPLETED':
            return {
                label: 'Đã hoàn thành',
                className:
                    'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 border-green-300 dark:border-green-700',
            }
        case 'CANCELLED':
            return {
                label: 'Đã hủy',
                className:
                    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 border-red-300 dark:border-red-700',
            }
        default:
            return {
                label: status,
                className:
                    'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300 border-gray-300 dark:border-gray-700',
            }
    }
}

export default function AppointmentDetailPage() {
    const { id } = useParams()
    const router = useRouter()
    const appointmentId = Number(id)

    const { data: appointment, isLoading } = useDoctorAppointment(appointmentId, !!id)
    const createOrUpdateMutation = useCreateOrUpdateAppointmentResult()

    const [formData, setFormData] = useState({
        diagnosis: '',
        notes: '',
        prescription: '',
        recommendations: '',
    })

    const [isEditing, setIsEditing] = useState(false)

    // Load existing result when appointment data is available
    useEffect(() => {
        if (appointment?.result) {
            setFormData({
                diagnosis: appointment.result.diagnosis || '',
                notes: appointment.result.notes || '',
                prescription: appointment.result.prescription || '',
                recommendations: appointment.result.recommendations || '',
            })
            setIsEditing(true)
        } else {
            setFormData({
                diagnosis: '',
                notes: '',
                prescription: '',
                recommendations: '',
            })
            setIsEditing(false)
        }
    }, [appointment])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            await createOrUpdateMutation.mutateAsync({
                appointmentId,
                data: {
                    diagnosis: formData.diagnosis || undefined,
                    notes: formData.notes || undefined,
                    prescription: formData.prescription || undefined,
                    recommendations: formData.recommendations || undefined,
                },
            })
            setIsEditing(false)
        } catch (error) {
            console.error('Error saving result:', error)
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }))
    }

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <Skeleton className="h-8 w-64" />
                </div>
                <Card>
                    <CardContent className="p-6">
                        <div className="space-y-4">
                            <Skeleton className="h-24 w-full" />
                            <Skeleton className="h-24 w-full" />
                            <Skeleton className="h-24 w-full" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (!appointment) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Card className="border-2 shadow-lg">
                    <CardContent className="p-12 text-center">
                        <div className="p-4 bg-muted/50 rounded-full w-fit mx-auto mb-4">
                            <AlertCircle className="h-12 w-12 text-muted-foreground" />
                        </div>
                        <h3 className="text-xl font-semibold text-foreground mb-2">Không tìm thấy lịch khám</h3>
                        <p className="text-sm text-muted-foreground mb-6">Lịch khám không tồn tại hoặc đã bị xóa.</p>
                        <button
                            onClick={() => router.back()}
                            className="px-6 py-2 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors border border-primary/20"
                        >
                            Quay lại
                        </button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const statusBadge = getStatusBadge(appointment.status)
    const hasResult = !!appointment.result
    const canEditResult = appointment.status === 'COMPLETED' || appointment.status === 'ON_GOING'

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
                        <h1 className="text-3xl font-bold text-foreground">Chi tiết lịch khám</h1>
                        <p className="text-sm text-muted-foreground mt-1">Mã lịch khám: #{appointment.id}</p>
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

            {/* Appointment Info */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Info */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Status & Time */}
                    <Card className="border-2 shadow-lg">
                        <CardHeader className="border-b bg-gradient-to-r from-primary/5 to-primary/10">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-xl font-bold">Thông tin lịch khám</CardTitle>
                                <Badge
                                    variant="secondary"
                                    className={`${statusBadge.className} border-2 font-semibold`}
                                >
                                    {statusBadge.label}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <Calendar className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Ngày khám</p>
                                    <p className="font-semibold text-foreground">
                                        {formatDate(appointment.startTime.toString())}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <Clock className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Thời gian</p>
                                    <p className="font-semibold text-foreground">
                                        {formatTime(appointment.startTime.toString())} -{' '}
                                        {formatTime(appointment.endTime.toString())}
                                    </p>
                                </div>
                            </div>
                            {appointment.notes && (
                                <div className="pt-4 border-t border-border">
                                    <p className="text-sm text-muted-foreground mb-2">Ghi chú</p>
                                    <p className="text-sm text-foreground">{appointment.notes}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Patient Info */}
                    {appointment.patient && (
                        <Card className="border-2 shadow-lg">
                            <CardHeader className="border-b bg-gradient-to-r from-blue-500/5 to-blue-500/10">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <User className="h-5 w-5 text-blue-600" />
                                        <CardTitle className="text-xl font-bold">Thông tin bệnh nhân</CardTitle>
                                    </div>
                                    <button
                                        onClick={() => router.push(`/doctor/patient/${appointment.patient.id}/history`)}
                                        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-primary hover:bg-primary/90 text-white rounded-lg transition-all duration-200 hover:scale-105 shadow-md hover:shadow-lg"
                                    >
                                        <History className="h-4 w-4" />
                                        Xem lịch sử khám của bệnh nhân
                                    </button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Họ và tên</p>
                                        <p className="font-semibold text-foreground">
                                            {appointment.patient.firstName} {appointment.patient.lastName}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Số điện thoại</p>
                                        <p className="font-semibold text-foreground">{appointment.patient.phone}</p>
                                    </div>
                                    {appointment.patient.dateOfBirth && (
                                        <div>
                                            <p className="text-sm text-muted-foreground">Ngày sinh</p>
                                            <p className="font-semibold text-foreground">
                                                {formatDate(appointment.patient.dateOfBirth.toString())}
                                            </p>
                                        </div>
                                    )}
                                    {appointment.patient.gender && (
                                        <div>
                                            <p className="text-sm text-muted-foreground">Giới tính</p>
                                            <p className="font-semibold text-foreground">
                                                {appointment.patient.gender === 'MALE' ? 'Nam' : 'Nữ'}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Service & Clinic */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {appointment.service && (
                            <Card className="border-2 shadow-lg">
                                <CardHeader className="border-b bg-gradient-to-r from-green-500/5 to-green-500/10">
                                    <div className="flex items-center gap-2">
                                        <FileText className="h-5 w-5 text-green-600" />
                                        <CardTitle className="text-lg font-bold">Dịch vụ</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <p className="font-semibold text-foreground mb-2">{appointment.service.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {appointment.service.price.toLocaleString('vi-VN')} VNĐ
                                    </p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Thời lượng: {appointment.service.duration} phút
                                    </p>
                                </CardContent>
                            </Card>
                        )}

                        {appointment.type === 'ONLINE' && appointment.hostUrl ? (
                            <Card className="border-2 shadow-lg">
                                <CardHeader className="border-b bg-gradient-to-r from-purple-500/5 to-purple-500/10">
                                    <div className="flex items-center gap-2">
                                        <Building2 className="h-5 w-5 text-purple-600" />
                                        <CardTitle className="text-lg font-bold">Liên kết trực tuyến</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <a
                                        href={appointment.hostUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-colors"
                                    >
                                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                        </svg>
                                        Tham gia cuộc gọi
                                    </a>
                                    <p className="text-xs text-muted-foreground mt-3 break-all">{appointment.hostUrl}</p>
                                </CardContent>
                            </Card>
                        ) : appointment.clinic ? (
                            <Card className="border-2 shadow-lg">
                                <CardHeader className="border-b bg-gradient-to-r from-purple-500/5 to-purple-500/10">
                                    <div className="flex items-center gap-2">
                                        <Building2 className="h-5 w-5 text-purple-600" />
                                        <CardTitle className="text-lg font-bold">Cơ sở</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <p className="font-semibold text-foreground mb-2">{appointment.clinic.name}</p>
                                    <p className="text-sm text-muted-foreground">{appointment.clinic.address}</p>
                                </CardContent>
                            </Card>
                        ) : null}
                    </div>

                    {/* Feedback */}
                    {appointment.feedback && (
                        <Card className="border-2 shadow-lg">
                            <CardHeader className="border-b bg-gradient-to-r from-yellow-500/5 to-yellow-500/10">
                                <div className="flex items-center gap-2">
                                    <Star className="h-5 w-5 text-yellow-600 fill-yellow-600" />
                                    <CardTitle className="text-xl font-bold">Đánh giá từ bệnh nhân</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="flex items-center gap-2 mb-3">
                                    <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                                    <span className="text-2xl font-bold text-foreground">
                                        {appointment.feedback.rating}/5
                                    </span>
                                </div>
                                {appointment.feedback.comment && (
                                    <p className="text-sm text-muted-foreground italic">
                                        &ldquo;{appointment.feedback.comment}&rdquo;
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Appointment Result */}
                <div className="space-y-6">
                    <Card className="border-2 shadow-lg sticky top-6">
                        <CardHeader className="border-b bg-gradient-to-r from-primary/5 to-primary/10">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Stethoscope className="h-5 w-5 text-primary" />
                                    <CardTitle className="text-xl font-bold">Kết quả khám</CardTitle>
                                </div>
                                {hasResult ? (
                                    <div className="flex items-center gap-1">
                                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                                        <span className="text-xs text-green-600 font-medium">Đã có</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1">
                                        <XCircle className="h-4 w-4 text-yellow-600" />
                                        <span className="text-xs text-yellow-600 font-medium">Chưa có</span>
                                    </div>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            {canEditResult ? (
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    {/* Diagnosis */}
                                    <div>
                                        <label
                                            htmlFor="diagnosis"
                                            className="block text-sm font-medium text-foreground mb-2"
                                        >
                                            Chẩn đoán <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            id="diagnosis"
                                            name="diagnosis"
                                            value={formData.diagnosis}
                                            onChange={handleChange}
                                            rows={3}
                                            className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none text-sm"
                                            placeholder="Nhập chẩn đoán..."
                                            required
                                        />
                                    </div>

                                    {/* Notes */}
                                    <div>
                                        <label
                                            htmlFor="notes"
                                            className="block text-sm font-medium text-foreground mb-2"
                                        >
                                            Ghi chú
                                        </label>
                                        <textarea
                                            id="notes"
                                            name="notes"
                                            value={formData.notes}
                                            onChange={handleChange}
                                            rows={3}
                                            className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none text-sm"
                                            placeholder="Nhập ghi chú của bác sĩ..."
                                        />
                                    </div>

                                    {/* Prescription */}
                                    <div>
                                        <label
                                            htmlFor="prescription"
                                            className="block text-sm font-medium text-foreground mb-2"
                                        >
                                            Đơn thuốc
                                        </label>
                                        <textarea
                                            id="prescription"
                                            name="prescription"
                                            value={formData.prescription}
                                            onChange={handleChange}
                                            rows={3}
                                            className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none text-sm"
                                            placeholder="Nhập đơn thuốc..."
                                        />
                                    </div>

                                    {/* Recommendations */}
                                    <div>
                                        <label
                                            htmlFor="recommendations"
                                            className="block text-sm font-medium text-foreground mb-2"
                                        >
                                            Khuyến nghị, lời dặn
                                        </label>
                                        <textarea
                                            id="recommendations"
                                            name="recommendations"
                                            value={formData.recommendations}
                                            onChange={handleChange}
                                            rows={3}
                                            className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none text-sm"
                                            placeholder="Nhập khuyến nghị, lời dặn..."
                                        />
                                    </div>

                                    {/* Submit Button */}
                                    <button
                                        type="submit"
                                        disabled={createOrUpdateMutation.isPending}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {createOrUpdateMutation.isPending ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Đang lưu...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="h-4 w-4" />
                                                {hasResult ? 'Cập nhật kết quả' : 'Lưu kết quả'}
                                            </>
                                        )}
                                    </button>
                                </form>
                            ) : (
                                <div className="text-center py-8">
                                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                    <p className="text-sm text-muted-foreground">
                                        Chỉ có thể điền kết quả khám khi lịch khám đang diễn ra hoặc đã hoàn thành.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
