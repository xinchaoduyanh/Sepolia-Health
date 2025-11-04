'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Image,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/lib/hooks/useAuth';
import * as ImagePicker from 'expo-image-picker';
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import { useNavigation } from '@react-navigation/native';

// Types for chat messages
interface ChatMessage {
  id: string;
  text: string;
  timestamp: Date;
  isUser: boolean;
  avatar?: string;
  type?: 'text' | 'image' | 'voice';
  mediaUrl?: string;
  duration?: number; // for voice messages
  reactions?: { [emoji: string]: string[] }; // emoji -> userIds
  threadCount?: number; // number of replies in thread
  parentMessageId?: string; // for thread replies
  readBy?: string[]; // userIds who read this message
}

// Sample initial messages based on channel
const getInitialMessages = (channelId?: string): ChatMessage[] => {
  const baseMessage: ChatMessage = {
    id: '1',
    text: 'Xin chào! Tôi là trợ lý y tế tổng quát của Sepolia Health.',
    timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
    isUser: false,
  };

  let text = '';

  switch (channelId) {
    case 'general':
      text =
        'Xin chào! Tôi là trợ lý y tế tổng quát của Sepolia Health. Tôi có thể giúp bạn tư vấn về sức khỏe, phòng ngừa bệnh tật và chăm sóc bản thân. Bạn cần hỗ trợ gì hôm nay?';
      break;
    case 'specialist':
      text =
        'Xin chào! Tôi sẽ kết nối bạn với bác sĩ chuyên khoa. Vui lòng cho tôi biết triệu chứng hoặc vấn đề sức khỏe bạn đang gặp phải để được tư vấn chuyên sâu.';
      break;
    case 'emergency':
      text =
        'Xin chào! Đây là kênh tư vấn cấp cứu. Nếu bạn đang gặp vấn đề sức khỏe khẩn cấp, vui lòng gọi 115 hoặc đến cơ sở y tế gần nhất. Bạn đang gặp vấn đề gì?';
      break;
    case 'nutrition':
      text =
        'Xin chào! Tôi là chuyên gia tư vấn dinh dưỡng của Sepolia Health. Tôi có thể giúp bạn về chế độ ăn uống, dinh dưỡng hợp lý và lời khuyên sức khỏe. Bạn muốn tư vấn về vấn đề gì?';
      break;
    case 'pharmacy':
      text =
        'Xin chào! Tôi là dược sĩ tư vấn của Sepolia Health. Tôi có thể giúp bạn về thông tin thuốc, tác dụng phụ và cách sử dụng. Bạn có câu hỏi gì về thuốc không?';
      break;
    default:
      text =
        'Xin chào! Tôi là trợ lý y tế ảo của Sepolia Health. Tôi có thể giúp bạn tư vấn về sức khỏe, đặt lịch khám, hoặc trả lời các câu hỏi về dịch vụ y tế. Bạn cần hỗ trợ gì hôm nay?';
  }

  return [{ ...baseMessage, text }];
};

