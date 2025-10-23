'use client'

import { DashboardLayout } from '@/layouts/DashboardLayout'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useAuth } from '@/shared/hooks/useAuth'
import { useEffect, useState } from 'react'

interface LayoutProps {
    children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
    const [defaultOpen, setDefaultOpen] = useState(true)
    const { isAuthenticated, isLoading } = useAuth()

    useEffect(() => {
        // Get sidebar state from localStorage
        const sidebarState = localStorage.getItem('sidebar_state')
        setDefaultOpen(sidebarState !== 'false')
    }, [])

    return (
        <ProtectedRoute requiredRole="ADMIN">
            <DashboardLayout defaultOpen={defaultOpen}>{children}</DashboardLayout>
        </ProtectedRoute>
    )
}
