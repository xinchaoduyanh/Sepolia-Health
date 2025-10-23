import { NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000/api'

export async function GET() {
    try {
        console.log('🏥 Health check - Backend URL:', BACKEND_URL)

        // Test backend connection
        const res = await fetch(`${BACKEND_URL}/health`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        })

        if (res.ok) {
            const data = await res.json()
            return NextResponse.json({
                status: 'healthy',
                backend: 'connected',
                backendData: data,
            })
        } else {
            return NextResponse.json(
                {
                    status: 'unhealthy',
                    backend: 'error',
                    statusCode: res.status,
                },
                { status: 503 },
            )
        }
    } catch (error) {
        console.error('🚫 Backend health check failed:', error)
        return NextResponse.json(
            {
                status: 'unhealthy',
                backend: 'disconnected',
                error: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 503 },
        )
    }
}
