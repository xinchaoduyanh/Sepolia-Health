'use client'

import React, { useState, useMemo } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@workspace/ui/lib/utils'
import { Badge } from './Badge'
import { Button } from './Button'
import { Card } from './Card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './Tabs'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea
} from 'recharts'
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Heart,
  Thermometer,
  Droplet,
  Wind,
  Calendar,
  Download,
  Maximize2,
  Settings,
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react'
import { useHealthcareTheme } from '@/providers/healthcare-theme-context'

// Types
export interface VitalSign {
  timestamp: Date
  heartRate?: number
  systolicBP?: number
  diastolicBP?: number
  temperature?: number
  oxygenSat?: number
  respiratoryRate?: number
  bloodGlucose?: number
}

export interface LabResult {
  id: string
  name: string
  value: number
  unit: string
  referenceRange: { min: number; max: number }
  status: 'normal' | 'high' | 'low' | 'critical'
  timestamp: Date
  category: 'chemistry' | 'hematology' | 'immunology' | 'microbiology' | 'other'
}

export interface ProgressMetric {
  date: Date
  painLevel?: number // 0-10 scale
  mobilityScore?: number // 0-100 scale
  appetiteLevel?: number // 0-10 scale
  sleepQuality?: number // 0-10 scale
  moodScore?: number // 0-10 scale
  notes?: string
}

export interface ChartAnnotation {
  id: string
  timestamp: Date
  type: 'event' | 'medication' | 'procedure' | 'note'
  title: string
  description?: string
  severity?: 'low' | 'medium' | 'high'
}

export interface TimeRange {
  start: Date
  end: Date
  label: string
}

export interface ExportFormat {
  id: string
  label: string
  format: 'pdf' | 'png' | 'csv' | 'json'
  icon?: React.ReactNode
}

export interface PatientChartProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof patientChartVariants> {
  data: {
    vitals?: VitalSign[]
    labs?: LabResult[]
    progress?: ProgressMetric[]
  }
  type: 'vitals' | 'labs' | 'progress' | 'combined'
  timeRange?: TimeRange
  annotations?: ChartAnnotation[]
  compareMode?: boolean
  exportOptions?: ExportFormat[]
  showGrid?: boolean
  showLegend?: boolean
  showAnnotations?: boolean
  height?: number
  interactive?: boolean
  colorBlindFriendly?: boolean
  onExport?: (format: ExportFormat) => void
  onAnnotationClick?: (annotation: ChartAnnotation) => void
  onDataPointClick?: (data: any) => void
}

const patientChartVariants = cva(
  'w-full space-y-4',
  {
    variants: {
      variant: {
        default: '',
        compact: 'space-y-2',
        detailed: 'space-y-6',
        emergency: 'border-2 border-destructive/50',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

const getVitalColor = (vital: string, value: number, normalRange?: { min: number; max: number }) => {
  if (!normalRange) return 'var(--color-primary)'

  if (value < normalRange.min || value > normalRange.max) {
    return 'var(--color-destructive)'
  }
  return 'var(--color-success)'
}

const getLabStatusColor = (status: LabResult['status']) => {
  switch (status) {
    case 'normal': return 'var(--color-success)'
    case 'high': return 'var(--color-warning)'
    case 'low': return 'var(--color-warning)'
    case 'critical': return 'var(--color-destructive)'
    default: return 'var(--color-primary)'
  }
}

// Color blind friendly palette
const colorBlindPalette = {
  primary: '#1f77b4',
  secondary: '#ff7f0e',
  success: '#2ca02c',
  warning: '#d62728',
  info: '#9467bd',
  accent: '#8c564b'
}

// Default time ranges
const defaultTimeRanges: TimeRange[] = [
  { start: new Date(Date.now() - 24 * 60 * 60 * 1000), end: new Date(), label: '24 Hours' },
  { start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), end: new Date(), label: '7 Days' },
  { start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), end: new Date(), label: '30 Days' },
  { start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), end: new Date(), label: '90 Days' },
]

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload) return null

  return (
    <Card className="p-3 shadow-lg border">
      <div className="text-sm font-medium">{label}</div>
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-2 text-xs">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span>{entry.name}: {entry.value}</span>
        </div>
      ))}
    </Card>
  )
}

