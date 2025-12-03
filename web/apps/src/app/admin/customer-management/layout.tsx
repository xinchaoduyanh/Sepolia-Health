import { ProtectedRoute } from '@/components/ProtectedRoute'

export default function CustomerManagementLayout({ children }: { children: React.ReactNode }) {
    return (
        <ProtectedRoute requiredRole="ADMIN">
            {children}
        </ProtectedRoute>
    )
}
