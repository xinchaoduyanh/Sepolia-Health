'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/shared/stores/auth.store'
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
    MessageSquare,
    Smartphone,
} from 'lucide-react'
import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
    SidebarGroup,
    SidebarGroupLabel,
} from '@workspace/ui/components/Sidebar'
import { SidebarNavigationMenu } from '@workspace/ui/components/Sidebar.helpers'

// Menu items cho ADMIN
const adminMenuItems = [
    {
        title: 'Tổng quan',
        url: '/admin/overview',
        icon: BarChart3,
    },
    {
        title: 'Sản phẩm',
        url: '/admin/products',
        icon: Package,
    },
    {
        title: 'Doanh thu',
        url: '/admin/revenue',
        icon: DollarSign,
    },
    {
        title: 'Thông tin & Chương trình',
        url: '/admin/info-programs',
        icon: FileText,
    },
    {
        title: 'Khuyến mại',
        url: '/admin/promotion-management',
        icon: Percent,
        items: [
            {
                title: 'Quản lý voucher',
                url: '/admin/promotion-management',
            },
            {
                title: 'Quản lý Voucher hiển thị',
                url: '/admin/promotion-display-management',
            },
        ],
    },
    {
        title: 'Câu hỏi thường gặp',
        url: '/admin/faq',
        icon: HelpCircle,
    },
    {
        title: 'Chăm sóc sức khỏe từ xa',
        url: '/admin/remote-healthcare',
        icon: Monitor,
        items: [
            {
                title: 'Danh sách đặt khám',
                url: '/admin/remote-healthcare/appointments',
            },
            {
                title: 'Đặt lịch khám',
                url: '/admin/remote-healthcare/schedule-appointment',
            },
            {
                title: 'Danh sách khách hàng',
                url: '/admin/remote-healthcare/customers',
            },
        ],
    },
]

// Management items chỉ dành cho ADMIN
const adminManagementItems = [
    {
        title: 'Quản lý sản phẩm',
        url: '/admin/product-management',
        icon: Package,
    },
    {
        title: 'Quản lý bác sĩ',
        url: '/admin/doctor-management',
        icon: Stethoscope,
    },
    {
        title: 'Quản lý bệnh nhân',
        url: '/admin/customer-management',
        icon: UserCheck,
    },
    {
        title: 'Quản lý lễ tân',
        url: '/admin/receptionist-management',
        icon: UserCheck,
    },
    {
        title: 'Quản lý khuyến mại',
        url: '/admin/promotion-management',
        icon: Percent,
    },
    {
        title: 'Quản lý cộng đồng hỏi đáp',
        url: '/admin/article-management',
        icon: ArticleIcon,
        items: [
            {
                title: 'Quản lý bài viết',
                url: '/admin/article-management/article-list',
            },
            {
                title: 'Quản lý Tags',
                url: '/admin/tag-management/tag-list',
            },
        ],
    },
    {
        title: 'Quản lý dịch vụ',
        url: '/admin/service-management',
        icon: Wrench,
    },
    {
        title: 'Quản lý phòng khám1',
        url: '/admin/clinic-management',
        icon: Building2,
    },
    {
        title: 'Quản lý Ứng dụng',
        url: '/admin/app-management',
        icon: Smartphone,
        items: [
            {
                title: 'Quy định sử dụng',
                url: '/admin/app-management/usage-regulations',
            },
            {
                title: 'Chính sách giải quyết',
                url: '/admin/app-management/dispute-resolution',
            },
            {
                title: 'Chính sách bảo vệ dữ liệu',
                url: '/admin/app-management/privacy-policy',
            },
            {
                title: 'Hỏi đáp về ứng dụng',
                url: '/admin/app-management/app-faq',
            },
        ],
    },
]

// Menu items cho DOCTOR
const doctorMenuItems = [
    {
        title: 'Lịch khám',
        url: '/doctor/schedule/appointments',
        icon: Monitor,
    },
    {
        title: 'Hồ sơ cá nhân',
        url: '/doctor/profile',
        icon: UserCheck,
    },
    {
        title: 'Quản lý lịch khám',
        url: '/doctor/schedule',
        icon: Monitor,
        items: [
            {
                title: 'Lịch cá nhân',
                url: '/doctor/schedule/personal',
            },
            {
                title: 'Danh sách khám',
                url: '/doctor/schedule/appointments',
            },
        ],
    },
    {
        title: 'Câu hỏi cộng đồng',
        url: '/doctor/qna',
        icon: MessageSquare,
    },
]

// Menu items cho RECEPTIONIST
const receptionistMenuItems = [
    {
        title: 'Đặt lịch cho bệnh nhân',
        url: '/receptionist/schedule-appointment',
        icon: Monitor,
    },
    {
        title: 'Tin nhắn',
        url: '/receptionist/messages',
        icon: FileText,
    },
]

export function RoleBasedSidebar() {
    const pathname = usePathname()
    const { user } = useAuthStore()

    // Determine menu items based on role
    const isAdmin = user?.role === 'ADMIN'
    const isDoctor = user?.role === 'DOCTOR'
    const isReceptionist = user?.role === 'RECEPTIONIST'

    let menuItems: typeof adminMenuItems
    if (isAdmin) {
        menuItems = adminMenuItems
    } else if (isDoctor) {
        menuItems = doctorMenuItems
    } else if (isReceptionist) {
        menuItems = receptionistMenuItems
    } else {
        menuItems = [] // Fallback
    }

    const dashboardLabel = isAdmin ? 'Admin Dashboard' : `${user?.role} Dashboard`

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader className="border-b border-sidebar-border">
                <div className="flex items-center gap-2 px-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <BarChart3 className="h-4 w-4" />
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold">Sepolia Health</span>
                        <span className="truncate text-xs text-sidebar-foreground/70">{dashboardLabel}</span>
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

                {/* Only show management section for ADMIN */}
                {isAdmin && (
                    <SidebarGroup>
                        <SidebarGroupLabel>Quản lý</SidebarGroupLabel>
                        <SidebarNavigationMenu
                            items={adminManagementItems}
                            currentPathname={pathname}
                            linkComponent={({ href, children }: { href: string; children: React.ReactNode }) => (
                                <Link href={href}>{children}</Link>
                            )}
                        />
                    </SidebarGroup>
                )}
            </SidebarContent>
        </Sidebar>
    )
}
