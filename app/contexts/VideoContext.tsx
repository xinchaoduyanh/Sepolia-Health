import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { StreamVideoClient, Call } from '@stream-io/video-react-native-sdk';
import { useAuth } from '@/lib/hooks/useAuth';
import { VideoAPI } from '@/lib/api/video';
import { useChatContext } from './ChatContext';
import { getUserProfile } from '@/lib/utils';
import Toast from 'react-native-toast-message';

interface IncomingCall {
  callId: string;
  callType: 'audio' | 'video';
  channelId: string;
  callerName: string;
  callerImage?: string;
}

interface VideoContextType {
  // Client state
  videoClient?: StreamVideoClient;
  isVideoReady: boolean;

  // Call state
  currentCall?: Call;
  isInCall: boolean;
  callType?: 'audio' | 'video';
  callStartTime?: number;
  isRinging: boolean; // Is waiting for other person to join
  incomingCall?: IncomingCall; // Incoming call notification

  // Actions
  startAudioCall: (channelId: string) => Promise<void>;
  startVideoCall: (channelId: string) => Promise<void>;
  acceptCall: (callId: string) => Promise<void>;
  rejectCall: () => void;
  endCall: () => Promise<void>;

  // Call controls
  toggleMic: () => void;
  toggleCamera: () => void;
  isMicOn: boolean;
  isCameraOn: boolean;
}

const VideoContext = createContext<VideoContextType | undefined>(undefined);

