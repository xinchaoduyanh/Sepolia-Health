'use client';

import { AppTermsType, useAppTermsByType } from '@/lib/api';
import { prepareMarkdownContent } from '@/utils/html-to-markdown';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Markdown from 'react-native-markdown-display';
import Svg, { Path } from 'react-native-svg';

// Markdown styles for terms pages
const markdownStyles = {
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  heading1: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    color: '#0284C7',
    marginTop: 24,
    marginBottom: 16,
  },
  heading2: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: '#0284C7',
    marginTop: 20,
    marginBottom: 12,
  },
  heading3: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: '#0F172A',
    marginTop: 16,
    marginBottom: 10,
  },
  paragraph: {
    marginTop: 0,
    marginBottom: 12,
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  strong: {
    fontWeight: '700' as const,
    color: '#0F172A',
  },
  em: {
    fontStyle: 'italic' as const,
    color: '#333',
  },
  bullet_list: {
    marginTop: 8,
    marginBottom: 8,
  },
  ordered_list: {
    marginTop: 8,
    marginBottom: 8,
  },
  list_item: {
    marginTop: 4,
    marginBottom: 4,
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  bullet_list_icon: {
    marginLeft: 8,
    marginRight: 8,
    color: '#0284C7',
  },
  link: {
    color: '#0284C7',
    textDecorationLine: 'underline' as const,
  },
  code_inline: {
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
    fontFamily: 'monospace',
    fontSize: 14,
    color: '#0F172A',
  },
  code_block: {
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    marginBottom: 8,
  },
  blockquote: {
    borderLeftWidth: 4,
    borderLeftColor: '#0284C7',
    paddingLeft: 12,
    marginTop: 8,
    marginBottom: 8,
    backgroundColor: '#F8FAFC',
    paddingVertical: 8,
  },
};

export default function DisputeResolutionScreen() {
  const { data: terms, isLoading, error } = useAppTermsByType(AppTermsType.DISPUTE_RESOLUTION);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#E0F2FE',
        }}>
        <ActivityIndicator size="large" color="#0284C7" />
      </View>
    );
  }

  if (error || !terms) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
          backgroundColor: '#E0F2FE',
        }}>
        <Text style={{ fontSize: 16, color: '#666', textAlign: 'center' }}>
          Không thể tải nội dung. Vui lòng thử lại sau.
        </Text>
      </View>
    );
  }

  const markdownContent = prepareMarkdownContent(terms.content);
  const displayTitle = terms.title;

  return (
    <View style={{ flex: 1, backgroundColor: '#E0F2FE' }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces={false}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Background Gradient Header */}
        <View style={{ height: 240, position: 'relative', marginTop: -60 }}>
          <LinearGradient
            colors={['#0284C7', '#06B6D4', '#10B981']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ flex: 1 }}
          />
          {/* Curved bottom edge using SVG */}
          <Svg
            height="70"
            width="200%"
            viewBox="0 0 1440 120"
            style={{ position: 'absolute', bottom: -1, left: 0, right: 0 }}>
            <Path d="M0,0 Q720,120 1440,0 L1440,120 L0,120 Z" fill="#E0F2FE" />
          </Svg>

          {/* Header content */}
          <View
            style={{
              position: 'absolute',
              top: 100,
              left: 24,
              right: 24,
              flexDirection: 'row',
              alignItems: 'center',
            }}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={{
                height: 40,
                width: 40,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 20,
                backgroundColor: 'rgba(255,255,255,0.25)',
                marginRight: 12,
              }}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text
              numberOfLines={1}
              style={{ fontSize: 22, fontWeight: 'bold', color: '#FFFFFF', flex: 1 }}>
              {displayTitle || 'Giải quyết khiếu nại'}
            </Text>
          </View>
        </View>

        {/* Content Section */}
        <View
          style={{
            marginHorizontal: 20,
            marginTop: -40,
            backgroundColor: '#fff',
            borderRadius: 20,
            padding: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            elevation: 5,
          }}>
          <Markdown style={markdownStyles}>{markdownContent}</Markdown>
        </View>
      </ScrollView>
    </View>
  );
}
