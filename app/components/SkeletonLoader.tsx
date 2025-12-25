import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { Animated, DimensionValue, View, ViewStyle } from 'react-native';

interface SkeletonProps {
  width: DimensionValue;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const Skeleton = ({ width, height, borderRadius = 4, style }: SkeletonProps) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: '#CBD5E1', // slate-300
          opacity,
        },
        style,
      ]}
    />
  );
};

export const FacilitySkeleton = () => {
  return (
    <View className="mb-3 rounded-xl border border-slate-200 bg-white p-4">
      <View className="flex-row items-start">
        <View className="mr-4">
          <Skeleton width={48} height={48} borderRadius={24} />
        </View>

        <View className="flex-1">
          <View className="mb-2 flex-row items-center justify-between">
            <Skeleton width="70%" height={20} />
          </View>

          <View className="mb-2 flex-row items-center">
            <Skeleton width="90%" height={16} />
          </View>

          <View className="flex-row items-center">
            <Skeleton width="50%" height={16} />
          </View>
        </View>
      </View>
    </View>
  );
};

export const ServiceSkeleton = () => {
  return (
    <View className="mb-3 rounded-xl border border-slate-200 bg-white p-4">
      <View className="flex-row items-start">
        <View className="mr-4">
          <Skeleton width={48} height={48} borderRadius={24} />
        </View>

        <View className="flex-1">
          <View className="mb-2 flex-row items-center justify-between">
            <Skeleton width="60%" height={20} />
          </View>

          <View className="mb-2">
            <Skeleton width="90%" height={14} style={{ marginBottom: 4 }} />
            <Skeleton width="80%" height={14} />
          </View>

          <View className="mt-2 flex-row items-center justify-between">
            <Skeleton width={60} height={16} />
            <Skeleton width={80} height={16} />
          </View>
        </View>
      </View>
    </View>
  );
};

export const DoctorSkeleton = () => {
  return (
    <View className="mb-3 rounded-xl border border-slate-200 bg-white p-4">
      <View className="flex-row items-start">
        <View className="mr-4">
          <Skeleton width={48} height={48} borderRadius={24} />
        </View>

        <View className="flex-1">
          <View className="mb-2 flex-row items-center justify-between">
            <Skeleton width="50%" height={20} />
          </View>

          <View className="mb-2">
            <Skeleton width={100} height={14} />
          </View>

          <View className="mb-2">
            <Skeleton width="40%" height={14} />
          </View>

          <View className="flex-row items-center">
            <Skeleton width={80} height={14} />
            <View style={{ width: 10 }} />
            <Skeleton width={40} height={14} />
          </View>
        </View>
      </View>
    </View>
  );
};

export const SelectionScreenSkeleton = ({
  title,
  showHomeButton = false,
  children,
  onBack,
}: {
  title: string;
  showHomeButton?: boolean;
  children: React.ReactNode;
  onBack?: () => void;
}) => {
  return (
    <View style={{ flex: 1, backgroundColor: '#E0F2FE' }}>
      <View style={{ height: 280, position: 'relative', marginTop: -60 }}>
        <LinearGradient
          colors={['#0284C7', '#06B6D4', '#10B981']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1 }}
        />
        {/* Header Content */}
        <View
          style={{
            position: 'absolute',
            top: 100,
            left: 24,
            right: 24,
            flexDirection: 'row',
            alignItems: 'center',
          }}>
          {/* Mock Back Button */}
          <View
            style={{
              height: 40,
              width: 40,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 20,
              backgroundColor: 'rgba(255,255,255,0.25)',
              marginRight: 12,
            }}>
            {/* We don't render icon to keep it pure skeleton like, or maybe we do? 
                    User asked to replace Loading Spinner. 
                    Better to keep the header static visible if possible, or mock it perfectly.
                    Let's render a static header view.
                */}
          </View>

          <View style={{ flex: 1 }}>
            {/* Title Skeleton or Text if we know it */}
            <View
              style={{
                width: 150,
                height: 30,
                backgroundColor: 'rgba(255,255,255,0.3)',
                borderRadius: 8,
              }}
            />
          </View>

          {showHomeButton && (
            <View
              style={{
                height: 40,
                width: 40,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 20,
                backgroundColor: 'rgba(255,255,255,0.25)',
              }}
            />
          )}
        </View>
      </View>

      <View style={{ paddingHorizontal: 24, marginTop: -80, marginBottom: 24 }}>
        {/* Search Bar Skeleton */}
        <View
          style={{
            marginBottom: 16,
            height: 50,
            backgroundColor: 'white',
            borderRadius: 12,
            borderWidth: 1,
            borderColor: '#E0F2FE',
          }}
        />

        {children}
      </View>
    </View>
  );
};

export const TimeSlotSkeleton = () => {
  return (
    <View className="flex-row flex-wrap justify-between">
      {Array.from({ length: 8 }).map((_, index) => (
        <View
          key={index}
          className="mb-3 w-[23%] rounded-xl border border-slate-200 bg-white p-3"
          style={{ height: 48 }}>
          <View className="items-center justify-center">
            <Skeleton width="80%" height={16} />
          </View>
        </View>
      ))}
    </View>
  );
};
