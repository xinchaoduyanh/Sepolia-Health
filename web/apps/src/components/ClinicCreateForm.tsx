'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@workspace/ui/components/Button'
import { Checkbox } from '@workspace/ui/components/Checkbox'
import {
    ArrowLeft,
    AlertCircle,
    Building2,
    MapPin,
    Phone,
    Mail,
    FileText,
    CheckCircle,
    Save,
} from 'lucide-react'
import { useCreateClinic } from '@/shared/hooks'
import type { CreateClinicRequest } from '@/shared/lib/api-services/clinics.service'

interface FieldErrors {
    name?: string
    address?: string
    phone?: string
    email?: string
    description?: string
}

export function ClinicCreateForm() {
    const router = useRouter()
    const createClinic = useCreateClinic()

    const [formData, setFormData] = useState({
        name: '',
        address: '',
        phone: '',
        email: '',
        description: '',
        isActive: true,
    })

    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

    const validateForm = (): boolean => {
        const errors: FieldErrors = {}

        if (!formData.name.trim()) {
            errors.name = 'Tên phòng khám không được để trống'
        }

        if (!formData.address.trim()) {
            errors.address = 'Địa chỉ không được để trống'
        }

        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.email = 'Email không hợp lệ'
        }

        setFieldErrors(errors)
        return Object.keys(errors).length === 0
    }

    const isFormValid = formData.name.trim() && formData.address.trim()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateForm()) {
            return
        }

        const requestData: CreateClinicRequest = {
            name: formData.name.trim(),
            address: formData.address.trim(),
            phone: formData.phone.trim() || undefined,
            email: formData.email.trim() || undefined,
            description: formData.description.trim() || undefined,
            isActive: formData.isActive,
        }

        try {
            await createClinic.mutateAsync(requestData)
            router.push('/admin/clinic-management/clinic-list')
        } catch (_error) {
            // Error is handled by the mutation
        }
    }

    const handleInputChange = (field: keyof typeof formData, value: string | boolean) => {
        setFormData(prev => ({ ...prev, [field]: value }))

        if (fieldErrors[field as keyof FieldErrors]) {
            setFieldErrors(prev => ({ ...prev, [field]: undefined }))
        }
    }

    const inputClassName =
        'w-full px-4 py-2.5 bg-background text-foreground border-2 border-border rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary hover:border-primary/50 transition-all duration-200 outline-none shadow-sm'

    const labelClassName = 'flex items-center gap-2 text-sm font-medium text-foreground mb-2'

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
            <div className="w-full px-6 py-8">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.back()}
                        className="rounded-full hover:bg-muted/50"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
                            Tạo phòng khám mới
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Điền đầy đủ thông tin để thêm phòng khám vào hệ thống
                        </p>
                    </div>
                </div>

                {/* Progress indicator */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    <div
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${formData.name.trim() ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-muted text-muted-foreground'}`}
                    >
                        <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${formData.name.trim() ? 'bg-green-500 text-white' : 'bg-muted-foreground/30 text-muted-foreground'}`}
                        >
                            1
                        </div>
                        Thông tin cơ bản
                    </div>
                    <div className="w-8 h-0.5 bg-border" />
                    <div
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${formData.address.trim() ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-muted text-muted-foreground'}`}
                    >
                        <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${formData.address.trim() ? 'bg-green-500 text-white' : 'bg-muted-foreground/30 text-muted-foreground'}`}
                        >
                            2
                        </div>
                        Địa chỉ & Liên hệ
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Information Section */}
                    <div className="bg-card rounded-2xl shadow-sm border border-border/50 overflow-hidden">
                        <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/5 dark:to-teal-500/5 px-6 py-4 border-b border-border/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                                    <Building2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-foreground">Thông tin phòng khám</h3>
                                    <p className="text-sm text-muted-foreground">Thông tin cơ bản của phòng khám</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 space-y-5">
                            <div>
                                <label className={labelClassName}>
                                    <Building2 className="h-4 w-4 text-muted-foreground" />
                                    Tên phòng khám <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="Nhập tên phòng khám"
                                    value={formData.name}
                                    onChange={e => handleInputChange('name', e.target.value)}
                                    className={`${inputClassName} ${fieldErrors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                                />
                                {fieldErrors.name && (
                                    <div className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400 mt-2">
                                        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                        <span>{fieldErrors.name}</span>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className={labelClassName}>
                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                    Địa chỉ <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    placeholder="Nhập địa chỉ phòng khám"
                                    value={formData.address}
                                    onChange={e => handleInputChange('address', e.target.value)}
                                    rows={3}
                                    className={`${inputClassName} ${fieldErrors.address ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                                />
                                {fieldErrors.address && (
                                    <div className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400 mt-2">
                                        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                        <span>{fieldErrors.address}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Contact Information Section */}
                    <div className="bg-card rounded-2xl shadow-sm border border-border/50 overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 dark:from-blue-500/5 dark:to-cyan-500/5 px-6 py-4 border-b border-border/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                                    <Phone className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-foreground">Thông tin liên hệ</h3>
                                    <p className="text-sm text-muted-foreground">Số điện thoại và email liên hệ</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className={labelClassName}>
                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                        Số điện thoại
                                    </label>
                                    <input
                                        type="tel"
                                        placeholder="Nhập số điện thoại"
                                        value={formData.phone}
                                        onChange={e => handleInputChange('phone', e.target.value)}
                                        className={inputClassName}
                                    />
                                </div>
                                <div>
                                    <label className={labelClassName}>
                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        placeholder="Nhập email liên hệ"
                                        value={formData.email}
                                        onChange={e => handleInputChange('email', e.target.value)}
                                        className={`${inputClassName} ${fieldErrors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                                    />
                                    {fieldErrors.email && (
                                        <div className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400 mt-2">
                                            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                            <span>{fieldErrors.email}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Description Section */}
                    <div className="bg-card rounded-2xl shadow-sm border border-border/50 overflow-hidden">
                        <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 dark:from-purple-500/5 dark:to-pink-500/5 px-6 py-4 border-b border-border/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                                    <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-foreground">Mô tả phòng khám</h3>
                                    <p className="text-sm text-muted-foreground">Thông tin chi tiết về phòng khám</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 space-y-5">
                            <div>
                                <label className={labelClassName}>
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                    Mô tả
                                </label>
                                <textarea
                                    placeholder="Nhập mô tả về phòng khám..."
                                    value={formData.description}
                                    onChange={e => handleInputChange('description', e.target.value)}
                                    rows={4}
                                    className={inputClassName}
                                />
                            </div>

                            <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-xl border border-border/50">
                                <Checkbox
                                    id="isActive"
                                    isSelected={formData.isActive}
                                    onChange={isSelected => handleInputChange('isActive', isSelected)}
                                >
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                        <span className="font-medium">Phòng khám đang hoạt động</span>
                                    </div>
                                </Checkbox>
                            </div>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex items-center justify-between gap-4 bg-card rounded-2xl shadow-sm border border-border/50 p-6">
                        <div className="text-sm text-muted-foreground">
                            {!isFormValid && (
                                <span className="flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4 text-amber-500" />
                                    Vui lòng điền đầy đủ các trường bắt buộc
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            <Button type="button" variant="outline" onClick={() => router.back()} className="rounded-xl">
                                Hủy
                            </Button>
                            <Button
                                type="submit"
                                isDisabled={createClinic.isPending}
                                className="rounded-xl px-6 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                            >
                                {createClinic.isPending ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
                                        Đang tạo...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4 mr-2" />
                                        Tạo phòng khám
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}
