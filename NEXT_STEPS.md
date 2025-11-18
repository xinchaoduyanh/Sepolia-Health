# 🚀 Next Steps - Chatbot Implementation

## ✅ Đã Hoàn Thành

### Backend Files Created:

- ✅ `Be/src/module/chatbot/chatbot.module.ts`
- ✅ `Be/src/module/chatbot/chatbot.controller.ts`
- ✅ `Be/src/module/chatbot/chatbot.service.ts`
- ✅ `Be/src/module/chatbot/dto/process-message.dto.ts`
- ✅ `Be/src/module/chatbot/tools/doctor-schedule.tool.ts`
- ✅ `Be/src/module/chatbot/tools/health-advice.tool.ts`

---

## 🔧 Phase 1: Backend Setup (30 phút)

### Step 1: Install Dependencies

```bash
cd Be
npm install axios date-fns
```

### Step 2: Update Environment Variables

Thêm vào `Be/.env`:

```env
# DigitalOcean Agent (sẽ setup sau)
DIGITALOCEAN_API_TOKEN="dop_v1_xxxxx"
DIGITALOCEAN_AGENT_ID="agent_xxxxx"

# AI Bot Config
AI_BOT_USER_ID="ai-assistant"
AI_BOT_NAME="Trợ lý AI Sepolia"
```

### Step 3: Register ChatbotModule

Thêm vào `Be/src/module/app.module.ts`:

```typescript
import { ChatbotModule } from "./chatbot/chatbot.module";

@Module({
  imports: [
    // ... existing imports
    ChatbotModule,
  ],
})
export class AppModule {}
```

### Step 4: Test Backend

```bash
# Start dev server
npm run dev

# Test endpoint
curl http://localhost:8000/api/chatbot/test
```

---

## 🤖 Phase 2: Setup DigitalOcean Agent (20 phút)

### Step 1: Follow Quick Start Guide

Xem: `CHATBOT_QUICK_START.md` sections 1-4

### Step 2: Create AI Bot User in Stream Chat

```bash
# Call endpoint sau khi có token
curl -X POST http://localhost:8000/api/chatbot/setup/create-bot-user
```

Hoặc tạo manual trong Stream Chat Dashboard:

- User ID: `ai-assistant`
- Name: `Trợ lý AI Sepolia`
- Role: `user`
- Avatar: https://api.dicebear.com/7.x/bottts/svg?seed=ai-assistant

---

## 📱 Phase 3: Frontend Integration (1-2 giờ)

### Step 1: Create AI Chat Service

Tạo file: `app/services/ai-chat.service.ts`

```typescript
import { StreamChat } from "stream-chat";

const AI_BOT_USER_ID = "ai-assistant";

export const aiChatService = {
  /**
   * Create or get existing channel với AI bot
   */
  async createAIConsultationChannel(client: StreamChat, userId: string) {
    try {
      // Channel ID unique cho mỗi user
      const channelId = `ai-consult-${userId}`;

      // Create or get channel
      const channel = client.channel("messaging", channelId, {
        name: "Tư vấn với AI",
        image: "https://api.dicebear.com/7.x/bottts/svg?seed=ai-assistant",
        members: [userId, AI_BOT_USER_ID],
        // Custom data
        ai_channel: true,
        consultation_type: "ai_assistant",
      });

      await channel.watch();

      // Send welcome message nếu channel mới
      const messages = await channel.query({ messages: { limit: 1 } });
      if (messages.messages.length === 0) {
        await channel.sendMessage({
          text: `Xin chào! 👋\n\nTôi là trợ lý AI của Sepolia Health. Tôi có thể giúp bạn:\n\n• Xem lịch làm việc của bác sĩ\n• Tư vấn về sức khỏe và thuốc men\n• Hướng dẫn đặt lịch khám\n\nBạn cần hỗ trợ gì?`,
          user_id: AI_BOT_USER_ID,
        });
      }

      return channel;
    } catch (error) {
      console.error("Create AI channel error:", error);
      throw error;
    }
  },
};
```

### Step 2: Create AI Consultant Button Component

Copy file template đã tạo:

- `app/components/chatbot/AIConsultantButton.tsx.template` → remove `.template`

Hoặc tạo đơn giản:

```typescript
// app/components/chat/AIConsultantButton.tsx
import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';

export function AIConsultantButton({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg p-4 mb-4"
    >
      <Text className="text-white font-bold text-lg">
        🤖 Tư vấn với AI
      </Text>
      <Text className="text-white/80 text-sm">
        Hỏi về lịch bác sĩ, sức khỏe và thuốc men
      </Text>
    </TouchableOpacity>
  );
}
```

### Step 3: Integrate vào Chat Screen

Tìm file chat screen hiện tại (có thể là `app/app/(homes)/chat.tsx` hoặc tương tự):

```typescript
import { useState } from 'react';
import { View, Alert } from 'react-native';
import { AIConsultantButton } from '@/components/chat/AIConsultantButton';
import { aiChatService } from '@/services/ai-chat.service';
import { useNavigation } from '@react-navigation/native';

export default function ChatScreen() {
  const navigation = useNavigation();
  const { client, userId } = useStreamChat(); // Your existing hook

  const handleAIConsultation = async () => {
    try {
      // Create or get AI channel
      const channel = await aiChatService.createAIConsultationChannel(
        client,
        userId.toString()
      );

      // Navigate to channel
      navigation.navigate('Channel', {
        channel,
      });
    } catch (error) {
      console.error('Start AI consultation error:', error);
      Alert.alert('Lỗi', 'Không thể kết nối với trợ lý AI');
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* AI Consultant Button */}
      <View className="p-4">
        <AIConsultantButton onPress={handleAIConsultation} />
      </View>

      {/* Regular Channel List - Your existing code */}
      {/* ... */}
    </View>
  );
}
```

