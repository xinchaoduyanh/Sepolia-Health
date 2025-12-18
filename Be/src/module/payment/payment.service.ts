import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { ConfigType } from '@nestjs/config';
import { appConfig } from '@/common/config';
import { TransactionStatus, PaymentStatus } from '@prisma/client';
import { ERROR_MESSAGES } from '@/common/constants/error-messages';
import { RedisService } from '@/common/modules/redis';
import { NotificationService } from '@/module/notification/notification.service';
import { NotificationType, NotificationPriority } from '@/module/notification/notification.types';
import {
  CreateQrScanDto,
  QrScanResponseDto,
  SepayWebhookPayloadDto,
  ApplyVoucherDto,
  ApplyVoucherResponseDto,
} from './dto';
import { MarkAsPaidDto } from './dto/request/mark-as-paid.dto';

@Injectable()
export class PaymentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    @Inject(appConfig.KEY)
    private readonly paymentConf: ConfigType<typeof appConfig>,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Apply voucher to appointment billing
   */
  async applyVoucher(
    applyVoucherDto: ApplyVoucherDto,
    userId: number,
  ): Promise<ApplyVoucherResponseDto> {
    const { appointmentId, userPromotionId } = applyVoucherDto;

    // Check if appointment exists and belongs to user
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patientProfile: true,
        billing: true,
        service: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException(ERROR_MESSAGES.PAYMENT.APPOINTMENT_NOT_FOUND);
    }

    // Check permission
    if (appointment.patientProfile?.managerId !== userId) {
      throw new BadRequestException(
        'Bạn không có quyền áp dụng voucher cho appointment này',
      );
    }

    // Validate billing exists
    if (!appointment.billing) {
      throw new BadRequestException(
        'Billing không tồn tại cho appointment này',
      );
    }

    if (appointment.billing.status === PaymentStatus.PAID) {
      throw new BadRequestException(
        'Không thể áp dụng voucher cho appointment đã thanh toán',
      );
    }

    // Get user promotion
    const userPromotion = await this.prisma.userPromotion.findUnique({
      where: { id: userPromotionId },
      include: { promotion: true },
    });

    if (!userPromotion) {
      throw new NotFoundException('Không tìm thấy voucher');
    }

    // Validate user owns the voucher
    if (userPromotion.userId !== userId) {
      throw new BadRequestException('Bạn không sở hữu voucher này');
    }

    // Validate voucher chưa được sử dụng
    if (userPromotion.usedAt !== null) {
      throw new BadRequestException('Voucher này đã được sử dụng');
    }

    // Validate voucher còn hạn
    const now = new Date();
    if (
      now < userPromotion.promotion.validFrom ||
      now > userPromotion.promotion.validTo
    ) {
      throw new BadRequestException('Voucher đã hết hạn');
    }

    // Get original amount from service price (billing.amount giữ nguyên)
    const originalAmount =
      appointment.service?.price || appointment.billing.amount;

    // Calculate discount (FE cũng tính, nhưng BE cũng tính để trả về)
    const discountAmount = Math.min(
      (originalAmount * userPromotion.promotion.discountPercent) / 100,
      userPromotion.promotion.maxDiscountAmount,
    );

    const finalAmount = Math.max(0, originalAmount - discountAmount);

    // KHÔNG lưu vào billing, chỉ tính toán và trả về
    // userPromotionId sẽ được lưu vào transaction khi tạo QR

    return {
      originalAmount,
      discountAmount,
      finalAmount,
      voucherInfo: {
        id: userPromotion.promotion.id,
        title: userPromotion.promotion.title,
        code: userPromotion.promotion.code,
        discountPercent: userPromotion.promotion.discountPercent,
        maxDiscountAmount: userPromotion.promotion.maxDiscountAmount,
      },
    };
  }

  /**
   * Create QR code for payment
   */
  async createQrScan(
    createQrScanDto: CreateQrScanDto,
    userId: number,
  ): Promise<QrScanResponseDto> {
    const { appointmentId, amount, userPromotionId } = createQrScanDto;

    // Check if appointment exists and needs payment
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        billing: true,
        patientProfile: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException(ERROR_MESSAGES.PAYMENT.APPOINTMENT_NOT_FOUND);
    }

    // Check permission
    if (appointment.patientProfile?.managerId !== userId) {
      throw new BadRequestException(
        'Bạn không có quyền tạo mã QR thanh toán cho appointment này',
      );
    }

    // Validate billing exists (should be created with appointment)
    if (!appointment.billing) {
      throw new BadRequestException(
        'Billing không tồn tại cho appointment này',
      );
    }

    const billing = appointment.billing;

    if (billing.status === PaymentStatus.PAID) {
      throw new BadRequestException(
        ERROR_MESSAGES.PAYMENT.APPOINTMENT_ALREADY_PAID,
      );
    }

    // If userPromotionId is provided, validate voucher exists and belongs to user
    // Không cần check usedAt vì chỉ khi thanh toán thành công mới update usedAt
    if (userPromotionId) {
      const userPromotion = await this.prisma.userPromotion.findUnique({
        where: { id: userPromotionId },
        include: { promotion: true },
      });

      if (!userPromotion) {
        throw new NotFoundException('Không tìm thấy voucher');
      }

      if (userPromotion.userId !== userId) {
        throw new BadRequestException('Bạn không sở hữu voucher này');
      }

      // Validate voucher còn hạn
      const now = new Date();
      if (
        now < userPromotion.promotion.validFrom ||
        now > userPromotion.promotion.validTo
      ) {
        throw new BadRequestException('Voucher đã hết hạn');
      }

      // Validate voucher chưa được sử dụng (usedAt === null)
      if (userPromotion.usedAt !== null) {
        throw new BadRequestException('Voucher này đã được sử dụng');
      }

      // Không cần check billing.userPromotionId nữa vì không lưu vào billing khi apply
    }

    // Set payment method to ONLINE if not set (KHÔNG update amount)
    if (!billing.paymentMethod) {
      await this.prisma.billing.update({
        where: { id: billing.id },
        data: { paymentMethod: 'ONLINE' },
      });
    }

    // Generate unique payment code: AppointmentID + random (total 10 digits)
    const paymentCode = await this.generateUniquePaymentCode(appointmentId);
    const fullPaymentCode = `DADZ${paymentCode}`;

    // Cancel existing payment code for this appointment (if any)
    const existingCode =
      await this.redis.getPaymentCodeByAppointmentId(appointmentId);
    if (existingCode) {
      await this.redis.cancelPaymentCode(existingCode);
    }

    console.log(
      'Cancelling existing payment code for appointment:',
      appointmentId,
      'Code:',
      existingCode,
    );

    // Create transaction record with userPromotionId (if provided)
    const transaction = await this.prisma.transaction.create({
      data: {
        billingId: billing.id,
        amount,
        status: TransactionStatus.PENDING,
        provider: 'SEPAY_QR',
        userId: userId,
        userPromotionId: userPromotionId || null,
      } as any,
    });

    // Save payment code to Redis with 10 minutes expiration
    const expiresInSeconds = 10 * 60; // 10 minutes
    await this.redis.setPaymentCode(
      fullPaymentCode,
      {
        billingId: billing.id,
        appointmentId: appointment.id,
        amount,
      },
      expiresInSeconds,
    );

    const sepayAccountNumber = this.paymentConf.sepayAccountNumber;
    const sepayBankCode = this.paymentConf.sepayBankCode;

    // SEPAY QR format: https://qr.sepay.vn/img?acc={account}&bank={bankCode}&amount={amount}&des={description}
    const qrCodeUrl = `https://qr.sepay.vn/img?acc=${sepayAccountNumber}&bank=${sepayBankCode}&amount=4000&des=DADZ${paymentCode}`;

    console.log('Generated QR Code Details:');
    console.log('- Payment Code (raw):', paymentCode);
    console.log('- Payment Code (full):', fullPaymentCode);
    console.log('- Original Amount:', amount);
    console.log('- QR Amount: 4000 (hardcoded)');
    console.log('- Description: DADZ' + paymentCode);
    console.log('- SEPAY Account:', sepayAccountNumber);
    console.log('- SEPAY Bank Code:', sepayBankCode);
    console.log('- QR Code URL:', qrCodeUrl);

    return {
      qrCodeUrl,
      transactionId: transaction.id.toString(),
      amount,
      appointmentId,
      paymentCode,
      expiresAt: new Date(Date.now() + expiresInSeconds * 1000).toISOString(),
    };
  }

  /**
   * Generate unique payment code in format: AppointmentID + randomNum (total 10 digits)
   * Example: Appointment ID = 123 → Code = 1230012345 (123 + 0012345)
   */
  private async generateUniquePaymentCode(
    appointmentId: number,
  ): Promise<string> {
    let attempts = 0;
    const maxAttempts = 10;

    // Convert appointmentId to string
    const appointmentIdStr = appointmentId.toString();
    const appointmentIdLength = appointmentIdStr.length;

    // Calculate how many random digits we need (10 - appointmentId length)
    const randomDigitsNeeded = 10 - appointmentIdLength;

    if (randomDigitsNeeded <= 0) {
      throw new BadRequestException(
        'Appointment ID quá dài để tạo mã thanh toán',
      );
    }

    while (attempts < maxAttempts) {
      // Generate random number with exactly randomDigitsNeeded digits
      const maxRandom = Math.pow(10, randomDigitsNeeded) - 1;
      const minRandom = Math.pow(10, randomDigitsNeeded - 1);
      const randomNum = Math.floor(
        Math.random() * (maxRandom - minRandom + 1) + minRandom,
      );

      // Combine: appointmentId + randomNum
      const code = `${appointmentIdStr}${randomNum.toString().padStart(randomDigitsNeeded, '0')}`;

      // Check if code already exists in Redis
      const existingCode = await this.redis.getPaymentCode(code);

      if (!existingCode) {
        return code;
      }

      attempts++;
    }

    throw new BadRequestException(
      ERROR_MESSAGES.PAYMENT.PAYMENT_CODE_GENERATION_FAILED,
    );
  }

  /**
   * Handle SEPAY webhook
   */
  async handleSepayWebhook(
    webhookPayload: SepayWebhookPayloadDto,
  ): Promise<{ success: boolean; transactionId: string }> {
    // Extract payment code from content using regex pattern (DADZ + 10 digits)
    const paymentCodeMatch = webhookPayload.content.match(/DADZ(\d{10})/);

    if (!paymentCodeMatch) {
      throw new BadRequestException(
        ERROR_MESSAGES.PAYMENT.PAYMENT_CODE_NOT_FOUND_IN_CONTENT,
      );
    }

    const paymentCode = `DADZ${paymentCodeMatch[1]}`;

    console.log('Webhook processing:');
    console.log('- Raw content:', webhookPayload.content);
    console.log('- Extracted payment code:', paymentCode);
    console.log('- Transfer amount:', webhookPayload.transferAmount);

    // Get payment code from Redis
    const paymentCodeData = await this.redis.getPaymentCode(paymentCode);

    console.log('- Payment code data from Redis:', paymentCodeData);

    if (!paymentCodeData) {
      throw new NotFoundException(
        ERROR_MESSAGES.PAYMENT.PAYMENT_CODE_NOT_FOUND,
      );
    }

    // Check if payment code is already used
    if (paymentCodeData.isUsed) {
      throw new BadRequestException(
        ERROR_MESSAGES.PAYMENT.PAYMENT_CODE_ALREADY_USED,
      );
    }

    // Check if payment code is expired (with 5 minutes grace period)
    const now = new Date();
    const expiresAt = new Date(paymentCodeData.expiresAt);
    const gracePeriod = 5 * 60 * 1000; // 5 minutes

    const isExpired = now.getTime() > expiresAt.getTime() + gracePeriod;

    // Get billing with transactions
    const billing = await this.prisma.billing.findUnique({
      where: { id: paymentCodeData.billingId },
      include: { transactions: true },
    });

    if (!billing) {
      throw new NotFoundException('Billing không tồn tại');
    }

    // Find the pending transaction for this billing
    const transaction = billing.transactions.find(
      (t) => t.status === TransactionStatus.PENDING,
    );

    if (!transaction) {
      throw new NotFoundException(ERROR_MESSAGES.PAYMENT.TRANSACTION_NOT_FOUND);
    }

    // Verify amount matches
    // if (transaction.amount !== webhookPayload.transferAmount) {
    //   throw new BadRequestException(ERROR_MESSAGES.PAYMENT.AMOUNT_MISMATCH);
    // }

    // Update transaction status
    const providerMessage = isExpired
      ? `Thanh toán muộn ${Math.floor((now.getTime() - expiresAt.getTime()) / 1000 / 60)} phút sau khi QR hết hạn`
      : webhookPayload.description;

    await this.prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        status: TransactionStatus.SUCCESS,
        providerTransactionId: webhookPayload.id.toString(),
        providerMessage: providerMessage,
        rawWebhookPayload: webhookPayload as any,
      },
    });

    // Get transaction with userPromotion to check if voucher was used
    const transactionWithVoucher = await this.prisma.transaction.findUnique({
      where: { id: transaction.id },
      include: { userPromotion: true } as any,
    });

    // Update billing status
    await this.prisma.billing.update({
      where: { id: paymentCodeData.billingId },
      data: {
        status: PaymentStatus.PAID,
      },
    });

    // Chỉ khi thanh toán thành công mới update voucher usedAt và billing.userPromotionId
    const transactionWithVoucherTyped = transactionWithVoucher as any;
    if (
      transactionWithVoucherTyped?.userPromotionId &&
      transactionWithVoucherTyped.userPromotion
    ) {
      // Update userPromotion.usedAt
      await this.prisma.userPromotion.update({
        where: { id: transactionWithVoucherTyped.userPromotionId },
        data: {
          usedAt: new Date(),
        },
      });

      // Update billing.userPromotionId (chỉ update sau khi thanh toán thành công)
      await this.prisma.billing.update({
        where: { id: paymentCodeData.billingId },
        data: {
          userPromotionId: transactionWithVoucherTyped.userPromotionId,
        } as any,
      });
    }

    // Mark payment code as used in Redis
    await this.redis.markPaymentCodeAsUsed(paymentCode);

    // Send notification to patient when payment is successful
    try {
      // Get appointment with patient and service info via billing
      const appointment = await this.prisma.appointment.findFirst({
        where: {
          billing: {
            id: paymentCodeData.billingId,
          },
        },
        include: {
          patientProfile: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              managerId: true,
            },
          },
          doctor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              userId: true,
            },
          },
          service: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (appointment && appointment.patientProfile?.managerId) {
        const patientUserId = appointment.patientProfile.managerId.toString();

        // Send payment success notification to patient
        await this.notificationService.sendPaymentSuccessNotification({
          appointmentId: appointment.id,
          billingId: paymentCodeData.billingId,
          amount: billing.amount,
          recipientId: patientUserId,
          serviceName: appointment.service?.name,
          doctorName:
            `${appointment.doctor?.firstName || ''} ${appointment.doctor?.lastName || ''}`.trim(),
          transactionId: transaction.id.toString(),
          paymentMethod: 'SEPAY',
        });

        // Send payment success notification to doctor (NEW)
        if (appointment.doctor?.userId) {
          const formattedAmount = new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
          }).format(billing.amount);

          try {
            await this.notificationService.sendNotification({
              type: NotificationType.PAYMENT_SUCCESS,
              priority: NotificationPriority.MEDIUM,
              recipientId: appointment.doctor.userId.toString(),
              senderId: 'system',
              title: 'Thanh toán lịch hẹn thành công',
              message: `Bệnh nhân ${appointment.patientProfile.firstName} ${appointment.patientProfile.lastName} đã thanh toán thành công cho lịch hẹn #${appointment.id}. Số tiền: ${formattedAmount}. Dịch vụ: ${appointment.service?.name}.`,
              metadata: {
                appointmentId: appointment.id,
                billingId: paymentCodeData.billingId,
                amount: billing.amount,
                transactionId: transaction.id.toString(),
                paymentMethod: 'SEPAY',
                targetType: 'individual',
                recipientRole: 'DOCTOR',
              },
            });
          } catch (error) {
            console.error('Failed to send payment notification to doctor:', error);
          }
        }

        // Send payment success notification to receptionists (NEW)
        if (appointment.clinicId) {
          try {
            await this.notificationService.sendToClinicReceptionists(appointment.clinicId, {
              type: NotificationType.APPOINTMENT_PAYMENT_COMPLETED,
              title: 'Thanh toán lịch hẹn thành công',
              message: `Bệnh nhân ${appointment.patientProfile.firstName} ${appointment.patientProfile.lastName} đã thanh toán thành công cho lịch hẹn #${appointment.id} với Bác sĩ ${appointment.doctor?.firstName || ''} ${appointment.doctor?.lastName || ''}. Số tiền: ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(billing.amount)}.`,
              priority: NotificationPriority.MEDIUM,
              metadata: {
                appointmentId: appointment.id,
                billingId: paymentCodeData.billingId,
                amount: billing.amount,
                patientId: appointment.patientProfile.managerId,
                doctorId: appointment.doctor?.userId,
              },
            });
          } catch (error) {
            console.error('Failed to send payment notification to receptionists:', error);
          }
        }
      }
    } catch (error) {
      console.error(
        'Failed to send payment success notification to patient:',
        error,
      );
      // Don't throw error, just log it
    }

    return {
      success: true,
      transactionId: transaction.id.toString(),
    };
  }

  /**
   * Check payment status by appointmentId
   */
  async checkPaymentStatus(
    appointmentId: number,
    userId: number,
  ): Promise<{ isPaid: boolean; paymentStatus: PaymentStatus }> {
    // Check if appointment exists and belongs to user
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patientProfile: true,
        billing: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException(ERROR_MESSAGES.PAYMENT.APPOINTMENT_NOT_FOUND);
    }

    // Check permission (user must own the appointment)
    if (appointment.patientProfile?.managerId !== userId) {
      throw new BadRequestException(
        'Bạn không có quyền kiểm tra trạng thái thanh toán này',
      );
    }

    if (!appointment.billing) {
      throw new BadRequestException(
        'Billing không tồn tại cho appointment này',
      );
    }

    return {
      isPaid: appointment.billing.status === PaymentStatus.PAID,
      paymentStatus: appointment.billing.status,
    };
  }

  /**
   * Cancel payment code
   */
  async cancelPaymentCode(
    appointmentId: number,
    userId: number,
  ): Promise<{ success: boolean; message: string }> {
    // Check if appointment exists and belongs to user
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patientProfile: true,
        billing: true,
        service: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException(ERROR_MESSAGES.PAYMENT.APPOINTMENT_NOT_FOUND);
    }

    // Check permission (user must own the appointment)
    if (appointment.patientProfile?.managerId !== userId) {
      throw new BadRequestException('Bạn không có quyền hủy mã thanh toán này');
    }

    // Check if billing exists and is already paid
    if (!appointment.billing) {
      throw new BadRequestException(
        'Billing không tồn tại cho appointment này',
      );
    }

    if (appointment.billing.status === PaymentStatus.PAID) {
      throw new BadRequestException(
        'Không thể hủy mã thanh toán đã được thanh toán',
      );
    }

    // Find payment code for this appointment
    const existingCode =
      await this.redis.getPaymentCodeByAppointmentId(appointmentId);

    console.log(
      'Cancelling payment code for appointment:',
      appointmentId,
      'Found code:',
      existingCode,
    );

    if (!existingCode) {
      throw new NotFoundException(
        'Không tìm thấy mã thanh toán cho appointment này',
      );
    }

    // Cancel the payment code
    const cancelled = await this.redis.cancelPaymentCode(existingCode);

    if (!cancelled) {
      throw new BadRequestException('Không thể hủy mã thanh toán');
    }

    // Không cần clear userPromotionId từ billing vì không lưu vào billing khi apply
    // Voucher chỉ được mark as used khi thanh toán thành công
    // Transaction với userPromotionId vẫn còn nhưng không ảnh hưởng vì chưa thanh toán thành công

    return {
      success: true,
      message: 'Đã hủy mã thanh toán thành công',
    };
  }

  /**
   * Mark billing as paid (offline payment)
   */
  async markAsPaid(billingId: number, markAsPaidDto: MarkAsPaidDto): Promise<any> {
    // Get billing
    const billing = await this.prisma.billing.findUnique({
      where: { id: billingId }
    });

    if (!billing) {
      throw new NotFoundException('Không tìm thấy thông tin thanh toán');
    }

    if (billing.status !== PaymentStatus.PENDING) {
      throw new BadRequestException('Chỉ có thể cập nhật trạng thái cho hóa đơn chưa thanh toán');
    }

    // Simply update billing status
    const updatedBilling = await this.prisma.billing.update({
      where: { id: billingId },
      data: {
        status: PaymentStatus.PAID,
        paymentMethod: 'OFFLINE',
        notes: markAsPaidDto.receiptNumber ? `Biên lai: ${markAsPaidDto.receiptNumber}` : 'Thanh toán tại quầy'
      }
    });

    return {
      success: true,
      message: 'Đã cập nhật trạng thái thanh toán thành công',
      data: updatedBilling
    };
  }
}
