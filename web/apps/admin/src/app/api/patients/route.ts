import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000/api/admin'

export async function GET(request: NextRequest) {
    try {
        const cookieStore = await cookies()
        const accessToken = cookieStore.get('accessToken')?.value

        console.log('🔍 Patients API - Access token present:', !!accessToken)

        if (!accessToken) {
            console.log('❌ No access token found for patients API')
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get query parameters from the request
        const { searchParams } = new URL(request.url)
        const queryString = searchParams.toString()
        const url = `${BACKEND_URL}/patients${queryString ? `?${queryString}` : ''}`

        console.log('🌐 Forwarding to:', url)

        // Forward request to backend with access token
        const res = await fetch(url, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        })

        const data = await res.json()

        if (!res.ok) {
            console.log('❌ Backend error:', data)
            return NextResponse.json(data, { status: res.status })
        }

        console.log('✅ Patients API success')
        return NextResponse.json(data)
    } catch (error) {
        console.error('Patients API proxy error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const cookieStore = await cookies()
        const accessToken = cookieStore.get('accessToken')?.value

        console.log('🔍 Create Patient API - Access token present:', !!accessToken)

        if (!accessToken) {
            console.log('❌ No access token found for create patient API')
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const url = `${BACKEND_URL}/patients`

        console.log('🌐 Forwarding POST to:', url)

        // Forward request to backend with access token
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        })

        const data = await res.json()

        if (!res.ok) {
            console.log('❌ Backend error:', data)
            return NextResponse.json(data, { status: res.status })
        }

        console.log('✅ Create Patient API success')
        return NextResponse.json(data)
    } catch (error) {
        console.error('Create Patient API proxy error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
