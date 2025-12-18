# Comprehensive Notification System Documentation

## Overview

The comprehensive notification system provides real-time, role-based, and targeted communication capabilities for the Sepolia-Health hospital management platform. Built on StreamChat with BullMQ scheduling, it enables Admins, Doctors, Receptionists, and Patients to receive timely notifications about appointments, payments, and system events.

## 🏗️ Architecture

### Core Components

1. **NotificationService** - Core StreamChat-based notification delivery
2. **NotificationTemplateService** - Template management system
3. **NotificationSchedulerService** - BullMQ-based scheduled notifications
4. **AdminNotificationController** - Admin management interface
5. **NotificationController** - User notification interface

### Data Flow

```
[Event Trigger] → [Service Layer] → [NotificationService] → [StreamChat Channels] → [Client Apps]
                                    ↘
                                 [Scheduler] → [BullMQ Queue] → [Delayed Processing]
```

## 🚀 Features

### 1. Role-Based Targeting
- **Individual**: Send to specific users
- **Role**: Send to all users of a role (DOCTOR, PATIENT, RECEPTIONIST, ADMIN)
- **Clinic**: Send to all users at a specific clinic
- **Clinic Role**: Send to specific roles at a clinic (receptionists only)

### 2. Admin Management
- **Direct Notifications**: Send immediate notifications to targets
- **Broadcast Campaigns**: Create and schedule mass communications
- **Template System**: Create reusable notification templates
- **Analytics**: Track delivery and engagement metrics

### 3. Scheduled Notifications
- **Appointment Reminders**: Automatic 24-hour reminders
- **Campaign Scheduling**: Schedule announcements for future delivery
- **Retry Logic**: Failed notifications are retried with exponential backoff

### 4. Notification Types

#### Appointment Notifications
- `CREATE_APPOINTMENT_PATIENT` - Patient creates appointment
- `CREATE_APPOINTMENT_DOCTOR` - Doctor receives new appointment
- `APPOINTMENT_CONFIRMED_RECEPTIONIST` - Receptionist notified
- `APPOINTMENT_REMINDER_*` - 24h reminders for all parties
- `APPOINTMENT_STATUS_CHANGE` - Status updates
- `APPOINTMENT_RESCHEDULED_*` - Reschedule notifications

#### Payment Notifications
- `PAYMENT_SUCCESS` - Payment completion
- `PAYMENT_FAILED` - Payment failure
- `PAYMENT_INITIATED` - Payment started
- `APPOINTMENT_PAYMENT_COMPLETED` - Payment tracking
- `REFUND_PROCESSED` - Refund notifications

#### Admin System Notifications
- `SYSTEM_MAINTENANCE_SCHEDULED` - Maintenance announcements
- `NEW_DOCTOR_VERIFICATION_REQUEST` - Admin approvals
- `CLINIC_CAPACITY_ALERT` - Capacity warnings

#### Admin Broadcast Notifications
- `ADMIN_BROADCAST` - General announcements
- `ADMIN_ANNOUNCEMENT` - Official announcements
- `PROMOTION_NOTIFICATION` - Marketing messages
- `SERVICE_UPDATE` - Service changes
- `POLICY_CHANGE` - Policy updates

## 🔧 StreamChat Channel Strategy

### Individual Channels
- `notifications_[userId]` - Personal notifications (existing)

### Role-Based Channels
- `notifications_doctors_all` - All doctors
- `notifications_patients_all` - All patients
- `notifications_receptionists_all` - All receptionists
- `notifications_all_users` - All users

### Clinic Channels
- `notifications_clinic_[clinicId]` - All users at clinic
- `notifications_receptionists_clinic_[clinicId]` - Clinic receptionists

### Admin Channels
- `admin_notifications_templates` - Template storage
- `admin_notifications_campaigns` - Campaign tracking
- `admin_notifications_analytics` - Analytics data

## 📋 API Endpoints

### User Notifications (`/api/notifications`)
- `GET /` - Get user notifications with filters
- `GET /unread-count` - Get unread notification count
- `PATCH /:messageId/read` - Mark notification as read
- `PATCH /read-all` - Mark all notifications as read
- `DELETE /:messageId` - Archive notification
- `GET /types` - Get available notification types
- `GET /stats` - Get user notification statistics

