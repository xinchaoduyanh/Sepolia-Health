'use client'

import {
    useCreateOrUpdateAppointmentResult,
    useDoctorAppointment,
    useUploadResultFile,
    useDeleteResultFile,
    useSpeechToText,
} from '@/shared/hooks'
import { VoiceInputButton } from '@/shared/components/VoiceInputButton'
import { formatDate, formatTime } from '@/util/datetime'
import { Badge } from '@workspace/ui/components/Badge'
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/Card'
import { Skeleton } from '@workspace/ui/components/Skeleton'
import { toast } from '@workspace/ui/components/Sonner'
import {
    AlertCircle,
    ArrowLeft,
    Briefcase,
    Building2,
    Calendar,
    CheckCircle2,
    Clock,
    Download,
    FileText,
    Flag,
    History,
    Home,
    IdCard,
    Loader2,
    MapPin,
    Mic,
    Paperclip,
    Save,
    Star,
    Stethoscope,
    Trash2,
    Upload,
    User,
    XCircle,
} from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

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
    const uploadFileMutation = useUploadResultFile()
    const deleteFileMutation = useDeleteResultFile()

    const [formData, setFormData] = useState({
        diagnosis: '',
        notes: '',
        prescription: '',
        recommendations: '',
    })

    const [isEditing, setIsEditing] = useState(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [uploadError, setUploadError] = useState<string>('')
    const [activeVoiceField, setActiveVoiceField] = useState<string | null>(null)

    // Speech-to-Text hook
    const {
        transcript,
        isListening,
        isSupported: isSpeechSupported,
        startListening,
        stopListening,
        resetTranscript,
        error: speechError,
    } = useSpeechToText()

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

    const handleVoiceToggle = (fieldName: string) => {
        if (isListening && activeVoiceField === fieldName) {
            // Stop listening for this field
            stopListening()
            setActiveVoiceField(null)
        } else {
            // Start listening for this field
            if (isListening) {
                stopListening()
            }
            resetTranscript()
            setActiveVoiceField(fieldName)
            startListening()
        }
    }

    // Update form data when transcript changes
    useEffect(() => {
        if (transcript && activeVoiceField) {
            setFormData(prev => ({
                ...prev,
                [activeVoiceField]: prev[activeVoiceField as keyof typeof prev] + transcript,
            }))
            resetTranscript()
        }
    }, [transcript, activeVoiceField, resetTranscript])

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
        if (!allowedTypes.includes(file.type)) {
            setUploadError('Chỉ chấp nhận file ảnh (JPEG, PNG) hoặc PDF')
            setSelectedFile(null)
            return
        }

        // Validate file size (10MB)
        const maxSize = 10 * 1024 * 1024
        if (file.size > maxSize) {
            setUploadError('Kích thước file không được vượt quá 10MB')
            setSelectedFile(null)
            return
        }

        setUploadError('')
        setSelectedFile(file)
    }

    const handleFileUpload = async () => {
        if (!selectedFile || !appointment?.result) return

        try {
            await uploadFileMutation.mutateAsync({
                resultId: appointment.result.id,
                file: selectedFile,
                appointmentId: appointmentId,
            })

            // Success feedback
            toast.success({
                title: 'Thành công',
                description: 'Đã tải lên file thành công!',
            })
            setSelectedFile(null)
            setUploadError('')

            // Reset file input
            const fileInput = document.getElementById('file-upload') as HTMLInputElement
            if (fileInput) fileInput.value = ''
        } catch (error: any) {
            const errorMessage = error?.message || 'Lỗi khi upload file'
            setUploadError(errorMessage)
            toast.error({
                title: 'Lỗi',
                description: errorMessage,
            })
        }
    }

    const handleFileDelete = async (fileId: number) => {
        if (!appointment?.result) return

        if (!confirm('Bạn có chắc chắn muốn xóa file này?')) return

        try {
            await deleteFileMutation.mutateAsync({
                resultId: appointment.result.id,
                fileId: fileId,
                appointmentId: appointmentId,
            })
        } catch (error: any) {
            alert(error?.message || 'Lỗi khi xóa file')
        }
    }

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B'
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
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
                                        onClick={() =>
                                            router.push(`/doctor/patient/${appointment.patient?.id}/history`)
                                        }
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
                                            {appointment.patient.lastName} {appointment.patient.firstName}
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
                                    <div className="pt-2 border-t border-border grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                                                <IdCard className="h-3 w-3" /> CMND/CCCD
                                            </p>
                                            <p className="font-semibold text-foreground text-sm">
                                                {appointment.patient.idCardNumber || 'Chưa có'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                                                <Briefcase className="h-3 w-3" /> Nghề nghiệp
                                            </p>
                                            <p className="font-semibold text-foreground text-sm">
                                                {appointment.patient.occupation || 'Chưa có'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                                                <Flag className="h-3 w-3" /> Quốc tịch
                                            </p>
                                            <p className="font-semibold text-foreground text-sm">
                                                {appointment.patient.nationality || 'Chưa có'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                                                <User className="h-3 w-3" /> Dân tộc
                                            </p>
                                            <p className="font-semibold text-foreground text-sm">
                                                {appointment.patient.additionalInfo?.ethnicity || 'Chưa có'}
                                            </p>
                                        </div>
                                        <div className="col-span-2">
                                            <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                                                <MapPin className="h-3 w-3" /> Địa chỉ
                                            </p>
                                            <p className="font-semibold text-foreground text-sm">
                                                {appointment.patient.address || 'Chưa có'}
                                            </p>
                                        </div>
                                    </div>
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
                            (() => {
                                const now = new Date()
                                const appointmentTime = new Date(appointment.startTime)
                                const minutesBefore = Math.floor((appointmentTime.getTime() - now.getTime()) / 60000)
                                const isStartingSoon = minutesBefore <= 15 && minutesBefore >= -30 // 15 min before to 30 min after

                                return (
                                    <Card className="border-2 shadow-lg">
                                        <CardHeader className="border-b bg-gradient-to-r from-purple-500/5 to-purple-500/10">
                                            <div className="flex items-center gap-2">
                                                <Building2 className="h-5 w-5 text-purple-600" />
                                                <CardTitle className="text-lg font-bold">Liên kết trực tuyến</CardTitle>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-6 space-y-3">
                                            {!isStartingSoon && (
                                                <div className="flex items-start gap-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                                                    <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
                                                    <p className="text-sm text-yellow-800 dark:text-yellow-300">
                                                        Link cuộc họp sẽ khả dụng 15 phút trước giờ hẹn
                                                    </p>
                                                </div>
                                            )}
                                            <button
                                                onClick={() => {
                                                    if (isStartingSoon) {
                                                        if (appointment.hostUrl) {
                                                            window.open(appointment.hostUrl, '_blank')
                                                        }
                                                    } else {
                                                        alert('Vui lòng vào cuộc họp 15 phút trước giờ hẹn quy định.')
                                                    }
                                                }}
                                                disabled={!isStartingSoon}
                                                className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2 ${
                                                    isStartingSoon
                                                        ? 'bg-green-500 hover:bg-green-600'
                                                        : 'bg-gray-300 cursor-not-allowed'
                                                } text-white rounded-lg font-medium transition-colors`}
                                            >
                                                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                                </svg>
                                                Vào cuộc họp
                                            </button>
                                        </CardContent>
                                    </Card>
                                )
                            })()
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
                                        <div className="flex items-center justify-between mb-2">
                                            <label
                                                htmlFor="diagnosis"
                                                className="block text-sm font-medium text-foreground"
                                            >
                                                Chẩn đoán <span className="text-red-500">*</span>
                                            </label>
                                            <VoiceInputButton
                                                isListening={isListening && activeVoiceField === 'diagnosis'}
                                                isSupported={isSpeechSupported}
                                                onToggle={() => handleVoiceToggle('diagnosis')}
                                            />
                                        </div>
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
                                        {isListening && activeVoiceField === 'diagnosis' && (
                                            <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                                                <span className="inline-block w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
                                                Đang ghi âm...
                                            </p>
                                        )}
                                    </div>

                                    {/* Notes */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label
                                                htmlFor="notes"
                                                className="block text-sm font-medium text-foreground"
                                            >
                                                Ghi chú
                                            </label>
                                            <VoiceInputButton
                                                isListening={isListening && activeVoiceField === 'notes'}
                                                isSupported={isSpeechSupported}
                                                onToggle={() => handleVoiceToggle('notes')}
                                            />
                                        </div>
                                        <textarea
                                            id="notes"
                                            name="notes"
                                            value={formData.notes}
                                            onChange={handleChange}
                                            rows={3}
                                            className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none text-sm"
                                            placeholder="Nhập ghi chú của bác sĩ..."
                                        />
                                        {isListening && activeVoiceField === 'notes' && (
                                            <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                                                <span className="inline-block w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
                                                Đang ghi âm...
                                            </p>
                                        )}
                                    </div>

                                    {/* Prescription */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label
                                                htmlFor="prescription"
                                                className="block text-sm font-medium text-foreground"
                                            >
                                                Đơn thuốc
                                            </label>
                                            <VoiceInputButton
                                                isListening={isListening && activeVoiceField === 'prescription'}
                                                isSupported={isSpeechSupported}
                                                onToggle={() => handleVoiceToggle('prescription')}
                                            />
                                        </div>
                                        <textarea
                                            id="prescription"
                                            name="prescription"
                                            value={formData.prescription}
                                            onChange={handleChange}
                                            rows={3}
                                            className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none text-sm"
                                            placeholder="Nhập đơn thuốc..."
                                        />
                                        {isListening && activeVoiceField === 'prescription' && (
                                            <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                                                <span className="inline-block w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
                                                Đang ghi âm...
                                            </p>
                                        )}
                                    </div>

                                    {/* Recommendations */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label
                                                htmlFor="recommendations"
                                                className="block text-sm font-medium text-foreground"
                                            >
                                                Khuyến nghị, lời dặn
                                            </label>
                                            <VoiceInputButton
                                                isListening={isListening && activeVoiceField === 'recommendations'}
                                                isSupported={isSpeechSupported}
                                                onToggle={() => handleVoiceToggle('recommendations')}
                                            />
                                        </div>
                                        <textarea
                                            id="recommendations"
                                            name="recommendations"
                                            value={formData.recommendations}
                                            onChange={handleChange}
                                            rows={3}
                                            className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none text-sm"
                                            placeholder="Nhập khuyến nghị, lời dặn..."
                                        />
                                        {isListening && activeVoiceField === 'recommendations' && (
                                            <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                                                <span className="inline-block w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
                                                Đang ghi âm...
                                            </p>
                                        )}
                                    </div>

                                    {/* Speech Error Display */}
                                    {speechError && (
                                        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                                            <p className="text-sm text-red-600 dark:text-red-400">{speechError}</p>
                                        </div>
                                    )}
                                </form>
                            ) : (
                                <div className="text-center py-8">
                                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                    <p className="text-sm text-muted-foreground">
                                        Chỉ có thể điền kết quả khám khi lịch khám đang diễn ra hoặc đã hoàn thành.
                                    </p>
                                </div>
                            )}

                            {/* File Upload Section - Outside Form and canEditResult check */}
                            {hasResult && (
                                <div className="mt-6 pt-6 border-t border-border space-y-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Paperclip className="h-4 w-4 text-primary" />
                                        <h3 className="text-sm font-semibold text-foreground">File đính kèm</h3>
                                        <span className="text-xs text-muted-foreground">
                                            ({appointment.result?.files?.length || 0}/10)
                                        </span>
                                    </div>

                                    {/* File Input */}
                                    <div className="space-y-2">
                                        <div className="flex gap-2">
                                            <div className="flex-1 relative">
                                                <input
                                                    id="file-upload"
                                                    type="file"
                                                    accept=".jpg,.jpeg,.png,.pdf"
                                                    onChange={handleFileSelect}
                                                    className="hidden"
                                                    disabled={
                                                        uploadFileMutation.isPending ||
                                                        (appointment.result?.files?.length || 0) >= 10
                                                    }
                                                />
                                                <label
                                                    htmlFor="file-upload"
                                                    className="flex items-center justify-between w-full px-4 py-2 text-sm border border-border rounded-lg bg-background hover:bg-muted/50 cursor-pointer transition-colors"
                                                >
                                                    <span className="text-muted-foreground truncate">
                                                        {selectedFile ? selectedFile.name : 'Chọn file...'}
                                                    </span>
                                                    <span className="ml-2 px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-md whitespace-nowrap">
                                                        Chọn file
                                                    </span>
                                                </label>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleFileUpload}
                                                disabled={
                                                    !selectedFile ||
                                                    uploadFileMutation.isPending ||
                                                    (appointment.result?.files?.length || 0) >= 10
                                                }
                                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                            >
                                                {uploadFileMutation.isPending ? (
                                                    <>
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                        Đang tải...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Upload className="h-4 w-4" />
                                                        Tải lên
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Chấp nhận: JPEG, PNG, PDF (tối đa 10MB)
                                        </p>
                                        {uploadError && (
                                            <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                                                <p className="text-xs text-red-600 dark:text-red-400">{uploadError}</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Files List */}
                                    {appointment.result?.files && appointment.result.files.length > 0 && (
                                        <div className="space-y-2">
                                            <p className="text-xs font-medium text-muted-foreground">Danh sách file:</p>
                                            <div className="space-y-2">
                                                {appointment.result.files.map(file => (
                                                    <div
                                                        key={file.id}
                                                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border hover:bg-muted/70 transition-colors"
                                                    >
                                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                                            <div className="p-2 bg-primary/10 rounded-lg">
                                                                {file.fileType.startsWith('image/') ? (
                                                                    <FileText className="h-4 w-4 text-primary" />
                                                                ) : (
                                                                    <FileText className="h-4 w-4 text-red-600" />
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-medium text-foreground truncate">
                                                                    {file.fileName}
                                                                </p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {formatFileSize(file.fileSize)} •{' '}
                                                                    {new Date(file.createdAt).toLocaleDateString(
                                                                        'vi-VN',
                                                                    )}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <a
                                                                href={file.fileUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="p-2 hover:bg-primary/10 rounded-lg transition-colors"
                                                                title="Tải xuống"
                                                            >
                                                                <Download className="h-4 w-4 text-primary" />
                                                            </a>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleFileDelete(file.id)}
                                                                disabled={deleteFileMutation.isPending}
                                                                className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                                                                title="Xóa file"
                                                            >
                                                                {deleteFileMutation.isPending ? (
                                                                    <Loader2 className="h-4 w-4 text-red-600 animate-spin" />
                                                                ) : (
                                                                    <Trash2 className="h-4 w-4 text-red-600" />
                                                                )}
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Submit Button - Moved here after file section */}
                                    <button
                                        onClick={handleSubmit}
                                        disabled={createOrUpdateMutation.isPending}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4"
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
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
