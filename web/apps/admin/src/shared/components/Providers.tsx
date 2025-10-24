'use client'

import React, { useEffect, useRef } from 'react'
import { matchQuery, MutationCache, QueryClient } from '@tanstack/react-query'
import dynamic from 'next/dynamic'
import { Toaster } from '@workspace/ui/components/Sonner'
import { ClientOnly } from './ClientOnly'
import { initializeApiClient } from '../lib/api-client'
import { useAuthStore } from '../stores/auth.store'

// Dynamic import để tránh hydration issues
const QueryClientProvider = dynamic(() => import('@tanstack/react-query').then(d => d.QueryClientProvider), {
    ssr: false,
})

const BsProvider = dynamic(() => import('@workspace/ui/components/Provider').then(d => d.BsProvider), { ssr: false })

// Dynamic import để tránh hydration issues
const ReactQueryDevtools = dynamic(() => import('@tanstack/react-query-devtools').then(d => d.ReactQueryDevtools), {
    ssr: false,
})

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
            refetchOnWindowFocus: false,
            refetchOnMount: false,
            refetchOnReconnect: false,
            staleTime: 1000 * 60 * 5, // 5 minutes
            gcTime: 1000 * 60 * 10, // 10 minutes (renamed from cacheTime in v5)
        },
    },
    mutationCache: new MutationCache({
        onSuccess: async (_data, _variables, _context, mutation) => {
            await queryClient.invalidateQueries({
                predicate: query =>
                    // invalidate all matching tags at once
                    // or everything if no meta is provided
                    (mutation.meta?.invalidates as any)?.some((queryKey: any) => matchQuery({ queryKey }, query)) ??
                    true,
            })
        },
    }),
})

export function Providers({ children }: { children: React.ReactNode }) {
    const authStore = useAuthStore()
    const initialized = useRef(false)

    useEffect(() => {
        console.log('🔄 Providers: Auth store state:', {
            hasAuthStore: !!authStore,
            hasAccessToken: !!authStore?.accessToken,
            hasRefreshToken: !!authStore?.refreshToken,
            isAuthenticated: authStore?.isAuthenticated,
            isLoading: authStore?.isLoading,
            hasHydrated: authStore?.hasHydrated,
            user: authStore?.user,
            tokenPreview: authStore?.accessToken?.substring(0, 20) + '...',
        })

        // Only initialize API client AFTER rehydration is complete
        if (!initialized.current && authStore?.hasHydrated) {
            console.log('🔧 Rehydration complete! Initializing API client with auth store...')
            initializeApiClient(authStore)
            initialized.current = true
        } else if (!authStore?.hasHydrated) {
            console.log('⏳ Waiting for auth store rehydration to complete...')
        }
    }, [authStore])

    return (
        <div suppressHydrationWarning>
            <ClientOnly>
                <BsProvider>
                    <QueryClientProvider client={queryClient}>
                        {children}
                        <ClientOnly>
                            <Toaster />
                        </ClientOnly>
                        <ReactQueryDevtools initialIsOpen={false} />
                    </QueryClientProvider>
                </BsProvider>
            </ClientOnly>
        </div>
    )
}
