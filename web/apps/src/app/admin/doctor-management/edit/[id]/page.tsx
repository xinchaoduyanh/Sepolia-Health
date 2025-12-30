'use client'

import { useParams, useRouter } from 'next/navigation'
import { DoctorEditForm } from '@/components/DoctorEditForm'
import { useDoctor } from '@/shared/hooks/useDoctors'
import { Spinner } from '@workspace/ui/components/Spinner'

export default function DoctorEditPage() {
    const params = useParams()
    const router = useRouter()
    const doctorId = parseInt(params.id as string)

    const { data: doctor, isLoading, error } = useDoctor(doctorId)

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

    return <DoctorEditForm doctor={doctor} doctorId={doctorId} />
}
