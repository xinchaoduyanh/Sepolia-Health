'use client'

import { useState } from 'react'
import { Button } from '@workspace/ui/components/Button'
import { Badge } from '@workspace/ui/components/Badge'
import { Avatar, AvatarFallback, AvatarImage } from '@workspace/ui/components/Avatar'
import { Card } from '@workspace/ui/components/Card'
import { Tabs, TabList, Tab, TabPanel } from '@workspace/ui/components/Tabs'
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
} from 'lucide-react'

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
    rating: 4.8,
    experience: '15 năm',
    education: 'Đại học Y Hà Nội',
    certifications: ['Chứng chỉ chuyên khoa Da liễu', 'Chứng chỉ Nhi khoa'],
    languages: ['Tiếng Việt', 'Tiếng Anh'],
    bio: 'Bác sĩ Nguyễn Văn A có hơn 15 năm kinh nghiệm trong lĩnh vực Da liễu và Nhi khoa. Ông đã tham gia nhiều hội thảo y khoa quốc tế và có nhiều công trình nghiên cứu được đăng trên các tạp chí y khoa uy tín.',
    schedule: [
        { day: 'Thứ 2', time: '08:00 - 17:00', location: 'Phòng khám A1' },
        { day: 'Thứ 3', time: '08:00 - 17:00', location: 'Phòng khám A1' },
        { day: 'Thứ 4', time: '08:00 - 17:00', location: 'Phòng khám A1' },
        { day: 'Thứ 5', time: '08:00 - 17:00', location: 'Phòng khám A1' },
        { day: 'Thứ 6', time: '08:00 - 12:00', location: 'Phòng khám A1' },
    ],
    recentAppointments: [
        { id: '1', patient: 'Nguyễn Thị B', date: '2024-01-15', time: '09:00', status: 'completed' },
        { id: '2', patient: 'Trần Văn C', date: '2024-01-15', time: '10:30', status: 'completed' },
        { id: '3', patient: 'Lê Thị D', date: '2024-01-16', time: '14:00', status: 'scheduled' },
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
    }>
    recentAppointments: Array<{
        id: string
        patient: string
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
}

export function DoctorDetail({ doctorId: _doctorId, onBack, onEdit, data }: DoctorDetailProps) {
    const [activeTab, setActiveTab] = useState('overview')
    const doctor = data || mockDoctorDetail // Use provided data or fallback to mock

    const tabItems = [
        { id: 'overview', label: 'Tổng quan' },
        { id: 'schedule', label: 'Lịch làm việc' },
        { id: 'appointments', label: 'Lịch hẹn' },
        { id: 'documents', label: 'Tài liệu' },
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
                <Card className="p-4">
                    <div className="text-2xl font-bold text-blue-600">{doctor.totalPatients}</div>
                    <div className="text-sm text-muted-foreground">Bệnh nhân</div>
                </Card>
                <Card className="p-4">
                    <div className="text-2xl font-bold text-green-600">{doctor.totalAppointments}</div>
                    <div className="text-sm text-muted-foreground">Cuộc hẹn</div>
                </Card>
                <Card className="p-4">
                    <div className="text-2xl font-bold text-yellow-600">{doctor.rating}</div>
                    <div className="text-sm text-muted-foreground">Đánh giá</div>
                </Card>
                <Card className="p-4">
                    <div className="text-2xl font-bold text-purple-600">{doctor.experience}</div>
                    <div className="text-sm text-muted-foreground">Kinh nghiệm</div>
                </Card>
            </div>

            {/* Bio */}
            <Card className="p-6">
                <h4 className="text-lg font-semibold text-foreground mb-4">Giới thiệu</h4>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{doctor.bio}</p>
            </Card>

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
                <h4 className="text-lg font-semibold text-foreground mb-4">Lịch làm việc</h4>
                <div className="space-y-3">
                    {doctor.schedule.map((schedule, index) => (
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
                            <div className="flex items-center space-x-2">
                                <Clock className="h-4 w-4 text-slate-500" />
                                <span className="text-sm">{schedule.time}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    )

    const renderAppointments = () => (
        <div className="space-y-6">
            <Card className="p-6">
                <h4 className="text-lg font-semibold text-foreground mb-4">Lịch hẹn gần đây</h4>
                <div className="space-y-3">
                    {doctor.recentAppointments.map(appointment => (
                        <div
                            key={appointment.id}
                            className="flex items-center justify-between p-4 border border-border rounded-lg"
                        >
                            <div>
                                <div className="font-medium">{appointment.patient}</div>
                                <div className="text-sm text-slate-500">
                                    {appointment.date} - {appointment.time}
                                </div>
                            </div>
                            <Badge variant={appointment.status === 'completed' ? 'default' : 'secondary'}>
                                {appointment.status === 'completed' ? 'Hoàn thành' : 'Đã lên lịch'}
                            </Badge>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    )

    const renderDocuments = () => (
        <div className="space-y-6">
            <Card className="p-6">
                <h4 className="text-lg font-semibold text-foreground mb-4">Tài liệu</h4>
                <div className="text-center py-8 text-slate-500">
                    <p>Chưa có tài liệu nào được tải lên</p>
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
                <TabPanel id="documents">{renderDocuments()}</TabPanel>
            </Tabs>
        </div>
    )
}
