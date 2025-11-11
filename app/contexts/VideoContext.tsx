import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  StreamVideoClient,
  StreamCall,
  Call,
  CallingState,
} from '@stream-io/video-react-native-sdk';
import { useAuth } from '@/lib/hooks/useAuth';
import { VideoAPI } from '@/lib/api/video';
import { useChatContext } from './ChatContext';
import { getUserProfile } from '@/lib/utils';
import Toast from 'react-native-toast-message';

interface VideoContextType {
  // Client state
  videoClient?: StreamVideoClient;
  isVideoReady: boolean;

  // Call state
  currentCall?: Call;
  isInCall: boolean;
  callType?: 'audio' | 'video';
  callStartTime?: number;

  // Actions
  startAudioCall: (channelId: string) => Promise<void>;
  startVideoCall: (channelId: string) => Promise<void>;
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
  }, [user]);

  // Cleanup when user logs out
  useEffect(() => {
    if (!user && videoClient) {
      console.log('User logged out, disconnecting video...');
      setVideoClient(undefined);
      setIsVideoReady(false);
    }
  }, [user, videoClient]);

  /**
   * Start audio call
   */
  const startAudioCall = async (channelId: string) => {
    if (!videoClient || !isChatReady || !chatClient) {
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

      setCurrentCall(call);
      setIsInCall(true);
      setCallType('audio');
      setCallStartTime(Date.now());
      setIsCameraOn(false);

      console.log('Audio call started:', callId);
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
    if (!videoClient || !isChatReady || !chatClient) {
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

      setCurrentCall(call);
      setIsInCall(true);
      setCallType('video');
      setCallStartTime(Date.now());
      setIsCameraOn(true);

      console.log('Video call started:', callId);
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
        startAudioCall,
        startVideoCall,
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
      startAudioCall: async () => {},
      startVideoCall: async () => {},
      endCall: async () => {},
      toggleMic: () => {},
      toggleCamera: () => {},
      isMicOn: false,
      isCameraOn: false,
    };
  }
  return context;
};
