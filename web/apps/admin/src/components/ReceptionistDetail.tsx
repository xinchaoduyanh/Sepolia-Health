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

// Mock data for receptionist detail
const mockReceptionistDetail = {
    id: '1',
    fullName: 'Nguyễn Thị Lễ Tân',
    email: 'nguyenthiltan@sepolia.com',
    phone: '0123456789',
    department: 'Lễ tân',
    site: 'Hà Nội',
    cm: 'CM1',
    status: 'active',
    avatar: null,
    receptionistType: 'internal',
    profileId: 'REC001',
    uid: 'UID001',
    gender: 'female',
    joinDate: '2023-01-15',
    lastActive: '2024-01-15',
    totalHandled: 1250,
    totalAppointments: 3200,
    rating: 4.8,
    experience: '3 năm',
    education: 'Cao đẳng Quản trị kinh doanh',
    certifications: ['Chứng chỉ Lễ tân', 'Chứng chỉ Phục vụ khách hàng'],
    languages: ['Tiếng Việt', 'Tiếng Anh'],
    bio: 'Lễ tân Nguyễn Thị Lễ Tân có hơn 3 năm kinh nghiệm trong lĩnh vực phục vụ khách hàng và quản lý lịch hẹn. Cô luôn nhiệt tình và chuyên nghiệp trong công việc.',
    schedule: [
        { day: 'Thứ 2', time: '08:00 - 17:00', location: 'Bàn lễ tân A1' },
        { day: 'Thứ 3', time: '08:00 - 17:00', location: 'Bàn lễ tân A1' },
        { day: 'Thứ 4', time: '08:00 - 17:00', location: 'Bàn lễ tân A1' },
        { day: 'Thứ 5', time: '08:00 - 17:00', location: 'Bàn lễ tân A1' },
        { day: 'Thứ 6', time: '08:00 - 12:00', location: 'Bàn lễ tân A1' },
    ],
    recentActivities: [
        {
            id: '1',
            action: 'Đặt lịch hẹn cho bệnh nhân Nguyễn Thị B',
            date: '2024-01-15',
            time: '09:00',
            status: 'completed',
        },
        {
            id: '2',
            action: 'Xử lý yêu cầu của bệnh nhân Trần Văn C',
            date: '2024-01-15',
            time: '10:30',
            status: 'completed',
        },
        {
            id: '3',
            action: 'Đặt lịch hẹn cho bệnh nhân Lê Thị D',
            date: '2024-01-16',
            time: '14:00',
            status: 'scheduled',
        },
    ],
}

interface ReceptionistDetailData {
    id: string
    fullName: string
    email: string
    phone: string
    department: string
    site: string
    cm: string
    status: string
    avatar: string | null
    receptionistType: string
    profileId: string
    uid: string
    gender: string
    joinDate: string
    lastActive: string | undefined
    totalHandled: number
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
    recentActivities: Array<{
        id: string
        action: string
        date: string
        time: string
        status: string
    }>
}

interface ReceptionistDetailProps {
    receptionistId: string
    onBack: () => void
    onEdit: (receptionistId: string) => void
    data?: ReceptionistDetailData
}

