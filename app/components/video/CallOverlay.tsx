import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, SafeAreaView } from 'react-native';
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
        <SafeAreaView style={styles.container}>
          <View style={styles.incomingCallContainer}>
            <View style={styles.incomingCallContent}>
              {/* Caller Avatar */}
              <View style={styles.incomingAvatarContainer}>
                {incomingCall.callerImage ? (
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarText}>
                      {incomingCall.callerName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                ) : (
                  <Ionicons name="person-circle" size={120} color="#2563EB" />
                )}
              </View>

              {/* Caller Name */}
              <Text style={styles.incomingCallerName}>{incomingCall.callerName}</Text>

              {/* Call Type */}
              <View
                style={[
                  styles.incomingCallTypeBadge,
                  { backgroundColor: incomingCall.callType === 'video' ? '#059669' : '#2563EB' },
                ]}>
                <Ionicons
                  name={incomingCall.callType === 'video' ? 'videocam' : 'call'}
                  size={16}
                  color="white"
                />
                <Text style={styles.incomingCallTypeText}>
                  {incomingCall.callType === 'video' ? 'Video Call' : 'Audio Call'}
                </Text>
              </View>

              <Text style={styles.incomingStatusText}>Incoming call...</Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.incomingActionsContainer}>
              {/* Reject Button */}
              <TouchableOpacity onPress={rejectCall} style={styles.rejectButtonContainer}>
                <View style={styles.rejectButtonCircle}>
                  <Ionicons name="close" size={32} color="white" />
                </View>
                <Text style={styles.actionButtonText}>Decline</Text>
              </TouchableOpacity>

              {/* Accept Button */}
              <TouchableOpacity
                onPress={() => acceptCall(incomingCall.callId)}
                style={styles.acceptButtonContainer}>
                <View style={styles.acceptButtonCircle}>
                  <Ionicons name="call" size={32} color="white" />
                </View>
                <Text style={styles.actionButtonText}>Accept</Text>
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
        <SafeAreaView style={styles.container}>
          <View style={styles.ringingContainer}>
            <View style={styles.ringingContent}>
              <View style={styles.avatarContainer}>
                <Ionicons name="person-circle" size={120} color="#2563EB" />
              </View>
              <Text style={styles.participantName}>Calling...</Text>
              <Text style={styles.statusText}>Waiting for answer</Text>

              {/* Animated ringing indicator */}
              <View style={styles.ringingIndicator}>
                <Ionicons
                  name={callType === 'video' ? 'videocam' : 'call'}
                  size={24}
                  color="#2563EB"
                />
              </View>
            </View>

            {/* Cancel Button */}
            <View style={styles.bottomOverlay}>
              <TouchableOpacity onPress={endCall} style={styles.endCallButton}>
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
      <SafeAreaView style={styles.container}>
        <StreamCall call={currentCall}>
          <CallContentWrapper callType={callType} />

          {/* Call Info Overlay */}
          <View style={styles.topOverlay}>
            <View style={styles.callInfo}>
              <View
                style={[
                  styles.callTypeBadge,
                  { backgroundColor: callType === 'video' ? '#059669' : '#2563EB' },
                ]}>
                <Ionicons
                  name={callType === 'video' ? 'videocam' : 'call'}
                  size={16}
                  color="white"
                />
                <Text style={styles.callTypeText}>
                  {callType === 'video' ? 'Video Call' : 'Audio Call'}
                </Text>
              </View>
              <Text style={styles.duration}>{formatDuration(callDuration)}</Text>
            </View>
          </View>

          {/* Call Controls */}
          <View style={styles.bottomOverlay}>
            <View style={styles.controlsContainer}>
              {/* Mic Toggle */}
              <TouchableOpacity
                onPress={toggleMic}
                style={[styles.controlButton, !isMicOn && styles.controlButtonDisabled]}>
                <Ionicons name={isMicOn ? 'mic' : 'mic-off'} size={28} color="white" />
              </TouchableOpacity>

              {/* End Call */}
              <TouchableOpacity onPress={endCall} style={styles.endCallButton}>
                <Ionicons name="call" size={32} color="white" />
              </TouchableOpacity>

              {/* Camera Toggle (only for video calls) */}
              {callType === 'video' && (
                <TouchableOpacity
                  onPress={toggleCamera}
                  style={[styles.controlButton, !isCameraOn && styles.controlButtonDisabled]}>
                  <Ionicons
                    name={isCameraOn ? 'videocam' : 'videocam-off'}
                    size={28}
                    color="white"
                  />
                </TouchableOpacity>
              )}

              {/* Placeholder for audio calls to keep layout centered */}
              {callType === 'audio' && <View style={styles.controlButton} />}
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
      <View style={styles.audioCallContainer}>
        <View style={styles.audioCallContent}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person-circle" size={120} color="#2563EB" />
          </View>
          <Text style={styles.participantName}>
            {participants.length > 0 ? participants[0].name : 'Calling...'}
          </Text>
          <Text style={styles.statusText}>
            {participants.length > 1 ? 'Connected' : 'Connecting...'}
          </Text>
        </View>
      </View>
    );
  }

  // Video call UI
  return <CallContent />;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1F2937',
  },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 10,
  },
  callInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  callTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  callTypeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  duration: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 10,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 30,
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonDisabled: {
    backgroundColor: 'rgba(239, 68, 68, 0.8)',
  },
  endCallButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '135deg' }],
  },
  audioCallContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1F2937',
  },
  audioCallContent: {
    alignItems: 'center',
    gap: 20,
  },
  avatarContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(37, 99, 235, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  participantName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  statusText: {
    fontSize: 16,
    color: '#94A3B8',
  },
  // Incoming call styles
  incomingCallContainer: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 60,
  },
  incomingCallContent: {
    alignItems: 'center',
    gap: 20,
  },
  incomingAvatarContainer: {
    marginBottom: 20,
  },
  avatarCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'white',
  },
  incomingCallerName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  incomingCallTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  incomingCallTypeText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  incomingStatusText: {
    fontSize: 18,
    color: '#94A3B8',
    marginTop: 10,
  },
  incomingActionsContainer: {
    flexDirection: 'row',
    gap: 50,
    paddingHorizontal: 40,
  },
  rejectButtonContainer: {
    alignItems: 'center',
    gap: 10,
  },
  rejectButtonCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptButtonContainer: {
    alignItems: 'center',
    gap: 10,
  },
  acceptButtonCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  // Ringing styles
  ringingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringingContent: {
    alignItems: 'center',
    gap: 20,
  },
  ringingIndicator: {
    marginTop: 30,
    padding: 20,
    borderRadius: 50,
    backgroundColor: 'rgba(37, 99, 235, 0.2)',
  },
});