export const VideoProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const { chatClient, isChatReady } = useChatContext();

  const [videoClient, setVideoClient] = useState<StreamVideoClient>();
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [currentCall, setCurrentCall] = useState<Call>();
  const [isInCall, setIsInCall] = useState(false);
  const [callType, setCallType] = useState<'audio' | 'video'>();
  const [callStartTime, setCallStartTime] = useState<number>();
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isRinging, setIsRinging] = useState(false);
  const [incomingCall, setIncomingCall] = useState<IncomingCall>();

  // Initialize Video Client when user is logged in
  useEffect(() => {
    const initVideoClient = async () => {
      if (!user || videoClient) return;

      try {
        console.log('Initializing Stream Video client...');
        const { token, apiKey, userId } = await VideoAPI.getVideoToken();

        const userProfile = getUserProfile(user);

        const client = new StreamVideoClient({
          apiKey,
          user: {
            id: userId,
            name: userProfile.name,
            image: userProfile.image,
          },
          token,
        });

        setVideoClient(client);
        setIsVideoReady(true);
        console.log('Stream Video client initialized successfully');
      } catch (error) {
        console.error('Failed to initialize video client:', error);
        Toast.show({
          type: 'error',
          text1: 'Lỗi khởi tạo video',
          text2: 'Không thể kết nối đến dịch vụ video call',
        });
      }
    };

    initVideoClient();

    return () => {
      if (videoClient) {
        console.log('Cleaning up video client...');
        // Note: Don't disconnect on unmount during navigation
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Cleanup when user logs out
  useEffect(() => {
    if (!user && videoClient) {
      console.log('User logged out, disconnecting video...');
      setVideoClient(undefined);
      setIsVideoReady(false);
    }
  }, [user, videoClient]);

  // Listen for incoming call messages from chat
  useEffect(() => {
    if (!chatClient || !isChatReady) return;

    const handleMessageEvent = (event: any) => {
      // Only handle call_notification messages
      if (event.type === 'message.new' && event.message?.type === 'call_notification') {
        const callData = event.message.call_data;
        console.log('Incoming call notification:', callData);

        // Don't show notification if this is our own call
        if (callData.callerId === user?.id.toString()) {
          console.log('Ignoring own call notification');
          return;
        }

        setIncomingCall({
          callId: callData.callId,
          callType: callData.callType,
          channelId: callData.channelId,
          callerName: callData.callerName || 'Unknown',
          callerImage: callData.callerImage,
        });
      }
    };

    chatClient.on('message.new', handleMessageEvent);

    return () => {
      chatClient.off('message.new', handleMessageEvent);
    };
  }, [chatClient, isChatReady, user]);

  // Listen to call state changes (when participants join)
  useEffect(() => {
    if (!currentCall || !isRinging) return;

    const subscription = currentCall.state.participants$.subscribe((participants) => {
      console.log('Participants changed:', participants.length);
      // If someone else joined (more than 1 participant), stop ringing
      if (participants.length > 1) {
        console.log('Other participant joined, stopping ringing');
        setIsRinging(false);
        if (!isInCall) {
          setIsInCall(true);
          setCallStartTime(Date.now());
        }
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [currentCall, isRinging, isInCall]);

  /**
   * Start audio call
   */
  const startAudioCall = async (channelId: string) => {
    if (!videoClient || !isChatReady || !chatClient || !user) {
      Toast.show({
        type: 'error',
        text1: 'Không thể thực hiện cuộc gọi',
        text2: 'Vui lòng thử lại sau',
      });
      return;
    }

    try {
      // Generate unique call ID based on channel
      const callId = `audio_${channelId}_${Date.now()}`;

      // Create call
      const call = videoClient.call('default', callId);

      // Join call
      await call.join({
        create: true,
        data: {
          settings_override: {
            audio: {
              mic_default_on: true,
              speaker_default_on: true,
              default_device: 'speaker',
            },
            video: {
              camera_default_on: false,
            },
          },
          custom: {
            channelId,
            callType: 'audio',
          },
        },
      });

      // Send call notification message to channel
      const userProfile = getUserProfile(user);
      const channel = chatClient.channel('messaging', channelId);
      await channel.sendMessage({
        text: `📞 Incoming audio call...`,
        type: 'call_notification',
        call_data: {
          callId,
          callType: 'audio',
          channelId,
          callerId: user.id.toString(),
          callerName: userProfile.name,
          callerImage: userProfile.image,
        },
        silent: true, // Don't send push notification yet
      });

      setCurrentCall(call);
      setIsInCall(false); // Not in call yet, just ringing
      setIsRinging(true); // Start ringing state
      setCallType('audio');
      setIsCameraOn(false);

      console.log('Audio call started and notification sent:', callId);
    } catch (error) {
      console.error('Failed to start audio call:', error);
      Toast.show({
        type: 'error',
        text1: 'Không thể bắt đầu cuộc gọi',
        text2: 'Vui lòng thử lại',
      });
    }
  };

  /**
   * Start video call
   */
  const startVideoCall = async (channelId: string) => {
    if (!videoClient || !isChatReady || !chatClient || !user) {
      Toast.show({
        type: 'error',
        text1: 'Không thể thực hiện cuộc gọi',
        text2: 'Vui lòng thử lại sau',
      });
      return;
    }

    try {
      // Generate unique call ID based on channel
      const callId = `video_${channelId}_${Date.now()}`;

      // Create call
      const call = videoClient.call('default', callId);

      // Join call
      await call.join({
        create: true,
        data: {
          settings_override: {
            audio: {
              mic_default_on: true,
              speaker_default_on: true,
              default_device: 'speaker',
            },
            video: {
              camera_default_on: true,
            },
          },
          custom: {
            channelId,
            callType: 'video',
          },
        },
      });

      // Send call notification message to channel
      const userProfile = getUserProfile(user);
      const channel = chatClient.channel('messaging', channelId);
      await channel.sendMessage({
        text: `📹 Incoming video call...`,
        type: 'call_notification',
        call_data: {
          callId,
          callType: 'video',
          channelId,
          callerId: user.id.toString(),
          callerName: userProfile.name,
          callerImage: userProfile.image,
        },
        silent: true, // Don't send push notification yet
      });

      setCurrentCall(call);
      setIsInCall(false); // Not in call yet, just ringing
      setIsRinging(true); // Start ringing state
      setCallType('video');
      setIsCameraOn(true);

      console.log('Video call started and notification sent:', callId);
    } catch (error) {
      console.error('Failed to start video call:', error);
      Toast.show({
        type: 'error',
        text1: 'Không thể bắt đầu cuộc gọi video',
        text2: 'Vui lòng thử lại',
      });
    }
  };

  /**
   * Accept incoming call
   */
  const acceptCall = async (callId: string) => {
    if (!videoClient || !incomingCall) {
      console.error('Cannot accept call: no video client or incoming call');
      return;
    }

    try {
      console.log('Accepting call:', callId);

      // Join the existing call
      const call = videoClient.call('default', callId);
      await call.join();

      // Update state
      setCurrentCall(call);
      setIsInCall(true);
      setCallType(incomingCall.callType);
      setCallStartTime(Date.now());
      setIsCameraOn(incomingCall.callType === 'video');
      setIncomingCall(undefined); // Clear incoming call notification

      console.log('Call accepted successfully');
    } catch (error) {
      console.error('Failed to accept call:', error);
      Toast.show({
        type: 'error',
        text1: 'Không thể kết nối',
        text2: 'Vui lòng thử lại',
      });
      setIncomingCall(undefined);
    }
  };

  /**
   * Reject incoming call
   */
  const rejectCall = () => {
    console.log('Rejecting call');
    setIncomingCall(undefined);

    Toast.show({
      type: 'info',
      text1: 'Đã từ chối cuộc gọi',
    });
  };

  /**
   * End current call and send summary message to chat
   */
  const endCall = async () => {
    if (!currentCall || !chatClient) return;

    try {
      // Calculate call duration
      const duration = callStartTime ? Date.now() - callStartTime : 0;
      const durationMinutes = Math.floor(duration / 60000);
      const durationSeconds = Math.floor((duration % 60000) / 1000);
      const durationText = `${durationMinutes}:${durationSeconds.toString().padStart(2, '0')}`;

      // Get channel ID from call metadata
      const channelId = currentCall.state.custom?.channelId as string;

      // Leave call first
      await currentCall.leave();

      // Send summary message to chat if we have channel
      if (channelId && chatClient) {
        try {
          const channel = chatClient.channel('messaging', channelId);
          await channel.sendMessage({
            text: `📞 ${callType === 'video' ? 'Video call' : 'Audio call'} • ${durationText}`,
            user_id: user?.id.toString(),
          });
          console.log('Call summary sent to chat');
        } catch (error) {
          console.error('Failed to send call summary:', error);
        }
      }

      // Reset state
      setCurrentCall(undefined);
      setIsInCall(false);
      setIsRinging(false);
      setCallType(undefined);
      setCallStartTime(undefined);
      setIsMicOn(true);
      setIsCameraOn(true);

      console.log('Call ended successfully');
    } catch (error) {
      console.error('Failed to end call:', error);
      Toast.show({
        type: 'error',
        text1: 'Lỗi kết thúc cuộc gọi',
        text2: 'Vui lòng thử lại',
      });
    }
  };

  /**
   * Toggle microphone
   */
  const toggleMic = () => {
    if (!currentCall) return;
    currentCall.microphone.toggle();
    setIsMicOn(!isMicOn);
  };

  /**
   * Toggle camera
   */
  const toggleCamera = () => {
    if (!currentCall || callType !== 'video') return;
    currentCall.camera.toggle();
    setIsCameraOn(!isCameraOn);
  };

  return (
    <VideoContext.Provider
      value={{
        videoClient,
        isVideoReady,
        currentCall,
        isInCall,
        callType,
        callStartTime,
        isRinging,
        incomingCall,
        startAudioCall,
        startVideoCall,
        acceptCall,
        rejectCall,
        endCall,
        toggleMic,
        toggleCamera,
        isMicOn,
        isCameraOn,
      }}>
      {children}
    </VideoContext.Provider>
  );
};

export const useVideoContext = () => {
  const context = useContext(VideoContext);
  if (!context) {
    return {
      videoClient: undefined,
      isVideoReady: false,
      currentCall: undefined,
      isInCall: false,
      callType: undefined,
      callStartTime: undefined,
      isRinging: false,
      incomingCall: undefined,
      startAudioCall: async () => {},
      startVideoCall: async () => {},
      acceptCall: async () => {},
      rejectCall: () => {},
      endCall: async () => {},
      toggleMic: () => {},
      toggleCamera: () => {},
      isMicOn: false,
      isCameraOn: false,
    };
  }
  return context;
};
