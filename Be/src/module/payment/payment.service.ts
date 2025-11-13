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
import {
  CreateQrScanDto,
  QrScanResponseDto,
  SepayWebhookPayloadDto,
} from './dto';

@Injectable()
export class PaymentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    @Inject(appConfig.KEY)
    private readonly paymentConf: ConfigType<typeof appConfig>,
  ) {}

  /**
   * Create QR code for payment
   */
  async createQrScan(
    createQrScanDto: CreateQrScanDto,
    userId: number,
  ): Promise<QrScanResponseDto> {
    const { appointmentId, amount } = createQrScanDto;

    // Check if appointment exists and needs payment
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { billing: true },
    });

    if (!appointment) {
      throw new NotFoundException(ERROR_MESSAGES.PAYMENT.APPOINTMENT_NOT_FOUND);
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

    // Update billing amount if different
    if (billing.amount !== amount) {
      await this.prisma.billing.update({
        where: { id: billing.id },
        data: { amount, paymentMethod: 'ONLINE' },
      });
    } else if (!billing.paymentMethod) {
      // Set payment method to ONLINE if not set
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

    // Create transaction record
    const transaction = await this.prisma.transaction.create({
      data: {
        billingId: billing.id,
        amount,
        status: TransactionStatus.PENDING,
        provider: 'SEPAY_QR',
        userId: userId,
      },
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

    // Update billing status
    await this.prisma.billing.update({
      where: { id: paymentCodeData.billingId },
      data: {
        status: PaymentStatus.PAID,
      },
    });

    // Mark payment code as used in Redis
    await this.redis.markPaymentCodeAsUsed(paymentCode);

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

    return {
      success: true,
      message: 'Đã hủy mã thanh toán thành công',
    };
  }
}
