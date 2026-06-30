import { Public } from '@/common/decorators';
import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { AiBridgeService } from './ai-bridge.service';
import { ConfirmBookingDto, CreateBookingDraftDto } from './dto/ai-bridge.dto';
import { InternalTokenGuard } from './guards/internal-token.guard';

/**
 * Internal bridge cho AI/ gọi lấy DATA. Routes thực tế: /api/internal/bridge/...
 * @Public() để bỏ qua JwtAuthGuard; InternalTokenGuard thay thế auth.
 */
@Public()
@ApiExcludeController()
@UseGuards(InternalTokenGuard)
@Controller('internal/bridge')
export class AiBridgeController {
  constructor(private readonly bridge: AiBridgeService) {}

  /** actingUserId từ header (Be/ đã auth ở session, KHÔNG phải LLM/user nhập). */
  private actingUserId(header?: string): number {
    const id = Number(header);
    if (!header || Number.isNaN(id)) {
      throw new BadRequestException('Missing X-Acting-User-Id');
    }
    return id;
  }

  private numOrUndef(v?: string): number | undefined {
    if (v === undefined || v === '') return undefined;
    const n = Number(v);
    return Number.isNaN(n) ? undefined : n;
  }

  // ---- public data ----
  @Get('clinics')
  searchClinics(@Query('q') q?: string, @Query('location') location?: string) {
    return this.bridge.searchClinics(q, location);
  }

  @Get('services')
  searchServices(@Query('q') q?: string, @Query('clinicId') clinicId?: string) {
    return this.bridge.searchServices(q, this.numOrUndef(clinicId));
  }

  @Get('doctors')
  searchDoctors(
    @Query('q') q?: string,
    @Query('serviceId') serviceId?: string,
    @Query('clinicId') clinicId?: string,
  ) {
    return this.bridge.searchDoctors(q, this.numOrUndef(serviceId), this.numOrUndef(clinicId));
  }

  @Get('doctors/available')
  findAvailableDoctors(
    @Query('date') date: string,
    @Query('serviceId') serviceId?: string,
    @Query('clinicId') clinicId?: string,
    @Query('timePreference') timePreference?: string,
  ) {
    return this.bridge.findAvailableDoctors(
      date,
      this.numOrUndef(serviceId),
      this.numOrUndef(clinicId),
      timePreference,
    );
  }

  @Get('doctors/:id/availability')
  getDoctorAvailability(
    @Param('id', ParseIntPipe) id: number,
    @Query('date') date: string,
    @Query('serviceId') serviceId?: string,
  ) {
    return this.bridge.getDoctorAvailability(id, date, this.numOrUndef(serviceId));
  }

  // ---- personal data (ownership) ----
  @Get('patients/:userId')
  resolvePatient(
    @Param('userId', ParseIntPipe) userId: number,
    @Headers('x-acting-user-id') acting?: string,
  ) {
    const actingUserId = this.actingUserId(acting);
    if (userId !== actingUserId) throw new ForbiddenException('forbidden_cross_user');
    return this.bridge.resolvePatientProfile(actingUserId);
  }

  @Get('patients/:userId/upcoming-appointments')
  upcoming(
    @Param('userId', ParseIntPipe) userId: number,
    @Headers('x-acting-user-id') acting?: string,
  ) {
    const actingUserId = this.actingUserId(acting);
    if (userId !== actingUserId) throw new ForbiddenException('forbidden_cross_user');
    return this.bridge.getUpcomingAppointments(actingUserId);
  }

  @Post('booking-drafts')
  createDraft(
    @Body() body: CreateBookingDraftDto,
    @Headers('x-acting-user-id') acting?: string,
  ) {
    return this.bridge.createBookingDraft(this.actingUserId(acting), body);
  }

  @Post('booking-drafts/:id/confirm')
  confirmDraft(
    @Param('id') id: string,
    @Body() _body: ConfirmBookingDto,
    @Headers('x-acting-user-id') acting?: string,
  ) {
    return this.bridge.confirmBooking(this.actingUserId(acting), id);
  }
}
