'use client'

import React, { useState, useEffect } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@workspace/ui/lib/utils'
import { Badge } from './Badge'
import { Button } from './Button'
import { Avatar } from './Avatar'
import { Card } from './Card'
import {
  User,
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
  Phone,
  MapPin,
  Calendar,
  Heart,
  Shield,
  AlertCircle,
  Info
} from 'lucide-react'
import { useHealthcareTheme } from '@/providers/healthcare-theme-context'

// Types
export interface PatientInfo {
  id: string
  name: string
  age: number
  gender: 'male' | 'female' | 'other'
  bloodType?: string
  allergies?: string[]
  avatar?: string
  dateOfBirth?: string
  medicalRecordNumber?: string
}

export interface PatientStatus {
  code: 'stable' | 'observation' | 'critical' | 'discharged' | 'in-surgery' | 'recovery'
  label: string
  description?: string
  lastUpdated: Date
  vitals?: {
    heartRate?: number
    bloodPressure?: string
    temperature?: number
    oxygenSat?: number
  }
}

export interface PatientAlert {
  id: string
  type: 'critical' | 'warning' | 'info' | 'medication' | 'allergy'
  title: string
  message: string
  timestamp: Date
  acknowledged?: boolean
  requiresAction?: boolean
}

export interface ActionButton {
  id: string
  label: string
  icon?: React.ReactNode
  variant?: 'primary' | 'secondary' | 'emergency' | 'clinical'
  onClick: () => void
  disabled?: boolean
  accessibilityLabel?: string
}

export interface DepartmentInfo {
  id: string
  name: string
  code: string
  color?: string
  room?: string
  bed?: string
}

export interface PatientStatusCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof patientStatusCardVariants> {
  patient: PatientInfo
  status: PatientStatus
  alerts?: PatientAlert[]
  actions?: ActionButton[]
  department?: DepartmentInfo
  realTime?: boolean
  compact?: boolean
  showVitals?: boolean
  showAlerts?: boolean
  showActions?: boolean
  onAlertClick?: (alert: PatientAlert) => void
  onStatusUpdate?: (status: PatientStatus) => void
}

