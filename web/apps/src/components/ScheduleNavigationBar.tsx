'use client'

import { Button } from '@workspace/ui/components/Button'
import { BsSelect } from '@workspace/ui/components/Select'
import { Card, CardContent } from '@workspace/ui/components/Card'
import { ChevronLeft, ChevronRight, CalendarIcon, RefreshCw } from 'lucide-react'

type ViewMode = 'day' | 'week' | 'month'

interface NavigationBarProps {
    viewMode: ViewMode
    setViewMode: (mode: ViewMode) => void
    dateDisplay: string
    onPrevious: () => void
    onNext: () => void
    onToday: () => void
    onRefresh: () => void
}

export default function NavigationBar({
    viewMode,
    setViewMode,
    dateDisplay,
    onPrevious,
    onNext,
    onToday,
    onRefresh,
}: NavigationBarProps) {
    return (
        <Card className="border-2 shadow-lg bg-gradient-to-br from-card to-card/50">
            <CardContent className="p-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    {/* Left: Date Navigation */}
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onPrevious}
                            className="hover:bg-primary/10 hover:border-primary/50 transition-all"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 min-w-[200px] justify-center">
                            <CalendarIcon className="h-5 w-5 text-primary" />
                            <span className="text-base font-semibold capitalize text-foreground">{dateDisplay}</span>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onNext}
                            className="hover:bg-primary/10 hover:border-primary/50 transition-all"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="default"
                            size="sm"
                            onClick={onToday}
                            className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all"
                        >
                            Hôm nay
                        </Button>
                    </div>

                    {/* Right: Filter and View Mode */}
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onRefresh}
                            className="rounded-full hover:bg-primary/10 hover:text-primary transition-all"
                        >
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                        <BsSelect
                            selectedKey="all"
                            options={[
                                { id: 'all', name: 'Tất cả' },
                                { id: 'bs1', name: 'BS. Nguyễn Văn A' },
                                { id: 'bs2', name: 'BS. Trần Thị B' },
                            ]}
                            className="w-[120px]"
                        />

                        <div className="flex bg-muted rounded-lg p-1 border-2 border-border">
                            <Button
                                variant={viewMode === 'day' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setViewMode('day')}
                                className={`h-8 px-4 transition-all ${
                                    viewMode === 'day'
                                        ? 'bg-gradient-to-r from-primary to-primary/90 shadow-lg'
                                        : 'hover:bg-muted/80'
                                }`}
                            >
                                Ngày
                            </Button>
                            <Button
                                variant={viewMode === 'week' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setViewMode('week')}
                                className={`h-8 px-4 transition-all ${
                                    viewMode === 'week'
                                        ? 'bg-gradient-to-r from-primary to-primary/90 shadow-lg'
                                        : 'hover:bg-muted/80'
                                }`}
                            >
                                Tuần
                            </Button>
                            <Button
                                variant={viewMode === 'month' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setViewMode('month')}
                                className={`h-8 px-4 transition-all ${
                                    viewMode === 'month'
                                        ? 'bg-gradient-to-r from-primary to-primary/90 shadow-lg'
                                        : 'hover:bg-muted/80'
                                }`}
                            >
                                Tháng
                            </Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
