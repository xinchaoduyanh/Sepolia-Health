import { downloadFile, shareFile } from '@/utils/fileDownload';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface ImageViewerProps {
  imageUrl: string;
  fileName: string;
  onClose: () => void;
}

export default function ImageViewer({ imageUrl, fileName, onClose }: ImageViewerProps) {
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    await downloadFile(imageUrl, fileName, 'image/jpeg');
    setDownloading(false);
  };

  const handleShare = async () => {
    await shareFile(imageUrl, fileName);
  };

  return (
    <Modal visible={true} transparent={false} animationType="fade" onRequestClose={onClose}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <View style={{ flex: 1, backgroundColor: '#000000' }}>
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 60,
            paddingBottom: 16,
            paddingHorizontal: 16,
            backgroundColor: 'rgba(0,0,0,0.8)',
          }}>
          <TouchableOpacity
            onPress={onClose}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: 'rgba(255,255,255,0.1)',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>

          <Text
            style={{
              flex: 1,
              fontSize: 16,
              fontWeight: '600',
              color: 'white',
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
                backgroundColor: 'rgba(255,255,255,0.1)',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Ionicons name="share-outline" size={20} color="white" />
            </TouchableOpacity>

            {/* Download Button */}
            <TouchableOpacity
              onPress={handleDownload}
              disabled={downloading}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: 'rgba(255,255,255,0.1)',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              {downloading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Ionicons name="download-outline" size={20} color="white" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Image */}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          {loading && (
            <View style={{ position: 'absolute' }}>
              <ActivityIndicator size="large" color="white" />
            </View>
          )}
          <Image
            source={{ uri: imageUrl }}
            style={{
              width: Dimensions.get('window').width,
              height: Dimensions.get('window').height - 120,
            }}
            resizeMode="contain"
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
          />
        </View>

        {/* Footer Hint */}
        <View
          style={{
            paddingVertical: 12,
            paddingHorizontal: 16,
            backgroundColor: 'rgba(0,0,0,0.8)',
            alignItems: 'center',
          }}>
          <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
            Nhấn để phóng to • Vuốt để đóng
          </Text>
        </View>
      </View>
    </Modal>
  );
}
