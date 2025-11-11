# 📱 VIDEO CALL SETUP - Expo Development Build

## 🎯 Mục đích

Hướng dẫn tạo **Development Build** để chạy Video Call trên Expo (không phải Expo Go).

## ⚠️ Quan trọng

**Expo Go không hỗ trợ native modules** (WebRTC). Bạn cần tạo **Development Build** để test video call.

## 📋 Bước 1: Setup EAS Build

### 1.1 Cài đặt EAS CLI

```bash
npm install -g @expo/cli
npx expo install expo-dev-client
```

### 1.2 Đăng nhập Expo

```bash
npx expo login
# Nhập username/password Expo của bạn
```

### 1.3 Khởi tạo EAS project

```bash
cd app
npx eas build:configure
```

## 📋 Bước 2: Cấu hình eas.json

Tạo file `eas.json` trong thư mục `app/`:

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "bundleIdentifier": "com.sepoliahealth.app.dev"
      },
      "android": {
        "package": "com.sepoliahealth.app.dev"
      }
    },
    "production": {
      "ios": {
        "bundleIdentifier": "com.sepoliahealth.app"
      },
      "android": {
        "package": "com.sepoliahealth.app"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

## 📋 Bước 3: Build Development App

### 3.1 Build cho Android

```bash
npx eas build --platform android --profile development
```

### 3.2 Build cho iOS

```bash
npx eas build --platform ios --profile development
```

### 3.3 Download & Install

1. Sau khi build xong, Expo sẽ gửi link download
2. Download APK (Android) hoặc IPA (iOS)
3. Install lên device

## 📋 Bước 4: Chạy Development Build

### 4.1 Khởi động Metro bundler

```bash
cd app
npx expo start --dev-client
```

### 4.2 Mở Development App

1. Mở app đã install (không phải Expo Go)
2. App sẽ tự động connect đến Metro bundler
3. Giờ bạn có thể test video call!

## 🔧 Troubleshooting

### Issue: "EAS command not found"

```bash
npm install -g eas-cli
```

### Issue: Build failed

- Check log lỗi chi tiết
- Đảm bảo có đủ quota EAS (free tier có 30 builds/tháng)

### Issue: App không connect Metro

- Đảm bảo cùng WiFi network
- Restart Metro bundler
- Reinstall development app

## 📱 Test Video Call

Sau khi setup xong:

1. **Mở Chat** → Chọn conversation
2. **Nhấn 📞 hoặc 📹** ở header
3. **Call UI** sẽ hiện (không còn lỗi nữa!)
4. **Test cross-platform**: App ↔ Web

## 💡 Lưu ý

- **Development Build** ≈ Production app nhưng connect Metro bundler
- **Expo Go** = Preview app, không hỗ trợ native modules
- **Production Build** = App release lên store

## 🔗 Links hữu ích

- [Expo Development Builds](https://docs.expo.dev/develop/development-builds/)
- [EAS Build](https://docs.expo.dev/build/introduction/)
- [Stream Video React Native](https://getstream.io/video/docs/react-native/setup/installation/)

---

## 🚀 Sau khi test xong

Nếu video call hoạt động tốt, bạn có thể:

1. **Build Production** để release lên store
2. **Setup Push Notifications** cho incoming calls
3. **Add Screen Sharing**
4. **Optimize Call Quality**

---

**Bạn đã thử build development chưa? Có lỗi gì không? 🤔**
