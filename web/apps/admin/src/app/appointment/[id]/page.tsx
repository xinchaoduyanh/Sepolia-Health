'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

export default function AppointmentDetailPage() {
    const { id } = useParams()
    const router = useRouter()

    const [appointment, setAppointment] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!id) return

        async function loadAppointment() {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/receptionist/appointment/${id}`)
                const data = await res.json()
                setAppointment(data)
            } finally {
                setLoading(false)
            }
        }

        loadAppointment()
    }, [id])

    if (loading) {
        return <div className="flex min-h-screen bg-sky-500 text-white items-center justify-center">Đang tải...</div>
    }

    if (!appointment) {
        return (
            <div className="flex min-h-screen bg-sky-500 text-white items-center justify-center">
                Không tìm thấy lịch hẹn
            </div>
        )
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('vi-VN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        })
    }

    const sections = [
        {
            title: 'Khách hàng',
            icon: '👤',
            rows: [
                {
                    label: 'Khách hàng',
                    value: `${appointment.patientProfile?.firstName} ${appointment.patientProfile?.lastName}`,
                },
                { label: 'Lý do khám', value: appointment.notes || 'Không có ghi chú' },
            ],
        },
        {
            title: 'Bác sĩ',
            icon: '💼',
            rows: [
                {
                    label: 'Bác sĩ',
                    value: `${appointment.doctor?.firstName} ${appointment.doctor?.lastName}`,
                },
                {
                    label: 'Thời gian khám',
                    value: `${appointment.startTime} - ${appointment.endTime}, ${formatDate(appointment.date)}`,
                },
                {
                    label: 'Địa điểm',
                    value: appointment.clinic?.name || 'Bệnh viện',
                },
                { label: 'Chuyên khoa', value: appointment.service?.name },
                {
                    label: 'Phí khám tạm ứng',
                    value: `${appointment.service?.price.toLocaleString('vi-VN')} VNĐ`,
                    bold: true,
                },
            ],
        },
    ]

    return (
        <div className="min-h-screen bg-sky-500">
            {/* Header */}
            <div className="p-4 flex items-center justify-center text-white font-bold text-xl relative">
                <button className="absolute left-4" onClick={() => router.back()}>
                    ←
                </button>
                Thông tin đặt hẹn
            </div>

            {/* Content */}
            <div className="bg-gray-100 rounded-t-3xl p-6 min-h-[80vh]">
                {sections.map((section, idx) => (
                    <div key={idx} className="mb-6 bg-white p-5 rounded-xl shadow-sm">
                        {/* Section header */}
                        <div className="flex items-center mb-4">
                            <div className="h-10 w-10 mr-3 flex items-center justify-center rounded-lg bg-teal-50">
                                <span className="text-xl">{section.icon}</span>
                            </div>
                            <h2 className="text-lg font-bold text-gray-900">{section.title}</h2>
                        </div>

                        {/* Rows */}
                        <div className="ml-12 space-y-2">
                            {section.rows.map((row, idx) => (
                                <div key={idx} className="flex mb-2">
                                    <span className="w-32 text-sm text-gray-600">{row.label}:</span>
                                    <span className={`text-sm text-gray-900 ${row.bold ? 'font-bold' : ''}`}>
                                        {row.value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {/* Action buttons */}
                <div className="flex gap-4 mt-4">
                    <button className="flex-1 border-2 border-blue-600 text-blue-600 py-3 rounded-xl font-semibold bg-white">
                        Đổi lịch
                    </button>
                    <button className="flex-1 border-2 border-red-500 text-red-500 py-3 rounded-xl font-semibold bg-white">
                        Hủy lịch
                    </button>
                </div>
            </div>
        </div>
    )
}
