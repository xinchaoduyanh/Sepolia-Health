'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ServiceManagementPage() {
    const router = useRouter()

    useEffect(() => {
        router.replace('/dashboard/service-management/service-list')
    }, [router])

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-center h-64">
                <div className="text-muted-foreground">Đang chuyển hướng...</div>
            </div>
        </div>
    )
}