### Admin Notifications (`/api/admin/notifications`)
- `POST /direct` - Send direct notification
- `POST /broadcast` - Create broadcast campaign
- `GET /campaigns` - List campaigns
- `POST /templates` - Create notification template
- `GET /templates` - List templates
- `PUT /templates/:templateId` - Update template
- `DELETE /templates/:templateId` - Delete template
- `POST /templates/default` - Create default templates
- `GET /analytics/delivery` - Delivery statistics

## 🎨 Usage Examples

### 1. Admin Direct Notification
```typescript
// Send to individual user
POST /api/admin/notifications/direct
{
  "recipientId": 123,
  "title": "Appointment Reminder",
  "message": "Your appointment is tomorrow at 2:00 PM",
  "type": "SYSTEM_NOTIFICATION",
  "priority": "HIGH"
}

// Send to all doctors
POST /api/admin/notifications/direct
{
  "recipientRole": "DOCTOR",
  "title": "New Policy Update",
  "message": "Please review the updated patient privacy policy",
  "type": "POLICY_CHANGE",
  "priority": "MEDIUM"
}
```

### 2. Broadcast Campaign
```typescript
POST /api/admin/notifications/broadcast
{
  "title": "System Maintenance",
  "message": "The system will be under maintenance from 2:00 AM to 4:00 AM tomorrow",
  "targetRoles": ["PATIENT", "DOCTOR", "RECEPTIONIST"],
  "scheduledFor": "2024-01-20T02:00:00Z",
  "priority": "HIGH"
}
```

### 3. Template Management
```typescript
// Create template
POST /api/admin/notifications/templates
{
  "name": "Appointment Reminder Template",
  "type": "APPOINTMENT_REMINDER_PATIENT",
  "title": "Nhắc nhở lịch hẹn",
  "message": "Lịch hẹn của bạn vào {{appointmentDate}} lúc {{appointmentTime}} với Bác sĩ {{doctorName}}",
  "createdBy": "admin@example.com"
}

// Render template with variables
POST /api/admin/notifications/templates/template_123/preview
{
  "appointmentDate": "20/01/2024",
  "appointmentTime": "14:00",
  "doctorName": "Nguyễn Văn A"
}
```

## 🔔 Frontend Integration

### React Native (Mobile App)
```typescript
// Enhanced Notification Context
import { useNotificationContext } from '../contexts/NotificationContext';

function NotificationComponent() {
  const { notifications, unreadCount, markAsRead } = useNotificationContext();

  return (
    <View>
      <Badge count={unreadCount}>
        <Icon name="notifications" />
      </Badge>

      <FlatList
        data={notifications}
        renderItem={({ item }) => (
          <NotificationItem
            notification={item}
            onRead={() => markAsRead(item.id)}
          />
        )}
      />
    </View>
  );
}
```

### Web Dashboard (Next.js)
```typescript
// Admin Notification Management
import { useNotifications } from '../hooks/useNotifications';

function AdminNotificationPanel() {
  const {
    sendDirectNotification,
    createCampaign,
    templates,
    analytics
  } = useNotifications();

  return (
    <div>
      <NotificationComposer onSend={sendDirectNotification} />
      <CampaignManager onCreate={createCampaign} />
      <TemplateManager templates={templates} />
      <AnalyticsDashboard data={analytics} />
    </div>
  );
}
```

## 📊 Analytics & Monitoring

### Delivery Metrics
- **Total Sent**: Number of notifications sent
- **Delivery Rate**: Percentage successfully delivered
- **Read Rate**: Percentage opened/read
- **Engagement**: Interaction metrics

### Queue Monitoring
```typescript
// Get queue statistics
GET /api/admin/notifications/analytics/queue

Response:
{
  "waiting": 5,
  "active": 2,
  "completed": 1500,
  "failed": 3,
  "delayed": 1
}
```

### Performance Tracking
- Message delivery time
- Queue processing time
- StreamChat API response time
- Client connection health

## 🔄 Automatic Notifications

### Appointment Lifecycle
1. **Created** → Patient, Doctor, Receptionist
2. **24h Before** → Patient, Doctor reminders
3. **Status Change** → All relevant parties
4. **Cancelled** → Patient, Doctor, Receptionist

