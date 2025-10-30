import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { SepayApiKeyGuard } from '@/common/guards';
import { CurrentUser, Public } from '@/common/decorators';
import {
  CreateQrScanDto,
  QrScanResponseDto,
  SepayWebhookPayloadDto,
  SepayWebhookResponseDto,
  CancelPaymentCodeDto,
  CancelPaymentCodeResponseDto,
} from './dto';
import { User } from '@prisma/client';

@ApiTags('Payment')
@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('create-qr-scan')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tạo QR code để thanh toán' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: QrScanResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dữ liệu không hợp lệ',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Appointment không tồn tại',
  })
  async createQrScan(
    @Body() createQrScanDto: CreateQrScanDto,
    @CurrentUser() user: User,
  ): Promise<QrScanResponseDto> {
    return this.paymentService.createQrScan(createQrScanDto, user);
  }

  @Post('sepay-webhook')
  @Public() // Bypass JWT Guard, use SepayApiKeyGuard instead
  @HttpCode(HttpStatus.OK)
  @UseGuards(SepayApiKeyGuard)
  @ApiOperation({ summary: 'Webhook nhận thông báo thanh toán từ SEPAY' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SepayWebhookResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'API key không hợp lệ',
  })
  sepayWebhook(
    @Body() webhookPayload: SepayWebhookPayloadDto,
  ): Promise<SepayWebhookResponseDto> {
    return this.paymentService.handleSepayWebhook(webhookPayload);
  }

  @Post('cancel-payment-code')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Hủy mã thanh toán' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: CancelPaymentCodeResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dữ liệu không hợp lệ hoặc không thể hủy',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy appointment hoặc mã thanh toán',
  })
  async cancelPaymentCode(
    @Body() cancelPaymentCodeDto: CancelPaymentCodeDto,
    @CurrentUser() user: User,
  ): Promise<CancelPaymentCodeResponseDto> {
    return this.paymentService.cancelPaymentCode(
      cancelPaymentCodeDto.appointmentId,
      user,
    );
  }
}
