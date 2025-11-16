import { useForgotPassword, useVerifyForgotPasswordOtp, useResetPassword } from '../api/auth';

export function useForgotPasswordFlow() {
  const forgotPasswordMutation = useForgotPassword();
  const verifyOtpMutation = useVerifyForgotPasswordOtp();
  const resetPasswordMutation = useResetPassword();

  return {
    // Step 1: Send OTP
    sendOtp: forgotPasswordMutation.mutateAsync,
    isSendingOtp: forgotPasswordMutation.isPending,
    sendOtpError: forgotPasswordMutation.error,

    // Step 2: Verify OTP
    verifyOtp: verifyOtpMutation.mutateAsync,
    isVerifyingOtp: verifyOtpMutation.isPending,
    verifyOtpError: verifyOtpMutation.error,

    // Step 3: Reset Password
    resetPassword: resetPasswordMutation.mutateAsync,
    isResettingPassword: resetPasswordMutation.isPending,
    resetPasswordError: resetPasswordMutation.error,
  };
}
