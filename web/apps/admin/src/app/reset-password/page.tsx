'use client'

import { useResetPassword } from '@/shared/hooks'
import Image from 'next/image'
import React from 'react'

export default function ResetPasswordPage() {
    const {
        password,
        setPassword,
        confirm,
        setConfirm,
        showPassword,
        showConfirm,
        setShowConfirm,
        setShowPassword,
        handleResetPassword,
        error,
        loading,
        success,
    } = useResetPassword()

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8">
                <h1 className="text-2xl font-semibold mb-4">Đặt lại mật khẩu</h1>
                <p className="text-sm text-gray-600 mb-6">Nhập mật khẩu mới cho tài khoản của bạn.</p>

                <form onSubmit={handleResetPassword} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Mật khẩu mới</label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                className="w-full border rounded-lg p-2 pr-10"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="Ít nhất 8 ký tự"
                            />
                            <div
                                onClick={() => setShowPassword(s => !s)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-sm"
                            >
                                <Image
                                    src={showPassword ? '/image/pepe_open_eye.png' : '/image/pepe_cover_eye.png'}
                                    alt="Show password"
                                    width={25}
                                    height={25}
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Xác nhận mật khẩu</label>
                        <div className="relative">
                            <input
                                type={showConfirm ? 'text' : 'password'}
                                className="w-full border rounded-lg p-2"
                                value={confirm}
                                onChange={e => setConfirm(e.target.value)}
                                placeholder="Nhập lại mật khẩu"
                            />
                            <div
                                onClick={() => setShowConfirm(s => !s)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-sm"
                            >
                                <Image
                                    src={showConfirm ? '/image/pepe_open_eye.png' : '/image/pepe_cover_eye.png'}
                                    alt="Show password"
                                    width={25}
                                    height={25}
                                />
                            </div>
                        </div>
                    </div>

                    {error && <div className="text-red-600 text-sm">{error}</div>}
                    {success && <div className="text-green-600 text-sm">{success}</div>}

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 text-white font-medium py-2 rounded-lg disabled:opacity-60"
                        >
                            {loading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
                        </button>
                    </div>
                </form>

                <div className="text-xs text-gray-500 mt-4">
                    Ghi chú: link reset thường chứa token — nếu token hết hạn bạn cần gửi lại email đặt lại mật khẩu.
                </div>
            </div>
        </div>
    )
}
