'use client'

import { DoctorDashboardLayout } from '@/layouts/DoctorDashboardLayout'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useCheckAuth } from '@/shared/hooks/useAuth'
import { useEffect, useState, useRef } from 'react'

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
    const [defaultOpen, setDefaultOpen] = useState(true)
    const { checkAuth } = useCheckAuth()
    const authChecked = useRef(false)

    useEffect(() => {
        const sidebarState = localStorage.getItem('sidebar_state')
        setDefaultOpen(sidebarState !== 'false')
    }, [])

    useEffect(() => {
        if (!authChecked.current) {
            checkAuth()
            authChecked.current = true
        }
    }, [checkAuth])

    return (
        <ProtectedRoute requiredRole="DOCTOR">
            <DoctorDashboardLayout defaultOpen={defaultOpen}>{children}</DoctorDashboardLayout>
        </ProtectedRoute>
    )
}
