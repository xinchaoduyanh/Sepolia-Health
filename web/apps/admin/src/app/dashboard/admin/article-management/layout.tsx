import { ProtectedRoute } from '@/components/ProtectedRoute'

export default function ArticleManagementLayout({ children }: { children: React.ReactNode }) {
    return (
        <ProtectedRoute requiredRole="ADMIN">
            {children}
        </ProtectedRoute>
    )
}
