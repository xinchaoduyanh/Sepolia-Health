'use client'

import { useAuth } from '@/shared/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect, ReactNode } from 'react'

interface ProtectedRouteProps {
    children: ReactNode
    requiredRole?: 'ADMIN' | 'DOCTOR' | 'RECEPTIONIST' | 'PATIENT'
    fallback?: ReactNode
}

export function ProtectedRoute({ children, requiredRole, fallback }: ProtectedRouteProps) {
    const { isAuthenticated, user, isLoading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!isLoading) {
            if (!isAuthenticated) {
                // Redirect to login page
                router.push('/login')
                return
            }

            if (requiredRole && user?.role !== requiredRole) {
                // Redirect to unauthorized page or dashboard
                router.push('/unauthorized')
                return
            }
        }
    }, [isAuthenticated, user, isLoading, requiredRole, router])

    // Show loading state
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    // Show fallback if not authenticated
    if (!isAuthenticated) {
        return (
            fallback || (
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
                        <p className="text-gray-600">Please log in to access this page.</p>
                    </div>
                </div>
            )
        )
    }

    // Check role if required
    if (requiredRole && user?.role !== requiredRole) {
        return (
            fallback || (
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-red-600 mb-4">Unauthorized</h2>
                        <p className="text-gray-600">You don't have permission to access this page.</p>
                        <p className="text-sm text-gray-500 mt-2">
                            Required role: {requiredRole} | Your role: {user?.role}
                        </p>
                    </div>
                </div>
            )
        )
    }

    return <>{children}</>
}

// Higher-order component for protecting pages
export function withAuth<P extends object>(
    Component: React.ComponentType<P>,
    requiredRole?: 'ADMIN' | 'DOCTOR' | 'RECEPTIONIST' | 'PATIENT',
) {
    return function AuthenticatedComponent(props: P) {
        return (
            <ProtectedRoute requiredRole={requiredRole}>
                <Component {...props} />
            </ProtectedRoute>
        )
    }
}
