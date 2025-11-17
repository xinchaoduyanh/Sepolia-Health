# 🤖 Chatbot Implementation với Stream Chat - Simplified Approach

## 🎯 Overview

### Approach

- ✅ AI Bot là một **Stream Chat User**
- ✅ Khi user bấm "Tư vấn với AI" → Tạo channel với AI bot
- ✅ User gửi message → Backend xử lý → Bot reply trong Stream Chat
- ✅ Lịch sử chat tự động lưu trong Stream Chat
- ❌ Không cần database riêng cho chat

### Flow

```
User → Bấm "Tư vấn với AI"
     → Tạo channel với AI Bot User
     → Gửi message trong channel
     → Webhook → Backend API
     → Process với DigitalOcean Agent
     → Bot reply trong channel
     → User nhận response trong Stream Chat UI
```

---

## 📋 Checklist Tổng Quan

### Backend (2-3 giờ)

- [ ] Setup DigitalOcean Agent
- [ ] Tạo AI Bot user trong Stream Chat
- [ ] Tạo webhook endpoint nhận message
- [ ] Implement message processing
- [ ] Implement doctor schedule tool
- [ ] Implement health advice tool
- [ ] Bot reply qua Stream Chat API

### Frontend (1-2 giờ)

- [ ] Thêm button "Tư vấn với AI" trong chat UI
- [ ] Tạo channel với AI bot khi bấm button
- [ ] Hiển thị channel trong danh sách chat
- [ ] (Optional) Custom UI cho AI messages

---

## 🔧 Phase 1: Backend Setup

### Step 1.1: DigitalOcean Agent Setup

```bash
# Đã có hướng dẫn trong CHATBOT_QUICK_START.md
# Chỉ cần follow steps 1-4
```

### Step 1.2: Create AI Bot User in Stream Chat

#### Option A: Qua Stream Chat Dashboard

```
1. Vào Stream Chat Dashboard
2. Navigate to Users
3. Create User:
   - User ID: "ai-assistant"
   - Name: "Trợ lý AI Sepolia"
   - Role: "user"
   - Image: [Bot avatar URL]
```

#### Option B: Qua Backend Code

```typescript
// Be/src/module/chat/chat.service.ts
import { StreamChat } from 'stream-chat';

async createAIBotUser() {
  const client = StreamChat.getInstance(
    process.env.STREAM_API_KEY,
    process.env.STREAM_API_SECRET
  );

  await client.upsertUser({
    id: 'ai-assistant',
    name: 'Trợ lý AI Sepolia',
    role: 'user',
    image: 'https://your-cdn.com/ai-bot-avatar.png',
    // Metadata
    bot: true,
    capabilities: ['doctor_schedule', 'health_advice'],
  });
}
```

### Step 1.3: Update Environment Variables

```env
# Be/.env

# DigitalOcean Agent
DIGITALOCEAN_API_TOKEN="dop_v1_xxxxx"
DIGITALOCEAN_AGENT_ID="agent_xxxxx"

# Stream Chat (already exists)
STREAM_API_KEY="xxxxx"
STREAM_API_SECRET="xxxxx"

# AI Bot Config
AI_BOT_USER_ID="ai-assistant"
AI_BOT_NAME="Trợ lý AI Sepolia"
```

---

## 🔌 Phase 2: Backend Implementation

### Step 2.1: Create Chatbot Module

#### File: `Be/src/module/chatbot/chatbot.module.ts`

```typescript
import { Module } from "@nestjs/common";
import { ChatbotController } from "./chatbot.controller";
import { ChatbotService } from "./chatbot.service";
import { DoctorScheduleTool } from "./tools/doctor-schedule.tool";
import { HealthAdviceTool } from "./tools/health-advice.tool";
import { ChatModule } from "../chat/chat.module";

@Module({
  imports: [ChatModule], // For Stream Chat integration
  controllers: [ChatbotController],
  providers: [ChatbotService, DoctorScheduleTool, HealthAdviceTool],
  exports: [ChatbotService],
})
export class ChatbotModule {}
```

#### File: `Be/src/module/chatbot/chatbot.controller.ts`

