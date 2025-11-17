import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';

interface HealthAdviceParams {
  symptoms?: string[];
  condition?: string;
  age?: number;
  gender?: string;
  medicalHistory?: string[];
}

interface MedicationAdvice {
  name: string;
  dosage: string;
  instructions: string;
  warnings?: string[];
  availableInClinic?: boolean;
}

interface LifestyleAdvice {
  category: string;
  recommendations: string[];
}

@Injectable()
export class HealthAdviceTool {
  constructor(private readonly prisma: PrismaService) {}

  async execute(params: HealthAdviceParams) {
    try {
      // Validate input
      if (!params.symptoms || params.symptoms.length === 0) {
        return {
          error: 'Vui lòng cung cấp triệu chứng để được tư vấn',
        };
      }

      // Analyze symptoms
      const analysis = this.analyzeSymptoms(params.symptoms);

      // Get medication suggestions from database
      const medications = await this.getMedicationSuggestions(
        params.symptoms,
        params.age,
      );

      // Generate lifestyle recommendations
      const lifestyle = this.getLifestyleRecommendations(
        params.symptoms,
        params.condition,
      );

      // Check urgency
      const urgency = this.assessUrgency(params.symptoms);

      // Generate response
      return {
        summary: analysis.summary,
        severity: analysis.severity,
        urgency: urgency.level,
        urgencyMessage: urgency.message,

        medications:
          medications.length > 0
            ? medications
            : [
                {
                  name: 'Chưa có thuốc cụ thể',
                  dosage: 'N/A',
                  instructions:
                    'Vui lòng đến khám bác sĩ để được kê đơn phù hợp',
                },
              ],

        lifestyle,

        generalAdvice: this.getGeneralAdvice(params),

        warnings: [
          '⚠️ Đây chỉ là gợi ý ban đầu, không thay thế cho chẩn đoán của bác sĩ',
          '⚠️ Không tự ý dùng thuốc khi chưa tham khảo ý kiến bác sĩ',
          '⚠️ Nếu triệu chứng nghiêm trọng hoặc kéo dài, hãy đến khám ngay',
        ],

        shouldBookAppointment:
          urgency.level === 'high' || analysis.severity === 'moderate',
        bookingMessage:
          urgency.level === 'high'
            ? '🚨 Khuyến nghị đặt lịch khám ngay'
            : '📅 Nên đặt lịch khám để được tư vấn chi tiết hơn',

        disclaimer:
          'Thông tin này chỉ mang tính chất tham khảo. Vui lòng tham khảo ý kiến bác sĩ để có phương án điều trị phù hợp.',
      };
    } catch (error) {
      console.error('Health advice tool error:', error);
      return {
        error: 'Có lỗi xảy ra khi phân tích triệu chứng',
        details: error.message,
        suggestion:
          'Vui lòng đặt lịch khám với bác sĩ để được tư vấn trực tiếp',
      };
    }
  }

  private analyzeSymptoms(symptoms: string[]) {
    const symptomKeywords = symptoms.map((s) => s.toLowerCase());

    const hasFever = symptomKeywords.some(
      (s) => s.includes('sốt') || s.includes('fever') || s.includes('nóng'),
    );

    const hasHeadache = symptomKeywords.some(
      (s) => s.includes('đau đầu') || s.includes('headache'),
    );

    const hasCough = symptomKeywords.some(
      (s) => s.includes('ho') || s.includes('cough'),
    );

    const hasPain = symptomKeywords.some(
      (s) => s.includes('đau') || s.includes('pain'),
    );

    let summary = '';
    let severity: 'low' | 'moderate' | 'high' = 'low';

    if (hasFever && hasCough) {
      summary = 'Triệu chứng có thể liên quan đến nhiễm trùng đường hô hấp';
      severity = 'moderate';
    } else if (hasFever) {
      summary = 'Triệu chứng sốt, có thể do nhiễm trùng';
      severity = 'moderate';
    } else if (hasHeadache && hasPain) {
      summary = 'Triệu chứng đau, có thể do căng thẳng hoặc viêm nhiễm';
      severity = 'low';
    } else {
      summary = 'Triệu chứng nhẹ, cần theo dõi';
      severity = 'low';
    }

    return { summary, severity };
  }

