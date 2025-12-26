import { AppointmentResultFile } from '@/types/appointment';
import {
  downloadFile,
  formatFileSize,
  getFileExtension,
  getFileIcon,
  isImageFile,
  isPDFFile,
  shareFile,
} from '@/utils/fileDownload';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from 'react-native';
import ImageViewer from './ImageViewer';
import PDFViewer from './PDFViewer';

interface ResultFileListProps {
  files: AppointmentResultFile[];
}

export default function ResultFileList({ files }: ResultFileListProps) {
  const [selectedImage, setSelectedImage] = useState<AppointmentResultFile | null>(null);
  const [selectedPDF, setSelectedPDF] = useState<AppointmentResultFile | null>(null);
  const [downloadingFileId, setDownloadingFileId] = useState<number | null>(null);

  const handleFilePress = (file: AppointmentResultFile) => {
    if (isImageFile(file.fileType)) {
      setSelectedImage(file);
    } else if (isPDFFile(file.fileType)) {
      setSelectedPDF(file);
    } else {
      Alert.alert('Thông báo', 'Loại file này chưa được hỗ trợ xem trực tiếp');
    }
  };

  const handleDownload = async (file: AppointmentResultFile) => {
    setDownloadingFileId(file.id);
    await downloadFile(file.fileUrl, file.fileName, file.fileType);
    setDownloadingFileId(null);
  };

  const handleShare = async (file: AppointmentResultFile) => {
    await shareFile(file.fileUrl, file.fileName);
  };

  if (!files || files.length === 0) {
    return null;
  }

  return (
    <>
      <View style={{ marginTop: 16 }}>
        <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 8, fontWeight: '600' }}>
          File đính kèm ({files.length})
        </Text>
        <View style={{ gap: 8 }}>
          {files.map((file) => (
            <TouchableOpacity
              key={file.id}
              onPress={() => handleFilePress(file)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#F9FAFB',
                borderRadius: 12,
                padding: 12,
                borderWidth: 1,
                borderColor: '#E5E7EB',
              }}>
              {/* File Icon */}
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 8,
                  backgroundColor: isImageFile(file.fileType) ? '#DBEAFE' : '#FEE2E2',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}>
                <Ionicons
                  name={getFileIcon(file.fileType) as any}
                  size={24}
                  color={isImageFile(file.fileType) ? '#3B82F6' : '#EF4444'}
                />
              </View>

              {/* File Info */}
              <View style={{ flex: 1 }}>
                <Text
                  style={{ fontSize: 14, fontWeight: '600', color: '#1F2937', marginBottom: 2 }}
                  numberOfLines={1}>
                  {file.fileName}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ fontSize: 12, color: '#6B7280' }}>
                    {formatFileSize(file.fileSize)}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#9CA3AF' }}>•</Text>
                  <Text style={{ fontSize: 12, color: '#6B7280' }}>
                    {getFileExtension(file.fileName)}
                  </Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {/* Share Button */}
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    handleShare(file);
                  }}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    backgroundColor: '#E0F2FE',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Ionicons name="share-outline" size={18} color="#0284C7" />
                </TouchableOpacity>

                {/* Download Button */}
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    handleDownload(file);
                  }}
                  disabled={downloadingFileId === file.id}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    backgroundColor: '#ECFDF5',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  {downloadingFileId === file.id ? (
                    <ActivityIndicator size="small" color="#10B981" />
                  ) : (
                    <Ionicons name="download-outline" size={18} color="#10B981" />
                  )}
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Image Viewer Modal */}
      {selectedImage && (
        <ImageViewer
          imageUrl={selectedImage.fileUrl}
          fileName={selectedImage.fileName}
          onClose={() => setSelectedImage(null)}
        />
      )}

      {/* PDF Viewer Modal */}
      {selectedPDF && (
        <PDFViewer
          pdfUrl={selectedPDF.fileUrl}
          fileName={selectedPDF.fileName}
          onClose={() => setSelectedPDF(null)}
        />
      )}
    </>
  );
}
