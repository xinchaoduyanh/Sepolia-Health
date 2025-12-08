'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function DoctorManagementPage() {
    const router = useRouter()

    useEffect(() => {
        router.replace('/admin/doctor-management/doctor-list')
    }, [router])

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-center h-64">
                <div className="text-muted-foreground">Đang chuyển hướng...</div>
            </div>
        </div>
    )
}
