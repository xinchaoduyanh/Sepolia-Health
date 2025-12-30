import { Mic } from 'lucide-react'
import { cn } from '@workspace/ui/lib/utils'

interface VoiceInputButtonProps {
    isListening: boolean
    isSupported: boolean
    onToggle: () => void
    className?: string
    disabled?: boolean
}

export function VoiceInputButton({
    isListening,
    isSupported,
    onToggle,
    className,
    disabled = false,
}: VoiceInputButtonProps) {
    if (!isSupported) {
        return (
            <button
                type="button"
                disabled
                className={cn(
                    'p-2 rounded-lg transition-colors cursor-not-allowed opacity-50',
                    'bg-muted text-muted-foreground',
                    className
                )}
                title="Trình duyệt không hỗ trợ nhận dạng giọng nói"
            >
                <Mic className="h-4 w-4" />
            </button>
        )
    }

    return (
        <button
            type="button"
            onClick={onToggle}
            disabled={disabled}
            className={cn(
                'relative p-2 rounded-lg transition-all duration-200',
                'hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2',
                isListening
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 focus:ring-red-500 animate-pulse'
                    : 'bg-primary/10 text-primary hover:bg-primary/20 focus:ring-primary',
                disabled && 'opacity-50 cursor-not-allowed hover:scale-100',
                className
            )}
            title={isListening ? 'Dừng ghi âm' : 'Bắt đầu ghi âm'}
            aria-label={isListening ? 'Dừng ghi âm' : 'Bắt đầu ghi âm'}
        >
            <Mic className={cn('h-4 w-4', isListening && 'animate-pulse')} />
            
            {/* Pulse ring effect when listening */}
            {isListening && (
                <span className="absolute inset-0 rounded-lg bg-red-400 dark:bg-red-600 animate-ping opacity-75" />
            )}
        </button>
    )
}
