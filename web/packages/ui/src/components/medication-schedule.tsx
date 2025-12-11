'use client'

import React, { useState, useMemo } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@workspace/ui/lib/utils'
import { Badge } from './Badge'
import { Button } from './Button'
import { Card } from './Card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './Tabs'
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Pill,
  Calendar,
  User,
  AlertCircle,
  Info,
  ChevronRight,
  Filter,
  Search
} from 'lucide-react'
import { useHealthcareTheme } from '@/providers/healthcare-theme-context'

// Types
export interface Medication {
  id: string
  name: string
  dosage: string
  frequency: string
  route: 'oral' | 'iv' | 'im' | 'topical' | 'inhalation'
  category: 'antibiotic' | 'painkiller' | 'chronic' | 'prn' | 'vitamin' | 'other'
  prescribedBy: string
  startDate: Date
  endDate?: Date
  instructions?: string
  contraindications?: string[]
  sideEffects?: string[]
}

export interface ScheduleSlot {
  id: string
  time: Date
  medications: ScheduledMedication[]
  administered?: boolean
  administeredBy?: string
  administeredAt?: Date
  notes?: string
  missed?: boolean
  missedReason?: string
}

export interface ScheduledMedication {
  medication: Medication
  scheduledTime: Date
  status: 'scheduled' | 'administered' | 'missed' | 'declined' | 'delayed'
  administeredBy?: string
  administeredAt?: Date
  notes?: string
  nextDose?: Date
}

export interface DrugInteraction {
  id: string
  medications: string[]
  severity: 'mild' | 'moderate' | 'severe'
  description: string
  recommendation: string
}

export interface MedicationScheduleProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof medicationScheduleVariants> {
  medications: Medication[]
  schedule: ScheduleSlot[]
  administrationStatus?: Record<string, any>
  interactions?: DrugInteraction[]
  view?: 'timeline' | 'list' | 'grid'
  colorBlindFriendly?: boolean
  patientId?: string
  dateRange?: { start: Date; end: Date }
  onAdminister?: (slotId: string, medicationId: string) => void
  onMiss?: (slotId: string, medicationId: string, reason: string) => void
  onReschedule?: (slotId: string, medicationId: string, newTime: Date) => void
}

