import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  TextInput,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useArticles } from '@/lib/api/articles';
import { Article } from '@/lib/api/articles';

const debounce = (func: Function, delay: number) => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  return (...args: any[]) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

export default function ArticlesListScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const scrollViewRef = useRef<ScrollView>(null);

  const { data, isLoading, isFetching, refetch } = useArticles({
    page: currentPage,
    limit: 10,
    search: searchQuery.trim() || undefined,
    isPublished: true,
  });

  const articles = data?.articles || [];
  const hasMore = articles.length === 10 && (data?.total || 0) > articles.length;

  const handleSearch = debounce((query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  }, 500);

  const handleLoadMore = () => {
    if (!isFetching && hasMore) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const truncateContent = (content: string, maxLength: number = 120) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  if (isLoading && currentPage === 1) {
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

  return (
    <View style={{ flex: 1, backgroundColor: '#E0F2FE' }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Header */}
      <View style={{ height: 120, position: 'relative' }}>
        <LinearGradient
          colors={['#0284C7', '#06B6D4', '#10B981']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1 }}
        />
        <View
          style={{
            position: 'absolute',
            top: 60,
            left: 0,
            right: 0,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
          }}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text
            style={{
              flex: 1,
              fontSize: 20,
              fontWeight: 'bold',
              color: '#FFFFFF',
              marginLeft: 8,
            }}>
            Tất cả tin tức
          </Text>
          <TouchableOpacity onPress={() => refetch()} style={{ padding: 8 }}>
            <Ionicons name="refresh" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={{ paddingHorizontal: 16, marginTop: -40 }}>
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
            shadowColor: '#0284C7',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 3,
          }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#F9FAFB',
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 12,
            }}>
            <Ionicons name="search-outline" size={20} color="#6B7280" />
            <TextInput
              placeholder="Tìm kiếm bài viết..."
              value={searchQuery}
              onChangeText={handleSearch}
              style={{
                flex: 1,
                marginLeft: 12,
                fontSize: 16,
                color: '#1F2937',
              }}
              placeholderTextColor="#9CA3AF"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery('');
                  setCurrentPage(1);
                }}>
                <Ionicons name="close-circle-outline" size={20} color="#6B7280" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Articles List */}
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        style={{ flex: 1, paddingHorizontal: 16 }}
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          const isCloseToBottom =
            layoutMeasurement.height + contentOffset.y >= contentSize.height - 100;
          if (isCloseToBottom && hasMore && !isFetching) {
            handleLoadMore();
          }
        }}
        scrollEventThrottle={400}>
        {articles.length === 0 && !isLoading ? (
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              padding: 40,
              alignItems: 'center',
              marginTop: 20,
              shadowColor: '#0284C7',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 3,
            }}>
            <Ionicons name="document-text-outline" size={64} color="#9CA3AF" />
            <Text style={{ fontSize: 18, fontWeight: '600', color: '#6B7280', marginTop: 16 }}>
              {searchQuery ? 'Không tìm thấy bài viết nào' : 'Chưa có bài viết nào'}
            </Text>
            <Text style={{ fontSize: 14, color: '#9CA3AF', marginTop: 8, textAlign: 'center' }}>
              {searchQuery ? 'Thử tìm kiếm với từ khóa khác' : 'Các bài viết sẽ sớm được cập nhật'}
            </Text>
          </View>
        ) : (
          <View style={{ gap: 16, paddingBottom: 20 }}>
            {articles.map((article: Article) => (
              <TouchableOpacity
                key={article.id}
                onPress={() => router.push(`/(article)/${article.id}`)}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 16,
                  overflow: 'hidden',
                  shadowColor: '#0284C7',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  elevation: 3,
                }}>
                {/* Image */}
                {article.image ? (
                  <Image
                    source={{ uri: article.image }}
                    style={{
                      width: '100%',
                      height: 180,
                      backgroundColor: '#F3F4F6',
                    }}
                    resizeMode="cover"
                  />
                ) : (
                  <View
                    style={{
                      width: '100%',
                      height: 180,
                      backgroundColor: '#E0F2FE',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}>
                    <Ionicons name="image-outline" size={48} color="#9CA3AF" />
                  </View>
                )}

                <View style={{ padding: 16 }}>
                  {/* Title */}
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: '700',
                      color: '#1F2937',
                      marginBottom: 8,
                      lineHeight: 24,
                    }}
                    numberOfLines={2}>
                    {article.title}
                  </Text>

                  {/* Excerpt or content preview */}
                  <Text
                    style={{
                      fontSize: 14,
                      color: '#6B7280',
                      marginBottom: 12,
                      lineHeight: 20,
                    }}
                    numberOfLines={3}>
                    {article.excerpt || truncateContent(article.content)}
                  </Text>

                  {/* Tags */}
                  {article.tags && article.tags.length > 0 && (
                    <View
                      style={{
                        flexDirection: 'row',
                        flexWrap: 'wrap',
                        gap: 6,
                        marginBottom: 12,
                      }}>
                      {article.tags.slice(0, 3).map((tag) => (
                        <View
                          key={tag.id}
                          style={{
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 12,
                            backgroundColor: '#EFF6FF',
                          }}>
                          <Text style={{ fontSize: 11, color: '#1E40AF', fontWeight: '500' }}>
                            #{tag.name}
                          </Text>
                        </View>
                      ))}
                      {article.tags.length > 3 && (
                        <Text style={{ fontSize: 11, color: '#6B7280', fontWeight: '500' }}>
                          +{article.tags.length - 3}
                        </Text>
                      )}
                    </View>
                  )}

                  {/* Meta info */}
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="calendar-outline" size={16} color="#9CA3AF" />
                        <Text style={{ fontSize: 12, color: '#9CA3AF', marginLeft: 4 }}>
                          {formatDate(article.publishedAt || article.createdAt)}
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="eye-outline" size={16} color="#9CA3AF" />
                        <Text style={{ fontSize: 12, color: '#9CA3AF', marginLeft: 4 }}>
                          {article.views}
                        </Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#0284C7" />
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Loading indicator for load more */}
        {isFetching && currentPage > 1 && (
          <View style={{ paddingVertical: 20, alignItems: 'center' }}>
            <ActivityIndicator size="small" color="#0284C7" />
          </View>
        )}

        {/* End of list indicator */}
        {!hasMore && articles.length > 0 && (
          <View style={{ paddingVertical: 20, alignItems: 'center' }}>
            <Text style={{ fontSize: 14, color: '#9CA3AF' }}>
              Đã hiển thị tất cả {data?.total || 0} bài viết
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
