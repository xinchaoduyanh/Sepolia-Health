import { PrismaService } from '@/common/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import Fuse from 'fuse.js';

interface SearchDoctorsParams {
  doctorName: string;
  locationName?: string; // Đổi từ clinicId (number) sang locationName (string)
  serviceId?: number;
  specialtyName?: string; // Tên chuyên khoa để kiểm tra mâu thuẫn
}

@Injectable()
export class SearchDoctorsTool {
  constructor(private readonly prisma: PrismaService) {}

  async execute(params: SearchDoctorsParams) {
    try {
      if (!params.doctorName || params.doctorName.trim().length === 0) {
        return {
          error: 'Vui lòng cung cấp tên bác sĩ cần tìm',
        };
      }

      const searchName = params.doctorName.trim();
      let clinicIds: number[] = []; // Mảng chứa ID phòng khám

      // Logic mới: Tìm ID phòng khám từ tên location (ví dụ: "Ba Đình")
      if (params.locationName) {
        const clinics = await this.prisma.clinic.findMany({
          where: {
            OR: [
              {
                name: {
                  contains: params.locationName.trim(),
                  mode: 'insensitive',
                },
              },
              {
                address: {
                  contains: params.locationName.trim(),
                  mode: 'insensitive',
                },
              },
            ],
          },
          select: { id: true },
        });

        clinicIds = clinics.map((clinic) => clinic.id);

        if (clinicIds.length === 0) {
          return {
            found: false,
            count: 0,
            message: `Không tìm thấy phòng khám nào có tên hoặc địa chỉ "${params.locationName}".`,
            suggestion:
              'Vui lòng kiểm tra lại tên địa điểm hoặc thử tìm kiếm với từ khóa khác',
          };
        }
      }

      // Lấy TẤT CẢ bác sĩ (hoặc lọc trước bằng clinic và service)
      // Sau đó dùng Fuse.js để fuzzy search theo tên
      const whereConditions: any[] = [];

      // Filter by clinic(s) if locationName was provided and found
      if (clinicIds.length > 0) {
        whereConditions.push({
          clinicId: { in: clinicIds }, // Dùng "in" để tìm trong mảng IDs
        });
      }

      // Filter by service if provided
      if (params.serviceId) {
        whereConditions.push({
          services: {
            some: {
              serviceId: params.serviceId,
            },
          },
        });
      }

      const allDoctors = await this.prisma.doctorProfile.findMany({
        where: {
          AND: whereConditions.length > 0 ? whereConditions : undefined,
          deletedAt: null,
        },
        include: {
          user: {
            select: {
              email: true,
            },
          },
          clinic: {
            select: {
              id: true,
              name: true,
              address: true,
            },
          },
          services: {
            include: {
              service: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                },
              },
            },
            where: params.serviceId
              ? {
                  serviceId: params.serviceId,
                }
              : undefined,
          },
        },
      });

      // Tạo danh sách bác sĩ với fullName để search chính xác hơn
      const searchData = allDoctors.map((d) => ({
        ...d,
        fullName: `${d.lastName} ${d.firstName}`.toLowerCase(),
        fullNameReverse: `${d.firstName} ${d.lastName}`.toLowerCase(),
      }));

      // Dùng Fuse.js để fuzzy search theo tên (chấp nhận sai số)
      const fuseOptions = {
        keys: [
          { name: 'fullName', weight: 0.7 },
          { name: 'fullNameReverse', weight: 0.3 },
          { name: 'firstName', weight: 0.2 },
        ],
        includeScore: true, // Bao gồm điểm số
        threshold: 0.35, // Chặt chẽ hơn một chút
        minMatchCharLength: 2, // Tối thiểu 2 ký tự
      };

      const fuse = new Fuse(searchData, fuseOptions);
      const searchResults = fuse.search(searchName);

      // Lấy danh sách bác sĩ đã lọc và sắp xếp theo điểm số (score thấp = giống hơn)
      const doctors = searchResults
        .map((result) => ({
          ...result.item,
          matchScore: result.score || 1, // Score thấp = match tốt hơn
        }))
        .sort((a, b) => (a.matchScore || 1) - (b.matchScore || 1))
        .slice(0, 10); // Giới hạn 10 kết quả tốt nhất

