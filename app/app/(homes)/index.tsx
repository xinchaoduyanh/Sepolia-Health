'use client';

import { useChatContext } from '@/contexts/ChatContext';
import { useNotificationContext } from '@/contexts/NotificationContext';
import { useClosestAppointment } from '@/lib/api/appointments';
import { useArticles } from '@/lib/api/articles';
import { useClaimPromotion, useFeaturedPromotion } from '@/lib/api/promotion';
import { useAuth } from '@/lib/hooks/useAuth';
import { formatTime } from '@/utils/datetime';
import { STRINGS } from '@/constants/strings';
import Colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import {
  Alert,
  Animated,
  DimensionValue,
  Image,
  ImageBackground,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
  ViewStyle,
} from 'react-native';

interface SkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: ViewStyle;
}

const Skeleton = ({ width, height, borderRadius, style }: SkeletonProps) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: borderRadius || 4,
          backgroundColor: Colors.skeleton,
          opacity,
        },
        style,
      ]}
    />
  );
};

// Responsive utilities
const useResponsive = () => {
  const { width: screenWidth } = useWindowDimensions();

  return {
    screenWidth,
    isSmall: screenWidth < 375,
    isMedium: screenWidth >= 375 && screenWidth < 768,
    isLarge: screenWidth >= 768,
    horizontalPadding: screenWidth < 375 ? 16 : 24,
    // Responsive font sizes
    fontSize: {
      xs: screenWidth < 375 ? 11 : 12,
      sm: screenWidth < 375 ? 12 : 14,
      base: screenWidth < 375 ? 14 : 16,
      lg: screenWidth < 375 ? 16 : 18,
      xl: screenWidth < 375 ? 18 : 20,
      xxl: screenWidth < 375 ? 20 : 22,
    },
    // Responsive spacing
    spacing: {
      xs: screenWidth < 375 ? 4 : 6,
      sm: screenWidth < 375 ? 8 : 12,
      base: screenWidth < 375 ? 12 : 16,
      lg: screenWidth < 375 ? 16 : 20,
      xl: screenWidth < 375 ? 24 : 32,
    },
  };
};

