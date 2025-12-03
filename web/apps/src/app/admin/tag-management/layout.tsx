import { ProtectedRoute } from '@/components/ProtectedRoute'

export default function TagManagementLayout({ children }: { children: React.ReactNode }) {
    return <ProtectedRoute requiredRole="ADMIN">{children}</ProtectedRoute>
}
