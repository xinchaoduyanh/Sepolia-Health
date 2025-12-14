import { Providers } from '@/shared/components/Providers'
import '@workspace/ui/globals.css'

export const dynamic = 'force-dynamic'

export const metadata = {
    title: 'Sepolia Health Admin',
    description: 'Admin dashboard for Sepolia Health management system',
    icons: {
        icon: '/image/sepolia-icon.png',
        shortcut: '/image/sepolia-icon.png',
        apple: '/image/sepolia-icon.png',
    },
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="en" translate="no" suppressHydrationWarning>
            <body className="font-sans antialiased" suppressHydrationWarning>
                <Providers>{children}</Providers>
            </body>
        </html>
    )
}
