import { ProtectedRoute } from '@/components/ProtectedRoute'

export default function DoctorManagementLayout({ children }: { children: React.ReactNode }) {
    return (
        <ProtectedRoute requiredRole="ADMIN">
            {children}
        </ProtectedRoute>
    )
}
