'use client';

import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { useAppTermsByType, AppTermsType } from '@/lib/api';
import { prepareMarkdownContent } from '@/utils/html-to-markdown';

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

export default function PrivacyPolicyScreen() {
  const { data: terms, isLoading, error } = useAppTermsByType(AppTermsType.PRIVACY_POLICY);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0284C7" />
      </View>
    );
  }

  if (error || !terms) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ fontSize: 16, color: '#666', textAlign: 'center' }}>
          Không thể tải nội dung. Vui lòng thử lại sau.
        </Text>
      </View>
    );
  }

  const markdownContent = prepareMarkdownContent(terms.content);
  const displayTitle = terms.title;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#fff' }}
      contentContainerStyle={{ padding: 20 }}
      showsVerticalScrollIndicator={true}>
      {displayTitle && (
        <Text
          style={{
            fontSize: 28,
            fontWeight: 'bold',
            color: '#0284C7',
            marginBottom: 20,
          }}>
          {displayTitle}
        </Text>
      )}
      <Markdown style={markdownStyles}>{markdownContent}</Markdown>
    </ScrollView>
  );
}
