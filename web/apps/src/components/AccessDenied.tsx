'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@workspace/ui/components/Button'
import { ShieldX } from 'lucide-react'

interface AccessDeniedProps {
    message?: string
}

export function AccessDenied({ message }: AccessDeniedProps) {
    const router = useRouter()

    const handleBackToLogin = () => {
        router.push('/login')
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full text-center space-y-8">
                <div className="flex flex-col items-center">
                    <div className="rounded-full bg-red-100 p-6 mb-6">
                        <ShieldX className="h-24 w-24 text-red-600" />
                    </div>

                    <h1 className="text-4xl font-bold text-foreground mb-4">Truy cập bị từ chối</h1>

                    <p className="text-lg text-muted-foreground mb-2">
                        {message || 'Bạn không có quyền truy cập vào hệ thống này.'}
                    </p>

                    <p className="text-sm text-muted-foreground mb-8">
                        Vui lòng liên hệ quản trị viên nếu bạn cho rằng đây là lỗi.
                    </p>

                    <Button onClick={handleBackToLogin} className="w-full max-w-xs">
                        Quay về trang đăng nhập
                    </Button>
                </div>

                <div className="pt-8 border-t border-border">
                    <p className="text-xs text-muted-foreground">Hệ thống chỉ dành cho quản trị viên (ADMIN)</p>
                </div>
            </div>
        </div>
    )
}
