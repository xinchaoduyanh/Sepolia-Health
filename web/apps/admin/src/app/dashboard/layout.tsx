import { Header } from '@/components/Header'
import { Sidebar } from '@/components/Sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-background">
            <Header />
            <div className="flex">
                <Sidebar />
                <main className="flex-1 p-4 overflow-auto">
                    <div className="max-w-full mx-auto">{children}</div>
                </main>
            </div>
        </div>
    )
}
