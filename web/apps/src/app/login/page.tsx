'use client'

import { useLogin } from '@/shared/hooks'
import { AlertMessage } from '@workspace/ui/components/AlertMessage'
import { Button } from '@workspace/ui/components/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/Card'
import { InputField } from '@workspace/ui/components/InputField'
import { Label } from '@workspace/ui/components/Label'
import { Heart, Loader2, Lock, Mail, Shield, Users } from 'lucide-react'
import { useState } from 'react'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')

    const loginMutation = useLogin()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        try {
            await loginMutation.mutateAsync({ email, password })
        } catch (err: any) {
            // Xử lý lỗi từ API response
            let errorMessage = 'Đăng nhập thất bại'

            if (err?.response?.data?.message) {
                // Lấy message từ backend response
                errorMessage = err.response.data.message
            } else if (err?.message) {
                // Fallback về message mặc định
                errorMessage = err.message
            }

            setError(errorMessage)
        }
    }

    return (
        <div className="w-full min-h-screen grid lg:grid-cols-5">
            {/* Left Side - Hero Image/Gradient (60%) */}
            <div className="hidden lg:flex lg:col-span-3 flex-col justify-center items-center relative overflow-hidden">
                {/* Soft Blue Gradient Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-sky-100 via-sky-200 to-cyan-100 z-0"></div>

                {/* Secondary subtle gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-white/30 via-transparent to-sky-50/50 z-0"></div>

                {/* Decorative Glassmorphism Elements */}
                <div className="absolute top-16 left-16 w-80 h-80 bg-gradient-to-br from-sky-300/40 to-cyan-200/30 rounded-full blur-3xl animate-pulse"></div>
                <div
                    className="absolute bottom-20 right-16 w-96 h-96 bg-gradient-to-tr from-cyan-200/40 to-sky-100/30 rounded-full blur-3xl"
                    style={{ animation: 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}
                ></div>
                <div
                    className="absolute top-1/2 left-1/4 w-64 h-64 bg-gradient-to-r from-blue-200/30 to-sky-100/20 rounded-full blur-2xl"
                    style={{ animation: 'pulse 5s cubic-bezier(0.4, 0, 0.6, 1) infinite 1s' }}
                ></div>

                {/* Floating Glassmorphism Cards */}
                <div
                    className="absolute top-24 right-24 backdrop-blur-md bg-white/40 border border-white/50 rounded-2xl p-4 shadow-xl animate-bounce"
                    style={{ animationDuration: '3s' }}
                >
                    <Heart className="w-8 h-8 text-sky-600" />
                </div>
                <div
                    className="absolute bottom-32 left-24 backdrop-blur-md bg-white/40 border border-white/50 rounded-2xl p-4 shadow-xl animate-bounce"
                    style={{ animationDuration: '4s', animationDelay: '0.5s' }}
                >
                    <Shield className="w-8 h-8 text-cyan-600" />
                </div>
                <div
                    className="absolute top-1/3 right-16 backdrop-blur-md bg-white/40 border border-white/50 rounded-2xl p-4 shadow-xl animate-bounce"
                    style={{ animationDuration: '3.5s', animationDelay: '1s' }}
                >
                    <Users className="w-8 h-8 text-sky-500" />
                </div>

                {/* Main Content with Fade-in Animation */}
                <div className="z-10 text-center p-12 relative animate-fadeIn">
                    <img
                        src="/image/Hospital family visit-bro.png"
                        alt="Hospital Visit"
                        className="w-full max-w-2xl mx-auto mb-10 drop-shadow-xl hover:scale-105 transition-transform duration-700 ease-out"
                    />
                    <h1 className="text-5xl font-bold text-sky-800 mb-5 tracking-tight drop-shadow-sm">
                        Sepolia Health
                    </h1>
                    <p className="text-xl text-sky-700/90 font-medium tracking-wide">
                        Hệ sinh thái chăm sóc sức khỏe toàn diện
                    </p>

                    {/* Decorative line */}
                    <div className="mt-8 flex items-center justify-center gap-2">
                        <div className="w-12 h-0.5 bg-gradient-to-r from-transparent to-sky-400 rounded-full"></div>
                        <div className="w-3 h-3 bg-sky-400 rounded-full animate-pulse"></div>
                        <div className="w-12 h-0.5 bg-gradient-to-l from-transparent to-sky-400 rounded-full"></div>
                    </div>
                </div>
            </div>

            {/* Right Side - Login Form (40%) */}
            <div className="lg:col-span-2 flex items-center justify-center p-4 sm:px-6 lg:px-8 bg-background relative z-10">
                <div className="w-full max-w-md space-y-8">
                    <div className="text-center relative pt-40">
                        <img
                            className="absolute -top-60 left-1/2 -translate-x-1/2 h-[36rem] w-auto max-w-full pointer-events-none opacity-90"
                            src="/image/sepolia-icon.png"
                            alt="Sepolia Health"
                        />
                        <h2 className="mt-6 text-3xl font-extrabold text-foreground">Đăng Nhập</h2>
                        <p className="mt-2 text-sm text-muted-foreground">Đăng nhập vào tài khoản của bạn</p>
                    </div>
                    <Card className="border-0 shadow-none sm:border sm:shadow-sm">
                        <CardHeader className="px-0 sm:px-6">
                            <CardTitle>Chào mừng trở lại</CardTitle>
                            <CardDescription>Nhập thông tin đăng nhập để truy cập hệ thống</CardDescription>
                        </CardHeader>
                        <CardContent className="px-0 sm:px-6">
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {error && <AlertMessage variant="error">{error}</AlertMessage>}

                                {/* Email Field with Icon */}
                                <div className="space-y-2">
                                    <Label htmlFor="email">Địa chỉ Email</Label>
                                    <div className="relative">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                            <Mail className="h-4 w-4" />
                                        </div>
                                        <InputField
                                            id="email"
                                            type="email"
                                            value={email}
                                            onChange={e => setEmail(e.target.value)}
                                            placeholder="admin@sepoliahealth.com"
                                            required
                                            disabled={loginMutation.isPending}
                                            className="pl-10"
                                        />
                                    </div>
                                </div>

                                {/* Password Field with Icon */}
                                <div className="space-y-2">
                                    <Label htmlFor="password">Mật khẩu</Label>
                                    <div className="relative">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                            <Lock className="h-4 w-4" />
                                        </div>
                                        <InputField
                                            id="password"
                                            type="password"
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            placeholder="Nhập mật khẩu của bạn"
                                            required
                                            disabled={loginMutation.isPending}
                                            className="pl-10"
                                        />
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <Button type="submit" className="w-full" isDisabled={loginMutation.isPending}>
                                    {loginMutation.isPending ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Đang đăng nhập...
                                        </>
                                    ) : (
                                        'Đăng Nhập'
                                    )}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Footer */}
                    <div className="text-center">
                        <p className="text-sm text-muted-foreground">Hệ Thống Quản Lý Sepolia Health</p>
                    </div>
                </div>
            </div>

            {/* Custom Animations */}
            <style jsx global>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes shake {
                    0%,
                    100% {
                        transform: translateX(0);
                    }
                    10%,
                    30%,
                    50%,
                    70%,
                    90% {
                        transform: translateX(-4px);
                    }
                    20%,
                    40%,
                    60%,
                    80% {
                        transform: translateX(4px);
                    }
                }

                .animate-fadeIn {
                    animation: fadeIn 0.8s ease-out forwards;
                }

                .animate-slideUp {
                    animation: slideUp 0.6s ease-out forwards;
                }

                .animate-shake {
                    animation: shake 0.5s ease-in-out;
                }

                /* Remove yellow autofill background while keeping border */
                input:-webkit-autofill,
                input:-webkit-autofill:hover,
                input:-webkit-autofill:focus,
                input:-webkit-autofill:active {
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: inherit;
                    transition: background-color 5000s ease-in-out 0s;
                    background-color: white !important;
                }
            `}</style>
        </div>
    )
}
