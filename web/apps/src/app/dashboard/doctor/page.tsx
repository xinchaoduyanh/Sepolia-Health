'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function DoctorDashboardPage() {
    const router = useRouter()

    useEffect(() => {
        // Redirect to schedule appointments page
        router.replace('/dashboard/doctor/schedule/appointments')
    }, [router])

    return null
}
