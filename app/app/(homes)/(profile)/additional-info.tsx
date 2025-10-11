'use client';

import { View, Text, TouchableOpacity, ScrollView, StatusBar, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function AdditionalInfoScreen() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

      {/* Header */}
      <View
        style={{
          backgroundColor: '#F0FDFA',
          paddingTop: 60,
          paddingBottom: 20,
          paddingHorizontal: 24,
          borderBottomWidth: 1,
          borderBottomColor: '#E0F2FE',
        }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => router.push('/(profile)/' as any)}>
            <Ionicons name="arrow-back" size={24} color="#0F172A" />
          </TouchableOpacity>
          <Text
            style={{
              fontSize: 18,
              fontWeight: 'bold',
              color: '#0F172A',
              marginLeft: 16,
              flex: 1,
            }}>
            Thông tin bổ sung
          </Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={{ padding: 24 }}>
          {/* Form Input Fields */}
          <View style={{ marginBottom: 24 }}>
            <View
              style={{
                backgroundColor: '#F0FDFA',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#E0F2FE',
                overflow: 'hidden',
              }}>
              {/* Số CMT/Hộ chiếu */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: '#E0F2FE',
                }}>
                <Ionicons name="create-outline" size={20} color="#0284C7" />
                <TextInput
                  style={{
                    flex: 1,
                    marginLeft: 12,
                    fontSize: 16,
                    color: '#0F172A',
                  }}
                  placeholder="Số CMT/Hộ chiếu"
                  placeholderTextColor="#475569"
                />
              </View>

              {/* Nghề nghiệp */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: '#E0F2FE',
                }}>
                <Ionicons name="briefcase-outline" size={20} color="#0284C7" />
                <TextInput
                  style={{
                    flex: 1,
                    marginLeft: 12,
                    fontSize: 16,
                    color: '#0F172A',
                  }}
                  placeholder="Nghề nghiệp"
                  placeholderTextColor="#475569"
                />
              </View>

              {/* Địa chỉ */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: '#E0F2FE',
                }}>
                <Ionicons name="location-outline" size={20} color="#0284C7" />
                <TextInput
                  style={{
                    flex: 1,
                    marginLeft: 12,
                    fontSize: 16,
                    color: '#0F172A',
                  }}
                  placeholder="Địa chỉ"
                  placeholderTextColor="#475569"
                />
              </View>

              {/* Quốc tịch */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: '#E0F2FE',
                }}>
                <Ionicons name="globe-outline" size={20} color="#0284C7" />
                <TextInput
                  style={{
                    flex: 1,
                    marginLeft: 12,
                    fontSize: 16,
                    color: '#0F172A',
                  }}
                  placeholder="Quốc tịch"
                  placeholderTextColor="#475569"
                />
              </View>

              {/* Dân tộc */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 16,
                }}>
                <Ionicons name="people-outline" size={20} color="#0284C7" />
                <TextInput
                  style={{
                    flex: 1,
                    marginLeft: 12,
                    fontSize: 16,
                    color: '#0F172A',
                  }}
                  placeholder="Dân tộc"
                  placeholderTextColor="#475569"
                />
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Save Button */}
      <View
        style={{
          padding: 24,
          backgroundColor: '#F0FDFA',
          borderTopWidth: 1,
          borderTopColor: '#E0F2FE',
        }}>
        <TouchableOpacity
          style={{
            backgroundColor: '#0284C7',
            paddingVertical: 16,
            borderRadius: 12,
            alignItems: 'center',
            shadowColor: '#0284C7',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 4,
          }}>
          <Text
            style={{
              color: 'white',
              fontSize: 16,
              fontWeight: 'bold',
            }}>
            LƯU
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
