'use client'

import { useState } from 'react'
import { Button } from '@workspace/ui/components/Button'
import { Badge } from '@workspace/ui/components/Badge'
import { Avatar, AvatarFallback, AvatarImage } from '@workspace/ui/components/Avatar'
import { Card } from '@workspace/ui/components/Card'
import { Tabs, TabList, Tab, TabPanel } from '@workspace/ui/components/Tabs'
import { toast } from '@workspace/ui/components/Sonner'
import {
    ArrowLeft,
    Edit,
    Download,
    Share,
    MoreVertical,
    Calendar,
    Clock,
    MapPin,
    Phone,
    Mail,
    User,
    Building,
    Plus,
    Trash2,
    XCircle,
} from 'lucide-react'
import {
    useCreateDoctorSchedule,
    useUpdateDoctorSchedule,
    useDeleteDoctorSchedule,
    useAdminCancelAppointment,
} from '@/shared/hooks'
import { type DoctorSchedule } from '@/shared/lib/api-services/doctors.service'
import { type AdminAppointment } from '@/shared/lib/api-services/admin-appointment.service'

// Mock data for doctor detail
const mockDoctorDetail = {
    id: '1',
    fullName: 'BS. Nguyễn Văn A',
    email: 'nguyenvana@vinmec.com',
    phone: '0123456789',
    specialty: ['Da liễu', 'Nhi Khoa'],
    site: 'Hà Nội',
    cm: 'CM1',
    status: 'active',
    avatar: null,
    doctorType: 'vinmec',
    profileId: 'VIN001',
    uid: 'UID001',
    gender: 'male',
    joinDate: '2023-01-15',
    lastActive: '2024-01-15',
    totalPatients: 1250,
    totalAppointments: 3200,
    completedAppointments: 3000,
    upcomingAppointments: 150,
    rating: 4.8,
    experience: '15 năm',
    education: 'Đại học Y Hà Nội',
    certifications: ['Chứng chỉ chuyên khoa Da liễu', 'Chứng chỉ Nhi khoa'],
    languages: ['Tiếng Việt', 'Tiếng Anh'],
    bio: 'Bác sĩ Nguyễn Văn A có hơn 15 năm kinh nghiệm trong lĩnh vực Da liễu và Nhi khoa. Ông đã tham gia nhiều hội thảo y khoa quốc tế và có nhiều công trình nghiên cứu được đăng trên các tạp chí y khoa uy tín.',
    schedule: [
        { day: 'Thứ 2', time: '08:00 - 17:00', location: 'Phòng khám A1', id: 1 },
    ],
    recentAppointments: [
        { id: '1', patient: 'Nguyễn Thị B', serviceName: 'Khám nhi', date: '2024-01-15', time: '09:00', status: 'completed' },
    ],
}

interface DoctorDetailData {
    id: string
    fullName: string
    email: string
    phone: string
    specialty: string[]
    site: string
    cm: string
    status: string
    avatar: string | null
    doctorType: string
    profileId: string
    uid: string
    gender: string
    joinDate: string
    lastActive: string | undefined
    totalPatients: number
    totalAppointments: number
    completedAppointments?: number
    upcomingAppointments?: number
    rating: number
    experience: string
    education: string
    certifications: string[]
    languages: string[]
    bio: string
    schedule: Array<{
        day: string
        time: string
        location: string
        id?: number
    }>
    recentAppointments: Array<{
        id: string
        patient: string
        serviceName?: string
        date: string
        time: string
        status: string
    }>
}

interface DoctorDetailProps {
    doctorId: string
    onBack: () => void
    onEdit: (doctorId: string) => void
    data?: DoctorDetailData
    realSchedule?: DoctorSchedule[]
    realAppointments?: AdminAppointment[]
}

