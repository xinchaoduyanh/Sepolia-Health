import {
  Controller,
  Get,
  Post,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { PromotionService } from './promotion.service';
import {
  FeaturedPromotionResponseDto,
  UserPromotionDto,
  ClaimPromotionResponseDto,
} from './promotion.dto';
import { JwtAuthGuard } from '@/common/guards';
import { CurrentUser } from '@/common/decorators';

@ApiTags('Patient Promotion')
@Controller('patient/promotions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class PromotionController {
  constructor(private readonly promotionService: PromotionService) {}

  @Get('featured')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lấy promotion đang hiển thị trên app' })
  @ApiResponse({
    status: 200,
    description: 'Lấy promotion thành công',
    type: FeaturedPromotionResponseDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Không có promotion active',
    schema: {
      type: 'null',
    },
  })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  async getFeaturedPromotion(): Promise<FeaturedPromotionResponseDto | null> {
    return this.promotionService.getFeaturedPromotion();
  }

  @Get('my-vouchers')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lấy danh sách vouchers đã claim' })
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách vouchers thành công',
    type: [UserPromotionDto],
  })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  async getMyVouchers(
    @CurrentUser('userId') userId: number,
  ): Promise<UserPromotionDto[]> {
    return this.promotionService.getMyVouchers(userId);
  }

  @Post(':id/claim')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Claim voucher' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID promotion' })
  @ApiResponse({
    status: 200,
    description: 'Claim voucher thành công hoặc đã claim rồi',
    type: ClaimPromotionResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Promotion không còn hiệu lực' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy promotion' })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  async claimPromotion(
    @Param('id', ParseIntPipe) promotionId: number,
    @CurrentUser('userId') userId: number,
  ): Promise<ClaimPromotionResponseDto> {
    return this.promotionService.claimPromotion(promotionId, userId);
  }
}
