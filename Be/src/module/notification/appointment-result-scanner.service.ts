import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/common/prisma/prisma.service';
import { NotificationService } from './notification.service';
import { NotificationType, NotificationPriority } from './notification.types';

// Local interfaces for this service
interface DoctorPendingAppointments {
  doctor_id: number;
  doctor_user_id: number;
  doctor_name: string;
  pending_count: number;
  appointment_ids: number[];
  patient_names: string[];
  last_appointment_date: Date;
}

interface AppointmentScannerStats {
  lastScanTime: Date | null;
  nextScanTime: Date | null;
  totalDoctorsNotified: number;
  totalPendingAppointments: number;
  averageProcessingTime: number;
}

@Injectable()
export class AppointmentResultScannerService {
  private readonly logger = new Logger(AppointmentResultScannerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Process appointment result pending notifications
   * Main entry point for the BullMQ job
   */
  async processAppointmentResultScanner(options: { scanDate?: string } = {}): Promise<{
    totalDoctors: number;
    totalAppointments: number;
    scanTime: Date;
  }> {
    const scanTime = new Date();
    this.logger.log(`🔍 Starting appointment result scanner at ${scanTime.toISOString()}...`);

    try {
      const doctorsWithPendingAppointments = await this.getPendingAppointmentsByDoctor();

      if (doctorsWithPendingAppointments.length === 0) {
        this.logger.log('✅ No pending appointment results found');
        return {
          totalDoctors: 0,
          totalAppointments: 0,
          scanTime,
        };
      }

      const totalAppointments = doctorsWithPendingAppointments.reduce(
        (sum, doctor) => sum + Number(doctor.pending_count),
        0
      );

      this.logger.log(`📊 Found ${doctorsWithPendingAppointments.length} doctors with ${totalAppointments} pending results`);

      // Process each doctor
      let successCount = 0;
      let errorCount = 0;

      for (const doctor of doctorsWithPendingAppointments) {
        try {
          await this.sendResultPendingNotification(doctor);
          successCount++;
        } catch (error) {
          this.logger.error(`❌ Failed to send notification to Dr. ${doctor.doctor_name}:`, error);
          errorCount++;
          // Continue with other doctors even if one fails
        }
      }

      this.logger.log(`✅ Completed appointment result scanner. Success: ${successCount}, Errors: ${errorCount}`);

      return {
        totalDoctors: successCount,
        totalAppointments,
        scanTime,
      };

    } catch (error) {
      this.logger.error('❌ Critical error in appointment result scanner:', error);
      throw error;
    }
  }

  /**
   * Get doctors with pending appointment results
   * Optimized query using raw SQL for performance
   */
  async getPendingAppointmentsByDoctor(): Promise<DoctorPendingAppointments[]> {
    const query = `
      SELECT
        d."id" as doctor_id,
        d."userId" as doctor_user_id,
        d."firstName" || ' ' || d."lastName" as doctor_name,
        COUNT(a.id) as pending_count,
        ARRAY_AGG(a.id) as appointment_ids,
        ARRAY_AGG(p."firstName" || ' ' || p."lastName") as patient_names,
        MAX(a."endTime") as last_appointment_date
      FROM "Appointment" a
      JOIN "DoctorProfile" d ON a."doctorId" = d."id"
      JOIN "PatientProfile" p ON a."patientProfileId" = p.id
      LEFT JOIN "AppointmentResult" ar ON a.id = ar."appointmentId"
      WHERE
        a.status = 'COMPLETED'
        AND ar.id IS NULL
        AND a."endTime" < NOW() - INTERVAL '24 hours'
        AND a."endTime" > NOW() - INTERVAL '7 days'
      GROUP BY d."id", d."userId", d."firstName", d."lastName"
      HAVING COUNT(a.id) > 0
      ORDER BY pending_count DESC
    `;

    const results = await this.prisma.$queryRawUnsafe(query) as any[];

    return results.map((row: any) => ({
      doctor_id: Number(row.doctor_id),
      doctor_user_id: Number(row.doctor_user_id),
      doctor_name: String(row.doctor_name),
      pending_count: Number(row.pending_count),
      appointment_ids: (row.appointment_ids as number[]).map(Number),
      patient_names: row.patient_names as string[],
      last_appointment_date: new Date(row.last_appointment_date),
    }));
  }

  /**
   * Send notification to doctor about pending results
   */
  private async sendResultPendingNotification(doctor: DoctorPendingAppointments): Promise<void> {
    this.logger.log(
      `📧 Sending notification to Dr. ${doctor.doctor_name} (${doctor.doctor_user_id}) - ${doctor.pending_count} pending results`
    );

    // Create notification message
    const title = `Bạn có ${doctor.pending_count} cuộc khám chưa trả kết quả`;

    let message = `Vui lòng hoàn thành kết quả cho ${doctor.pending_count} bệnh nhân trong hôm nay.`;

    if (doctor.patient_names && doctor.patient_names.length > 0) {
      const namesList = doctor.patient_names.slice(0, 3).join(', ');
      message += `\n\nBệnh nhân cần kết quả: ${namesList}`;
      if (doctor.patient_names.length > 3) {
        message += ` và ${doctor.pending_count - 3} bệnh nhân khác.`;
      }
    }

    // Send notification via NotificationService
    await this.notificationService.sendDirectNotification({
      recipientId: doctor.doctor_user_id,
      type: NotificationType.APPOINTMENT_RESULT_PENDING,
      title,
      message,
      priority: NotificationPriority.HIGH,
      metadata: {
        doctorId: doctor.doctor_id,
        patientCount: doctor.pending_count,
        appointmentIds: doctor.appointment_ids,
        patientNames: doctor.patient_names,
        scanDate: new Date().toISOString(),
      },
    });

    this.logger.log(`✅ Notification sent successfully to Dr. ${doctor.doctor_name}`);
  }

  /**
   * Get scanner statistics
   */
  async getScannerStats(): Promise<AppointmentScannerStats> {
    try {
      // Get current scan statistics
      const statsQuery = `
        SELECT
          COUNT(DISTINCT a."doctorId") as total_doctors,
          COUNT(a.id) as total_appointments,
          COUNT(DISTINCT a."patientProfileId") as total_patients
        FROM "Appointment" a
        LEFT JOIN "AppointmentResult" ar ON a.id = ar."appointmentId"
        WHERE
          a.status = 'COMPLETED'
          AND ar.id IS NULL
          AND a."endTime" < NOW() - INTERVAL '24 hours'
      `;

      const stats = await this.prisma.$queryRawUnsafe(statsQuery) as any[];
      const currentStats = stats[0];

      return {
        totalDoctorsNotified: 0, // Would need to track this separately in production
        totalPendingAppointments: Number(currentStats.total_appointments) || 0,
        lastScanTime: new Date(), // This would be stored in a real implementation
        nextScanTime: this.getNextScheduledScanTime(),
        averageProcessingTime: 0, // This would be tracked in production
      };
    } catch (error) {
      this.logger.error('Error getting scanner stats:', error);
      return {
        totalDoctorsNotified: 0,
        totalPendingAppointments: 0,
        lastScanTime: null,
        nextScanTime: null,
        averageProcessingTime: 0,
      };
    }
  }

  /**
   * Get next scheduled scan time (9 AM tomorrow if it's after 9 AM, otherwise 9 AM today)
   */
  private getNextScheduledScanTime(): Date {
    const now = new Date();
    const nextScan = new Date();
    nextScan.setHours(9, 0, 0, 0);

    // If it's past 9 AM, schedule for tomorrow
    if (now.getHours() >= 9) {
      nextScan.setDate(nextScan.getDate() + 1);
    }

    return nextScan;
  }

  /**
   * Manual trigger for testing
   */
  async triggerManualScan(): Promise<{
    totalDoctors: number;
    totalAppointments: number;
    scanTime: Date;
  }> {
    this.logger.log('🔧 Manual trigger: Starting appointment result scanner...');
    return await this.processAppointmentResultScanner();
  }

  /**
   * Get pending appointments for a specific doctor
   */
  async getPendingAppointmentsForDoctor(doctorUserId: number): Promise<{
    pendingCount: number;
    appointmentIds: number[];
    patientNames: string[];
  }> {
    const query = `
      SELECT
        COUNT(a.id) as pending_count,
        ARRAY_AGG(a.id) as appointment_ids,
        ARRAY_AGG(p."firstName" || ' ' || p."lastName") as patient_names
      FROM "Appointment" a
      JOIN "DoctorProfile" d ON a."doctorId" = d."id"
      JOIN "PatientProfile" p ON a."patientProfileId" = p.id
      LEFT JOIN "AppointmentResult" ar ON a.id = ar."appointmentId"
      WHERE
        d."userId" = $1
        AND a.status = 'COMPLETED'
        AND ar.id IS NULL
        AND a."endTime" < NOW() - INTERVAL '24 hours'
      GROUP BY d."userId"
      HAVING COUNT(a.id) > 0
    `;

    const results = await this.prisma.$queryRawUnsafe(query, doctorUserId) as any[];

    if (results.length === 0) {
      return {
        pendingCount: 0,
        appointmentIds: [],
        patientNames: [],
      };
    }

    const result = results[0];
    return {
      pendingCount: Number(result.pending_count),
      appointmentIds: (result.appointment_ids as number[]).map(Number),
      patientNames: result.patient_names as string[],
    };
  }

  /**
   * Health check for the scanner service
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    lastScanTime?: Date;
    nextScanTime?: Date;
    databaseConnection: boolean;
    error?: string;
  }> {
    try {
      // Test database connection
      await this.prisma.$queryRawUnsafe('SELECT 1');

      const stats = await this.getScannerStats();

      return {
        status: 'healthy',
        lastScanTime: stats.lastScanTime || undefined,
        nextScanTime: stats.nextScanTime || undefined,
        databaseConnection: true,
      };
    } catch (error) {
      this.logger.error('Health check failed:', error);
      return {
        status: 'unhealthy',
        databaseConnection: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  }