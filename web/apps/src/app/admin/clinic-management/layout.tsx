import { ProtectedRoute } from '@/components/ProtectedRoute'

export default function ClinicManagementLayout({ children }: { children: React.ReactNode }) {
    return (
        <ProtectedRoute requiredRole="ADMIN">
            {children}
        </ProtectedRoute>
    )
}
