'use client'

import { PatientCreateForm } from '@/components/PatientCreateForm'

export default function CreateCustomerPage() {
    return (
        <div className="container mx-auto py-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-foreground">Thêm khách hàng mới</h1>
                <p className="text-sm text-muted-foreground mt-1">Tạo hồ sơ khách hàng mới trong hệ thống</p>
            </div>
            <PatientCreateForm />
        </div>
    )
}
