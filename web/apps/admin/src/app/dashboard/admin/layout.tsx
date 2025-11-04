import { ProtectedRoute } from '@/components/ProtectedRoute'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return <ProtectedRoute requiredRole="ADMIN">{children}</ProtectedRoute>
}
