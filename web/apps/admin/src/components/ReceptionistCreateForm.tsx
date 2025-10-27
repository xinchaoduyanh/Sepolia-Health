'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@workspace/ui/components/Button'
import { ArrowLeft } from 'lucide-react'
import { useCreateReceptionist } from '@/shared/hooks'
import type { CreateReceptionistRequest } from '@/shared/lib/api-services/receptionists.service'

export function ReceptionistCreateForm() {
    const router = useRouter()
    const createReceptionist = useCreateReceptionist()

    const [formData, setFormData] = useState<CreateReceptionistRequest>({
        email: '',
        password: '',
        fullName: '',
        phone: '',
        address: '',
    })

    const handleChange = (field: keyof CreateReceptionistRequest, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const isFormValid =
        formData.email && formData.password && formData.fullName && formData.phone && formData.password.length >= 6

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!isFormValid) return

        try {
            await createReceptionist.mutateAsync(formData)
            router.push('/dashboard/receptionist-management/receptionist-list')
        } catch (error) {
            console.error('Error creating receptionist:', error)
        }
    }

    const inputClassName =
        'bg-background text-foreground border-border focus:ring-2 focus:ring-blue-500 focus:border-transparent'

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
                <h2 className="text-2xl font-bold text-foreground">Tạo lập hồ sơ lễ tân</h2>
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
                        placeholder="receptionist@sepolia.com"
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
                        placeholder="Nguyễn Thị B"
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
                        placeholder="0987654321"
                        required
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
                        placeholder="456 Đường XYZ, Quận 2, TP.HCM"
                        rows={3}
                    />
                </div>

                {/* Submit Button */}
                <div className="flex justify-end gap-4 pt-4">
                    <Button type="button" variant="outline" onClick={() => router.back()}>
                        Hủy
                    </Button>
                    <Button type="submit" isDisabled={!isFormValid || createReceptionist.isPending}>
                        {createReceptionist.isPending ? 'Đang tạo...' : 'Tạo lập hồ sơ'}
                    </Button>
                </div>
            </form>
        </div>
    )
}
