import { ProtectedRoute } from '@/components/ProtectedRoute'

export default function ReceptionistManagementLayout({ children }: { children: React.ReactNode }) {
    return (
        <ProtectedRoute requiredRole="ADMIN">
            {children}
        </ProtectedRoute>
    )
}
