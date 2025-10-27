'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@workspace/ui/components/Button'
import { ArrowLeft } from 'lucide-react'
import { useCreateDoctor } from '@/shared/hooks'
import type { CreateDoctorRequest } from '@/shared/lib/api-services/doctors.service'

export function DoctorCreateForm() {
    const router = useRouter()
    const createDoctor = useCreateDoctor()

    const [formData, setFormData] = useState<CreateDoctorRequest>({
        email: '',
        password: '',
        fullName: '',
        phone: '',
        specialty: '',
        experienceYears: 0,
        description: '',
        address: '',
        clinicId: 1,
        serviceIds: [],
    })

    const handleChange = (field: keyof CreateDoctorRequest, value: string | number) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const handleServiceIdsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        const ids = value.split(',').map(id => Number.parseInt(id.trim())).filter(id => !Number.isNaN(id))
        setFormData(prev => ({ ...prev, serviceIds: ids }))
    }

    const isFormValid = 
        formData.email && 
        formData.password && 
        formData.fullName && 
        formData.phone && 
        formData.specialty &&
        formData.password.length >= 6 &&
        formData.experienceYears >= 0 &&
        formData.clinicId > 0 &&
        formData.serviceIds.length > 0

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!isFormValid) return

        try {
            await createDoctor.mutateAsync(formData)
            router.push('/dashboard/doctor-management/doctor-list')
        } catch (error) {
            console.error('Error creating doctor:', error)
        }
    }

    const inputClassName = 'bg-background text-foreground border-border focus:ring-2 focus:ring-blue-500 focus:border-transparent'

    return (
        <div className="p-6 max-w-3xl mx-auto space-y-6">
            <div className="flex items-center justify-between mb-6">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                    <ArrowLeft size={20} />
                    <span className="font-medium">Quay lại</span>
                </button>
                <h2 className="text-2xl font-bold text-foreground">Tạo lập hồ sơ bác sĩ</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 bg-card border border-border rounded-lg p-6">
                {/* Email */}
                <div className="space-y-2">
                    <label htmlFor="email" className="block text-sm font-medium text-foreground">
                        Email *
                    </label>
                    <input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={e => handleChange('email', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md ${inputClassName}`}
                        placeholder="doctor@sepolia.com"
                        required
                    />
                </div>

                {/* Password */}
                <div className="space-y-2">
                    <label htmlFor="password" className="block text-sm font-medium text-foreground">
                        Mật khẩu *
                    </label>
                    <input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={e => handleChange('password', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md ${inputClassName}`}
                        placeholder="Ít nhất 6 ký tự"
                        required
                        minLength={6}
                    />
                </div>

                {/* Full Name */}
                <div className="space-y-2">
                    <label htmlFor="fullName" className="block text-sm font-medium text-foreground">
                        Họ và tên *
                    </label>
                    <input
                        id="fullName"
                        type="text"
                        value={formData.fullName}
                        onChange={e => handleChange('fullName', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md ${inputClassName}`}
                        placeholder="Nguyễn Văn A"
                        required
                    />
                </div>

                {/* Phone */}
                <div className="space-y-2">
                    <label htmlFor="phone" className="block text-sm font-medium text-foreground">
                        Số điện thoại *
                    </label>
                    <input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={e => handleChange('phone', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md ${inputClassName}`}
                        placeholder="0123456789"
                        required
                    />
                </div>

                {/* Specialty */}
                <div className="space-y-2">
                    <label htmlFor="specialty" className="block text-sm font-medium text-foreground">
                        Chuyên khoa *
                    </label>
                    <input
                        id="specialty"
                        type="text"
                        value={formData.specialty}
                        onChange={e => handleChange('specialty', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md ${inputClassName}`}
                        placeholder="Tim mạch"
                        required
                    />
                </div>

                {/* Experience Years */}
                <div className="space-y-2">
                    <label htmlFor="experienceYears" className="block text-sm font-medium text-foreground">
                        Số năm kinh nghiệm *
                    </label>
                    <input
                        id="experienceYears"
                        type="number"
                        value={formData.experienceYears}
                        onChange={e => handleChange('experienceYears', Number.parseInt(e.target.value) || 0)}
                        className={`w-full px-3 py-2 border rounded-md ${inputClassName}`}
                        placeholder="5"
                        required
                        min={0}
                    />
                </div>

                {/* Clinic ID */}
                <div className="space-y-2">
                    <label htmlFor="clinicId" className="block text-sm font-medium text-foreground">
                        ID Phòng khám *
                    </label>
                    <input
                        id="clinicId"
                        type="number"
                        value={formData.clinicId}
                        onChange={e => handleChange('clinicId', Number.parseInt(e.target.value) || 1)}
                        className={`w-full px-3 py-2 border rounded-md ${inputClassName}`}
                        placeholder="1"
                        required
                        min={1}
                    />
                </div>

                {/* Service IDs */}
                <div className="space-y-2">
                    <label htmlFor="serviceIds" className="block text-sm font-medium text-foreground">
                        Danh sách ID Dịch vụ * <span className="text-xs text-muted-foreground">(phân cách bằng dấu phẩy)</span>
                    </label>
                    <input
                        id="serviceIds"
                        type="text"
                        value={formData.serviceIds.join(', ')}
                        onChange={handleServiceIdsChange}
                        className={`w-full px-3 py-2 border rounded-md ${inputClassName}`}
                        placeholder="1, 2, 3"
                        required
                    />
                </div>

                {/* Description */}
                <div className="space-y-2">
                    <label htmlFor="description" className="block text-sm font-medium text-foreground">
                        Mô tả
                    </label>
                    <textarea
                        id="description"
                        value={formData.description}
                        onChange={e => handleChange('description', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md ${inputClassName}`}
                        placeholder="Bác sĩ chuyên khoa tim mạch với 5 năm kinh nghiệm"
                        rows={3}
                    />
                </div>

                {/* Address */}
                <div className="space-y-2">
                    <label htmlFor="address" className="block text-sm font-medium text-foreground">
                        Địa chỉ
                    </label>
                    <textarea
                        id="address"
                        value={formData.address}
                        onChange={e => handleChange('address', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md ${inputClassName}`}
                        placeholder="123 Đường ABC, Quận 1, TP.HCM"
                        rows={3}
                    />
                </div>

                {/* Submit Button */}
                <div className="flex justify-end gap-4 pt-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.back()}
                    >
                        Hủy
                    </Button>
                    <Button
                        type="submit"
                        isDisabled={!isFormValid || createDoctor.isPending}
                    >
                        {createDoctor.isPending ? 'Đang tạo...' : 'Tạo lập hồ sơ'}
                    </Button>
                </div>
            </form>
        </div>
    )
}