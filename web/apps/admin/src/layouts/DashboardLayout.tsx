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
import { useAuth, useAdminLogout } from '@/shared/hooks/useAuth'
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
    User,
    LogOut,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'

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
                url: '/dashboard/customer-management/create',
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
    const _router = useRouter()
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const [isSidebarDropdownOpen, setIsSidebarDropdownOpen] = useState(false)
    const [isMounted, setIsMounted] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const sidebarDropdownRef = useRef<HTMLDivElement>(null)

    // Fix hydration mismatch by ensuring client-side rendering
    useEffect(() => {
        setIsMounted(true)
    }, [])

    const handleAccountInfo = () => {
        // TODO: Navigate to account info page or open modal
        console.log('Navigate to account info')
        setIsDropdownOpen(false)
        setIsSidebarDropdownOpen(false)
        // router.push('/dashboard/account')
    }

    const { user } = useAuth()
    const logoutMutation = useAdminLogout()

    const handleLogout = () => {
        logoutMutation.mutate()
        setIsDropdownOpen(false)
        setIsSidebarDropdownOpen(false)
        // Navigation is handled by the logout mutation
    }

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false)
            }
            if (sidebarDropdownRef.current && !sidebarDropdownRef.current.contains(event.target as Node)) {
                setIsSidebarDropdownOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [])
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
                    <div className="relative" ref={sidebarDropdownRef}>
                        <button
                            onClick={() => setIsSidebarDropdownOpen(!isSidebarDropdownOpen)}
                            className="w-full flex items-center gap-3 px-2 py-2 hover:bg-sidebar-accent rounded-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2"
                        >
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                <span className="text-sm font-medium">HP</span>
                            </div>
                            <div className="grid flex-1 text-left text-xs">
                                <span className="truncate font-medium text-sidebar-foreground">Admin User</span>
                                <span className="truncate text-sidebar-foreground/70">admin@sepolia.com</span>
                            </div>
                        </button>

                        {isMounted && isSidebarDropdownOpen && (
                            <div className="absolute bottom-full right-0 mb-2 w-56 bg-popover border border-border rounded-lg shadow-popover z-50">
                                <div className="p-1">
                                    <button
                                        onClick={handleAccountInfo}
                                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-popover-foreground hover:bg-accent hover:text-accent-foreground rounded-sm transition-colors cursor-pointer"
                                    >
                                        <User className="w-4 h-4" />
                                        Thông tin tài khoản
                                    </button>
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950 dark:hover:text-red-300 rounded-sm transition-colors cursor-pointer"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Đăng xuất
                                    </button>
                                </div>
                            </div>
                        )}
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
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className="ml-auto cursor-pointer hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
                                >
                                    <Avatar>
                                        <AvatarFallback className="bg-primary text-primary-foreground">
                                            {user?.email ? user.email.charAt(0).toUpperCase() : 'A'}
                                        </AvatarFallback>
                                    </Avatar>
                                </button>

                                {isMounted && isDropdownOpen && (
                                    <div className="absolute right-0 top-full mt-2 w-56 bg-popover border border-border rounded-lg shadow-popover z-50">
                                        <div className="p-1">
                                            <div className="px-3 py-2 border-b border-border">
                                                <p className="text-sm font-medium text-popover-foreground">
                                                    {user?.email || 'admin@sepoliahealth.com'}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {user?.email || 'admin@sepoliahealth.com'}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    Role: {user?.role || 'ADMIN'}
                                                </p>
                                            </div>
                                            <button
                                                onClick={handleAccountInfo}
                                                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-popover-foreground hover:bg-accent hover:text-accent-foreground rounded-sm transition-colors cursor-pointer"
                                            >
                                                <User className="w-4 h-4" />
                                                Thông tin tài khoản
                                            </button>
                                            <button
                                                onClick={handleLogout}
                                                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950 dark:hover:text-red-300 rounded-sm transition-colors cursor-pointer"
                                            >
                                                <LogOut className="w-4 h-4" />
                                                Đăng xuất
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </header>
                <div className="p-6">{children}</div>
            </SidebarInset>
        </SidebarProvider>
    )
}
