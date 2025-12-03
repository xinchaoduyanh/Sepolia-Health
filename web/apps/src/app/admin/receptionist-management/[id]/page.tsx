'use client'

import { useParams, useRouter } from 'next/navigation'
import { ReceptionistDetail } from '@/components/ReceptionistDetail'
import { useReceptionist } from '@/shared/hooks/useReceptionists'
import { Spinner } from '@workspace/ui/components/Spinner'

export default function ReceptionistDetailPage() {
    const params = useParams()
    const router = useRouter()
    const receptionistId = parseInt(params.id as string)

    const { data: receptionist, isLoading, error } = useReceptionist(receptionistId)

    const handleBack = () => {
        router.push('/dashboard/admin/receptionist-management')
    }

    const handleEdit = (id: string) => {
        // TODO: Navigate to edit page
        console.log('Edit receptionist:', id)
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Spinner />
            </div>
        )
    }

    if (error || !receptionist) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-red-600 mb-2">Lỗi tải dữ liệu</h2>
                    <p className="text-muted-foreground">Không thể tải thông tin lễ tân. Vui lòng thử lại sau.</p>
                </div>
            </div>
        )
    }

    // Transform API data to component format
    const receptionistDetailData = {
        id: receptionist.id.toString(),
        fullName: receptionist.fullName,
        email: receptionist.email,
        phone: receptionist.phone || '',
        department: 'Lễ tân',
        site: 'Chưa xác định', // TODO: Add clinic info
        cm: 'CM1', // TODO: Add clinic manager info
        status: receptionist.status.toLowerCase(),
        avatar: null, // TODO: Add avatar support
        receptionistType: 'internal', // TODO: Add receptionist type
        profileId: `REC${receptionist.id}`,
        uid: `UID${receptionist.id}`,
        gender: 'female', // TODO: Add gender field
        joinDate: '2024-01-01', // TODO: Add join date
        lastActive: new Date().toISOString().split('T')[0],
        totalHandled: 0, // TODO: Add handled count
        totalAppointments: 0, // TODO: Add appointment count
        rating: 4.5, // TODO: Add rating
        experience: '3 năm', // TODO: Add experience field
        education: 'Cao đẳng Quản trị kinh doanh', // TODO: Add education field
        certifications: ['Chứng chỉ Lễ tân'], // TODO: Add certifications
        languages: ['Tiếng Việt'], // TODO: Add languages
        bio: 'Lễ tân chuyên nghiệp với nhiều năm kinh nghiệm trong phục vụ khách hàng.', // TODO: Add bio field
        schedule: [], // TODO: Add schedule data
        recentActivities: [], // TODO: Add recent activities
    }

    return (
        <ReceptionistDetail
            receptionistId={receptionistId.toString()}
            onBack={handleBack}
            onEdit={handleEdit}
            data={receptionistDetailData}
        />
    )
}