export default function ConsultationChat() {
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const channelId = params.channelId as string;
  const channelTitle = params.channelTitle as string;
  const navigation = useNavigation();

  const [messages, setMessages] = useState<ChatMessage[]>(getInitialMessages(channelId));
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isPlaying, setIsPlaying] = useState<{ [key: string]: boolean }>({});

  const flatListRef = useRef<FlatList>(null);
  const recordingIntervalRef = useRef<number | null>(null);
  const soundRefs = useRef<{ [key: string]: Audio.Sound }>({});

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // Hide tab bar when in chat
  useEffect(() => {
    const parentNavigation = navigation.getParent();
    if (parentNavigation) {
      parentNavigation.setOptions({
        tabBarStyle: { display: 'none' },
      });
    }

    return () => {
      // Show tab bar when leaving chat
      if (parentNavigation) {
        parentNavigation.setOptions({
          tabBarStyle: {
            backgroundColor: '#F0FDFA',
            borderTopWidth: 1,
            borderTopColor: '#E0F2FE',
            paddingBottom: 5,
            paddingTop: 5,
            height: 70,
          },
        });
      }
    };
  }, [navigation]);

  // Initialize audio
  useEffect(() => {
    Audio.requestPermissionsAsync();
    Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      interruptionModeIOS: InterruptionModeIOS.DoNotMix,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
      playThroughEarpieceAndroid: false,
    });
  }, []);

  // Voice recording functions
  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Cần quyền truy cập', 'Vui lòng cho phép ứng dụng truy cập microphone');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(recording);
      setIsRecording(true);
      setRecordingTime(0);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    setIsRecording(false);
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();

      if (uri) {
        const primaryProfile = user?.patientProfiles?.find(
          (profile) => profile.relationship === 'SELF'
        );
        const userMessage: ChatMessage = {
          id: Date.now().toString(),
          text: `🎵 Tin nhắn thoại (${recordingTime}s)`,
          timestamp: new Date(),
          isUser: true,
          avatar: primaryProfile?.avatar,
          type: 'voice',
          mediaUrl: uri,
          duration: recordingTime,
        };

        setMessages((prev) => [...prev, userMessage]);
      }
    } catch (error) {
      console.error('Failed to stop recording', error);
    }

    setRecording(null);
    setRecordingTime(0);
  };

  // Image picker
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Cần quyền truy cập', 'Vui lòng cho phép ứng dụng truy cập thư viện ảnh');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      // TODO: Handle selected image
      Alert.alert('Thông báo', 'Tính năng gửi ảnh sẽ được cập nhật sớm!');
    }
  };

  // Play voice message
  const playVoiceMessage = async (messageId: string, mediaUrl: string) => {
    try {
      if (isPlaying[messageId]) {
        // Stop playing
        if (soundRefs.current[messageId]) {
          await soundRefs.current[messageId].stopAsync();
          await soundRefs.current[messageId].unloadAsync();
          delete soundRefs.current[messageId];
        }
        setIsPlaying((prev) => ({ ...prev, [messageId]: false }));
      } else {
        // Start playing
        const { sound } = await Audio.Sound.createAsync({ uri: mediaUrl });
        soundRefs.current[messageId] = sound;

        sound.setOnPlaybackStatusUpdate((status: any) => {
          if (
            status.isLoaded &&
            !status.isPlaying &&
            status.positionMillis >= status.durationMillis!
          ) {
            setIsPlaying((prev) => ({ ...prev, [messageId]: false }));
          }
        });

        await sound.playAsync();
        setIsPlaying((prev) => ({ ...prev, [messageId]: true }));
      }
    } catch (error) {
      console.error('Failed to play voice message', error);
    }
  };

  // Add reaction to message
  const addReaction = (messageId: string, emoji: string) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === messageId) {
          const reactions = msg.reactions || {};
          const userId = user?.id?.toString() || 'user';

          if (reactions[emoji]?.includes(userId)) {
            // Remove reaction
            reactions[emoji] = reactions[emoji].filter((id) => id !== userId);
            if (reactions[emoji].length === 0) {
              delete reactions[emoji];
            }
          } else {
            // Add reaction
            if (!reactions[emoji]) {
              reactions[emoji] = [];
            }
            reactions[emoji].push(userId);
          }

          return { ...msg, reactions };
        }
        return msg;
      })
    );
    setSelectedMessageId(null);
    setShowEmojiPicker(false);
  };

  // Reply to message (thread)
  const replyToMessage = (messageId: string) => {
    const message = messages.find((m) => m.id === messageId);
    if (message) {
      setInputText(`@${message.isUser ? 'Bạn' : 'Hệ thống'}: `);
      setSelectedMessageId(null);
    }
  };

  const sendMessage = () => {
    if (inputText.trim() === '') return;

    const primaryProfile = user?.patientProfiles?.find(
      (profile) => profile.relationship === 'SELF'
    );
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputText.trim(),
      timestamp: new Date(),
      isUser: true,
      avatar: primaryProfile?.avatar,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');

    // Simulate bot response after a short delay
    setTimeout(() => {
      const botResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: getBotResponse(inputText.trim()),
        timestamp: new Date(),
        isUser: false,
      };
      setMessages((prev) => [...prev, botResponse]);
    }, 1000);
  };

  const getBotResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase();

    // General responses for all channels
    if (message.includes('đặt lịch') || message.includes('khám')) {
      return 'Tôi có thể giúp bạn đặt lịch khám. Bạn muốn khám chuyên khoa nào? Nội khoa, ngoại khoa, hay các chuyên khoa khác?';
    }

    if (message.includes('thời gian') || message.includes('giờ')) {
      return 'Phòng khám Sepolia Health hoạt động từ 7:00 - 17:00 các ngày trong tuần. Bạn có thể đặt lịch qua ứng dụng hoặc gọi hotline 1900-xxxx.';
    }

    if (message.includes('giá') || message.includes('phí') || message.includes('tiền')) {
      return 'Chi phí khám phụ thuộc vào chuyên khoa và dịch vụ. Giá khám cơ bản từ 300.000đ. Bạn có thể xem chi tiết giá cả trong phần "Dịch vụ" của ứng dụng.';
    }

    // Channel-specific responses
    switch (channelId) {
      case 'general':
        if (
          message.includes('đau đầu') ||
          message.includes('đau bụng') ||
          message.includes('sốt')
        ) {
          return 'Tôi hiểu bạn đang gặp vấn đề sức khỏe. Để tư vấn chính xác hơn, bạn có thể cho tôi biết: triệu chứng xuất hiện khi nào, mức độ đau như thế nào, và có kèm theo triệu chứng nào khác không?';
        }
        if (message.includes('phòng ngừa') || message.includes('ngừa bệnh')) {
          return 'Để phòng ngừa bệnh tật hiệu quả, bạn nên: ăn uống cân bằng, tập thể dục đều đặn, ngủ đủ giấc, và khám sức khỏe định kỳ 6 tháng/lần. Bạn muốn tư vấn cụ thể về vấn đề nào?';
        }
        return 'Tôi có thể tư vấn về các vấn đề sức khỏe tổng quát. Bạn đang gặp vấn đề gì hoặc muốn biết thông tin về chủ đề nào?';

      case 'specialist':
        return 'Để kết nối bạn với bác sĩ chuyên khoa phù hợp, vui lòng cho tôi biết: bạn gặp triệu chứng gì, đã kéo dài bao lâu, và muốn tư vấn chuyên khoa nào?';

      case 'emergency':
        return 'Đây là kênh cấp cứu. Nếu tình trạng khẩn cấp, vui lòng gọi 115 ngay lập tức hoặc đến bệnh viện gần nhất. Bạn có thể mô tả tình trạng hiện tại để tôi hướng dẫn bước đầu?';

      case 'nutrition':
        if (message.includes('giảm cân') || message.includes('tăng cân')) {
          return 'Để có chế độ ăn uống hợp lý cho mục tiêu của bạn, tôi cần biết: tuổi, chiều cao, cân nặng hiện tại, mức độ hoạt động thể lực, và có bệnh lý nền nào không?';
        }
        if (message.includes('ăn kiêng') || message.includes('chế độ ăn')) {
          return 'Chế độ ăn kiêng hiệu quả cần cá nhân hóa. Bạn muốn giảm cân, tăng cơ, hay duy trì sức khỏe? Hãy cho tôi biết thông tin cá nhân để tư vấn phù hợp.';
        }
        return 'Tôi có thể tư vấn về dinh dưỡng, chế độ ăn uống, và lời khuyên sức khỏe. Bạn quan tâm đến vấn đề gì cụ thể?';

      case 'pharmacy':
        if (message.includes('thuốc') || message.includes('uống thuốc')) {
          return 'Để tư vấn về thuốc an toàn, bạn nên cho tôi biết: tên thuốc, liều lượng, cách dùng, và có đang dùng thuốc nào khác không?';
        }
        if (message.includes('tác dụng phụ') || message.includes('phản ứng')) {
          return 'Nếu bạn gặp tác dụng phụ của thuốc, hãy cho tôi biết: triệu chứng gì, dùng thuốc gì, và đã dùng bao lâu? Tôi sẽ tư vấn bước tiếp theo.';
        }
        return 'Tôi có thể tư vấn về thông tin thuốc, cách sử dụng, và tương tác thuốc. Bạn muốn hỏi về thuốc nào?';

      default:
        return 'Cảm ơn bạn đã liên hệ. Tôi sẽ chuyển câu hỏi của bạn đến đội ngũ y tế để được hỗ trợ chi tiết hơn. Bạn có thể cung cấp thêm thông tin để tôi hỗ trợ tốt hơn không?';
    }
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.isUser;

    return (
      <TouchableOpacity
        onLongPress={() => setSelectedMessageId(selectedMessageId === item.id ? null : item.id)}
        style={{
          flexDirection: isUser ? 'row-reverse' : 'row',
          marginVertical: 4,
          marginHorizontal: 16,
          alignItems: 'flex-end',
        }}
        activeOpacity={0.9}>
        {/* Avatar */}
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: isUser ? '#0284C7' : '#10B981',
            alignItems: 'center',
            justifyContent: 'center',
            marginHorizontal: 8,
            marginBottom: 4,
          }}>
          {isUser ? (
            item.avatar ? (
              <Image
                source={{ uri: item.avatar }}
                style={{ width: 32, height: 32, borderRadius: 16 }}
              />
            ) : (
              <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 14 }}>
                {user?.firstName?.charAt(0) || 'U'}
              </Text>
            )
          ) : (
            <Ionicons name="medical" size={16} color="white" />
          )}
        </View>

        <View style={{ maxWidth: '70%', alignItems: isUser ? 'flex-end' : 'flex-start' }}>
          {/* Message bubble */}
          <View
            style={{
              backgroundColor: isUser ? '#0284C7' : '#F1F5F9',
              borderRadius: 18,
              paddingHorizontal: 16,
              paddingVertical: 12,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
              elevation: 2,
            }}>
            {/* Voice message */}
            {item.type === 'voice' && item.mediaUrl ? (
              <TouchableOpacity
                onPress={() => playVoiceMessage(item.id, item.mediaUrl!)}
                style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons
                  name={isPlaying[item.id] ? 'pause' : 'play'}
                  size={20}
                  color={isUser ? 'white' : '#0284C7'}
                  style={{ marginRight: 8 }}
                />
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 14,
                      color: isUser ? 'white' : '#0F172A',
                    }}>
                    🎵 Tin nhắn thoại
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color: isUser ? 'rgba(255,255,255,0.7)' : '#64748B',
                    }}>
                    {item.duration}s
                  </Text>
                </View>
              </TouchableOpacity>
            ) : (
              /* Text message */
              <Text
                style={{
                  fontSize: 16,
                  color: isUser ? 'white' : '#0F172A',
                  lineHeight: 22,
                }}>
                {item.text}
              </Text>
            )}

            <Text
              style={{
                fontSize: 12,
                color: isUser ? 'rgba(255,255,255,0.7)' : '#64748B',
                marginTop: 4,
                alignSelf: isUser ? 'flex-start' : 'flex-end',
              }}>
              {formatTime(item.timestamp)}
            </Text>
          </View>

          {/* Reactions */}
          {item.reactions && Object.keys(item.reactions).length > 0 && (
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                marginTop: 4,
                marginHorizontal: isUser ? 0 : 8,
              }}>
              {Object.entries(item.reactions).map(([emoji, users]) => (
                <TouchableOpacity
                  key={emoji}
                  onPress={() => addReaction(item.id, emoji)}
                  style={{
                    backgroundColor: 'rgba(0,0,0,0.05)',
                    borderRadius: 12,
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    marginRight: 4,
                    marginBottom: 2,
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}>
                  <Text style={{ fontSize: 14, marginRight: 4 }}>{emoji}</Text>
                  <Text style={{ fontSize: 12, color: '#64748B' }}>{users.length}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Context menu */}
          {selectedMessageId === item.id && (
            <View
              style={{
                backgroundColor: 'white',
                borderRadius: 12,
                padding: 8,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 8,
                elevation: 5,
                marginTop: 8,
                flexDirection: 'row',
              }}>
              <TouchableOpacity
                onPress={() => {
                  setShowEmojiPicker(true);
                  setSelectedMessageId(item.id);
                }}
                style={{
                  padding: 8,
                  alignItems: 'center',
                  marginRight: 8,
                }}>
                <Text style={{ fontSize: 20 }}>😊</Text>
                <Text style={{ fontSize: 10, color: '#64748B', marginTop: 2 }}>Cảm xúc</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => replyToMessage(item.id)}
                style={{
                  padding: 8,
                  alignItems: 'center',
                }}>
                <Ionicons name="return-up-back" size={20} color="#0284C7" />
                <Text style={{ fontSize: 10, color: '#64748B', marginTop: 2 }}>Trả lời</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Emoji picker data
  const emojis = ['😊', '❤️', '👍', '👎', '😂', '😢', '😮', '🙏', '🔥', '💯'];

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <StatusBar barStyle="light-content" backgroundColor="#0284C7" />

      {/* Emoji Picker Modal */}
      <Modal
        visible={showEmojiPicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowEmojiPicker(false)}>
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          activeOpacity={1}
          onPress={() => setShowEmojiPicker(false)}>
          <TouchableOpacity
            style={{
              backgroundColor: 'white',
              borderRadius: 20,
              padding: 20,
              width: '80%',
              maxWidth: 300,
            }}
            activeOpacity={1}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: 'bold',
                textAlign: 'center',
                marginBottom: 16,
                color: '#0F172A',
              }}>
              Chọn cảm xúc
            </Text>
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                justifyContent: 'center',
              }}>
              {emojis.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  onPress={() => {
                    if (selectedMessageId) {
                      addReaction(selectedMessageId, emoji);
                    }
                  }}
                  style={{
                    width: 50,
                    height: 50,
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: 4,
                    borderRadius: 25,
                    backgroundColor: '#F8FAFC',
                  }}>
                  <Text style={{ fontSize: 24 }}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Header Gradient */}
      <LinearGradient
        colors={['#0284C7', '#06B6D4']}
        style={{
          paddingTop: 60,
          paddingBottom: 20,
          paddingHorizontal: 20,
          borderBottomLeftRadius: 20,
          borderBottomRightRadius: 20,
        }}>
        <View
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: 'rgba(255,255,255,0.2)',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>

          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: 'white', marginBottom: 2 }}>
              {channelTitle || 'Tư vấn y tế'}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: '#10B981',
                  marginRight: 6,
                }}
              />
              <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>Trực tuyến</Text>
            </View>
          </View>

          <TouchableOpacity
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: 'rgba(255,255,255,0.2)',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Ionicons name="search" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        style={{ flex: 1, paddingTop: 16 }}
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      />

      {/* Message Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        <View
          style={{
            backgroundColor: 'white',
            borderTopWidth: 1,
            borderTopColor: '#E2E8F0',
            paddingHorizontal: 16,
            paddingVertical: 12,
            paddingBottom: Platform.OS === 'ios' ? 34 : 12,
          }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#F8FAFC',
              borderRadius: 24,
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderWidth: 1,
              borderColor: '#E2E8F0',
            }}>
            {/* Image button */}
            <TouchableOpacity onPress={pickImage} style={{ marginRight: 12 }}>
              <Ionicons name="image" size={24} color="#64748B" />
            </TouchableOpacity>

            <TextInput
              style={{
                flex: 1,
                fontSize: 16,
                color: '#0F172A',
                paddingVertical: 8,
                maxHeight: 100,
              }}
              placeholder="Nhập tin nhắn của bạn..."
              placeholderTextColor="#64748B"
              value={inputText}
              onChangeText={setInputText}
              multiline
              returnKeyType="send"
              onSubmitEditing={sendMessage}
            />

            {/* Voice recording button */}
            <TouchableOpacity
              onPress={isRecording ? stopRecording : startRecording}
              style={{
                marginLeft: 8,
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: isRecording ? '#EF4444' : '#10B981',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Ionicons name={isRecording ? 'stop' : 'mic'} size={16} color="white" />
            </TouchableOpacity>

            {/* Emoji button */}
            <TouchableOpacity
              onPress={() => setShowEmojiPicker(true)}
              style={{
                marginLeft: 8,
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: '#F59E0B',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Text style={{ fontSize: 16 }}>😊</Text>
            </TouchableOpacity>

            {/* Send button */}
            <TouchableOpacity
              onPress={sendMessage}
              disabled={!inputText.trim()}
              style={{
                marginLeft: 8,
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: inputText.trim() ? '#0284C7' : '#CBD5E1',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Ionicons name="send" size={16} color={inputText.trim() ? 'white' : '#94A3B8'} />
            </TouchableOpacity>
          </View>

          {/* Recording indicator */}
          {isRecording && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 8,
                padding: 8,
                backgroundColor: '#FEE2E2',
                borderRadius: 16,
              }}>
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: '#EF4444',
                  marginRight: 8,
                }}
              />
              <Text
                style={{
                  fontSize: 14,
                  color: '#DC2626',
                  fontWeight: '600',
                }}>
                Đang ghi âm... {recordingTime}s
              </Text>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
