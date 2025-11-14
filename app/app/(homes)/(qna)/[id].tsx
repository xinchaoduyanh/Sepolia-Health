import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import {
  useQuestion,
  useCreateAnswer,
  useVoteQuestion,
  useVoteAnswer,
  useSetBestAnswer,
  useDeleteQuestion,
  useDeleteAnswer,
} from '@/lib/api/qna';
import { Answer, VoteType } from '@/types/qna';
import { useAuth } from '@/lib/hooks/useAuth';

export default function QuestionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const questionId = parseInt(id || '0');
  const { user } = useAuth();

  const [answerContent, setAnswerContent] = useState('');
  const [showAnswerInput, setShowAnswerInput] = useState(false);
  const [showEditHistory, setShowEditHistory] = useState(false);

  const { data: question, isLoading } = useQuestion(questionId);
  const createAnswer = useCreateAnswer();
  const voteQuestion = useVoteQuestion();
  const voteAnswer = useVoteAnswer();
  const setBestAnswer = useSetBestAnswer();
  const deleteQuestion = useDeleteQuestion();
  const deleteAnswer = useDeleteAnswer();

  const isAuthor = question?.author.id === user?.id;
  const isAdmin = user?.role === 'ADMIN';

  const handleVoteQuestion = async (voteType: VoteType) => {
    try {
      await voteQuestion.mutateAsync({ id: questionId, data: { voteType } });
    } catch {
      Alert.alert('Lỗi', 'Không thể vote câu hỏi');
    }
  };

  const handleVoteAnswer = async (answerId: number, voteType: VoteType) => {
    try {
      await voteAnswer.mutateAsync({ id: answerId, data: { voteType } });
    } catch {
      Alert.alert('Lỗi', 'Không thể vote câu trả lời');
    }
  };

  const handleCreateAnswer = async () => {
    if (!answerContent.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập nội dung câu trả lời');
      return;
    }

    try {
      await createAnswer.mutateAsync({
        questionId,
        data: { content: answerContent },
      });
      setAnswerContent('');
      setShowAnswerInput(false);
    } catch {
      Alert.alert('Lỗi', 'Không thể tạo câu trả lời');
    }
  };

  const handleSetBestAnswer = async (answerId: number) => {
    Alert.alert('Xác nhận', 'Bạn có chắc muốn chọn câu trả lời này là best answer?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xác nhận',
        onPress: async () => {
          try {
            await setBestAnswer.mutateAsync({
              questionId,
              data: { answerId },
            });
          } catch {
            Alert.alert('Lỗi', 'Không thể chọn best answer');
          }
        },
      },
    ]);
  };

  const handleDeleteQuestion = () => {
    Alert.alert('Xác nhận', 'Bạn có chắc muốn xóa câu hỏi này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteQuestion.mutateAsync(questionId);
            router.back();
          } catch {
            Alert.alert('Lỗi', 'Không thể xóa câu hỏi');
          }
        },
      },
    ]);
  };

  const handleDeleteAnswer = (answerId: number) => {
    Alert.alert('Xác nhận', 'Bạn có chắc muốn xóa câu trả lời này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteAnswer.mutateAsync(answerId);
          } catch {
            Alert.alert('Lỗi', 'Không thể xóa câu trả lời');
          }
        },
      },
    ]);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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

  if (!question) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#E0F2FE',
        }}>
        <Ionicons name="help-circle-outline" size={64} color="#9CA3AF" />
        <Text style={{ fontSize: 18, fontWeight: '600', color: '#6B7280', marginTop: 16 }}>
          Không tìm thấy câu hỏi
        </Text>
      </View>
    );
  }

  const roleBadge = getRoleBadgeColor(question.author.role);
  const sortedAnswers = [...(question.answers || [])].sort((a, b) => {
    if (a.isBestAnswer) return -1;
    if (b.isBestAnswer) return 1;
    return b.voteScore - a.voteScore;
  });

  return (
    <View style={{ flex: 1, backgroundColor: '#E0F2FE' }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        {/* Header */}
        <View style={{ height: 200, position: 'relative' }}>
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
              Chi tiết câu hỏi
            </Text>
            {(isAuthor || isAdmin) && (
              <TouchableOpacity onPress={handleDeleteQuestion} style={{ padding: 8 }}>
                <Ionicons name="trash-outline" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={{ padding: 16, marginTop: -50 }}>
          {/* Question Card */}
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
            {/* Author Info */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: roleBadge.bg,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: roleBadge.text }}>
                  {question.author.fullName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#1F2937' }}>
                    {question.author.fullName}
                  </Text>
                  <View
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 12,
                      backgroundColor: roleBadge.bg,
                    }}>
                    <Text style={{ fontSize: 11, fontWeight: '600', color: roleBadge.text }}>
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
                fontSize: 22,
                fontWeight: '700',
                color: '#1F2937',
                marginBottom: 12,
                lineHeight: 30,
              }}>
              {question.title}
            </Text>

            {/* Content */}
            <Text style={{ fontSize: 16, color: '#374151', marginBottom: 16, lineHeight: 24 }}>
              {question.content}
            </Text>

            {/* Tags */}
            {question.tags.length > 0 && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                {question.tags.map((tag) => (
                  <View
                    key={tag.id}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 16,
                      backgroundColor: '#F3F4F6',
                    }}>
                    <Text style={{ fontSize: 13, color: '#6B7280', fontWeight: '500' }}>
                      {tag.name}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Stats & Actions */}
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-4">
                <View className="flex-row items-center gap-1">
                  <Ionicons name="eye-outline" size={18} color="#9CA3AF" />
                  <Text className="text-sm text-gray-400">{question.views}</Text>
                </View>
                <View className="flex-row items-center gap-1">
                  <Ionicons name="chatbubbles-outline" size={18} color="#0284C7" />
                  <Text className="text-sm font-semibold text-sky-600">{question.answerCount}</Text>
                </View>
              </View>

              {/* Vote Buttons */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <TouchableOpacity
                  onPress={() => handleVoteQuestion('UP')}
                  className="flex-row items-center rounded-full border border-green-500 bg-green-50 px-3 py-1.5">
                  <Ionicons name="thumbs-up" size={18} color="#10B981" />
                  <Text className="ml-1 text-sm font-semibold text-green-500">
                    {question.upvotes}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleVoteQuestion('DOWN')}
                  className="flex-row items-center rounded-full border border-red-500 bg-red-50 px-3 py-1.5">
                  <Ionicons name="thumbs-down" size={18} color="#EF4444" />
                  <Text className="ml-1 text-sm font-semibold text-red-500">
                    {question.downvotes}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Edit History Button */}
            {question.editHistory && question.editHistory.length > 0 && (
              <TouchableOpacity
                onPress={() => setShowEditHistory(true)}
                className="mt-3 flex-row items-center gap-1.5 py-2">
                <Ionicons name="time-outline" size={16} color="#6B7280" />
                <Text className="text-xs text-gray-600">
                  Đã chỉnh sửa {question.editHistory.length} lần
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Answers Section */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
            }}>
            <Text style={{ fontSize: 20, fontWeight: '700', color: '#1F2937' }}>
              Câu trả lời ({question.answerCount})
            </Text>
            <TouchableOpacity
              onPress={() => setShowAnswerInput(!showAnswerInput)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: '#0284C7',
              }}>
              <Ionicons name="add-circle" size={18} color="#FFFFFF" />
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#FFFFFF', marginLeft: 6 }}>
                Trả lời
              </Text>
            </TouchableOpacity>
          </View>

          {/* Answer Input */}
          {showAnswerInput && (
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
              <TextInput
                placeholder="Viết câu trả lời của bạn..."
                value={answerContent}
                onChangeText={setAnswerContent}
                multiline
                numberOfLines={6}
                style={{
                  minHeight: 120,
                  textAlignVertical: 'top',
                  fontSize: 16,
                  color: '#1F2937',
                  marginBottom: 12,
                }}
                placeholderTextColor="#9CA3AF"
              />
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
                <TouchableOpacity
                  onPress={() => {
                    setShowAnswerInput(false);
                    setAnswerContent('');
                  }}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 8,
                    backgroundColor: '#F3F4F6',
                  }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#6B7280' }}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleCreateAnswer}
                  disabled={createAnswer.isPending}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 8,
                    backgroundColor: '#0284C7',
                    opacity: createAnswer.isPending ? 0.5 : 1,
                  }}>
                  {createAnswer.isPending ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#FFFFFF' }}>Gửi</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Answers List */}
          {sortedAnswers.length === 0 ? (
            <View
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                padding: 32,
                alignItems: 'center',
                shadowColor: '#0284C7',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 3,
              }}>
              <Ionicons name="chatbubbles-outline" size={48} color="#9CA3AF" />
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#6B7280', marginTop: 12 }}>
                Chưa có câu trả lời nào
              </Text>
              <Text style={{ fontSize: 14, color: '#9CA3AF', marginTop: 4, textAlign: 'center' }}>
                Hãy là người đầu tiên trả lời câu hỏi này!
              </Text>
            </View>
          ) : (
            <View style={{ gap: 16 }}>
              {sortedAnswers.map((answer: Answer) => {
                const answerRoleBadge = getRoleBadgeColor(answer.author.role);
                return (
                  <View
                    key={answer.id}
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: 16,
                      padding: 16,
                      borderWidth: answer.isBestAnswer ? 2 : 0,
                      borderColor: '#10B981',
                      shadowColor: '#0284C7',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 8,
                      elevation: 3,
                    }}>
                    {answer.isBestAnswer && (
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          backgroundColor: '#D1FAE5',
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 12,
                          marginBottom: 12,
                        }}>
                        <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: '600',
                            color: '#10B981',
                            marginLeft: 6,
                          }}>
                          Câu trả lời tốt nhất
                        </Text>
                      </View>
                    )}

                    {/* Author Info */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                      <View
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 20,
                          backgroundColor: answerRoleBadge.bg,
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: 12,
                        }}>
                        <Text
                          style={{ fontSize: 16, fontWeight: 'bold', color: answerRoleBadge.text }}>
                          {answer.author.fullName.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 6,
                            flexWrap: 'wrap',
                          }}>
                          <Text style={{ fontSize: 14, fontWeight: '600', color: '#1F2937' }}>
                            {answer.author.fullName}
                          </Text>
                          {/* Tác giả badge */}
                          {answer.author.id === question.author.id && (
                            <View
                              style={{
                                paddingHorizontal: 8,
                                paddingVertical: 3,
                                borderRadius: 10,
                                backgroundColor: '#FEF3C7',
                                borderWidth: 1,
                                borderColor: '#F59E0B',
                              }}>
                              <Text
                                style={{
                                  fontSize: 10,
                                  fontWeight: '600',
                                  color: '#D97706',
                                }}>
                                Tác giả
                              </Text>
                            </View>
                          )}
                          {/* Bác sĩ badge */}
                          {answer.author.role === 'DOCTOR' && (
                            <View
                              style={{
                                paddingHorizontal: 8,
                                paddingVertical: 3,
                                borderRadius: 10,
                                backgroundColor: answerRoleBadge.bg,
                              }}>
                              <Text
                                style={{
                                  fontSize: 10,
                                  fontWeight: '600',
                                  color: answerRoleBadge.text,
                                }}>
                                Bác sĩ
                              </Text>
                            </View>
                          )}
                          {/* Role badge khác (nếu không phải bác sĩ) */}
                          {answer.author.role !== 'DOCTOR' && (
                            <View
                              style={{
                                paddingHorizontal: 6,
                                paddingVertical: 2,
                                borderRadius: 10,
                                backgroundColor: answerRoleBadge.bg,
                              }}>
                              <Text
                                style={{
                                  fontSize: 10,
                                  fontWeight: '600',
                                  color: answerRoleBadge.text,
                                }}>
                                {getRoleLabel(answer.author.role)}
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>
                          {formatDate(answer.createdAt)}
                        </Text>
                      </View>
                      {(isAuthor || isAdmin || answer.author.id === user?.id) && (
                        <TouchableOpacity
                          onPress={() => handleDeleteAnswer(answer.id)}
                          style={{ padding: 4 }}>
                          <Ionicons name="trash-outline" size={18} color="#EF4444" />
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* Content */}
                    <Text
                      style={{ fontSize: 15, color: '#374151', marginBottom: 12, lineHeight: 22 }}>
                      {answer.content}
                    </Text>

                    {/* Actions */}
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <TouchableOpacity
                          onPress={() => handleVoteAnswer(answer.id, 'UP')}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingHorizontal: 10,
                            paddingVertical: 4,
                            borderRadius: 16,
                            backgroundColor: '#F0FDF4',
                            borderWidth: 1,
                            borderColor: '#10B981',
                          }}>
                          <Ionicons name="thumbs-up" size={16} color="#10B981" />
                          <Text
                            style={{
                              fontSize: 12,
                              color: '#10B981',
                              fontWeight: '600',
                              marginLeft: 4,
                            }}>
                            {answer.upvotes}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleVoteAnswer(answer.id, 'DOWN')}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingHorizontal: 10,
                            paddingVertical: 4,
                            borderRadius: 16,
                            backgroundColor: '#FEF2F2',
                            borderWidth: 1,
                            borderColor: '#EF4444',
                          }}>
                          <Ionicons name="thumbs-down" size={16} color="#EF4444" />
                          <Text
                            style={{
                              fontSize: 12,
                              color: '#EF4444',
                              fontWeight: '600',
                              marginLeft: 4,
                            }}>
                            {answer.downvotes}
                          </Text>
                        </TouchableOpacity>
                      </View>

                      {isAuthor && !answer.isBestAnswer && (
                        <TouchableOpacity
                          onPress={() => handleSetBestAnswer(answer.id)}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            borderRadius: 16,
                            backgroundColor: '#F0FDF4',
                            borderWidth: 1,
                            borderColor: '#10B981',
                          }}>
                          <Ionicons name="star-outline" size={16} color="#10B981" />
                          <Text
                            style={{
                              fontSize: 12,
                              fontWeight: '600',
                              color: '#10B981',
                              marginLeft: 4,
                            }}>
                            Chọn best answer
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Edit History Modal */}
      <Modal visible={showEditHistory} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 24,
              maxHeight: '80%',
            }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 20,
              }}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#1F2937' }}>
                Lịch sử chỉnh sửa
              </Text>
              <TouchableOpacity onPress={() => setShowEditHistory(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {question.editHistory?.map((history) => (
                <View
                  key={history.id}
                  style={{
                    padding: 16,
                    backgroundColor: '#F9FAFB',
                    borderRadius: 12,
                    marginBottom: 12,
                  }}>
                  <Text style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 8 }}>
                    {formatDate(history.createdAt)} bởi {history.editor.fullName}
                  </Text>
                  {history.oldTitle && history.newTitle && (
                    <View style={{ marginBottom: 8 }}>
                      <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>
                        Tiêu đề:
                      </Text>
                      <Text style={{ fontSize: 13, color: '#EF4444' }}>- {history.oldTitle}</Text>
                      <Text style={{ fontSize: 13, color: '#10B981' }}>+ {history.newTitle}</Text>
                    </View>
                  )}
                  {history.oldContent && history.newContent && (
                    <View>
                      <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>
                        Nội dung:
                      </Text>
                      <Text style={{ fontSize: 13, color: '#EF4444' }}>- {history.oldContent}</Text>
                      <Text style={{ fontSize: 13, color: '#10B981' }}>+ {history.newContent}</Text>
                    </View>
                  )}
                  {history.reason && (
                    <Text
                      style={{ fontSize: 12, color: '#6B7280', marginTop: 8, fontStyle: 'italic' }}>
                      Lý do: {history.reason}
                    </Text>
                  )}
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
