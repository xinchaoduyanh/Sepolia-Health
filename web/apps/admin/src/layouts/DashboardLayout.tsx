'use client'

import { Avatar, AvatarFallback } from '@workspace/ui/components/Avatar'
import { SidebarNavigationMenu, SidebarNavigationMenuItem } from '@workspace/ui/components/Sidebar.helpers'
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarInset,
    SidebarProvider,
    useSidebar,
} from '@workspace/ui/components/Sidebar'
import { ThemeSwitcher } from '@/shared/components/ThemeSwitcher'
import Image from 'next/image'
import {
    BarChart3,
    Package,
    DollarSign,
    FileText,
    Percent,
    HelpCircle,
    Monitor,
    Stethoscope,
    Users,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

// Component cho logo có thể toggle sidebar
function ToggleLogo() {
    const { toggleSidebar } = useSidebar()

    return (
        <button
            onClick={toggleSidebar}
            className="flex items-center hover:opacity-80 transition-opacity cursor-pointer"
            aria-label="Toggle Sidebar"
        >
            <div className="w-8 h-8 relative">
                <Image
                    src="/image/sepolia-icon.png"
                    alt="Sepolia Health Logo"
                    width={32}
                    height={32}
                    className="object-contain"
                />
            </div>
        </button>
    )
}

const MAIN_ITEMS: Array<SidebarNavigationMenuItem> = [
    {
        title: 'Tổng quan',
        url: '/dashboard/overview',
        icon: BarChart3,
    },
    {
        title: 'Sản phẩm',
        url: '/dashboard/products',
        icon: Package,
    },
    {
        title: 'Doanh thu',
        url: '/dashboard/revenue',
        icon: DollarSign,
    },
    {
        title: 'Thông tin & Chương trình',
        url: '/dashboard/info-programs',
        icon: FileText,
    },
    {
        title: 'Khuyến mại',
        url: '/dashboard/promotions',
        icon: Percent,
    },
    {
        title: 'Câu hỏi thường gặp',
        url: '/dashboard/faq',
        icon: HelpCircle,
    },
    {
        title: 'Chăm sóc sức khỏe từ xa',
        url: '/dashboard/remote-healthcare',
        icon: Monitor,
        items: [
            {
                title: 'Danh sách đặt khám',
                url: '/dashboard/remote-healthcare/appointments',
            },
            {
                title: 'Đặt lịch khám',
                url: '/dashboard/remote-healthcare/schedule-appointment',
            },
            {
                title: 'Danh sách khách hàng',
                url: '/dashboard/remote-healthcare/customers',
            },
        ],
    },
]

const MANAGEMENT_ITEMS: Array<SidebarNavigationMenuItem> = [
    {
        title: 'Quản lý sản phẩm',
        url: '/dashboard/product-management',
        icon: Package,
    },
    {
        title: 'Quản lý bác sĩ',
        url: '/dashboard/doctor-management',
        icon: Stethoscope,
    },
    {
        title: 'Quản lý khuyến mại',
        url: '/dashboard/promotion-management',
        icon: Percent,
    },
    {
        title: 'Quản lý khách hàng',
        url: '/dashboard/customer-management',
        icon: Users,
        items: [
            {
                title: 'Tạo lập hồ sơ',
                url: '/dashboard/customer-management',
            },
            {
                title: 'Quản lý danh sách',
                url: '/dashboard/customer-management/customer-list',
            },
        ],
    },
]

interface DashboardLayoutProps {
    children: React.ReactNode
    defaultOpen?: boolean
}

export function DashboardLayout({ children, defaultOpen = true }: DashboardLayoutProps) {
    const currentPathname = usePathname()

    return (
        <SidebarProvider defaultOpen={defaultOpen}>
            <Sidebar collapsible="icon">
                <SidebarHeader className="border-b border-border">
                    <div className="flex items-center gap-2 px-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                            <BarChart3 className="h-4 w-4" />
                        </div>
                        <div className="grid flex-1 text-left text-sm leading-tight">
                            <span className="truncate font-semibold">Sepolia Health</span>
                            <span className="truncate text-xs text-sidebar-foreground/70">Admin Dashboard</span>
                        </div>
                    </div>
                </SidebarHeader>

                <SidebarContent className="gap-0 p-2">
                    <SidebarNavigationMenu
                        title="Chính"
                        linkComponent={Link}
                        items={MAIN_ITEMS}
                        currentPathname={currentPathname}
                    />
                    <SidebarNavigationMenu
                        title="Quản lý"
                        linkComponent={Link}
                        items={MANAGEMENT_ITEMS}
                        currentPathname={currentPathname}
                        className="mt-6"
                    />
                </SidebarContent>

                <SidebarFooter className="border-t border-border p-2">
                    <div className="flex items-center gap-2 px-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                            <span className="text-xs font-medium">N</span>
                        </div>
                        <div className="grid flex-1 text-left text-xs">
                            <span className="truncate text-sidebar-foreground/70">
                                localhost:3002/dashboard/overview
                            </span>
                        </div>
                    </div>
                </SidebarFooter>
            </Sidebar>

            <SidebarInset>
                <header className="sticky top-0 z-10 bg-background flex h-16 shrink-0 items-center gap-2 border-b w-full">
                    <div className="flex items-center justify-between px-6 w-full">
                        <div className="flex items-center space-x-4">
                            <ToggleLogo />
                        </div>
                        <div className="flex items-center space-x-4">
                            <ThemeSwitcher />
                            <Avatar className="ml-auto">
                                <AvatarFallback>HP</AvatarFallback>
                            </Avatar>
                        </div>
                    </div>
                </header>
                <div className="p-6">{children}</div>
            </SidebarInset>
        </SidebarProvider>
    )
}
