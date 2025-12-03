import { ProtectedRoute } from '@/components/ProtectedRoute'

export default function RemoteHealthcareLayout({ children }: { children: React.ReactNode }) {
    return <ProtectedRoute allowedRoles={['ADMIN', 'DOCTOR', 'RECEPTIONIST']}>{children}</ProtectedRoute>
}
