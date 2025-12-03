import { ProtectedRoute } from '@/components/ProtectedRoute'

export default function ServiceManagementLayout({ children }: { children: React.ReactNode }) {
    return (
        <ProtectedRoute requiredRole="ADMIN">
            {children}
        </ProtectedRoute>
    )
}
