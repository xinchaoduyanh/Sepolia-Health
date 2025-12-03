'use client'

import { useParams } from 'next/navigation'
import { ClinicEditForm } from '@/components/ClinicEditForm'

export default function ClinicDetailPage() {
    const params = useParams()
    const clinicId = params?.id ? parseInt(params.id as string) : 0

    if (!clinicId || isNaN(clinicId)) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-red-600 mb-2">ID không hợp lệ</h2>
                    <p className="text-muted-foreground">Vui lòng kiểm tra lại đường dẫn.</p>
                </div>
            </div>
        )
    }

    return <ClinicEditForm clinicId={clinicId} />
}