      if (doctors.length === 0) {
        return {
          found: false,
          count: 0,
          message: `Không tìm thấy bác sĩ nào với tên "${searchName}"`,
          suggestion:
            'Vui lòng kiểm tra lại tên hoặc thử tìm kiếm với từ khóa khác',
        };
      }

      // Nếu chỉ tìm thấy 1 bác sĩ, kiểm tra mâu thuẫn chuyên khoa
      if (doctors.length === 1) {
        const doctor = doctors[0];
        const formattedDoctor = this.formatDoctorDetails(doctor);

        // Xử lý mâu thuẫn: Kiểm tra nếu user nói chuyên khoa nhưng bác sĩ không có
        if (params.specialtyName) {
          const specialtyLower = params.specialtyName.toLowerCase().trim();
          const doctorSpecialtyLower = formattedDoctor.specialty
            .toLowerCase()
            .trim();

          // Kiểm tra xem chuyên khoa có khớp không
          const specialtyMatch =
            doctorSpecialtyLower.includes(specialtyLower) ||
            specialtyLower.includes(doctorSpecialtyLower) ||
            // Kiểm tra một số từ khóa phổ biến
            (specialtyLower.includes('nội tiết') &&
              doctorSpecialtyLower.includes('nội tiết')) ||
            (specialtyLower.includes('tim mạch') &&
              doctorSpecialtyLower.includes('tim mạch'));

          if (!specialtyMatch) {
            // Trả về câu hỏi để hỏi lại người dùng
            return {
              status: 'disambiguation_needed',
              found: true,
              count: 1,
              message: `Tôi tìm thấy BS. ${formattedDoctor.fullName}, nhưng bác sĩ này thuộc khoa ${formattedDoctor.specialty}, không phải khoa ${params.specialtyName}.`,
              question: 'Bạn có muốn xem lịch của bác sĩ này không?',
              doctor: formattedDoctor,
              doctor_id: formattedDoctor.id,
            };
          }
        }

        // Nếu không mâu thuẫn, trả về như cũ
        return {
          found: true,
          count: 1,
          exactMatch: doctor.matchScore < 0.3, // Match tốt nếu score < 0.3
          doctor: formattedDoctor,
          doctor_id: formattedDoctor.id, // Thêm doctor_id ở top level để AI dễ sử dụng
          message: `Mình tìm thấy BS. ${formattedDoctor.fullName} rồi đây. Bạn có muốn mình kiểm tra lịch khám chi tiết của bác sĩ không?`,
        };
      }

      // Nếu tìm thấy nhiều bác sĩ, trả về danh sách để user chọn
      return {
        found: true,
        count: doctors.length,
        exactMatch: false,
        doctors: doctors.map((doctor, index) => ({
          index: index + 1,
          ...this.formatDoctorDetails(doctor),
        })),
        message: `Mình tìm thấy ${doctors.length} bác sĩ phù hợp với tên "${searchName}". Bạn muốn xem lịch của bác sĩ nào nhất ạ?`,
        instruction:
          'Bạn có thể trả lời bằng số thứ tự hoặc tên đầy đủ của bác sĩ để mình hỗ trợ nhanh nhất nhé.',
      };
    } catch (error) {
      console.error('Search doctors tool error:', error);
      return {
        error: 'Có lỗi xảy ra khi tìm kiếm bác sĩ',
        details: error.message,
      };
    }
  }

  private formatDoctorDetails(doctor: any) {
    const specialties = doctor.services.map((ds) => ds.service.name).join(', ');

    return {
      id: doctor.id,
      fullName: `${doctor.lastName} ${doctor.firstName}`,
      firstName: doctor.firstName,
      lastName: doctor.lastName,
      experience: doctor.experience || 'nhiều năm kinh nghiệm',
      specialty: specialties || 'Chưa cập nhật',
      clinic: doctor.clinic
        ? {
            id: doctor.clinic.id,
            name: doctor.clinic.name,
            address: doctor.clinic.address,
          }
        : null,
      email: doctor.user.email,
    };
  }
}
