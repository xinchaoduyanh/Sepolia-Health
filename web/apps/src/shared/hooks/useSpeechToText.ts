import { useCallback, useEffect, useRef, useState } from 'react'

interface UseSpeechToTextReturn {
    transcript: string
    isListening: boolean
    isSupported: boolean
    startListening: () => void
    stopListening: () => void
    resetTranscript: () => void
    error: string | null
}

export function useSpeechToText(): UseSpeechToTextReturn {
    const [transcript, setTranscript] = useState('')
    const [isListening, setIsListening] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const recognitionRef = useRef<any>(null)
    const timeoutRef = useRef<NodeJS.Timeout | null>(null)

    // Check browser support
    const isSupported = typeof window !== 'undefined' && 
        ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)

    // Initialize speech recognition
    useEffect(() => {
        if (!isSupported) return

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        const recognition = new SpeechRecognition()

        recognition.lang = 'vi-VN'
        recognition.continuous = true
        recognition.interimResults = true
        recognition.maxAlternatives = 1

        recognition.onresult = (event: any) => {
            let finalTranscript = ''
            let interimTranscript = ''

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript
                if (event.results[i].isFinal) {
                    finalTranscript += transcript + ' '
                } else {
                    interimTranscript += transcript
                }
            }

            if (finalTranscript) {
                setTranscript(prev => prev + finalTranscript)
            }
        }

        recognition.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error)
            
            switch (event.error) {
                case 'no-speech':
                    setError('Không phát hiện giọng nói. Vui lòng thử lại.')
                    break
                case 'audio-capture':
                    setError('Không tìm thấy microphone. Vui lòng kiểm tra thiết bị.')
                    break
                case 'not-allowed':
                    setError('Vui lòng cấp quyền truy cập microphone.')
                    break
                case 'network':
                    setError('Lỗi kết nối mạng. Vui lòng kiểm tra internet.')
                    break
                default:
                    setError('Đã xảy ra lỗi. Vui lòng thử lại.')
            }
            
            setIsListening(false)
        }

        recognition.onend = () => {
            setIsListening(false)
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
                timeoutRef.current = null
            }
        }

        recognitionRef.current = recognition

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop()
            }
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
        }
    }, [isSupported])

    const startListening = useCallback(() => {
        if (!isSupported || !recognitionRef.current) {
            setError('Trình duyệt không hỗ trợ nhận dạng giọng nói.')
            return
        }

        setError(null)
        setIsListening(true)

        try {
            recognitionRef.current.start()

            // Auto-stop after 30 seconds to prevent timeout
            timeoutRef.current = setTimeout(() => {
                stopListening()
            }, 30000)
        } catch (err) {
            console.error('Error starting recognition:', err)
            setError('Không thể bắt đầu ghi âm. Vui lòng thử lại.')
            setIsListening(false)
        }
    }, [isSupported])

    const stopListening = useCallback(() => {
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop()
        }
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
            timeoutRef.current = null
        }
        setIsListening(false)
    }, [isListening])

    const resetTranscript = useCallback(() => {
        setTranscript('')
        setError(null)
    }, [])

    return {
        transcript,
        isListening,
        isSupported,
        startListening,
        stopListening,
        resetTranscript,
        error,
    }
}
