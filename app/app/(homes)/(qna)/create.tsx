import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useCreateQuestion, useTags } from '@/lib/api/qna';
import { Tag } from '@/types/qna';

export default function CreateQuestionScreen() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedTags, setSelectedTags] = useState<number[]>([]);

  const { data: tagsData } = useTags();
  const createQuestion = useCreateQuestion();

  const tags = tagsData?.tags || [];

  const toggleTag = (tagId: number) => {
    if (selectedTags.includes(tagId)) {
      setSelectedTags(selectedTags.filter((id) => id !== tagId));
    } else {
      if (selectedTags.length >= 5) {
        Alert.alert('Thông báo', 'Bạn chỉ có thể chọn tối đa 5 tags');
        return;
      }
      setSelectedTags([...selectedTags, tagId]);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tiêu đề câu hỏi');
      return;
    }

    if (!content.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập nội dung câu hỏi');
      return;
    }

    if (selectedTags.length === 0) {
      Alert.alert('Lỗi', 'Vui lòng chọn ít nhất 1 tag');
      return;
    }

    try {
      const question = await createQuestion.mutateAsync({
        title: title.trim(),
        content: content.trim(),
        tagIds: selectedTags,
      });
      Alert.alert('Thành công', 'Câu hỏi đã được tạo thành công', [
        {
          text: 'OK',
          onPress: () => {
            router.replace(`/(homes)/(qna)/${question.id}`);
          },
        },
      ]);
    } catch (error: any) {
      Alert.alert('Lỗi', error?.response?.data?.message || 'Không thể tạo câu hỏi');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#E0F2FE' }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

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
            style={{ flex: 1, fontSize: 20, fontWeight: 'bold', color: '#FFFFFF', marginLeft: 8 }}>
            Đặt câu hỏi mới
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16 }}>
        {/* Title Input */}
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
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <Ionicons name="create-outline" size={20} color="#0284C7" />
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#1F2937', marginLeft: 8 }}>
              Tiêu đề câu hỏi
            </Text>
          </View>
          <TextInput
            placeholder="Ví dụ: Làm thế nào để chăm sóc sức khỏe tim mạch?"
            value={title}
            onChangeText={setTitle}
            style={{
              fontSize: 16,
              color: '#1F2937',
              minHeight: 50,
              paddingVertical: 12,
              paddingHorizontal: 12,
              backgroundColor: '#F9FAFB',
              borderRadius: 12,
              borderWidth: 1,
              borderColor: '#E5E7EB',
            }}
            placeholderTextColor="#9CA3AF"
            maxLength={200}
          />
          <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4, textAlign: 'right' }}>
            {title.length}/200
          </Text>
        </View>

        {/* Content Input */}
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
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <Ionicons name="document-text-outline" size={20} color="#0284C7" />
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#1F2937', marginLeft: 8 }}>
              Nội dung câu hỏi
            </Text>
          </View>
          <TextInput
            placeholder="Mô tả chi tiết câu hỏi của bạn..."
            value={content}
            onChangeText={setContent}
            multiline
            numberOfLines={10}
            style={{
              fontSize: 16,
              color: '#1F2937',
              minHeight: 200,
              textAlignVertical: 'top',
              paddingVertical: 12,
              paddingHorizontal: 12,
              backgroundColor: '#F9FAFB',
              borderRadius: 12,
              borderWidth: 1,
              borderColor: '#E5E7EB',
            }}
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* Tags Selection */}
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
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <Ionicons name="pricetags-outline" size={20} color="#0284C7" />
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#1F2937', marginLeft: 8 }}>
              Tags (chọn ít nhất 1, tối đa 5)
            </Text>
          </View>
          <Text style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 12 }}>
            Đã chọn: {selectedTags.length}/5
          </Text>

          {tags.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 20 }}>
              <Ionicons name="pricetags-outline" size={48} color="#9CA3AF" />
              <Text style={{ fontSize: 14, color: '#9CA3AF', marginTop: 8 }}>Chưa có tags nào</Text>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {tags.map((tag: Tag) => {
                const isSelected = selectedTags.includes(tag.id);
                return (
                  <TouchableOpacity
                    key={tag.id}
                    onPress={() => toggleTag(tag.id)}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      borderRadius: 20,
                      backgroundColor: isSelected ? '#0284C7' : '#F3F4F6',
                      borderWidth: 2,
                      borderColor: isSelected ? '#0284C7' : '#E5E7EB',
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                    }}>
                    {isSelected && <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />}
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: '600',
                        color: isSelected ? '#FFFFFF' : '#6B7280',
                      }}>
                      {tag.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={
            createQuestion.isPending ||
            !title.trim() ||
            !content.trim() ||
            selectedTags.length === 0
          }
          style={{
            backgroundColor:
              createQuestion.isPending ||
              !title.trim() ||
              !content.trim() ||
              selectedTags.length === 0
                ? '#9CA3AF'
                : '#0284C7',
            borderRadius: 16,
            paddingVertical: 16,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#0284C7',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 5,
            marginBottom: 32,
          }}>
          {createQuestion.isPending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF' }}>
                Đăng câu hỏi
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
