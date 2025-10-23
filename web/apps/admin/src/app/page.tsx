'use client'

import { useEffect } from 'react'
import { useAuth } from '@/shared/hooks/useAuth'
import { useRouter } from 'next/navigation'

export default function HomePage() {
    const { isAuthenticated, isLoading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!isLoading) {
            if (isAuthenticated) {
                router.push('/dashboard/overview')
            } else {
                router.push('/login')
            }
        }
    }, [isAuthenticated, isLoading, router])

    // Show loading while checking auth status
    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
    )
}
