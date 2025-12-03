'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function AdminDashboardPage() {
    const router = useRouter()

    useEffect(() => {
        // Redirect to overview page
        router.replace('/admin/overview')
    }, [router])

    return null
}
