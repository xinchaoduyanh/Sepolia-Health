import { downloadFile, shareFile } from '@/utils/fileDownload';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Modal,
  Platform,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';

interface PDFViewerProps {
  pdfUrl: string;
  fileName: string;
  onClose: () => void;
}

export default function PDFViewer({ pdfUrl, fileName, onClose }: PDFViewerProps) {
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(false);

  // For iOS, we can use the direct URL
  // For Android, we use Google Docs Viewer
  const viewerUrl =
    Platform.OS === 'ios'
      ? pdfUrl
      : `https://docs.google.com/viewer?url=${encodeURIComponent(pdfUrl)}&embedded=true`;

  const handleDownload = async () => {
    setDownloading(true);
    await downloadFile(pdfUrl, fileName, 'application/pdf');
    setDownloading(false);
  };

  const handleShare = async () => {
    await shareFile(pdfUrl, fileName);
  };

  const handleOpenExternal = () => {
    Linking.openURL(pdfUrl);
  };

  return (
    <Modal visible={true} transparent={false} animationType="slide" onRequestClose={onClose}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 60,
            paddingBottom: 16,
            paddingHorizontal: 16,
            backgroundColor: '#FFFFFF',
            borderBottomWidth: 1,
            borderBottomColor: '#E5E7EB',
          }}>
          <TouchableOpacity
            onPress={onClose}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: '#F3F4F6',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Ionicons name="close" size={24} color="#1F2937" />
          </TouchableOpacity>

          <Text
            style={{
              flex: 1,
              fontSize: 16,
              fontWeight: '600',
              color: '#1F2937',
              marginHorizontal: 16,
            }}
            numberOfLines={1}>
            {fileName}
          </Text>

          <View style={{ flexDirection: 'row', gap: 8 }}>
            {/* Share Button */}
            <TouchableOpacity
              onPress={handleShare}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: '#E0F2FE',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Ionicons name="share-outline" size={20} color="#0284C7" />
            </TouchableOpacity>

            {/* Download Button */}
            <TouchableOpacity
              onPress={handleDownload}
              disabled={downloading}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: '#ECFDF5',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              {downloading ? (
                <ActivityIndicator size="small" color="#10B981" />
              ) : (
                <Ionicons name="download-outline" size={20} color="#10B981" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* PDF Viewer */}
        <View style={{ flex: 1 }}>
          {loading && (
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#F9FAFB',
                zIndex: 1,
              }}>
              <ActivityIndicator size="large" color="#0284C7" />
              <Text style={{ marginTop: 16, fontSize: 14, color: '#6B7280' }}>Đang tải PDF...</Text>
            </View>
          )}

          {error ? (
            <View
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                padding: 24,
              }}>
              <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: '600',
                  color: '#1F2937',
                  marginTop: 16,
                  textAlign: 'center',
                }}>
                Không thể hiển thị PDF
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: '#6B7280',
                  marginTop: 8,
                  textAlign: 'center',
                }}>
                Vui lòng tải xuống hoặc mở bằng ứng dụng khác
              </Text>
              <TouchableOpacity
                onPress={handleOpenExternal}
                style={{
                  marginTop: 24,
                  paddingVertical: 12,
                  paddingHorizontal: 24,
                  backgroundColor: '#0284C7',
                  borderRadius: 8,
                }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: 'white' }}>
                  Mở bằng ứng dụng khác
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <WebView
              source={{ uri: viewerUrl }}
              onLoadStart={() => setLoading(true)}
              onLoadEnd={() => setLoading(false)}
              onError={() => {
                setLoading(false);
                setError(true);
              }}
              style={{ flex: 1 }}
              startInLoadingState={true}
              renderLoading={() => <View />}
            />
          )}
        </View>

        {/* Footer Info */}
        {!error && (
          <View
            style={{
              paddingVertical: 12,
              paddingHorizontal: 16,
              backgroundColor: '#F9FAFB',
              borderTopWidth: 1,
              borderTopColor: '#E5E7EB',
              alignItems: 'center',
            }}>
            <Text style={{ fontSize: 12, color: '#6B7280' }}>
              {Platform.OS === 'ios'
                ? 'Sử dụng trình xem PDF tích hợp'
                : 'Sử dụng Google Docs Viewer'}
            </Text>
          </View>
        )}
      </View>
    </Modal>
  );
}