const medicationScheduleVariants = cva(
  'w-full space-y-4',
  {
    variants: {
      variant: {
        default: '',
        compact: 'space-y-2',
        detailed: 'space-y-6',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

const getMedicationStatusColor = (status: ScheduledMedication['status']) => {
  switch (status) {
    case 'administered': return 'success'
    case 'missed': return 'destructive'
    case 'declined': return 'warning'
    case 'delayed': return 'warning'
    case 'scheduled': return 'primary'
    default: return 'secondary'
  }
}

const getInteractionSeverityColor = (severity: DrugInteraction['severity']) => {
  switch (severity) {
    case 'severe': return 'destructive'
    case 'moderate': return 'warning'
    case 'mild': return 'accent'
    default: return 'secondary'
  }
}

const getRouteIcon = (route: Medication['route']) => {
  switch (route) {
    case 'oral': return <Pill className="h-4 w-4" />
    case 'iv': return <AlertCircle className="h-4 w-4" />
    case 'im': return <AlertTriangle className="h-4 w-4" />
    case 'topical': return <Info className="h-4 w-4" />
    case 'inhalation': return <Clock className="h-4 w-4" />
    default: return <Pill className="h-4 w-4" />
  }
}

// Color blind friendly patterns
const getPatternForStatus = (status: ScheduledMedication['status'], colorBlindFriendly: boolean) => {
  if (!colorBlindFriendly) return {}

  switch (status) {
    case 'administered':
      return { backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(34,197,94,0.1) 3px, rgba(34,197,94,0.1) 6px)' }
    case 'missed':
      return { backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 3px, rgba(239,68,68,0.1) 3px, rgba(239,68,68,0.1) 6px)' }
    case 'declined':
      return { backgroundImage: 'repeating-linear-gradient(135deg, transparent, transparent 3px, rgba(245,158,11,0.1) 3px, rgba(245,158,11,0.1) 6px)' }
    case 'delayed':
      return { backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(245,158,11,0.1) 3px, rgba(245,158,11,0.1) 6px)' }
    default:
      return {}
  }
}

export function MedicationSchedule({
  className,
  variant,
  medications = [],
  schedule = [],
  administrationStatus = {},
  interactions = [],
  view = 'timeline',
  colorBlindFriendly = false,
  patientId,
  dateRange,
  onAdminister,
  onMiss,
  onReschedule,
  ...props
}: MedicationScheduleProps) {
  const { highContrastMode, reducedMotion, colorBlindMode } = useHealthcareTheme()
  const [selectedView, setSelectedView] = useState(view)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  // Determine if we should use color blind friendly mode
  const shouldUseColorBlindFriendly = colorBlindFriendly || colorBlindMode !== 'none'

  // Filter schedule based on selected date
  const filteredSchedule = useMemo(() => {
    return schedule.filter(slot => {
      const slotDate = new Date(slot.time)
      return slotDate.toDateString() === selectedDate.toDateString()
    })
  }, [schedule, selectedDate])

  // Group medications by time slots
  const timelineData = useMemo(() => {
    const grouped: Record<string, ScheduleSlot[]> = {}

    filteredSchedule.forEach(slot => {
      const timeKey = slot.time.getHours().toString().padStart(2, '0') + ':00'
      if (!grouped[timeKey]) {
        grouped[timeKey] = []
      }
      grouped[timeKey].push(slot)
    })

    return grouped
  }, [filteredSchedule])

  // Filter medications based on search and status
  const filteredMedications = useMemo(() => {
    return medications.filter(med => {
      const matchesSearch = med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           med.dosage.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesFilter = filterStatus === 'all' || med.category === filterStatus
      return matchesSearch && matchesFilter
    })
  }, [medications, searchTerm, filterStatus])

  const handleAdminister = (slotId: string, medicationId: string) => {
    onAdminister?.(slotId, medicationId)
  }

  const handleMiss = (slotId: string, medicationId: string, reason: string) => {
    onMiss?.(slotId, medicationId, reason)
  }

  // Timeline View
  const TimelineView = () => (
    <div className="space-y-4">
      {Object.entries(timelineData).map(([time, slots]) => (
        <div key={time} className="flex gap-4">
          <div className="flex-shrink-0 w-20 text-right">
            <div className="text-sm font-medium">{time}</div>
          </div>
          <div className="flex-1 space-y-2">
            {slots.map((slot) => (
              <Card key={slot.id} className="p-4">
                <div className="space-y-3">
                  {slot.medications.map((scheduledMed) => {
                    const med = scheduledMed.medication
                    const patternStyle = getPatternForStatus(scheduledMed.status, shouldUseColorBlindFriendly)

                    return (
                      <div
                        key={`${slot.id}-${med.id}`}
                        className={cn(
                          'flex items-center justify-between p-3 rounded-lg border transition-colors',
                          scheduledMed.status === 'administered' && 'bg-success/5 border-success/20',
                          scheduledMed.status === 'missed' && 'bg-destructive/5 border-destructive/20',
                          scheduledMed.status === 'scheduled' && 'bg-primary/5 border-primary/20',
                          scheduledMed.status === 'delayed' && 'bg-warning/5 border-warning/20'
                        )}
                        style={patternStyle}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            'p-2 rounded-full',
                            scheduledMed.status === 'administered' && 'bg-success text-success-foreground',
                            scheduledMed.status === 'missed' && 'bg-destructive text-destructive-foreground',
                            scheduledMed.status === 'scheduled' && 'bg-primary text-primary-foreground',
                            scheduledMed.status === 'delayed' && 'bg-warning text-warning-foreground'
                          )}>
                            {getRouteIcon(med.route)}
                          </div>
                          <div>
                            <div className="font-medium">{med.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {med.dosage} • {med.route.toUpperCase()}
                            </div>
                            {med.instructions && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {med.instructions}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge
                            variant={getMedicationStatusColor(scheduledMed.status) as any}
                            size="sm"
                          >
                            {scheduledMed.status}
                          </Badge>

                          {scheduledMed.status === 'scheduled' && (
                            <div className="flex gap-1">
                              <Button
                                variant="medical"
                                size="sm"
                                onClick={() => handleAdminister(slot.id, med.id)}
                              >
                                <CheckCircle className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleMiss(slot.id, med.id, 'Patient refused')}
                              >
                                <XCircle className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {slot.notes && (
                  <div className="text-sm text-muted-foreground mt-2">
                    Notes: {slot.notes}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  )

  // List View
  const ListView = () => (
    <div className="space-y-3">
      {filteredMedications.map((med) => {
        const nextDose = schedule
          .flatMap(s => s.medications)
          .find(sm => sm.medication.id === med.id && sm.status === 'scheduled')

        return (
          <Card key={med.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-full">
                  {getRouteIcon(med.route)}
                </div>
                <div>
                  <div className="font-medium">{med.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {med.dosage} • {med.frequency} • {med.category}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Prescribed by {med.prescribedBy}
                  </div>
                </div>
              </div>

              <div className="text-right">
                {nextDose && (
                  <div className="text-sm">
                    Next dose: {nextDose.scheduledTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
                <Badge variant="outline" size="sm" className="mt-1">
                  {med.route.toUpperCase()}
                </Badge>
              </div>
            </div>

            {med.instructions && (
              <div className="mt-3 p-2 bg-muted/30 rounded text-sm">
                <strong>Instructions:</strong> {med.instructions}
              </div>
            )}
          </Card>
        )
      })}
    </div>
  )

  // Grid View
  const GridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filteredMedications.map((med) => (
        <Card key={med.id} className="p-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {getRouteIcon(med.route)}
              <span className="font-medium">{med.name}</span>
            </div>
            <div className="space-y-1 text-sm">
              <div>{med.dosage}</div>
              <div>{med.frequency}</div>
              <div className="text-muted-foreground">{med.category}</div>
            </div>
            <div className="flex justify-between items-center">
              <Badge variant="outline" size="sm">
                {med.route.toUpperCase()}
              </Badge>
              <Button variant="ghost" size="sm">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )

  return (
    <div className={cn(medicationScheduleVariants({ variant }), className)} {...props}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Medication Schedule</h2>
        <div className="flex items-center gap-2">
          <Tabs value={selectedView} onValueChange={(v) => setSelectedView(v as any)}>
            <TabsList>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="list">List</TabsTrigger>
              <TabsTrigger value="grid">Grid</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Drug Interactions Alert */}
      {interactions.length > 0 && (
        <Card className="p-4 border-warning/50 bg-warning/5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
            <div className="flex-1">
              <div className="font-medium">Drug Interactions Detected</div>
              <div className="text-sm text-muted-foreground mt-1">
                {interactions.length} potential interaction{interactions.length > 1 ? 's' : ''} found
              </div>
              <div className="mt-2 space-y-2">
                {interactions.slice(0, 2).map((interaction) => (
                  <div key={interaction.id} className="text-sm p-2 bg-warning/10 rounded">
                    <Badge
                      variant={getInteractionSeverityColor(interaction.severity) as any}
                      size="sm"
                      className="mb-1"
                    >
                      {interaction.severity.toUpperCase()}
                    </Badge>
                    <div>{interaction.description}</div>
                  </div>
                ))}
                {interactions.length > 2 && (
                  <div className="text-xs text-muted-foreground">
                    +{interactions.length - 2} more interactions
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search medications..."
              className="w-full pl-10 pr-3 py-2 border rounded-md text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <select
          className="px-3 py-2 border rounded-md text-sm"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">All Categories</option>
          <option value="antibiotic">Antibiotics</option>
          <option value="painkiller">Painkillers</option>
          <option value="chronic">Chronic</option>
          <option value="prn">PRN</option>
          <option value="vitamin">Vitamins</option>
        </select>
        <input
          type="date"
          className="px-3 py-2 border rounded-md text-sm"
          value={selectedDate.toISOString().split('T')[0]}
          onChange={(e) => setSelectedDate(new Date(e.target.value))}
        />
      </div>

      {/* Content based on view */}
      {selectedView === 'timeline' && <TimelineView />}
      {selectedView === 'list' && <ListView />}
      {selectedView === 'grid' && <GridView />}

      {/* Color Blind Legend */}
      {shouldUseColorBlindFriendly && (
        <div className="mt-4 p-3 bg-muted/30 rounded-lg">
          <div className="text-sm font-medium mb-2">Pattern Legend:</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(34,197,94,0.3) 2px, rgba(34,197,94,0.3) 4px)' }} />
              <span>Administered</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(239,68,68,0.3) 2px, rgba(239,68,68,0.3) 4px)' }} />
              <span>Missed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundImage: 'repeating-linear-gradient(135deg, transparent, transparent 2px, rgba(245,158,11,0.3) 2px, rgba(245,158,11,0.3) 4px)' }} />
              <span>Declined</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(245,158,11,0.3) 2px, rgba(245,158,11,0.3) 4px)' }} />
              <span>Delayed</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Specialized Medication Schedule Variants

export function CriticalMedicationSchedule(props: MedicationScheduleProps) {
  return (
    <MedicationSchedule
      {...props}
      view="timeline"
      colorBlindFriendly
    />
  )
}

export function CompactMedicationSchedule(props: MedicationScheduleProps) {
  return (
    <MedicationSchedule
      {...props}
      variant="compact"
      view="list"
    />
  )
}

export function WardMedicationBoard(props: MedicationScheduleProps) {
  return (
    <MedicationSchedule
      {...props}
      variant="detailed"
      view="timeline"
      colorBlindFriendly
    />
  )
}