export default function HomeScreen() {
  const { user } = useAuth();
  const { unreadCount } = useNotificationContext();
  const { totalUnreadCount } = useChatContext();
  const { data: closestAppointment, isLoading: isLoadingAppointment } = useClosestAppointment();
  const { data: featuredPromotion } = useFeaturedPromotion();
  const claimPromotion = useClaimPromotion();
  const responsive = useResponsive();

  // Fetch articles for Tin tức & Sự kiện section
  const { data: articlesResponse, isLoading: isLoadingArticles } = useArticles({
    page: 1,
    limit: 3, // Show only 3 latest articles on home page
    isPublished: true,
  });

  const articles = articlesResponse?.articles || [];

  // Lấy patientProfiles từ user data
  const patientProfiles = user?.patientProfiles || [];

  // Lấy primary profile (hồ sơ chính)
  const primaryProfile = patientProfiles.find((profile) => profile.relationship === 'SELF');

  // Format date helper for appointment card
  const formatAppointmentDate = (isoDateString: string) => {
    const date = new Date(isoDateString);
    const day = date.getDate();
    const month = date.toLocaleDateString('vi-VN', { month: 'short' });
    return { day, month };
  };

  // Format article time helper
  const formatArticleTime = (isoDateString: string) => {
    const date = new Date(isoDateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInHours < 1) {
      return STRINGS.JUST_NOW;
    } else if (diffInHours < 24) {
      return `${diffInHours} ${STRINGS.HOURS_AGO}`;
    } else if (diffInDays === 1) {
      return STRINGS.YESTERDAY;
    } else if (diffInDays < 7) {
      return `${diffInDays} ${STRINGS.DAYS_AGO}`;
    } else {
      return date.toLocaleDateString('vi-VN', {
        day: 'numeric',
        month: 'short',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      });
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces={false}
        alwaysBounceVertical={false}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100 }}
        scrollEventThrottle={16}
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}>
        {/* Background Gradient - now scrollable and extends to top */}
        <View
          style={{ height: responsive.isSmall ? 320 : 380, position: 'relative', marginTop: -60 }}>
          <LinearGradient
            colors={Colors.gradientPrimary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ flex: 1 }}
          />

          {/* Decorative circles */}
          <View
            style={{
              position: 'absolute',
              top: -60,
              right: -40,
              height: responsive.isSmall ? 140 : 180,
              width: responsive.isSmall ? 140 : 180,
              borderRadius: responsive.isSmall ? 70 : 90,
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
            }}
          />
          <View
            style={{
              position: 'absolute',
              top: 120,
              left: -50,
              height: responsive.isSmall ? 120 : 150,
              width: responsive.isSmall ? 120 : 150,
              borderRadius: responsive.isSmall ? 60 : 75,
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
            }}
          />

          {/* Notification button - positioned within gradient */}
          <TouchableOpacity
            onPress={() => router.push('/(homes)/(notification)')}
            style={{
              position: 'absolute',
              top: 120,
              right: responsive.horizontalPadding,
              zIndex: 10,
              height: 48,
              width: 48,
              borderRadius: 24,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: Colors.primaryForeground,
              shadowColor: Colors.shadow,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 6,
              opacity: 0.9,
            }}>
            <Ionicons name="notifications-outline" size={24} color={Colors.primary} />
            {unreadCount > 0 && (
              <View
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  height: 20,
                  width: unreadCount > 99 ? 28 : 20,
                  borderRadius: 10,
                  backgroundColor: Colors.secondary,
                  borderWidth: 2,
                  borderColor: Colors.primaryForeground,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: unreadCount > 99 ? 4 : 0,
                }}>
                <Text style={{ fontSize: 10, fontWeight: 'bold', color: Colors.primaryForeground }}>
                  {unreadCount > 99 ? STRINGS.MORE_THAN_99 : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Avatar + Info - positioned within gradient */}
          <View
            style={{
              position: 'absolute',
              top: 120,
              left: responsive.horizontalPadding,
              right: responsive.horizontalPadding,
              flexDirection: 'row',
              alignItems: 'center',
              paddingRight: responsive.isSmall ? 50 : 60,
            }}>
            <View
              style={{
                height: responsive.isSmall ? 60 : 72,
                width: responsive.isSmall ? 60 : 72,
                borderRadius: responsive.isSmall ? 30 : 36,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.25)',
                borderWidth: 3,
                borderColor: 'rgba(255, 255, 255, 0.4)',
                shadowColor: Colors.shadow,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
                elevation: 4,
                marginRight: responsive.spacing.base,
              }}>
              {primaryProfile?.avatar ? (
                <Image
                  source={{ uri: primaryProfile.avatar }}
                  style={{
                    height: responsive.isSmall ? 54 : 66,
                    width: responsive.isSmall ? 54 : 66,
                    borderRadius: responsive.isSmall ? 27 : 33,
                  }}
                />
              ) : (
                <Text
                  style={{
                    fontSize: responsive.isSmall ? 24 : 32,
                    fontWeight: 'bold',
                    color: Colors.primaryForeground,
                  }}>
                  {primaryProfile
                    ? primaryProfile.firstName.charAt(0).toUpperCase()
                    : user?.firstName?.charAt(0).toUpperCase() || 'A'}
                </Text>
              )}
            </View>

            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: responsive.fontSize.xl,
                  fontWeight: '700',
                  color: Colors.primaryForeground,
                  marginBottom: 6,
                }}>
                {STRINGS.GREETING},{' '}
                {primaryProfile
                  ? `${primaryProfile.lastName} ${primaryProfile.firstName}`
                  : user
                    ? `${user.lastName} ${user.firstName}`
                    : 'Nguyễn Văn A'}
              </Text>
              <Text
                style={{
                  fontSize: responsive.fontSize.sm,
                  color: 'rgba(255, 255, 255, 0.9)',
                  lineHeight: 20,
                }}>
                {primaryProfile?.phone || user?.phone || STRINGS.NOT_UPDATED} •{' '}
                {user?.email || STRINGS.NOT_UPDATED}
              </Text>
            </View>
          </View>
        </View>

        {featuredPromotion &&
          (() => {
            // Parse background colors
            let gradientColors: [string, string, ...string[]] = ['#1E3A5F', '#2C5282'];
            try {
              const parsed = JSON.parse(featuredPromotion.display.backgroundColor);
              if (Array.isArray(parsed) && parsed.length >= 2) {
                gradientColors = parsed as [string, string, ...string[]];
              }
            } catch {
              const colors = featuredPromotion.display.backgroundColor
                .split(',')
                .map((c: string) => c.trim().replace(/[\[\]"]/g, ''))
                .filter((c: string) => c.length > 0);
              if (colors.length >= 2) {
                gradientColors = colors as [string, string, ...string[]];
              }
            }

            // Render with background image if imageUrl exists, otherwise use gradient
            const containerStyle = {
              borderRadius: 24,
              overflow: 'hidden' as const,
              shadowColor: Colors.shadow,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.25,
              shadowRadius: 16,
              elevation: 8,
            };

            const contentContainerStyle = {
              padding: 24,
            };

            const renderContent = () => (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                <View style={{ flex: 1, paddingRight: 16 }}>
                  <Text
                    style={{
                      fontSize: 22,
                      fontWeight: 'bold',
                      color: featuredPromotion.display.textColor,
                      marginBottom: 8,
                    }}>
                    {featuredPromotion.promotion.title}
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      color: featuredPromotion.display.textColor,
                      opacity: 0.9,
                      lineHeight: 20,
                      marginBottom: 16,
                    }}>
                    {featuredPromotion.promotion.description ||
                      `${STRINGS.GET_VOUCHER} ${featuredPromotion.promotion.discountPercent}%`}
                  </Text>
                  <TouchableOpacity
                    onPress={async () => {
                      try {
                        const result = await claimPromotion.mutateAsync(
                          featuredPromotion.promotion.id
                        );
                        Alert.alert(
                          result.success ? STRINGS.SUCCESS : STRINGS.NOTIFICATION,
                          result.message,
                          [
                            {
                              text: STRINGS.OK,
                              onPress: () => {
                                // Reset mutation state after Alert is dismissed
                                claimPromotion.reset();
                              },
                            },
                          ]
                        );
                      } catch (error: any) {
                        Alert.alert(
                          STRINGS.ERROR,
                          error?.response?.data?.message || STRINGS.ERROR_OCCURRED,
                          [
                            {
                              text: STRINGS.OK,
                              onPress: () => {
                                // Reset mutation state after Alert is dismissed
                                claimPromotion.reset();
                              },
                            },
                          ]
                        );
                      }
                    }}
                    disabled={claimPromotion.isPending}
                    activeOpacity={0.7}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      alignSelf: 'flex-start',
                      borderRadius: 999,
                      paddingHorizontal: 20,
                      paddingVertical: 12,
                      backgroundColor: featuredPromotion.display.buttonColor,
                      borderWidth: 2,
                      borderColor: featuredPromotion.display.buttonTextColor,
                      opacity: claimPromotion.isPending ? 0.5 : 1,
                    }}>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: '600',
                        color: featuredPromotion.display.buttonTextColor,
                        marginRight: 8,
                      }}>
                      {featuredPromotion.display.buttonText || STRINGS.GET_NOW}
                    </Text>
                    <Ionicons
                      name={(featuredPromotion.display.iconName || 'gift-outline') as any}
                      size={16}
                      color={featuredPromotion.display.buttonTextColor}
                    />
                  </TouchableOpacity>
                </View>
                <View
                  style={{
                    height: 80,
                    width: 80,
                    borderRadius: 40,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  }}>
                  <Ionicons
                    name={(featuredPromotion.display.iconName || 'gift-outline') as any}
                    size={40}
                    color={featuredPromotion.display.textColor}
                  />
                </View>
              </View>
            );

            return (
              <View
                style={{
                  paddingHorizontal: responsive.horizontalPadding,
                  marginTop: -150,
                  marginBottom: responsive.spacing.lg,
                }}>
                <View style={containerStyle}>
                  {featuredPromotion.display.imageUrl ? (
                    // Use image background with overlay
                    <ImageBackground
                      source={{ uri: featuredPromotion.display.imageUrl }}
                      style={contentContainerStyle}
                      resizeMode="cover"
                      imageStyle={{ borderRadius: 24 }}>
                      <View
                        style={{
                          backgroundColor: 'rgba(0, 0, 0, 0.3)',
                          borderRadius: 24,
                          padding: responsive.spacing.lg,
                          marginTop: -responsive.spacing.lg,
                          marginLeft: -responsive.spacing.lg,
                          marginRight: -responsive.spacing.lg,
                          marginBottom: -responsive.spacing.lg,
                        }}>
                        {renderContent()}
                      </View>
                    </ImageBackground>
                  ) : (
                    // Use gradient background
                    <LinearGradient
                      colors={gradientColors}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={contentContainerStyle}>
                      {renderContent()}
                    </LinearGradient>
                  )}
                </View>
              </View>
            );
          })()}

        {/* Lịch trình Section */}
        <View
          style={{
            paddingHorizontal: responsive.horizontalPadding,
            marginBottom: responsive.spacing.lg,
          }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: responsive.spacing.base,
            }}>
            <Text
              style={{ fontSize: responsive.fontSize.xl, fontWeight: 'bold', color: Colors.text }}>
              {STRINGS.UPCOMING_SCHEDULE}
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(homes)/(appointment)')}
              activeOpacity={0.7}
              style={{ padding: 4 }}>
              <Text
                style={{
                  fontSize: responsive.fontSize.sm,
                  fontWeight: '600',
                  color: Colors.primary,
                }}>
                {STRINGS.SEE_ALL}
              </Text>
            </TouchableOpacity>
          </View>
          {isLoadingAppointment ? (
            <View
              style={{
                borderRadius: 20,
                padding: responsive.spacing.base,
                backgroundColor: Colors.primaryForeground,
                shadowColor: Colors.shadow,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
                elevation: 2,
              }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Skeleton
                  width={56}
                  height={56}
                  borderRadius={16}
                  style={{ marginRight: responsive.spacing.base }}
                />
                <View style={{ flex: 1 }}>
                  <Skeleton
                    width="40%"
                    height={14}
                    style={{ marginBottom: responsive.spacing.xs }}
                  />
                  <Skeleton
                    width="80%"
                    height={16}
                    style={{ marginBottom: responsive.spacing.xs }}
                  />
                  <Skeleton width="60%" height={14} />
                </View>
              </View>
            </View>
          ) : closestAppointment ? (
            <TouchableOpacity
              onPress={() =>
                router.push(`/(homes)/(appointment-detail)?id=${closestAppointment.id}`)
              }
              style={{
                borderRadius: 20,
                padding: responsive.spacing.base,
                backgroundColor: Colors.primaryForeground,
              }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <View style={{ marginRight: responsive.spacing.base, alignItems: 'center' }}>
                  <View
                    style={{
                      height: 56,
                      width: 56,
                      borderRadius: 16,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: Colors.background,
                    }}>
                    <Text style={{ fontSize: 20, fontWeight: 'bold', color: Colors.primary }}>
                      {formatAppointmentDate(closestAppointment.startTime).day}
                    </Text>
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: '600',
                        color: Colors.primary,
                        marginTop: 2,
                      }}>
                      {formatAppointmentDate(closestAppointment.startTime).month}
                    </Text>
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      marginBottom: responsive.spacing.xs,
                    }}>
                    <View
                      style={{
                        height: 6,
                        width: 6,
                        borderRadius: 3,
                        backgroundColor: Colors.secondary,
                        marginRight: responsive.spacing.xs,
                      }}
                    />
                    <Text
                      style={{
                        fontSize: responsive.fontSize.sm,
                        fontWeight: '600',
                        color: Colors.secondary,
                      }}>
                      {formatTime(closestAppointment.startTime)} -{' '}
                      {(() => {
                        const startDate = new Date(closestAppointment.startTime);
                        const endDate = new Date(
                          startDate.getTime() + closestAppointment.service.duration * 60 * 1000
                        );
                        return formatTime(endDate.toISOString());
                      })()}
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontSize: responsive.fontSize.lg,
                      fontWeight: '600',
                      color: Colors.text,
                      marginBottom: responsive.spacing.sm,
                    }}>
                    {closestAppointment.service.name}
                  </Text>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      marginBottom: responsive.spacing.xs,
                    }}>
                    <Ionicons name="person-outline" size={16} color={Colors.textSecondary} />
                    <Text
                      style={{
                        fontSize: responsive.fontSize.sm,
                        color: Colors.textSecondary,
                        marginLeft: responsive.spacing.xs,
                      }}>
                      {STRINGS.DOCTOR} {closestAppointment.doctor.lastName}{' '}
                      {closestAppointment.doctor.firstName}
                    </Text>
                  </View>
                  {closestAppointment.type === 'ONLINE' ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name="videocam-outline" size={16} color={Colors.secondary} />
                      <Text
                        style={{
                          fontSize: responsive.fontSize.sm,
                          color: Colors.secondary,
                          marginLeft: responsive.spacing.xs,
                        }}>
                        {STRINGS.ONLINE_APPOINTMENT_TYPE}
                      </Text>
                    </View>
                  ) : (
                    closestAppointment.clinic && (
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="location-outline" size={16} color={Colors.textSecondary} />
                        <Text
                          style={{
                            fontSize: responsive.fontSize.sm,
                            color: Colors.textSecondary,
                            marginLeft: responsive.spacing.xs,
                          }}>
                          {closestAppointment.clinic.name}
                        </Text>
                      </View>
                    )
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ) : (
            <View
              style={{
                borderRadius: 20,
                padding: responsive.spacing.lg,
                backgroundColor: Colors.white,
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 180,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 8,
                elevation: 3,
              }}>
              <View
                style={{
                  height: 80,
                  width: 80,
                  borderRadius: 40,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: Colors.background,
                  marginBottom: responsive.spacing.base,
                  shadowColor: Colors.primary,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.15,
                  shadowRadius: 8,
                  elevation: 4,
                }}>
                <Ionicons name="calendar-outline" size={40} color={Colors.primary} />
              </View>
              <Text
                style={{
                  fontSize: responsive.fontSize.lg,
                  fontWeight: '600',
                  color: Colors.text,
                  marginBottom: responsive.spacing.xs,
                  textAlign: 'center',
                }}>
                {STRINGS.NO_UPCOMING_APPOINTMENTS}
              </Text>
              <Text
                style={{
                  fontSize: responsive.fontSize.sm,
                  color: Colors.textMuted,
                  textAlign: 'center',
                  marginBottom: responsive.spacing.base,
                  lineHeight: 20,
                  paddingHorizontal: responsive.spacing.xs,
                }}>
                {STRINGS.SCHEDULE_APPOINTMENT_MESSAGE}
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/(homes)/(appointment)/create')}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderRadius: 12,
                  paddingHorizontal: responsive.spacing.base,
                  paddingVertical: responsive.spacing.sm,
                  backgroundColor: Colors.primary,
                  shadowColor: Colors.primary,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 4,
                }}>
                <Ionicons name="add-circle-outline" size={20} color={Colors.primaryForeground} />
                <Text
                  style={{
                    fontSize: responsive.fontSize.sm,
                    fontWeight: '600',
                    color: Colors.primaryForeground,
                    marginLeft: responsive.spacing.xs,
                  }}>
                  {STRINGS.BOOK_NOW}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Dịch vụ Section */}
        <View
          style={{
            paddingHorizontal: responsive.horizontalPadding,
            marginBottom: responsive.spacing.lg,
          }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: responsive.spacing.base,
            }}>
            <Text
              style={{ fontSize: responsive.fontSize.xl, fontWeight: 'bold', color: Colors.text }}>
              {STRINGS.SERVICES}
            </Text>
          </View>

          <View
            style={{
              borderRadius: 24,
              padding: responsive.spacing.base,
              backgroundColor: Colors.white,
            }}>
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: responsive.spacing.sm,
                justifyContent: 'space-between',
              }}>
              <View style={{ width: responsive.isSmall ? '23%' : '22%', alignItems: 'center' }}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={{ alignItems: 'center' }}
                  onPress={() => router.push('/(homes)/(appointment)/create')}>
                  <View
                    style={{
                      height: responsive.isSmall ? 48 : 56,
                      width: responsive.isSmall ? 48 : 56,
                      borderRadius: responsive.isSmall ? 12 : 16,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: Colors.background,
                      marginBottom: responsive.spacing.xs,
                    }}>
                    <Ionicons
                      name="calendar-outline"
                      size={responsive.isSmall ? 22 : 26}
                      color={Colors.primary}
                    />
                  </View>
                  <Text
                    style={{
                      fontSize: responsive.fontSize.xs,
                      color: Colors.text,
                      textAlign: 'center',
                    }}>
                    {STRINGS.SCHEDULE}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={{ width: responsive.isSmall ? '23%' : '22%', alignItems: 'center' }}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={{ alignItems: 'center' }}
                  onPress={() => router.push('/(homes)/(appointment)/create-online')}>
                  <View
                    style={{
                      height: responsive.isSmall ? 48 : 56,
                      width: responsive.isSmall ? 48 : 56,
                      borderRadius: responsive.isSmall ? 12 : 16,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: Colors.background,
                      marginBottom: responsive.spacing.xs,
                    }}>
                    <Ionicons
                      name="videocam-outline"
                      size={responsive.isSmall ? 22 : 26}
                      color={Colors.secondary}
                    />
                  </View>
                  <Text
                    style={{
                      fontSize: responsive.fontSize.xs,
                      color: Colors.text,
                      textAlign: 'center',
                    }}>
                    {STRINGS.ONLINE_CONSULTATION}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={{ width: responsive.isSmall ? '23%' : '22%', alignItems: 'center' }}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={{ alignItems: 'center' }}
                  onPress={() => router.push('/(homes)/(history-appointment)')}>
                  <View
                    style={{
                      height: responsive.isSmall ? 48 : 56,
                      width: responsive.isSmall ? 48 : 56,
                      borderRadius: responsive.isSmall ? 12 : 16,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: Colors.background,
                      marginBottom: responsive.spacing.xs,
                    }}>
                    <Ionicons
                      name="time-outline"
                      size={responsive.isSmall ? 22 : 26}
                      color={Colors.primary}
                    />
                  </View>
                  <Text
                    style={{
                      fontSize: responsive.fontSize.xs,
                      color: Colors.text,
                      textAlign: 'center',
                    }}>
                    {STRINGS.HISTORY}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={{ width: responsive.isSmall ? '23%' : '22%', alignItems: 'center' }}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={{ alignItems: 'center' }}
                  onPress={() => router.push('/(homes)/(chat)/channels')}>
                  <View
                    style={{
                      height: responsive.isSmall ? 48 : 56,
                      width: responsive.isSmall ? 48 : 56,
                      borderRadius: responsive.isSmall ? 12 : 16,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: Colors.background,
                      marginBottom: responsive.spacing.xs,
                    }}>
                    <Ionicons
                      name="chatbubbles-outline"
                      size={responsive.isSmall ? 22 : 26}
                      color={Colors.primary}
                    />
                    {/* Unread message badge */}
                    {totalUnreadCount > 0 && (
                      <View
                        style={{
                          position: 'absolute',
                          top: -4,
                          right: -4,
                          backgroundColor: Colors.error,
                          borderRadius: 10,
                          minWidth: 20,
                          height: 20,
                          alignItems: 'center',
                          justifyContent: 'center',
                          paddingHorizontal: 6,
                        }}>
                        <Text
                          style={{
                            color: Colors.primaryForeground,
                            fontSize: 11,
                            fontWeight: '600',
                          }}>
                          {totalUnreadCount > 99 ? STRINGS.MORE_THAN_99 : totalUnreadCount}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text
                    style={{
                      fontSize: responsive.fontSize.xs,
                      color: Colors.text,
                      textAlign: 'center',
                    }}>
                    {STRINGS.MESSAGES}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={{ width: responsive.isSmall ? '23%' : '22%', alignItems: 'center' }}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={{ alignItems: 'center' }}
                  onPress={() => router.push('/(homes)/(qna)')}>
                  <View
                    style={{
                      height: responsive.isSmall ? 48 : 56,
                      width: responsive.isSmall ? 48 : 56,
                      borderRadius: responsive.isSmall ? 12 : 16,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: Colors.background,
                      marginBottom: responsive.spacing.xs,
                    }}>
                    <Ionicons
                      name="people-outline"
                      size={responsive.isSmall ? 22 : 26}
                      color={Colors.primary}
                    />
                  </View>
                  <Text
                    style={{
                      fontSize: responsive.fontSize.xs,
                      color: Colors.text,
                      textAlign: 'center',
                    }}>
                    {STRINGS.COMMUNITY}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Mẹo sức khỏe Section */}
        <View
          style={{
            paddingHorizontal: responsive.horizontalPadding,
            marginBottom: responsive.spacing.lg,
          }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: responsive.spacing.base,
            }}>
            <Text
              style={{ fontSize: responsive.fontSize.xl, fontWeight: 'bold', color: Colors.text }}>
              {STRINGS.HEALTH_TIPS}
            </Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{
              marginHorizontal: -responsive.horizontalPadding,
              paddingHorizontal: responsive.horizontalPadding,
            }}>
            <View
              style={{
                marginRight: responsive.spacing.base,
                width: responsive.isSmall ? 220 : 260,
                borderRadius: 20,
                padding: responsive.spacing.base,
                backgroundColor: Colors.white,
              }}>
              <View
                style={{
                  height: 48,
                  width: 48,
                  borderRadius: 24,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: Colors.background,
                  marginBottom: responsive.spacing.sm,
                }}>
                <Ionicons name="water-outline" size={24} color={Colors.primary} />
              </View>
              <Text
                style={{
                  fontSize: responsive.fontSize.base,
                  fontWeight: '600',
                  color: Colors.text,
                  marginBottom: responsive.spacing.xs,
                }}>
                {STRINGS.DRINK_WATER}
              </Text>
              <Text
                style={{
                  fontSize: responsive.fontSize.sm,
                  color: Colors.textSecondary,
                  lineHeight: 20,
                }}>
                {STRINGS.DRINK_WATER_DESC}
              </Text>
            </View>

            <View
              style={{
                marginRight: responsive.spacing.base,
                width: responsive.isSmall ? 220 : 260,
                borderRadius: 20,
                padding: responsive.spacing.base,
                backgroundColor: Colors.white,
              }}>
              <View
                style={{
                  height: 48,
                  width: 48,
                  borderRadius: 24,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: Colors.secondaryLight2,
                  marginBottom: responsive.spacing.sm,
                }}>
                <Ionicons name="sunny-outline" size={24} color={Colors.secondary} />
              </View>
              <Text
                style={{
                  fontSize: responsive.fontSize.base,
                  fontWeight: '600',
                  color: Colors.text,
                  marginBottom: responsive.spacing.xs,
                }}>
                {STRINGS.MORNING_SUNBATHING}
              </Text>
              <Text
                style={{
                  fontSize: responsive.fontSize.sm,
                  color: Colors.textSecondary,
                  lineHeight: 20,
                }}>
                {STRINGS.SUNBATHING_DESC}
              </Text>
            </View>

            <View
              style={{
                marginRight: responsive.spacing.base,
                width: responsive.isSmall ? 220 : 260,
                borderRadius: 20,
                padding: responsive.spacing.base,
                backgroundColor: Colors.white,
              }}>
              <View
                style={{
                  height: 48,
                  width: 48,
                  borderRadius: 24,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: Colors.background,
                  marginBottom: responsive.spacing.sm,
                }}>
                <Ionicons name="bed-outline" size={24} color={Colors.primary} />
              </View>
              <Text
                style={{
                  fontSize: responsive.fontSize.base,
                  fontWeight: '600',
                  color: Colors.text,
                  marginBottom: responsive.spacing.xs,
                }}>
                {STRINGS.GET_SLEEP}
              </Text>
              <Text
                style={{
                  fontSize: responsive.fontSize.sm,
                  color: Colors.textSecondary,
                  lineHeight: 20,
                }}>
                {STRINGS.SLEEP_DESC}
              </Text>
            </View>
          </ScrollView>
        </View>

        {/* Tin tức & Sự kiện Section */}
        <View
          style={{
            paddingHorizontal: responsive.horizontalPadding,
            marginBottom: responsive.spacing.lg,
          }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: responsive.spacing.base,
            }}>
            <Text
              style={{ fontSize: responsive.fontSize.xl, fontWeight: 'bold', color: Colors.text }}>
              {STRINGS.NEWS_EVENTS}
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(homes)/(articles)')}
              activeOpacity={0.7}
              style={{ padding: 4 }}>
              <Text
                style={{
                  fontSize: responsive.fontSize.sm,
                  fontWeight: '600',
                  color: Colors.primary,
                }}>
                {STRINGS.SEE_ALL}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ gap: responsive.spacing.sm }}>
            {isLoadingArticles ? (
              // Loading skeleton
              [1, 2, 3].map((index) => (
                <View
                  key={index}
                  style={{
                    borderRadius: 20,
                    backgroundColor: Colors.white,
                    padding: responsive.spacing.base,
                  }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Skeleton
                      width={48}
                      height={48}
                      borderRadius={14}
                      style={{ marginRight: responsive.spacing.base }}
                    />
                    <View style={{ flex: 1 }}>
                      <Skeleton
                        width="80%"
                        height={14}
                        style={{ marginBottom: responsive.spacing.xs }}
                      />
                      <Skeleton width="40%" height={12} />
                    </View>
                  </View>
                </View>
              ))
            ) : articles.length > 0 ? (
              articles.map((article) => {
                return (
                  <TouchableOpacity
                    key={article.id}
                    activeOpacity={0.7}
                    style={{
                      borderRadius: 20,
                      backgroundColor: Colors.white,
                      overflow: 'hidden',
                    }}
                    onPress={() => router.push(`/(homes)/(articles)/${article.id}`)}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        padding: responsive.spacing.base,
                      }}>
                      {article.image ? (
                        <Image
                          source={{ uri: article.image }}
                          style={{
                            height: 48,
                            width: 48,
                            borderRadius: 14,
                            backgroundColor: Colors.backgroundSecondary,
                            marginRight: responsive.spacing.base,
                          }}
                          resizeMode="cover"
                        />
                      ) : (
                        <View
                          style={{
                            height: 48,
                            width: 48,
                            borderRadius: 14,
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: Colors.background,
                            marginRight: responsive.spacing.base,
                          }}>
                          <Ionicons name="newspaper-outline" size={24} color={Colors.primary} />
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontSize: responsive.fontSize.sm,
                            fontWeight: '600',
                            color: Colors.text,
                            marginBottom: responsive.spacing.xs,
                          }}
                          numberOfLines={2}>
                          {article.title}
                        </Text>
                        <Text
                          style={{ fontSize: responsive.fontSize.xs, color: Colors.textSecondary }}>
                          {formatArticleTime(article.createdAt)}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color={Colors.primary} />
                    </View>
                  </TouchableOpacity>
                );
              })
            ) : (
              // No articles state
              <View
                style={{
                  borderRadius: 20,
                  backgroundColor: Colors.white,
                  padding: responsive.spacing.lg,
                  alignItems: 'center',
                }}>
                <Ionicons name="newspaper-outline" size={32} color={Colors.textMuted} />
                <Text
                  style={{
                    fontSize: responsive.fontSize.sm,
                    color: Colors.textMuted,
                    marginTop: responsive.spacing.xs,
                  }}>
                  {STRINGS.NO_NEWS}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Footer Section with Gradient Background */}
        <LinearGradient
          colors={Colors.gradientSecondary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            marginHorizontal: responsive.horizontalPadding,
            marginBottom: responsive.spacing.lg,
            borderRadius: 24,
            padding: responsive.spacing.lg,
            shadowColor: Colors.shadow,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.25,
            shadowRadius: 20,
            elevation: 8,
          }}>
          <View style={{ alignItems: 'center' }}>
            <View
              style={{
                height: responsive.isSmall ? 120 : 140,
                width: responsive.isSmall ? 120 : 140,
                borderRadius: responsive.isSmall ? 60 : 70,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                marginBottom: responsive.spacing.lg,
                shadowColor: Colors.shadow,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
              }}>
              <Image
                source={require('../../assets/Hospital building-rafiki.png')}
                style={{
                  width: responsive.isSmall ? 100 : 120,
                  height: responsive.isSmall ? 100 : 120,
                  resizeMode: 'contain',
                }}
                fadeDuration={200}
              />
            </View>
            <Text
              style={{
                fontSize: responsive.fontSize.xl,
                fontWeight: 'bold',
                color: Colors.primaryForeground,
                textAlign: 'center',
                marginBottom: responsive.spacing.xs,
              }}>
              {STRINGS.FOOTER_TITLE}
            </Text>
            <Text
              style={{
                fontSize: responsive.fontSize.sm,
                color: 'rgba(255, 255, 255, 0.9)',
                textAlign: 'center',
                marginBottom: responsive.spacing.base,
              }}>
              {STRINGS.FOOTER_SUBTITLE}
            </Text>
            <View
              style={{
                height: 1,
                width: 64,
                backgroundColor: 'rgba(255, 255, 255, 0.3)',
                marginBottom: responsive.spacing.base,
              }}
            />
            {/* Sepolia Logo */}
            <View style={{ alignItems: 'center', marginBottom: responsive.spacing.base }}>
              <Image
                source={require('../../assets/sepolia-icon.png')}
                style={{
                  width: responsive.isSmall ? 120 : 140,
                  height: responsive.isSmall ? 40 : 50,
                  resizeMode: 'contain',
                }}
                fadeDuration={200}
              />
            </View>
            <Text style={{ fontSize: responsive.fontSize.xs, color: 'rgba(255, 255, 255, 0.8)' }}>
              {STRINGS.COPYRIGHT}
            </Text>
          </View>
        </LinearGradient>
      </ScrollView>
    </View>
  );
}
