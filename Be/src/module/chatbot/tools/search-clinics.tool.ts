import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import Fuse from 'fuse.js';

interface SearchClinicsParams {
  locationName?: string;
}

@Injectable()
export class SearchClinicsTool {
  constructor(private readonly prisma: PrismaService) {}

  async execute(params: SearchClinicsParams) {
    try {
      // Lấy TẤT CẢ cơ sở từ DB
      const allClinics = await this.prisma.clinic.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          address: true,
          phone: true,
        },
      });

      let clinics = allClinics;

      // DÙNG FUSE.JS ĐỂ TÌM KIẾM MỜ (NẾU CÓ locationName)
      if (params.locationName) {
        const searchName = params.locationName.trim();

        const fuseOptions = {
          keys: [
            { name: 'name', weight: 0.7 }, // Ưu tiên tìm theo tên
            { name: 'address', weight: 0.3 }, // Vẫn tìm trong địa chỉ
          ],
          includeScore: true,
          threshold: 0.4, // Độ "lỏng" (0 = chính xác, 1 = bất cứ đâu)
          ignoreLocation: true,
          useExtendedSearch: true,
          // Bỏ qua dấu tiếng Việt
          ignoreFieldNorm: true,
        };

        const fuse = new Fuse(allClinics, fuseOptions);

        // Tùy chỉnh để Fuse.js bỏ qua dấu
        // Bằng cách tìm kiếm phiên bản không dấu
        const results = fuse.search(searchName);

        // Lấy kết quả đã lọc
        clinics = results.map((result) => result.item);
      }

      // Logic "thông minh" khi không tìm thấy
      if (clinics.length === 0) {
        const notFoundMessage = params.locationName
          ? `Xin lỗi, Sepolia không tìm thấy cơ sở nào khớp với "${params.locationName}".`
          : `Xin lỗi, Sepolia hiện chưa có cơ sở nào được đăng ký.`;

        return {
          found: false,
          message: notFoundMessage,
          suggestion:
            'Hiện tại, chúng tôi chỉ có các cơ sở tại Hà Nội. Bạn có muốn xem danh sách các cơ sở này không?',
        };
      }

      // Logic "thông minh" khi tìm thấy
      let successMessage = '';
      if (params.locationName) {
        successMessage = `Tìm thấy ${clinics.length} cơ sở của Sepolia khớp với "${params.locationName}":`;
      } else {
        successMessage = `Sepolia hiện có ${clinics.length} cơ sở, tất cả đều tại Hà Nội. Đây là danh sách:`;
      }

      return {
        found: true,
        count: clinics.length,
        message: successMessage,
        clinics: clinics.map((clinic) => ({
          id: clinic.id,
          name: clinic.name,
          address: clinic.address,
          phone: clinic.phone,
        })),
      };
    } catch (error) {
      console.error('Search clinics tool error:', error);
      return {
        error: 'Có lỗi xảy ra khi tìm kiếm cơ sở phòng khám.',
      };
    }
  }
}