const patientStatusCardVariants = cva(
  'relative overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-200',
  {
    variants: {
      variant: {
        default: 'border-border',
        critical: 'border-destructive/50 bg-destructive/5',
        warning: 'border-warning/50 bg-warning/5',
        success: 'border-success/50 bg-success/5',
        emergency: 'border-destructive bg-destructive/10 animate-pulse',
      },
      size: {
        default: 'p-6',
        compact: 'p-4',
        large: 'p-8',
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

const getStatusColor = (status: PatientStatus['code']) => {
  switch (status) {
    case 'stable': return 'success'
    case 'observation': return 'warning'
    case 'critical': return 'destructive'
    case 'discharged': return 'secondary'
    case 'in-surgery': return 'primary'
    case 'recovery': return 'accent'
    default: return 'secondary'
  }
}

const getAlertIcon = (type: PatientAlert['type']) => {
  switch (type) {
    case 'critical': return <AlertTriangle className="h-4 w-4" />
    case 'warning': return <AlertCircle className="h-4 w-4" />
    case 'info': return <Info className="h-4 w-4" />
    case 'medication': return <Clock className="h-4 w-4" />
    case 'allergy': return <Shield className="h-4 w-4" />
    default: return <AlertCircle className="h-4 w-4" />
  }
}

const getAlertColor = (type: PatientAlert['type']) => {
  switch (type) {
    case 'critical': return 'destructive'
    case 'warning': return 'warning'
    case 'info': return 'primary'
    case 'medication': return 'accent'
    case 'allergy': return 'warning'
    default: return 'secondary'
  }
}

// Real-time simulation hook
const useRealtimeStatus = (initialStatus: PatientStatus, enabled: boolean = false) => {
  const [status, setStatus] = useState(initialStatus)
  const [lastUpdate, setLastUpdate] = useState(Date.now())

  useEffect(() => {
    if (!enabled) return

    const interval = setInterval(() => {
      // Simulate real-time updates
      setLastUpdate(Date.now())
    }, 5000)

    return () => clearInterval(interval)
  }, [enabled])

  return { status, lastUpdate }
}

export function PatientStatusCard({
  className,
  variant,
  size,
  patient,
  status,
  alerts = [],
  actions = [],
  department,
  realTime = false,
  compact = false,
  showVitals = true,
  showAlerts = true,
  showActions = true,
  onAlertClick,
  onStatusUpdate,
  ...props
}: PatientStatusCardProps) {
  const { highContrastMode, reducedMotion, colorBlindMode, emergencyMode } = useHealthcareTheme()
  const { status: realTimeStatus, lastUpdate } = useRealtimeStatus(status, realTime)

  // Determine variant based on status
  const cardVariant = variant || (status.code === 'critical' ? 'critical' :
                                 status.code === 'observation' ? 'warning' : 'default')

  const activeAlerts = alerts.filter(alert => !alert.acknowledged)
  const criticalAlerts = activeAlerts.filter(alert => alert.type === 'critical')

  return (
    <Card
      className={cn(
        patientStatusCardVariants({ variant: cardVariant, size: compact ? 'compact' : size }),
        // Healthcare theme adaptations
        highContrastMode && 'border-2 border-foreground',
        emergencyMode && criticalAlerts.length > 0 && 'ring-2 ring-destructive ring-offset-2',
        className
      )}
      role="article"
      aria-label={`Patient status for ${patient.name}`}
      {...props}
    >
      {/* Real-time indicator */}
      {realTime && (
        <div className="absolute top-2 right-2 flex items-center gap-1">
          <div
            className={cn(
              'w-2 h-2 rounded-full',
              reducedMotion ? 'bg-success' : 'bg-success animate-pulse'
            )}
            aria-hidden="true"
          />
          <span className="text-xs text-muted-foreground" aria-label="Live updating">
            Live
          </span>
        </div>
      )}

      {/* Patient Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <Avatar
            src={patient.avatar}
            alt={patient.name}
            size={compact ? 'sm' : 'md'}
            fallback={<User className="h-4 w-4" />}
          />
          <div>
            <h3 className={cn(
              'font-semibold text-lg',
              compact && 'text-base'
            )}>
              {patient.name}
            </h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Age: {patient.age}</span>
              <span>•</span>
              <span>{patient.gender}</span>
              {patient.bloodType && (
                <>
                  <span>•</span>
                  <span className="font-mono">{patient.bloodType}</span>
                </>
              )}
            </div>
            {patient.medicalRecordNumber && (
              <div className="text-xs text-muted-foreground font-mono">
                MRN: {patient.medicalRecordNumber}
              </div>
            )}
          </div>
        </div>

        {/* Status Badge */}
        <Badge
          variant={getStatusColor(realTimeStatus.code) as any}
          size={compact ? 'sm' : 'default'}
          className={cn(
            'capitalize',
            realTimeStatus.code === 'critical' && !reducedMotion && 'animate-pulse'
          )}
        >
          {realTimeStatus.label}
        </Badge>
      </div>

      {/* Department and Location */}
      {department && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <MapPin className="h-4 w-4" />
          <span>{department.name}</span>
          {department.room && (
            <>
              <span>•</span>
              <span>Room {department.room}</span>
            </>
          )}
          {department.bed && (
            <>
              <span>•</span>
              <span>Bed {department.bed}</span>
            </>
          )}
        </div>
      )}

      {/* Vitals */}
      {showVitals && realTimeStatus.vitals && !compact && (
        <div className="mb-4 p-3 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Vital Signs</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            {realTimeStatus.vitals.heartRate && (
              <div className="flex items-center gap-1">
                <Heart className="h-3 w-3 text-destructive" />
                <span className="medical-data">{realTimeStatus.vitals.heartRate} bpm</span>
              </div>
            )}
            {realTimeStatus.vitals.bloodPressure && (
              <div>
                <span className="medical-data">{realTimeStatus.vitals.bloodPressure}</span>
              </div>
            )}
            {realTimeStatus.vitals.temperature && (
              <div>
                <span className="medical-data">{realTimeStatus.vitals.temperature}°C</span>
              </div>
            )}
            {realTimeStatus.vitals.oxygenSat && (
              <div>
                <span className="medical-data">{realTimeStatus.vitals.oxygenSat}% SpO₂</span>
              </div>
            )}
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            Last updated: {realTimeStatus.lastUpdated.toLocaleTimeString()}
          </div>
        </div>
      )}

      {/* Alerts */}
      {showAlerts && activeAlerts.length > 0 && (
        <div className={cn('mb-4', compact && 'mb-2')}>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <span className="text-sm font-medium">Alerts</span>
            <Badge variant="destructive" size="sm">
              {activeAlerts.length}
            </Badge>
          </div>
          <div className="space-y-1">
            {activeAlerts.slice(0, compact ? 2 : 3).map((alert) => (
              <div
                key={alert.id}
                className={cn(
                  'flex items-start gap-2 p-2 rounded-md text-sm cursor-pointer transition-colors',
                  'hover:bg-muted/50',
                  alert.type === 'critical' && 'bg-destructive/10 border border-destructive/20'
                )}
                onClick={() => onAlertClick?.(alert)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    onAlertClick?.(alert)
                  }
                }}
                aria-label={`Alert: ${alert.title}`}
              >
                <span className={cn(
                  'mt-0.5',
                  alert.type === 'critical' && 'text-destructive',
                  alert.type === 'warning' && 'text-warning',
                  alert.type === 'info' && 'text-primary'
                )}>
                  {getAlertIcon(alert.type)}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{alert.title}</div>
                  {!compact && (
                    <div className="text-xs text-muted-foreground truncate">
                      {alert.message}
                    </div>
                  )}
                </div>
                {alert.requiresAction && (
                  <div className="w-2 h-2 bg-primary rounded-full mt-1.5" />
                )}
              </div>
            ))}
            {activeAlerts.length > (compact ? 2 : 3) && (
              <div className="text-xs text-muted-foreground pl-6">
                +{activeAlerts.length - (compact ? 2 : 3)} more alerts
              </div>
            )}
          </div>
        </div>
      )}

      {/* Allergies */}
      {patient.allergies && patient.allergies.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-4 w-4 text-warning" />
            <span className="text-sm font-medium">Allergies</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {patient.allergies.map((allergy, index) => (
              <Badge key={index} variant="outline" size="sm" className="text-xs">
                {allergy}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {showActions && actions.length > 0 && (
        <div className={cn(
          'flex gap-2',
          compact && 'flex-col'
        )}>
          {actions.map((action) => (
            <Button
              key={action.id}
              variant={action.variant || 'clinical'}
              size={compact ? 'sm' : 'default'}
              onClick={action.onClick}
              disabled={action.disabled}
              className={cn(
                compact ? 'w-full' : 'flex-1',
                action.variant === 'emergency' && !reducedMotion && 'animate-pulse'
              )}
              aria-label={action.accessibilityLabel}
            >
              {action.icon}
              {action.label}
            </Button>
          ))}
        </div>
      )}

      {/* Status Description */}
      {realTimeStatus.description && !compact && (
        <div className="mt-4 pt-4 border-t text-sm text-muted-foreground">
          {realTimeStatus.description}
        </div>
      )}

      {/* Emergency Mode Overlay */}
      {emergencyMode && criticalAlerts.length > 0 && (
        <div className="absolute inset-0 bg-destructive/10 pointer-events-none rounded-lg" />
      )}
    </Card>
  )
}

// Specialized Patient Status Card Variants

export function CriticalPatientCard(props: Omit<PatientStatusCardProps, 'variant'>) {
  return (
    <PatientStatusCard
      {...props}
      variant="critical"
      showAlerts
      showVitals
      realTime
    />
  )
}

export function StablePatientCard(props: Omit<PatientStatusCardProps, 'variant'>) {
  return (
    <PatientStatusCard
      {...props}
      variant="success"
      compact
    />
  )
}

export function EmergencyPatientCard(props: Omit<PatientStatusCardProps, 'variant'>) {
  return (
    <PatientStatusCard
      {...props}
      variant="emergency"
      showAlerts
      showVitals
      realTime
    />
  )
}

export function CompactPatientCard(props: Omit<PatientStatusCardProps, 'compact'>) {
  return (
    <PatientStatusCard
      {...props}
      compact
      size="compact"
      showVitals={false}
      showActions={false}
    />
  )
}