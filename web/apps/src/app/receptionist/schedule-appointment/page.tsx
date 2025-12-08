'use client'

import { useState } from 'react'
import { Button } from '@workspace/ui/components/Button'
import { ArrowLeft, Search, Plus, Calendar, Clock, User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery } from '@tanstack/react-query'
import { doctorServicesApi } from '@/lib/api/doctor-services'
import { receptionistApi, type TimeSlot } from '@/lib/api/receptionist'
import type {
    FindPatientRequest,
    CreatePatientAccountRequest,
    CreateAppointmentForPatientRequest,
    PatientProfile,
} from '@/types/receptionist'

type Step = 'search' | 'patient-info' | 'appointment' | 'confirmation'

interface PatientInfo {
    email: string
    firstName: string
    lastName: string
    phone: string
    dateOfBirth: string
    gender: 'MALE' | 'FEMALE'
    idCardNumber?: string
    address?: string
    occupation?: string
    nationality?: string
}

interface AppointmentInfo {
    clinicId: number
    serviceId: number
    doctorId: number
    doctorServiceId: number
    date: string
    selectedTimeSlot: TimeSlot | null
    notes?: string
}

const inputClassName =
    'w-full px-3 py-2 bg-background border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed'

export default function ScheduleAppointmentPage() {
    const router = useRouter()
    const [currentStep, setCurrentStep] = useState<Step>('search')
    const [searchEmail, setSearchEmail] = useState('')
    const [foundPatient, setFoundPatient] = useState<{
        user: any
        patientProfiles: PatientProfile[]
    } | null>(null)
    const [selectedProfile, setSelectedProfile] = useState<PatientProfile | null>(null)
    const [patientInfo, setPatientInfo] = useState<PatientInfo>({
        email: '',
        firstName: '',
        lastName: '',
        phone: '',
        dateOfBirth: '',
        gender: 'MALE',
        idCardNumber: '',
        address: '',
        occupation: '',
        nationality: 'Việt Nam',
    })
    const [appointmentInfo, setAppointmentInfo] = useState<AppointmentInfo>({
        clinicId: 0,
        serviceId: 0,
        doctorId: 0,
        doctorServiceId: 0,
        date: '',
        selectedTimeSlot: null,
        notes: '',
    })
    const [createdAppointment, setCreatedAppointment] = useState<any>(null)
    const [temporaryPassword, setTemporaryPassword] = useState('')

    // API hooks
    const { data: clinics = [] } = useQuery({
        queryKey: ['receptionist-clinics'],
        queryFn: () => receptionistApi.getLocations(),
    })

    const { data: services = [] } = useQuery({
        queryKey: ['receptionist-services'],
        queryFn: () => receptionistApi.getServices(),
    })

    // Get doctor services when both clinic and service are selected
    const { data: doctorServices = [] } = useQuery({
        queryKey: ['doctorServices', appointmentInfo.clinicId, appointmentInfo.serviceId],
        queryFn: () =>
            doctorServicesApi.getDoctorServices({
                serviceId: appointmentInfo.serviceId,
                locationId: appointmentInfo.clinicId,
            }),
        enabled: appointmentInfo.clinicId > 0 && appointmentInfo.serviceId > 0,
    })

    // Get available time slots when doctor service and date are selected
    const { data: availabilityData, isLoading: isLoadingTimeSlots } = useQuery({
        queryKey: ['doctorAvailability', appointmentInfo.doctorServiceId, appointmentInfo.date],
        queryFn: () => receptionistApi.getDoctorAvailability(appointmentInfo.doctorServiceId, appointmentInfo.date),
        enabled: appointmentInfo.doctorServiceId > 0 && appointmentInfo.date !== '',
    })

    // Mutations
    const findPatientMutation = useMutation({
        mutationFn: (data: FindPatientRequest) => receptionistApi.findPatientByEmail(data),
        onSuccess: data => {
            if (data.found && data.user && data.patientProfiles) {
                // Kiểm tra role - chỉ cho phép PATIENT
                if (data.user.role !== 'PATIENT') {
                    alert('Email này không thuộc về tài khoản bệnh nhân. Vui lòng nhập email khác.')
                    return
                }

                setFoundPatient({
                    user: data.user,
                    patientProfiles: data.patientProfiles,
                })
                setCurrentStep('patient-info')
            } else {
                // Patient not found, prepare for creating new account
                setPatientInfo(prev => ({ ...prev, email: searchEmail }))
                setFoundPatient(null)
                setCurrentStep('patient-info')
            }
        },
        onError: (error: any) => {
            console.error('Search patient error:', error)
            alert('Có lỗi xảy ra khi tìm kiếm bệnh nhân. Vui lòng thử lại.')
        },
    })

    const createPatientMutation = useMutation({
        mutationFn: (data: CreatePatientAccountRequest) => receptionistApi.createPatientAccount(data),
        onSuccess: data => {
            setSelectedProfile(data.patientProfile)
            setTemporaryPassword(data.temporaryPassword)
            setCurrentStep('appointment')
        },
    })

    const createAppointmentMutation = useMutation({
        mutationFn: (data: CreateAppointmentForPatientRequest) => receptionistApi.createAppointmentForPatient(data),
        onSuccess: data => {
            setCreatedAppointment(data)
            setCurrentStep('confirmation')
        },
    })

    // Handlers
    const handleSearchPatient = () => {
        if (!searchEmail.trim()) return
        findPatientMutation.mutate({ email: searchEmail.trim() })
    }

    const handleSelectProfile = (profile: PatientProfile) => {
        setSelectedProfile(profile)
        setCurrentStep('appointment')
    }

    const handleCreatePatient = () => {
        if (
            !patientInfo.firstName.trim() ||
            !patientInfo.lastName.trim() ||
            !patientInfo.phone.trim() ||
            !patientInfo.dateOfBirth
        ) {
            alert('Vui lòng điền đầy đủ thông tin bắt buộc')
            return
        }

        createPatientMutation.mutate({
            email: patientInfo.email,
            firstName: patientInfo.firstName,
            lastName: patientInfo.lastName,
            phone: patientInfo.phone,
            dateOfBirth: patientInfo.dateOfBirth,
            gender: patientInfo.gender,
            idCardNumber: patientInfo.idCardNumber,
            address: patientInfo.address,
            occupation: patientInfo.occupation,
            nationality: patientInfo.nationality,
        })
    }

    const handleCreateAppointment = () => {
        if (
            !selectedProfile ||
            !appointmentInfo.doctorServiceId ||
            !appointmentInfo.date ||
            !appointmentInfo.selectedTimeSlot
        ) {
            alert('Vui lòng điền đầy đủ thông tin đặt lịch')
            return
        }

        // Create ISO datetime strings by combining selected date with time slots
        const startDateTime = new Date(`${appointmentInfo.date}T${appointmentInfo.selectedTimeSlot.startTime}:00`)
        const endDateTime = new Date(`${appointmentInfo.date}T${appointmentInfo.selectedTimeSlot.endTime}:00`)

        createAppointmentMutation.mutate({
            patientProfileId: selectedProfile.id,
            doctorServiceId: appointmentInfo.doctorServiceId,
            startTime: startDateTime.toISOString(),
            endTime: endDateTime.toISOString(),
            notes: appointmentInfo.notes,
        })
    }

    const handleServiceChange = (serviceId: number) => {
        setAppointmentInfo(prev => ({
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
            setAppointmentInfo(prev => ({
                ...prev,
                doctorId: selectedDoctorService.doctorId,
                doctorServiceId: selectedDoctorService.id,
                selectedTimeSlot: null,
            }))
        }
    }

    const handleDateChange = (date: string) => {
        setAppointmentInfo(prev => ({
            ...prev,
            date,
            selectedTimeSlot: null,
        }))
    }

    const handleTimeSlotSelect = (timeSlot: TimeSlot) => {
        setAppointmentInfo(prev => ({
            ...prev,
            selectedTimeSlot: timeSlot,
        }))
    }

    const resetForm = () => {
        setCurrentStep('search')
        setSearchEmail('')
        setFoundPatient(null)
        setSelectedProfile(null)
        setPatientInfo({
            email: '',
            firstName: '',
            lastName: '',
            phone: '',
            dateOfBirth: '',
            gender: 'MALE',
            idCardNumber: '',
            address: '',
            occupation: '',
            nationality: 'Việt Nam',
        })
        setAppointmentInfo({
            clinicId: 0,
            serviceId: 0,
            doctorId: 0,
            doctorServiceId: 0,
            date: '',
            selectedTimeSlot: null,
            notes: '',
        })
        setCreatedAppointment(null)
        setTemporaryPassword('')
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="border-b border-border bg-card">
                <div className="flex items-center justify-between p-6">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.back()}
                            className="flex items-center gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Quay lại
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">Đặt lịch hẹn cho bệnh nhân</h1>
                            <p className="text-sm text-muted-foreground">
                                Tìm kiếm hoặc tạo hồ sơ bệnh nhân và đặt lịch hẹn
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Progress Steps */}
            <div className="border-b border-border bg-card">
                <div className="flex items-center justify-center p-4">
                    <div className="flex items-center gap-4">
                        {[
                            { key: 'search', label: 'Tìm kiếm', icon: Search },
                            { key: 'patient-info', label: 'Thông tin BN', icon: User },
                            { key: 'appointment', label: 'Đặt lịch', icon: Calendar },
                            { key: 'confirmation', label: 'Xác nhận', icon: Clock },
                        ].map((step, index) => {
                            const Icon = step.icon
                            const isActive = currentStep === step.key
                            const isCompleted =
                                ['search', 'patient-info', 'appointment', 'confirmation'].indexOf(currentStep) > index

                            return (
                                <div key={step.key} className="flex items-center gap-2">
                                    <div
                                        className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                                            isActive
                                                ? 'bg-primary text-primary-foreground'
                                                : isCompleted
                                                  ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                                                  : 'bg-muted text-muted-foreground'
                                        }`}
                                    >
                                        <Icon className="h-4 w-4" />
                                        <span className="text-sm font-medium">{step.label}</span>
                                    </div>
                                    {index < 3 && (
                                        <div className={`w-8 h-0.5 ${isCompleted ? 'bg-green-500' : 'bg-border'}`} />
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-6">
                <div className="max-w-4xl mx-auto">
                    {/* Step 1: Search Patient */}
                    {currentStep === 'search' && (
                        <div className="bg-card rounded-lg border border-border p-6">
                            <h2 className="text-xl font-semibold mb-4">Tìm kiếm bệnh nhân</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Email bệnh nhân</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="email"
                                            value={searchEmail}
                                            onChange={e => setSearchEmail(e.target.value)}
                                            placeholder="Nhập email của bệnh nhân"
                                            className="flex-1 px-3 py-2 bg-background border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                                            onKeyPress={e => e.key === 'Enter' && handleSearchPatient()}
                                        />
                                        <Button
                                            onClick={handleSearchPatient}
                                            isDisabled={!searchEmail.trim() || findPatientMutation.isPending}
                                            className="flex items-center gap-2"
                                        >
                                            <Search className="h-4 w-4" />
                                            {findPatientMutation.isPending ? 'Đang tìm...' : 'Tìm kiếm'}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Patient Info */}
                    {currentStep === 'patient-info' && (
                        <div className="bg-card rounded-lg border border-border p-6">
                            <h2 className="text-xl font-semibold mb-4">
                                {foundPatient ? 'Chọn hồ sơ bệnh nhân' : 'Tạo hồ sơ bệnh nhân mới'}
                            </h2>

                            {foundPatient ? (
                                <div className="space-y-4">
                                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                        <p className="text-sm text-green-700 dark:text-green-300">
                                            Tìm thấy tài khoản: {foundPatient.user.email}
                                        </p>
                                    </div>

                                    <div className="grid gap-4">
                                        {foundPatient.patientProfiles.map(profile => (
                                            <div
                                                key={profile.id}
                                                className="p-4 bg-card border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                                                onClick={() => handleSelectProfile(profile)}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h3 className="font-medium">
                                                            {profile.firstName} {profile.lastName}
                                                        </h3>
                                                        <p className="text-sm text-muted-foreground">
                                                            {profile.phone} •{' '}
                                                            {new Date(profile.dateOfBirth).toLocaleDateString('vi-VN')}
                                                        </p>
                                                        {profile.address && (
                                                            <p className="text-sm text-muted-foreground">
                                                                {profile.address}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <Button size="sm">Chọn</Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                                        <p className="text-sm text-yellow-700 dark:text-yellow-300">
                                            Không tìm thấy tài khoản với email: {searchEmail}. Vui lòng tạo hồ sơ mới.
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Email *</label>
                                            <input
                                                type="email"
                                                value={patientInfo.email}
                                                onChange={e =>
                                                    setPatientInfo(prev => ({ ...prev, email: e.target.value }))
                                                }
                                                className={inputClassName}
                                                disabled
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-2">Số điện thoại *</label>
                                            <input
                                                type="tel"
                                                value={patientInfo.phone}
                                                onChange={e =>
                                                    setPatientInfo(prev => ({ ...prev, phone: e.target.value }))
                                                }
                                                className={inputClassName}
                                                placeholder="Nhập số điện thoại"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-2">Họ *</label>
                                            <input
                                                type="text"
                                                value={patientInfo.lastName}
                                                onChange={e =>
                                                    setPatientInfo(prev => ({ ...prev, lastName: e.target.value }))
                                                }
                                                className={inputClassName}
                                                placeholder="Nhập họ"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-2">Tên *</label>
                                            <input
                                                type="text"
                                                value={patientInfo.firstName}
                                                onChange={e =>
                                                    setPatientInfo(prev => ({ ...prev, firstName: e.target.value }))
                                                }
                                                className={inputClassName}
                                                placeholder="Nhập tên"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-2">Ngày sinh *</label>
                                            <input
                                                type="date"
                                                value={patientInfo.dateOfBirth}
                                                onChange={e =>
                                                    setPatientInfo(prev => ({ ...prev, dateOfBirth: e.target.value }))
                                                }
                                                className={inputClassName}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-2">Giới tính *</label>
                                            <select
                                                value={patientInfo.gender}
                                                onChange={e =>
                                                    setPatientInfo(prev => ({
                                                        ...prev,
                                                        gender: e.target.value as 'MALE' | 'FEMALE',
                                                    }))
                                                }
                                                className={inputClassName}
                                            >
                                                <option value="MALE">Nam</option>
                                                <option value="FEMALE">Nữ</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-2">CCCD/CMND</label>
                                            <input
                                                type="text"
                                                value={patientInfo.idCardNumber}
                                                onChange={e =>
                                                    setPatientInfo(prev => ({ ...prev, idCardNumber: e.target.value }))
                                                }
                                                className={inputClassName}
                                                placeholder="Nhập số CCCD/CMND"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-2">Nghề nghiệp</label>
                                            <input
                                                type="text"
                                                value={patientInfo.occupation}
                                                onChange={e =>
                                                    setPatientInfo(prev => ({ ...prev, occupation: e.target.value }))
                                                }
                                                className={inputClassName}
                                                placeholder="Nhập nghề nghiệp"
                                            />
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium mb-2">Địa chỉ</label>
                                            <input
                                                type="text"
                                                value={patientInfo.address}
                                                onChange={e =>
                                                    setPatientInfo(prev => ({ ...prev, address: e.target.value }))
                                                }
                                                className={inputClassName}
                                                placeholder="Nhập địa chỉ"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium mb-2">Quốc tịch</label>
                                            <input
                                                type="text"
                                                value={patientInfo.nationality}
                                                onChange={e =>
                                                    setPatientInfo(prev => ({ ...prev, nationality: e.target.value }))
                                                }
                                                className={inputClassName}
                                                placeholder="Nhập quốc tịch"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <Button onClick={() => setCurrentStep('search')} variant="outline">
                                            Quay lại
                                        </Button>
                                        <Button
                                            onClick={handleCreatePatient}
                                            isDisabled={createPatientMutation.isPending}
                                            className="flex items-center gap-2"
                                        >
                                            <Plus className="h-4 w-4" />
                                            {createPatientMutation.isPending ? 'Đang tạo...' : 'Tạo hồ sơ'}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 3: Appointment */}
                    {currentStep === 'appointment' && selectedProfile && (
                        <div className="bg-card rounded-lg border border-border p-6">
                            <h2 className="text-xl font-semibold mb-4">Đặt lịch hẹn</h2>

                            <div className="mb-6 p-4 bg-muted/30 rounded-lg border border-border">
                                <h3 className="font-medium mb-2 text-foreground">Thông tin bệnh nhân</h3>
                                <p className="text-sm">
                                    <strong>
                                        {selectedProfile.firstName} {selectedProfile.lastName}
                                    </strong>{' '}
                                    • {selectedProfile.phone}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {new Date(selectedProfile.dateOfBirth).toLocaleDateString('vi-VN')}
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Cơ sở khám *</label>
                                        <select
                                            value={appointmentInfo.clinicId}
                                            onChange={e =>
                                                setAppointmentInfo(prev => ({
                                                    ...prev,
                                                    clinicId: Number(e.target.value),
                                                }))
                                            }
                                            className={inputClassName}
                                        >
                                            <option value={0}>Chọn cơ sở</option>
                                            {clinics.map(clinic => (
                                                <option key={clinic.id} value={clinic.id}>
                                                    {clinic.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">Dịch vụ *</label>
                                        <select
                                            value={appointmentInfo.serviceId}
                                            onChange={e => handleServiceChange(Number(e.target.value))}
                                            className={inputClassName}
                                        >
                                            <option value={0}>Chọn dịch vụ</option>
                                            {services.map(service => (
                                                <option key={service.id} value={service.id}>
                                                    {service.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">Bác sĩ *</label>
                                        <select
                                            value={appointmentInfo.doctorServiceId}
                                            onChange={e => handleDoctorServiceChange(Number(e.target.value))}
                                            className={inputClassName}
                                            disabled={!appointmentInfo.clinicId || !appointmentInfo.serviceId}
                                        >
                                            <option value={0}>Chọn bác sĩ</option>
                                            {doctorServices?.map(doctorService => (
                                                <option key={doctorService.id} value={doctorService.id}>
                                                    {doctorService.doctor.firstName} {doctorService.doctor.lastName}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-2">Ngày khám *</label>
                                        <input
                                            type="date"
                                            value={appointmentInfo.date}
                                            onChange={e => handleDateChange(e.target.value)}
                                            className={inputClassName}
                                            min={new Date().toISOString().split('T')[0]}
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium mb-2">Giờ khám *</label>
                                        {appointmentInfo.doctorServiceId > 0 && appointmentInfo.date ? (
                                            <div className="space-y-3">
                                                {isLoadingTimeSlots ? (
                                                    <div className="flex items-center justify-center p-4 bg-muted/30 rounded-lg">
                                                        <div className="text-sm text-muted-foreground">
                                                            Đang tải lịch trống...
                                                        </div>
                                                    </div>
                                                ) : availabilityData?.availableTimeSlots.length === 0 ? (
                                                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                                                        <p className="text-sm text-yellow-700 dark:text-yellow-300">
                                                            Bác sĩ không có lịch trống trong ngày này. Vui lòng chọn
                                                            ngày khác.
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                                        {availabilityData?.availableTimeSlots.map(slot => (
                                                            <button
                                                                key={`${slot.startTime}-${slot.endTime}`}
                                                                type="button"
                                                                onClick={() => handleTimeSlotSelect(slot)}
                                                                className={`p-3 text-sm rounded-lg border transition-colors ${
                                                                    appointmentInfo.selectedTimeSlot?.startTime ===
                                                                        slot.startTime &&
                                                                    appointmentInfo.selectedTimeSlot?.endTime ===
                                                                        slot.endTime
                                                                        ? 'bg-primary text-primary-foreground border-primary'
                                                                        : 'bg-background border-border hover:bg-muted/50'
                                                                }`}
                                                            >
                                                                {slot.displayTime}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="p-4 bg-muted/30 rounded-lg border border-border">
                                                <p className="text-sm text-muted-foreground">
                                                    Vui lòng chọn bác sĩ và ngày khám để xem lịch trống
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Ghi chú</label>
                                    <textarea
                                        value={appointmentInfo.notes}
                                        onChange={e => setAppointmentInfo(prev => ({ ...prev, notes: e.target.value }))}
                                        className={inputClassName}
                                        rows={3}
                                        placeholder="Nhập ghi chú (nếu có)"
                                    />
                                </div>

                                <div className="flex gap-2">
                                    <Button onClick={() => setCurrentStep('patient-info')} variant="outline">
                                        Quay lại
                                    </Button>
                                    <Button
                                        onClick={handleCreateAppointment}
                                        isDisabled={createAppointmentMutation.isPending}
                                        className="flex items-center gap-2"
                                    >
                                        <Calendar className="h-4 w-4" />
                                        {createAppointmentMutation.isPending ? 'Đang đặt lịch...' : 'Đặt lịch hẹn'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Confirmation */}
                    {currentStep === 'confirmation' && createdAppointment && (
                        <div className="bg-card rounded-lg border border-border p-6">
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Clock className="h-8 w-8 text-green-600 dark:text-green-400" />
                                </div>
                                <h2 className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">
                                    Đặt lịch hẹn thành công!
                                </h2>
                                <p className="text-muted-foreground">
                                    Lịch hẹn đã được tạo và thông tin đã được gửi cho bệnh nhân
                                </p>
                            </div>

                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <h3 className="font-semibold">Thông tin bệnh nhân</h3>
                                        <div className="space-y-2 text-sm">
                                            <p>
                                                <strong>Họ tên:</strong> {createdAppointment.patientProfile.firstName}{' '}
                                                {createdAppointment.patientProfile.lastName}
                                            </p>
                                            <p>
                                                <strong>Số điện thoại:</strong>{' '}
                                                {createdAppointment.patientProfile.phone}
                                            </p>
                                            {temporaryPassword && (
                                                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                                                    <p className="text-yellow-700 dark:text-yellow-300 font-medium">
                                                        Mật khẩu tạm thời:{' '}
                                                        <code className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">
                                                            {temporaryPassword}
                                                        </code>
                                                    </p>
                                                    <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                                                        Vui lòng cung cấp mật khẩu này cho bệnh nhân để đăng nhập
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="font-semibold">Thông tin lịch hẹn</h3>
                                        <div className="space-y-2 text-sm">
                                            <p>
                                                <strong>Mã lịch hẹn:</strong> #{createdAppointment.id}
                                            </p>
                                            <p>
                                                <strong>Bác sĩ:</strong> {createdAppointment.doctor.firstName}{' '}
                                                {createdAppointment.doctor.lastName}
                                            </p>
                                            <p>
                                                <strong>Dịch vụ:</strong> {createdAppointment.service.name}
                                            </p>
                                            <p>
                                                <strong>Thời gian:</strong>{' '}
                                                {new Date(createdAppointment.startTime).toLocaleString('vi-VN')}
                                            </p>
                                            <p>
                                                <strong>Thời lượng:</strong> {createdAppointment.service.duration} phút
                                            </p>
                                            <p>
                                                <strong>Chi phí:</strong>{' '}
                                                {createdAppointment.service.price.toLocaleString('vi-VN')} VNĐ
                                            </p>
                                            {createdAppointment.clinic && (
                                                <p>
                                                    <strong>Cơ sở:</strong> {createdAppointment.clinic.name}
                                                </p>
                                            )}
                                            {createdAppointment.notes && (
                                                <p>
                                                    <strong>Ghi chú:</strong> {createdAppointment.notes}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-2 justify-center">
                                    <Button onClick={resetForm} className="flex items-center gap-2">
                                        <Plus className="h-4 w-4" />
                                        Đặt lịch hẹn mới
                                    </Button>
                                    <Button onClick={() => router.push('/receptionist')} variant="outline">
                                        Về trang chủ
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
