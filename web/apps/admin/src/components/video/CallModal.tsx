'use client'

import { useEffect, useState } from 'react'
import { useVideo } from '@/contexts/VideoContext'
import { useChat } from '@/contexts/ChatContext'
import { Phone, Mic, MicOff, VideoIcon, VideoOff, X } from 'lucide-react'
import { Button } from '@workspace/ui/components/Button'
import { SpeakerLayout, useCallStateHooks, StreamCall } from '@stream-io/video-react-sdk'

export function CallModal() {
    const { currentCall, isInCall, callType, endCall, toggleMic, toggleCamera, isMicOn, isCameraOn } = useVideo()
    const { client: chatClient } = useChat()
    const [callDuration, setCallDuration] = useState(0)

    // Update call duration
    useEffect(() => {
        if (!isInCall) {
            setCallDuration(0)
            return
        }

        const interval = setInterval(() => {
            setCallDuration(prev => prev + 1)
        }, 1000)

        return () => clearInterval(interval)
    }, [isInCall])

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    const handleEndCall = async () => {
        await endCall(true, chatClient)
    }

    if (!currentCall || !isInCall) {
        return null
    }

    return (
        <StreamCall call={currentCall}>
            <div className="fixed inset-0 z-50 bg-gray-900 flex flex-col">
                {/* Call Header */}
                <div className="bg-gray-800 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div
                            className={`px-3 py-1 rounded-full flex items-center gap-2 ${
                                callType === 'video' ? 'bg-green-600' : 'bg-blue-600'
                            }`}
                        >
                            {callType === 'video' ? (
                                <VideoIcon className="h-4 w-4 text-white" />
                            ) : (
                                <Phone className="h-4 w-4 text-white" />
                            )}
                            <span className="text-sm font-medium text-white">
                                {callType === 'video' ? 'Video Call' : 'Audio Call'}
                            </span>
                        </div>
                        <span className="text-white font-medium">{formatDuration(callDuration)}</span>
                    </div>

                    <button
                        onClick={handleEndCall}
                        className="text-gray-400 hover:text-white transition-colors"
                        aria-label="Minimize"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Call Content */}
                <div className="flex-1 relative">
                    {callType === 'video' ? (
                        // Video call UI
                        <SpeakerLayout />
                    ) : (
                        // Audio call UI
                        <AudioCallView />
                    )}
                </div>

                {/* Call Controls */}
                <div className="bg-gray-800 px-6 py-6">
                    <div className="flex items-center justify-center gap-4">
                        {/* Mic Toggle */}
                        <Button
                            onClick={toggleMic}
                            variant={isMicOn ? 'outline' : 'destructive'}
                            size="lg"
                            className="rounded-full w-14 h-14"
                            aria-label={isMicOn ? 'Tắt mic' : 'Bật mic'}
                        >
                            {isMicOn ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
                        </Button>

                        {/* End Call */}
                        <Button
                            onClick={handleEndCall}
                            variant="destructive"
                            size="lg"
                            className="rounded-full w-16 h-16 bg-red-600 hover:bg-red-700"
                            aria-label="Kết thúc"
                        >
                            <Phone className="h-6 w-6 rotate-[135deg]" />
                        </Button>

                        {/* Camera Toggle (only for video calls) */}
                        {callType === 'video' && (
                            <Button
                                onClick={toggleCamera}
                                variant={isCameraOn ? 'outline' : 'destructive'}
                                size="lg"
                                className="rounded-full w-14 h-14"
                                aria-label={isCameraOn ? 'Tắt camera' : 'Bật camera'}
                            >
                                {isCameraOn ? <VideoIcon className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </StreamCall>
    )
}

// Audio-only call view
function AudioCallView() {
    const { useParticipants } = useCallStateHooks()
    const participants = useParticipants()

    return (
        <div className="h-full flex items-center justify-center">
            <div className="text-center">
                <div className="w-32 h-32 rounded-full bg-blue-600 flex items-center justify-center mx-auto mb-6">
                    <Phone className="h-16 w-16 text-white" />
                </div>
                <h3 className="text-2xl font-semibold text-white mb-2">
                    {participants.length > 0 && participants[0]?.name ? participants[0].name : 'Calling...'}
                </h3>
                <p className="text-gray-400">{participants.length > 1 ? 'Connected' : 'Connecting...'}</p>
            </div>
        </div>
    )
}
