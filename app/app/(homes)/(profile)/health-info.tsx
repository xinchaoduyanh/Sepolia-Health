'use client';

import { View, Text, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { useRouter } from 'expo-router';

export default function HealthInfoScreen() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: '#E0F2FE' }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces={false}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Background Gradient */}
        <View style={{ height: 280, position: 'relative', marginTop: -60 }}>
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

          {/* Decorative circles */}
          <View
            style={{
              position: 'absolute',
              top: -40,
              right: -40,
              height: 120,
              width: 120,
              borderRadius: 60,
              backgroundColor: 'rgba(255,255,255,0.12)',
            }}
          />
          <View
            style={{
              position: 'absolute',
              top: 80,
              left: -30,
              height: 100,
              width: 100,
              borderRadius: 50,
              backgroundColor: 'rgba(255,255,255,0.08)',
            }}
          />

          {/* Header positioned within gradient */}
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
              onPress={() => router.push('/(profile)/' as any)}
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
            <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#FFFFFF', flex: 1 }}>
              Thông tin sức khỏe
            </Text>
          </View>
        </View>

        {/* Content */}
        <View style={{ paddingHorizontal: 24, marginTop: -80, marginBottom: 24 }}>
          {/* Thông tin tổn thương */}
          <View style={{ marginBottom: 24 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 16,
              }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: '#FED7AA',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                  }}>
                  <Ionicons name="footsteps" size={18} color="#EA580C" />
                </View>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: 'bold',
                    color: '#10B981',
                  }}>
                  Thông tin tổn thương
                </Text>
              </View>
              <TouchableOpacity>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '500',
                    color: '#0284C7',
                  }}>
                  Thêm
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Thói quen sinh hoạt */}
          <View style={{ marginBottom: 24 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 16,
              }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: '#E0F2FE',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                  }}>
                  <Ionicons name="time" size={18} color="#0284C7" />
                </View>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: 'bold',
                    color: '#10B981',
                  }}>
                  Thói quen sinh hoạt
                </Text>
              </View>
            </View>

            <View
              style={{
                backgroundColor: '#F0FDFA',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#E0F2FE',
                overflow: 'hidden',
              }}>
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: '#E0F2FE',
                }}>
                <Text
                  style={{
                    flex: 1,
                    fontSize: 16,
                    color: '#0F172A',
                  }}>
                  Dinh dưỡng
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
                }}>
                <Text
                  style={{
                    flex: 1,
                    fontSize: 16,
                    color: '#0F172A',
                  }}>
                  Uống
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
                }}>
                <Text
                  style={{
                    flex: 1,
                    fontSize: 16,
                    color: '#0F172A',
                  }}>
                  Thuốc lá
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
                }}>
                <Text
                  style={{
                    flex: 1,
                    fontSize: 16,
                    color: '#0F172A',
                  }}>
                  Ngủ
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
                }}>
                <Text
                  style={{
                    flex: 1,
                    fontSize: 16,
                    color: '#0F172A',
                  }}>
                  Hoạt động thể chất
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#06B6D4" />
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 16,
                }}>
                <Text
                  style={{
                    flex: 1,
                    fontSize: 16,
                    color: '#0F172A',
                  }}>
                  Sức khỏe tâm thần - tâm lý
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#06B6D4" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Thông tin dị ứng */}
          <View style={{ marginBottom: 24 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 16,
              }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: '#A7F3D0',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                  }}>
                  <Ionicons name="snow" size={18} color="#10B981" />
                </View>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: 'bold',
                    color: '#10B981',
                  }}>
                  Thông tin dị ứng
                </Text>
              </View>
            </View>

            <View
              style={{
                backgroundColor: '#F0FDFA',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#E0F2FE',
                overflow: 'hidden',
              }}>
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: '#E0F2FE',
                }}>
                <Text
                  style={{
                    flex: 1,
                    fontSize: 16,
                    color: '#0F172A',
                  }}>
                  Tiền sử dị ứng
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
                }}>
                <Text
                  style={{
                    flex: 1,
                    fontSize: 16,
                    color: '#0F172A',
                  }}>
                  Dị ứng thực phẩm
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
                }}>
                <Text
                  style={{
                    flex: 1,
                    fontSize: 16,
                    color: '#0F172A',
                  }}>
                  Dị ứng thuốc
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
                }}>
                <Text
                  style={{
                    flex: 1,
                    fontSize: 16,
                    color: '#0F172A',
                  }}>
                  Dị ứng da
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
                }}>
                <Text
                  style={{
                    flex: 1,
                    fontSize: 16,
                    color: '#0F172A',
                  }}>
                  Dị ứng do côn trùng
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
                }}>
                <Text
                  style={{
                    flex: 1,
                    fontSize: 16,
                    color: '#0F172A',
                  }}>
                  Dị ứng đường hô hấp
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#06B6D4" />
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 16,
                }}>
                <Text
                  style={{
                    flex: 1,
                    fontSize: 16,
                    color: '#0F172A',
                  }}>
                  Các dị ứng khác
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#06B6D4" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
