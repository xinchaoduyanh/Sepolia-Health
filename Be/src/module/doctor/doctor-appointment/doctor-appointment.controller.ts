import { CurrentUser, Roles } from '@/common/decorators';
import { JwtAuthGuard, RolesGuard } from '@/common/guards';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { DoctorAppointmentService } from './doctor-appointment.service';
import {
  AppointmentResultDto,
  CreateAppointmentResultDto,
  DoctorAppointmentDetailDto,
  DoctorAppointmentsListResponseDto,
  GetDoctorAppointmentsQueryDto,
} from './dto';
import { AppointmentResultFileDto } from './dto/appointment-result-file.dto';

@ApiTags('Doctor Appointments')
@Controller('doctor/appointments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.DOCTOR)
export class DoctorAppointmentController {
  constructor(
    private readonly doctorAppointmentService: DoctorAppointmentService,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lấy danh sách appointments của doctor' })
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách thành công',
    type: DoctorAppointmentsListResponseDto,
  })
  async getAppointments(
    @Query() query: GetDoctorAppointmentsQueryDto,
    @CurrentUser('userId') userId: number,
  ): Promise<DoctorAppointmentsListResponseDto> {
    return this.doctorAppointmentService.getDoctorAppointments(query, userId);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lấy chi tiết appointment của doctor' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID appointment' })
  @ApiResponse({
    status: 200,
    description: 'Lấy chi tiết thành công',
    type: DoctorAppointmentDetailDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Không có quyền xem appointment này',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy appointment',
  })
  async getAppointmentById(
    @Param('id', ParseIntPipe) appointmentId: number,
    @CurrentUser('userId') userId: number,
  ): Promise<DoctorAppointmentDetailDto> {
    return this.doctorAppointmentService.getAppointmentById(
      appointmentId,
      userId,
    );
  }

  @Post(':id/result')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Tạo hoặc cập nhật kết quả khám cho appointment',
  })
  @ApiParam({ name: 'id', type: 'number', description: 'ID appointment' })
  @ApiResponse({
    status: 201,
    description: 'Tạo/cập nhật kết quả thành công',
    type: AppointmentResultDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Appointment chưa hoàn thành hoặc dữ liệu không hợp lệ',
  })
  @ApiResponse({
    status: 403,
    description: 'Không có quyền tạo kết quả cho appointment này',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy appointment',
  })
  async createOrUpdateResult(
    @Param('id', ParseIntPipe) appointmentId: number,
    @Body() createResultDto: CreateAppointmentResultDto,
    @CurrentUser('userId') userId: number,
  ): Promise<AppointmentResultDto> {
    return this.doctorAppointmentService.createOrUpdateAppointmentResult(
      appointmentId,
      createResultDto,
      userId,
    );
  }

  @Put(':id/result')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cập nhật kết quả khám cho appointment' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID appointment' })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật kết quả thành công',
    type: AppointmentResultDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Appointment chưa hoàn thành hoặc dữ liệu không hợp lệ',
  })
  @ApiResponse({
    status: 403,
    description: 'Không có quyền cập nhật kết quả cho appointment này',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy appointment',
  })
  async updateResult(
    @Param('id', ParseIntPipe) appointmentId: number,
    @Body() createResultDto: CreateAppointmentResultDto,
    @CurrentUser('userId') userId: number,
  ): Promise<AppointmentResultDto> {
    return this.doctorAppointmentService.createOrUpdateAppointmentResult(
      appointmentId,
      createResultDto,
      userId,
    );
  }

  @Get('patient/:patientProfileId/history')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Lấy lịch sử khám bệnh của bệnh nhân',
    description: 'Lấy tất cả các appointments đã hoàn thành của một bệnh nhân',
  })
  @ApiParam({
    name: 'patientProfileId',
    type: 'number',
    description: 'ID hồ sơ bệnh nhân',
  })
  @ApiResponse({
    status: 200,
    description: 'Lấy lịch sử thành công',
    type: DoctorAppointmentsListResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy bệnh nhân',
  })
  async getPatientMedicalHistory(
    @Param('patientProfileId', ParseIntPipe) patientProfileId: number,
    @Query() query: GetDoctorAppointmentsQueryDto,
    @CurrentUser('userId') userId: number,
  ): Promise<DoctorAppointmentsListResponseDto> {
    return this.doctorAppointmentService.getPatientMedicalHistory(
      patientProfileId,
      query,
      userId,
    );
  }

  @Post('results/:resultId/files')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload file đính kèm cho kết quả khám' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({
    name: 'resultId',
    type: 'number',
    description: 'ID kết quả khám',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'File ảnh (JPEG, PNG) hoặc PDF (tối đa 10MB)',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Upload file thành công',
    type: AppointmentResultFileDto,
  })
  @ApiResponse({
    status: 400,
    description: 'File không hợp lệ hoặc vượt quá kích thước cho phép',
  })
  @ApiResponse({
    status: 403,
    description: 'Không có quyền upload file cho kết quả này',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy kết quả khám',
  })
  async uploadResultFile(
    @Param('resultId', ParseIntPipe) resultId: number,
    @UploadedFile() file: any,
    @CurrentUser('userId') userId: number,
  ): Promise<AppointmentResultFileDto> {
    if (!file) {
      throw new BadRequestException('Vui lòng chọn file');
    }
    return this.doctorAppointmentService.uploadResultFile(
      resultId,
      file,
      userId,
    );
  }

  @Delete('results/:resultId/files/:fileId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xóa file đính kèm khỏi kết quả khám' })
  @ApiParam({
    name: 'resultId',
    type: 'number',
    description: 'ID kết quả khám',
  })
  @ApiParam({ name: 'fileId', type: 'number', description: 'ID file cần xóa' })
  @ApiResponse({
    status: 200,
    description: 'Xóa file thành công',
  })
  @ApiResponse({
    status: 403,
    description: 'Không có quyền xóa file này',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy file',
  })
  async deleteResultFile(
    @Param('resultId', ParseIntPipe) resultId: number,
    @Param('fileId', ParseIntPipe) fileId: number,
    @CurrentUser('userId') userId: number,
  ): Promise<{ success: boolean; message: string }> {
    await this.doctorAppointmentService.deleteResultFile(
      resultId,
      fileId,
      userId,
    );
    return {
      success: true,
      message: 'Xóa file thành công',
    };
  }
}
