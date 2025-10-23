import { AdminSidebar } from '@/components/Sidebar'
import { Header } from '@/components/Header'
import { SidebarProvider, SidebarInset } from '@workspace/ui/components/Sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
            <AdminSidebar />
            <SidebarInset>
                <Header />
                <main className="flex-1 p-4 overflow-auto">
                    <div className="max-w-full mx-auto">{children}</div>
                </main>
            </SidebarInset>
        </SidebarProvider>
    )
}
