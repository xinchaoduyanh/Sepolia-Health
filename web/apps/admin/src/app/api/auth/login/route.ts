import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// Backend API URL
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000/api'

// Types matching backend DTOs
interface AdminLoginRequest {
    email: string
    password: string
}

interface AdminLoginResponse {
    data: {
        accessToken: string
        refreshToken: string
        admin: {
            id: number
            email: string
            phone: string | null
            role: string
            status: string
            createdAt: string
            updatedAt: string
        }
    }
    message: string
    statusCode: number
}

export async function POST(request: Request) {
    try {
        const body: AdminLoginRequest = await request.json()

        console.log('🔐 Login attempt for:', body.email)
        console.log('🌐 Backend URL:', BACKEND_URL)

        // 1. Gọi API backend thật
        let res: Response
        try {
            res = await fetch(`${BACKEND_URL}/admin/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            })
        } catch (fetchError) {
            console.error('🚫 Cannot connect to backend:', fetchError)
            return NextResponse.json(
                { error: 'Cannot connect to backend server. Please check if backend is running.' },
                { status: 503 },
            )
        }

        console.log('📡 Backend response status:', res.status)

        if (!res.ok) {
            let errorData
            try {
                errorData = await res.json()
            } catch {
                errorData = { error: `Backend returned ${res.status}: ${res.statusText}` }
            }
            console.error('❌ Backend error:', errorData)
            return NextResponse.json(errorData, { status: res.status })
        }

        // 2. Nhận token từ API thật
        const response = await res.json()
        console.log('📦 Backend response structure:', JSON.stringify(response, null, 2))

        // Backend trả về { data: { accessToken, refreshToken, admin }, message, statusCode }
        const data = response.data

        // 3. SET HTTPONLY COOKIE 🍪
        const cookieStore = await cookies()

        cookieStore.set('accessToken', data.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            maxAge: 60 * 15, // 15 phút
            sameSite: 'lax',
        })

        cookieStore.set('refreshToken', data.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/api/auth/refresh', // Chỉ cho endpoint refresh
            maxAge: 60 * 60 * 24 * 7, // 7 ngày
            sameSite: 'lax',
        })

        // 4. Trả về CHỈ data 'admin', KHÔNG trả token
        // Đảm bảo data.admin có thể serialize được
        const adminData = {
            id: data.admin.id,
            email: data.admin.email,
            phone: data.admin.phone,
            role: data.admin.role,
            status: data.admin.status,
            createdAt: data.admin.createdAt,
            updatedAt: data.admin.updatedAt,
        }

        console.log('✅ Login successful, returning admin data:', adminData)
        return NextResponse.json(adminData)
    } catch (error) {
        console.error('Login proxy error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
