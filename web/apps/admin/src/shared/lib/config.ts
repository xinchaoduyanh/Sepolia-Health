/**
 * Application configuration
 */

export const config = {
    // Backend API URL - update this to your backend URL
    apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api/admin',

    // App settings
    app: {
        name: 'Sepolia Health Admin',
        version: '1.0.0',
    },

    // Auth settings
    auth: {
        tokenKey: 'access_token',
        refreshTokenKey: 'refresh_token',
        userKey: 'user',
    },
} as const

export type Config = typeof config
