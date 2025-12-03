'use client'

import { AdminDashboardLayout } from '@/layouts/AdminDashboardLayout'
import { DoctorDashboardLayout } from '@/layouts/DoctorDashboardLayout'
import { ReceptionistDashboardLayout } from '@/layouts/ReceptionistDashboardLayout'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useAuth } from '@/shared/hooks/useAuth'
import { useCheckAuth } from '@/shared/hooks/useAuth'
import { useEffect, useState, useRef } from 'react'

interface LayoutProps {
    children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
    const [defaultOpen, setDefaultOpen] = useState(true)
    const { isAuthenticated, user } = useAuth()
    const { checkAuth } = useCheckAuth()
    const authChecked = useRef(false)
    const isCheckingAuth = useRef(false)

    useEffect(() => {
        // Get sidebar state from localStorage
        const sidebarState = localStorage.getItem('sidebar_state')
        setDefaultOpen(sidebarState !== 'false')
    }, [])

    useEffect(() => {
        // Check authentication status - ONLY ONCE when dashboard layout mounts
        // Only check if we don't have user data yet
        if (!authChecked.current && !isAuthenticated && !isCheckingAuth.current) {
            console.log('🔍 Dashboard layout: Starting authentication check...')
            isCheckingAuth.current = true
            checkAuth()
            authChecked.current = true
        } else if (isAuthenticated) {
            console.log('✅ Dashboard layout: Already authenticated, skipping check')
            authChecked.current = true
            isCheckingAuth.current = false
        }
    }, [checkAuth, isAuthenticated])

    // Determine which layout to use based on user role
    const renderLayout = () => {
        const layoutProps = { children, defaultOpen }

        switch (user?.role) {
            case 'ADMIN':
                return <AdminDashboardLayout {...layoutProps} />
            case 'DOCTOR':
                return <DoctorDashboardLayout {...layoutProps} />
            case 'RECEPTIONIST':
                return <ReceptionistDashboardLayout {...layoutProps} />
            default:
                // Fallback to Admin layout if role is not recognized
                return <AdminDashboardLayout {...layoutProps} />
        }
    }

    return (
        <ProtectedRoute>
            {renderLayout()}
        </ProtectedRoute>
    )
}
