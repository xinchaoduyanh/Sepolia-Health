/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ['@workspace/ui'],
    devIndicators: {
        position: 'bottom-right'
    },

    // Disable TypeScript checking for build
    typescript: {
        ignoreBuildErrors: true,
    },

    // Disable ESLint for build
    eslint: {
        ignoreDuringBuilds: true,
    },

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

        // Ignore type errors during build
        if (!dev) {
            config.ignoreWarnings = [
                /The inferred type of .* cannot be named without a reference to/,
            ]
        }

        return config
    },

    // Tăng giới hạn build để tránh cảnh báo
    onDemandEntries: {
        maxInactiveAge: 60 * 1000, // 1 phút
        pagesBufferLength: 5,
    },

    // Cấu hình để xử lý lỗi prerender
    trailingSlash: false,
    skipTrailingSlashRedirect: true,
}

export default nextConfig
