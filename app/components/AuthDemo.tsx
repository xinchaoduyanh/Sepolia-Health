import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useAuth } from '@/lib/hooks/useAuth';
import { useAppointments, useServices, useDoctorsByService } from '@/lib/api';

export default function AuthDemo() {
  const {
    isAuthenticated,
    user,
    login,
    register,
    verifyEmail,
    completeRegister,
    logout,
    isLoading,
    isLoggingIn,
    isRegistering,
    isVerifyingEmail,
    isCompletingRegister,
    isLoggingOut,
    loginError,
    registerError,
    verifyEmailError,
    completeRegisterError,
    logoutError,
  } = useAuth();

  const { data: appointments, isLoading: appointmentsLoading } = useAppointments();
  const { data: services, isLoading: servicesLoading } = useServices();
  const { data: doctors, isLoading: doctorsLoading } = useDoctorsByService(1);

  const handleLogin = async () => {
    try {
      await login('test@example.com', 'password123');
      console.log('Login successful');
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleRegister = async () => {
    try {
      // Step 1: Send email
      await register('test@example.com');
      console.log('Register email sent');

      // Step 2: Verify email (in real app, user would enter OTP)
      await verifyEmail('test@example.com', '123456');
      console.log('Email verified');

      // Step 3: Complete registration
      await completeRegister({
        email: 'test@example.com',
        otp: '123456',
        firstName: 'John',
        lastName: 'Doe',
        phone: '0123456789',
        password: 'password123',
        role: 'PATIENT',
      });
      console.log('Registration completed');
    } catch (error) {
      console.error('Registration failed:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      console.log('Logout successful');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 p-4">
      <Text className="mb-4 text-2xl font-bold">Auth Demo với TanStack Query</Text>

      {/* Auth Section */}
      <View className="mb-6">
        <Text className="mb-2 text-lg font-semibold">Authentication</Text>
        {isAuthenticated ? (
          <View>
            <Text>
              Welcome, {user?.firstName} {user?.lastName}!
            </Text>
            <Text className="text-sm text-gray-600">Role: {user?.role}</Text>
            <Text className="text-sm text-gray-600">Email: {user?.email}</Text>
            <TouchableOpacity onPress={handleLogout} className="mt-2 rounded bg-red-500 p-3">
              <Text className="text-center text-white">
                {isLoggingOut ? 'Logging out...' : 'Logout'}
              </Text>
            </TouchableOpacity>
            {logoutError && (
              <Text className="mt-2 text-red-500">Logout error: {logoutError.message}</Text>
            )}
          </View>
        ) : (
          <View>
            <TouchableOpacity
              onPress={handleLogin}
              disabled={isLoggingIn}
              className="rounded bg-blue-500 p-3">
              <Text className="text-center text-white">
                {isLoggingIn ? 'Logging in...' : 'Login'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleRegister}
              disabled={isRegistering || isVerifyingEmail || isCompletingRegister}
              className="mt-2 rounded bg-green-500 p-3">
              <Text className="text-center text-white">
                {isRegistering
                  ? 'Sending email...'
                  : isVerifyingEmail
                    ? 'Verifying email...'
                    : isCompletingRegister
                      ? 'Completing registration...'
                      : 'Register'}
              </Text>
            </TouchableOpacity>

            {/* Error Messages */}
            {loginError && (
              <Text className="mt-2 text-red-500">Login error: {loginError.message}</Text>
            )}
            {registerError && (
              <Text className="mt-2 text-red-500">Register error: {registerError.message}</Text>
            )}
            {verifyEmailError && (
              <Text className="mt-2 text-red-500">
                Verify email error: {verifyEmailError.message}
              </Text>
            )}
            {completeRegisterError && (
              <Text className="mt-2 text-red-500">
                Complete register error: {completeRegisterError.message}
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Appointments Section */}
      <View className="mb-6">
        <Text className="mb-2 text-lg font-semibold">Appointments</Text>
        {appointmentsLoading ? (
          <ActivityIndicator />
        ) : (
          <View>
            <Text>Total appointments: {appointments?.total || 0}</Text>
            {appointments?.data?.slice(0, 3).map((appointment) => (
              <View key={appointment.id} className="mt-1 rounded bg-gray-100 p-2">
                <Text>Date: {appointment.date}</Text>
                <Text>Status: {appointment.status}</Text>
                <Text>
                  Doctor: Dr. {appointment.doctor.user.firstName} {appointment.doctor.user.lastName}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Services Section */}
      <View className="mb-6">
        <Text className="mb-2 text-lg font-semibold">Services</Text>
        {servicesLoading ? (
          <ActivityIndicator />
        ) : (
          <View>
            <Text>Total services: {services?.total || 0}</Text>
            {services?.data?.slice(0, 3).map((service) => (
              <View key={service.id} className="mt-1 rounded bg-gray-100 p-2">
                <Text>{service.name}</Text>
                <Text>Price: ${service.price}</Text>
                <Text>Duration: {service.duration} minutes</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Doctors Section */}
      <View className="mb-6">
        <Text className="mb-2 text-lg font-semibold">Doctors by Service</Text>
        {doctorsLoading ? (
          <ActivityIndicator />
        ) : (
          <View>
            <Text>Total doctors: {doctors?.length || 0}</Text>
            {doctors?.slice(0, 3).map((doctor) => (
              <View key={doctor.id} className="mt-1 rounded bg-gray-100 p-2">
                <Text>
                  Dr. {doctor.user.firstName} {doctor.user.lastName}
                </Text>
                <Text>Specialty: {doctor.specialty}</Text>
                <Text>Email: {doctor.user.email}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
