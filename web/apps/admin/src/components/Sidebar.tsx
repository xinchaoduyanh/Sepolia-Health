'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    BarChart3,
    Package,
    DollarSign,
    FileText,
    Percent,
    HelpCircle,
    Monitor,
    Stethoscope,
    UserCheck,
    FileText as ArticleIcon,
    Wrench,
    Building2,
} from 'lucide-react'
import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
} from '@workspace/ui/components/Sidebar'
import { SidebarNavigationMenu } from '@workspace/ui/components/Sidebar.helpers'

const menuItems = [
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

const managementItems = [
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
        title: 'Quản lý bệnh nhân',
        url: '/dashboard/customer-management',
        icon: UserCheck,
    },
    {
        title: 'Quản lý lễ tân',
        url: '/dashboard/receptionist-management',
        icon: UserCheck,
    },
    {
        title: 'Quản lý khuyến mại',
        url: '/dashboard/promotion-management',
        icon: Percent,
    },
    {
        title: 'Quản lý bài viết',
        url: '/dashboard/article-management',
        icon: ArticleIcon,
    },
    {
        title: 'Quản lý dịch vụ',
        url: '/dashboard/service-management',
        icon: Wrench,
    },
    {
        title: 'Quản lý phòng khám',
        url: '/dashboard/clinic-management',
        icon: Building2,
    },
]

export function AdminSidebar() {
    const pathname = usePathname()

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader className="border-b border-sidebar-border">
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
                <SidebarGroup>
                    <SidebarGroupLabel>Chính</SidebarGroupLabel>
                    <SidebarNavigationMenu
                        items={menuItems}
                        currentPathname={pathname}
                        linkComponent={({ href, children }: { href: string; children: React.ReactNode }) => (
                            <Link href={href}>{children}</Link>
                        )}
                    />
                </SidebarGroup>

                <SidebarGroup>
                    <SidebarGroupLabel>Quản lý</SidebarGroupLabel>
                    <SidebarNavigationMenu
                        items={managementItems}
                        currentPathname={pathname}
                        linkComponent={({ href, children }: { href: string; children: React.ReactNode }) => (
                            <Link href={href}>{children}</Link>
                        )}
                    />
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    )
}
