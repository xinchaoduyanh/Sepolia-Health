import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Image,
  Dimensions,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useArticle, useIncrementViews } from '@/lib/api/articles';
import { Article } from '@/lib/api/articles';

const { width: screenWidth } = Dimensions.get('window');

export default function ArticleIdPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const articleId = parseInt(id || '0');

  const [hasIncrementedViews, setHasIncrementedViews] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const { data: article, isLoading, error, refetch, isFetching } = useArticle(articleId);
  const incrementViewsMutation = useIncrementViews();

  useEffect(() => {
    if (article && !hasIncrementedViews && articleId > 0) {
      incrementViewsMutation.mutate(articleId);
      setHasIncrementedViews(true);
    }
  }, [article, hasIncrementedViews, articleId, incrementViewsMutation]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ).start();

    try {
      await refetch();
    } catch {
      // Handle error silently or show toast
    } finally {
      setIsRefreshing(false);
      rotateAnim.setValue(0);
    }
  };

  useEffect(() => {
    if (isRefreshing || isFetching) {
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ).start();
    } else {
      rotateAnim.setValue(0);
    }
  }, [isRefreshing, isFetching]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

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

  if (error || !article) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#E0F2FE',
          paddingHorizontal: 24,
        }}>
        <Ionicons name="document-text-outline" size={64} color="#9CA3AF" />
        <Text
          style={{
            fontSize: 18,
            fontWeight: '600',
            color: '#6B7280',
            marginTop: 16,
            textAlign: 'center',
          }}>
          Không tìm thấy bài viết
        </Text>
        <Text style={{ fontSize: 14, color: '#9CA3AF', marginTop: 8, textAlign: 'center' }}>
          {error?.message || 'Bài viết này có thể đã bị xóa hoặc không tồn tại'}
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            marginTop: 24,
            paddingHorizontal: 24,
            paddingVertical: 12,
            backgroundColor: '#0284C7',
            borderRadius: 12,
          }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#FFFFFF' }}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#E0F2FE' }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        {/* Header with Gradient */}
        <View style={{ height: 200, position: 'relative' }}>
          <LinearGradient
            colors={['#0284C7', '#06B6D4', '#10B981']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ flex: 1 }}
          />

          {/* Back and Refresh buttons */}
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
              Chi tiết tin tức
            </Text>
            <TouchableOpacity
              onPress={handleRefresh}
              disabled={isRefreshing || isFetching}
              style={{ padding: 8, marginRight: 4 }}>
              <Animated.View style={{ transform: [{ rotate: spin }] }}>
                <Ionicons name="refresh" size={24} color="#FFFFFF" />
              </Animated.View>
            </TouchableOpacity>
          </View>

          {/* Featured image overlay */}
          {article.image && (
            <Image
              source={{ uri: article.image }}
              style={{
                position: 'absolute',
                bottom: 0,
                left: 16,
                right: 16,
                height: 120,
                borderRadius: 12,
                backgroundColor: '#FFFFFF',
              }}
              resizeMode="cover"
            />
          )}
        </View>

        <View style={{ padding: 16, marginTop: 60 }}>
          {/* Article Card */}
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              padding: 20,
              marginBottom: 16,
              shadowColor: '#0284C7',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 3,
            }}>
            {/* Title */}
            <Text
              style={{
                fontSize: 24,
                fontWeight: '700',
                color: '#1F2937',
                marginBottom: 16,
                lineHeight: 32,
              }}>
              {article.title}
            </Text>

            {/* Meta Info */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 16,
                paddingBottom: 16,
                borderBottomWidth: 1,
                borderBottomColor: '#E5E7EB',
              }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                {article.publishedAt && (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="calendar-outline" size={18} color="#6B7280" />
                    <Text style={{ fontSize: 14, color: '#6B7280', marginLeft: 6 }}>
                      {formatDate(article.publishedAt)}
                    </Text>
                  </View>
                )}
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="eye-outline" size={18} color="#6B7280" />
                  <Text style={{ fontSize: 14, color: '#6B7280', marginLeft: 6 }}>
                    {article.views} lượt xem
                  </Text>
                </View>
              </View>
            </View>

            {/* Tags */}
            {article.tags && article.tags.length > 0 && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                {article.tags.map((tag) => (
                  <View
                    key={tag.id}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 16,
                      backgroundColor: '#EFF6FF',
                      borderWidth: 1,
                      borderColor: '#DBEAFE',
                    }}>
                    <Text style={{ fontSize: 13, color: '#1E40AF', fontWeight: '500' }}>
                      #{tag.name}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Excerpt */}
            {article.excerpt && (
              <View
                style={{
                  backgroundColor: '#F0F9FF',
                  padding: 16,
                  borderRadius: 12,
                  marginBottom: 20,
                  borderLeftWidth: 4,
                  borderLeftColor: '#0284C7',
                }}>

            
                <Text
                  style={{ fontSize: 16, color: '#0C4A6E', fontStyle: 'italic', lineHeight: 24 }}>

                  {article.excerpt}
                </Text>
              </View>
            )}

            {/* Content */}
            <View style={{ marginBottom: 20 }}>
              {article.content.split('\n').map((paragraph, index) =>
                paragraph.trim() ? (
                  <Text
                    key={index}
                    style={{
                      fontSize: 16,
                      color: '#374151',
                      lineHeight: 26,
                      marginBottom: 16,
                      textAlign: 'justify',
                    }}>
                    {paragraph}
                  </Text>
                ) : (
                  <View key={index} style={{ height: 16 }} />
                )
              )}
            </View>

            {/* Additional Images */}
            {article.images && article.images.length > 0 && (
              <View style={{ marginTop: 20 }}>
                <Text
                  style={{ fontSize: 18, fontWeight: '600', color: '#1F2937', marginBottom: 16 }}>
                  Hình ảnh bài viết
                </Text>
                {article.images
                  .sort((a, b) => a.order - b.order)
                  .map((image, index) => (
                    <View key={image.id} style={{ marginBottom: 16 }}>
                      <Image
                        source={{ uri: image.url }}
                        style={{
                          width: '100%',
                          height: 200,
                          borderRadius: 12,
                          backgroundColor: '#F3F4F6',
                        }}
                        resizeMode="cover"
                      />
                      {image.alt && (
                        <Text
                          style={{
                            fontSize: 14,
                            color: '#6B7280',
                            marginTop: 8,
                            textAlign: 'center',
                            fontStyle: 'italic',
                          }}>
                          {image.alt}
                        </Text>
                      )}
                    </View>
                  ))}
              </View>
            )}
          </View>

          {/* Related Info Card */}
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              padding: 20,
              shadowColor: '#0284C7',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 3,
            }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: '#1F2937', marginBottom: 12 }}>
              Thông tin bài viết
            </Text>

            <View style={{ gap: 12 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 14, color: '#6B7280' }}>Ngày tạo:</Text>
                <Text style={{ fontSize: 14, color: '#374151', fontWeight: '500' }}>
                  {formatDate(article.createdAt)}
                </Text>
              </View>

              {article.updatedAt !== article.createdAt && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 14, color: '#6B7280' }}>Cập nhật lần cuối:</Text>
                  <Text style={{ fontSize: 14, color: '#374151', fontWeight: '500' }}>
                    {formatDate(article.updatedAt)}
                  </Text>
                </View>
              )}

              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 14, color: '#6B7280' }}>Trạng thái:</Text>
                <View
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 8,
                    backgroundColor: '#D1FAE5',
                  }}>
                  <Text style={{ fontSize: 12, color: '#065F46', fontWeight: '600' }}>
                    Đã xuất bản
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Bottom padding */}
          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </View>
  );
}