export function DoctorDetail({ doctorId: _doctorId, onBack, onEdit, data }: DoctorDetailProps) {
    const [activeTab, setActiveTab] = useState('overview')
    const doctor = (data || mockDoctorDetail) as DoctorDetailData

    const deleteSchedule = useDeleteDoctorSchedule()
    const cancelAppointment = useAdminCancelAppointment()

    const tabItems = [
        { id: 'overview', label: 'Tổng quan' },
        { id: 'schedule', label: 'Lịch làm việc' },
        { id: 'appointments', label: 'Lịch hẹn' },
    ]

    const renderOverview = () => (
        <div className="space-y-6">
            {/* Basic Info */}
            <Card className="p-6">
                <div className="flex items-start space-x-6">
                    <Avatar className="w-24 h-24">
                        <AvatarImage src={doctor.avatar || undefined} alt={doctor.fullName} />
                        <AvatarFallback>{doctor.fullName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-2xl font-bold text-foreground">{doctor.fullName}</h3>
                                <p className="text-slate-600 dark:text-slate-400">{doctor.specialty.join(', ')}</p>
                            </div>
                            <div className="flex space-x-2">
                                <Button variant="outline" size="sm">
                                    <Download className="h-4 w-4 mr-2" />
                                    Xuất PDF
                                </Button>
                                <Button variant="outline" size="sm">
                                    <Share className="h-4 w-4 mr-2" />
                                    Chia sẻ
                                </Button>
                                <Button variant="ghost" size="sm">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="flex items-center space-x-2">
                                <Phone className="h-4 w-4 text-slate-500" />
                                <span className="text-sm">{doctor.phone}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Mail className="h-4 w-4 text-slate-500" />
                                <span className="text-sm">{doctor.email}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <MapPin className="h-4 w-4 text-slate-500" />
                                <span className="text-sm">{doctor.site}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Building className="h-4 w-4 text-slate-500" />
                                <span className="text-sm">{doctor.cm}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-4 border-l-4 border-blue-500">
                    <div className="text-2xl font-bold text-blue-600">{doctor.totalAppointments}</div>
                    <div className="text-sm text-muted-foreground font-medium">Tổng lịch hẹn</div>
                </Card>
                <Card className="p-4 border-l-4 border-green-500">
                    <div className="text-2xl font-bold text-green-600">{doctor.completedAppointments || 0}</div>
                    <div className="text-sm text-muted-foreground font-medium">Hoàn thành</div>
                </Card>
                <Card className="p-4 border-l-4 border-orange-500">
                    <div className="text-2xl font-bold text-orange-600">{doctor.upcomingAppointments || 0}</div>
                    <div className="text-sm text-muted-foreground font-medium">Sắp tới</div>
                </Card>
                <Card className="p-4 border-l-4 border-purple-500">
                    <div className="text-2xl font-bold text-purple-600">{doctor.experience}</div>
                    <div className="text-sm text-muted-foreground font-medium">Kinh nghiệm</div>
                </Card>
            </div>

            {/* Bio */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="p-6 lg:col-span-2">
                    <h4 className="text-lg font-semibold text-foreground mb-4">Giới thiệu</h4>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{doctor.bio}</p>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-semibold text-foreground">Lịch hẹn mới nhất</h4>
                        <Button 
                            variant="link" 
                            size="sm" 
                            className="p-0 h-auto"
                            onClick={() => setActiveTab('appointments')}
                        >
                            Xem tất cả
                        </Button>
                    </div>
                    <div className="space-y-4">
                        {doctor.recentAppointments.slice(0, 3).map((appointment) => (
                            <div key={appointment.id} className="flex flex-col space-y-1">
                                <div className="flex items-center justify-between">
                                    <span className="font-medium text-sm truncate">{appointment.patient}</span>
                                    <Badge variant={appointment.status === 'completed' ? 'default' : appointment.status === 'cancelled' ? 'destructive' : 'secondary'} className="text-[10px] px-1 h-4">
                                        {appointment.status === 'completed' ? 'X' : appointment.status === 'cancelled' ? 'C' : 'S' }
                                    </Badge>
                                </div>
                                <div className="text-[11px] text-slate-500">
                                    {appointment.date} - {appointment.time}
                                </div>
                            </div>
                        ))}
                        {doctor.recentAppointments.length === 0 && (
                            <div className="text-center py-4 text-sm text-slate-500">
                                Chưa có lịch hẹn
                            </div>
                        )}
                    </div>
                </Card>
            </div>

            {/* Education & Certifications */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-6">
                    <h4 className="text-lg font-semibold text-foreground mb-4">Học vấn</h4>
                    <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-slate-500" />
                            <span className="text-sm">{doctor.education}</span>
                        </div>
                    </div>
                </Card>
                <Card className="p-6">
                    <h4 className="text-lg font-semibold text-foreground mb-4">Chứng chỉ</h4>
                    <div className="space-y-2">
                        {doctor.certifications.map((cert, index) => (
                            <div key={index} className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                <span className="text-sm">{cert}</span>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    )

    const renderSchedule = () => (
        <div className="space-y-6">
            <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-foreground">Lịch làm việc</h4>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            toast.info({
                                title: 'Thông báo',
                                description: 'Tính năng thêm lịch đang được phát triển'
                            })
                        }}
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Thêm lịch
                    </Button>
                </div>
                <div className="space-y-3">
                    {doctor.schedule.length > 0 ? (
                        doctor.schedule.map((schedule, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between p-4 border border-border rounded-lg"
                            >
                                <div className="flex items-center space-x-4">
                                    <Calendar className="h-5 w-5 text-slate-500" />
                                    <div>
                                        <div className="font-medium">{schedule.day}</div>
                                        <div className="text-sm text-slate-500">{schedule.location}</div>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center space-x-2">
                                        <Clock className="h-4 w-4 text-slate-500" />
                                        <span className="text-sm">{schedule.time}</span>
                                    </div>
                                    {schedule.id && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                            onClick={() => {
                                                if (confirm('Bạn có chắc chắn muốn xóa lịch làm việc này?')) {
                                                    deleteSchedule.mutate({
                                                        doctorId: parseInt(doctor.id),
                                                        scheduleId: schedule.id!
                                                    })
                                                }
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8 text-slate-500">
                            Chưa có lịch làm việc
                        </div>
                    )}
                </div>
            </Card>
        </div>
    )

    const renderAppointments = () => (
        <div className="space-y-6">
            <Card className="p-6">
                <h4 className="text-lg font-semibold text-foreground mb-4">Lịch hẹn gần đây</h4>
                <div className="space-y-3">
                    {doctor.recentAppointments.length > 0 ? (
                        doctor.recentAppointments.map(appointment => (
                            <div
                                key={appointment.id}
                                className="flex items-center justify-between p-4 border border-border rounded-lg"
                            >
                                <div>
                                    <div className="font-medium">{appointment.patient}</div>
                                    <div className="text-sm text-slate-600 dark:text-slate-400 font-medium">{appointment.serviceName}</div>
                                    <div className="text-sm text-slate-500">
                                        {appointment.date} - {appointment.time}
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <Badge variant={appointment.status === 'completed' ? 'default' : appointment.status === 'cancelled' ? 'destructive' : 'secondary'}>
                                        {appointment.status === 'completed' ? 'Hoàn thành' : appointment.status === 'cancelled' ? 'Đã hủy' : 'Đã lên lịch'}
                                    </Badge>
                                    {appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-red-500 border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20"
                                            onClick={() => {
                                                if (confirm('Bạn có chắc chắn muốn hủy cuộc hẹn này?')) {
                                                    cancelAppointment.mutate(parseInt(appointment.id))
                                                }
                                            }}
                                        >
                                            <XCircle className="h-4 w-4 mr-1" />
                                            Hủy
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8 text-slate-500">
                            Chưa có cuộc hẹn nào
                        </div>
                    )}
                </div>
            </Card>
        </div>
    )

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Button variant="ghost" size="sm" onClick={onBack} className="flex items-center space-x-2">
                        <ArrowLeft className="h-4 w-4" />
                        <span>Quay lại</span>
                    </Button>
                    <div>
                        <h2 className="text-2xl font-bold text-foreground">Hồ sơ chi tiết bác sĩ</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            Thông tin chi tiết và lịch sử hoạt động của bác sĩ
                        </p>
                    </div>
                </div>
                <Button onClick={() => onEdit(doctor.id)} className="flex items-center space-x-2">
                    <Edit className="h-4 w-4" />
                    <span>Chỉnh sửa</span>
                </Button>
            </div>

            {/* Status Badge */}
            <div className="flex items-center space-x-4">
                <Badge variant={doctor.status === 'active' ? 'default' : 'secondary'}>
                    {doctor.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                </Badge>
                <Badge variant={doctor.doctorType === 'vinmec' ? 'default' : 'outline'}>
                    {doctor.doctorType === 'vinmec' ? 'Bác sĩ Vinmec' : 'Bác sĩ ngoài Vinmec'}
                </Badge>
            </div>

            {/* Tabs */}
            <Tabs selectedKey={activeTab} onSelectionChange={key => setActiveTab(key.toString())}>
                <TabList>
                    {tabItems.map(item => (
                        <Tab key={item.id} id={item.id}>
                            {item.label}
                        </Tab>
                    ))}
                </TabList>
                <TabPanel id="overview">{renderOverview()}</TabPanel>
                <TabPanel id="schedule">{renderSchedule()}</TabPanel>
                <TabPanel id="appointments">{renderAppointments()}</TabPanel>
            </Tabs>
        </div>
    )
}
