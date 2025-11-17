# Kế hoạch Tích hợp DigitalOcean AgentPlatform Chatbot với Stream Chat

## 📋 Tổng quan Dự án

### Mục tiêu

Xây dựng chatbot AI tư vấn tích hợp vào hệ thống Stream Chat hiện có với 2 chức năng chính:

1. **Xem lịch bác sĩ**: Người dùng có thể hỏi về lịch làm việc của bác sĩ cụ thể
2. **Gợi ý thuốc và lối sống**: AI tư vấn về thuốc và thói quen sống khỏe mạnh

### Công nghệ Hiện tại

- **Backend**: NestJS + Prisma + PostgreSQL
- **Frontend**: React Native Expo + Stream Chat React Native
- **Chat System**: Stream Chat (đã có sẵn)
- **APIs hiện có**: Auth, Appointments, Doctors, Patients, Payments, Q&A

### ✨ Approach Mới

- ✅ **Tận dụng Stream Chat** cho message storage và UI
- ✅ **Không cần database** riêng cho chat history
- ✅ **AI Bot như một user** trong Stream Chat channel
- ✅ **Button "Tư vấn với AI"** trong giao diện chat để khởi tạo conversation

---

## 🎯 Phase 1: Research & Setup (2-3 ngày)

### 1.1 Nghiên cứu DigitalOcean AgentPlatform

#### Tài liệu cần đọc:

