'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@workspace/ui/components/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/Card'
import { AlertTriangle, ArrowLeft, Home, RefreshCw } from 'lucide-react'
import { useAuthStore } from '@/shared/stores/auth.store'
import { useState } from 'react'

export default function UnauthorizedPage() {
    const { user, logout } = useAuthStore()
    const router = useRouter()
    const [isLoggingOut, setIsLoggingOut] = useState(false)

    const handleGoBack = () => {
        router.back()
    }

    const handleGoHome = () => {
        router.push('/dashboard')
    }

    const handleRefresh = () => {
        window.location.reload()
    }

    const handleLogout = async () => {
        setIsLoggingOut(true)
        try {
            logout()
            router.push('/login')
        } catch (error) {
            console.error('Logout error:', error)
        } finally {
            setIsLoggingOut(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-lg w-full space-y-8">
                {/* Logo */}
                <div className="text-center">
                    <div className="mx-auto h-16 w-16 rounded-full bg-white dark:bg-gray-800 shadow-lg flex items-center justify-center mb-4">
                        <img className="h-10 w-10" src="/image/sepolia-icon.png" alt="Sepolia Health" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sepolia Health</h1>
                </div>

                {/* Main Card */}
                <Card className="shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                    <CardHeader className="text-center pb-4">
                        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 dark:bg-red-900/20">
                            <AlertTriangle className="h-8 w-8 text-red-500" />
                        </div>
                        <CardTitle className="text-3xl font-bold text-red-600 dark:text-red-400">
                            Truy cập bị từ chối
                        </CardTitle>
                        <CardDescription className="text-lg text-gray-600 dark:text-gray-300 mt-2">
                            Bạn không có quyền truy cập trang này
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        {/* User Info */}
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                    Vai trò hiện tại:
                                </span>
                                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-sm font-medium rounded-full">
                                    {user?.role || 'Không xác định'}
                                </span>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Trang này yêu cầu quyền quản trị viên
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <Button onClick={handleGoBack} variant="outline" className="w-full h-11">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Quay lại
                            </Button>

                            <Button onClick={handleGoHome} variant="outline" className="w-full h-11">
                                <Home className="mr-2 h-4 w-4" />
                                Trang chủ
                            </Button>

                            <Button onClick={handleRefresh} variant="outline" className="w-full h-11 sm:col-span-2">
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Tải lại trang
                            </Button>

                            <Button
                                onClick={handleLogout}
                                variant="destructive"
                                className="w-full h-11 sm:col-span-2"
                                isDisabled={isLoggingOut}
                            >
                                {isLoggingOut ? (
                                    <>
                                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                        Đang đăng xuất...
                                    </>
                                ) : (
                                    'Đăng xuất'
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Footer */}
                <div className="text-center space-y-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Liên hệ với quản trị viên nếu bạn tin rằng đây là lỗi
                    </p>
                    <div className="flex items-center justify-center space-x-4 text-xs text-gray-400">
                        <span>Sepolia Health v1.0</span>
                        <span>•</span>
                        <span>Hệ thống quản lý y tế</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
