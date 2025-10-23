'use client'

import { useAuth } from '@/shared/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { Button } from '@workspace/ui/components/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/Card'
import { AlertTriangle, ArrowLeft } from 'lucide-react'
import { useAuthStore } from '@/shared/stores/auth.store'

export default function UnauthorizedPage() {
    const { user} = useAuthStore()
    const router = useRouter()

    const handleGoBack = () => {
        router.back()
    }

    const handleLogout = () => {
        logout()
        router.push('/login')
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <img className="mx-auto h-12 w-auto" src="/image/sepolia-icon.png" alt="Sepolia Health" />
                </div>

                <Card>
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                            <AlertTriangle className="h-6 w-6 text-red-600" />
                        </div>
                        <CardTitle className="text-2xl text-red-600">Access Denied</CardTitle>
                        <CardDescription>You don't have permission to access this page</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="text-center text-sm text-gray-600">
                            <p>
                                Your current role: <span className="font-medium">{user?.role}</span>
                            </p>
                            <p>This page requires administrator privileges.</p>
                        </div>

                        <div className="flex flex-col space-y-2">
                            <Button onClick={handleGoBack} variant="outline" className="w-full">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Go Back
                            </Button>

                            <Button onClick={handleLogout} variant="destructive" className="w-full">
                                Sign Out
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <div className="text-center">
                    <p className="text-sm text-gray-600">Contact your administrator if you believe this is an error</p>
                </div>
            </div>
        </div>
    )
}
