'use client';

import { View, Text, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/lib/hooks/useAuth';
import { router } from 'expo-router';

export default function ProfileScreen() {
  const { user } = useAuth();

  return (
    <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Header with wavy background */}
      <LinearGradient
        colors={['#0284C7', '#10B981']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingTop: 60, paddingBottom: 40, paddingHorizontal: 24 }}>
        {/* Wavy pattern overlay - horizontal waves passing through avatar */}
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
          {/* Large horizontal wave - passes through bottom half of avatar */}
          <View
            style={{
              position: 'absolute',
              top: 120,
              left: -150,
              right: -150,
              height: 100,
              backgroundColor: 'rgba(255,255,255,0.15)',
              borderRadius: 50,
              transform: [{ rotate: '-3deg' }],
            }}
          />

          {/* Medium horizontal wave - passes through center of avatar */}
          <View
            style={{
              position: 'absolute',
              top: 140,
              left: -120,
              right: -120,
              height: 80,
              backgroundColor: 'rgba(255,255,255,0.12)',
              borderRadius: 40,
              transform: [{ rotate: '2deg' }],
            }}
          />

          {/* Small horizontal wave - passes through top half of avatar */}
          <View
            style={{
              position: 'absolute',
              top: 160,
              left: -100,
              right: -100,
              height: 60,
              backgroundColor: 'rgba(255,255,255,0.08)',
              borderRadius: 30,
              transform: [{ rotate: '-1deg' }],
            }}
          />

          {/* Additional decorative elements */}
          <View
            style={{
              position: 'absolute',
              top: 100,
              left: 30,
              width: 20,
              height: 20,
              backgroundColor: 'rgba(255,255,255,0.06)',
              borderRadius: 10,
            }}
          />
          <View
            style={{
              position: 'absolute',
              top: 180,
              right: 20,
              width: 15,
              height: 15,
              backgroundColor: 'rgba(255,255,255,0.05)',
              borderRadius: 7.5,
            }}
          />
          <View
            style={{
              position: 'absolute',
              top: 130,
              right: 60,
              width: 12,
              height: 12,
              backgroundColor: 'rgba(255,255,255,0.04)',
              borderRadius: 6,
            }}
          />
        </View>

        {/* User Avatar */}
        <View style={{ alignItems: 'center', marginTop: 20 }}>
          <View
            style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              backgroundColor: '#F0FDFA',
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#0284C7',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
            }}>
            <Text style={{ fontSize: 40, fontWeight: 'bold', color: '#0284C7' }}>
              {user?.firstName?.charAt(0).toUpperCase() || 'V'}
            </Text>
          </View>

          {/* Camera icon overlay */}
          <View
            style={{
              position: 'absolute',
              bottom: 5,
              right: 5,
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: '#475569',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Ionicons name="camera" size={16} color="white" />
          </View>

          <Text
            style={{
              fontSize: 24,
              fontWeight: 'bold',
              color: '#F0FDFA',
              marginTop: 16,
              textAlign: 'center',
            }}>
            {user ? `${user.firstName} ${user.lastName}` : 'Vũ Duy anh'}
          </Text>
        </View>
      </LinearGradient>

      {/* Main Content */}
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: 24, paddingTop: 20 }}>
          {/* Thông tin chung Section */}
          <View style={{ marginBottom: 24 }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: 'bold',
                color: '#0F172A',
                marginBottom: 16,
              }}>
              Thông tin chung
            </Text>

            <View style={{ backgroundColor: '#F0FDFA', borderRadius: 12, overflow: 'hidden' }}>
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: '#E0F2FE',
                }}
                onPress={() => router.push('/profile/personal-info' as any)}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: '#E0F2FE',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 16,
                  }}>
                  <Ionicons name="person-outline" size={20} color="#0284C7" />
                </View>
                <Text
                  style={{
                    flex: 1,
                    fontSize: 16,
                    fontWeight: '500',
                    color: '#0F172A',
                  }}>
                  Thông tin cá nhân
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#06B6D4" />
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: '#E0F2FE',
                }}
                onPress={() => router.push('/profile/additional-info' as any)}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: '#E0F2FE',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 16,
                  }}>
                  <Ionicons name="add-circle-outline" size={20} color="#0284C7" />
                </View>
                <Text
                  style={{
                    flex: 1,
                    fontSize: 16,
                    fontWeight: '500',
                    color: '#0F172A',
                  }}>
                  Thông tin bổ sung
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#06B6D4" />
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 16,
                }}
                onPress={() => router.push('/profile/health-info' as any)}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: '#E0F2FE',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 16,
                  }}>
                  <Ionicons name="heart-outline" size={20} color="#0284C7" />
                </View>
                <Text
                  style={{
                    flex: 1,
                    fontSize: 16,
                    fontWeight: '500',
                    color: '#0F172A',
                  }}>
                  Thông tin sức khỏe
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#06B6D4" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Hồ sơ người thân Section */}
          <View style={{ marginBottom: 24 }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: 'bold',
                color: '#0F172A',
                marginBottom: 16,
              }}>
              Hồ sơ người thân
            </Text>

            <View
              style={{
                backgroundColor: '#F0FDFA',
                borderRadius: 16,
                padding: 24,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: '#E0F2FE',
              }}>
              {/* Illustration */}
              <View style={{ position: 'relative', marginBottom: 20 }}>
                {/* Folder */}
                <View
                  style={{
                    width: 80,
                    height: 60,
                    backgroundColor: '#0284C7',
                    borderRadius: 8,
                    position: 'relative',
                    shadowColor: '#0284C7',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 4,
                  }}>
                  <View
                    style={{
                      position: 'absolute',
                      top: -8,
                      left: 8,
                      width: 20,
                      height: 16,
                      backgroundColor: '#F0FDFA',
                      borderRadius: 4,
                    }}
                  />
                </View>

                {/* Person with plus icon */}
                <View
                  style={{
                    position: 'absolute',
                    top: 10,
                    right: -10,
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: '#10B981',
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: '#10B981',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                    elevation: 4,
                  }}>
                  <Ionicons name="person-add" size={20} color="white" />
                </View>

                {/* Decorative leaves */}
                <View
                  style={{
                    position: 'absolute',
                    top: -5,
                    left: -15,
                    width: 12,
                    height: 12,
                    backgroundColor: '#10B981',
                    borderRadius: 6,
                    transform: [{ rotate: '45deg' }],
                  }}
                />
                <View
                  style={{
                    position: 'absolute',
                    bottom: 5,
                    right: -20,
                    width: 8,
                    height: 8,
                    backgroundColor: '#06B6D4',
                    borderRadius: 4,
                    transform: [{ rotate: '-30deg' }],
                  }}
                />
                <View
                  style={{
                    position: 'absolute',
                    top: 25,
                    left: -20,
                    width: 10,
                    height: 10,
                    backgroundColor: '#A7F3D0',
                    borderRadius: 5,
                    transform: [{ rotate: '60deg' }],
                  }}
                />
              </View>

              <TouchableOpacity
                style={{
                  backgroundColor: '#0284C7',
                  paddingHorizontal: 32,
                  paddingVertical: 12,
                  borderRadius: 25,
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
                    textAlign: 'center',
                  }}>
                  THÊM HỒ SƠ
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
