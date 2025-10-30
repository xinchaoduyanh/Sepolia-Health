'use client'

import { useParams, useRouter } from 'next/navigation'
import { DoctorDetail } from '@/components/DoctorDetail'
import { useDoctor } from '@/shared/hooks/useDoctors'
import { Spinner } from '@workspace/ui/components/Spinner'

export default function DoctorDetailPage() {
    const params = useParams()
    const router = useRouter()
    const doctorId = parseInt(params.id as string)

    const { data: doctor, isLoading, error } = useDoctor(doctorId)

    const handleBack = () => {
        router.push('/dashboard/doctor-management')
    }

    const handleEdit = (id: string) => {
        // TODO: Navigate to edit page
        console.log('Edit doctor:', id)
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Spinner />
            </div>
        )
    }

    if (error || !doctor) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-red-600 mb-2">Lỗi tải dữ liệu</h2>
                    <p className="text-muted-foreground">Không thể tải thông tin bác sĩ. Vui lòng thử lại sau.</p>
                </div>
            </div>
        )
    }

    // Transform API data to component format
    const doctorDetailData = {
        id: doctor.id.toString(),
        fullName: doctor.fullName,
        email: doctor.email,
        phone: doctor.phone || '',
        specialty: doctor.services.map(s => s.name) || [],
        site: doctor.clinic?.name || 'Chưa xác định',
        cm: 'CM1', // TODO: Add clinic manager info
        status: doctor.status.toLowerCase(),
        avatar: null, // TODO: Add avatar support
        doctorType: 'internal', // TODO: Add doctor type
        profileId: `DOC${doctor.id}`,
        uid: `UID${doctor.id}`,
        gender: 'male', // TODO: Add gender field
        joinDate: '2024-01-01', // TODO: Add join date
        lastActive: new Date().toISOString().split('T')[0],
        totalPatients: doctor.appointmentStats.total, // Use total appointments as proxy for patients
        totalAppointments: doctor.appointmentStats.total,
        rating: 4.5, // TODO: Add rating
        experience: `${doctor.experienceYears} năm`,
        education: 'Đại học Y khoa', // TODO: Add education field
        certifications: ['Chứng chỉ hành nghề'], // TODO: Add certifications
        languages: ['Tiếng Việt'], // TODO: Add languages
        bio: doctor.description || 'Chưa có mô tả',
        schedule: [], // TODO: Add schedule data
        recentAppointments: [], // TODO: Add recent appointments
    }

    return (
        <DoctorDetail doctorId={doctorId.toString()} onBack={handleBack} onEdit={handleEdit} data={doctorDetailData} />
    )
}
