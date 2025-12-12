'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { formatDate, formatTime } from '@/util/datetime'
import { useAppointment, useCheckInAppointment, useCancelAppointment } from '@/shared/hooks'
import { queryKeys } from '@/shared/lib/query-keys'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@workspace/ui/components/Button'
import { Badge } from '@workspace/ui/components/Badge'
import { UpdateAppointmentDialog } from '@/components/UpdateAppointmentDialog'
import { ArrowLeft, Calendar, Clock, User, Phone, MapPin, Stethoscope, DollarSign, CheckCircle, XCircle, Edit } from 'lucide-react'
import { toast } from '@workspace/ui/components/Sonner'

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
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Đang tải...</p>
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

    const handleBack = async () => {
        await queryClient.invalidateQueries({ queryKey: queryKeys.admin.appointments.lists() })
        console.log('back')
        router.back()
    }
    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-6">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBack}
                    className="mb-4"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Quay lại
                </Button>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Chi tiết lịch hẹn</h1>
                        <p className="text-muted-foreground mt-1">Mã lịch hẹn: #{appointment.id}</p>
                    </div>
                    <Badge variant={getStatusVariant(appointment.status)}>
                        {getStatusLabel(appointment.status)}
                    </Badge>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Patient Information */}
                    <div className="bg-card rounded-lg border border-border p-6">
                        <div className="flex items-center mb-4">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                                <User className="h-5 w-5 text-primary" />
                            </div>
                            <h2 className="text-xl font-semibold text-foreground">Thông tin bệnh nhân</h2>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-start">
                                <span className="text-sm font-medium text-muted-foreground w-32">Họ và tên:</span>
                                <span className="text-sm text-foreground font-medium flex-1">
                                    {appointment.patientProfile
                                        ? `${appointment.patientProfile.firstName} ${appointment.patientProfile.lastName}`
                                        : 'N/A'}
                                </span>
                            </div>
                            <div className="flex items-start">
                                <span className="text-sm font-medium text-muted-foreground w-32">Số điện thoại:</span>
                                <span className="text-sm text-foreground flex-1 flex items-center">
                                    <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                                    {appointment.patientProfile?.phone || 'N/A'}
                                </span>
                            </div>
                            {appointment.notes && (
                                <div className="flex items-start pt-3 border-t border-border">
                                    <span className="text-sm font-medium text-muted-foreground w-32">Lý do khám:</span>
                                    <span className="text-sm text-foreground flex-1 italic">
                                        {appointment.notes}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Appointment Details */}
                    <div className="bg-card rounded-lg border border-border p-6">
                        <div className="flex items-center mb-4">
                            <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center mr-3">
                                <Calendar className="h-5 w-5 text-blue-500" />
                            </div>
                            <h2 className="text-xl font-semibold text-foreground">Chi tiết lịch hẹn</h2>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-start">
                                <span className="text-sm font-medium text-muted-foreground w-32">Bác sĩ:</span>
                                <span className="text-sm text-foreground font-medium flex-1 flex items-center">
                                    <Stethoscope className="h-4 w-4 mr-2 text-muted-foreground" />
                                    {appointment.doctor
                                        ? `BS. ${appointment.doctor.firstName} ${appointment.doctor.lastName}`
                                        : 'N/A'}
                                </span>
                            </div>
                            <div className="flex items-start">
                                <span className="text-sm font-medium text-muted-foreground w-32">Thời gian:</span>
                                <div className="flex-1">
                                    <div className="flex items-center text-sm text-foreground font-medium">
                                        <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                                        {formatTime(appointment.startTime)}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1 ml-6">
                                        {formatDate(appointment.startTime)}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <span className="text-sm font-medium text-muted-foreground w-32">Địa điểm:</span>
                                <span className="text-sm text-foreground flex-1 flex items-center">
                                    <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                                    {appointment.clinic?.name || 'Bệnh viện'}
                                </span>
                            </div>
                            <div className="flex items-start">
                                <span className="text-sm font-medium text-muted-foreground w-32">Chuyên khoa:</span>
                                <span className="text-sm text-foreground flex-1">
                                    {appointment.service?.name || 'N/A'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Price Card */}
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                        <div className="flex items-center mb-2">
                            <DollarSign className="h-5 w-5 mr-2" />
                            <span className="text-sm opacity-90">Phí khám</span>
                        </div>
                        <p className="text-3xl font-bold">
                            {appointment.service?.price
                                ? `${appointment.service.price.toLocaleString('vi-VN')} ₫`
                                : 'N/A'}
                        </p>
                        <p className="text-xs opacity-75 mt-2">
                            Thời lượng: {appointment.service?.duration || 0} phút
                        </p>
                    </div>

                    {/* Metadata Card */}
                    <div className="bg-card rounded-lg border border-border p-6">
                        <h3 className="text-sm font-semibold text-foreground mb-3">Thông tin khác</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Ngày tạo:</span>
                                <span className="text-foreground font-medium">
                                    {formatDate(appointment.createdAt)}
                                </span>
                            </div>
                            {appointment.billing && (
                                <div className="flex justify-between pt-2 border-t border-border">
                                    <span className="text-muted-foreground">Thanh toán:</span>
                                    <Badge variant={appointment.billing.status === 'PAID' ? 'default' : 'secondary'}>
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
                                className="w-full"
                                size="lg"
                                isDisabled={checkInMutation.isPending}
                            >
                                <CheckCircle className="h-5 w-5 mr-2" />
                                {checkInMutation.isPending ? 'Đang xử lý...' : 'Check-in'}
                            </Button>
                        )}
                        <Button
                            onClick={handleReschedule}
                            variant="outline"
                            className="w-full"
                            size="lg"
                            isDisabled={checkInMutation.isPending || cancelMutation.isPending}
                        >
                            <Edit className="h-5 w-5 mr-2" />
                            Đổi lịch
                        </Button>
                        <Button
                            onClick={handleCancel}
                            variant="destructive"
                            className="w-full"
                            size="lg"
                            isDisabled={checkInMutation.isPending || cancelMutation.isPending}
                        >
                            <XCircle className="h-5 w-5 mr-2" />
                            {cancelMutation.isPending ? 'Đang hủy...' : 'Hủy lịch'}
                        </Button>
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
