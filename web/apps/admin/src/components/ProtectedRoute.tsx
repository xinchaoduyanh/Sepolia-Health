'use client'

import React, { useEffect, ReactNode } from 'react'
import { useAuth } from '@/shared/hooks/useAuth'
import { useRouter } from 'next/navigation'

interface ProtectedRouteProps {
    children: ReactNode
    requiredRole?: 'ADMIN' | 'DOCTOR' | 'RECEPTIONIST' | 'PATIENT'
    allowedRoles?: ('ADMIN' | 'DOCTOR' | 'RECEPTIONIST' | 'PATIENT')[]
    fallback?: ReactNode
}

export function ProtectedRoute({ children, requiredRole, allowedRoles, fallback }: ProtectedRouteProps) {
    const { isAuthenticated, user, isLoading } = useAuth()
    const router = useRouter()
    const [isLoggingOut, setIsLoggingOut] = React.useState(false)

    // Check if we're on login page to avoid redirect loop
    const isLoginPage = typeof window !== 'undefined' && window.location.pathname === '/login'

    // Redirect logic - only after loading is complete and not logging out
    useEffect(() => {
        if (!isLoading && !isLoggingOut && !isLoginPage) {
            if (!isAuthenticated) {
                console.log('❌ Not authenticated, redirecting to login')
                router.replace('/login') // Use replace instead of push
                return
            }

            // Check role permissions
            if (allowedRoles && user?.role) {
                if (!allowedRoles.includes(user.role)) {
                    console.log('❌ Role not in allowed roles, redirecting to login')
                    router.replace('/login') // Use replace instead of push
                    return
                }
            } else if (requiredRole && user?.role !== requiredRole) {
                console.log('❌ Role mismatch, redirecting to login')
                router.replace('/login') // Use replace instead of push
                return
            }
        }
    }, [isAuthenticated, user, isLoading, requiredRole, allowedRoles, router, isLoggingOut, isLoginPage])

    // Listen for logout events to prevent redirect during logout
    useEffect(() => {
        const handleLogout = () => {
            console.log('🔐 Logout detected, preventing redirect')
            setIsLoggingOut(true)
        }

        // Listen for custom logout event
        window.addEventListener('logout-start', handleLogout)

        return () => {
            window.removeEventListener('logout-start', handleLogout)
        }
    }, [])

    // Show loading state
    if (isLoading || isLoggingOut) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">{isLoggingOut ? 'Đang đăng xuất...' : 'Đang tải...'}</p>
                </div>
            </div>
        )
    }

    // If we're on login page, don't show anything (let login page handle it)
    if (isLoginPage) {
        return <>{children}</>
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

    // Check role permissions
    const hasRoleAccess = () => {
        if (allowedRoles && user?.role) {
            return allowedRoles.includes(user.role)
        }
        if (requiredRole) {
            return user?.role === requiredRole
        }
        return true // No role restriction
    }

    if (!hasRoleAccess()) {
        const requiredRolesText = allowedRoles ? allowedRoles.join(', ') : requiredRole || 'None'
        return (
            fallback || (
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
                        <p className="text-gray-600">You don&apos;t have permission to access this page.</p>
                        <p className="text-sm text-gray-500 mt-2">
                            Required roles: {requiredRolesText} | Your role: {user?.role}
                        </p>
                    </div>
                </div>
            )
        )
    }

    return <React.Fragment key={user?.id || 'logged-out'}>{children}</React.Fragment>
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

// Higher-order component for protecting pages with multiple allowed roles
export function withRoles<P extends object>(
    Component: React.ComponentType<P>,
    allowedRoles: ('ADMIN' | 'DOCTOR' | 'RECEPTIONIST' | 'PATIENT')[],
) {
    return function AuthenticatedComponent(props: P) {
        return (
            <ProtectedRoute allowedRoles={allowedRoles}>
                <Component {...props} />
            </ProtectedRoute>
        )
    }
}
