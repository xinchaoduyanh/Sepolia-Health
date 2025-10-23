'use client'

import { Phone, User } from 'lucide-react'
import Image from 'next/image'
import { ThemeSwitcher } from '@/shared/components/ThemeSwitcher'
import { SidebarTrigger } from '@workspace/ui/components/Sidebar'

export function Header() {
    return (
        <header className="bg-background border-b border-border px-6 py-3 flex items-center justify-between shadow-sm overflow-hidden">
            <div className="flex items-center space-x-4">
                {/* Sidebar Toggle */}
                <SidebarTrigger />

                {/* Logo */}
                <div className="flex items-center">
                    <div className="w-16 h-16 relative transform scale-[2] origin-left -ml-2">
                        <Image
                            src="/image/sepolia-icon.png"
                            alt="Sepolia Health Logo"
                            width={64}
                            height={64}
                            className="object-contain"
                        />
                    </div>
                </div>
            </div>

            <div className="flex items-center space-x-6">
                {/* Theme Switcher */}
                <ThemeSwitcher />

                {/* Contact button */}
                <button className="flex items-center space-x-2 px-4 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all duration-200">
                    <Phone className="w-4 h-4" />
                    <span className="font-medium">Liên hệ</span>
                </button>

                {/* Profile section */}
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-slate-700 dark:from-slate-500 dark:to-slate-600 rounded-full flex items-center justify-center shadow-md">
                        <User className="w-5 h-5 text-white" />
                    </div>
                </div>
            </div>
        </header>
    )
}
