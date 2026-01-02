'use client'

import { useState } from 'react'
import { Button } from '@workspace/ui/components/Button'
import { InputField } from '@workspace/ui/components/InputField'
import { Label } from '@workspace/ui/components/Label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/Card'
import { AlertMessage } from '@workspace/ui/components/AlertMessage'
import { Loader2 } from 'lucide-react'
import { useLogin } from '@/shared/hooks'

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
        <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center relative pt-24">
                    <img 
                        className="absolute top-0 left-1/2 -translate-x-1/2 h-32 w-auto pointer-events-none" 
                        src="/image/sepolia-icon.png" 
                        alt="Sepolia Health" 
                    />
                    <h2 className="mt-8 text-3xl font-extrabold text-foreground">Đăng Nhập</h2>
                    <p className="mt-2 text-sm text-muted-foreground">Đăng nhập vào tài khoản của bạn</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Đăng Nhập</CardTitle>
                        <CardDescription>Nhập thông tin đăng nhập để truy cập hệ thống</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && <AlertMessage variant="error">{error}</AlertMessage>}

                            <div className="space-y-2">
                                <Label htmlFor="email">Địa chỉ Email</Label>
                                <InputField
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="admin@sepoliahealth.com"
                                    required
                                    disabled={loginMutation.isPending}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">Mật khẩu</Label>
                                <InputField
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="Nhập mật khẩu của bạn"
                                    required
                                    disabled={loginMutation.isPending}
                                />
                            </div>

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

                <div className="text-center">
                    <p className="text-sm text-muted-foreground">Hệ Thống Quản Lý Sepolia Health</p>
                </div>
            </div>
        </div>
    )
}
