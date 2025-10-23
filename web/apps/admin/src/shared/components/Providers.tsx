'use client'

import React, { useEffect } from 'react'
import { matchQuery, MutationCache, QueryClient } from '@tanstack/react-query'
import dynamic from 'next/dynamic'
import { Toaster } from '@workspace/ui/components/Sonner'
import { ClientOnly } from './ClientOnly'
import { useCheckAuth } from '../hooks/useAuth'
import { CookieDebugger } from './CookieDebugger'

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
            staleTime: 1000 * 60,
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
    const { checkAuth } = useCheckAuth()

    useEffect(() => {
        // Check authentication status on app startup
        checkAuth()
    }, [checkAuth])

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