export function PatientChart({
  className,
  variant,
  data,
  type,
  timeRange = defaultTimeRanges[0],
  annotations = [],
  compareMode = false,
  exportOptions = [],
  showGrid = true,
  showLegend = true,
  showAnnotations = true,
  height = 300,
  interactive = true,
  colorBlindFriendly = false,
  onExport,
  onAnnotationClick,
  onDataPointClick,
  ...props
}: PatientChartProps) {
  const { highContrastMode, reducedMotion, colorBlindMode } = useHealthcareTheme()
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange)
  const [selectedVitals, setSelectedVitals] = useState<string[]>(['heartRate', 'temperature'])
  const [fullscreen, setFullscreen] = useState(false)

  // Determine if we should use color blind friendly mode
  const shouldUseColorBlindFriendly = colorBlindFriendly || colorBlindMode !== 'none'

  // Process vitals data
  const processedVitals = useMemo(() => {
    if (!data.vitals) return []

    return data.vitals
      .filter(vital => vital.timestamp >= selectedTimeRange.start && vital.timestamp <= selectedTimeRange.end)
      .map(vital => ({
        time: vital.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        fullTime: vital.timestamp,
        heartRate: vital.heartRate,
        systolicBP: vital.systolicBP,
        diastolicBP: vital.diastolicBP,
        temperature: vital.temperature,
        oxygenSat: vital.oxygenSat,
        respiratoryRate: vital.respiratoryRate,
        bloodGlucose: vital.bloodGlucose,
      }))
      .sort((a, b) => a.fullTime.getTime() - b.fullTime.getTime())
  }, [data.vitals, selectedTimeRange])

  // Process labs data
  const processedLabs = useMemo(() => {
    if (!data.labs) return []

    return data.labs
      .filter(lab => lab.timestamp >= selectedTimeRange.start && lab.timestamp <= selectedTimeRange.end)
      .reduce((acc: any[], lab) => {
        const existing = acc.find(item => item.date === lab.timestamp.toLocaleDateString())
        if (existing) {
          existing[lab.name] = lab.value
        } else {
          acc.push({
            date: lab.timestamp.toLocaleDateString(),
            fullDate: lab.timestamp,
            [lab.name]: lab.value,
          })
        }
        return acc
      }, [])
      .sort((a, b) => a.fullDate.getTime() - b.fullDate.getTime())
  }, [data.labs, selectedTimeRange])

  // Process progress data
  const processedProgress = useMemo(() => {
    if (!data.progress) return []

    return data.progress
      .filter(progress => progress.date >= selectedTimeRange.start && progress.date <= selectedTimeRange.end)
      .map(progress => ({
        date: progress.date.toLocaleDateString(),
        fullDate: progress.date,
        painLevel: progress.painLevel,
        mobilityScore: progress.mobilityScore,
        appetiteLevel: progress.appetiteLevel,
        sleepQuality: progress.sleepQuality,
        moodScore: progress.moodScore,
        notes: progress.notes,
      }))
      .sort((a, b) => a.fullDate.getTime() - b.fullDate.getTime())
  }, [data.progress, selectedTimeRange])

  // Get color based on mode
  const getColor = (index: number) => {
    if (shouldUseColorBlindFriendly) {
      return Object.values(colorBlindPalette)[index % Object.values(colorBlindPalette).length]
    }
    const colors = ['var(--color-primary)', 'var(--color-success)', 'var(--color-warning)', 'var(--color-destructive)', 'var(--color-accent)']
    return colors[index % colors.length]
  }

  // Vitals Chart
  const VitalsChart = () => (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {['heartRate', 'systolicBP', 'temperature', 'oxygenSat'].map((vital) => (
          <Button
            key={vital}
            variant={selectedVitals.includes(vital) ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setSelectedVitals(prev =>
              prev.includes(vital)
                ? prev.filter(v => v !== vital)
                : [...prev, vital]
            )}
          >
            {vital === 'heartRate' && <Heart className="h-4 w-4 mr-1" />}
            {vital === 'systolicBP' && <Activity className="h-4 w-4 mr-1" />}
            {vital === 'temperature' && <Thermometer className="h-4 w-4 mr-1" />}
            {vital === 'oxygenSat' && <Wind className="h-4 w-4 mr-1" />}
            {vital.replace(/([A-Z])/g, ' $1').trim()}
          </Button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={processedVitals}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />}
          <XAxis
            dataKey="time"
            stroke="var(--color-muted-foreground)"
            fontSize={12}
          />
          <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
          <Tooltip content={<CustomTooltip />} />
          {showLegend && <Legend />}

          {/* Reference lines for normal ranges */}
          {selectedVitals.includes('heartRate') && (
            <>
              <ReferenceLine y={60} stroke="var(--color-warning)" strokeDasharray="5 5" />
              <ReferenceLine y={100} stroke="var(--color-warning)" strokeDasharray="5 5" />
            </>
          )}
          {selectedVitals.includes('temperature') && (
            <ReferenceLine y={37} stroke="var(--color-success)" strokeDasharray="5 5" />
            <ReferenceLine y={38.5} stroke="var(--color-warning)" strokeDasharray="5 5" />
          )}
          {selectedVitals.includes('oxygenSat') && (
            <ReferenceLine y={95} stroke="var(--color-success)" strokeDasharray="5 5" />
          )}

          {selectedVitals.map((vital, index) => (
            <Line
              key={vital}
              type="monotone"
              dataKey={vital}
              stroke={getColor(index)}
              strokeWidth={2}
              dot={interactive}
              animationDuration={reducedMotion ? 0 : 1000}
              name={vital.replace(/([A-Z])/g, ' $1').trim()}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )

  // Labs Chart
  const LabsChart = () => {
    const labNames = [...new Set(data.labs?.map(lab => lab.name) || [])]
    const selectedLabs = labNames.slice(0, 4) // Show first 4 labs

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {selectedLabs.map((labName, index) => {
            const labData = data.labs?.filter(lab => lab.name === labName)
            const latestValue = labData?.[labData.length - 1]

            return (
              <Card key={labName} className="p-4">
                <div className="text-sm font-medium mb-1">{labName}</div>
                <div className="text-2xl font-bold">
                  {latestValue?.value} {latestValue?.unit}
                </div>
                <Badge
                  variant={latestValue?.status === 'normal' ? 'success' :
                          latestValue?.status === 'critical' ? 'destructive' : 'warning'}
                  size="sm"
                  className="mt-2"
                >
                  {latestValue?.status?.toUpperCase()}
                </Badge>
                {latestValue?.referenceRange && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Range: {latestValue.referenceRange.min} - {latestValue.referenceRange.max}
                  </div>
                )}
              </Card>
            )
          })}
        </div>

        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={processedLabs}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />}
            <XAxis dataKey="date" stroke="var(--color-muted-foreground)" fontSize={12} />
            <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend />}

            {selectedLabs.map((labName, index) => (
              <Bar
                key={labName}
                dataKey={labName}
                fill={getColor(index)}
                animationDuration={reducedMotion ? 0 : 1000}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    )
  }

  // Progress Chart
  const ProgressChart = () => (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={processedProgress}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />}
          <XAxis dataKey="date" stroke="var(--color-muted-foreground)" fontSize={12} />
          <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
          <Tooltip content={<CustomTooltip />} />
          {showLegend && <Legend />}

          <Area
            type="monotone"
            dataKey="painLevel"
            stackId="1"
            stroke={getColor(0)}
            fill={getColor(0)}
            fillOpacity={0.6}
            animationDuration={reducedMotion ? 0 : 1000}
          />
          <Area
            type="monotone"
            dataKey="mobilityScore"
            stackId="1"
            stroke={getColor(1)}
            fill={getColor(1)}
            fillOpacity={0.6}
            animationDuration={reducedMotion ? 0 : 1000}
          />
          <Area
            type="monotone"
            dataKey="sleepQuality"
            stackId="1"
            stroke={getColor(2)}
            fill={getColor(2)}
            fillOpacity={0.6}
            animationDuration={reducedMotion ? 0 : 1000}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Progress Notes */}
      <div className="space-y-2">
        {processedProgress.map((progress, index) => (
          progress.notes && (
            <div key={index} className="p-2 bg-muted/30 rounded text-sm">
              <div className="font-medium">{progress.date}</div>
              <div className="text-muted-foreground">{progress.notes}</div>
            </div>
          )
        ))}
      </div>
    </div>
  )

  // Annotations Overlay
  const AnnotationsOverlay = () => {
    if (!showAnnotations || annotations.length === 0) return null

    return (
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Annotations</h4>
        <div className="space-y-1">
          {annotations
            .filter(ann => ann.timestamp >= selectedTimeRange.start && ann.timestamp <= selectedTimeRange.end)
            .map((annotation) => (
              <div
                key={annotation.id}
                className={cn(
                  'flex items-start gap-2 p-2 rounded cursor-pointer transition-colors',
                  'hover:bg-muted/50'
                )}
                onClick={() => onAnnotationClick?.(annotation)}
              >
                <div className={cn(
                  'mt-0.5',
                  annotation.severity === 'high' && 'text-destructive',
                  annotation.severity === 'medium' && 'text-warning',
                  annotation.severity === 'low' && 'text-success'
                )}>
                  {annotation.type === 'event' && <Calendar className="h-4 w-4" />}
                  {annotation.type === 'medication' && <Activity className="h-4 w-4" />}
                  {annotation.type === 'procedure' && <AlertTriangle className="h-4 w-4" />}
                  {annotation.type === 'note' && <Info className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{annotation.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {annotation.timestamp.toLocaleString()}
                  </div>
                  {annotation.description && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {annotation.description}
                    </div>
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>
    )
  }

  return (
    <div className={cn(patientChartVariants({ variant }), className)} {...props}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          {type === 'vitals' && 'Vital Signs'}
          {type === 'labs' && 'Laboratory Results'}
          {type === 'progress' && 'Progress Tracking'}
          {type === 'combined' && 'Patient Overview'}
        </h2>
        <div className="flex items-center gap-2">
          {/* Time Range Selector */}
          <select
            className="px-3 py-1.5 border rounded-md text-sm"
            value={selectedTimeRange.label}
            onChange={(e) => {
              const range = defaultTimeRanges.find(r => r.label === e.target.value)
              if (range) setSelectedTimeRange(range)
            }}
          >
            {defaultTimeRanges.map(range => (
              <option key={range.label} value={range.label}>
                {range.label}
              </option>
            ))}
          </select>

          {/* Export Options */}
          {exportOptions.length > 0 && (
            <div className="flex gap-1">
              {exportOptions.map(option => (
                <Button
                  key={option.id}
                  variant="outline"
                  size="sm"
                  onClick={() => onExport?.(option)}
                >
                  <Download className="h-4 w-4 mr-1" />
                  {option.label}
                </Button>
              ))}
            </div>
          )}

          {/* Fullscreen Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFullscreen(!fullscreen)}
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Chart Content */}
      <div className={cn(
        'transition-all duration-300',
        fullscreen && 'fixed inset-0 z-50 bg-background p-8'
      )}>
        {type === 'vitals' && <VitalsChart />}
        {type === 'labs' && <LabsChart />}
        {type === 'progress' && <ProgressChart />}
        {type === 'combined' && (
          <Tabs defaultValue="vitals" className="w-full">
            <TabsList>
              <TabsTrigger value="vitals">Vitals</TabsTrigger>
              <TabsTrigger value="labs">Labs</TabsTrigger>
              <TabsTrigger value="progress">Progress</TabsTrigger>
            </TabsList>
            <TabsContent value="vitals"><VitalsChart /></TabsContent>
            <TabsContent value="labs"><LabsChart /></TabsContent>
            <TabsContent value="progress"><ProgressChart /></TabsContent>
          </Tabs>
        )}
      </div>

      {/* Annotations */}
      <AnnotationsOverlay />

      {/* Color Blind Legend */}
      {shouldUseColorBlindFriendly && (
        <div className="mt-4 p-3 bg-muted/30 rounded-lg">
          <div className="text-sm font-medium mb-2">Color Blind Friendly Palette:</div>
          <div className="flex flex-wrap gap-3 text-xs">
            {Object.entries(colorBlindPalette).map(([name, color]) => (
              <div key={name} className="flex items-center gap-1">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: color }}
                />
                <span>{name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Specialized Chart Variants

export function EmergencyVitalsChart(props: Omit<PatientChartProps, 'type' | 'variant'>) {
  return (
    <PatientChart
      {...props}
      type="vitals"
      variant="emergency"
      showAnnotations
      interactive
    />
  )
}

export function WardPatientOverview(props: Omit<PatientChartProps, 'type' | 'variant'>) {
  return (
    <PatientChart
      {...props}
      type="combined"
      variant="detailed"
      showLegend
      showAnnotations
    />
  )
}

export function CompactVitalsChart(props: Omit<PatientChartProps, 'type' | 'variant'>) {
  return (
    <PatientChart
      {...props}
      type="vitals"
      variant="compact"
      height={200}
      showLegend={false}
    />
  )
}