  private async getMedicationSuggestions(
    symptoms: string[],
    _age?: number, // Prefixed with _ to indicate intentionally unused
  ): Promise<MedicationAdvice[]> {
    const suggestions: MedicationAdvice[] = [];
    const symptomKeywords = symptoms.join(' ').toLowerCase();

    // Query available medicines
    const medicines = await this.prisma.medicine.findMany({
      take: 10,
      orderBy: { name: 'asc' },
    });

    // Map symptoms to common medications
    if (
      symptomKeywords.includes('đau đầu') ||
      symptomKeywords.includes('sốt')
    ) {
      const paracetamol = medicines.find((m) =>
        m.name.toLowerCase().includes('paracetamol'),
      );

      if (paracetamol) {
        suggestions.push({
          name: paracetamol.name,
          dosage: '500mg - 1g mỗi lần',
          instructions: 'Uống sau bữa ăn, mỗi 4-6 giờ. Tối đa 4g/ngày',
          warnings: ['Không dùng quá liều', 'Tránh xa tầm tay trẻ em'],
          availableInClinic: true,
        });
      }
    }

    if (symptomKeywords.includes('ho')) {
      suggestions.push({
        name: 'Siro ho (cần kê đơn)',
        dosage: '5-10ml mỗi lần',
        instructions: 'Uống 3 lần/ngày sau bữa ăn',
        warnings: ['Không dùng cho trẻ dưới 2 tuổi không có chỉ định'],
        availableInClinic: false,
      });
    }

    return suggestions;
  }

  private getLifestyleRecommendations(
    symptoms: string[],
    _condition?: string, // Prefixed with _ to indicate intentionally unused
  ): LifestyleAdvice[] {
    const recommendations: LifestyleAdvice[] = [];

    // General health
    recommendations.push({
      category: '🥗 Dinh dưỡng',
      recommendations: [
        'Ăn nhiều rau xanh và trái cây',
        'Uống đủ 2-3 lít nước mỗi ngày',
        'Hạn chế đồ ăn cay nóng, chiên rán',
        'Bổ sung vitamin C từ cam, chanh, ớt chuông',
      ],
    });

    // Rest and recovery
    recommendations.push({
      category: '😴 Nghỉ ngơi',
      recommendations: [
        'Ngủ đủ 7-8 tiếng mỗi đêm',
        'Tránh thức khuya',
        'Nghỉ ngơi khi cơ thể mệt mỏi',
        'Giữ không gian sống thoáng mát',
      ],
    });

    // Hygiene
    recommendations.push({
      category: '🧼 Vệ sinh',
      recommendations: [
        'Rửa tay thường xuyên bằng xà phòng',
        'Đeo khẩu trang khi ra ngoài nếu cần',
        'Giữ môi trường sống sạch sẽ',
        'Tránh tiếp xúc với người bệnh',
      ],
    });

    // Symptom-specific
    const symptomKeywords = symptoms.join(' ').toLowerCase();

    if (symptomKeywords.includes('ho') || symptomKeywords.includes('cảm')) {
      recommendations.push({
        category: '💊 Đặc biệt cho triệu chứng hiện tại',
        recommendations: [
          'Súc họng bằng nước muối ấm',
          'Uống nước ấm, tránh lạnh',
          'Tránh tiếp xúc với khói bụi',
          'Giữ ấm cơ thể',
        ],
      });
    }

    if (symptomKeywords.includes('đau đầu')) {
      recommendations.push({
        category: '💊 Đặc biệt cho triệu chứng hiện tại',
        recommendations: [
          'Nghỉ ngơi trong phòng tối, yên tĩnh',
          'Massage nhẹ vùng thái dương',
          'Tránh stress và căng thẳng',
          'Hạn chế sử dụng điện thoại, máy tính',
        ],
      });
    }

    return recommendations;
  }

  private assessUrgency(symptoms: string[]): {
    level: 'low' | 'medium' | 'high';
    message: string;
  } {
    const urgentKeywords = [
      'khó thở',
      'đau ngực',
      'chảy máu',
      'bất tỉnh',
      'co giật',
      'sốt cao',
      'đau dữ dội',
    ];

    const symptomText = symptoms.join(' ').toLowerCase();

    const hasUrgentSymptom = urgentKeywords.some((keyword) =>
      symptomText.includes(keyword),
    );

    if (hasUrgentSymptom) {
      return {
        level: 'high',
        message:
          '🚨 Triệu chứng có thể nghiêm trọng. Vui lòng đến cơ sở y tế ngay lập tức hoặc gọi cấp cứu 115.',
      };
    }

    if (symptoms.length > 3) {
      return {
        level: 'medium',
        message: '⚠️ Nhiều triệu chứng. Nên đặt lịch khám trong 1-2 ngày.',
      };
    }

    return {
      level: 'low',
      message:
        '✅ Triệu chứng nhẹ. Theo dõi và đặt lịch nếu kéo dài trên 3 ngày.',
    };
  }

  private getGeneralAdvice(params: HealthAdviceParams): string[] {
    const advice: string[] = [];

    if (params.age && params.age > 60) {
      advice.push('👴 Người cao tuổi nên theo dõi sức khỏe chặt chẽ hơn');
    }

    if (params.medicalHistory && params.medicalHistory.length > 0) {
      advice.push(
        '📋 Có tiền sử bệnh lý, nên tham khảo ý kiến bác sĩ trước khi dùng thuốc',
      );
    }

    advice.push('🌡️ Theo dõi thân nhiệt và các triệu chứng hàng ngày');
    advice.push('📞 Liên hệ bác sĩ nếu có bất kỳ thay đổi bất thường nào');

    return advice;
  }
}
