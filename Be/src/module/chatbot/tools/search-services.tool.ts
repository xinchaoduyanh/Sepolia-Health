import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import Fuse from 'fuse.js';

interface SearchServicesParams {
  serviceName?: string; // Ví dụ: "Nội tiết", "Tim mạch"
  locationName?: string; // Ví dụ: "Ba Đình", "Cầu Giấy"
}

@Injectable()
export class SearchServicesTool {
  constructor(private readonly prisma: PrismaService) {}

  async execute(params: SearchServicesParams) {
    try {
      let clinicIds: number[] = [];

      // Logic: Tìm ID phòng khám từ tên location (nếu có)
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
            isActive: true,
          },
          select: { id: true },
        });

        clinicIds = clinics.map((clinic) => clinic.id);

        if (clinicIds.length === 0) {
          return {
            found: false,
            message: `Không tìm thấy cơ sở nào có tên hoặc địa chỉ "${params.locationName}".`,
            suggestion:
              'Vui lòng kiểm tra lại tên địa điểm hoặc thử tìm kiếm với từ khóa khác',
          };
        }
      }

      // Lấy tất cả services
      // Nếu có locationName, chỉ lấy services của các doctors thuộc clinic đó
      let allServices: any[] = [];

      if (clinicIds.length > 0) {
        // Tìm services thông qua doctors của clinic
        const doctorServices = await this.prisma.doctorService.findMany({
          where: {
            doctor: {
              clinicId: { in: clinicIds },
              deletedAt: null,
            },
          },
          include: {
            service: {
              select: {
                id: true,
                name: true,
                price: true,
                duration: true,
                description: true,
              },
            },
          },
        });

        // Map để lấy unique services
        const serviceMap = new Map();
        doctorServices.forEach((ds) => {
          if (!serviceMap.has(ds.service.id)) {
            serviceMap.set(ds.service.id, ds.service);
          }
        });

        allServices = Array.from(serviceMap.values());
      } else {
        // Lấy tất cả services
        allServices = await this.prisma.service.findMany({
          select: {
            id: true,
            name: true,
            price: true,
            duration: true,
            description: true,
          },
        });
      }

      // Nếu có serviceName, dùng Fuse.js để fuzzy search
      let services = allServices;

      if (params.serviceName && params.serviceName.trim().length > 0) {
        const searchName = params.serviceName.trim();

        const fuseOptions = {
          keys: [{ name: 'name', weight: 1 }],
          includeScore: true,
          threshold: 0.4, // Độ "lỏng" (0 = chính xác, 1 = bất cứ đâu)
          minMatchCharLength: 2,
        };

        const fuse = new Fuse(allServices, fuseOptions);
        const searchResults = fuse.search(searchName);

        services = searchResults
          .map((result) => ({
            ...result.item,
            matchScore: result.score || 1,
          }))
          .sort((a, b) => (a.matchScore || 1) - (b.matchScore || 1))
          .slice(0, 20); // Giới hạn 20 kết quả tốt nhất
      }

      if (services.length === 0) {
        let message = 'Không tìm thấy dịch vụ nào';
        if (params.serviceName && params.locationName) {
          message = `Không tìm thấy dịch vụ "${params.serviceName}" tại cơ sở "${params.locationName}".`;
        } else if (params.serviceName) {
          message = `Không tìm thấy dịch vụ "${params.serviceName}".`;
        } else if (params.locationName) {
          message = `Cơ sở "${params.locationName}" hiện chưa có dịch vụ nào.`;
        }

        return {
          found: false,
          message,
          suggestion:
            'Vui lòng kiểm tra lại tên dịch vụ hoặc thử tìm kiếm với từ khóa khác',
        };
      }

      // Format response
      const formattedServices = services.map((service) => ({
        id: service.id,
        name: service.name,
        price: service.price,
        duration: service.duration,
        description: service.description || null,
      }));

      // Tạo message phù hợp
      let message = '';
      if (params.serviceName && params.locationName) {
        message = `Tìm thấy ${services.length} dịch vụ "${params.serviceName}" tại cơ sở "${params.locationName}":`;
      } else if (params.serviceName) {
        message = `Tìm thấy ${services.length} dịch vụ với tên "${params.serviceName}":`;
      } else if (params.locationName) {
        message = `Cơ sở "${params.locationName}" có ${services.length} dịch vụ:`;
      } else {
        message = `Sepolia hiện có ${services.length} dịch vụ:`;
      }

      return {
        found: true,
        count: services.length,
        message,
        services: formattedServices,
      };
    } catch (error) {
      console.error('Search services tool error:', error);
      return {
        error: 'Có lỗi xảy ra khi tìm kiếm dịch vụ.',
        details: error.message,
      };
    }
  }
}
