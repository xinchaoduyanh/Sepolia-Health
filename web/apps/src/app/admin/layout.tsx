'use client'

import { AdminDashboardLayout } from '@/layouts/AdminDashboardLayout'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useCheckAuth } from '@/shared/hooks/useAuth'
import { useEffect, useState, useRef } from 'react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
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
        <ProtectedRoute requiredRole="ADMIN">
            <AdminDashboardLayout defaultOpen={defaultOpen}>{children}</AdminDashboardLayout>
        </ProtectedRoute>
    )
}
