'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Tabs, TabList, TabPanel, Tab } from '@workspace/ui/components/Tabs'
import { Card } from '@workspace/ui/components/Card'
import { Button } from '@workspace/ui/components/Button'
import { InputField } from '@workspace/ui/components/InputField'
import { Label } from '@workspace/ui/components/Label'
import { Badge } from '@workspace/ui/components/Badge'
import { Loader2, Mail, QrCode, AlertCircle, User, Calendar, Clock, CreditCard } from 'lucide-react'
import { QRScanner } from '@/components/QRScanner'
import { PaymentUpdateDialog } from '@/components/PaymentUpdateDialog'
import { QRPaymentGenerator } from '@/components/QRPaymentGenerator'
import { useAppointment } from '@/shared/hooks/useAppointment'
import { appointmentService } from '@/shared/lib/api-services/appointment.service'
import { toast } from '@workspace/ui/components/Sonner'

export default function CheckinPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'email' | 'qr'>('email')
  const [email, setEmail] = useState('')
  const [emailLoading, setEmailLoading] = useState(false)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [appointmentId, setAppointmentId] = useState<string | null>(null)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [showQRPayment, setShowQRPayment] = useState(false)

  // Get appointment details when appointmentId is set
  const { data: appointment, isLoading: appointmentLoading } = useAppointment(
    appointmentId ? parseInt(appointmentId) : 0,
    !!appointmentId
  )

  const handleEmailSearch = async () => {
    if (!email.trim()) {
      setSearchError('Vui lòng nhập email bệnh nhân')
      return
    }

    setEmailLoading(true)
    setSearchError(null)

    try {
      const response = await appointmentService.findPatientByEmail(email)
      setSearchResults(response.data || [])

      if (response.data?.length === 0) {
        setSearchError('Không tìm thấy bệnh nhân với email này')
      }
    } catch (error: any) {
      console.error('Email search error:', error)
      setSearchError(error.response?.data?.message || 'Lỗi khi tìm kiếm bệnh nhân')
    } finally {
      setEmailLoading(false)
    }
  }

  const handleQRScanSuccess = (appointmentId: string) => {
    setAppointmentId(appointmentId)
    setActiveTab('email') // Switch to email tab to show results
    toast.success({ title: 'Thành công', description: 'Đã quét mã QR thành công!' })
  }

  const handleQRScanError = (error: string) => {
    toast.error({ title: 'Lỗi', description: error })
  }

  const handleAppointmentSelect = (aptId: number) => {
    setAppointmentId(aptId.toString())
    setSearchResults([])
    setEmail('')
  }

  const handleBackToSearch = () => {
    setAppointmentId(null)
    setSearchResults([])
    setEmail('')
  }

  const handlePaymentUpdateSuccess = () => {
    // Refresh appointment data
    window.location.reload()
  }

  const handleQRPaymentSuccess = () => {
    toast.success({
      title: 'Thanh toán thành công',
      description: 'Bệnh nhân đã thanh toán qua mã QR'
    })
    setShowQRPayment(false)
    window.location.reload()
  }

  const handleQRPaymentCancel = () => {
    setShowQRPayment(false)
  }

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
    }
  }

  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'Đã thanh toán'
      case 'PENDING':
        return 'Chưa thanh toán'
      default:
        return status
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Tiếp nhận bệnh nhân
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Quét mã QR hoặc tìm kiếm email để tiếp nhận bệnh nhân
        </p>
      </div>

      <Tabs selectedKey={activeTab} onSelectionChange={key => setActiveTab(key as 'email' | 'qr')}>
        <TabList>
          <Tab key="email" id="email">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email
            </div>
          </Tab>
          <Tab key="qr" id="qr">
            <div className="flex items-center gap-2">
              <QrCode className="h-4 w-4" />
              Quét mã QR
            </div>
          </Tab>
        </TabList>

        <TabPanel id="email">
          {!appointmentId ? (
            <>
              {/* Email Search */}
              <Card className="mb-6">
                <div className="p-6">
                  <h3 className="text-lg font-medium mb-2">Tìm kiếm theo Email</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Nhập email của bệnh nhân để tìm lịch hẹn sắp tới
                  </p>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Label htmlFor="email">Email bệnh nhân</Label>
                      <InputField
                        id="email"
                        type="email"
                        placeholder="patient@example.com"
                        value={email}
                        onChange={(e: any) => setEmail(e.target.value)}
                        onKeyDown={(e: any) => e.key === 'Enter' && handleEmailSearch()}
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        onClick={handleEmailSearch}
                        isDisabled={emailLoading || !email.trim()}
                      >
                        {emailLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Đang tìm...
                          </>
                        ) : (
                          'Tìm kiếm'
                        )}
                      </Button>
                    </div>
                  </div>

                  {searchError && (
                    <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <p className="text-red-800 dark:text-red-200 text-sm">{searchError}</p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <Card>
                  <div className="p-6">
                    <h3 className="text-lg font-medium mb-2">Kết quả tìm kiếm</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Tìm thấy {searchResults.length} lịch hẹn sắp tới
                    </p>
                    <div className="space-y-4">
                      {searchResults.map((apt: any) => (
                        <div
                          key={apt.id}
                          className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                          onClick={() => handleAppointmentSelect(apt.id)}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-medium text-lg">
                                {apt.patient?.firstName && apt.patient?.lastName
                                  ? `${apt.patient.firstName} ${apt.patient.lastName}`
                                  : 'N/A'
                                }
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {apt.patient?.phone || 'N/A'}
                              </p>
                            </div>
                            <Badge variant="outline">
                              {apt.status}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              <span>
                                {apt.startTime ? new Date(apt.startTime).toLocaleDateString('vi-VN') : 'N/A'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-gray-400" />
                              <span>{apt.startTime ? new Date(apt.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</span>
                            </div>
                          </div>

                          <div className="mt-3 text-sm">
                            <span className="font-medium">Dịch vụ: </span>
                            {apt.service?.name || 'N/A'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              )}
            </>
          ) : (
            /* Appointment Details */
            <Card>
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-medium">Chi tiết lịch hẹn</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Thông tin chi tiết và trạng thái thanh toán
                    </p>
                  </div>
                  <Button variant="outline" onClick={handleBackToSearch}>
                    Quay lại tìm kiếm
                  </Button>
                </div>

                {appointmentLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : appointment ? (
                  <div className="space-y-6">
                    {/* Patient Info */}
                    <div className="border-b pb-4">
                      <h3 className="font-medium text-lg mb-3 flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Thông tin bệnh nhân
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Họ và tên</p>
                          <p className="font-medium">
                            {appointment.patientProfile?.firstName && appointment.patientProfile?.lastName
                              ? `${appointment.patientProfile.firstName} ${appointment.patientProfile.lastName}`
                              : 'N/A'
                            }
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Số điện thoại</p>
                          <p className="font-medium">
                            {appointment.patientProfile?.phone || 'N/A'}
                          </p>
                        </div>
                        </div>
                    </div>

                    {/* Appointment Info */}
                    <div className="border-b pb-4">
                      <h3 className="font-medium text-lg mb-3 flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Chi tiết lịch hẹn
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Ngày hẹn</p>
                          <p className="font-medium">
                            {appointment.startTime ? new Date(appointment.startTime).toLocaleDateString('vi-VN') : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Khung giờ</p>
                          <p className="font-medium">
                            {appointment.startTime ? new Date(appointment.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Bác sĩ</p>
                          <p className="font-medium">
                            Dr. {appointment.doctor?.firstName && appointment.doctor?.lastName
                              ? `${appointment.doctor.firstName} ${appointment.doctor.lastName}`
                              : 'N/A'
                            }
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Trạng thái</p>
                          <Badge variant="outline">{appointment.status}</Badge>
                        </div>
                      </div>
                      <div className="mt-3">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Dịch vụ</p>
                        <p className="font-medium">
                          {appointment.service?.name || 'N/A'}
                        </p>
                      </div>
                    </div>

                    {/* Payment Info */}
                    <div>
                      <h3 className="font-medium text-lg mb-3 flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Thanh toán
                      </h3>
                      {appointment.billing ? (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Tổng tiền</p>
                            <p className="font-medium text-lg">
                              {formatPrice(appointment.billing.amount)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Trạng thái</p>
                            <Badge className={getPaymentStatusColor(appointment.billing.status)}>
                              {getPaymentStatusText(appointment.billing.status)}
                            </Badge>
                          </div>
                          {appointment.billing.paymentMethod && (
                            <div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">Phương thức</p>
                              <p className="font-medium">
                                {appointment.billing.paymentMethod === 'ONLINE' ? 'Online' : 'Tại quầy'}
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-gray-500">Chưa có thông tin thanh toán</p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                      {appointment.status === 'UPCOMING' && (
                        <Button
                          onClick={() => router.push(`/receptionist/appointment/${appointment.id}`)}
                          className="flex-1"
                        >
                          Check-in
                        </Button>
                      )}
                      {appointment.billing?.status === 'PENDING' && (
                        <div className="flex gap-2 flex-1">
                          <Button
                            variant="outline"
                            onClick={() => setPaymentDialogOpen(true)}
                            className="flex-1"
                          >
                            <CreditCard className="mr-2 h-4 w-4" />
                            Tiền mặt
                          </Button>
                          <Button
                            onClick={() => setShowQRPayment(true)}
                            className="flex-1 bg-blue-600 hover:bg-blue-700"
                          >
                            <QrCode className="mr-2 h-4 w-4" />
                            Quét QR
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            </Card>
          )}
        </TabPanel>

        <TabPanel id="qr">
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-medium mb-2">Quét mã QR</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Đưa mã QR từ ứng dụng bệnh nhân vào khung hình để quét
              </p>
              <QRScanner
                onScanSuccess={handleQRScanSuccess}
                onScanError={handleQRScanError}
              />
            </div>
          </Card>
        </TabPanel>
      </Tabs>

      {/* Payment Update Dialog */}
      <PaymentUpdateDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        billing={appointment?.billing ? {
          id: appointment.billing.id,
          amount: appointment.billing.amount,
          status: appointment.billing.status
        } : undefined}
        onUpdateSuccess={handlePaymentUpdateSuccess}
      />

      {/* QR Payment Dialog */}
      {showQRPayment && appointment?.billing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Thanh toán qua mã QR</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleQRPaymentCancel}
                >
                  ✕
                </Button>
              </div>
              <QRPaymentGenerator
                appointmentId={appointment.id}
                amount={appointment.billing.amount}
                onPaymentSuccess={handleQRPaymentSuccess}
                onCancel={handleQRPaymentCancel}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}