'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
    const router = useRouter()

    useEffect(() => {
        // Redirect to overview page as default
        router.push('/dashboard/overview')
    }, [router])

    // Show loading while redirecting
    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
    )
}
