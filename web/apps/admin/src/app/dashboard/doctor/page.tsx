'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function DoctorDashboardPage() {
    const router = useRouter()

    useEffect(() => {
        // Redirect to appointments page
        router.replace('/dashboard/doctor/appointments')
    }, [router])

    return null
}
