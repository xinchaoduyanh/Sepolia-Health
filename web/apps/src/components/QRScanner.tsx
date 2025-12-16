"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import QrScanner from "qr-scanner"
import { Camera, CameraOff, AlertCircle } from "lucide-react"
import { Button } from "@workspace/ui/components/Button"
import { cn } from "@workspace/ui/lib/utils"

interface QRScannerProps {
  onScanSuccess: (appointmentId: string) => void
  onScanError?: (error: string) => void
  className?: string
  disabled?: boolean
}

export function QRScanner({
  onScanSuccess,
  onScanError,
  className,
  disabled = false
}: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const scannerRef = useRef<QrScanner | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [hasCamera, setHasCamera] = useState<boolean | null>(null)
  const [permissionError, setPermissionError] = useState<string | null>(null)

  const checkCameraAvailability = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter(device => device.kind === 'videoinput')
      setHasCamera(videoDevices.length > 0)
    } catch (error) {
      setHasCamera(false)
    }
  }, [])

  const startScanning = useCallback(async () => {
    if (!videoRef.current || disabled) return

    try {
      // Request camera permission first
      await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      })

      // Initialize QR Scanner
      const scanner = new QrScanner(
        videoRef.current,
        (result) => {
          // Extract appointment ID from URL format
          // Expected format: https://domain/receptionist/appointment/{appointmentId}
          const urlMatch = result.data.match(/\/receptionist\/appointment\/(\d+)/)

          if (urlMatch && urlMatch[1]) {
            const appointmentId = urlMatch[1]
            onScanSuccess(appointmentId)
            stopScanning()
          } else {
            onScanError?.("QR code không hợp lệ. Vui lòng quét mã QR từ ứng dụng bệnh nhân.")
          }
        },
        {
          highlightScanRegion: true,
          highlightCodeOutline: true,
          preferredCamera: 'environment',
        }
      )

      scannerRef.current = scanner
      await scanner.start()
      setIsScanning(true)
      setPermissionError(null)

    } catch (error: any) {
      console.error('Camera error:', error)

      if (error.name === 'NotAllowedError') {
        setPermissionError("Chưa được cấp quyền truy cập camera. Vui lòng cấp quyền để sử dụng tính năng quét mã QR.")
      } else if (error.name === 'NotFoundError') {
        setPermissionError("Không tìm thấy camera trên thiết bị.")
      } else {
        setPermissionError("Lỗi khi truy cập camera. Vui lòng thử lại.")
      }

      setIsScanning(false)
      onScanError?.(permissionError || "Lỗi camera")
    }
  }, [onScanSuccess, onScanError, disabled, permissionError])

  const stopScanning = useCallback(() => {
    if (scannerRef.current) {
      scannerRef.current.stop()
      scannerRef.current.destroy()
      scannerRef.current = null
    }
    setIsScanning(false)
  }, [])

  useEffect(() => {
    checkCameraAvailability()
  }, [checkCameraAvailability])

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop()
        scannerRef.current.destroy()
      }
    }
  }, [])

  if (hasCamera === false) {
    return (
      <div className="m-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <p className="text-red-800 dark:text-red-200 text-sm">
          Không tìm thấy camera trên thiết bị. Vui lòng sử dụng thiết bị có camera để quét mã QR.
        </p>
      </div>
    )
  }

  if (hasCamera === null) {
    return <div className="flex items-center justify-center p-8">Đang kiểm tra camera...</div>
  }

  return (
    <div className={cn("relative", className)}>
      {permissionError && (
        <div className="m-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-800 dark:text-red-200 text-sm">{permissionError}</p>
        </div>
      )}

      <div className="relative overflow-hidden rounded-lg bg-black">
        <video
          ref={videoRef}
          className="w-full h-auto max-h-[400px] object-cover"
          playsInline
          muted
        />

        {!isScanning && !disabled && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="text-center text-white">
              <Camera className="mx-auto h-12 w-12 mb-2" />
              <p className="text-sm">Camera chưa được kích hoạt</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2 p-4">
        {!isScanning ? (
          <Button
            onClick={startScanning}
            isDisabled={disabled}
            className="flex-1"
          >
            <Camera className="mr-2 h-4 w-4" />
            Bật Camera
          </Button>
        ) : (
          <Button
            onClick={stopScanning}
            variant="outline"
            className="flex-1"
          >
            <CameraOff className="mr-2 h-4 w-4" />
            Tắt Camera
          </Button>
        )}
      </div>

      <div className="px-4 pb-4">
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
          Đặt mã QR vào trong khung hình để quét tự động
        </p>
      </div>
    </div>
  )
}