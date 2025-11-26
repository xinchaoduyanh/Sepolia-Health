import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { Gender, Relationship } from '@prisma/client';

// Find patient by email DTO
const FindPatientByEmailSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
});

export class FindPatientByEmailDto extends createZodDto(
  FindPatientByEmailSchema,
) {}

// Create patient account DTO
const CreatePatientAccountSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  firstName: z.string().min(2, 'Tên phải có ít nhất 2 ký tự'),
  lastName: z.string().min(2, 'Họ phải có ít nhất 2 ký tự'),
  phone: z.string().min(10, 'Số điện thoại không hợp lệ'),
  dateOfBirth: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), 'Ngày sinh không hợp lệ'),
  gender: z.nativeEnum(Gender, {
    message: 'Giới tính không hợp lệ',
  }),
  idCardNumber: z.string().optional(),
  address: z.string().optional(),
  occupation: z.string().optional(),
  nationality: z.string().optional(),
});

export class CreatePatientAccountDto extends createZodDto(
  CreatePatientAccountSchema,
) {}

// Create appointment for patient DTO
const CreateAppointmentForPatientSchema = z.object({
  patientProfileId: z
    .number()
    .int()
    .positive('Patient profile ID không hợp lệ'),
  doctorServiceId: z.number().int().positive('Doctor service ID không hợp lệ'),
  startTime: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), 'Thời gian bắt đầu không hợp lệ'),
  endTime: z
    .string()
    .refine(
      (val) => !isNaN(Date.parse(val)),
      'Thời gian kết thúc không hợp lệ',
    ),
  notes: z.string().optional(),
});

export class CreateAppointmentForPatientDto extends createZodDto(
  CreateAppointmentForPatientSchema,
) {}
