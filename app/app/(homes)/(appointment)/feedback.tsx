import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useAppointment, useCreateFeedback } from '@/lib/api/appointments';
import { AppointmentStatus } from '@/constants/enum';

export default function FeedbackScreen() {
  const { id } = useLocalSearchParams();
  const appointmentId = Number(id);
  const { data: appointment, isLoading } = useAppointment(appointmentId);
  const createFeedbackMutation = useCreateFeedback();

  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#E0F2FE',
        }}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <ActivityIndicator size="large" color="#0284C7" />
      </View>
    );
  }

  if (!appointment) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#E0F2FE',
        }}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <Text style={{ fontSize: 16, color: '#6B7280' }}>Không tìm thấy lịch hẹn</Text>
      </View>
    );
  }

  // Kiểm tra appointment đã hoàn thành chưa
  if (appointment.status !== AppointmentStatus.COMPLETED) {
    return (
      <View style={{ flex: 1, backgroundColor: '#E0F2FE' }}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <LinearGradient
          colors={['#0284C7', '#06B6D4', '#10B981']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ paddingTop: 60, paddingBottom: 24, paddingHorizontal: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'white' }}>Đánh giá</Text>
          </View>
        </LinearGradient>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Ionicons name="alert-circle-outline" size={64} color="#F59E0B" />
          <Text
            style={{
              fontSize: 18,
              fontWeight: 'bold',
              color: '#1F2937',
              marginTop: 16,
              textAlign: 'center',
            }}>
            Chỉ có thể đánh giá cho lịch hẹn đã hoàn thành
          </Text>
          <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 8, textAlign: 'center' }}>
            Vui lòng đợi đến khi lịch hẹn kết thúc để đánh giá
          </Text>
        </View>
      </View>
    );
  }

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Lỗi', 'Vui lòng chọn số sao đánh giá');
      return;
    }

    setIsSubmitting(true);
    try {
      await createFeedbackMutation.mutateAsync({
        appointmentId,
        data: {
          rating,
          comment: comment.trim() || undefined,
        },
      });
      Alert.alert('Thành công', 'Cảm ơn bạn đã đánh giá!', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      Alert.alert('Lỗi', error?.response?.data?.message || 'Có lỗi xảy ra khi gửi đánh giá');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#E0F2FE' }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Header */}
      <LinearGradient
        colors={['#0284C7', '#06B6D4', '#10B981']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingTop: 60, paddingBottom: 24, paddingHorizontal: 24 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'white' }}>Đánh giá bác sĩ</Text>
        </View>
      </LinearGradient>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24 }}>
        {/* Doctor Info */}
        <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1F2937', marginBottom: 12 }}>
            Thông tin bác sĩ
          </Text>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#1F2937' }}>
            BS. {appointment.doctor.firstName} {appointment.doctor.lastName}
          </Text>
          <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 4 }}>
            {appointment.service.name}
          </Text>
        </View>

        {/* Rating Section */}
        <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1F2937', marginBottom: 16 }}>
            Đánh giá của bạn <Text style={{ color: '#EF4444' }}>*</Text>
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 16 }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
                style={{ marginHorizontal: 8 }}>
                <Ionicons
                  name={star <= rating ? 'star' : 'star-outline'}
                  size={48}
                  color={star <= rating ? '#FBBF24' : '#D1D5DB'}
                />
              </TouchableOpacity>
            ))}
          </View>
          <Text style={{ fontSize: 14, color: '#6B7280', textAlign: 'center' }}>
            {rating === 0
              ? 'Chọn số sao đánh giá'
              : rating === 1
                ? 'Rất không hài lòng'
                : rating === 2
                  ? 'Không hài lòng'
                  : rating === 3
                    ? 'Bình thường'
                    : rating === 4
                      ? 'Hài lòng'
                      : 'Rất hài lòng'}
          </Text>
        </View>

        {/* Comment Section */}
        <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1F2937', marginBottom: 12 }}>
            Ghi chú (tùy chọn)
          </Text>
          <TextInput
            style={{
              borderWidth: 1,
              borderColor: '#D1D5DB',
              borderRadius: 8,
              padding: 12,
              minHeight: 100,
              textAlignVertical: 'top',
              fontSize: 14,
              color: '#1F2937',
            }}
            placeholder="Chia sẻ thêm về trải nghiệm của bạn..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={4}
            value={comment}
            onChangeText={setComment}
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isSubmitting || rating === 0}
          style={{
            backgroundColor: rating === 0 ? '#D1D5DB' : '#0284C7',
            borderRadius: 12,
            padding: 16,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            opacity: isSubmitting ? 0.6 : 1,
          }}>
          {isSubmitting ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: 'white', marginRight: 8 }}>
                Gửi đánh giá
              </Text>
              <Ionicons name="send" size={20} color="white" />
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
