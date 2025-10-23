'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Eye, EyeOff, Lock, User } from 'lucide-react'
import Link from 'next/link'
import { SepoliaImages } from '@assets/index'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [emailError, setEmailError] = useState('')
    const [password, setPassword] = useState('')
    const [passwordError, setPasswordError] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [isLoggingIn, setIsLoggingIn] = useState(false)
    const [loginError, setLoginError] = useState<string | null>(null)

    const handleLogin = async () => {
        if (!email) return setEmailError('Vui lòng nhập email hoặc số điện thoại')
        if (!password) return setPasswordError('Vui lòng nhập mật khẩu')

        setIsLoggingIn(true)
        setLoginError(null)

        // giả lập API login
        await new Promise(r => setTimeout(r, 1200))

        if (email !== 'admin@example.com' || password !== '123456') {
            setLoginError('Sai thông tin đăng nhập')
        } else {
            alert('Đăng nhập thành công 🎉')
        }

        setIsLoggingIn(false)
    }

    return (
        <div className="min-h-screen bg-white flex flex-col">
            {/* Banner */}
            <div className="flex flex-col items-center mt-16 px-6 py-8">
                <div className="relative h-64 w-80 flex items-center justify-center rounded-full bg-amber-50">
                    <Image
                        src={SepoliaImages.DoctorPana}
                        alt="doctor illustration"
                        width={280}
                        height={200}
                        className="object-contain"
                    />
                    <div className="absolute -top-48 -left-28 z-10">
                        <Image
                            src={SepoliaImages.SepoliaIcon}
                            alt="logo overlay"
                            width={380}
                            height={360}
                            className="object-contain"
                        />
                    </div>
                </div>
            </div>

            {/* Form */}
            <div className="flex-1 px-6 pb-8 space-y-4 max-w-md mx-auto">
                {/* Email */}
                <div className="mb-4">
                    <div
                        className={`flex items-center rounded-lg px-4 py-4 ${
                            emailError ? 'border border-red-200 bg-red-50' : 'bg-gray-100'
                        }`}
                    >
                        <User size={20} color={emailError ? '#EF4444' : '#000'} />
                        <input
                            type="email"
                            placeholder="Số điện thoại/email đã đăng ký"
                            value={email}
                            onChange={e => {
                                setEmail(e.target.value)
                                if (emailError) setEmailError('')
                            }}
                            className="ml-3 flex-1 text-base text-gray-800 bg-transparent outline-none"
                            required
                        />
                    </div>
                    {emailError && <p className="mt-1 text-xs text-red-600">{emailError}</p>}
                </div>

                {/* Password */}
                <div className="mb-6">
                    <div
                        className={`flex items-center rounded-lg px-4 py-4 h-20 ${
                            passwordError ? 'border border-red-200 bg-red-50' : 'bg-gray-100'
                        }`}
                    >
                        <Lock size={20} color={passwordError ? '#EF4444' : '#000'} />
                        <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Nhập mật khẩu"
                            value={password}
                            onChange={e => {
                                setPassword(e.target.value)
                                if (passwordError) setPasswordError('')
                            }}
                            className="ml-3 flex-1 text-base text-gray-800 bg-transparent outline-none"
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="p-1">
                            {showPassword ? (
                                <Image src={SepoliaImages.PepeOpenEye} alt="open eye" height={50} width={50} />
                            ) : (
                                <Image src={SepoliaImages.PepeCoverEye} alt="cover eye" width={50} height={50} />
                            )}
                        </button>
                    </div>
                    {passwordError && <p className="mt-1 text-xs text-red-600">{passwordError}</p>}
                </div>

                {/* Login Button */}
                <button
                    onClick={handleLogin}
                    disabled={isLoggingIn}
                    className="w-full mb-6 rounded-lg bg-blue-400 py-4 text-lg font-bold text-white disabled:opacity-60"
                >
                    {isLoggingIn ? 'Đang đăng nhập...' : 'Đăng nhập'}
                </button>

                {/* Error */}
                {loginError && (
                    <div className="mb-4 rounded-lg bg-red-50 p-3">
                        <p className="text-center text-sm text-red-600">{loginError}</p>
                    </div>
                )}

                {/* Forgot password */}
                <div className="mb-8 text-center">
                    <Link href="/forgot-password" className="text-sm font-semibold text-blue-500">
                        Quên mật khẩu?
                    </Link>
                </div>

                {/* Register */}
                <div className="flex items-center justify-center pb-8">
                    <p className="text-sm text-gray-500">Bạn chưa có tài khoản? </p>
                    <Link href="/register" className="ml-1 text-sm font-bold text-blue-500">
                        Đăng ký ngay
                    </Link>
                </div>
            </div>
        </div>
    )
}
