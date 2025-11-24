'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function ReceptionistDashboardPage() {
    const router = useRouter()

    useEffect(() => {
        // Redirect to schedule appointment page
        router.replace('/receptionist/messages')
    }, [router])

    return null
}
