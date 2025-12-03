'use client'

import { useState } from 'react'
import {
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogOverlay,
    DialogTitle,
} from '@workspace/ui/components/Dialog'
import { Button } from '@workspace/ui/components/Button'
import { AlertCircle, Lock, Unlock, Trash2 } from 'lucide-react'
import { useDeleteDoctor, useUpdateDoctorStatus } from '@/shared/hooks'
import type { Doctor } from '@/shared/lib/api-services/doctors.service'

interface DoctorActionDialogProps {
    doctor: Doctor
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function DoctorActionDialog({ doctor, open, onOpenChange }: DoctorActionDialogProps) {
    const [selectedAction, setSelectedAction] = useState<'delete' | 'toggle-status' | null>(null)
    const deleteDoctor = useDeleteDoctor()
    const updateDoctorStatus = useUpdateDoctorStatus()

    const isActive = doctor.status === 'ACTIVE'

    const handleConfirm = async () => {
        if (!selectedAction) return

        try {
            if (selectedAction === 'delete') {
                await deleteDoctor.mutateAsync(doctor.id)
            } else if (selectedAction === 'toggle-status') {
                const newStatus = isActive ? 'DEACTIVE' : 'ACTIVE'
                await updateDoctorStatus.mutateAsync({ id: doctor.id, status: newStatus })
            }
            onOpenChange(false)
            setSelectedAction(null)
        } catch (error) {
            console.error('Error:', error)
        }
    }

    const handleCancel = () => {
        onOpenChange(false)
        setSelectedAction(null)
    }

    const isPending = deleteDoctor.isPending || updateDoctorStatus.isPending

    return (
        <DialogOverlay isOpen={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Chọn thao tác</DialogTitle>
                    <DialogDescription>
                        Bạn muốn thực hiện thao tác nào với bác sĩ <strong>{doctor.fullName}</strong>?
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 py-4">
                    {/* Option 1: Toggle Status (Tạm khóa/Mở lại) */}
                    <button
                        onClick={() => setSelectedAction('toggle-status')}
                        className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                            selectedAction === 'toggle-status'
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-primary/50'
                        }`}
                        disabled={isPending}
                    >
                        <div className="flex items-start space-x-3">
                            {isActive ? (
                                <Lock className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                            ) : (
                                <Unlock className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                            )}
                            <div className="flex-1">
                                <div className="font-semibold text-foreground">
                                    {isActive ? 'Tạm khóa tài khoản' : 'Mở lại tài khoản'}
                                </div>
                                <div className="text-sm text-muted-foreground mt-1">
                                    {isActive
                                        ? 'Bác sĩ sẽ không thể đăng nhập vào hệ thống. Có thể mở lại bất cứ lúc nào.'
                                        : 'Bác sĩ sẽ có thể đăng nhập và sử dụng hệ thống trở lại.'}
                                </div>
                            </div>
                        </div>
                    </button>

                    {/* Option 2: Soft Delete */}
                    <button
                        onClick={() => setSelectedAction('delete')}
                        className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                            selectedAction === 'delete'
                                ? 'border-red-500 bg-red-50 dark:bg-red-950/20'
                                : 'border-border hover:border-red-500/50'
                        }`}
                        disabled={isPending}
                    >
                        <div className="flex items-start space-x-3">
                            <Trash2 className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                                <div className="font-semibold text-foreground">Xóa bác sĩ</div>
                                <div className="text-sm text-muted-foreground mt-1">
                                    Bác sĩ sẽ bị ẩn khỏi danh sách quản lý. Dữ liệu được đánh dấu đã xóa.
                                </div>
                            </div>
                        </div>
                    </button>

                    {/* Warning for delete */}
                    {selectedAction === 'delete' && (
                        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-start space-x-2">
                            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                            <div className="text-sm text-red-700 dark:text-red-300">
                                <strong>Lưu ý:</strong> Thao tác này sẽ ẩn bác sĩ khỏi danh sách quản lý. Dữ liệu được
                                đánh dấu đã xóa và không thể khôi phục từ giao diện.
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleCancel} isDisabled={isPending}>
                        Hủy
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        isDisabled={!selectedAction || isPending}
                        variant={selectedAction === 'delete' ? 'destructive' : 'default'}
                    >
                        {isPending ? 'Đang xử lý...' : 'Xác nhận'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </DialogOverlay>
    )
}
