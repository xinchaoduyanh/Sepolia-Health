import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Keyboard,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useChannelContext } from 'stream-chat-expo';
import { useChatContext } from '@/contexts/ChatContext';
import { ChatbotAPI } from '@/lib/api/chatbot';
import { useAuth } from '@/lib/hooks/useAuth';

interface CustomMessageInputProps {
  replyingTo?: any;
  onCancelReply?: () => void;
}

export const CustomMessageInput = ({ replyingTo, onCancelReply }: CustomMessageInputProps) => {
  // Get channel from Stream Chat context
  const { channel } = useChannelContext();
  const { isAIChannel } = useChatContext();
  const { user } = useAuth();
  const [messageText, setMessageText] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const inputHeight = useRef(new Animated.Value(40)).current;

  // Kiểm tra xem channel hiện tại có phải là AI channel không
  const isCurrentChannelAI = channel ? isAIChannel(channel) : false;

  // Handle text change
  const handleTextChange = (text: string) => {
    setMessageText(text);
  };

  const sendMessage = async () => {
    if (!messageText.trim() || !channel) return;

    const messageToSend = messageText.trim();
    setMessageText('');
    onCancelReply?.();
    Keyboard.dismiss();

    try {
      // Nếu là AI channel, xử lý đặc biệt
      if (isCurrentChannelAI) {
        setIsProcessingAI(true);

        // 1. Gửi message của user vào channel để lưu lịch sử
        const userMessageData: any = {
          text: messageToSend,
        };

        if (replyingTo) {
          userMessageData.parent_id = replyingTo.id;
          userMessageData.show_in_channel = true;
        }

        await channel.sendMessage(userMessageData);

        // 2. Gọi API chatbot để xử lý và tự động gửi response vào channel
        try {
          // Gọi API với channelId, backend sẽ tự động gửi response vào channel
          await ChatbotAPI.processMessage(messageToSend, user?.id, channel.id);
        } catch {
          // Silently handle AI processing errors - message already sent
          // Backend will handle the response
        } finally {
          setIsProcessingAI(false);
        }
      } else {
        // Nếu không phải AI channel, xử lý bình thường
        const messageData: any = {
          text: messageToSend,
        };

        if (replyingTo) {
          messageData.parent_id = replyingTo.id;
          messageData.show_in_channel = true;
        }

        await channel.sendMessage(messageData);
      }
    } catch {
      // Only show alert for actual send failures, not AI processing
      Alert.alert('Lỗi', 'Không thể gửi tin nhắn. Vui lòng thử lại.');
      setIsProcessingAI(false);
    }
  };

  const handleContentSizeChange = (e: any) => {
    const height = Math.min(Math.max(40, e.nativeEvent.contentSize.height), 100);
    Animated.spring(inputHeight, {
      toValue: height,
      useNativeDriver: false,
      friction: 8,
    }).start();
  };

  const handleAttachment = async () => {
    // Show options for image or video
    Alert.alert(
      'Đính kèm file',
      'Chọn loại file bạn muốn gửi',
      [
        {
          text: 'Ảnh',
          onPress: () => pickImage(),
        },
        {
          text: 'Video',
          onPress: () => pickVideo(),
        },
        {
          text: 'Hủy',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  const pickImage = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Lỗi', 'Cần quyền truy cập thư viện ảnh để gửi ảnh');
        return;
      }

      // Pick image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await uploadAndSendFile(result.assets[0]);
      }
    } catch {
      Alert.alert('Lỗi', 'Không thể chọn ảnh');
    }
  };

  const pickVideo = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Lỗi', 'Cần quyền truy cập thư viện để gửi video');
        return;
      }

      // Pick video
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        allowsEditing: true,
        quality: 0.8,
        videoMaxDuration: 60, // 60 seconds max
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const video = result.assets[0];

        // Check video size (max 50MB for better performance)
        if (video.fileSize && video.fileSize > 50 * 1024 * 1024) {
          Alert.alert('Lỗi', 'Video quá lớn. Vui lòng chọn video nhỏ hơn 50MB');
          return;
        }

        await uploadAndSendFile(video);
      }
    } catch {
      Alert.alert('Lỗi', 'Không thể chọn video');
    }
  };

  const uploadAndSendFile = async (asset: any) => {
    if (!channel) return;

    setIsUploading(true);
    try {
      const isVideo = asset.type === 'video' || asset.mimeType?.includes('video');

      // Ensure URI is a string
      const fileUri = String(asset.uri);
      const fileName =
        asset.fileName || `${isVideo ? 'video' : 'image'}_${Date.now()}.${isVideo ? 'mp4' : 'jpg'}`;
      const fileType = asset.mimeType || (isVideo ? 'video/mp4' : 'image/jpeg');

      // Upload the file first using Stream's upload API
      // For React Native, we need to pass the file URI string
      let uploadResponse;
      if (isVideo) {
        uploadResponse = await channel.sendFile(fileUri, fileName, fileType);
      } else {
        uploadResponse = await channel.sendImage(fileUri, fileName, fileType);
      }

      // Now send message with the uploaded file URL
      const messageData: any = {
        text: messageText.trim() || '',
        attachments: [
          {
            type: isVideo ? 'video' : 'image',
            asset_url: uploadResponse.file, // URL from upload
            thumb_url: uploadResponse.thumb_url, // Thumbnail for videos
            file_size: asset.fileSize,
            mime_type: fileType,
            title: fileName,
          },
        ],
      };

      if (replyingTo) {
        messageData.parent_id = replyingTo.id;
        messageData.show_in_channel = true;
      }

      // Send message with uploaded attachment
      await channel.sendMessage(messageData);

      setMessageText('');
      onCancelReply?.();
    } catch {
      Alert.alert('Lỗi', 'Không thể gửi file. Vui lòng thử lại.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      style={{
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 5,
      }}>
      {/* Reply indicator */}
      {replyingTo && (
        <Animated.View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#EFF6FF',
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: '#DBEAFE',
          }}>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
            <View
              style={{
                width: 3,
                height: '100%',
                backgroundColor: '#2563EB',
                borderRadius: 2,
                marginRight: 12,
              }}
            />
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                <Ionicons name="arrow-undo" size={14} color="#2563EB" />
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#2563EB', marginLeft: 4 }}>
                  Đang trả lời
                </Text>
              </View>
              <Text style={{ fontSize: 13, color: '#64748B' }} numberOfLines={1}>
                {replyingTo.user.name}: {replyingTo.text}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={onCancelReply}
            style={{
              padding: 8,
              marginLeft: 8,
              backgroundColor: '#DBEAFE',
              borderRadius: 20,
            }}>
            <Ionicons name="close" size={16} color="#64748B" />
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Input area */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: '#FFFFFF',
        }}>
        {/* Attachment button */}
        <TouchableOpacity
          onPress={handleAttachment}
          disabled={isUploading}
          style={{
            width: 40,
            height: 40,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 8,
            borderRadius: 20,
            backgroundColor: isUploading ? '#E2E8F0' : isFocused ? '#EFF6FF' : '#F1F5F9',
          }}>
          {isUploading ? (
            <ActivityIndicator size="small" color="#2563EB" />
          ) : (
            <Ionicons
              name="add-circle-outline"
              size={24}
              color={isFocused ? '#2563EB' : '#64748B'}
            />
          )}
        </TouchableOpacity>

        {/* Message input container */}
        <Animated.View
          style={{
            flex: 1,
            minHeight: 40,
            maxHeight: 100,
            borderRadius: 20,
            backgroundColor: '#F8FAFC',
            borderWidth: isFocused ? 2 : 1,
            borderColor: isFocused ? '#2563EB' : '#E2E8F0',
            paddingHorizontal: 16,
            paddingVertical: 10,
            marginRight: 8,
            justifyContent: 'center',
            shadowColor: isFocused ? '#2563EB' : 'transparent',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: isFocused ? 2 : 0,
          }}>
          <TextInput
            value={messageText}
            onChangeText={handleTextChange}
            onFocus={() => {
              setIsFocused(true);
            }}
            onBlur={() => {
              setIsFocused(false);
            }}
            onContentSizeChange={handleContentSizeChange}
            placeholder="Nhập tin nhắn..."
            placeholderTextColor="#94A3B8"
            multiline
            maxLength={1000}
            returnKeyType="default"
            blurOnSubmit={false}
            style={{
              fontSize: 15,
              lineHeight: 20,
              color: '#1F2937',
              paddingVertical: 0,
              minHeight: 20,
              maxHeight: 80,
            }}
          />
        </Animated.View>

        {/* Send button */}
        <TouchableOpacity
          onPress={sendMessage}
          disabled={!messageText.trim() || isProcessingAI}
          style={{
            width: 40,
            height: 40,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 20,
            backgroundColor: messageText.trim() && !isProcessingAI ? '#2563EB' : '#E2E8F0',
            shadowColor: messageText.trim() && !isProcessingAI ? '#2563EB' : 'transparent',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: messageText.trim() && !isProcessingAI ? 3 : 0,
            transform: [{ scale: messageText.trim() && !isProcessingAI ? 1 : 0.95 }],
          }}>
          {isProcessingAI ? (
            <ActivityIndicator size="small" color="#94A3B8" />
          ) : (
            <Ionicons name="send" size={20} color={messageText.trim() ? '#FFFFFF' : '#94A3B8'} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};
