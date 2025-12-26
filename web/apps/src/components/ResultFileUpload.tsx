'use client'

import { apiClient } from '@/shared/lib/api-client'
import { toast } from '@workspace/ui/components/Sonner'
import { AlertCircle, FileText, Image as ImageIcon, Loader2, Upload, X } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'

interface FileWithPreview {
    file: File
    preview?: string
    uploading: boolean
    uploaded: boolean
    error?: string
    id?: number
}

interface ResultFileUploadProps {
    resultId?: number
    existingFiles?: Array<{
        id: number
        fileName: string
        fileUrl: string
        fileType: string
        fileSize: number
    }>
    onFilesChange?: (files: FileWithPreview[]) => void
    onUploadSuccess?: () => void
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
const MAX_FILES = 10

export function ResultFileUpload({
    resultId,
    existingFiles = [],
    onFilesChange,
    onUploadSuccess,
}: ResultFileUploadProps) {
    const [files, setFiles] = useState<FileWithPreview[]>([])
    const [dragActive, setDragActive] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const validateFile = (file: File): string | null => {
        if (!ALLOWED_TYPES.includes(file.type)) {
            return 'Chỉ chấp nhận file ảnh (JPEG, PNG) hoặc PDF'
        }
        if (file.size > MAX_FILE_SIZE) {
            return 'Kích thước file không được vượt quá 10MB'
        }
        return null
    }

    const handleFiles = useCallback(
        async (newFiles: FileList | File[]) => {
            const fileArray = Array.from(newFiles)
            const totalFiles = files.length + existingFiles.length + fileArray.length

            if (totalFiles > MAX_FILES) {
                alert(`Chỉ được upload tối đa ${MAX_FILES} file`)
                return
            }

            const validFiles: FileWithPreview[] = []

            for (const file of fileArray) {
                const error = validateFile(file)
                const fileWithPreview: FileWithPreview = {
                    file,
                    uploading: false,
                    uploaded: false,
                    error: error || undefined,
                }

                // Create preview for images
                if (file.type.startsWith('image/')) {
                    fileWithPreview.preview = URL.createObjectURL(file)
                }

                validFiles.push(fileWithPreview)
            }

            const updatedFiles = [...files, ...validFiles]
            setFiles(updatedFiles)
            onFilesChange?.(updatedFiles)

            // Auto upload if resultId exists
            if (resultId) {
                for (let i = 0; i < validFiles.length; i++) {
                    const fileIndex = files.length + i
                    await uploadFile(fileIndex, validFiles[i])
                }
            }
        },
        [files, existingFiles, resultId, onFilesChange],
    )

    const uploadFile = async (index: number, fileData: FileWithPreview) => {
        if (!resultId || fileData.error) return

        setFiles(prev => {
            const updated = [...prev]
            updated[index] = { ...updated[index], uploading: true }
            return updated
        })

        try {
            const formData = new FormData()
            formData.append('file', fileData.file)

            const response = await apiClient.post<{
                id: number
                fileUrl: string
                fileType: string
                fileName: string
                fileSize: number
            }>(`/doctor/appointments/results/${resultId}/files`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            })

            setFiles(prev => {
                const updated = [...prev]
                updated[index] = {
                    ...updated[index],
                    uploading: false,
                    uploaded: true,
                    id: response.id,
                }
                return updated
            })

            // Show success toast
            toast.success('Upload thành công!', {
                description: `File ${fileData.file.name} đã được tải lên`,
            })

            // Trigger refetch
            onUploadSuccess?.()
        } catch (error: any) {
            setFiles(prev => {
                const updated = [...prev]
                updated[index] = {
                    ...updated[index],
                    uploading: false,
                    error: error.response?.data?.message || 'Lỗi khi upload file',
                }
                return updated
            })

            // Show error toast
            toast.error('Upload thất bại', {
                description: error.response?.data?.message || 'Không thể tải file lên',
            })
        }
    }

