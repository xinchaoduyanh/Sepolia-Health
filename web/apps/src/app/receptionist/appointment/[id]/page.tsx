'use client'

import { UpdateAppointmentDialog } from '@/components/UpdateAppointmentDialog'
import { useAppointment, useCancelAppointment, useCheckInAppointment } from '@/shared/hooks'
import { queryKeys } from '@/shared/lib/query-keys'
import { formatDate, formatTime } from '@/util/datetime'
import { useQueryClient } from '@tanstack/react-query'
import { Badge } from '@workspace/ui/components/Badge'
import { Button } from '@workspace/ui/components/Button'
import { Skeleton } from '@workspace/ui/components/Skeleton'
import { toast } from '@workspace/ui/components/Sonner'
import {
    ArrowLeft,
    Briefcase,
    Calendar,
    CheckCircle,
    Clock,
    CreditCard,
    DollarSign,
    Edit,
    MapPin,
    Phone,
    Stethoscope,
    User,
    XCircle,
} from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'

const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status.toUpperCase()) {
        case 'UPCOMING':
            return 'default' // Blue for upcoming
        case 'ON_GOING':
            return 'outline' // Green outline for ongoing
        case 'COMPLETED':
            return 'outline' // Green outline for completed
        case 'CANCELLED':
            return 'secondary' // Gray for cancelled (inactive)
        default:
            return 'default'
    }
}

const getStatusLabel = (status: string): string => {
    switch (status.toUpperCase()) {
        case 'UPCOMING':
            return 'Sắp tới'
        case 'ON_GOING':
            return 'Đang diễn ra'
        case 'COMPLETED':
            return 'Hoàn thành'
        case 'CANCELLED':
            return 'Đã hủy'
        default:
            return status
    }
}

