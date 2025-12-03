import { ProtectedRoute } from '@/components/ProtectedRoute'

export default function ReceptionistLayout({ children }: { children: React.ReactNode }) {
    return <ProtectedRoute requiredRole="RECEPTIONIST">{children}</ProtectedRoute>
}
