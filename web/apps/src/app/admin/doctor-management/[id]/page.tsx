'use client'

import { DoctorDetail } from '@/components/DoctorDetail'
import { useAdminAppointments, useDoctor, useDoctorSchedule } from '@/shared/hooks'
import { Spinner } from '@workspace/ui/components/Spinner'
import { useParams, useRouter } from 'next/navigation'

export default function DoctorDetailPage() {
    const params = useParams()
    const router = useRouter()
    const doctorId = parseInt(params.id as string)

    const { data: doctor, isLoading: isLoadingDoctor, error: errorDoctor } = useDoctor(doctorId)
    const { data: scheduleData, isLoading: isLoadingSchedule } = useDoctorSchedule(doctorId)
    const { data: appointmentsData, isLoading: isLoadingAppointments } = useAdminAppointments({ doctorId }, true)

    const handleBack = () => {
        router.push('/admin/doctor-management')
    }

    const handleEdit = (id: string) => {
        router.push(`/admin/doctor-management/edit/${id}`)
    }

    if (isLoadingDoctor || isLoadingSchedule || isLoadingAppointments) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Spinner />
            </div>
        )
    }

    if (errorDoctor || !doctor) {
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
        specialty: doctor.services?.map(s => s.name) || [],
        site: doctor.clinic?.name || 'Chưa xác định',
        cm: 'CM1', // TODO: Add clinic manager info
        status: doctor.status.toLowerCase(),
        avatar: doctor.avatar || null,
        doctorType: 'internal', // TODO: Add doctor type
        profileId: `DOC${doctor.id}`,
        uid: `UID${doctor.id}`,
        gender: 'male', // TODO: Add gender field
        joinDate: '2024-01-01', // TODO: Add join date
        lastActive: new Date().toISOString().split('T')[0],
        totalPatients: doctor.appointmentStats?.total || 0,
        totalAppointments: doctor.appointmentStats?.total || 0,
        completedAppointments: doctor.appointmentStats?.completed || 0,
        upcomingAppointments: doctor.appointmentStats?.upcoming || 0,
        rating: 4.5, // TODO: Add rating
        experience: `${new Date().getFullYear() - (doctor.experienceYears || new Date().getFullYear())} năm`,
        education: 'Đại học Y khoa', // TODO: Add education field
        certifications: ['Chứng chỉ hành nghề'], // TODO: Add certifications
        languages: ['Tiếng Việt'], // TODO: Add languages
        bio: doctor.description || 'Chưa có mô tả',
        schedule:
            scheduleData?.schedules?.map(s => ({
                day: ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'][s.dayOfWeek] || 'Thứ 2',
                time: `${s.startTime} - ${s.endTime}`,
                location: 'Phòng khám',
                id: s.id,
            })) || [],
        recentAppointments:
            appointmentsData?.appointments?.map(a => ({
                id: a.id.toString(),
                patient: a.patientName,
                serviceName: a.service.name,
                date: a.date,
                time: a.startTime,
                status: a.status.toLowerCase(),
            })) || [],
    }

    return (
        <DoctorDetail doctorId={doctorId.toString()} onBack={handleBack} onEdit={handleEdit} data={doctorDetailData} />
    )
}
