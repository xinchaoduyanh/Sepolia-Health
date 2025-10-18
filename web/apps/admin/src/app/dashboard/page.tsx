'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/Card'
import { Button } from '@workspace/ui/components/Button'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
    const router = useRouter()

    const handleLogout = () => {
        // TODO: Implement logout logic
        router.push('/login')
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                            <p className="text-gray-600">Welcome to Sepolia Health Admin Panel</p>
                        </div>
                        <Button onClick={handleLogout} variant="outline">
                            Logout
                        </Button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">1,234</div>
                                <p className="text-xs text-muted-foreground">+20.1% from last month</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Appointments</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">567</div>
                                <p className="text-xs text-muted-foreground">+12.5% from last month</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Doctors</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">45</div>
                                <p className="text-xs text-muted-foreground">+2 new this month</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">$12,345</div>
                                <p className="text-xs text-muted-foreground">+8.2% from last month</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Quick Actions */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Quick Actions</CardTitle>
                            <CardDescription>Common administrative tasks</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Button className="h-20 flex flex-col items-center justify-center">
                                    <span className="text-lg">👥</span>
                                    <span>Manage Patients</span>
                                </Button>
                                <Button className="h-20 flex flex-col items-center justify-center">
                                    <span className="text-lg">📅</span>
                                    <span>View Appointments</span>
                                </Button>
                                <Button className="h-20 flex flex-col items-center justify-center">
                                    <span className="text-lg">👨‍⚕️</span>
                                    <span>Manage Doctors</span>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    )
}
