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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CustomMessageInputProps {
  channel: any;
  replyingTo?: any;
  onCancelReply?: () => void;
}

export const CustomMessageInput = ({
  channel,
  replyingTo,
  onCancelReply,
}: CustomMessageInputProps) => {
  const [messageText, setMessageText] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputHeight = useRef(new Animated.Value(40)).current;

  const sendMessage = async () => {
    if (!messageText.trim() || !channel) return;

    try {
      const messageData: any = {
        text: messageText.trim(),
      };

      // If replying to a message
      if (replyingTo) {
        messageData.parent_id = replyingTo.id;
        messageData.show_in_channel = true;
      }

      await channel.sendMessage(messageData);
      setMessageText('');
      onCancelReply?.();
      Keyboard.dismiss();
    } catch (error) {
      console.error('Error sending message:', error);
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
          style={{
            width: 40,
            height: 40,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 8,
            borderRadius: 20,
            backgroundColor: isFocused ? '#EFF6FF' : '#F1F5F9',
          }}>
          <Ionicons name="add-circle-outline" size={24} color={isFocused ? '#2563EB' : '#64748B'} />
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
            onChangeText={setMessageText}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
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
          disabled={!messageText.trim()}
          style={{
            width: 40,
            height: 40,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 20,
            backgroundColor: messageText.trim() ? '#2563EB' : '#E2E8F0',
            shadowColor: messageText.trim() ? '#2563EB' : 'transparent',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: messageText.trim() ? 3 : 0,
            transform: [{ scale: messageText.trim() ? 1 : 0.95 }],
          }}>
          <Ionicons name="send" size={20} color={messageText.trim() ? '#FFFFFF' : '#94A3B8'} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};
