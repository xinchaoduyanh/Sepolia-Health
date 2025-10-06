'use client';

import { View, Text, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function HealthInfoScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
      
      {/* Header */}
      <View style={{ 
        backgroundColor: '#F0FDFA', 
        paddingTop: 60, 
        paddingBottom: 20, 
        paddingHorizontal: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#E0F2FE'
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => {}}>
            <Ionicons name="arrow-back" size={24} color="#0F172A" />
          </TouchableOpacity>
          <Text style={{ 
            fontSize: 18, 
            fontWeight: 'bold', 
            color: '#0F172A', 
            marginLeft: 16,
            flex: 1
          }}>
            Thông tin sức khỏe
          </Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={{ padding: 24 }}>
          {/* Thông tin tổn thương */}
          <View style={{ marginBottom: 24 }}>
            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              marginBottom: 16
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ 
                  width: 32, 
                  height: 32, 
                  borderRadius: 16, 
                  backgroundColor: '#FED7AA',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12
                }}>
                  <Ionicons name="footsteps" size={18} color="#EA580C" />
                </View>
                <Text style={{ 
                  fontSize: 16, 
                  fontWeight: 'bold', 
                  color: '#10B981' 
                }}>
                  Thông tin tổn thương
                </Text>
              </View>
              <TouchableOpacity>
                <Text style={{ 
                  fontSize: 14, 
                  fontWeight: '500', 
                  color: '#0284C7' 
                }}>
                  Thêm
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Thói quen sinh hoạt */}
          <View style={{ marginBottom: 24 }}>
            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              marginBottom: 16
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ 
                  width: 32, 
                  height: 32, 
                  borderRadius: 16, 
                  backgroundColor: '#E0F2FE',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12
                }}>
                  <Ionicons name="time" size={18} color="#0284C7" />
                </View>
                <Text style={{ 
                  fontSize: 16, 
                  fontWeight: 'bold', 
                  color: '#10B981' 
                }}>
                  Thói quen sinh hoạt
                </Text>
              </View>
            </View>

            <View style={{ 
              backgroundColor: '#F0FDFA', 
              borderRadius: 12, 
              borderWidth: 1,
              borderColor: '#E0F2FE',
              overflow: 'hidden'
            }}>
              <TouchableOpacity style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                padding: 16,
                borderBottomWidth: 1,
                borderBottomColor: '#E0F2FE'
              }}>
                <Text style={{ 
                  flex: 1, 
                  fontSize: 16, 
                  color: '#0F172A' 
                }}>
                  Dinh dưỡng
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#06B6D4" />
              </TouchableOpacity>

              <TouchableOpacity style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                padding: 16,
                borderBottomWidth: 1,
                borderBottomColor: '#E0F2FE'
              }}>
                <Text style={{ 
                  flex: 1, 
                  fontSize: 16, 
                  color: '#0F172A' 
                }}>
                  Uống
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#06B6D4" />
              </TouchableOpacity>

              <TouchableOpacity style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                padding: 16,
                borderBottomWidth: 1,
                borderBottomColor: '#E0F2FE'
              }}>
                <Text style={{ 
                  flex: 1, 
                  fontSize: 16, 
                  color: '#0F172A' 
                }}>
                  Thuốc lá
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#06B6D4" />
              </TouchableOpacity>

              <TouchableOpacity style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                padding: 16,
                borderBottomWidth: 1,
                borderBottomColor: '#E0F2FE'
              }}>
                <Text style={{ 
                  flex: 1, 
                  fontSize: 16, 
                  color: '#0F172A' 
                }}>
                  Ngủ
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#06B6D4" />
              </TouchableOpacity>

              <TouchableOpacity style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                padding: 16,
                borderBottomWidth: 1,
                borderBottomColor: '#E0F2FE'
              }}>
                <Text style={{ 
                  flex: 1, 
                  fontSize: 16, 
                  color: '#0F172A' 
                }}>
                  Hoạt động thể chất
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#06B6D4" />
              </TouchableOpacity>

              <TouchableOpacity style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                padding: 16
              }}>
                <Text style={{ 
                  flex: 1, 
                  fontSize: 16, 
                  color: '#0F172A' 
                }}>
                  Sức khỏe tâm thần - tâm lý
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#06B6D4" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Thông tin dị ứng */}
          <View style={{ marginBottom: 24 }}>
            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              marginBottom: 16
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ 
                  width: 32, 
                  height: 32, 
                  borderRadius: 16, 
                  backgroundColor: '#A7F3D0',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12
                }}>
                  <Ionicons name="snow" size={18} color="#10B981" />
                </View>
                <Text style={{ 
                  fontSize: 16, 
                  fontWeight: 'bold', 
                  color: '#10B981' 
                }}>
                  Thông tin dị ứng
                </Text>
              </View>
            </View>

            <View style={{ 
              backgroundColor: '#F0FDFA', 
              borderRadius: 12, 
              borderWidth: 1,
              borderColor: '#E0F2FE',
              overflow: 'hidden'
            }}>
              <TouchableOpacity style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                padding: 16,
                borderBottomWidth: 1,
                borderBottomColor: '#E0F2FE'
              }}>
                <Text style={{ 
                  flex: 1, 
                  fontSize: 16, 
                  color: '#0F172A' 
                }}>
                  Tiền sử dị ứng
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#06B6D4" />
              </TouchableOpacity>

              <TouchableOpacity style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                padding: 16,
                borderBottomWidth: 1,
                borderBottomColor: '#E0F2FE'
              }}>
                <Text style={{ 
                  flex: 1, 
                  fontSize: 16, 
                  color: '#0F172A' 
                }}>
                  Dị ứng thực phẩm
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#06B6D4" />
              </TouchableOpacity>

              <TouchableOpacity style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                padding: 16,
                borderBottomWidth: 1,
                borderBottomColor: '#E0F2FE'
              }}>
                <Text style={{ 
                  flex: 1, 
                  fontSize: 16, 
                  color: '#0F172A' 
                }}>
                  Dị ứng thuốc
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#06B6D4" />
              </TouchableOpacity>

              <TouchableOpacity style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                padding: 16,
                borderBottomWidth: 1,
                borderBottomColor: '#E0F2FE'
              }}>
                <Text style={{ 
                  flex: 1, 
                  fontSize: 16, 
                  color: '#0F172A' 
                }}>
                  Dị ứng da
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#06B6D4" />
              </TouchableOpacity>

              <TouchableOpacity style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                padding: 16,
                borderBottomWidth: 1,
                borderBottomColor: '#E0F2FE'
              }}>
                <Text style={{ 
                  flex: 1, 
                  fontSize: 16, 
                  color: '#0F172A' 
                }}>
                  Dị ứng do côn trùng
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#06B6D4" />
              </TouchableOpacity>

              <TouchableOpacity style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                padding: 16,
                borderBottomWidth: 1,
                borderBottomColor: '#E0F2FE'
              }}>
                <Text style={{ 
                  flex: 1, 
                  fontSize: 16, 
                  color: '#0F172A' 
                }}>
                  Dị ứng đường hô hấp
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#06B6D4" />
              </TouchableOpacity>

              <TouchableOpacity style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                padding: 16
              }}>
                <Text style={{ 
                  flex: 1, 
                  fontSize: 16, 
                  color: '#0F172A' 
                }}>
                  Các dị ứng khác
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#06B6D4" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <View style={{
        position: 'absolute',
        bottom: 100,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#0284C7',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#0284C7',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
      }}>
        <Ionicons name="chatbubbles" size={24} color="white" />
      </View>
    </View>
  );
}