```typescript
import { Controller, Post, Body } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { ChatbotService } from "./chatbot.service";
import { ProcessMessageDto } from "./dto/process-message.dto";

@ApiTags("Chatbot")
@Controller("chatbot")
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  /**
   * Webhook endpoint từ Stream Chat
   * Khi user gửi message trong channel với AI bot
   */
  @Post("webhook/stream-chat")
  @ApiOperation({ summary: "Process message from Stream Chat webhook" })
  async handleStreamChatWebhook(@Body() payload: any) {
    // Verify webhook signature (important!)
    // Process only messages sent to AI bot

    if (payload.type === "message.new") {
      const message = payload.message;
      const channelId = payload.channel_id;
      const userId = message.user.id;

      // Ignore messages from AI bot itself
      if (userId === process.env.AI_BOT_USER_ID) {
        return { status: "ignored" };
      }

      // Process message
      await this.chatbotService.processMessageAndReply(
        channelId,
        message.text,
        userId,
      );
    }

    return { status: "ok" };
  }

  /**
   * Alternative: Direct API call (không dùng webhook)
   * Frontend gọi trực tiếp khi user gửi message
   */
  @Post("process")
  @ApiOperation({ summary: "Process message and return AI response" })
  async processMessage(@Body() dto: ProcessMessageDto) {
    return this.chatbotService.processMessage(dto.message, dto.userId);
  }
}
```

#### File: `Be/src/module/chatbot/chatbot.service.ts`

