'use client'

import { useState, useEffect } from 'react'
import { useDoctorAppointment, useCreateOrUpdateAppointmentResult } from '@/shared/hooks'
import { Skeleton } from '@workspace/ui/components/Skeleton'
import { X, Save, Loader2 } from 'lucide-react'

interface AppointmentResultModalProps {
    isOpen: boolean
    onClose: () => void
    appointmentId: number
}

export function AppointmentResultModal({ isOpen, onClose, appointmentId }: AppointmentResultModalProps) {
    const { data: appointment, isLoading } = useDoctorAppointment(appointmentId, isOpen)
    const createOrUpdateMutation = useCreateOrUpdateAppointmentResult()

    const [formData, setFormData] = useState({
        diagnosis: '',
        notes: '',
        prescription: '',
        recommendations: '',
    })

    // Load existing result when appointment data is available
    useEffect(() => {
        if (appointment?.result) {
            setFormData({
                diagnosis: appointment.result.diagnosis || '',
                notes: appointment.result.notes || '',
                prescription: appointment.result.prescription || '',
                recommendations: appointment.result.recommendations || '',
            })
        } else {
            setFormData({
                diagnosis: '',
                notes: '',
                prescription: '',
                recommendations: '',
            })
        }
    }, [appointment])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            await createOrUpdateMutation.mutateAsync({
                appointmentId,
                data: {
                    diagnosis: formData.diagnosis || undefined,
                    notes: formData.notes || undefined,
                    prescription: formData.prescription || undefined,
                    recommendations: formData.recommendations || undefined,
                },
            })
            onClose()
        } catch (error) {
            console.error('Error saving result:', error)
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }))
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-card rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <h2 className="text-2xl font-bold text-foreground">
                        {appointment?.result ? 'Cập nhật kết quả khám' : 'Thêm kết quả khám'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
                        <X className="h-5 w-5 text-muted-foreground" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {isLoading ? (
                        <div className="space-y-4">
                            <Skeleton className="h-24 w-full" />
                            <Skeleton className="h-24 w-full" />
                            <Skeleton className="h-24 w-full" />
                            <Skeleton className="h-24 w-full" />
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Diagnosis */}
                            <div>
                                <label htmlFor="diagnosis" className="block text-sm font-medium text-foreground mb-2">
                                    Chẩn đoán <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    id="diagnosis"
                                    name="diagnosis"
                                    value={formData.diagnosis}
                                    onChange={handleChange}
                                    rows={3}
                                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                                    placeholder="Nhập chẩn đoán..."
                                    required
                                />
                            </div>

                            {/* Notes */}
                            <div>
                                <label htmlFor="notes" className="block text-sm font-medium text-foreground mb-2">
                                    Ghi chú
                                </label>
                                <textarea
                                    id="notes"
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleChange}
                                    rows={4}
                                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                                    placeholder="Nhập ghi chú của bác sĩ..."
                                />
                            </div>

                            {/* Prescription */}
                            <div>
                                <label
                                    htmlFor="prescription"
                                    className="block text-sm font-medium text-foreground mb-2"
                                >
                                    Đơn thuốc
                                </label>
                                <textarea
                                    id="prescription"
                                    name="prescription"
                                    value={formData.prescription}
                                    onChange={handleChange}
                                    rows={4}
                                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                                    placeholder="Nhập đơn thuốc (ví dụ: Paracetamol 500mg: 2 viên/lần, 3 lần/ngày sau ăn)..."
                                />
                            </div>

                            {/* Recommendations */}
                            <div>
                                <label
                                    htmlFor="recommendations"
                                    className="block text-sm font-medium text-foreground mb-2"
                                >
                                    Khuyến nghị, lời dặn
                                </label>
                                <textarea
                                    id="recommendations"
                                    name="recommendations"
                                    value={formData.recommendations}
                                    onChange={handleChange}
                                    rows={3}
                                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                                    placeholder="Nhập khuyến nghị, lời dặn cho bệnh nhân (ví dụ: Tái khám sau 1 tuần nếu không thuyên giảm)..."
                                />
                            </div>

                            {/* Patient Info */}
                            {appointment?.patient && (
                                <div className="p-4 bg-muted rounded-lg">
                                    <p className="text-sm font-medium text-foreground mb-2">Thông tin bệnh nhân:</p>
                                    <p className="text-sm text-muted-foreground">
                                        {appointment.patient.firstName} {appointment.patient.lastName} -{' '}
                                        {appointment.patient.phone}
                                    </p>
                                </div>
                            )}
                        </form>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-lg transition-colors"
                        disabled={createOrUpdateMutation.isPending}
                    >
                        Hủy
                    </button>
                    <button
                        type="submit"
                        onClick={handleSubmit}
                        disabled={createOrUpdateMutation.isPending || isLoading}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {createOrUpdateMutation.isPending ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Đang lưu...
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4" />
                                Lưu kết quả
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
