# Appointment Swagger DTOs

Folder này chứa các DTO classes cho Swagger documentation của Appointment module.

## Cấu trúc:

- `appointment-swagger.dto.ts` - Chứa tất cả DTO classes cho Appointment endpoints
- `index.ts` - Export tất cả DTOs để dễ import

## Sử dụng:

```typescript
import { CreateAppointmentDto, UpdateAppointmentDto } from './swagger';
```

## DTOs có sẵn:

### Request DTOs:

- `CreateAppointmentDto` - Tạo lịch hẹn mới
- `UpdateAppointmentDto` - Cập nhật lịch hẹn
- `GetAppointmentsQueryDto` - Query parameters cho danh sách

## Lợi ích:

1. **Tách biệt**: Mỗi module có swagger riêng
2. **Dễ maintain**: Không bị conflict giữa các module
3. **Scalable**: Dễ thêm module mới
4. **Clean**: Code gọn gàng, dễ đọc
