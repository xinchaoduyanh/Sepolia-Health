'use client'

import { useState, useRef, useCallback } from 'react'
import { Button } from '@workspace/ui/components/Button'
import { Label } from '@workspace/ui/components/Label'
import { Image, Upload, Eye, Edit, AlertCircle } from 'lucide-react'
import { uploadService } from '@/shared/lib/api-services/upload.service'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'

interface ArticleMarkdownEditorProps {
    value: string
    onChange: (value: string) => void
    placeholder?: string
    error?: string
    disabled?: boolean
}

export function ArticleMarkdownEditor({
    value,
    onChange,
    placeholder = 'Nhập nội dung bài viết dạng Markdown...',
    error,
    disabled = false,
}: ArticleMarkdownEditorProps) {
    const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'split'>('split')
    const [isUploading, setIsUploading] = useState(false)
    const [uploadError, setUploadError] = useState<string>('')
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const dragCounterRef = useRef(0)
    const [isDragging, setIsDragging] = useState(false)

    // Insert text at cursor position
    const insertTextAtCursor = useCallback(
        (text: string) => {
            const textarea = textareaRef.current
            if (!textarea) return

            const start = textarea.selectionStart
            const end = textarea.selectionEnd
            const before = value.substring(0, start)
            const after = value.substring(end)

            const newValue = before + text + after
            onChange(newValue)

            // Set cursor position after inserted text
            setTimeout(() => {
                textarea.focus()
                const newPosition = start + text.length
                textarea.setSelectionRange(newPosition, newPosition)
            }, 0)
        },
        [value, onChange],
    )

    // Handle file upload
    const handleFileUpload = useCallback(
        async (file: File) => {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                setUploadError('Vui lòng chọn file ảnh')
                return null
            }

            // Validate file size (10MB max)
            if (file.size > 10 * 1024 * 1024) {
                setUploadError('Kích thước file không được vượt quá 10MB')
                return null
            }

            setIsUploading(true)
            setUploadError('')

            try {
                const url = await uploadService.uploadFile(file)
                const altText = file.name.replace(/\.[^/.]+$/, '') // Remove extension
                const markdownImage = `![${altText}](${url})`
                insertTextAtCursor(markdownImage)
                return url
            } catch (error: any) {
                console.error('Upload error:', error)
                setUploadError(error.message || 'Lỗi khi upload ảnh')
                return null
            } finally {
                setIsUploading(false)
            }
        },
        [insertTextAtCursor],
    )

    // Handle image button click
    const handleImageButtonClick = useCallback(() => {
        fileInputRef.current?.click()
    }, [])

    // Handle file input change
    const handleFileInputChange = useCallback(
        async (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0]
            if (file) {
                await handleFileUpload(file)
            }
            // Reset input
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        },
        [handleFileUpload],
    )

    // Handle paste event
    const handlePaste = useCallback(
        async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
            const items = e.clipboardData.items
            for (let i = 0; i < items.length; i++) {
                const item = items[i]
                if (item.type.startsWith('image/')) {
                    e.preventDefault()
                    const file = item.getAsFile()
                    if (file) {
                        await handleFileUpload(file)
                    }
                    break
                }
            }
        },
        [handleFileUpload],
    )

    // Handle drag and drop
    const handleDragEnter = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        dragCounterRef.current++
        if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
            setIsDragging(true)
        }
    }, [])

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        dragCounterRef.current--
        if (dragCounterRef.current === 0) {
            setIsDragging(false)
        }
    }, [])

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
    }, [])

    const handleDrop = useCallback(
        async (e: React.DragEvent) => {
            e.preventDefault()
            e.stopPropagation()
            setIsDragging(false)
            dragCounterRef.current = 0

            const files = Array.from(e.dataTransfer.files)
            const imageFiles = files.filter(file => file.type.startsWith('image/'))

            if (imageFiles.length > 0) {
                // Upload first image
                await handleFileUpload(imageFiles[0])
                // If multiple images, upload them sequentially
                for (let i = 1; i < imageFiles.length; i++) {
                    await handleFileUpload(imageFiles[i])
                    insertTextAtCursor('\n\n') // Add line breaks between images
                }
            }
        },
        [handleFileUpload, insertTextAtCursor],
    )

    // Toolbar buttons
    const insertMarkdown = useCallback(
        (before: string, after: string = '', placeholder?: string) => {
            const textarea = textareaRef.current
            if (!textarea) return

            const start = textarea.selectionStart
            const end = textarea.selectionEnd
            const selectedText = value.substring(start, end)
            const beforeText = value.substring(0, start)
            const afterText = value.substring(end)

            let insertText = before
            if (selectedText) {
                insertText += selectedText
            } else if (placeholder) {
                insertText += placeholder
            }
            insertText += after

            const newValue = beforeText + insertText + afterText
            onChange(newValue)

            setTimeout(() => {
                textarea.focus()
                const newPosition = start + before.length + (selectedText || placeholder || '').length + after.length
                textarea.setSelectionRange(newPosition, newPosition)
            }, 0)
        },
        [value, onChange],
    )

    return (
        <div className="space-y-2">
            {/* Toolbar */}
            <div className="flex items-center justify-between border-b border-border pb-2">
                <div className="flex items-center space-x-1">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setViewMode(viewMode === 'edit' ? 'split' : 'edit')}
                        className={viewMode === 'edit' ? 'bg-accent' : ''}
                    >
                        <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setViewMode(viewMode === 'preview' ? 'split' : 'preview')}
                        className={viewMode === 'preview' ? 'bg-accent' : ''}
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                    <div className="w-px h-6 bg-border mx-1" />
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => insertMarkdown('**', '**', 'bold text')}
                        disabled={disabled}
                        title="Bold"
                    >
                        <strong>B</strong>
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => insertMarkdown('*', '*', 'italic text')}
                        disabled={disabled}
                        title="Italic"
                    >
                        <em>I</em>
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => insertMarkdown('## ', '', 'Heading')}
                        disabled={disabled}
                        title="Heading"
                    >
                        H
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => insertMarkdown('[', '](url)', 'link text')}
                        disabled={disabled}
                        title="Link"
                    >
                        🔗
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleImageButtonClick}
                        disabled={disabled || isUploading}
                        title="Insert Image"
                    >
                        {isUploading ? <Upload className="h-4 w-4 animate-spin" /> : <Image className="h-4 w-4" />}
                    </Button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileInputChange}
                        disabled={disabled || isUploading}
                    />
                </div>
            </div>

            {/* Editor Area */}
            <div
                className={`relative border border-border rounded-md overflow-hidden ${
                    isDragging ? 'border-primary bg-accent/50' : ''
                } ${error ? 'border-red-500' : ''}`}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                {viewMode === 'edit' && (
                    <textarea
                        ref={textareaRef}
                        value={value}
                        onChange={e => onChange(e.target.value)}
                        onPaste={handlePaste}
                        placeholder={placeholder}
                        disabled={disabled}
                        className="w-full min-h-[400px] p-4 font-mono text-sm resize-none focus:outline-none bg-background"
                        style={{ fontFamily: 'monospace' }}
                    />
                )}

                {viewMode === 'preview' && (
                    <div className="min-h-[400px] p-4 prose prose-sm max-w-none dark:prose-invert">
                        <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                            {value || '*Chưa có nội dung để hiển thị*'}
                        </ReactMarkdown>
                    </div>
                )}

                {viewMode === 'split' && (
                    <div className="grid grid-cols-2 divide-x divide-border">
                        <textarea
                            ref={textareaRef}
                            value={value}
                            onChange={e => onChange(e.target.value)}
                            onPaste={handlePaste}
                            placeholder={placeholder}
                            disabled={disabled}
                            className="w-full min-h-[400px] p-4 font-mono text-sm resize-none focus:outline-none bg-background"
                            style={{ fontFamily: 'monospace' }}
                        />
                        <div className="min-h-[400px] p-4 prose prose-sm max-w-none dark:prose-invert overflow-auto">
                            <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                                {value || '*Chưa có nội dung để hiển thị*'}
                            </ReactMarkdown>
                        </div>
                    </div>
                )}

                {isDragging && (
                    <div className="absolute inset-0 bg-primary/10 border-2 border-dashed border-primary flex items-center justify-center z-10">
                        <div className="text-center">
                            <Upload className="h-12 w-12 mx-auto mb-2 text-primary" />
                            <p className="text-primary font-medium">Thả ảnh vào đây để upload</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Error Messages */}
            {error && (
                <div className="flex items-center space-x-2 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    <span>{error}</span>
                </div>
            )}

            {uploadError && (
                <div className="flex items-center space-x-2 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    <span>{uploadError}</span>
                </div>
            )}

            {/* Help Text */}
            <p className="text-xs text-muted-foreground">
                💡 Mẹo: Kéo thả ảnh vào editor, paste ảnh từ clipboard, hoặc click nút ảnh để upload. Hỗ trợ Markdown
                với GitHub Flavored Markdown.
            </p>
        </div>
    )
}
