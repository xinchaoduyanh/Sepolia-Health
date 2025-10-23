import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/Card'
import { Button } from '@workspace/ui/components/Button'
import { Input } from '@workspace/ui/components/Textfield'
import { BsSelect } from '@workspace/ui/components/Select'
import { Save, UserPlus } from 'lucide-react'

export default function CreateCustomerProfilePage() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-foreground">Tạo lập hồ sơ khách hàng</h1>
                <p className="text-sm text-muted-foreground mt-1">Tạo hồ sơ khách hàng mới trong hệ thống</p>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Form */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <UserPlus className="h-5 w-5" />
                            <span>Thông tin khách hàng</span>
                        </CardTitle>
                        <CardDescription>Nhập thông tin cơ bản của khách hàng</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium">Họ và tên *</label>
                                <Input placeholder="Nhập họ và tên" className="mt-1" />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Số điện thoại *</label>
                                <Input placeholder="Nhập số điện thoại" className="mt-1" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium">Email</label>
                                <Input placeholder="Nhập email" className="mt-1" />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Giới tính</label>
                                <BsSelect
                                    options={[
                                        { id: 'male', name: 'Nam' },
                                        { id: 'female', name: 'Nữ' },
                                        { id: 'other', name: 'Khác' },
                                    ]}
                                    placeholder="Chọn giới tính"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium">Ngày sinh</label>
                            <Input type="date" className="mt-1" />
                        </div>

                        <div>
                            <label className="text-sm font-medium">Địa chỉ</label>
                            <Input placeholder="Nhập địa chỉ" className="mt-1" />
                        </div>

                        <div className="flex space-x-4 pt-4">
                            <Button className="flex items-center space-x-2">
                                <Save className="h-4 w-4" />
                                <span>Tạo hồ sơ</span>
                            </Button>
                            <Button variant="outline">Hủy</Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Instructions */}
                <Card>
                    <CardHeader>
                        <CardTitle>Hướng dẫn</CardTitle>
                        <CardDescription>Thông tin cần thiết để tạo hồ sơ khách hàng</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-3">
                            <div className="flex items-start space-x-3">
                                <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                                    1
                                </div>
                                <div>
                                    <p className="font-medium">Thông tin bắt buộc</p>
                                    <p className="text-sm text-muted-foreground">
                                        Họ tên và số điện thoại là thông tin bắt buộc
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start space-x-3">
                                <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                                    2
                                </div>
                                <div>
                                    <p className="font-medium">Xác thực thông tin</p>
                                    <p className="text-sm text-muted-foreground">
                                        Kiểm tra kỹ thông tin trước khi tạo hồ sơ
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start space-x-3">
                                <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                                    3
                                </div>
                                <div>
                                    <p className="font-medium">Lưu hồ sơ</p>
                                    <p className="text-sm text-muted-foreground">
                                        Sau khi tạo, khách hàng sẽ nhận được thông báo
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
