import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { router } from 'expo-router';
import { useQuestions, usePopularTags } from '@/lib/api/qna';
import { Question } from '@/types/qna';

export default function QnaListScreen() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'mostVoted' | 'mostAnswered' | 'unanswered'>(
    'newest'
  );
  const [refreshing, setRefreshing] = useState(false);

  const filters = {
    page,
    limit: 10,
    search: search || undefined,
    tagIds: selectedTag ? [selectedTag] : undefined,
    sortBy,
  };

  const { data: questionsData, isLoading, refetch } = useQuestions(filters);
  const { data: tagsData } = usePopularTags();

  const questions = questionsData?.questions || [];
  const total = questionsData?.total || 0;
  const tags = tagsData?.tags || [];

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const toggleTag = (tagId: number) => {
    // Chỉ cho phép chọn 1 tag: nếu đã chọn tag này thì hủy, nếu chọn tag khác thì thay thế
    setSelectedTag((prev) => (prev === tagId ? null : tagId));
    setPage(1);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Hôm nay';
    if (days === 1) return 'Hôm qua';
    if (days < 7) return `${days} ngày trước`;
    if (days < 30) return `${Math.floor(days / 7)} tuần trước`;
    return date.toLocaleDateString('vi-VN');
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'DOCTOR':
        return { bg: '#DBEAFE', text: '#1E40AF' };
      case 'RECEPTIONIST':
        return { bg: '#F3E8FF', text: '#7C3AED' };
      case 'ADMIN':
        return { bg: '#FEE2E2', text: '#DC2626' };
      default:
        return { bg: '#F3F4F6', text: '#6B7280' };
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'DOCTOR':
        return 'Bác sĩ';
      case 'RECEPTIONIST':
        return 'Lễ tân';
      case 'ADMIN':
        return 'Admin';
      default:
        return 'Người dùng';
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#E0F2FE' }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {/* Header Gradient */}
        <View style={{ height: 280, position: 'relative', marginTop: -60 }}>
          <LinearGradient
            colors={['#0284C7', '#06B6D4', '#10B981']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ flex: 1 }}
          />
          <Svg
            height="70"
            width="200%"
            viewBox="0 0 1440 120"
            style={{ position: 'absolute', bottom: -1, left: 0, right: 0 }}>
            <Path d="M0,0 Q720,120 1440,0 L1440,120 L0,120 Z" fill="#E0F2FE" />
          </Svg>

          <View
            style={{
              position: 'absolute',
              top: 120,
              left: 24,
              right: 24,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
            <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#FFFFFF' }}>
              Hỏi đáp cộng đồng
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(homes)/(qna)/create')}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: 'rgba(255,255,255,0.25)',
                borderRadius: 999,
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.3)',
              }}>
              <Ionicons name="add-circle" size={18} color="#FFFFFF" />
              <Text style={{ marginLeft: 6, fontSize: 14, fontWeight: '600', color: '#FFFFFF' }}>
                Đặt câu hỏi
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ paddingHorizontal: 24, marginTop: -100, marginBottom: 24 }}>
          {/* Search Bar */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#FFFFFF',
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 12,
              marginBottom: 16,
              shadowColor: '#0284C7',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}>
            <Ionicons name="search" size={20} color="#6B7280" />
            <TextInput
              placeholder="Tìm kiếm câu hỏi..."
              value={search}
              onChangeText={setSearch}
              style={{ flex: 1, marginLeft: 12, fontSize: 16, color: '#1F2937' }}
              placeholderTextColor="#9CA3AF"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>

          {/* Sort Options */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {[
                { key: 'newest', label: 'Mới nhất', icon: 'time-outline' },
                { key: 'mostVoted', label: 'Nhiều vote', icon: 'thumbs-up-outline' },
                { key: 'mostAnswered', label: 'Nhiều trả lời', icon: 'chatbubbles-outline' },
                { key: 'unanswered', label: 'Chưa trả lời', icon: 'help-circle-outline' },
              ].map((option) => (
                <TouchableOpacity
                  key={option.key}
                  onPress={() => {
                    setSortBy(option.key as any);
                    setPage(1);
                  }}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 20,
                    backgroundColor: sortBy === option.key ? '#0284C7' : '#FFFFFF',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    borderWidth: 1,
                    borderColor: sortBy === option.key ? '#0284C7' : '#E5E7EB',
                  }}>
                  <Ionicons
                    name={option.icon as any}
                    size={16}
                    color={sortBy === option.key ? '#FFFFFF' : '#6B7280'}
                  />
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '600',
                      color: sortBy === option.key ? '#FFFFFF' : '#6B7280',
                    }}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Popular Tags */}
          {tags.length > 0 && (
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 8 }}>
                Tags phổ biến
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {tags.map((tag) => (
                    <TouchableOpacity
                      key={tag.id}
                      onPress={() => toggleTag(tag.id)}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        borderRadius: 20,
                        backgroundColor: selectedTag === tag.id ? '#0284C7' : '#F3F4F6',
                        borderWidth: 1,
                        borderColor: selectedTag === tag.id ? '#0284C7' : '#E5E7EB',
                      }}>
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: '500',
                          color: selectedTag === tag.id ? '#FFFFFF' : '#6B7280',
                        }}>
                        {tag.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          {/* Questions List */}
          {isLoading ? (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <ActivityIndicator size="large" color="#0284C7" />
            </View>
          ) : questions.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <Ionicons name="help-circle-outline" size={64} color="#9CA3AF" />
              <Text style={{ fontSize: 18, fontWeight: '600', color: '#6B7280', marginTop: 16 }}>
                Chưa có câu hỏi nào
              </Text>
              <Text style={{ fontSize: 14, color: '#9CA3AF', marginTop: 8, textAlign: 'center' }}>
                Hãy là người đầu tiên đặt câu hỏi!
              </Text>
            </View>
          ) : (
            <View style={{ gap: 16 }}>
              {questions.map((question: Question) => {
                const roleBadge = getRoleBadgeColor(question.author.role);
                return (
                  <TouchableOpacity
                    key={question.id}
                    activeOpacity={0.7}
                    onPress={() => router.push(`/(homes)/(qna)/${question.id}`)}
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: 16,
                      padding: 16,
                      shadowColor: '#0284C7',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 8,
                      elevation: 3,
                    }}>
                    {/* Header */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                      <View
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 20,
                          backgroundColor: roleBadge.bg,
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: 12,
                        }}>
                        <Text style={{ fontSize: 16, fontWeight: 'bold', color: roleBadge.text }}>
                          {question.author.fullName.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Text style={{ fontSize: 14, fontWeight: '600', color: '#1F2937' }}>
                            {question.author.fullName}
                          </Text>
                          <View
                            style={{
                              paddingHorizontal: 8,
                              paddingVertical: 2,
                              borderRadius: 12,
                              backgroundColor: roleBadge.bg,
                            }}>
                            <Text
                              style={{ fontSize: 10, fontWeight: '600', color: roleBadge.text }}>
                              {getRoleLabel(question.author.role)}
                            </Text>
                          </View>
                        </View>
                        <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>
                          {formatDate(question.createdAt)}
                        </Text>
                      </View>
                    </View>

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
                      {question.title}
                    </Text>

                    {/* Content Preview */}
                    <Text
                      style={{
                        fontSize: 14,
                        color: '#6B7280',
                        marginBottom: 12,
                        lineHeight: 20,
                      }}
                      numberOfLines={2}>
                      {question.content}
                    </Text>

                    {/* Tags */}
                    {question.tags.length > 0 && (
                      <View
                        style={{
                          flexDirection: 'row',
                          flexWrap: 'wrap',
                          gap: 6,
                          marginBottom: 12,
                        }}>
                        {question.tags.map((tag) => (
                          <View
                            key={tag.id}
                            style={{
                              paddingHorizontal: 10,
                              paddingVertical: 4,
                              borderRadius: 12,
                              backgroundColor: '#F3F4F6',
                            }}>
                            <Text style={{ fontSize: 12, color: '#6B7280' }}>{tag.name}</Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Stats */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Ionicons name="eye-outline" size={16} color="#9CA3AF" />
                        <Text style={{ fontSize: 12, color: '#9CA3AF' }}>{question.views}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Ionicons name="thumbs-up-outline" size={16} color="#10B981" />
                        <Text style={{ fontSize: 12, color: '#10B981', fontWeight: '600' }}>
                          {question.voteScore}
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Ionicons name="chatbubbles-outline" size={16} color="#0284C7" />
                        <Text style={{ fontSize: 12, color: '#0284C7', fontWeight: '600' }}>
                          {question.answerCount}
                        </Text>
                      </View>
                      {question.hasBestAnswer && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                          <Text style={{ fontSize: 12, color: '#10B981', fontWeight: '600' }}>
                            Đã giải đáp
                          </Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Pagination */}
          {total > 10 && (
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 12,
                marginTop: 24,
              }}>
              <TouchableOpacity
                onPress={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 8,
                  backgroundColor: page === 1 ? '#F3F4F6' : '#FFFFFF',
                  borderWidth: 1,
                  borderColor: '#E5E7EB',
                }}>
                <Ionicons
                  name="chevron-back"
                  size={20}
                  color={page === 1 ? '#9CA3AF' : '#0284C7'}
                />
              </TouchableOpacity>
              <Text style={{ fontSize: 14, color: '#6B7280' }}>
                Trang {page} / {Math.ceil(total / 10)}
              </Text>
              <TouchableOpacity
                onPress={() => setPage((p) => Math.min(Math.ceil(total / 10), p + 1))}
                disabled={page >= Math.ceil(total / 10)}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 8,
                  backgroundColor: page >= Math.ceil(total / 10) ? '#F3F4F6' : '#FFFFFF',
                  borderWidth: 1,
                  borderColor: '#E5E7EB',
                }}>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={page >= Math.ceil(total / 10) ? '#9CA3AF' : '#0284C7'}
                />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
