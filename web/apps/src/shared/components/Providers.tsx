'use client'

import React, { useEffect } from 'react'
import { matchQuery, MutationCache, QueryClient } from '@tanstack/react-query'
import dynamic from 'next/dynamic'
import { Toaster } from '@workspace/ui/components/Sonner'
import { ClientOnly } from './ClientOnly'
import { initializeApiClient } from '../lib/api-client'
import { useAuthStore } from '../stores/auth.store'
import { HealthcareThemeProvider } from '@workspace/ui/src/providers/healthcare-theme-context'

// Dynamic import để tránh hydration issues
const QueryClientProvider = dynamic(() => import('@tanstack/react-query').then(d => d.QueryClientProvider), {
    ssr: false,
})

const BsProvider = dynamic(() => import('@workspace/ui/components/Provider').then(d => d.BsProvider), { ssr: false })
const ThemeProvider = dynamic(() => import('@workspace/ui/src/providers/theme-provider').then(d => d.ThemeProvider), { ssr: false })

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
            // Only invalidate specific queries, not all queries
            if (mutation.meta?.invalidates) {
                await queryClient.invalidateQueries({
                    predicate: query =>
                        (mutation.meta?.invalidates as any)?.some((queryKey: any) => matchQuery({ queryKey }, query)),
                })
            }
            // Don't invalidate all queries by default
        },
    }),
})

export function Providers({ children }: { children: React.ReactNode }) {
    const authStore = useAuthStore()
    const hasInitialized = React.useRef(false)

    useEffect(() => {
        // 1. Chờ store được hydrate
        if (!authStore.hasHydrated) {
            console.log('⏳ Waiting for auth store rehydration...')
            return // Không làm gì cả cho đến khi hydrate xong
        }

        // TRÁNH DOUBLE INITIALIZATION trong Strict Mode
        if (!hasInitialized.current) {
            console.log('🔧 Initializing API client (first time)...')
            initializeApiClient(authStore)
            hasInitialized.current = true
        }

        // Nếu người dùng logout (isAuthenticated là false)
        if (!authStore.isAuthenticated) {
            console.log('🔴 User is logged out. Clearing all query cache...')
            queryClient.clear() // XÓA SẠCH cache để login lần sau không bị lỗi
        }

        // Chỉ lắng nghe 2 state này là đủ
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authStore.isAuthenticated, authStore.hasHydrated])

    return (
        <div suppressHydrationWarning>
            <ClientOnly>
                <BsProvider>
                    <ThemeProvider>
                        <HealthcareThemeProvider>
                            <QueryClientProvider client={queryClient}>
                                {children}
                                <ClientOnly>
                                    <Toaster />
                                </ClientOnly>
                                <ReactQueryDevtools initialIsOpen={false} />
                            </QueryClientProvider>
                        </HealthcareThemeProvider>
                    </ThemeProvider>
                </BsProvider>
            </ClientOnly>
        </div>
    )
}
