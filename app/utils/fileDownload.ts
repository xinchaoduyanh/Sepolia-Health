import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';

/**
 * Download file to device and optionally share it
 */
export async function downloadFile(url: string, fileName: string, fileType: string): Promise<void> {
  try {
    // Show loading indicator (you can customize this)
    console.log('Downloading file...', fileName);

    // Download file to cache directory
    const fileUri = FileSystem.cacheDirectory + fileName;
    const downloadResult = await FileSystem.downloadAsync(url, fileUri);

    if (downloadResult.status !== 200) {
      throw new Error('Failed to download file');
    }

    // Check if sharing is available
    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      // Share the file (this allows user to save or open it)
      await Sharing.shareAsync(downloadResult.uri, {
        mimeType: fileType,
        dialogTitle: 'Lưu hoặc mở file',
        UTI: fileType,
      });
    } else {
      Alert.alert('Thành công', 'File đã được tải xuống vào bộ nhớ tạm của ứng dụng');
    }
  } catch (error) {
    console.error('Error downloading file:', error);
    Alert.alert('Lỗi', 'Không thể tải xuống file. Vui lòng thử lại.');
  }
}

/**
 * Share file from URL
 */
export async function shareFile(url: string, fileName: string): Promise<void> {
  try {
    // Download to cache first
    const fileUri = FileSystem.cacheDirectory + fileName;
    const downloadResult = await FileSystem.downloadAsync(url, fileUri);

    if (downloadResult.status !== 200) {
      throw new Error('Failed to download file');
    }

    // Share the file
    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(downloadResult.uri);
    } else {
      Alert.alert('Lỗi', 'Tính năng chia sẻ không khả dụng trên thiết bị này');
    }
  } catch (error) {
    console.error('Error sharing file:', error);
    Alert.alert('Lỗi', 'Không thể chia sẻ file. Vui lòng thử lại.');
  }
}

/**
 * Get appropriate icon name for file type
 */
export function getFileIcon(fileType: string): string {
  if (fileType.startsWith('image/')) {
    return 'image-outline';
  } else if (fileType === 'application/pdf') {
    return 'document-text-outline';
  }
  return 'document-outline';
}

/**
 * Format file size from bytes to human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Check if file is an image
 */
export function isImageFile(fileType: string): boolean {
  return fileType.startsWith('image/');
}

/**
 * Check if file is a PDF
 */
export function isPDFFile(fileType: string): boolean {
  return fileType === 'application/pdf';
}

/**
 * Get file extension from file name
 */
export function getFileExtension(fileName: string): string {
  const parts = fileName.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : '';
}
