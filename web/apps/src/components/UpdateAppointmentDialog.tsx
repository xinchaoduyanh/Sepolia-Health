'use client'

import { useState, useEffect } from 'react'
import { DialogOverlay, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@workspace/ui/components/Dialog'
import { Button } from '@workspace/ui/components/Button'
import { Label } from '@workspace/ui/components/Label'
import { TextArea } from '@workspace/ui/components/Textfield'
import { useQuery } from '@tanstack/react-query'
import { receptionistApi, type TimeSlot } from '@/lib/api/receptionist'
import { doctorServicesApi } from '@/lib/api/doctor-services'
import { useUpdateAppointment } from '@/shared/hooks'
import { toast } from '@workspace/ui/components/Sonner'
import { Calendar, Clock, Loader2 } from 'lucide-react'
import { formatDate, formatTime } from '@/util/datetime'

interface UpdateAppointmentDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    appointment: any
    onSuccess?: () => void
}

interface AppointmentFormState {
    clinicId: number
    serviceId: number
    doctorId: number
    doctorServiceId: number
    date: string
    selectedTimeSlot: TimeSlot | null
    notes: string
}

export function UpdateAppointmentDialog({
    open,
    onOpenChange,
    appointment,
    onSuccess,
}: UpdateAppointmentDialogProps) {
    const [formState, setFormState] = useState<AppointmentFormState>({
        clinicId: 0,
        serviceId: 0,
        doctorId: 0,
        doctorServiceId: 0,
        date: '',
        selectedTimeSlot: null,
        notes: '',
    })

    const updateMutation = useUpdateAppointment()

    // Reset/Pre-fill form when opening
    useEffect(() => {
        if (open && appointment) {
            const startTime = new Date(appointment.startTime)
            const dateStr = startTime.toISOString().split('T')[0] || ''
            const timeStr = startTime.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })

            // Note: We can't set doctorServiceId yet, need to find it from the list
            setFormState({
                clinicId: appointment.clinic?.id || 0,
                serviceId: appointment.service?.id || 0,
                doctorId: appointment.doctor?.id || 0,
                doctorServiceId: 0, // Will be set after fetching doctor services
                date: dateStr,
                selectedTimeSlot: {
                    startTime: timeStr,
                    endTime: new Date(appointment.endTime).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
                    displayTime: `${timeStr} - ...` // Display time approximation
                },
                notes: appointment.notes || '',
            })
        }
    }, [open, appointment])

    // API Queries
    const { data: clinics = [] } = useQuery({
        queryKey: ['receptionist-clinics'],
        queryFn: () => receptionistApi.getLocations(),
        enabled: open,
    })

    const { data: services = [] } = useQuery({
        queryKey: ['receptionist-services'],
        queryFn: () => receptionistApi.getServices(),
        enabled: open,
    })

    // Get doctor services when both clinic and service are selected
    const { data: doctorServices = [] } = useQuery({
        queryKey: ['doctorServices', formState.clinicId, formState.serviceId],
        queryFn: () =>
            doctorServicesApi.getDoctorServices({
                serviceId: formState.serviceId,
                locationId: formState.clinicId,
            }),
        enabled: formState.clinicId > 0 && formState.serviceId > 0 && open,
    })

    // Auto-select doctorServiceId if we have doctorId and the list loads
    useEffect(() => {
        if (doctorServices.length > 0 && formState.doctorId && !formState.doctorServiceId) {
            const match = doctorServices.find(ds => ds.doctorId === formState.doctorId)
            if (match) {
                setFormState(prev => ({ ...prev, doctorServiceId: match.id }))
            }
        }
    }, [doctorServices, formState.doctorId, formState.doctorServiceId])

    // Get available time slots
    const { data: availabilityData, isLoading: isLoadingTimeSlots } = useQuery({
        queryKey: ['doctorAvailability', formState.doctorServiceId, formState.date],
        queryFn: () => receptionistApi.getDoctorAvailability(formState.doctorServiceId, formState.date),
        enabled: formState.doctorServiceId > 0 && formState.date !== '' && open,
    })

    // Handlers
    const handleServiceChange = (serviceId: number) => {
        setFormState(prev => ({
            ...prev,
            serviceId,
            doctorId: 0,
            doctorServiceId: 0,
            selectedTimeSlot: null,
        }))
    }

    const handleDoctorServiceChange = (doctorServiceId: number) => {
        const selectedDoctorService = doctorServices?.find(ds => ds.id === doctorServiceId)

        if (selectedDoctorService) {
            setFormState(prev => ({
                ...prev,
                doctorId: selectedDoctorService.doctorId,
                doctorServiceId: selectedDoctorService.id,
                selectedTimeSlot: null,
            }))
        }
    }

    const handleDateChange = (date: string) => {
        setFormState(prev => ({
            ...prev,
            date,
            selectedTimeSlot: null,
        }))
    }

    const handleTimeSlotSelect = (timeSlot: TimeSlot) => {
        setFormState(prev => ({
            ...prev,
            selectedTimeSlot: timeSlot,
        }))
    }

    const handleSubmit = async () => {
        if (!formState.doctorServiceId || !formState.date || !formState.selectedTimeSlot) {
            toast.error({ title: 'Lỗi', description: 'Vui lòng chọn đầy đủ thông tin (Bác sĩ, Ngày, Giờ)' })
            return
        }

        const startDateTime = `${formState.date}T${formState.selectedTimeSlot.startTime}:00`

        try {
            await updateMutation.mutateAsync({
                appointmentId: appointment.id,
                data: {
                    startTime: new Date(startDateTime).toISOString(),
                    notes: formState.notes,
                    doctorServiceId: formState.doctorServiceId !== 0 ? formState.doctorServiceId : undefined
                }
            })

            toast.success({ title: 'Thành công', description: 'Cập nhật lịch hẹn thành công' })
            onSuccess?.()
            onOpenChange(false)
        } catch (error: any) {
            toast.error({ title: 'Lỗi', description: error?.response?.data?.message || 'Có lỗi xảy ra khi cập nhật lịch hẹn' })
        }
    }

    return (
        <DialogOverlay isOpen={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Đổi lịch hẹn</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label>Cơ sở khám</Label>
                            <select
                                className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-md"
                                value={formState.clinicId}
                                onChange={e => setFormState(prev => ({ ...prev, clinicId: Number(e.target.value) }))}
                            >
                                <option value={0}>Chọn cơ sở</option>
                                {clinics.map(clinic => (
                                    <option key={clinic.id} value={clinic.id}>{clinic.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <Label>Dịch vụ</Label>
                            <select
                                className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-md"
                                value={formState.serviceId}
                                onChange={e => handleServiceChange(Number(e.target.value))}
                            >
                                <option value={0}>Chọn dịch vụ</option>
                                {services.map(service => (
                                    <option key={service.id} value={service.id}>{service.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <Label>Bác sĩ</Label>
                            <select
                                className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-md"
                                value={formState.doctorServiceId}
                                onChange={e => handleDoctorServiceChange(Number(e.target.value))}
                                disabled={!formState.clinicId || !formState.serviceId}
                            >
                                <option value={0}>Chọn bác sĩ</option>
                                {doctorServices.map(ds => (
                                    <option key={ds.id} value={ds.id}>
                                        {ds.doctor.firstName} {ds.doctor.lastName}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <Label>Ngày khám</Label>
                            <input
                                type="date"
                                className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-md"
                                value={formState.date}
                                onChange={e => handleDateChange(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Giờ khám</Label>
                        {formState.doctorServiceId > 0 && formState.date ? (
                            isLoadingTimeSlots ? (
                                <div className="flex justify-center p-4">
                                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                </div>
                            ) : availabilityData?.availableTimeSlots.length === 0 ? (
                                <div className="p-4 bg-yellow-50 text-yellow-700 rounded-md text-sm border border-yellow-200">
                                    Không có lịch trống trong ngày này
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                                    {/* Display current slot if it's not in the available list (because it's taken by THIS appointment) */}
                                    {/* Actually, the backend excludes current appointment from conflict check, so it SHOULD be in available list if we updated query properly 
                                        BUT availability endpoint doesn't know exclusion. 
                                        So current slot might show as 'booked' if we don't handle it.
                                        For now, simpliest is to just rely on available slots.
                                        If user wants to keep same time, they might need to see it.
                                    */}
                                    {availabilityData?.availableTimeSlots.map(slot => (
                                        <button
                                            key={`${slot.startTime}-${slot.endTime}`}
                                            type="button"
                                            onClick={() => handleTimeSlotSelect(slot)}
                                            className={`p-2 text-sm rounded border transition-colors ${formState.selectedTimeSlot?.startTime === slot.startTime
                                                ? 'bg-primary text-primary-foreground border-primary'
                                                : 'hover:bg-accent'
                                                }`}
                                        >
                                            {slot.displayTime}
                                        </button>
                                    ))}
                                </div>
                            )
                        ) : (
                            <div className="p-4 bg-muted/50 text-muted-foreground rounded-md text-sm text-center">
                                Vui lòng chọn bác sĩ và ngày khám
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label>Ghi chú</Label>
                        <TextArea
                            value={formState.notes}
                            onChange={e => setFormState(prev => ({ ...prev, notes: e.target.value }))}
                            placeholder="Ghi chú thêm..."
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Hủy
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        isDisabled={updateMutation.isPending}
                    >
                        {updateMutation.isPending ? 'Đang cập nhật...' : 'Lưu thay đổi'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </DialogOverlay>
    )
}
