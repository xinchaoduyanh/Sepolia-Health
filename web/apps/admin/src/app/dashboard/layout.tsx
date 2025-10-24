'use client'

import { DashboardLayout } from '@/layouts/DashboardLayout'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useAuth } from '@/shared/hooks/useAuth'
import { useCheckAuth } from '@/shared/hooks/useAuth'
import { useEffect, useState, useRef } from 'react'

interface LayoutProps {
    children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
    const [defaultOpen, setDefaultOpen] = useState(true)
    const { isAuthenticated } = useAuth()
    const { checkAuth } = useCheckAuth()
    const authChecked = useRef(false)

    useEffect(() => {
        // Get sidebar state from localStorage
        const sidebarState = localStorage.getItem('sidebar_state')
        setDefaultOpen(sidebarState !== 'false')
    }, [])

    useEffect(() => {
        // Check authentication status - ONLY ONCE when dashboard layout mounts
        // Only check if we don't have user data yet
        if (!authChecked.current && !isAuthenticated) {
            console.log('🔍 Dashboard layout: Starting authentication check...')
            checkAuth()
            authChecked.current = true
        } else if (isAuthenticated) {
            console.log('✅ Dashboard layout: Already authenticated, skipping check')
            authChecked.current = true
        }
    }, [checkAuth, isAuthenticated])

    return (
        <ProtectedRoute requiredRole="ADMIN">
            <DashboardLayout defaultOpen={defaultOpen}>{children}</DashboardLayout>
        </ProtectedRoute>
    )
}
