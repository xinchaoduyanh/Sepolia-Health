import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000/api'

interface RefreshTokenRequest {
    refreshToken: string
}

interface RefreshTokenResponse {
    accessToken: string
    refreshToken: string
}

export async function POST() {
    try {
        const cookieStore = await cookies()

        // 1. Đọc refresh token từ cookie 🍪
        const refreshToken = cookieStore.get('refreshToken')?.value

        console.log('🔄 Refresh attempt - Refresh token present:', !!refreshToken)
        console.log(
            '🍪 All cookies:',
            cookieStore.getAll().map(c => `${c.name}=${c.value.substring(0, 10)}...`),
        )

        if (!refreshToken) {
            console.log('❌ No refresh token found')
            return NextResponse.json({ error: 'No refresh token' }, { status: 401 })
        }

        // 2. Gọi API backend để refresh token
        const res = await fetch(`${BACKEND_URL}/auth/refresh`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refreshToken }),
        })

        if (!res.ok) {
            // Refresh failed, clear cookies
            cookieStore.delete('accessToken')
            cookieStore.delete('refreshToken')
            return NextResponse.json({ error: 'Refresh failed' }, { status: 401 })
        }

        // 3. Nhận token mới từ API
        const data: RefreshTokenResponse = await res.json()

        // 4. Cập nhật cookies với token mới
        cookieStore.set('accessToken', data.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            maxAge: 60 * 60 * 24 * 15, // 15 ngày
            sameSite: 'lax',
        })

        if (data.refreshToken) {
            cookieStore.set('refreshToken', data.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                path: '/', // Available for all paths
                maxAge: 60 * 60 * 24 * 15, // 15 ngày
                sameSite: 'lax',
            })
        }

        // 5. Trả về success
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Refresh token proxy error:', error)
        // Clear cookies on error
        const cookieStore = await cookies()
        cookieStore.delete('accessToken')
        cookieStore.delete('refreshToken')
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
