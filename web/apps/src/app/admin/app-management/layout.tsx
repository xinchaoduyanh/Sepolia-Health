import React from 'react'
import { ProtectedRoute } from '@/components/ProtectedRoute'

export default function AppManagementLayout({ children }: { children: React.ReactNode }) {
    return <ProtectedRoute requiredRole="ADMIN">{children}</ProtectedRoute>
}