    const removeFile = async (index: number) => {
        const fileData = files[index]

        // If file was uploaded, delete from server
        if (fileData.id && resultId) {
            try {
                await apiClient.delete(`/doctor/appointments/results/${resultId}/files/${fileData.id}`)
            } catch (error) {
                console.error('Error deleting file:', error)
            }
        }

        // Revoke preview URL
        if (fileData.preview) {
            URL.revokeObjectURL(fileData.preview)
        }

        const updatedFiles = files.filter((_, i) => i !== index)
        setFiles(updatedFiles)
        onFilesChange?.(updatedFiles)
    }

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true)
        } else if (e.type === 'dragleave') {
            setDragActive(false)
        }
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files)
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFiles(e.target.files)
        }
    }

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
    }

    const getFileIcon = (type: string) => {
        if (type.startsWith('image/')) {
            return <ImageIcon className="h-8 w-8 text-blue-500" />
        }
        return <FileText className="h-8 w-8 text-red-500" />
    }

    return (
        <div className="space-y-4">
            {/* Upload Area */}
            <div
                className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
                    dragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={handleChange}
                    className="hidden"
                />

                <div className="text-center">
                    <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="mt-2 text-sm font-medium text-foreground">
                        Kéo thả file vào đây hoặc{' '}
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="text-primary hover:underline"
                        >
                            chọn file
                        </button>
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Hỗ trợ: JPEG, PNG, PDF (tối đa 10MB, {MAX_FILES} files)
                    </p>
                    {!resultId && files.length > 0 && (
                        <p className="mt-2 text-xs text-amber-600">💡 File sẽ được upload sau khi lưu kết quả khám</p>
                    )}
                </div>
            </div>

            {/* File List */}
            {files.length > 0 && (
                <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">
                        File đã chọn ({files.length}/{MAX_FILES})
                    </p>
                    <div className="space-y-2">
                        {files.map((fileData, index) => (
                            <div key={index} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                                {/* File Icon/Preview */}
                                <div className="flex-shrink-0">
                                    {fileData.preview ? (
                                        <img
                                            src={fileData.preview}
                                            alt={fileData.file.name}
                                            className="h-12 w-12 object-cover rounded"
                                        />
                                    ) : (
                                        getFileIcon(fileData.file.type)
                                    )}
                                </div>

                                {/* File Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate">{fileData.file.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {formatFileSize(fileData.file.size)}
                                    </p>
                                    {fileData.error && (
                                        <div className="flex items-center gap-1 mt-1">
                                            <AlertCircle className="h-3 w-3 text-red-500" />
                                            <p className="text-xs text-red-500">{fileData.error}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Status */}
                                <div className="flex-shrink-0">
                                    {fileData.uploading && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
                                    {fileData.uploaded && (
                                        <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center">
                                            <svg
                                                className="h-3 w-3 text-white"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M5 13l4 4L19 7"
                                                />
                                            </svg>
                                        </div>
                                    )}
                                </div>

                                {/* Remove Button */}
                                <button
                                    type="button"
                                    onClick={() => removeFile(index)}
                                    disabled={fileData.uploading}
                                    className="flex-shrink-0 p-1 hover:bg-background rounded transition-colors disabled:opacity-50"
                                >
                                    <X className="h-4 w-4 text-muted-foreground" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Existing Files */}
            {existingFiles.length > 0 && (
                <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">File đã upload ({existingFiles.length})</p>
                    <div className="space-y-2">
                        {existingFiles.map(file => (
                            <div key={file.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                                <div className="flex-shrink-0">{getFileIcon(file.fileType)}</div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate">{file.fileName}</p>
                                    <p className="text-xs text-muted-foreground">{formatFileSize(file.fileSize)}</p>
                                </div>
                                <a
                                    href={file.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-primary hover:underline"
                                >
                                    Xem
                                </a>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
