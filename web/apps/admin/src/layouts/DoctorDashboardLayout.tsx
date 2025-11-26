'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@workspace/ui/components/Avatar'
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
import { useDoctorProfile } from '@/shared/hooks/useDoctorProfile'
import Image from 'next/image'
import { Monitor, UserCheck, User, LogOut, MessageSquare } from 'lucide-react'
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

// Menu items cho DOCTOR
const DOCTOR_MAIN_ITEMS: Array<SidebarNavigationMenuItem> = [
    {
        title: 'Hồ sơ cá nhân',
        url: '/dashboard/doctor/profile',
        icon: UserCheck,
    },
    {
        title: 'Quản lý lịch khám',
        url: '/dashboard/doctor/schedule',
        icon: Monitor,
        items: [
            {
                title: 'Lịch cá nhân',
                url: '/dashboard/doctor/schedule/personal',
            },
            {
                title: 'Danh sách khám',
                url: '/dashboard/doctor/schedule/appointments',
            },
        ],
    },
    {
        title: 'Câu hỏi cộng đồng',
        url: '/dashboard/doctor/qna',
        icon: MessageSquare,
    },
]

interface DoctorDashboardLayoutProps {
    children: React.ReactNode
    defaultOpen?: boolean
}

export function DoctorDashboardLayout({ children, defaultOpen = true }: DoctorDashboardLayoutProps) {
    const _router = useRouter()
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const [isSidebarDropdownOpen, setIsSidebarDropdownOpen] = useState(false)
    const [isMounted, setIsMounted] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const sidebarDropdownRef = useRef<HTMLDivElement>(null)

    // Get doctor profile for avatar and name
    const { data: doctorProfile } = useDoctorProfile()

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

    // Get greeting based on time of day
    const getGreeting = () => {
        const hour = new Date().getHours()
        if (hour < 12) return 'Chào buổi sáng'
        if (hour < 18) return 'Chào buổi chiều'
        return 'Chào buổi tối'
    }

    const greeting = getGreeting()
    const doctorName = doctorProfile
        ? `Bác sĩ ${doctorProfile.lastName || ''} ${doctorProfile.firstName || ''}`.trim()
        : 'Bác sĩ'
    const doctorAvatar = doctorProfile?.avatar || null
    const doctorEmail = doctorProfile?.email || user?.email || 'doctor@sepolia.com'
    const doctorFullName = doctorProfile
        ? `${doctorProfile.lastName || ''} ${doctorProfile.firstName || ''}`.trim() || 'Doctor User'
        : 'Doctor User'

    return (
        <SidebarProvider defaultOpen={defaultOpen}>
            <Sidebar collapsible="icon">
                <SidebarHeader className="border-b-2 border-border bg-gradient-to-r from-primary/5 to-primary/10">
                    <div className="flex items-center gap-3 px-4 py-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg">
                            <Monitor className="h-5 w-5" />
                        </div>
                        <div className="grid flex-1 text-left text-sm leading-tight">
                            <span className="truncate font-bold text-foreground">Sepolia Healthcare</span>
                        </div>
                    </div>
                </SidebarHeader>

                <SidebarContent className="gap-0 p-2">
                    <SidebarNavigationMenu
                        title="Chính"
                        linkComponent={Link}
                        items={DOCTOR_MAIN_ITEMS}
                        currentPathname={currentPathname}
                    />
                </SidebarContent>

                <SidebarFooter className="border-t border-border p-2">
                    <div className="relative" ref={sidebarDropdownRef}>
                        <button
                            onClick={() => setIsSidebarDropdownOpen(!isSidebarDropdownOpen)}
                            className="w-full flex items-center gap-3 px-3 py-3 hover:bg-sidebar-accent rounded-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 group"
                        >
                            <Avatar className="h-10 w-10 border-2 border-primary/20">
                                {doctorAvatar ? <AvatarImage src={doctorAvatar} alt={doctorFullName} /> : null}
                                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-bold">
                                    {doctorFullName.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="grid flex-1 text-left text-xs">
                                <span className="truncate font-semibold text-sidebar-foreground">{doctorFullName}</span>
                                <span className="truncate text-sidebar-foreground/70">{doctorEmail}</span>
                            </div>
                        </button>

                        {isMounted && isSidebarDropdownOpen && (
                            <div className="absolute bottom-full right-0 mb-2 w-64 bg-popover border-2 border-border rounded-xl shadow-2xl z-50 overflow-hidden backdrop-blur-sm">
                                <div className="p-2">
                                    <div className="px-4 py-3 border-b border-border bg-gradient-to-r from-primary/5 to-primary/10 mb-1">
                                        <p className="text-sm font-semibold text-popover-foreground truncate">
                                            {doctorFullName}
                                        </p>
                                        <p className="text-xs text-muted-foreground truncate">{doctorEmail}</p>
                                    </div>
                                    <button
                                        onClick={handleAccountInfo}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-popover-foreground hover:bg-accent hover:text-accent-foreground rounded-lg transition-all duration-200 cursor-pointer"
                                    >
                                        <User className="w-4 h-4" />
                                        Thông tin tài khoản
                                    </button>
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950 dark:hover:text-red-300 rounded-lg transition-all duration-200 cursor-pointer"
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
                <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex h-16 shrink-0 items-center gap-2 border-b-2 border-border shadow-lg w-full">
                    <div className="flex items-center justify-between px-6 w-full">
                        <div className="flex items-center space-x-4">
                            <ToggleLogo />
                            <div className="h-8 w-px bg-border" />
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-foreground hidden sm:block">
                                    {greeting}, {doctorName}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <ThemeSwitcher />
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className="ml-auto cursor-pointer hover:opacity-80 transition-all duration-200 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-full shadow-md hover:shadow-lg"
                                >
                                    <Avatar className="border-2 border-primary/20">
                                        {doctorAvatar ? <AvatarImage src={doctorAvatar} alt={doctorFullName} /> : null}
                                        <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-bold">
                                            {doctorFullName.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                </button>

                                {isMounted && isDropdownOpen && (
                                    <div className="absolute right-0 top-full mt-2 w-64 bg-popover border-2 border-border rounded-xl shadow-2xl z-50 overflow-hidden backdrop-blur-sm">
                                        <div className="p-2">
                                            <div className="px-4 py-3 border-b border-border bg-gradient-to-r from-primary/5 to-primary/10">
                                                <p className="text-sm font-semibold text-popover-foreground truncate">
                                                    {doctorFullName}
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-1 truncate">
                                                    {doctorEmail}
                                                </p>
                                            </div>
                                            <button
                                                onClick={handleAccountInfo}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-popover-foreground hover:bg-accent hover:text-accent-foreground rounded-lg transition-all duration-200 cursor-pointer mt-1"
                                            >
                                                <User className="w-4 h-4" />
                                                Thông tin tài khoản
                                            </button>
                                            <button
                                                onClick={handleLogout}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950 dark:hover:text-red-300 rounded-lg transition-all duration-200 cursor-pointer mt-1"
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
