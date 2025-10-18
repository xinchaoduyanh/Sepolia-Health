'use client'

import { useState } from 'react'
import { Calendar, ChevronDown, Search, User, Phone, Calendar as CalendarIcon } from 'lucide-react'

export default function ScheduleAppointmentPage() {
    const [selectedGender, setSelectedGender] = useState('male')
    const [searchDoctor, setSearchDoctor] = useState('')

    const doctors = [
        'Vũ Đình Hùng-uidname',
        'Trần Đình Long-uidname',
        'Huỳnh Thoại Loan-uidname',
        'Ngô Đình Hiếu-uidname',
        'Phan Phúc Long-uidname',
    ]

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Đặt lịch khám</h1>
                <nav className="flex space-x-2 text-sm text-gray-500">
                    <span>Chăm sóc sức khỏe từ xa</span>
                    <span>/</span>
                    <span className="text-blue-600 font-medium">Đặt lịch khám</span>
                </nav>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Customer Information */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Thông tin khách hàng</h2>

                    <div className="space-y-4">
                        {/* PID */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">PID</label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Nhập PID"
                            />
                        </div>

                        {/* Full Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên</label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Nhập họ tên"
                            />
                        </div>

                        {/* Date of Birth */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Ngày sinh</label>
                            <div className="relative">
                                <input
                                    type="date"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                <CalendarIcon className="absolute right-3 top-2.5 w-5 h-5 text-gray-400" />
                            </div>
                        </div>

                        {/* Phone Number */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                            <input
                                type="tel"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Nhập số điện thoại"
                            />
                        </div>

                        {/* Gender */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Giới tính</label>
                            <div className="flex space-x-4">
                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        name="gender"
                                        value="male"
                                        checked={selectedGender === 'male'}
                                        onChange={e => setSelectedGender(e.target.value)}
                                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">Nam</span>
                                </label>
                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        name="gender"
                                        value="female"
                                        checked={selectedGender === 'female'}
                                        onChange={e => setSelectedGender(e.target.value)}
                                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">Nữ</span>
                                </label>
                            </div>
                        </div>

                        {/* Reason for examination */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Lý do khám</label>
                            <textarea
                                rows={4}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Nhập lý do khám"
                            />
                        </div>
                    </div>
                </div>

                {/* Doctor's Schedule */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Lịch bác sĩ</h2>

                    <div className="space-y-4">
                        {/* Appointment Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Ngày hẹn khám</label>
                            <div className="relative">
                                <input
                                    type="date"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                <CalendarIcon className="absolute right-3 top-2.5 w-5 h-5 text-gray-400" />
                            </div>
                        </div>

                        {/* Service */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Dịch vụ</label>
                            <div className="relative">
                                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none">
                                    <option>Chọn dịch vụ</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-2.5 w-5 h-5 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* Specialty */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Chuyên khoa</label>
                            <div className="relative">
                                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none">
                                    <option>Chọn chuyên khoa</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-2.5 w-5 h-5 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* Examination Duration */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Thời lượng khám</label>
                            <div className="relative">
                                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none">
                                    <option>Chọn thời lượng</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-2.5 w-5 h-5 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* Hospital */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Bệnh viện</label>
                            <div className="relative">
                                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none">
                                    <option>Chọn bệnh viện</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-2.5 w-5 h-5 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* Doctor */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Bác sĩ</label>
                            <div className="relative">
                                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none">
                                    <option>Chọn bác sĩ</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-2.5 w-5 h-5 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* Doctor Search */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tìm bác sĩ</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={searchDoctor}
                                    onChange={e => setSearchDoctor(e.target.value)}
                                    className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Q Tìm bác sĩ"
                                />
                                <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                            </div>

                            {/* Doctor List */}
                            <div className="mt-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
                                {doctors.map((doctor, index) => (
                                    <div
                                        key={index}
                                        className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm text-gray-700 border-b border-gray-100 last:border-b-0"
                                    >
                                        {doctor}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="text-center text-sm text-gray-500 py-4">Copyright © 2021 Vinmec. All rights reserved.</div>
        </div>
    )
}
