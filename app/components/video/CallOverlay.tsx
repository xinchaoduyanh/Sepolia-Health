import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StreamCall, CallContent, useCallStateHooks } from '@stream-io/video-react-native-sdk';
import { useVideoContext } from '@/contexts/VideoContext';

export const CallOverlay = () => {
  const {
    currentCall,
    isInCall,
    callType,
    isRinging,
    incomingCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMic,
    toggleCamera,
    isMicOn,
    isCameraOn,
  } = useVideoContext();
  const [callDuration, setCallDuration] = useState(0);

  // Update call duration every second
  useEffect(() => {
    if (!isInCall) {
      setCallDuration(0);
      return;
    }

    const interval = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isInCall]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Show incoming call UI
  if (incomingCall) {
    return (
      <Modal visible={true} animationType="slide" presentationStyle="fullScreen">
        <SafeAreaView className="flex-1 bg-gray-800">
          <View className="py-15 flex-1 items-center justify-between">
            <View className="items-center gap-5">
              {/* Caller Avatar */}
              <View className="mb-5">
                {incomingCall.callerImage ? (
                  <View className="w-30 h-30 items-center justify-center rounded-full bg-blue-600">
                    <Text className="text-5xl font-bold text-white">
                      {incomingCall.callerName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                ) : (
                  <Ionicons name="person-circle" size={120} color="#2563EB" />
                )}
              </View>

              {/* Caller Name */}
              <Text className="text-3xl font-bold text-white">{incomingCall.callerName}</Text>

              {/* Call Type */}
              <View
                className={`flex-row items-center gap-2 rounded-full px-4 py-2 ${incomingCall.callType === 'video' ? 'bg-green-600' : 'bg-blue-600'}`}>
                <Ionicons
                  name={incomingCall.callType === 'video' ? 'videocam' : 'call'}
                  size={16}
                  color="white"
                />
                <Text className="text-base font-semibold text-white">
                  {incomingCall.callType === 'video' ? 'Video Call' : 'Audio Call'}
                </Text>
              </View>

              <Text className="mt-2.5 text-lg text-slate-400">Incoming call...</Text>
            </View>

            {/* Action Buttons */}
            <View className="flex-row gap-12 px-10">
              {/* Reject Button */}
              <TouchableOpacity onPress={rejectCall} className="items-center gap-2.5">
                <View className="w-17.5 h-17.5 items-center justify-center rounded-full bg-red-500">
                  <Ionicons name="close" size={32} color="white" />
                </View>
                <Text className="text-base font-semibold text-white">Decline</Text>
              </TouchableOpacity>

              {/* Accept Button */}
              <TouchableOpacity
                onPress={() => acceptCall(incomingCall.callId)}
                className="items-center gap-2.5">
                <View className="w-17.5 h-17.5 items-center justify-center rounded-full bg-green-500">
                  <Ionicons name="call" size={32} color="white" />
                </View>
                <Text className="text-base font-semibold text-white">Accept</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    );
  }

  // Show ringing UI (caller waiting)
  if (currentCall && isRinging && !isInCall) {
    return (
      <Modal visible={true} animationType="slide" presentationStyle="fullScreen">
        <SafeAreaView className="flex-1 bg-gray-800">
          <View className="flex-1 items-center justify-center">
            <View className="items-center gap-5">
              <View className="w-35 h-35 mb-2.5 items-center justify-center rounded-full bg-blue-600/20">
                <Ionicons name="person-circle" size={120} color="#2563EB" />
              </View>
              <Text className="text-3xl font-bold text-white">Calling...</Text>
              <Text className="text-base text-slate-400">Waiting for answer</Text>

              {/* Animated ringing indicator */}
              <View className="mt-7.5 rounded-full bg-blue-600/20 p-5">
                <Ionicons
                  name={callType === 'video' ? 'videocam' : 'call'}
                  size={24}
                  color="#2563EB"
                />
              </View>
            </View>

            {/* Cancel Button */}
            <View className="pt-7.5 absolute bottom-0 left-0 right-0 z-10 bg-black/50 px-5 pb-10">
              <TouchableOpacity
                onPress={endCall}
                className="w-17.5 h-17.5 items-center justify-center rounded-full bg-red-500"
                style={{ transform: [{ rotate: '135deg' }] }}>
                <Ionicons name="call" size={32} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    );
  }

  // Show call UI when connected
  if (!currentCall || !isInCall) {
    return null;
  }

  return (
    <Modal visible={isInCall} animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView className="flex-1 bg-gray-800">
        <StreamCall call={currentCall}>
          <CallContentWrapper callType={callType} />

          {/* Call Info Overlay */}
          <View className="absolute left-0 right-0 top-0 z-10 bg-black/50 px-5 pb-5 pt-5">
            <View className="flex-row items-center justify-between">
              <View
                className={`flex-row items-center gap-1.5 rounded-full px-3 py-1.5 ${callType === 'video' ? 'bg-green-600' : 'bg-blue-600'}`}>
                <Ionicons
                  name={callType === 'video' ? 'videocam' : 'call'}
                  size={16}
                  color="white"
                />
                <Text className="text-sm font-semibold text-white">
                  {callType === 'video' ? 'Video Call' : 'Audio Call'}
                </Text>
              </View>
              <Text className="text-base font-semibold text-white">
                {formatDuration(callDuration)}
              </Text>
            </View>
          </View>

          {/* Call Controls */}
          <View className="pt-7.5 absolute bottom-0 left-0 right-0 z-10 bg-black/50 px-5 pb-10">
            <View className="gap-7.5 flex-row items-center justify-center">
              {/* Mic Toggle */}
              <TouchableOpacity
                onPress={toggleMic}
                className={`w-15 h-15 items-center justify-center rounded-full ${!isMicOn ? 'bg-red-500/80' : 'bg-white/30'}`}>
                <Ionicons name={isMicOn ? 'mic' : 'mic-off'} size={28} color="white" />
              </TouchableOpacity>

              {/* End Call */}
              <TouchableOpacity
                onPress={endCall}
                className="w-17.5 h-17.5 items-center justify-center rounded-full bg-red-500"
                style={{ transform: [{ rotate: '135deg' }] }}>
                <Ionicons name="call" size={32} color="white" />
              </TouchableOpacity>

              {/* Camera Toggle (only for video calls) */}
              {callType === 'video' && (
                <TouchableOpacity
                  onPress={toggleCamera}
                  className={`w-15 h-15 items-center justify-center rounded-full ${!isCameraOn ? 'bg-red-500/80' : 'bg-white/30'}`}>
                  <Ionicons
                    name={isCameraOn ? 'videocam' : 'videocam-off'}
                    size={28}
                    color="white"
                  />
                </TouchableOpacity>
              )}

              {/* Placeholder for audio calls to keep layout centered */}
              {callType === 'audio' && <View className="w-15 h-15" />}
            </View>
          </View>
        </StreamCall>
      </SafeAreaView>
    </Modal>
  );
};

// Wrapper for CallContent with proper hooks
const CallContentWrapper = ({ callType }: { callType?: 'audio' | 'video' }) => {
  const { useParticipants } = useCallStateHooks();
  const participants = useParticipants();

  if (callType === 'audio') {
    // Audio-only UI
    return (
      <View className="flex-1 items-center justify-center bg-gray-800">
        <View className="items-center gap-5">
          <View className="w-35 h-35 mb-2.5 items-center justify-center rounded-full bg-blue-600/20">
            <Ionicons name="person-circle" size={120} color="#2563EB" />
          </View>
          <Text className="text-3xl font-bold text-white">
            {participants.length > 0 ? participants[0].name : 'Calling...'}
          </Text>
          <Text className="text-base text-slate-400">
            {participants.length > 1 ? 'Connected' : 'Connecting...'}
          </Text>
        </View>
      </View>
    );
  }

  // Video call UI
  return <CallContent />;
};
