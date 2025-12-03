'use client'

import { useParams, useRouter } from 'next/navigation'
import { formatDate, formatTime } from '@/util/datetime'
import { getStatusBadge } from '@/util/appointment'
import { useAppointment } from '@/shared/hooks'

export default function AppointmentDetailPage() {
    const { id } = useParams()
    const router = useRouter()

    const { data: appointment, isLoading: loading } = useAppointment(Number(id), !!id)

    if (loading) {
        return (
            <div className="flex min-h-screen bg-gradient-to-br from-sky-500 to-sky-600 items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                    <p className="text-white font-medium">Đang tải...</p>
                </div>
            </div>
        )
    }

    if (!appointment) {
        return (
            <div className="flex min-h-screen bg-gradient-to-br from-sky-500 to-sky-600 items-center justify-center">
                <div className="text-center bg-white/10 backdrop-blur-sm rounded-2xl p-8">
                    <div className="text-6xl mb-4">📋</div>
                    <p className="text-white text-lg font-medium">Không tìm thấy lịch hẹn</p>
                    <button
                        onClick={() => router.back()}
                        className="mt-4 px-6 py-2 bg-white text-sky-600 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                    >
                        Quay lại
                    </button>
                </div>
            </div>
        )
    }

    const statusBadge = getStatusBadge(appointment.status)

    return (
        <div className="min-h-screen bg-gradient-to-br from-sky-500 to-sky-600">
            {/* Header with gradient */}
            <div className="relative">
                <div className="max-w-4xl mx-auto px-6 py-6">
                    <div className="flex items-center justify-between text-white">
                        <button
                            className="flex items-center justify-center w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all"
                            onClick={() => router.back()}
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <h1 className="text-xl font-bold">Thông tin đặt hẹn</h1>
                        <div className="w-10"></div>
                    </div>

                    {/* Status Badge */}
                    <div className="mt-4">
                        <span
                            className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold border ${statusBadge.className}`}
                        >
                            <span className="w-2 h-2 rounded-full bg-current mr-2"></span>
                            {statusBadge.label}
                        </span>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="bg-gray-100 rounded-t-3xl min-h-[calc(100vh-180px)]">
                <div className="max-w-4xl mx-auto px-6 py-6">
                    {/* Appointment ID Card */}
                    <div className="mb-6 bg-gradient-to-r from-sky-500 to-blue-500 p-6 rounded-2xl shadow-lg text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm opacity-90 mb-1">Mã lịch hẹn</p>
                                <p className="text-2xl font-bold">#{appointment.id}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm opacity-90 mb-1">Ngày tạo</p>
                                <p className="text-sm font-medium">{formatDate(appointment.createdAt)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Patient Info */}
                    <div className="mb-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex items-center mb-5">
                            <div className="h-12 w-12 mr-4 flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-md">
                                <span className="text-2xl">👤</span>
                            </div>
                            <h2 className="text-lg font-bold text-gray-900">Thông tin khách hàng</h2>
                        </div>
                        <div className="space-y-4 pl-16">
                            <div className="flex items-start">
                                <span className="w-36 text-sm font-medium text-gray-500">Họ và tên</span>
                                <span className="flex-1 text-sm text-gray-900 font-medium">
                                    {appointment.patientProfile
                                        ? `${appointment.patientProfile.firstName} ${appointment.patientProfile.lastName}`
                                        : 'N/A'}
                                </span>
                            </div>
                            <div className="flex items-start">
                                <span className="w-36 text-sm font-medium text-gray-500">Số điện thoại</span>
                                <span className="flex-1 text-sm text-gray-900">
                                    {appointment.patientProfile?.phone || 'N/A'}
                                </span>
                            </div>
                            <div className="flex items-start">
                                <span className="w-36 text-sm font-medium text-gray-500">Lý do khám</span>
                                <span className="flex-1 text-sm text-gray-900 italic">
                                    {appointment.notes || 'Không có ghi chú'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Appointment Details */}
                    <div className="mb-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex items-center mb-5">
                            <div className="h-12 w-12 mr-4 flex items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 shadow-md">
                                <span className="text-2xl">💼</span>
                            </div>
                            <h2 className="text-lg font-bold text-gray-900">Chi tiết lịch hẹn</h2>
                        </div>
                        <div className="space-y-4 pl-16">
                            <div className="flex items-start">
                                <span className="w-36 text-sm font-medium text-gray-500">Bác sĩ</span>
                                <span className="flex-1 text-sm text-gray-900 font-medium">
                                    {appointment.doctor
                                        ? `BS. ${appointment.doctor.firstName} ${appointment.doctor.lastName}`
                                        : 'N/A'}
                                </span>
                            </div>
                            <div className="flex items-start">
                                <span className="w-36 text-sm font-medium text-gray-500">Thời gian khám</span>
                                <div className="flex-1">
                                    <p className="text-sm text-gray-900 font-medium">
                                        {formatTime(appointment.startTime)}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">{formatDate(appointment.startTime)}</p>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <span className="w-36 text-sm font-medium text-gray-500">Địa điểm</span>
                                <span className="flex-1 text-sm text-gray-900">
                                    {appointment.clinic?.name || 'Bệnh viện'}
                                </span>
                            </div>
                            <div className="flex items-start">
                                <span className="w-36 text-sm font-medium text-gray-500">Chuyên khoa</span>
                                <span className="flex-1 text-sm text-gray-900">
                                    {appointment.service?.name || 'N/A'}
                                </span>
                            </div>
                            <div className="flex items-start pt-3 border-t border-gray-100">
                                <span className="w-36 text-sm font-medium text-gray-500">Phí khám</span>
                                <span className="flex-1 text-lg font-bold text-sky-600">
                                    {appointment.service?.price
                                        ? `${appointment.service.price.toLocaleString('vi-VN')} VNĐ`
                                        : 'N/A'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-4 mt-8">
                        <button className="flex-1 flex items-center justify-center gap-2 border-2 border-blue-600 text-blue-600 py-3.5 rounded-xl font-semibold bg-white hover:bg-blue-50 transition-colors shadow-sm">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                            </svg>
                            Đổi lịch
                        </button>
                        <button className="flex-1 flex items-center justify-center gap-2 border-2 border-red-500 text-red-500 py-3.5 rounded-xl font-semibold bg-white hover:bg-red-50 transition-colors shadow-sm">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                            Hủy lịch
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