export default function AppointmentDetailPage() {
    const { id } = useParams()
    const router = useRouter()
    const queryClient = useQueryClient()

    const { data: appointment, isLoading: loading, refetch } = useAppointment(Number(id), !!id)
    const checkInMutation = useCheckInAppointment()
    const cancelMutation = useCancelAppointment()
    const [isRescheduleOpen, setIsRescheduleOpen] = useState(false)

    const handleCheckIn = async () => {
        try {
            await checkInMutation.mutateAsync(Number(id))
            toast.success({
                title: 'Thành công',
                description: 'Check-in thành công!',
            })
        } catch (error: any) {
            toast.error({
                title: 'Lỗi',
                description: error?.response?.data?.message || 'Có lỗi xảy ra khi check-in',
            })
        }
    }

    const handleReschedule = () => {
        setIsRescheduleOpen(true)
    }

    const handleCancel = async () => {
        if (!confirm('Bạn có chắc chắn muốn hủy lịch hẹn này?')) {
            return
        }

        try {
            await cancelMutation.mutateAsync(Number(id))
            toast.success({
                title: 'Thành công',
                description: 'Đã hủy lịch hẹn thành công',
            })
            router.push('/receptionist/appointment')
        } catch (error: any) {
            toast.error({
                title: 'Lỗi',
                description: error?.response?.data?.message || 'Có lỗi xảy ra khi hủy lịch',
            })
        }
    }

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                {/* Header Skeleton */}
                <div className="mb-6">
                    <Skeleton className="h-8 w-24 mb-4" />
                    <div className="flex items-center justify-between">
                        <div>
                            <Skeleton className="h-10 w-64 mb-2" />
                            <Skeleton className="h-4 w-32" />
                        </div>
                        <Skeleton className="h-6 w-24" />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <Skeleton className="h-48 w-full rounded-lg" />
                        <Skeleton className="h-48 w-full rounded-lg" />
                    </div>
                    <div className="space-y-6">
                        <Skeleton className="h-32 w-full rounded-lg" />
                        <Skeleton className="h-32 w-full rounded-lg" />
                        <div className="space-y-3">
                            <Skeleton className="h-12 w-full rounded-lg" />
                            <Skeleton className="h-12 w-full rounded-lg" />
                            <Skeleton className="h-12 w-full rounded-lg" />
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (!appointment) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col items-center justify-center h-64 text-center">
                    <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">Không tìm thấy lịch hẹn</h3>
                    <p className="text-sm text-muted-foreground mb-4">Lịch hẹn không tồn tại hoặc đã bị xóa</p>
                    <Button onClick={() => router.back()} variant="outline">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Quay lại
                    </Button>
                </div>
            </div>
        )
    }

    const canCheckIn = appointment.status.toUpperCase() === 'UPCOMING'
    const isFinished =
        appointment.status.toUpperCase() === 'CANCELLED' || appointment.status.toUpperCase() === 'COMPLETED'

    const handleBack = async () => {
        await queryClient.invalidateQueries({ queryKey: queryKeys.admin.appointments.lists() })
        console.log('back')
        router.back()
    }
    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-8">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBack}
                    className="mb-4 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Quay lại
                </Button>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                            Chi tiết lịch hẹn
                        </h1>
                        <p className="text-slate-400 mt-1 flex items-center gap-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 font-mono text-xs text-emerald-600 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-800/30">
                                #{appointment.id}
                            </span>
                        </p>
                    </div>
                    <Badge
                        variant={getStatusVariant(appointment.status)}
                        className="px-6 py-2.5 text-[13px] font-bold uppercase tracking-wider shadow-xl ring-2 ring-white/20 animate-in fade-in zoom-in duration-500"
                        style={{
                            backgroundColor:
                                appointment.status.toUpperCase() === 'COMPLETED'
                                    ? '#10b981' // emerald-500
                                    : appointment.status.toUpperCase() === 'CANCELLED'
                                      ? '#f43f5e' // rose-500
                                      : appointment.status.toUpperCase() === 'ON_GOING'
                                        ? '#0ea5e9' // sky-500
                                        : '#3b82f6', // blue-500
                            color: 'white',
                            border: 'none',
                        }}
                    >
                        {getStatusLabel(appointment.status)}
                    </Badge>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Patient Information */}
                    <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-200/50 dark:border-slate-700/50 p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center mb-5">
                            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mr-4 shadow-lg shadow-emerald-200/50 dark:shadow-emerald-900/30">
                                <User className="h-5 w-5 text-white" />
                            </div>
                            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                                Thông tin bệnh nhân
                            </h2>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center p-3 rounded-xl bg-gradient-to-r from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-700/30 border border-slate-100/50 dark:border-slate-700/30">
                                <div className="flex-shrink-0 mr-4">
                                    {appointment.patientProfile?.avatar ? (
                                        <img
                                            src={appointment.patientProfile.avatar}
                                            alt="Patient"
                                            className="h-12 w-12 rounded-full object-cover ring-2 ring-emerald-200 dark:ring-emerald-700"
                                        />
                                    ) : (
                                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-semibold shadow-sm">
                                            {appointment.patientProfile
                                                ? `${appointment.patientProfile.lastName?.charAt(0) || ''}${appointment.patientProfile.firstName?.charAt(0) || ''}`
                                                : '?'}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-slate-400 dark:text-slate-500">Họ và tên</p>
                                    <p className="font-semibold text-slate-800 dark:text-slate-100">
                                        {appointment.patientProfile
                                            ? `${appointment.patientProfile.lastName} ${appointment.patientProfile.firstName}`
                                            : 'N/A'}
                                    </p>
                                </div>
                                {appointment.patientProfile?.phone && (
                                    <Badge
                                        variant="outline"
                                        className="text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800"
                                    >
                                        <Phone className="h-3 w-3 mr-1" />
                                        {appointment.patientProfile.phone}
                                    </Badge>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/50">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-pink-50 dark:bg-pink-900/20 rounded-lg">
                                        <Calendar className="h-4 w-4 text-pink-500" />
                                    </div>
                                    <div>
                                        <p className="text-[11px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                            Ngày sinh
                                        </p>
                                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                            {appointment.patientProfile?.dateOfBirth
                                                ? formatDate(appointment.patientProfile.dateOfBirth)
                                                : 'N/A'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                        <User className="h-4 w-4 text-blue-500" />
                                    </div>
                                    <div>
                                        <p className="text-[11px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                            Giới tính
                                        </p>
                                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                            {appointment.patientProfile?.gender === 'MALE'
                                                ? 'Nam'
                                                : appointment.patientProfile?.gender === 'FEMALE'
                                                  ? 'Nữ'
                                                  : 'Khác'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-violet-50 dark:bg-violet-900/20 rounded-lg">
                                        <CreditCard className="h-4 w-4 text-violet-500" />
                                    </div>
                                    <div>
                                        <p className="text-[11px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                            CMND/CCCD
                                        </p>
                                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                            {appointment.patientProfile?.idCardNumber || 'N/A'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                                        <MapPin className="h-4 w-4 text-amber-500" />
                                    </div>
                                    <div>
                                        <p className="text-[11px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                            Địa chỉ
                                        </p>
                                        <p
                                            className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate max-w-[200px]"
                                            title={appointment.patientProfile?.address || ''}
                                        >
                                            {appointment.patientProfile?.address || 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            {appointment.notes && (
                                <div className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200/50 dark:border-amber-800/30">
                                    <p className="text-sm text-amber-600 dark:text-amber-400 font-medium mb-1">
                                        Lý do khám
                                    </p>
                                    <p className="text-sm text-slate-600 dark:text-slate-300 italic">
                                        {appointment.notes}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Appointment Details */}
                    <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-200/50 dark:border-slate-700/50 p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center mb-5">
                            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center mr-4 shadow-lg shadow-sky-200/50 dark:shadow-sky-900/30">
                                <Calendar className="h-5 w-5 text-white" />
                            </div>
                            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                                Chi tiết lịch hẹn
                            </h2>
                        </div>
                        <div className="space-y-4">
                            {/* Doctor */}
                            <div className="flex items-center p-3 rounded-xl bg-gradient-to-r from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-700/30 border border-slate-100/50 dark:border-slate-700/30">
                                <div className="flex-shrink-0 mr-4">
                                    {appointment.doctor?.avatar ? (
                                        <img
                                            src={appointment.doctor.avatar}
                                            alt="Doctor"
                                            className="h-12 w-12 rounded-full object-cover ring-2 ring-sky-200 dark:ring-sky-700"
                                        />
                                    ) : (
                                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center text-white font-semibold shadow-sm">
                                            {appointment.doctor
                                                ? `${appointment.doctor.lastName?.charAt(0) || ''}${appointment.doctor.firstName?.charAt(0) || ''}`
                                                : '?'}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-slate-400 dark:text-slate-500">Bác sĩ</p>
                                    <p className="font-semibold text-slate-800 dark:text-slate-100">
                                        {appointment.doctor
                                            ? `BS. ${appointment.doctor.lastName} ${appointment.doctor.firstName}`
                                            : 'N/A'}
                                    </p>
                                    {appointment.doctor?.specialties && appointment.doctor.specialties.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {appointment.doctor.specialties.map((s, idx) => (
                                                <Badge
                                                    key={idx}
                                                    variant="secondary"
                                                    className="text-[9px] px-1.5 py-0 bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 border-sky-100 dark:border-sky-800/30"
                                                >
                                                    {s.specialty.name}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <Stethoscope className="h-5 w-5 text-sky-400" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-100 dark:border-slate-700/50">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                                        <Briefcase className="h-4 w-4 text-indigo-500" />
                                    </div>
                                    <div>
                                        <p className="text-[11px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                            Kinh nghiệm
                                        </p>
                                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                            {appointment.doctor?.experience
                                                ? `${new Date().getFullYear() - parseInt(appointment.doctor.experience)} năm kinh nghiệm`
                                                : 'N/A'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                                        <Phone className="h-4 w-4 text-emerald-500" />
                                    </div>
                                    <div>
                                        <p className="text-[11px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                            Liên hệ
                                        </p>
                                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                            {appointment.doctor?.contactInfo || 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            {/* Time */}
                            <div className="flex items-center p-3 rounded-xl bg-gradient-to-r from-emerald-50/50 to-teal-50/50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-100/50 dark:border-emerald-800/30">
                                <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mr-4 shadow-sm">
                                    <Clock className="h-4 w-4 text-white" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-slate-400 dark:text-slate-500">Thời gian</p>
                                    <p className="font-bold text-emerald-600 dark:text-emerald-400 text-lg">
                                        {formatTime(appointment.startTime)}
                                    </p>
                                    <p className="text-xs text-teal-500 dark:text-teal-400">
                                        {formatDate(appointment.startTime)}
                                    </p>
                                </div>
                            </div>
                            {/* Location */}
                            <div className="flex items-center p-3 rounded-xl bg-gradient-to-r from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-700/30 border border-slate-100/50 dark:border-slate-700/30">
                                <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center mr-4">
                                    <MapPin className="h-4 w-4 text-rose-500" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-slate-400 dark:text-slate-500">Địa điểm</p>
                                    <p className="font-medium text-slate-700 dark:text-slate-200">
                                        {appointment.clinic?.name || 'Bệnh viện'}
                                    </p>
                                </div>
                            </div>
                            {/* Service */}
                            <div className="flex items-center p-3 rounded-xl bg-gradient-to-r from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-700/30 border border-slate-100/50 dark:border-slate-700/30">
                                <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center mr-4">
                                    <Stethoscope className="h-4 w-4 text-violet-500" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-slate-400 dark:text-slate-500">Chuyên khoa / Dịch vụ</p>
                                    <p className="font-semibold text-violet-600 dark:text-violet-400">
                                        {appointment.service?.name || 'N/A'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-5">
                    {/* Price Card */}
                    <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-2xl p-6 text-white shadow-lg shadow-emerald-200/50 dark:shadow-emerald-900/30">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                    <DollarSign className="h-4 w-4" />
                                </div>
                                <span className="text-sm font-medium text-white/90">Phí khám</span>
                            </div>
                            <p className="text-3xl font-bold tracking-tight">
                                {appointment.service?.price
                                    ? `${appointment.service.price.toLocaleString('vi-VN')} ₫`
                                    : 'N/A'}
                            </p>
                            <p className="text-xs text-white/70 mt-2 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Thời lượng: {appointment.service?.duration || 0} phút
                            </p>
                        </div>
                    </div>

                    {/* Metadata Card */}
                    <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-200/50 dark:border-slate-700/50 p-5 shadow-sm">
                        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                            Thông tin khác
                        </h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between items-center p-2 rounded-lg bg-slate-50/50 dark:bg-slate-700/30">
                                <span className="text-slate-500 dark:text-slate-400">Ngày tạo</span>
                                <span className="font-medium text-slate-700 dark:text-slate-200">
                                    {formatDate(appointment.createdAt)}
                                </span>
                            </div>
                            {appointment.billing && (
                                <div className="flex justify-between items-center p-2 rounded-lg bg-slate-50/50 dark:bg-slate-700/30">
                                    <span className="text-slate-500 dark:text-slate-400">Thanh toán</span>
                                    <Badge
                                        variant={appointment.billing.status === 'PAID' ? 'success' : 'warning'}
                                        className="text-[10px]"
                                    >
                                        {appointment.billing.status === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                                    </Badge>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3">
                        {canCheckIn && (
                            <Button
                                onClick={handleCheckIn}
                                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-200/50 dark:shadow-emerald-900/30 transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5"
                                size="lg"
                                isDisabled={checkInMutation.isPending}
                            >
                                <CheckCircle className="h-5 w-5 mr-2" />
                                {checkInMutation.isPending ? 'Đang xử lý...' : 'Check-in'}
                            </Button>
                        )}
                        {!isFinished && (
                            <>
                                <Button
                                    onClick={handleReschedule}
                                    variant="outline"
                                    className="w-full border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all duration-200"
                                    size="lg"
                                    isDisabled={checkInMutation.isPending || cancelMutation.isPending}
                                >
                                    <Edit className="h-5 w-5 mr-2 text-slate-500" />
                                    Đổi lịch
                                </Button>
                                <Button
                                    onClick={handleCancel}
                                    variant="destructive"
                                    className="w-full bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600 shadow-lg shadow-rose-200/50 dark:shadow-rose-900/30 transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5"
                                    size="lg"
                                    isDisabled={checkInMutation.isPending || cancelMutation.isPending}
                                >
                                    <XCircle className="h-5 w-5 mr-2" />
                                    {cancelMutation.isPending ? 'Đang hủy...' : 'Hủy lịch'}
                                </Button>
                            </>
                        )}
                    </div>
                </div>
                {/* Reschedule Dialog */}
                {appointment && (
                    <UpdateAppointmentDialog
                        open={isRescheduleOpen}
                        onOpenChange={setIsRescheduleOpen}
                        appointment={appointment}
                        onSuccess={() => refetch()}
                    />
                )}
            </div>
        </div>
    )
}
