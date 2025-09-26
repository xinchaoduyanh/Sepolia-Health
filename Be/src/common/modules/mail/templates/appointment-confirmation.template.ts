export interface AppointmentConfirmationData {
  patientName: string;
  doctorName: string;
  appointmentDate: string;
  appointmentTime: string;
  clinicName: string;
  appointmentId: string;
  clinicAddress: string;
  clinicPhone: string;
  notes?: string;
}

export const getAppointmentConfirmationTemplate = (
  data: AppointmentConfirmationData,
) => {
  return {
    subject: `Xác nhận lịch hẹn - ${data.clinicName}`,
    html: `
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Xác nhận lịch hẹn</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .container {
            background-color: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 10px;
          }
          .title {
            color: #27ae60;
            font-size: 28px;
            margin-bottom: 20px;
          }
          .appointment-details {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 5px;
            margin: 20px 0;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding: 5px 0;
            border-bottom: 1px solid #eee;
          }
          .detail-label {
            font-weight: bold;
            color: #2c3e50;
          }
          .detail-value {
            color: #333;
          }
          .notes {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 5px;
            padding: 15px;
            margin: 20px 0;
            color: #856404;
          }
          .footer {
            border-top: 1px solid #eee;
            padding-top: 20px;
            margin-top: 30px;
            font-size: 12px;
            color: #7f8c8d;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">${data.clinicName}</div>
            <h1 class="title">✅ Lịch hẹn đã được xác nhận</h1>
          </div>
          
          <div class="content">
            <p>Xin chào <strong>${data.patientName}</strong>,</p>
            <p>Lịch hẹn của bạn đã được xác nhận thành công. Dưới đây là thông tin chi tiết:</p>
            
            <div class="appointment-details">
              <div class="detail-row">
                <span class="detail-label">Mã lịch hẹn:</span>
                <span class="detail-value">${data.appointmentId}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Bác sĩ:</span>
                <span class="detail-value">${data.doctorName}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Ngày:</span>
                <span class="detail-value">${data.appointmentDate}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Giờ:</span>
                <span class="detail-value">${data.appointmentTime}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Địa chỉ:</span>
                <span class="detail-value">${data.clinicAddress}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Điện thoại:</span>
                <span class="detail-value">${data.clinicPhone}</span>
              </div>
            </div>
            
            ${
              data.notes
                ? `
              <div class="notes">
                <strong>📝 Ghi chú:</strong><br>
                ${data.notes}
              </div>
            `
                : ''
            }
            
            <p><strong>Lưu ý:</strong></p>
            <ul>
              <li>Vui lòng đến trước 15 phút để làm thủ tục</li>
              <li>Mang theo CMND/CCCD và thẻ BHYT (nếu có)</li>
              <li>Liên hệ ${data.clinicPhone} nếu cần hủy hoặc đổi lịch</li>
            </ul>
          </div>
          
          <div class="footer">
            <p>Email này được gửi tự động từ hệ thống ${data.clinicName}</p>
            <p>Cảm ơn bạn đã tin tưởng dịch vụ của chúng tôi!</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };
};
