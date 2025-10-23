import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000/api'

export async function POST() {
    try {
        const cookieStore = await cookies()

        // 1. Đọc token từ cookie để gọi logout API
        const token = cookieStore.get('accessToken')?.value

        if (token) {
            // 2. Gọi API backend để logout (để invalidate token trên server)
            try {
                await fetch(`${BACKEND_URL}/admin/auth/logout`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                })
            } catch (error) {
                // Ignore backend logout errors, still clear cookies
                console.warn('Backend logout failed:', error)
            }
        }

        // 3. XÓA TẤT CẢ COOKIES 🍪
        cookieStore.delete('accessToken')
        cookieStore.delete('refreshToken')

        // 4. Trả về success
        return NextResponse.json({ message: 'Logged out successfully' })
    } catch (error) {
        console.error('Logout proxy error:', error)
        // Even if there's an error, clear cookies
        const cookieStore = await cookies()
        cookieStore.delete('accessToken')
        cookieStore.delete('refreshToken')
        return NextResponse.json({ message: 'Logged out successfully' })
    }
}