```typescript
import { Injectable } from "@nestjs/common";
import { StreamChat } from "stream-chat";
import axios from "axios";
import { DoctorScheduleTool } from "./tools/doctor-schedule.tool";
import { HealthAdviceTool } from "./tools/health-advice.tool";

@Injectable()
export class ChatbotService {
  private streamClient: StreamChat;
  private readonly agentApiUrl: string;
  private readonly agentId: string;
  private readonly apiToken: string;
  private readonly botUserId: string;

  constructor(
    private readonly doctorScheduleTool: DoctorScheduleTool,
    private readonly healthAdviceTool: HealthAdviceTool,
  ) {
    // Initialize Stream Chat
    this.streamClient = StreamChat.getInstance(
      process.env.STREAM_API_KEY,
      process.env.STREAM_API_SECRET,
    );

    // DigitalOcean Agent config
    this.agentId = process.env.DIGITALOCEAN_AGENT_ID;
    this.apiToken = process.env.DIGITALOCEAN_API_TOKEN;
    this.agentApiUrl = `https://api.digitalocean.com/v2/ai/agents/${this.agentId}/chat`;
    this.botUserId = process.env.AI_BOT_USER_ID || "ai-assistant";
  }

  /**
   * Process message và reply trong Stream Chat
   */
  async processMessageAndReply(
    channelId: string,
    messageText: string,
    userId: string,
  ) {
    try {
      // Get channel
      const channel = this.streamClient.channel("messaging", channelId);

      // Show typing indicator
      await channel.sendEvent({
        type: "typing.start",
        user_id: this.botUserId,
      });

      // Get conversation history from Stream Chat
      const history = await this.getChannelHistory(channelId);

      // Process with DigitalOcean Agent
      const agentResponse = await this.callAgent([
        ...history,
        { role: "user", content: messageText },
      ]);

      // Execute tools if needed
      let finalResponse = agentResponse.content;

      if (agentResponse.toolCalls && agentResponse.toolCalls.length > 0) {
        const toolResults = await this.executeTools(agentResponse.toolCalls);

        // Call agent again with tool results
        const finalAgentResponse = await this.callAgentWithToolResults(
          [...history, { role: "user", content: messageText }],
          agentResponse.toolCalls,
          toolResults,
        );

        finalResponse = finalAgentResponse.content;
      }

      // Stop typing
      await channel.sendEvent({
        type: "typing.stop",
        user_id: this.botUserId,
      });

      // Send bot reply
      await channel.sendMessage({
        text: finalResponse,
        user_id: this.botUserId,
      });

      return { success: true };
    } catch (error) {
      console.error("Process message error:", error);

      // Send error message
      const channel = this.streamClient.channel("messaging", channelId);
      await channel.sendMessage({
        text: "Xin lỗi, có lỗi xảy ra. Vui lòng thử lại sau.",
        user_id: this.botUserId,
      });

      throw error;
    }
  }

  /**
   * Process message và return response (không reply vào channel)
   * Dùng cho direct API call
   */
  async processMessage(messageText: string, userId?: string) {
    try {
      const agentResponse = await this.callAgent([
        { role: "user", content: messageText },
      ]);

      let finalResponse = agentResponse.content;

      if (agentResponse.toolCalls && agentResponse.toolCalls.length > 0) {
        const toolResults = await this.executeTools(agentResponse.toolCalls);
        const finalAgentResponse = await this.callAgentWithToolResults(
          [{ role: "user", content: messageText }],
          agentResponse.toolCalls,
          toolResults,
        );
        finalResponse = finalAgentResponse.content;
      }

      return {
        response: finalResponse,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Process message error:", error);
      return {
        response: "Xin lỗi, có lỗi xảy ra. Vui lòng thử lại sau.",
        error: error.message,
      };
    }
  }

  /**
   * Get conversation history from Stream Chat channel
   */
  private async getChannelHistory(channelId: string) {
    try {
      const channel = this.streamClient.channel("messaging", channelId);
      const messages = await channel.query({
        messages: { limit: 20 },
      });

      return messages.messages.map((msg) => ({
        role: msg.user.id === this.botUserId ? "assistant" : "user",
        content: msg.text,
      }));
    } catch (error) {
      console.error("Get channel history error:", error);
      return [];
    }
  }

  /**
   * Call DigitalOcean Agent
   */
  private async callAgent(messages: any[]) {
    try {
      const response = await axios.post(
        this.agentApiUrl,
        {
          messages,
          temperature: 0.7,
          max_tokens: 2000,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiToken}`,
            "Content-Type": "application/json",
          },
        },
      );

      return {
        content: response.data.message.content,
        toolCalls: response.data.message.tool_calls || [],
      };
    } catch (error) {
      console.error("Agent API error:", error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Call agent with tool results
   */
  private async callAgentWithToolResults(
    messages: any[],
    toolCalls: any[],
    toolResults: any[],
  ) {
    const messagesWithToolResults = [
      ...messages,
      {
        role: "assistant",
        content: "",
        tool_calls: toolCalls,
      },
      ...toolResults.map((result) => ({
        role: "tool",
        tool_call_id: result.id,
        content: JSON.stringify(result.output),
      })),
    ];

    return this.callAgent(messagesWithToolResults);
  }

  /**
   * Execute tools
   */
  private async executeTools(toolCalls: any[]) {
    const results = [];

    for (const toolCall of toolCalls) {
      try {
        let output;

        switch (toolCall.name) {
          case "check_doctor_schedule":
            output = await this.doctorScheduleTool.execute(toolCall.parameters);
            break;

          case "get_health_advice":
            output = await this.healthAdviceTool.execute(toolCall.parameters);
            break;

          default:
            output = { error: `Unknown tool: ${toolCall.name}` };
        }

        results.push({
          id: toolCall.id || Math.random().toString(),
          output,
        });
      } catch (error) {
        results.push({
          id: toolCall.id || Math.random().toString(),
          output: { error: error.message },
        });
      }
    }

    return results;
  }
}
```

### Step 2.2: Create DTOs

#### File: `Be/src/module/chatbot/dto/process-message.dto.ts`

```typescript
import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsOptional, IsNotEmpty } from "class-validator";

export class ProcessMessageDto {
  @ApiProperty({
    description: "Message content",
    example: "Cho tôi xem lịch bác sĩ Nguyễn Văn A",
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({
    description: "User ID (optional)",
    example: "user_123",
    required: false,
  })
  @IsOptional()
  @IsString()
  userId?: string;
}
```

### Step 2.3: Tools (giữ nguyên)

Copy 2 files tools từ templates đã tạo:

- `tools/doctor-schedule.tool.ts`
- `tools/health-advice.tool.ts`

---

## 📱 Phase 3: Frontend Integration

### Step 3.1: Add "Tư vấn với AI" Button

#### File: `app/components/chat/AIConsultantButton.tsx`

```typescript
import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import { Bot } from 'lucide-react-native';

interface AIConsultantButtonProps {
  onPress: () => void;
}

export function AIConsultantButton({ onPress }: AIConsultantButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg p-4 mb-4 flex-row items-center shadow-md"
      activeOpacity={0.8}
    >
      <View className="bg-white/20 rounded-full p-2 mr-3">
        <Bot size={24} color="white" />
      </View>

      <View className="flex-1">
        <Text className="text-white font-bold text-lg">
          Tư vấn với AI
        </Text>
        <Text className="text-white/80 text-sm">
          Hỏi về lịch bác sĩ, sức khỏe và thuốc men
        </Text>
      </View>

      <View className="bg-white/20 rounded-full px-3 py-1">
        <Text className="text-white font-semibold">Chat</Text>
      </View>
    </TouchableOpacity>
  );
}
```

### Step 3.2: Create or Join AI Channel

#### File: `app/services/ai-chat.service.ts`

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
        image: "https://your-cdn.com/ai-bot-avatar.png",
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

### Step 3.3: Integrate vào Chat Screen

#### File: `app/app/(homes)/chat/index.tsx` (hoặc nơi có chat UI)

```typescript
import { useState } from 'react';
import { View } from 'react-native';
import { ChannelList } from 'stream-chat-react-native';
import { AIConsultantButton } from '@/components/chat/AIConsultantButton';
import { aiChatService } from '@/services/ai-chat.service';
import { useStreamChat } from '@/hooks/useStreamChat'; // Your existing hook

export default function ChatScreen() {
  const { client, userId } = useStreamChat();
  const navigation = useNavigation();

  const handleAIConsultation = async () => {
    try {
      // Create or get AI channel
      const channel = await aiChatService.createAIConsultationChannel(
        client,
        userId
      );

      // Navigate to channel
      navigation.navigate('ChatChannel', {
        channelId: channel.id,
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

      {/* Regular Channel List */}
      <ChannelList
        filters={{ members: { $in: [userId] } }}
        sort={{ last_message_at: -1 }}
        onSelect={(channel) => {
          navigation.navigate('ChatChannel', {
            channelId: channel.id,
          });
        }}
      />
    </View>
  );
}
```

---

## 🔗 Phase 4: Stream Chat Webhook Setup

### Option A: Webhook (Recommended cho production)

#### Step 4.1: Setup Webhook trong Stream Chat Dashboard

```
1. Vào Stream Chat Dashboard
2. Navigate to: Chat > Webhooks
3. Add Webhook URL: https://your-api.com/api/chatbot/webhook/stream-chat
4. Select Events:
   - message.new
   - message.updated
5. Save
```

#### Step 4.2: Verify Webhook Signature

```typescript
// Be/src/module/chatbot/chatbot.controller.ts
import { createHmac } from 'crypto';

verifyWebhookSignature(payload: any, signature: string): boolean {
  const secret = process.env.STREAM_WEBHOOK_SECRET;
  const hash = createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');

  return hash === signature;
}
```

### Option B: Direct API Call (Đơn giản hơn cho development)

Frontend gọi trực tiếp backend sau khi gửi message:

```typescript
// app/screens/ChatChannel.tsx
import { chatbotService } from "@/services/chatbot.service";

const handleSendMessage = async (text: string) => {
  // Send message qua Stream Chat
  await channel.sendMessage({ text });

  // Call backend để bot reply
  await chatbotService.processMessage({
    message: text,
    channelId: channel.id,
    userId: currentUserId,
  });
};
```

---

## ✅ Testing Checklist

### Backend

- [ ] AI bot user tạo thành công trong Stream Chat
- [ ] Webhook nhận được message events
- [ ] Agent API call hoạt động
- [ ] Tool calls execute đúng
- [ ] Bot reply hiện trong Stream Chat

### Frontend

- [ ] Button "Tư vấn với AI" hiển thị
- [ ] Click button tạo channel với AI bot
- [ ] Gửi message hiển thị trong chat
- [ ] Bot reply hiển thị trong chat
- [ ] Welcome message hiển thị lần đầu

### Integration

- [ ] Test luồng: Xem lịch bác sĩ
- [ ] Test luồng: Tư vấn sức khỏe
- [ ] Error handling works
- [ ] Typing indicator works
- [ ] Message history preserved

---

## 🚀 Quick Start Commands

```bash
# Backend
cd Be
npm install stream-chat axios
# Copy chatbot module files
npm run dev

# Test
curl -X POST http://localhost:8000/api/chatbot/process \
  -H "Content-Type: application/json" \
  -d '{"message": "Xin chào"}'

# Frontend
cd app
# Code changes
npm run start
```

---

## 📊 Estimated Timeline

| Phase                    | Time          | Status |
| ------------------------ | ------------- | ------ |
| Setup DigitalOcean Agent | 30 min        | ⏳     |
| Create AI Bot User       | 15 min        | ⏳     |
| Backend Implementation   | 2-3 hours     | ⏳     |
| Frontend Integration     | 1-2 hours     | ⏳     |
| Testing                  | 1 hour        | ⏳     |
| **Total**                | **4-6 hours** | ⏳     |

---

## 💡 Next Steps

1. ✅ Follow CHATBOT_QUICK_START.md để setup DigitalOcean
2. ✅ Tạo AI bot user trong Stream Chat
3. ✅ Implement backend code
4. ✅ Add button trong chat UI
5. ✅ Test end-to-end
6. 🚀 Deploy & monitor

Approach này đơn giản hơn nhiều vì tận dụng Stream Chat infrastructure có sẵn! 🎉