### Payment Lifecycle
1. **Initiated** → Patient, Receptionist
2. **Success** → Patient, Doctor, Receptionist
3. **Failed** → Patient, Receptionist

### System Events
1. **New Registration** → Admin, Receptionist
2. **Doctor Update** → Admin
3. **Maintenance** → All users

## 🛠️ Configuration

### Environment Variables
```env
# StreamChat Configuration
STREAM_CHAT_API_KEY=your_stream_chat_api_key
STREAM_CHAT_SECRET=your_stream_chat_secret

# Redis Configuration (for BullMQ)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
REDIS_DB=0
```

### StreamChat Setup
1. Create StreamChat application
2. Configure API keys
3. Set up user roles and permissions
4. Configure webhook endpoints (optional)

## 🚀 Deployment

### Production Considerations
- **Redis Cluster**: For BullMQ high availability
- **StreamChat Scaling**: Multiple instances with connection pooling
- **Monitoring**: Queue health and delivery metrics
- **Backup**: Template and campaign data backup

### Scaling Strategy
- **Horizontal Scaling**: Multiple notification workers
- **Load Balancing**: Distribute StreamChat connections
- **Rate Limiting**: Prevent notification spam
- **Circuit Breakers**: Handle StreamChat outages

## 🧪 Testing

### Unit Tests
```typescript
describe('NotificationService', () => {
  it('should send direct notification to user', async () => {
    const result = await notificationService.sendDirectNotification({
      recipientId: 123,
      title: 'Test',
      message: 'Test message',
      type: NotificationType.SYSTEM_NOTIFICATION,
      priority: NotificationPriority.MEDIUM,
    });

    expect(result).toBeDefined();
  });
});
```

### Integration Tests
```typescript
describe('Notification Integration', () => {
  it('should trigger notifications on appointment creation', async () => {
    const appointment = await appointmentService.create(appointmentData);

    // Verify patient notification
    expect(mockNotificationService.sendCreateAppointmentPatientNotification)
      .toHaveBeenCalledWith(expect.objectContaining({
        appointmentId: appointment.id,
      }));
  });
});
```

## 🐛 Troubleshooting

### Common Issues

1. **StreamChat Connection Errors**
   - Verify API keys and secrets
   - Check network connectivity
   - Review rate limits

2. **BullMQ Queue Issues**
   - Redis connection health
   - Worker process status
   - Queue configuration

3. **Template Rendering**
   - Variable syntax validation
   - Template availability
   - Data type compatibility

### Debug Mode
```typescript
// Enable debug logging
process.env.DEBUG_NOTIFICATIONS = 'true';

// Check queue status
GET /api/admin/notifications/analytics/queue

// Test notification delivery
POST /api/admin/notifications/test
{
  "recipientId": 123,
  "message": "Test notification"
}
```

## 📝 Best Practices

### Performance
- **Batch Operations**: Send multiple notifications efficiently
- **Connection Pooling**: Reuse StreamChat connections
- **Async Processing**: Use BullMQ for non-critical notifications
- **Caching**: Cache frequently used templates

### Security
- **Role Validation**: Verify user permissions
- **Input Sanitization**: Prevent XSS in notifications
- **Rate Limiting**: Prevent spam/abuse
- **Audit Logging**: Track all admin actions

### User Experience
- **Smart Grouping**: Group similar notifications
- **Quiet Hours**: Respect user preferences
- **Localized Content**: Support multiple languages
- **Rich Content**: Support images, buttons, actions

## 📈 Future Enhancements

### Planned Features
- **Push Notifications**: FCM/APNS integration
- **Email Notifications**: SMTP integration
- **SMS Notifications**: Twilio integration
- **Web Push**: Browser push notifications
- **Advanced Analytics**: ML-based engagement insights
- **A/B Testing**: Notification optimization
- **Custom Actions**: Interactive notifications

### Extensibility
- **Plugin System**: Custom notification providers
- **Webhooks**: External service integrations
- **Custom Templates**: Advanced template engine
- **Multi-tenant**: Separate notification spaces

---

**Last Updated**: December 2024
**Version**: 1.0.0
**Author**: Sepolia-Health Development Team