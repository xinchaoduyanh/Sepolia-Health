'use client'

import { useState } from 'react'
import { useAdminLogin } from '@/shared/hooks/useAuth'
import { Button } from '@workspace/ui/components/Button'
import { InputField } from '@workspace/ui/components/InputField'
import { Label } from '@workspace/ui/components/Label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/Card'
import { AlertMessage } from '@workspace/ui/components/AlertMessage'
import { Loader2 } from 'lucide-react'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')

    const loginMutation = useAdminLogin()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        try {
            await loginMutation.mutateAsync({ email, password })
            // Navigation is handled by the login mutation
        } catch (err: any) {
            setError(err.message || 'Login failed')
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <img className="mx-auto h-12 w-auto" src="/image/sepolia-icon.png" alt="Sepolia Health" />
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Admin Login</h2>
                    <p className="mt-2 text-sm text-gray-600">Sign in to your admin account</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Sign In</CardTitle>
                        <CardDescription>Enter your credentials to access the admin dashboard</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && <AlertMessage variant="error">{error}</AlertMessage>}

                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
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
                                <Label htmlFor="password">Password</Label>
                                <InputField
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    required
                                    disabled={loginMutation.isPending}
                                />
                            </div>

                            <Button type="submit" className="w-full" isDisabled={loginMutation.isPending}>
                                {loginMutation.isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Signing in...
                                    </>
                                ) : (
                                    'Sign In'
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <div className="text-center">
                    <p className="text-sm text-gray-600">Sepolia Health Management System</p>
                </div>
            </div>
        </div>
    )
}
