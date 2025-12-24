'use client'

import { Button } from '@workspace/ui/components/Button'
import { Popover, PopoverDialog, PopoverTrigger } from '@workspace/ui/components/Popover'
import { cn } from '@workspace/ui/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
import { AlertCircle, Bell, Calendar, CreditCard, Edit, Info, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useNotification } from '../../contexts/NotificationContext'

export function NotificationPopover() {
    const { notifications, unreadCount, markAsRead } = useNotification()
    const router = useRouter()

    const handleNotificationClick = async (id: string, metadata?: any) => {
        await markAsRead(id)

        // For online appointments, maybe open join/host URL if available
        if (metadata?.hostUrl) {
            window.open(metadata.hostUrl, '_blank')
            return
        }

        // Navigate based on metadata if available
        if (metadata?.appointmentId) {
            // For now, assume doctor appointments url path
            router.push(`/doctor/schedule/appointments?id=${metadata.appointmentId}`)
        }
    }

    const getIcon = (type: string) => {
        switch (type) {
            case 'CREATE_APPOINTMENT_PATIENT':
            case 'CREATE_APPOINTMENT_DOCTOR':
            case 'CREATE_APPOINTMENT':
                return <Calendar className="h-4 w-4 text-green-600" />
            case 'UPDATE_APPOINTMENT_PATIENT':
            case 'UPDATE_APPOINTMENT':
                return <Edit className="h-4 w-4 text-blue-600" />
            case 'DELETE_APPOINTMENT_PATIENT':
            case 'DELETE_APPOINTMENT':
            case 'CANCEL_APPOINTMENT':
                return <Trash2 className="h-4 w-4 text-red-600" />
            case 'PAYMENT_SUCCESS':
                return <CreditCard className="h-4 w-4 text-green-600" />
            case 'PAYMENT_FAILED':
                return <AlertCircle className="h-4 w-4 text-red-600" />
            default:
                return <Info className="h-4 w-4 text-blue-500" />
        }
    }

    const getBgColor = (type: string) => {
        switch (type) {
            case 'CREATE_APPOINTMENT_PATIENT':
            case 'CREATE_APPOINTMENT_DOCTOR':
            case 'CREATE_APPOINTMENT':
                return 'bg-green-100'
            case 'UPDATE_APPOINTMENT_PATIENT':
            case 'UPDATE_APPOINTMENT':
                return 'bg-blue-100'
            case 'DELETE_APPOINTMENT_PATIENT':
            case 'DELETE_APPOINTMENT':
            case 'CANCEL_APPOINTMENT':
                return 'bg-red-100'
            case 'PAYMENT_SUCCESS':
                return 'bg-green-100'
            case 'PAYMENT_FAILED':
                return 'bg-red-100'
            default:
                return 'bg-blue-50'
        }
    }

    return (
        <PopoverTrigger>
            <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
                        {unreadCount}
                    </span>
                )}
            </Button>
            <Popover className="w-80 p-0" placement="bottom end">
                <PopoverDialog className="p-0 overflow-hidden rounded-xl border-border/50 shadow-xl">
                    <div className="flex items-center justify-between border-b px-4 py-3 bg-muted/30 backdrop-blur-sm">
                        <h4 className="font-semibold text-sm">Thông báo</h4>
                        {unreadCount > 0 && (
                            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                                {unreadCount} mới
                            </span>
                        )}
                    </div>
                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                                <div className="mb-3 rounded-full bg-muted/50 p-3">
                                    <Bell className="h-6 w-6 opacity-30" />
                                </div>
                                <p className="text-sm font-medium">Không có thông báo nào</p>
                                <p className="text-xs text-muted-foreground mt-1">Bạn đã xem hết tất cả thông báo</p>
                            </div>
                        ) : (
                            <div className="flex flex-col divide-y divide-border/40">
                                {notifications.map(notification => (
                                    <button
                                        key={notification.id}
                                        className={cn(
                                            'group relative flex w-full gap-3 px-4 py-4 text-left transition-all hover:bg-muted/40',
                                            notification.status === 'UNREAD' ? 'bg-blue-50/60' : '',
                                        )}
                                        onClick={() => handleNotificationClick(notification.id, notification.metadata)}
                                    >
                                        <div
                                            className={cn(
                                                'relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border shadow-sm',
                                                getBgColor(notification.type),
                                                'bg-opacity-20 border-transparent', // Lighter bg for icon
                                            )}
                                        >
                                            {getIcon(notification.type)}
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-start justify-between gap-2">
                                                <p
                                                    className={cn(
                                                        'text-sm font-semibold leading-tight',
                                                        notification.status === 'UNREAD'
                                                            ? 'text-foreground'
                                                            : 'text-muted-foreground',
                                                    )}
                                                >
                                                    {notification.title}
                                                </p>
                                                <span className="shrink-0 text-[10px] font-medium text-muted-foreground/70">
                                                    {formatDistanceToNow(new Date(notification.createdAt), {
                                                        addSuffix: true,
                                                        locale: vi,
                                                    })}
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                                {notification.message}
                                            </p>
                                        </div>
                                        {notification.status === 'UNREAD' && (
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                                <span className="flex h-2 w-2 rounded-full bg-blue-600 ring-4 ring-blue-50/50" />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="border-t bg-muted/20 p-2">
                        <Button
                            variant="ghost"
                            className="w-full justify-center h-8 text-xs font-medium text-primary hover:bg-primary/5 hover:text-primary"
                            onClick={() => router.push('/doctor/notifications')}
                        >
                            Xem tất cả thông báo
                        </Button>
                    </div>
                </PopoverDialog>
            </Popover>
        </PopoverTrigger>
    )
}
