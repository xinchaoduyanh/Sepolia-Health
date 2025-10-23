import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000/api/admin'

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const cookieStore = await cookies()
        const accessToken = cookieStore.get('accessToken')?.value

        console.log('🔍 Get User API - Access token present:', !!accessToken)

        if (!accessToken) {
            console.log('❌ No access token found for get user API')
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const url = `${BACKEND_URL}/users/${params.id}`

        console.log('🌐 Forwarding GET to:', url)

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

        console.log('✅ Get User API success')
        return NextResponse.json(data)
    } catch (error) {
        console.error('Get User API proxy error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const cookieStore = await cookies()
        const accessToken = cookieStore.get('accessToken')?.value

        console.log('🔍 Update User API - Access token present:', !!accessToken)

        if (!accessToken) {
            console.log('❌ No access token found for update user API')
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const url = `${BACKEND_URL}/users/${params.id}`

        console.log('🌐 Forwarding PUT to:', url)

        // Forward request to backend with access token
        const res = await fetch(url, {
            method: 'PUT',
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

        console.log('✅ Update User API success')
        return NextResponse.json(data)
    } catch (error) {
        console.error('Update User API proxy error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const cookieStore = await cookies()
        const accessToken = cookieStore.get('accessToken')?.value

        console.log('🔍 Delete User API - Access token present:', !!accessToken)

        if (!accessToken) {
            console.log('❌ No access token found for delete user API')
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const url = `${BACKEND_URL}/users/${params.id}`

        console.log('🌐 Forwarding DELETE to:', url)

        // Forward request to backend with access token
        const res = await fetch(url, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        })

        if (!res.ok) {
            const data = await res.json()
            console.log('❌ Backend error:', data)
            return NextResponse.json(data, { status: res.status })
        }

        console.log('✅ Delete User API success')
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Delete User API proxy error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const cookieStore = await cookies()
        const accessToken = cookieStore.get('accessToken')?.value

        console.log('🔍 Patch User API - Access token present:', !!accessToken)

        if (!accessToken) {
            console.log('❌ No access token found for patch user API')
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const url = `${BACKEND_URL}/users/${params.id}`

        console.log('🌐 Forwarding PATCH to:', url)

        // Forward request to backend with access token
        const res = await fetch(url, {
            method: 'PATCH',
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

        console.log('✅ Patch User API success')
        return NextResponse.json(data)
    } catch (error) {
        console.error('Patch User API proxy error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