---

## 🔌 Phase 4: Connect Backend (Choose One)

### Option A: Webhook (Recommended)

#### Setup Stream Chat Webhook:

1. Vào Stream Chat Dashboard
2. Navigate to: Chat > Webhooks
3. Add Webhook URL: `https://your-api.com/api/chatbot/webhook/stream-chat`
4. Select Events: `message.new`
5. Save

✅ **Ưu điểm**: Tự động, không cần code thêm
❌ **Nhược điểm**: Cần public URL (dùng ngrok cho dev)

---

### Option B: Direct API Call (Đơn giản hơn cho dev)

Thêm logic gọi API sau khi user gửi message:

```typescript
// app/services/chatbot.service.ts
import axios from "axios";
import { API_CONFIG } from "@/constants/api";

export const chatbotService = {
  async processMessage(channelId: string, message: string, userId: string) {
    try {
      await axios.post(`${API_CONFIG.BASE_URL}/chatbot/process`, {
        message,
        channelId,
        userId,
      });
    } catch (error) {
      console.error("Process message error:", error);
    }
  },
};
```

```typescript
// In your Channel screen, after sending message:
const handleSendMessage = async (text: string) => {
  // Send message qua Stream Chat
  await channel.sendMessage({ text });

  // Trigger bot reply
  if (channel.id?.startsWith("ai-consult-")) {
    chatbotService.processMessage(channel.id, text, userId.toString());
  }
};
```

✅ **Ưu điểm**: Dễ debug, không cần webhook
❌ **Nhược điểm**: Cần modify channel UI code

---

## ✅ Testing Checklist

### Backend

- [ ] Module import không có lỗi
- [ ] Bot user tạo thành công: `POST /api/chatbot/setup/create-bot-user`
- [ ] Test endpoint: `GET /api/chatbot/test`
- [ ] Doctor schedule tool works: Test với doctorId
- [ ] Health advice tool works: Test với symptoms

### Frontend

- [ ] Button "Tư vấn với AI" hiển thị trong chat screen
- [ ] Click button tạo channel thành công
- [ ] Channel hiển thị trong channel list
- [ ] Welcome message hiển thị

### Integration

- [ ] User gửi message → Bot reply (qua webhook hoặc API)
- [ ] Test: "Cho tôi xem lịch bác sĩ"
- [ ] Test: "Tôi bị đau đầu và sốt"
- [ ] Bot response có ý nghĩa và chính xác
- [ ] Error handling works

---

## 🐛 Troubleshooting

### Backend Issues

**Error: "Cannot find module"**

```bash
cd Be
npm install axios date-fns
```

**Error: "DigitalOcean Agent not configured"**

- Check `.env` có `DIGITALOCEAN_API_TOKEN` và `DIGITALOCEAN_AGENT_ID`
- Verify token còn hiệu lực

**Error: "AI bot user not found"**

```bash
curl -X POST http://localhost:8000/api/chatbot/setup/create-bot-user
```

### Frontend Issues

**Error: "Channel not found"**

- Verify AI_BOT_USER_ID đúng
- Check bot user exists in Stream Chat

**Bot không reply**

- Check webhook setup (Option A)
- Check API call after sendMessage (Option B)
- Check backend logs

---

## 📊 Estimated Timeline

| Task                           | Time         | Status |
| ------------------------------ | ------------ | ------ |
| Install deps & register module | 10 min       | ⏳     |
| Setup DigitalOcean Agent       | 20 min       | ⏳     |
| Create AI bot user             | 5 min        | ⏳     |
| Frontend service & button      | 30 min       | ⏳     |
| Integrate into chat screen     | 20 min       | ⏳     |
| Setup webhook/API              | 15 min       | ⏳     |
| Testing end-to-end             | 30 min       | ⏳     |
| **Total**                      | **~2 hours** | ⏳     |

---

## 📚 Documentation Reference

- **Main Implementation Guide**: `CHATBOT_STREAMCHAT_IMPLEMENTATION.md`
- **Quick Start**: `CHATBOT_QUICK_START.md`
- **Original Plan**: `CHATBOT_IMPLEMENTATION_PLAN.md` (đã update)

---

## 🎯 Success Criteria

✅ User có thể bấm "Tư vấn với AI" trong chat
✅ Channel với AI bot được tạo tự động
✅ User gửi message → Bot reply trong vài giây
✅ Bot có thể tra cứu lịch bác sĩ chính xác
✅ Bot có thể đưa ra gợi ý sức khỏe hợp lý
✅ Error cases được handle tốt
✅ UI/UX mượt mà, không lag

---

## 🚀 Ready to Start!

1. ✅ **Ngay bây giờ**: Install dependencies

   ```bash
   cd Be && npm install axios date-fns
   ```

2. ✅ **Tiếp theo**: Follow `CHATBOT_QUICK_START.md` để setup DigitalOcean

3. ✅ **Sau đó**: Implement frontend theo guide trên

4. ✅ **Cuối cùng**: Test và tối ưu

Good luck! 🎉
