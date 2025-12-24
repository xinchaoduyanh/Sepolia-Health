'use client'

import { Pagination } from '@workspace/ui/components/Pagination'
import { useState } from 'react'

import { useNotification } from '@/contexts/NotificationContext'
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/Card'
import { cn } from '@workspace/ui/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
import { AlertCircle, Bell, Calendar, CreditCard, Edit, Info, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function NotificationsPage() {
    const { notifications, markAsRead } = useNotification()
    const router = useRouter()
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10

    const handleNotificationClick = async (id: string, metadata?: any) => {
        await markAsRead(id)

        // Navigate based on metadata if available
        if (metadata?.appointmentId) {
            router.push(`/doctor/schedule/appointments?id=${metadata.appointmentId}`)
        }
    }

    const getIcon = (type: string) => {
        switch (type) {
            case 'CREATE_APPOINTMENT_PATIENT':
            case 'CREATE_APPOINTMENT':
                return <Calendar className="h-5 w-5 text-green-600" />
            case 'UPDATE_APPOINTMENT_PATIENT':
            case 'UPDATE_APPOINTMENT':
                return <Edit className="h-5 w-5 text-blue-600" />
            case 'DELETE_APPOINTMENT_PATIENT':
            case 'DELETE_APPOINTMENT':
            case 'CANCEL_APPOINTMENT':
                return <Trash2 className="h-5 w-5 text-red-600" />
            case 'PAYMENT_SUCCESS':
                return <CreditCard className="h-5 w-5 text-green-600" />
            case 'PAYMENT_FAILED':
                return <AlertCircle className="h-5 w-5 text-red-600" />
            default:
                return <Info className="h-5 w-5 text-blue-500" />
        }
    }

    const getBgColor = (type: string) => {
        switch (type) {
            case 'CREATE_APPOINTMENT_PATIENT':
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

    const pageCount = Math.ceil(notifications.length / itemsPerPage)
    const paginatedNotifications = notifications.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

    return (
        <div className="container mx-auto w-full space-y-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Thông báo</h1>
                    <p className="text-muted-foreground">
                        Cập nhật các hoạt động mới nhất liên quan đến lịch khám của bạn.
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Tất cả thông báo</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="min-h-[500px] p-6">
                        {notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <div className="mb-4 rounded-full bg-muted/50 p-6">
                                    <Bell className="h-12 w-12 text-muted-foreground/30" />
                                </div>
                                <h3 className="text-xl font-semibold text-foreground">Không có thông báo nào</h3>
                                <p className="mt-2 max-w-sm text-muted-foreground">
                                    Bạn chưa có thông báo nào mới. Khi có lịch hẹn hoặc cập nhật mới, chúng sẽ xuất hiện
                                    ở đây.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {paginatedNotifications.map(notification => (
                                    <div
                                        key={notification.id}
                                        className={cn(
                                            'group relative flex cursor-pointer gap-4 rounded-xl border bg-card p-4 transition-all hover:shadow-md hover:border-primary/20',
                                            notification.status === 'UNREAD' ? 'bg-blue-50/30' : '',
                                        )}
                                        onClick={() => handleNotificationClick(notification.id, notification.metadata)}
                                    >
                                        {/* Unread Indicator Bar */}
                                        {notification.status === 'UNREAD' && (
                                            <div className="absolute left-0 top-3 bottom-3 w-1 rounded-r-md bg-blue-600" />
                                        )}

                                        <div
                                            className={cn(
                                                'mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border shadow-sm transition-transform group-hover:scale-105',
                                                getBgColor(notification.type),
                                                'bg-opacity-20 border-transparent',
                                            )}
                                        >
                                            {getIcon(notification.type)}
                                        </div>

                                        <div className="flex-1 space-y-1.5">
                                            <div className="flex items-start justify-between gap-4">
                                                <h4
                                                    className={cn(
                                                        'font-semibold leading-none tracking-tight',
                                                        notification.status === 'UNREAD'
                                                            ? 'text-primary'
                                                            : 'text-foreground',
                                                    )}
                                                >
                                                    {notification.title}
                                                </h4>
                                                <span className="shrink-0 text-xs font-medium text-muted-foreground/70 bg-muted/50 px-2 py-1 rounded-md">
                                                    {formatDistanceToNow(new Date(notification.createdAt), {
                                                        addSuffix: true,
                                                        locale: vi,
                                                    })}
                                                </span>
                                            </div>
                                            <p className="text-sm text-muted-foreground leading-relaxed">
                                                {notification.message}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    {pageCount > 1 && (
                        <div className="flex items-center justify-center py-4 border-t">
                            <Pagination pageCount={pageCount} value={currentPage} onChange={setCurrentPage} />
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
