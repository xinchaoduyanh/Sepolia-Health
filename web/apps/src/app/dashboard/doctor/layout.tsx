import { ProtectedRoute } from '@/components/ProtectedRoute'

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
    return (
        <ProtectedRoute requiredRole="DOCTOR">
            {children}
        </ProtectedRoute>
    )
}
