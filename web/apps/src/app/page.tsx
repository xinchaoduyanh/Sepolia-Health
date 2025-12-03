'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/shared/stores/auth.store'

export default function HomePage() {
    const router = useRouter()
    const { isAuthenticated, hasHydrated, user } = useAuthStore()

    useEffect(() => {
        // Wait for rehydration to complete
        if (!hasHydrated) {
            return
        }

        // Redirect based on authentication status and role
        if (isAuthenticated && user) {
            switch (user.role) {
                case 'ADMIN':
                    router.replace('/admin')
                    break
                case 'DOCTOR':
                    router.replace('/doctor')
                    break
                case 'RECEPTIONIST':
                    router.replace('/receptionist')
                    break
                default:
                    router.replace('/admin')
            }
        } else {
            router.replace('/login')
        }
    }, [router, isAuthenticated, hasHydrated, user])

    // Show loading while redirecting
    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
    )
}
