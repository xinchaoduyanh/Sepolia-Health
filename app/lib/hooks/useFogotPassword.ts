import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { authApi } from '../api';

export function useForgotPassword() {
  const [email, setEmail] = useState('');
  const mutation = useMutation({
    mutationFn: async (email: string) => {
      return authApi.forgotPassword(email);
    },
  });
  const handleForgotPassword = (email: string) => {
    mutation.mutate(email);
  };
  return {
    email,
    setEmail,
    handleForgotPassword,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}