- [ ] [DigitalOcean AgentPlatform Documentation](https://docs.digitalocean.com/products/ai/agent-platform/)
- [ ] [AgentPlatform API Reference](https://docs.digitalocean.com/reference/api/agent-platform/)
- [ ] [Best Practices for Building AI Agents](https://docs.digitalocean.com/products/ai/agent-platform/guides/)

#### Các điểm cần tìm hiểu:

- [ ] Cách tạo và quản lý AI Agent
- [ ] Cách định nghĩa Tools/Functions cho Agent
- [ ] Cách Agent gọi API backend
- [ ] Token limits và pricing
- [ ] Rate limiting và error handling
- [ ] Streaming responses
- [ ] Context management và memory

### 1.2 Thiết lập Môi trường

#### Backend Setup:

```bash
# Cài đặt SDK
cd Be
npm install @digitalocean/agent-platform-sdk axios
npm install --save-dev @types/node
```

#### Environment Variables:

```env
# Be/.env
DIGITALOCEAN_API_TOKEN=your_token_here
AGENT_PLATFORM_PROJECT_ID=your_project_id
AGENT_ID=your_agent_id
```

#### Frontend Setup:

```bash
# App setup
cd app
npm install @digitalocean/agent-platform-client axios
```

### 1.3 Tạo DigitalOcean Resources

#### Bước thực hiện:

1. [ ] Đăng nhập DigitalOcean Console
2. [ ] Tạo Personal Access Token
3. [ ] Tạo AgentPlatform Project
4. [ ] Tạo AI Agent với cấu hình:
   - Model: GPT-4 hoặc Claude (tùy chọn có sẵn)
   - Temperature: 0.7
   - Max tokens: 2000

---

## 🔧 Phase 2: Backend API Development (3-4 ngày)

### 2.1 Tạo Module Chatbot trong NestJS (Đơn giản hóa)

#### Cấu trúc thư mục:
```
Be/src/module/chatbot/
├── chatbot.module.ts
├── chatbot.controller.ts
├── chatbot.service.ts
├── dto/
│   ├── process-message.dto.ts
│   └── ai-response.dto.ts
└── tools/
    ├── doctor-schedule.tool.ts
    └── health-advice.tool.ts

KHÔNG CẦN:
❌ chatbot.gateway.ts (WebSocket) - Stream Chat handles this
❌ Database models - Stream Chat stores messages
❌ Conversation management - Stream Chat handles this
```

### 2.2 Phát triển Chatbot Tools

#### Tool 1: Doctor Schedule Checker

**Mục đích**: Truy vấn lịch làm việc của bác sĩ

**Input Schema**:

```typescript
{
  doctorId?: number;
  doctorName?: string;
  date?: string; // YYYY-MM-DD
  serviceId?: number;
  locationId?: number;
}
```

**API Endpoint cần tạo**:

```typescript
// GET /api/chatbot/tools/doctor-schedule
@Get('tools/doctor-schedule')
async getDoctorSchedule(@Query() query: DoctorScheduleQueryDto) {
  // 1. Tìm bác sĩ theo ID hoặc tên
  // 2. Lấy DoctorAvailability (lịch cố định hàng tuần)
  // 3. Lấy AvailabilityOverride (lịch đặc biệt)
  // 4. Lấy Appointments đã đặt
  // 5. Tính toán slots còn trống
  // 6. Trả về định dạng dễ hiểu cho AI
}
```

**Output Example**:

```json
{
  "doctor": {
    "id": 1,
    "name": "Dr. Nguyen Van A",
    "specialization": "Nội khoa"
  },
  "date": "2024-01-15",
  "availability": {
    "morning": ["08:00", "09:00", "10:00"],
    "afternoon": ["14:00", "15:00", "16:00"]
  },
  "bookedSlots": ["08:00", "14:00"],
  "availableSlots": ["09:00", "10:00", "15:00", "16:00"]
}
```

#### Tool 2: Health Advice Provider

**Mục đích**: Gợi ý thuốc và lối sống dựa trên triệu chứng

**Input Schema**:

```typescript
{
  symptoms?: string[];
  condition?: string;
  age?: number;
  gender?: string;
  medicalHistory?: string[];
}
```

**API Endpoint**:

```typescript
// POST /api/chatbot/tools/health-advice
@Post('tools/health-advice')
async getHealthAdvice(@Body() dto: HealthAdviceDto) {
  // 1. Phân tích triệu chứng
  // 2. Tra cứu database thuốc (Medicine table)
  // 3. Tạo gợi ý lối sống từ knowledge base
  // 4. Thêm disclaimer y tế
  // 5. Trả về advice structure
}
```

**Output Example**:

```json
{
  "advice": {
    "medications": [
      {
        "name": "Paracetamol 500mg",
        "dosage": "1-2 viên/lần, tối đa 4g/ngày",
        "instructions": "Uống sau bữa ăn"
      }
    ],
    "lifestyle": [
      "Nghỉ ngơi đầy đủ 7-8 tiếng/đêm",
      "Uống nhiều nước",
      "Tránh căng thẳng"
    ],
    "warning": "Đây chỉ là gợi ý ban đầu. Vui lòng đến khám bác sĩ nếu triệu chứng kéo dài.",
    "suggestBooking": true
  }
}
```

### 2.3 Chatbot Service Integration

#### ChatbotService Implementation:

```typescript
// chatbot.service.ts
@Injectable()
export class ChatbotService {
  constructor(
    private prisma: PrismaService,
    private appointmentService: AppointmentService,
  ) {}

  // Khởi tạo kết nối với DigitalOcean Agent
  async initAgent() {
    // Setup agent client
  }

  // Xử lý tin nhắn từ user
  async processMessage(userId: number, message: string) {
    // 1. Lấy conversation history
    // 2. Gửi message đến Agent
    // 3. Agent sẽ tự quyết định gọi tool nào
    // 4. Trả về response
  }

  // Tool executors
  async executeDoctorScheduleTool(params: any) {
    // Logic đã mô tả ở trên
  }

  async executeHealthAdviceTool(params: any) {
    // Logic đã mô tả ở trên
  }
}
```

### 2.4 Database Schema Updates

#### Tạo bảng lưu chat history:

```prisma
// schema.prisma
model ChatConversation {
  id        Int      @id @default(autoincrement())
  userId    Int
  user      User     @relation(fields: [userId], references: [id])
  messages  ChatMessage[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model ChatMessage {
  id             Int              @id @default(autoincrement())
  conversationId Int
  conversation   ChatConversation @relation(fields: [conversationId], references: [id])
  role           String           // 'user' | 'assistant' | 'system'
  content        String
  metadata       Json?            // Tool calls, etc.
  createdAt      DateTime         @default(now())
}
```

#### Migration command:

```bash
cd Be
npx prisma migrate dev --name add_chatbot_tables
```

### 2.5 API Endpoints Summary

| Endpoint                                  | Method    | Purpose                     |
| ----------------------------------------- | --------- | --------------------------- |
| `/api/chatbot/conversations`              | GET       | Lấy danh sách conversations |
| `/api/chatbot/conversations`              | POST      | Tạo conversation mới        |
| `/api/chatbot/conversations/:id/messages` | GET       | Lấy lịch sử tin nhắn        |
| `/api/chatbot/conversations/:id/messages` | POST      | Gửi tin nhắn mới            |
| `/api/chatbot/tools/doctor-schedule`      | GET       | Tool: Kiểm tra lịch bác sĩ  |
| `/api/chatbot/tools/health-advice`        | POST      | Tool: Gợi ý y tế            |
| `/api/chatbot/ws`                         | WebSocket | Real-time chat              |

---

## 🤖 Phase 3: Agent Configuration (2-3 ngày)

### 3.1 Agent System Prompt

```markdown
# Vai trò

Bạn là trợ lý ảo y tế của Sepolia Health, một ứng dụng quản lý sức khỏe.

# Khả năng

1. Tra cứu lịch làm việc của bác sĩ
2. Gợi ý thuốc và lối sống dựa trên triệu chứng
3. Hướng dẫn đặt lịch khám

# Nguyên tắc

- Luôn lịch sự và chuyên nghiệp
- Không chẩn đoán bệnh trực tiếp
- Khuyến khích người dùng đặt lịch khám khi cần
- Cung cấp thông tin chính xác từ database
- Nếu không chắc chắn, hãy nói rõ giới hạn

# Ngôn ngữ

Sử dụng tiếng Việt tự nhiên, thân thiện.
```

### 3.2 Tool Definitions cho Agent

#### Tool 1: check_doctor_schedule

```json
{
  "name": "check_doctor_schedule",
  "description": "Kiểm tra lịch làm việc và slots còn trống của bác sĩ",
  "parameters": {
    "type": "object",
    "properties": {
      "doctorId": {
        "type": "number",
        "description": "ID của bác sĩ"
      },
      "doctorName": {
        "type": "string",
        "description": "Tên bác sĩ (nếu không có doctorId)"
      },
      "date": {
        "type": "string",
        "format": "date",
        "description": "Ngày cần kiểm tra (YYYY-MM-DD)"
      },
      "serviceId": {
        "type": "number",
        "description": "ID dịch vụ khám"
      }
    }
  }
}
```

#### Tool 2: get_health_advice

```json
{
  "name": "get_health_advice",
  "description": "Lấy gợi ý về thuốc và lối sống dựa trên triệu chứng",
  "parameters": {
    "type": "object",
    "properties": {
      "symptoms": {
        "type": "array",
        "items": { "type": "string" },
        "description": "Danh sách triệu chứng"
      },
      "condition": {
        "type": "string",
        "description": "Tình trạng sức khỏe tổng quát"
      },
      "age": {
        "type": "number",
        "description": "Tuổi của bệnh nhân"
      }
    },
    "required": ["symptoms"]
  }
}
```

### 3.3 Conversation Flow Examples

#### Luồng 1: Xem lịch bác sĩ

```
User: "Cho tôi xem lịch của bác sĩ Nguyễn Văn A vào thứ 2 tuần sau"
Assistant: (gọi tool check_doctor_schedule)
Assistant: "Bác sĩ Nguyễn Văn A làm việc vào thứ 2 ngày 22/01/2024 với các khung giờ sau:
- Sáng: 9:00, 10:00, 11:00 (còn trống)
- Chiều: 14:00, 15:00 (còn trống), 16:00 (đã đặt)

Anh/chị muốn đặt lịch khung giờ nào ạ?"
```

#### Luồng 2: Gợi ý sức khỏe

```
User: "Tôi bị đau đầu và sốt nhẹ, nên làm gì?"
Assistant: (gọi tool get_health_advice)
Assistant: "Dựa trên triệu chứng đau đầu và sốt nhẹ, tôi có một số gợi ý:

💊 Thuốc:
- Paracetamol 500mg: 1-2 viên/lần, uống sau ăn
- Không quá 4g/ngày

🌿 Lối sống:
- Nghỉ ngơi đầy đủ
- Uống nhiều nước (2-3 lít/ngày)
- Tránh căng thẳng

⚠️ Lưu ý: Nếu triệu chứng kéo dài trên 3 ngày, vui lòng đặt lịch khám bác sĩ.

Anh/chị có muốn đặt lịch khám không ạ?"
```

### 3.4 Error Handling & Fallbacks

```typescript
// Xử lý khi tool call thất bại
const errorResponses = {
  DOCTOR_NOT_FOUND: "Xin lỗi, tôi không tìm thấy bác sĩ này trong hệ thống.",
  NO_AVAILABILITY: "Bác sĩ không có lịch làm việc vào ngày này.",
  INVALID_DATE: "Ngày không hợp lệ. Vui lòng chọn ngày trong tương lai.",
  GENERAL_ERROR: "Xin lỗi, có lỗi xảy ra. Vui lòng thử lại.",
};
```

---

## 📱 Phase 4: Frontend Integration (3-4 ngày)

### 4.1 Tạo Chatbot UI Components

#### Cấu trúc component:

```
app/components/chatbot/
├── ChatbotButton.tsx         # Floating button
├── ChatbotModal.tsx          # Modal container
├── ChatbotHeader.tsx         # Header với avatar
├── MessageList.tsx           # Danh sách tin nhắn
├── MessageBubble.tsx         # Bubble cho mỗi tin nhắn
├── MessageInput.tsx          # Input để gửi tin nhắn
├── TypingIndicator.tsx       # Hiệu ứng typing
├── QuickReplies.tsx          # Gợi ý câu hỏi nhanh
└── ActionButtons.tsx         # Buttons trong message
```

### 4.2 Chatbot Service (Frontend)

```typescript
// app/services/chatbot.service.ts
import axios from "axios";
import { API_CONFIG, API_ENDPOINTS } from "@/constants/api";

export const chatbotService = {
  // Lấy hoặc tạo conversation
  async getOrCreateConversation(userId: number) {
    const response = await axios.get(
      `${API_CONFIG.BASE_URL}/chatbot/conversations`,
      { params: { userId } },
    );

    if (response.data.length === 0) {
      return this.createConversation(userId);
    }

    return response.data[0];
  },

  // Gửi tin nhắn
  async sendMessage(conversationId: number, message: string) {
    return axios.post(
      `${API_CONFIG.BASE_URL}/chatbot/conversations/${conversationId}/messages`,
      { content: message },
    );
  },

  // Lấy lịch sử
  async getMessages(conversationId: number) {
    return axios.get(
      `${API_CONFIG.BASE_URL}/chatbot/conversations/${conversationId}/messages`,
    );
  },
};
```

### 4.3 Chatbot Screen Implementation

```tsx
// app/components/chatbot/ChatbotModal.tsx
import { useState, useEffect } from "react";
import { View, Modal } from "react-native";
import { useMutation, useQuery } from "@tanstack/react-query";

export function ChatbotModal({ visible, onClose, userId }) {
  const [messages, setMessages] = useState([]);

  // Get conversation
  const { data: conversation } = useQuery({
    queryKey: ["chatbot-conversation", userId],
    queryFn: () => chatbotService.getOrCreateConversation(userId),
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (message: string) =>
      chatbotService.sendMessage(conversation.id, message),
    onSuccess: (response) => {
      setMessages((prev) => [...prev, response.data]);
    },
  });

  return (
    <Modal visible={visible} animationType="slide">
      <View className="flex-1 bg-white">
        <ChatbotHeader onClose={onClose} />
        <MessageList messages={messages} />
        <MessageInput onSend={sendMessageMutation.mutate} />
      </View>
    </Modal>
  );
}
```

### 4.4 UI/UX Design Guidelines

#### Design System:

- **Primary Color**: #4F46E5 (Indigo)
- **Bot Avatar**: 🤖 hoặc custom SVG
- **User Bubble**: Nền xanh, text trắng, căn phải
- **Bot Bubble**: Nền xám nhạt, text đen, căn trái
- **Font**: System default
- **Animations**: Smooth transitions, typing indicator

#### Quick Replies Suggestions:

```typescript
const quickReplies = [
  "Xem lịch bác sĩ",
  "Tôi cần tư vấn sức khỏe",
  "Đặt lịch khám",
  "Liên hệ hỗ trợ",
];
```

### 4.5 Real-time Updates (Optional)

Nếu muốn real-time:

```typescript
// Sử dụng WebSocket
import { io } from "socket.io-client";

const socket = io(`${API_CONFIG.BASE_URL}/chatbot`);

socket.on("message", (message) => {
  setMessages((prev) => [...prev, message]);
});
```

---

## 🧪 Phase 5: Testing & Optimization (2-3 ngày)

### 5.1 Unit Tests

#### Backend Tests:

```typescript
// chatbot.service.spec.ts
describe("ChatbotService", () => {
  it("should find doctor by name", async () => {
    // Test logic
  });

  it("should return available time slots", async () => {
    // Test logic
  });

  it("should provide health advice", async () => {
    // Test logic
  });
});
```

#### Frontend Tests:

```typescript
// ChatbotModal.test.tsx
describe("ChatbotModal", () => {
  it("should render message list", () => {
    // Test
  });

  it("should send message on submit", () => {
    // Test
  });
});
```

### 5.2 Integration Testing

#### Test Scenarios:

1. **Happy Path**:
   - User hỏi lịch bác sĩ → Bot trả về lịch → User đặt lịch

2. **Error Cases**:
   - Bác sĩ không tồn tại
   - Ngày không hợp lệ
   - API timeout

3. **Edge Cases**:
   - User nhập text rất dài
   - User spam messages
   - Mất kết nối internet

### 5.3 Performance Optimization

#### Backend:

- [ ] Cache doctor availability trong Redis
- [ ] Implement rate limiting
- [ ] Optimize database queries với indexes
- [ ] Add request timeout

#### Frontend:

- [ ] Lazy load chat history
- [ ] Debounce input
- [ ] Optimize re-renders
- [ ] Add loading states

### 5.4 Security Considerations

- [ ] Validate user permissions
- [ ] Sanitize user inputs
- [ ] Rate limit API calls
- [ ] Encrypt sensitive data
- [ ] Add CORS policies
- [ ] Implement API key rotation

### 5.5 User Acceptance Testing

#### Test với real users:

- [ ] 5-10 beta testers
- [ ] Collect feedback về:
  - UX/UI
  - Response accuracy
  - Response time
  - Feature requests
- [ ] Iterate based on feedback

---

## 📊 Monitoring & Analytics

### 5.6 Setup Monitoring

#### Metrics to track:

- [ ] Number of conversations
- [ ] Average response time
- [ ] Tool call success rate
- [ ] User satisfaction (thumbs up/down)
- [ ] Most asked questions
- [ ] Error rate

#### Logging:

```typescript
// Use Winston or Pino
logger.info("Chatbot message sent", {
  userId,
  conversationId,
  toolsCalled: ["check_doctor_schedule"],
  responseTime: "1.2s",
});
```

---

## 🚀 Deployment Plan

### 6.1 Environment Setup

#### Development:

```env
DIGITALOCEAN_API_TOKEN=dev_token
AGENT_ID=dev_agent_id
NODE_ENV=development
```

#### Production:

```env
DIGITALOCEAN_API_TOKEN=prod_token
AGENT_ID=prod_agent_id
NODE_ENV=production
```

### 6.2 Deployment Checklist

Backend:

- [ ] Run migrations
- [ ] Update environment variables
- [ ] Deploy to DigitalOcean App Platform
- [ ] Test API endpoints
- [ ] Monitor logs

Frontend:

- [ ] Update API URLs
- [ ] Build production bundle
- [ ] Test on iOS & Android
- [ ] Submit to app stores (if needed)

### 6.3 Rollback Plan

Nếu có issues:

1. Revert backend deployment
2. Disable chatbot feature flag
3. Show maintenance message
4. Fix issues in development
5. Redeploy

---

## 📚 Documentation

### 7.1 API Documentation

Sử dụng Swagger:

```typescript
@ApiTags('Chatbot')
@Controller('chatbot')
export class ChatbotController {
  @ApiOperation({ summary: 'Send message to chatbot' })
  @ApiResponse({ status: 200, description: 'Message sent successfully' })
  // ...
}
```

### 7.2 User Documentation

Tạo guide cho users:

- Cách sử dụng chatbot
- Các câu hỏi mẫu
- Tips & tricks
- FAQ

---

## 🎯 Success Metrics

### KPIs:

- **Adoption Rate**: 30% users sử dụng chatbot trong tháng đầu
- **Engagement**: Average 5 messages per conversation
- **Accuracy**: 90% tool calls successful
- **Response Time**: < 2 seconds average
- **User Satisfaction**: > 4/5 stars

---

## 🔄 Iteration Plan

### Phase 6: Future Enhancements (After launch)

1. **Thêm tools**:
   - [ ] Search doctors by specialty
   - [ ] Check test results
   - [ ] Medication reminders
   - [ ] Health tips daily

2. **Improve AI**:
   - [ ] Fine-tune model on domain data
   - [ ] Add conversation memory
   - [ ] Multi-turn booking flow

3. **Analytics**:
   - [ ] User behavior tracking
   - [ ] A/B testing prompts
   - [ ] Sentiment analysis

---

## 💰 Cost Estimation

### DigitalOcean AgentPlatform:

- **Pricing**: ~$0.002 per 1K tokens (estimate)
- **Expected usage**: 100K messages/month
- **Estimated cost**: $50-100/month

### Development Time:

- **Phase 1-5**: 12-16 ngày
- **Developer**: 1 full-stack developer

### Infrastructure:

- Agent hosting: Included in DO
- Backend hosting: Existing
- Storage: Minimal (chat history)

---

## ⚠️ Risks & Mitigation

| Risk                  | Impact | Mitigation                       |
| --------------------- | ------ | -------------------------------- |
| API rate limits       | High   | Implement caching, queue         |
| High costs            | Medium | Monitor usage, set limits        |
| Poor AI responses     | High   | Extensive testing, fallbacks     |
| User privacy concerns | High   | Clear privacy policy, encryption |
| Tool call failures    | Medium | Error handling, retries          |

---

## 📞 Support & Contact

### Team:

- **Project Lead**: [Your name]
- **Backend Dev**: [Name]
- **Frontend Dev**: [Name]

### Resources:

- GitHub Repo: [Link]
- Documentation: [Link]
- Issue Tracker: [Link]

---

## ✅ Next Steps

1. **Immediate**:
   - [ ] Review this plan
   - [ ] Get approval from stakeholders
   - [ ] Create DigitalOcean account
   - [ ] Setup development environment

2. **This Week**:
   - [ ] Start Phase 1: Research
   - [ ] Create agent in DO console
   - [ ] Begin backend module

3. **This Sprint**:
   - [ ] Complete Phase 1-2
   - [ ] Have working API endpoints
   - [ ] Test tools with Postman

---

**Document Version**: 1.0
**Last Updated**: 2024-01-15
**Status**: Draft for Review
