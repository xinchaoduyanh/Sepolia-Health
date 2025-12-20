'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/shared/stores/auth.store'
import { AccessDenied } from '@/components/AccessDenied'

const ROLE_ROUTES: Record<string, string> = {
    ADMIN: '/admin',
    DOCTOR: '/doctor',
    RECEPTIONIST: '/receptionist',
}

export default function HomePage() {
    const router = useRouter()
    const { isAuthenticated, hasHydrated, user } = useAuthStore()
    const [accessDenied, setAccessDenied] = useState(false)

    useEffect(() => {
        // Wait for rehydration to complete
        if (!hasHydrated) {
            return
        }

        // Redirect based on authentication status and role
        if (isAuthenticated && user?.role) {
            const redirectPath = ROLE_ROUTES[user.role]

            if (redirectPath) {
                router.replace(redirectPath)
            } else {
                // Invalid role - show access denied
                setAccessDenied(true)
            }
        } else {
            router.replace('/login')
        }
    }, [router, isAuthenticated, hasHydrated, user])

    if (accessDenied) {
        return <AccessDenied message="Vai trò của bạn không được công nhận. Vui lòng liên hệ quản trị viên." />
    }

    // Show loading while checking auth
    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
    )
}
