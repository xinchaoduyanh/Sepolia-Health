'use client'

import { useState, useRef, useEffect } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@workspace/ui/components/Avatar'
import { Button } from '@workspace/ui/components/Button'
import { Input } from '@workspace/ui/components/Textfield'
import { ScrollArea } from '@workspace/ui/components/ScrollArea'
import {
    Send,
    X,
    Phone,
    Video,
    MoreVertical,
    Paperclip,
    Camera,
    Mic,
    Play,
    Pause,
    Image,
    Search,
    Smile,
    Reply,
    Eye,
    EyeOff,
} from 'lucide-react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { cn } from '@workspace/ui/lib/utils'

interface Message {
    id: string
    text: string
    userId: string
    userName: string
    avatar?: string
    timestamp: Date
    isMine: boolean
    type?: 'text' | 'image' | 'voice'
    mediaUrl?: string
    duration?: number // for voice messages
    reactions?: { [emoji: string]: string[] } // emoji -> userIds
    threadCount?: number // number of replies in thread
    parentMessageId?: string // for thread replies
    readBy?: string[] // userIds who read this message
    isTyping?: boolean // for typing indicators
}

interface ChatWindowProps {
    channelId: string
    onClose: () => void
}

export function ChatWindow({ channelId, onClose }: ChatWindowProps) {
    const [messages, setMessages] = useState<Message[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [loading, setLoading] = useState(true)
    const [isRecording, setIsRecording] = useState(false)
    const [recordingTime, setRecordingTime] = useState(0)
    const [selectedImage, setSelectedImage] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [isSearching, setIsSearching] = useState(false)
    const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null)
    const [showEmojiPicker, setShowEmojiPicker] = useState(false)
    const [isTyping, setIsTyping] = useState(false)
    const [loadingMore, setLoadingMore] = useState(false)
    const [hasMoreMessages, setHasMoreMessages] = useState(true)
    const scrollAreaRef = useRef<HTMLDivElement>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)

    // Mock data - sẽ thay thế bằng Stream Chat integration
    useEffect(() => {
        const mockMessages: Message[] = [
            {
                id: '1',
                text: 'Chào bạn! Lễ tân của Phòng khám Đa khoa ABC sẽ trả lời bạn trong giây lát.',
                userId: 'system_admin',
                userName: 'Hệ thống',
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
                isMine: false,
            },
            {
                id: '2',
                text: 'Chào bác sĩ, tôi muốn hỏi về lịch khám bệnh.',
                userId: 'patient_123',
                userName: 'Nguyễn Văn A',
                timestamp: new Date(Date.now() - 1000 * 60 * 60),
                isMine: false,
            },
            {
                id: '3',
                text: 'Chào anh/chị! Anh/chị muốn đặt lịch khám khi nào ạ?',
                userId: 'receptionist_1',
                userName: 'Lễ tân Lan',
                timestamp: new Date(Date.now() - 1000 * 60 * 45),
                isMine: true,
                reactions: { '❤️': ['receptionist_1', 'patient_123'], '👍': ['patient_123'] },
                readBy: ['receptionist_1', 'patient_123'],
            },
            {
                id: '4',
                text: 'Tôi muốn khám vào thứ 5 tuần này được không?',
                userId: 'patient_123',
                userName: 'Nguyễn Văn A',
                timestamp: new Date(Date.now() - 1000 * 60 * 30),
                isMine: false,
                threadCount: 2,
                reactions: { '😊': ['receptionist_1'] },
                readBy: ['receptionist_1'],
            },
            {
                id: '5',
                text: 'Vâng, chúng tôi còn slot trống vào lúc 14:00. Anh/chị có muốn đặt không?',
                userId: 'receptionist_1',
                userName: 'Lễ tân Lan',
                timestamp: new Date(Date.now() - 1000 * 60 * 15),
                isMine: true,
                reactions: { '✅': ['patient_123'] },
                readBy: ['receptionist_1'],
            },
            {
                id: '6',
                text: 'Chào bác sĩ, tôi có thể hỏi về kết quả xét nghiệm máu của tuần trước được không?',
                userId: 'patient_124',
                userName: 'Trần Thị B',
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
                isMine: false,
                readBy: ['receptionist_1'],
            },
            {
                id: '7',
                text: 'Chào chị! Kết quả xét nghiệm của chị đã có rồi. Bác sĩ sẽ gọi điện tư vấn chi tiết trong ngày hôm nay.',
                userId: 'receptionist_1',
                userName: 'Lễ tân Lan',
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2 + 1000 * 60 * 30), // 2 days ago + 30 min
                isMine: true,
                reactions: { '👍': ['patient_124'] },
                readBy: ['receptionist_1'],
            },
            {
                id: '8',
                text: 'Vâng, cảm ơn chị! Tôi sẽ đợi cuộc gọi.',
                userId: 'patient_124',
                userName: 'Trần Thị B',
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2 + 1000 * 60 * 45), // 2 days ago + 45 min
                isMine: false,
                readBy: ['receptionist_1'],
            },
            {
                id: '9',
                text: 'Tôi bị đau đầu thường xuyên, có cần đi khám không bác sĩ?',
                userId: 'patient_125',
                userName: 'Lê Văn C',
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
                isMine: false,
                threadCount: 3,
                readBy: ['receptionist_1'],
            },
            {
                id: '10',
                text: 'Chào anh! Đau đầu thường xuyên có thể do nhiều nguyên nhân. Anh nên đến khám để bác sĩ kiểm tra kỹ.',
                userId: 'receptionist_1',
                userName: 'Lễ tân Lan',
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 + 1000 * 60 * 15), // 1 day ago + 15 min
                isMine: true,
                reactions: { '👨‍⚕️': ['patient_125'] },
                readBy: ['receptionist_1'],
            },
            {
                id: '11',
                text: 'Vậy tôi nên chuẩn bị gì để đi khám nhỉ?',
                userId: 'patient_125',
                userName: 'Lê Văn C',
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 + 1000 * 60 * 30), // 1 day ago + 30 min
                isMine: false,
                readBy: ['receptionist_1'],
            },
            {
                id: '12',
                text: 'Anh mang theo sổ khám bệnh cũ (nếu có), thẻ bảo hiểm y tế, và kể chi tiết về triệu chứng đau đầu nhé.',
                userId: 'receptionist_1',
                userName: 'Lễ tân Lan',
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 + 1000 * 60 * 45), // 1 day ago + 45 min
                isMine: true,
                reactions: { '📋': ['patient_125'] },
                readBy: ['receptionist_1'],
            },
            {
                id: '13',
                text: 'Con tôi bị sốt cao, có cần đưa đi cấp cứu không?',
                userId: 'patient_126',
                userName: 'Phạm Thị D',
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 18), // 18 hours ago
                isMine: false,
                reactions: { '🤒': ['receptionist_1'] },
                readBy: ['receptionist_1'],
            },
            {
                id: '14',
                text: 'Chào chị! Sốt cao ở trẻ em cần được theo dõi kỹ. Nếu bé sốt trên 39°C hoặc có dấu hiệu co giật, hãy đưa đi cấp cứu ngay.',
                userId: 'receptionist_1',
                userName: 'Lễ tân Lan',
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 18 + 1000 * 60 * 10), // 18 hours ago + 10 min
                isMine: true,
                reactions: { '🚨': ['patient_126'] },
                readBy: ['receptionist_1'],
            },
            {
                id: '15',
                text: 'Bây giờ bé sốt 38.5°C, tôi nên làm gì?',
                userId: 'patient_126',
                userName: 'Phạm Thị D',
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 18 + 1000 * 60 * 20), // 18 hours ago + 20 min
                isMine: false,
                readBy: ['receptionist_1'],
            },
            {
                id: '16',
                text: 'Chị hãy cho bé uống thuốc hạ sốt theo liều lượng, chườm ấm, và theo dõi nhiệt độ. Nếu không giảm sau 2-3 giờ thì đến bệnh viện.',
                userId: 'receptionist_1',
                userName: 'Lễ tân Lan',
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 18 + 1000 * 60 * 30), // 18 hours ago + 30 min
                isMine: true,
                reactions: { '💊': ['patient_126'] },
                readBy: ['receptionist_1'],
            },
            {
                id: '17',
                text: 'Cảm ơn chị đã tư vấn! Bé nhà tôi đã đỡ hơn rồi.',
                userId: 'patient_126',
                userName: 'Phạm Thị D',
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 18 + 1000 * 60 * 45), // 18 hours ago + 45 min
                isMine: false,
                reactions: { '🙏': ['receptionist_1'] },
                readBy: ['receptionist_1'],
            },
            {
                id: '18',
                text: 'Không có gì chị! Chúc bé chóng khỏe nhé.',
                userId: 'receptionist_1',
                userName: 'Lễ tân Lan',
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 18 + 1000 * 60 * 60), // 18 hours ago + 1 hour
                isMine: true,
                reactions: { '❤️': ['patient_126'] },
                readBy: ['receptionist_1'],
            },
            {
                id: '19',
                type: 'voice',
                text: '',
                userId: 'patient_127',
                userName: 'Hoàng Văn E',
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12), // 12 hours ago
                mediaUrl: 'voice-message-url',
                duration: 15,
                isMine: false,
                readBy: ['receptionist_1'],
            },
            {
                id: '20',
                text: 'Tôi đã nghe tin nhắn voice của anh. Anh có thể nhắn tin mô tả triệu chứng được không?',
                userId: 'receptionist_1',
                userName: 'Lễ tân Lan',
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12 + 1000 * 60 * 5), // 12 hours ago + 5 min
                isMine: true,
                readBy: ['receptionist_1'],
            },
            {
                id: '21',
                text: 'Tôi bị đau lưng kéo dài, ảnh hưởng đến công việc. Có thể do ngồi máy tính nhiều.',
                userId: 'patient_127',
                userName: 'Hoàng Văn E',
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12 + 1000 * 60 * 10), // 12 hours ago + 10 min
                isMine: false,
                reactions: { '💼': ['receptionist_1'] },
                readBy: ['receptionist_1'],
            },
            {
                id: '22',
                text: 'Vậy anh nên đi khám chuyên khoa cơ xương khớp. Chúng tôi có bác sĩ chuyên về vật lý trị liệu.',
                userId: 'receptionist_1',
                userName: 'Lễ tân Lan',
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12 + 1000 * 60 * 15), // 12 hours ago + 15 min
                isMine: true,
                reactions: { '🦴': ['patient_127'] },
                readBy: ['receptionist_1'],
            },
        ]

        setTimeout(() => {
            setMessages(mockMessages)
            setLoading(false)
        }, 1000)
    }, [channelId])

    // Auto scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const handleSendMessage = () => {
        if (!newMessage.trim()) return

        const message: Message = {
            id: Date.now().toString(),
            text: newMessage,
            userId: 'receptionist_1',
            userName: 'Lễ tân Lan',
            timestamp: new Date(),
            isMine: true,
        }

        setMessages(prev => [...prev, message])
        setNewMessage('')

        // Simulate reply after 2 seconds
        setTimeout(() => {
            const reply: Message = {
                id: (Date.now() + 1).toString(),
                text: 'Cảm ơn bạn đã phản hồi!',
                userId: 'patient_123',
                userName: 'Nguyễn Văn A',
                timestamp: new Date(),
                isMine: false,
            }
            setMessages(prev => [...prev, reply])
        }, 2000)
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSendMessage()
        }
    }

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file && file.type.startsWith('image/')) {
            setSelectedImage(file)
            const reader = new FileReader()
            reader.onload = e => {
                setImagePreview(e.target?.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleSendImage = () => {
        if (selectedImage) {
            const message: Message = {
                id: Date.now().toString(),
                text: '',
                userId: 'receptionist_1',
                userName: 'Lễ tân Lan',
                timestamp: new Date(),
                isMine: true,
                type: 'image',
                mediaUrl: imagePreview || '',
            }
            setMessages(prev => [...prev, message])
            setSelectedImage(null)
            setImagePreview(null)
        }
    }

    const startRecording = () => {
        setIsRecording(true)
        setRecordingTime(0)
        recordingIntervalRef.current = setInterval(() => {
            setRecordingTime(prev => prev + 1)
        }, 1000)
    }

    const stopRecording = () => {
        setIsRecording(false)
        if (recordingIntervalRef.current) {
            clearInterval(recordingIntervalRef.current)
        }

        // Simulate sending voice message
        const message: Message = {
            id: Date.now().toString(),
            text: '',
            userId: 'receptionist_1',
            userName: 'Lễ tân Lan',
            timestamp: new Date(),
            isMine: true,
            type: 'voice',
            mediaUrl: 'voice-url', // Would be actual voice file URL
            duration: recordingTime,
        }
        setMessages(prev => [...prev, message])
        setRecordingTime(0)
    }

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    const handleReaction = (messageId: string, emoji: string) => {
        setMessages(prev =>
            prev.map(msg => {
                if (msg.id === messageId) {
                    const reactions = { ...msg.reactions }
                    if (!reactions[emoji]) {
                        reactions[emoji] = []
                    }
                    const userIndex = reactions[emoji].indexOf('receptionist_1')
                    if (userIndex > -1) {
                        reactions[emoji].splice(userIndex, 1)
                    } else {
                        reactions[emoji].push('receptionist_1')
                    }
                    return { ...msg, reactions }
                }
                return msg
            }),
        )
    }

    const handleReply = (messageId: string) => {
        setSelectedMessageId(messageId)
        // Focus input for reply
    }

    const handleSearch = () => {
        setIsSearching(!isSearching)
        if (!isSearching) {
            setSearchQuery('')
        }
    }

    const filteredMessages = searchQuery
        ? messages.filter(msg => msg.text.toLowerCase().includes(searchQuery.toLowerCase()))
        : messages

    // Infinite scroll handler
    const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop } = event.currentTarget
        if (scrollTop < 100 && !loadingMore && hasMoreMessages && !isSearching) {
            loadMoreMessages()
        }
    }

    const loadMoreMessages = async () => {
        if (loadingMore || !hasMoreMessages) return

        setLoadingMore(true)

        // Simulate loading more messages
        setTimeout(() => {
            const olderMessages: Message[] = [
                {
                    id: `old_${Date.now()}_1`,
                    text: 'Chào bác sĩ, con tôi bị ho nhiều ngày nay, không biết có sao không?',
                    userId: 'patient_old',
                    userName: 'Trần Thị B (Cũ)',
                    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30), // 30 days ago
                    isMine: false,
                    readBy: ['receptionist_1'],
                },
                {
                    id: `old_${Date.now()}_2`,
                    text: 'Chị đừng lo, để tôi kiểm tra xem. Bé nhà chị bao nhiêu tuổi rồi?',
                    userId: 'receptionist_1',
                    userName: 'Lễ tân Lan',
                    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30 + 1000 * 60 * 5), // 30 days ago + 5 min
                    isMine: true,
                    reactions: { '👶': ['patient_old'] },
                    readBy: ['receptionist_1', 'patient_old'],
                },
            ]

            setMessages(prev => [...olderMessages, ...prev])
            setLoadingMore(false)

            // Simulate reaching end of messages
            if (messages.length > 50) {
                setHasMoreMessages(false)
            }
        }, 1000)
    }

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .toUpperCase()
            .slice(0, 2)
    }

    const formatMessageTime = (timestamp: Date) => {
        return format(timestamp, 'HH:mm', { locale: vi })
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full bg-background dark:bg-gray-900">
            {/* Chat Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-background dark:bg-gray-800">
                <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                        <AvatarImage src="" alt="Patient" />
                        <AvatarFallback className="bg-blue-100 text-blue-700">NA</AvatarFallback>
                    </Avatar>
                    <div>
                        <h2 className="font-semibold text-foreground dark:text-gray-100">Nguyễn Văn A</h2>
                        <p className="text-sm text-muted-foreground">Đang hoạt động</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={handleSearch}>
                        <Search className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                        <Phone className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                        <Video className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {/* Search Bar */}
                {isSearching && (
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-background dark:bg-gray-800">
                        <div className="flex gap-2">
                            <Input
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Tìm kiếm tin nhắn..."
                                className="flex-1"
                            />
                            <Button variant="ghost" size="sm" onClick={handleSearch}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Messages Area */}
            <ScrollArea ref={scrollAreaRef} className="flex-1 p-4" onScroll={handleScroll}>
                <div className="space-y-4">
                    {/* Loading More Indicator */}
                    {loadingMore && (
                        <div className="flex justify-center py-4">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        </div>
                    )}
                    {filteredMessages.map((message, index) => {
                        const prevMessage = filteredMessages[index - 1]
                        const showAvatar = index === 0 || prevMessage?.userId !== message.userId
                        const showTimestamp =
                            index === 0 ||
                            prevMessage?.userId !== message.userId ||
                            (prevMessage &&
                                message.timestamp.getTime() - prevMessage.timestamp.getTime() > 1000 * 60 * 5)

                        return (
                            <div
                                key={message.id}
                                className={cn('flex gap-3 group', message.isMine ? 'flex-row-reverse' : 'flex-row')}
                            >
                                {/* Avatar */}
                                <div className="flex-shrink-0">
                                    {showAvatar ? (
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={message.avatar} alt={message.userName} />
                                            <AvatarFallback className="text-xs">
                                                {getInitials(message.userName)}
                                            </AvatarFallback>
                                        </Avatar>
                                    ) : (
                                        <div className="w-8" />
                                    )}
                                </div>

                                {/* Message Content */}
                                <div className={cn('flex flex-col', message.isMine ? 'items-end' : 'items-start')}>
                                    {/* Timestamp */}
                                    {showTimestamp && (
                                        <span className="text-xs text-muted-foreground mb-1">
                                            {message.userName} • {formatMessageTime(message.timestamp)}
                                        </span>
                                    )}

                                    {/* Message Bubble */}
                                    <div
                                        className={cn(
                                            'max-w-xs lg:max-w-md px-4 py-2 rounded-lg',
                                            message.isMine
                                                ? 'bg-blue-600 text-white rounded-br-sm dark:bg-blue-700'
                                                : 'bg-gray-100 text-gray-900 rounded-bl-sm dark:bg-gray-700 dark:text-gray-100',
                                        )}
                                    >
                                        {message.type === 'image' && message.mediaUrl && (
                                            <div className="mb-2">
                                                <img
                                                    src={message.mediaUrl}
                                                    alt="Shared image"
                                                    className="max-w-full h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                                    onClick={() => window.open(message.mediaUrl, '_blank')}
                                                />
                                            </div>
                                        )}

                                        {message.type === 'voice' && (
                                            <div className="flex items-center gap-2 mb-2">
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                    <Play className="h-4 w-4" />
                                                </Button>
                                                <div className="flex-1 bg-gray-200 dark:bg-gray-600 h-2 rounded-full">
                                                    <div className="bg-blue-600 h-2 rounded-full w-1/4"></div>
                                                </div>
                                                <span className="text-xs text-muted-foreground">
                                                    {formatDuration(message.duration || 0)}
                                                </span>
                                            </div>
                                        )}

                                        {message.text && <p className="text-sm whitespace-pre-wrap">{message.text}</p>}
                                    </div>

                                    {/* Reactions */}
                                    {message.reactions && Object.keys(message.reactions).length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {Object.entries(message.reactions).map(
                                                ([emoji, users]) =>
                                                    users.length > 0 && (
                                                        <button
                                                            key={emoji}
                                                            onClick={() => handleReaction(message.id, emoji)}
                                                            className={cn(
                                                                'flex items-center gap-1 px-2 py-1 text-xs rounded-full transition-colors',
                                                                users.includes('receptionist_1')
                                                                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                                                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600',
                                                            )}
                                                        >
                                                            <span>{emoji}</span>
                                                            <span>{users.length}</span>
                                                        </button>
                                                    ),
                                            )}
                                            <button
                                                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                                className="flex items-center justify-center w-6 h-6 text-xs rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                            >
                                                <Smile className="h-3 w-3" />
                                            </button>
                                        </div>
                                    )}

                                    {/* Thread indicator */}
                                    {message.threadCount && message.threadCount > 0 && (
                                        <button className="flex items-center gap-1 mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline">
                                            <Reply className="h-3 w-3" />
                                            {message.threadCount} trả lời
                                        </button>
                                    )}

                                    {/* Read receipts */}
                                    {message.readBy && message.readBy.length > 0 && (
                                        <div className="flex items-center gap-1 mt-2">
                                            <div className="flex -space-x-1">
                                                {message.readBy.slice(0, 3).map(userId => (
                                                    <Avatar
                                                        key={userId}
                                                        className="h-4 w-4 border border-white dark:border-gray-800"
                                                    >
                                                        <AvatarFallback className="text-xs">
                                                            {userId === 'receptionist_1' ? 'L' : 'P'}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                ))}
                                                {message.readBy.length > 3 && (
                                                    <div className="h-4 w-4 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-xs text-gray-700 dark:text-gray-300 border border-white dark:border-gray-800">
                                                        +{message.readBy.length - 3}
                                                    </div>
                                                )}
                                            </div>
                                            <Eye className="h-3 w-3 text-gray-400" />
                                        </div>
                                    )}

                                    {/* Message actions */}
                                    <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleReply(message.id)}
                                            className="h-6 px-2 text-xs"
                                        >
                                            <Reply className="h-3 w-3 mr-1" />
                                            Trả lời
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleReaction(message.id, '❤️')}
                                            className="h-6 px-2 text-xs"
                                        >
                                            <Smile className="h-3 w-3 mr-1" />
                                            Cảm xúc
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )
                    })}

                    {/* Typing Indicator */}
                    {isTyping && (
                        <div className="flex gap-3">
                            <div className="flex-shrink-0">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src="" alt="Patient" />
                                    <AvatarFallback className="bg-blue-100 text-blue-700">NA</AvatarFallback>
                                </Avatar>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs text-muted-foreground mb-1">Nguyễn Văn A • Đang gõ...</span>
                                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-2">
                                    <div className="flex gap-1">
                                        <div
                                            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                                            style={{ animationDelay: '0ms' }}
                                        ></div>
                                        <div
                                            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                                            style={{ animationDelay: '150ms' }}
                                        ></div>
                                        <div
                                            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                                            style={{ animationDelay: '300ms' }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-background dark:bg-gray-800">
                {/* Image Preview */}
                {imagePreview && (
                    <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Ảnh sẽ gửi:</span>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setSelectedImage(null)
                                    setImagePreview(null)
                                }}
                                className="h-6 w-6 p-0"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        <img
                            src={imagePreview}
                            alt="Preview"
                            className="max-h-32 max-w-full object-contain rounded-lg"
                        />
                        <div className="flex justify-end mt-2">
                            <Button onClick={handleSendImage} size="sm">
                                <Send className="h-4 w-4 mr-2" />
                                Gửi ảnh
                            </Button>
                        </div>
                    </div>
                )}

                {/* Voice Recording Indicator */}
                {isRecording && (
                    <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                                <Mic className="h-4 w-4 text-red-500" />
                            </div>
                            <span className="text-sm text-red-700 dark:text-red-300">
                                Đang ghi âm... {formatDuration(recordingTime)}
                            </span>
                            <Button onClick={stopRecording} variant="destructive" size="sm" className="ml-auto">
                                Dừng và gửi
                            </Button>
                        </div>
                    </div>
                )}

                <div className="flex items-end gap-2">
                    {/* Attachment Menu */}
                    <div className="flex gap-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="flex-shrink-0"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Image className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="flex-shrink-0"
                            onClick={isRecording ? stopRecording : startRecording}
                        >
                            <Mic className={cn('h-4 w-4', isRecording && 'text-red-500 animate-pulse')} />
                        </Button>
                    </div>

                    {/* Emoji Picker */}
                    {showEmojiPicker && (
                        <div className="absolute bottom-full mb-2 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                            <div className="grid grid-cols-6 gap-2 max-w-xs">
                                {['❤️', '👍', '😊', '😂', '😢', '😮', '🙌', '👏', '💯', '🔥', '✨', '🎉'].map(emoji => (
                                    <button
                                        key={emoji}
                                        onClick={() => {
                                            if (selectedMessageId) {
                                                handleReaction(selectedMessageId, emoji)
                                            }
                                            setShowEmojiPicker(false)
                                        }}
                                        className="text-2xl hover:bg-gray-100 dark:hover:bg-gray-700 rounded p-1 transition-colors"
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <Button
                        variant="ghost"
                        size="sm"
                        className="flex-shrink-0"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        isDisabled={isRecording}
                    >
                        <Smile className="h-4 w-4" />
                    </Button>

                    <div className="flex-1">
                        <Input
                            value={newMessage}
                            onChange={e => setNewMessage(e.target.value)}
                            onKeyDown={handleKeyPress}
                            placeholder="Nhập tin nhắn..."
                            className="min-h-[40px] resize-none bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                            disabled={isRecording}
                        />
                    </div>

                    <Button
                        onClick={handleSendMessage}
                        isDisabled={!newMessage.trim() || isRecording}
                        size="sm"
                        className="flex-shrink-0"
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </div>

                {/* Hidden file input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                />

                <div className="text-xs text-muted-foreground mt-2 text-center">
                    Nhấn Enter để gửi, Shift + Enter để xuống dòng
                </div>
            </div>
        </div>
    )
}
