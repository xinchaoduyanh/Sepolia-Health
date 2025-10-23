import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000/api'

interface AdminProfile {
    id: number
    email: string
    phone: string | null
    role: string
    status: string
    createdAt: string
    updatedAt: string
}

export async function GET() {
    try {
        // 1. Đọc cookie từ trình duyệt 🍪
        const cookieStore = await cookies()
        const token = cookieStore.get('accessToken')?.value

        console.log('🍪 Profile check - Access token present:', !!token)
        console.log(
            '🍪 All cookies:',
            cookieStore.getAll().map(c => `${c.name}=${c.value.substring(0, 10)}...`),
        )

        if (!token) {
            console.log('❌ No access token found')
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // 2. Dùng token gọi API backend THẬT
        const res = await fetch(`${BACKEND_URL}/auth/me`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })

        if (!res.ok) {
            if (res.status === 401) {
                // Token expired, try to refresh
                return NextResponse.json({ error: 'Token expired' }, { status: 401 })
            }
            const errorData = await res.json()
            return NextResponse.json(errorData, { status: res.status })
        }

        // 3. Trả về profile data
        const data: AdminProfile = await res.json()
        return NextResponse.json(data)
    } catch (error) {
        console.error('Profile proxy error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
