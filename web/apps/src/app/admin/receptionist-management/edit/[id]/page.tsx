'use client'

import { useParams, useRouter } from 'next/navigation'
import { ReceptionistEditForm } from '@/components/ReceptionistEditForm'
import { useReceptionist } from '@/shared/hooks/useReceptionists'
import { Spinner } from '@workspace/ui/components/Spinner'

export default function ReceptionistEditPage() {
    const params = useParams()
    const router = useRouter()
    const receptionistId = parseInt(params.id as string)

    const { data: receptionist, isLoading, error } = useReceptionist(receptionistId)

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

    return <ReceptionistEditForm receptionist={receptionist} receptionistId={receptionistId} />
}
