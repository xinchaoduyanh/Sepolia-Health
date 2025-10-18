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
    ChevronDown,
    Dot,
    User,
    Stethoscope,
    Users,
    Settings,
} from 'lucide-react'
import { useState } from 'react'
import Image from 'next/image'

const menuItems = [
    {
        id: 'overview',
        label: 'Tổng quan',
        icon: BarChart3,
        href: '/dashboard/overview',
    },
    {
        id: 'products',
        label: 'Sản phẩm',
        icon: Package,
        href: '/dashboard/products',
    },
    {
        id: 'revenue',
        label: 'Doanh thu',
        icon: DollarSign,
        href: '/dashboard/revenue',
    },
    {
        id: 'info-programs',
        label: 'Thông tin & Chương trình',
        icon: FileText,
        href: '/dashboard/info-programs',
    },
    {
        id: 'promotions',
        label: 'Khuyến mại',
        icon: Percent,
        href: '/dashboard/promotions',
    },
    {
        id: 'faq',
        label: 'Câu hỏi thường gặp',
        icon: HelpCircle,
        href: '/dashboard/faq',
    },
    {
        id: 'remote-healthcare',
        label: 'Chăm sóc sức khỏe từ xa',
        icon: Monitor,
        hasSubmenu: true,
        submenu: [
            {
                id: 'appointments',
                label: 'Danh sách đặt khám',
                href: '/dashboard/remote-healthcare/appointments',
            },
            {
                id: 'schedule-appointment',
                label: 'Đặt lịch khám',
                href: '/dashboard/remote-healthcare/schedule-appointment',
            },
            {
                id: 'customers',
                label: 'Danh sách khách hàng',
                href: '/dashboard/remote-healthcare/customers',
            },
        ],
    },
    {
        id: 'product-management',
        label: 'Quản lý sản phẩm',
        icon: Dot,
        href: '/dashboard/product-management',
    },
    {
        id: 'doctor-management',
        label: 'Quản lý bác sĩ',
        icon: Stethoscope,
        href: '/dashboard/doctor-management',
    },
    {
        id: 'promotion-management',
        label: 'Quản lý khuyến mại',
        icon: Dot,
        href: '/dashboard/promotion-management',
    },
    {
        id: 'user-management',
        label: 'Quản lý người dùng',
        icon: Users,
        href: '/dashboard/user-management',
    },
]

export function Sidebar() {
    const pathname = usePathname()
    const [expandedItems, setExpandedItems] = useState<string[]>(['remote-healthcare'])

    const toggleExpanded = (itemId: string) => {
        setExpandedItems(prev => (prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]))
    }

    const isActive = (href: string) => pathname === href
    const isParentActive = (submenu: any[]) => submenu.some(item => isActive(item.href))

    return (
        <aside className="w-64 bg-card border-r border-border h-[calc(100vh-80px)] flex flex-col shadow-sm">
            {/* Logo */}

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2">
                {menuItems.map(item => {
                    const Icon = item.icon
                    const isItemActive = isActive(item.href || '')
                    const isParentItemActive = item.submenu ? isParentActive(item.submenu) : false
                    const isExpanded = expandedItems.includes(item.id)

                    return (
                        <div key={item.id}>
                            {item.hasSubmenu ? (
                                <div>
                                    <button
                                        onClick={() => toggleExpanded(item.id)}
                                        className={`w-full flex items-center justify-between px-3 py-3 text-left rounded-lg transition-all duration-200 ${
                                            isParentItemActive
                                                ? 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 shadow-sm'
                                                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:shadow-sm'
                                        }`}
                                    >
                                        <div className="flex items-center space-x-3">
                                            <Icon className="w-5 h-5" />
                                            <span className="text-sm font-medium">{item.label}</span>
                                        </div>
                                        <ChevronDown
                                            className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                        />
                                    </button>

                                    {isExpanded && item.submenu && (
                                        <div className="ml-6 mt-2 space-y-1">
                                            {item.submenu.map(subItem => (
                                                <Link
                                                    key={subItem.id}
                                                    href={subItem.href}
                                                    className={`flex items-center space-x-3 px-3 py-2 text-sm rounded-lg transition-all duration-200 ${
                                                        isActive(subItem.href)
                                                            ? 'bg-slate-200 text-slate-900 dark:bg-slate-700 dark:text-slate-100 font-medium shadow-sm'
                                                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200'
                                                    }`}
                                                >
                                                    <Dot className="w-4 h-4" />
                                                    <span>{subItem.label}</span>
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <Link
                                    href={item.href || '#'}
                                    className={`flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200 ${
                                        isItemActive
                                            ? 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 shadow-sm'
                                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:shadow-sm'
                                    }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span className="text-sm font-medium">{item.label}</span>
                                </Link>
                            )}
                        </div>
                    )
                })}
            </nav>
        </aside>
    )
}