export function ReceptionistDetail({ receptionistId: _receptionistId, onBack, onEdit, data }: ReceptionistDetailProps) {
    const [activeTab, setActiveTab] = useState('overview')
    const receptionist = data || mockReceptionistDetail // Use provided data or fallback to mock

    const tabItems = [
        { id: 'overview', label: 'Tổng quan' },
        { id: 'schedule', label: 'Lịch làm việc' },
        { id: 'activities', label: 'Hoạt động' },
        { id: 'documents', label: 'Tài liệu' },
    ]

    const renderOverview = () => (
        <div className="space-y-6">
            {/* Basic Info */}
            <Card className="p-6">
                <div className="flex items-start space-x-6">
                    <Avatar className="w-24 h-24">
                        <AvatarImage src={receptionist.avatar || undefined} alt={receptionist.fullName} />
                        <AvatarFallback>{receptionist.fullName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-2xl font-bold text-foreground">{receptionist.fullName}</h3>
                                <p className="text-slate-600 dark:text-slate-400">{receptionist.department}</p>
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
                                <span className="text-sm">{receptionist.phone}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Mail className="h-4 w-4 text-slate-500" />
                                <span className="text-sm">{receptionist.email}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <MapPin className="h-4 w-4 text-slate-500" />
                                <span className="text-sm">{receptionist.site}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Building className="h-4 w-4 text-slate-500" />
                                <span className="text-sm">{receptionist.cm}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-4">
                    <div className="text-2xl font-bold text-blue-600">{receptionist.totalHandled}</div>
                    <div className="text-sm text-muted-foreground">Đã xử lý</div>
                </Card>
                <Card className="p-4">
                    <div className="text-2xl font-bold text-green-600">{receptionist.totalAppointments}</div>
                    <div className="text-sm text-muted-foreground">Lịch hẹn</div>
                </Card>
                <Card className="p-4">
                    <div className="text-2xl font-bold text-yellow-600">{receptionist.rating}</div>
                    <div className="text-sm text-muted-foreground">Đánh giá</div>
                </Card>
                <Card className="p-4">
                    <div className="text-2xl font-bold text-purple-600">{receptionist.experience}</div>
                    <div className="text-sm text-muted-foreground">Kinh nghiệm</div>
                </Card>
            </div>

            {/* Bio */}
            <Card className="p-6">
                <h4 className="text-lg font-semibold text-foreground mb-4">Giới thiệu</h4>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{receptionist.bio}</p>
            </Card>

            {/* Education & Certifications */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-6">
                    <h4 className="text-lg font-semibold text-foreground mb-4">Học vấn</h4>
                    <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-slate-500" />
                            <span className="text-sm">{receptionist.education}</span>
                        </div>
                    </div>
                </Card>
                <Card className="p-6">
                    <h4 className="text-lg font-semibold text-foreground mb-4">Chứng chỉ</h4>
                    <div className="space-y-2">
                        {receptionist.certifications.map((cert, index) => (
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
                    {receptionist.schedule.map((schedule, index) => (
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

    const renderActivities = () => (
        <div className="space-y-6">
            <Card className="p-6">
                <h4 className="text-lg font-semibold text-foreground mb-4">Hoạt động gần đây</h4>
                <div className="space-y-3">
                    {receptionist.recentActivities.map(activity => (
                        <div
                            key={activity.id}
                            className="flex items-center justify-between p-4 border border-border rounded-lg"
                        >
                            <div>
                                <div className="font-medium">{activity.action}</div>
                                <div className="text-sm text-slate-500">
                                    {activity.date} - {activity.time}
                                </div>
                            </div>
                            <Badge variant={activity.status === 'completed' ? 'default' : 'secondary'}>
                                {activity.status === 'completed' ? 'Hoàn thành' : 'Đã lên lịch'}
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
                        <h2 className="text-2xl font-bold text-foreground">Hồ sơ chi tiết lễ tân</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            Thông tin chi tiết và lịch sử hoạt động của lễ tân
                        </p>
                    </div>
                </div>
                <Button onClick={() => onEdit(receptionist.id)} className="flex items-center space-x-2">
                    <Edit className="h-4 w-4" />
                    <span>Chỉnh sửa</span>
                </Button>
            </div>

            {/* Status Badge */}
            <div className="flex items-center space-x-4">
                <Badge variant={receptionist.status === 'active' ? 'default' : 'secondary'}>
                    {receptionist.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                </Badge>
                <Badge variant={receptionist.receptionistType === 'internal' ? 'default' : 'outline'}>
                    {receptionist.receptionistType === 'internal' ? 'Lễ tân nội bộ' : 'Lễ tân ngoài'}
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
                <TabPanel id="activities">{renderActivities()}</TabPanel>
                <TabPanel id="documents">{renderDocuments()}</TabPanel>
            </Tabs>
        </div>
    )
}
