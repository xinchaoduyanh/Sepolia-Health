# 🚀 Quick Start Guide - DigitalOcean AgentPlatform Chatbot

## Bắt đầu trong 30 phút

### Bước 1: Setup DigitalOcean Account (5 phút)

1. **Đăng ký/Đăng nhập**: https://cloud.digitalocean.com
2. **Tạo Personal Access Token**:
   - Vào API → Tokens/Keys
   - Generate New Token
   - Name: "Sepolia-Health-Chatbot"
   - Permissions: Read & Write
   - Copy token (chỉ hiện 1 lần!)

3. **Access AgentPlatform**:
   - Navigate to AI/ML → AgentPlatform
   - Create New Project: "Sepolia-Health-Assistant"

### Bước 2: Cài đặt Dependencies (5 phút)

#### Backend:

```bash
cd Be
npm install @digitalocean/agent-platform-sdk
npm install dotenv axios
```

#### Frontend:

```bash
cd app
npm install axios
```

### Bước 3: Configure Environment Variables (3 phút)

#### Be/.env

```env
# Existing variables...
DATABASE_URL="postgresql://..."

# New: DigitalOcean AgentPlatform
DIGITALOCEAN_API_TOKEN="dop_v1_xxxxxxxxxxxxx"
DIGITALOCEAN_AGENT_ID="agent_xxxxxxxxxxxxx"
DIGITALOCEAN_PROJECT_ID="proj_xxxxxxxxxxxxx"

# Agent Configuration
AGENT_MODEL="gpt-4"
AGENT_TEMPERATURE="0.7"
AGENT_MAX_TOKENS="2000"
```

#### app/.env

```env
EXPO_PUBLIC_API_URL=http://localhost:8000/api
EXPO_PUBLIC_CHATBOT_ENABLED=true
```

### Bước 4: Create Agent trong DigitalOcean Console (10 phút)

1. **Go to AgentPlatform Console**
2. **Create New Agent**:

   ```
   Name: Sepolia Health Assistant
   Description: Medical appointment and health advice chatbot
   Model: GPT-4 (hoặc available model)
   Temperature: 0.7
   Max Tokens: 2000
   ```

3. **Add System Prompt**:

   ```
   Bạn là trợ lý ảo y tế của Sepolia Health.

   Khả năng:
   - Tra cứu lịch bác sĩ
   - Gợi ý sức khỏe
   - Hướng dẫn đặt lịch

   Nguyên tắc:
   - Lịch sự, chuyên nghiệp
   - Không chẩn đoán trực tiếp
   - Khuyến khích đặt lịch khám khi cần
   - Sử dụng tiếng Việt
   ```

4. **Define Tools** (Chi tiết trong implementation plan)

5. **Copy Agent ID** và cập nhật vào `.env`

### Bước 5: Test Connection (5 phút)

Tạo file test:

#### Be/src/test-agent.ts

```typescript
import axios from "axios";
import * as dotenv from "dotenv";

dotenv.config();

async function testAgentConnection() {
  try {
    const response = await axios.post(
      `https://api.digitalocean.com/v2/ai/agents/${process.env.DIGITALOCEAN_AGENT_ID}/chat`,
      {
        messages: [{ role: "user", content: "Xin chào!" }],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.DIGITALOCEAN_API_TOKEN}`,
          "Content-Type": "application/json",
        },
      },
    );

    console.log("✅ Agent connection successful!");
    console.log("Response:", response.data);
  } catch (error) {
    console.error("❌ Agent connection failed:", error.message);
  }
}

testAgentConnection();
```

Chạy test:

```bash
cd Be
npx ts-node src/test-agent.ts
```

---

## 📋 Checklist Hoàn thành Setup

- [ ] DigitalOcean account created
- [ ] Personal Access Token generated
- [ ] AgentPlatform project created
- [ ] Agent created với system prompt
- [ ] Dependencies installed
- [ ] Environment variables configured
- [ ] Test connection successful

---

## 🎯 Next Actions

Sau khi hoàn thành Quick Start:

1. **Đọc kỹ**: `CHATBOT_IMPLEMENTATION_PLAN.md`
2. **Bắt đầu Phase 2**: Backend API Development
3. **Tạo module**: `Be/src/module/chatbot/`
4. **Implement tools**: Doctor schedule & Health advice

---

## 🆘 Troubleshooting

### Issue: "401 Unauthorized"

- ✅ Kiểm tra API token có đúng không
- ✅ Token có quyền Read & Write không
- ✅ Token đã expire chưa

### Issue: "Agent not found"

- ✅ Kiểm tra AGENT_ID trong .env
- ✅ Agent có active không
- ✅ Project ID có đúng không

### Issue: "Rate limit exceeded"

- ✅ Implement caching
- ✅ Add delays between requests
- ✅ Upgrade plan nếu cần

---

## 📚 Resources

- [AgentPlatform Docs](https://docs.digitalocean.com/products/ai/agent-platform/)
- [API Reference](https://docs.digitalocean.com/reference/api/agent-platform/)
- [Example Apps](https://github.com/digitalocean/agent-examples)
- [Community Forum](https://www.digitalocean.com/community)

---

## 💡 Pro Tips

1. **Start Simple**: Test với basic chat trước khi add tools
2. **Log Everything**: Debug dễ hơn với detailed logs
3. **Handle Errors**: Agent có thể fail, cần fallback
4. **Monitor Costs**: Check usage dashboard regularly
5. **Iterate Fast**: Deploy small changes, test, improve

---

Chúc bạn implementation thành công! 🎉
