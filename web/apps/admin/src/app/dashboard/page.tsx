'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/shared/stores/auth.store'

export default function DashboardPage() {
    const router = useRouter()
    const { user } = useAuthStore()

    useEffect(() => {
        // Redirect based on role
        if (user?.role === 'ADMIN') {
            router.replace('/dashboard/admin/overview')
        } else if (user?.role === 'DOCTOR') {
            router.replace('/dashboard/doctor')
        } else if (user?.role === 'RECEPTIONIST') {
            router.replace('/dashboard/receptionist')
        }
    }, [router, user])

    // Show loading while redirecting
    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
    )
}
