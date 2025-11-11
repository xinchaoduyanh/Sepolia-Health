/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ['@workspace/ui'],
    devIndicators: true,

    // Tối ưu hóa compile time
    experimental: {
        // Tối ưu import để giảm thời gian compile
        optimizePackageImports: ['lucide-react', '@workspace/ui', 'stream-chat-react', '@stream-io/video-react-sdk'],
        // Tối ưu Server Actions
        serverActions: {
            bodySizeLimit: '2mb',
        },
    },

    // Tối ưu webpack
    webpack: (config, { dev, isServer }) => {
        if (dev && !isServer) {
            // Tắt lazy compilation cho client-side trong dev mode
            config.experiments = {
                ...config.experiments,
                lazyCompilation: false,
            }
        }
        return config
    },

    // Tăng giới hạn build để tránh cảnh báo
    onDemandEntries: {
        maxInactiveAge: 60 * 1000, // 1 phút
        pagesBufferLength: 5,
    },
}

export default nextConfig
