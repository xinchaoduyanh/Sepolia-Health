'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { MedicalBadge, RealtimeVitalBadge } from './medical-badge';
import { Button } from './Button';
import {
    Heart,
    Activity,
    Thermometer,
    Droplets,
    Lung,
    Brain,
    AlertTriangle,
    TrendingUp,
    TrendingDown,
    Minus,
    ChevronUp,
    ChevronDown,
    Zap,
    Wifi,
    WifiOff,
    RefreshCw,
    Clock,
    BarChart3,
    Settings,
    Bell,
    BellOff,
    Volume2,
    VolumeX,
    Eye,
    EyeOff
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHealthcareTheme } from '@/providers/healthcare-theme-context';

export interface VitalSign {
  label: string;
  value: string;
  unit: string;
  status: 'normal' | 'warning' | 'critical';
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: number;
  lastReading?: string;
  range?: {
    min: string;
    max: string;
  };
  // Enhanced properties
  realtime?: boolean;
  history?: Array<{
    timestamp: string;
    value: string;
    status: 'normal' | 'warning' | 'critical';
  }>;
  device?: string;
  location?: string;
  lastUpdated?: string;
  alertThreshold?: {
    high: string;
    low: string;
  };
  criticalValue?: boolean;
  customRange?: {
    patient: string;
    normal: string;
  };
}

export interface VitalSignsCardProps {
  vitals: VitalSign[];
  patientName?: string;
  patientId?: string;
  lastUpdated?: string;
  className?: string;
  compact?: boolean;
  showAlerts?: boolean;
  onRefresh?: () => void;
  onVitalClick?: (vital: VitalSign) => void;
  // Enhanced props
  realtimeMode?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
  showTrends?: boolean;
  showHistory?: boolean;
  showAlertSettings?: boolean;
  soundEnabled?: boolean;
  criticalAlerts?: boolean;
  colorBlindMode?: boolean;
  highContrastMode?: boolean;
  chartView?: boolean;
  connectedDevices?: string[];
  enableNotifications?: boolean;
  detailedView?: boolean;
  exportEnabled?: boolean;
  onSettingsClick?: () => void;
  onExportClick?: () => void;
  onTrendClick?: (vital: VitalSign) => void;
  onAlertToggle?: (enabled: boolean) => void;
  onSoundToggle?: (enabled: boolean) => void;
  onRealtimeToggle?: (enabled: boolean) => void;
}

// Mini trend chart component
interface MiniTrendChartProps {
  history: VitalSign['history'];
  status: 'normal' | 'warning' | 'critical';
  compact?: boolean;
}

function MiniTrendChart({ history, status, compact = false }: MiniTrendChartProps) {
  if (!history || history.length < 2) return null;

  const height = compact ? 20 : 30
  const width = 60
  const values = history.map(h => parseFloat(h.value))
  const maxValue = Math.max(...values)
  const minValue = Math.min(...values)
  const range = maxValue - minValue || 1

  // Generate SVG path for trend line
  const pathData = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width
      const y = height - ((value - minValue) / range) * height
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
    })
    .join(' ')

  const statusColor = status === 'critical' ? '#dc2626' : status === 'warning' ? '#d97706' : '#10b981'

  return (
    <svg
      width={width}
      height={height}
      className="mt-1"
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
    >
      <polyline
        points={pathData.replace(/[ML]/g, '').split(' ').filter(Boolean).join(',')}
        fill="none"
        stroke={statusColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Add gradient fill for visual enhancement */}
      <defs>
        <linearGradient id={`gradient-${status}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={statusColor} stopOpacity="0.3" />
          <stop offset="100%" stopColor={statusColor} stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <polygon
        points={`${pathData.replace(/[ML]/g, '').split(' ').filter(Boolean).join(',')} ${width} ${height} 0 ${height}`}
        fill={`url(#gradient-${status})`}
      />
    </svg>
  )
}

const getVitalIcon = (label: string) => {
  const iconMap: Record<string, React.ReactNode> = {
    'Heart Rate': <Heart className="h-5 w-5" />,
    'Blood Pressure': <Activity className="h-5 w-5" />,
    'Temperature': <Thermometer className="h-5 w-5" />,
    'Oxygen Saturation': <Droplets className="h-5 w-5" />,
    'Respiratory Rate': <Lung className="h-5 w-5" />,
    'Blood Sugar': <Droplets className="h-5 w-5" />,
    'Blood Oxygen': <Droplets className="h-5 w-5" />,
    'Pulse': <Heart className="h-5 w-5" />,
    'ECG': <Activity className="h-5 w-5" />,
    'EEG': <Brain className="h-5 w-5" />,
  };
  return iconMap[label] || <Activity className="h-5 w-5" />;
};

const getTrendIcon = (trend?: 'up' | 'down' | 'stable') => {
  switch (trend) {
    case 'up':
      return <TrendingUp className="h-3 w-3 text-success" />;
    case 'down':
      return <TrendingDown className="h-3 w-3 text-destructive" />;
    case 'stable':
    default:
      return <Minus className="h-3 w-3 text-muted-foreground" />;
  }
};

const getStatusBadgeVariant = (status: VitalSign['status']) => {
  switch (status) {
    case 'critical':
      return 'vital-critical' as const;
    case 'warning':
      return 'vital-warning' as const;
    case 'normal':
    default:
      return 'vital-normal' as const;
  }
};

export function VitalSignsCard({
  vitals,
  patientName,
  patientId,
  lastUpdated,
  className,
  compact = false,
  showAlerts = true,
  onRefresh,
  onVitalClick,
  // Enhanced props
  realtimeMode = false,
  autoRefresh = false,
  refreshInterval = 30000,
  showTrends = true,
  showHistory = false,
  showAlertSettings = false,
  soundEnabled = false,
  criticalAlerts = true,
  colorBlindMode = false,
  highContrastMode = false,
  chartView = false,
  connectedDevices = [],
  enableNotifications = false,
  detailedView = false,
  exportEnabled = false,
  onSettingsClick,
  onExportClick,
  onTrendClick,
  onAlertToggle,
  onSoundToggle,
  onRealtimeToggle,
}: VitalSignsCardProps) {
  const {
    reducedMotion,
    colorBlindMode: themeColorBlindMode,
    highContrastMode: themeHighContrastMode,
    emergencyMode,
  } = useHealthcareTheme()

  const [localRealtimeMode, setLocalRealtimeMode] = useState(realtimeMode)
  const [localSoundEnabled, setLocalSoundEnabled] = useState(soundEnabled)
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh || !localRealtimeMode) return

    const interval = setInterval(() => {
      if (onRefresh) {
        onRefresh()
        setLastRefresh(new Date())
      }
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [autoRefresh, localRealtimeMode, refreshInterval, onRefresh])

  const criticalVitals = vitals.filter(v => v.status === 'critical')
  const warningVitals = vitals.filter(v => v.status === 'warning')
  const realtimeVitals = vitals.filter(v => v.realtime)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      if (onRefresh) await onRefresh()
      setLastRefresh(new Date())
    } finally {
      setIsRefreshing(false)
    }
  }

  const toggleRealtime = () => {
    const newMode = !localRealtimeMode
    setLocalRealtimeMode(newMode)
    onRealtimeToggle?.(newMode)
  }

  const toggleSound = () => {
    const newSound = !localSoundEnabled
    setLocalSoundEnabled(newSound)
    onSoundToggle?.(newSound)
  }

  const effectiveColorBlindMode = colorBlindMode || themeColorBlindMode !== 'none'
  const effectiveHighContrastMode = highContrastMode || themeHighContrastMode

  return (
    <Card className={cn(
      'medical-card border-border transition-all duration-300',
      emergencyMode && criticalVitals.length > 0 && 'border-destructive/50 shadow-lg',
      effectiveHighContrastMode && 'border-2 border-foreground',
      className
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Vital Signs
            {showAlerts && criticalVitals.length > 0 && (
              <AlertTriangle className="h-4 w-4 text-destructive animate-pulse" />
            )}
            {localRealtimeMode && !reducedMotion && (
              <Wifi className="h-3 w-3 text-success animate-pulse" />
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {/* Control buttons */}
            {showAlertSettings && (
              <Button
                variant="ghost"
                size="iconSm"
                onClick={() => onAlertToggle?.(!criticalAlerts)}
                className={cn("h-6 w-6", !criticalAlerts && "opacity-50")}
                accessibilityLabel={`Critical alerts ${criticalAlerts ? 'enabled' : 'disabled'}`}
              >
                {criticalAlerts ? <Bell className="h-3 w-3" /> : <BellOff className="h-3 w-3" />}
              </Button>
            )}

            {showAlertSettings && (
              <Button
                variant="ghost"
                size="iconSm"
                onClick={toggleSound}
                className={cn("h-6 w-6", !localSoundEnabled && "opacity-50")}
                accessibilityLabel={`Sound alerts ${localSoundEnabled ? 'enabled' : 'disabled'}`}
              >
                {localSoundEnabled ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
              </Button>
            )}

            <Button
              variant="ghost"
              size="iconSm"
              onClick={toggleRealtime}
              className={cn("h-6 w-6", !localRealtimeMode && "opacity-50")}
              accessibilityLabel={`Real-time mode ${localRealtimeMode ? 'enabled' : 'disabled'}`}
            >
              {localRealtimeMode ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            </Button>

            {onSettingsClick && (
              <Button
                variant="ghost"
                size="iconSm"
                onClick={onSettingsClick}
                className="h-6 w-6"
                accessibilityLabel="Settings"
              >
                <Settings className="h-3 w-3" />
              </Button>
            )}

            {exportEnabled && onExportClick && (
              <Button
                variant="ghost"
                size="iconSm"
                onClick={onExportClick}
                className="h-6 w-6"
                accessibilityLabel="Export data"
              >
                <BarChart3 className="h-3 w-3" />
              </Button>
            )}

            {onRefresh && (
              <Button
                variant="ghost"
                size="iconSm"
                onClick={handleRefresh}
                className={cn("h-6 w-6", isRefreshing && "animate-spin")}
                accessibilityLabel="Refresh vitals"
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
            )}

            {lastUpdated && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{lastUpdated}</span>
              </div>
            )}
          </div>
        </div>

        {(patientName || patientId) && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {patientName && <span>Patient: {patientName}</span>}
            {patientId && <span>ID: {patientId}</span>}
          </div>
        )}

        {/* Status badges */}
        <div className="flex flex-wrap gap-2 mt-2">
          {showAlerts && criticalVitals.length > 0 && (
            <MedicalBadge
              status="vital-critical"
              size="sm"
              showIcon={true}
              pulse={true}
              criticalAlert={true}
              label={`${criticalVitals.length} Critical Vital${criticalVitals.length !== 1 ? 's' : ''}`}
            >
              {criticalVitals.length} Critical
            </MedicalBadge>
          )}

          {showAlerts && warningVitals.length > 0 && (
            <MedicalBadge
              status="vital-warning"
              size="sm"
              showIcon={true}
              label={`${warningVitals.length} Warning Vital${warningVitals.length !== 1 ? 's' : ''}`}
            >
              {warningVitals.length} Warning
            </MedicalBadge>
          )}

          {localRealtimeMode && realtimeVitals.length > 0 && (
            <MedicalBadge
              status="vital-normal"
              size="compact"
              realtimeUpdate={true}
              colorBlindFriendly={effectiveColorBlindMode}
              label={`${realtimeVitals.length} Real-time Vital${realtimeVitals.length !== 1 ? 's' : ''}`}
            >
              <Wifi className="h-3 w-3 mr-1" />
              {realtimeVitals.length} Real-time
            </MedicalBadge>
          )}

          {connectedDevices.length > 0 && (
            <MedicalBadge
              status="stable"
              size="compact"
              label={`${connectedDevices.length} Device${connectedDevices.length !== 1 ? 's' : ''} Connected`}
            >
              <Activity className="h-3 w-3 mr-1" />
              {connectedDevices.length} Connected
            </MedicalBadge>
          )}
        </div>
      </CardHeader>

      <CardContent className={cn(
        compact ? "p-4" : "p-6"
      )}>
        <div className={cn(
          "grid gap-4",
          compact ? "grid-cols-2" :
          detailedView ? "grid-cols-1 md:grid-cols-2" :
          "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
        )}>
          {vitals.map((vital, index) => (
            <div
              key={index}
              className={cn(
                "relative flex flex-col items-center p-3 rounded-lg bg-background border transition-all cursor-pointer hover:shadow-md group",
                effectiveHighContrastMode && "border-2",
                effectiveColorBlindMode && vital.status === 'critical' && "border-2 border-dashed",
                effectiveColorBlindMode && vital.status === 'warning' && "border-2 border-dotted",
                vital.status === 'critical' && !effectiveColorBlindMode && "border-destructive/50 bg-destructive/5",
                vital.status === 'warning' && !effectiveColorBlindMode && "border-warning/50 bg-warning/5",
                vital.status === 'normal' && "border-success/20 bg-success/5",
                onVitalClick && "hover:scale-105 active:scale-95",
                localRealtimeMode && vital.realtime && "ring-2 ring-success/20"
              )}
              onClick={() => onVitalClick?.(vital)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  onVitalClick?.(vital);
                }
              }}
              aria-label={`${vital.label}: ${vital.value} ${vital.unit}, status: ${vital.status}${vital.realtime ? ', real-time monitoring' : ''}`}
            >
              {/* Real-time indicator */}
              {vital.realtime && localRealtimeMode && !reducedMotion && (
                <div className="absolute top-1 right-1 w-2 h-2 bg-success rounded-full animate-pulse" />
              )}

              {/* Critical alert indicator */}
              {vital.criticalValue && !reducedMotion && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full animate-ping" />
              )}

              <div className="flex items-center gap-2 mb-2">
                {vital.icon || getVitalIcon(vital.label)}
                <MedicalBadge
                  status={getStatusBadgeVariant(vital.status)}
                  size="sm"
                  pulse={vital.status === 'critical'}
                  colorBlindFriendly={effectiveColorBlindMode}
                />
              </div>

              <div className="text-center">
                <div className={cn(
                  "font-bold vital-signs",
                  compact ? "text-lg" : "text-2xl",
                  effectiveColorBlindMode ? "text-foreground" :
                  vital.status === 'critical' && "text-destructive",
                  effectiveColorBlindMode ? "text-foreground" :
                  vital.status === 'warning' && "text-warning",
                  effectiveColorBlindMode ? "text-foreground" :
                  vital.status === 'normal' && "text-success"
                )}>
                  {vital.value}
                  <span className="text-sm font-normal text-muted-foreground ml-1">
                    {vital.unit}
                  </span>
                </div>

                <div className="text-xs text-muted-foreground mt-1 font-medium">
                  {vital.label}
                </div>

                {/* Device and location info */}
                {(vital.device || vital.location) && detailedView && (
                  <div className="flex flex-col items-center gap-1 mt-1">
                    {vital.device && (
                      <span className="text-xs text-muted-foreground">
                        <Activity className="h-3 w-3 inline mr-1" />
                        {vital.device}
                      </span>
                    )}
                    {vital.location && (
                      <span className="text-xs text-muted-foreground">
                        📍 {vital.location}
                      </span>
                    )}
                  </div>
                )}

                {/* Range and trend information */}
                {(vital.range || vital.trend) && (
                  <div className="flex flex-col items-center gap-1 mt-1">
                    {vital.range && (
                      <span className="text-xs text-muted-foreground">
                        {vital.range.min}-{vital.range.max}
                      </span>
                    )}
                    {vital.trend && (
                      <button
                        className="flex items-center gap-1 hover:bg-muted/50 rounded px-1 py-0.5 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          onTrendClick?.(vital);
                        }}
                        aria-label={`View ${vital.label} trend details`}
                      >
                        {getTrendIcon(vital.trend)}
                        {vital.trendValue && (
                          <span className="text-xs">
                            {vital.trendValue > 0 ? '+' : ''}{vital.trendValue}%
                          </span>
                        )}
                      </button>
                    )}
                  </div>
                )}

                {/* Trend chart */}
                {showTrends && vital.history && vital.history.length > 1 && (
                  <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                    <MiniTrendChart
                      history={vital.history}
                      status={vital.status}
                      compact={compact}
                    />
                  </div>
                )}

                {/* Timestamp */}
                {vital.lastUpdated && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {vital.lastUpdated}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer information */}
        {detailedView && (autoRefresh || localRealtimeMode) && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <div className="text-xs text-muted-foreground">
              {autoRefresh && (
                <span>Auto-refresh: {refreshInterval / 1000}s</span>
              )}
              {localRealtimeMode && (
                <span className="ml-2">Real-time monitoring active</span>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              Last refresh: {lastRefresh.toLocaleTimeString()}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Enhanced convenience components for common vital sign sets

/**
 * BasicVitalSignsCard - Enhanced with automatic status detection and trends
 */
export function BasicVitalSignsCard({
  heartRate,
  bloodPressure,
  temperature,
  oxygenSaturation,
  realtime = false,
  ...props
}: Omit<VitalSignsCardProps, 'vitals'> & {
  heartRate: string;
  bloodPressure: string;
  temperature: string;
  oxygenSaturation: string;
  realtime?: boolean;
}) {
  const vitals: VitalSign[] = [
    {
      label: 'Heart Rate',
      value: heartRate,
      unit: 'bpm',
      status: parseInt(heartRate) > 100 || parseInt(heartRate) < 60 ? 'warning' : 'normal',
      trend: 'stable',
      range: { min: '60', max: '100' },
      realtime,
    },
    {
      label: 'Blood Pressure',
      value: bloodPressure,
      unit: 'mmHg',
      status: 'normal',
      trend: 'stable',
      range: { min: '90/60', max: '140/90' },
      realtime,
    },
    {
      label: 'Temperature',
      value: temperature,
      unit: '°C',
      status: parseFloat(temperature) > 37.5 || parseFloat(temperature) < 36 ? 'warning' : 'normal',
      trend: 'stable',
      range: { min: '36.0', max: '37.5' },
      realtime,
    },
    {
      label: 'Oxygen Saturation',
      value: oxygenSaturation,
      unit: '%',
      status: parseInt(oxygenSaturation) < 95 ? 'critical' : 'normal',
      trend: 'stable',
      range: { min: '95', max: '100' },
      realtime,
      criticalValue: parseInt(oxygenSaturation) < 90,
    },
  ];

  return <VitalSignsCard vitals={vitals} realtimeMode={realtime} {...props} />;
}

/**
 * RealtimeVitalSignsCard - For continuous monitoring
 */
export function RealtimeVitalSignsCard({
  vitals,
  ...props
}: VitalSignsCardProps) {
  return (
    <VitalSignsCard
      vitals={vitals}
      realtimeMode={true}
      autoRefresh={true}
      showAlertSettings={true}
      showTrends={true}
      detailedView={true}
      {...props}
    />
  );
}

/**
 * EmergencyVitalSignsCard - Optimized for emergency situations
 */
export function EmergencyVitalSignsCard({
  vitals,
  ...props
}: VitalSignsCardProps) {
  return (
    <VitalSignsCard
      vitals={vitals}
      showAlerts={true}
      criticalAlerts={true}
      soundEnabled={true}
      colorBlindMode={false}
      highContrastMode={true}
      compact={true}
      realtimeMode={true}
      autoRefresh={true}
      refreshInterval={5000}
      showAlertSettings={false}
      {...props}
    />
  );
}

/**
 * ICUVitalSignsCard - For intensive care monitoring
 */
export function ICUVitalSignsCard({
  vitals,
  patientName,
  patientId,
  ...props
}: VitalSignsCardProps) {
  return (
    <VitalSignsCard
      vitals={vitals}
      patientName={patientName}
      patientId={patientId}
      realtimeMode={true}
      autoRefresh={true}
      showTrends={true}
      showHistory={true}
      detailedView={true}
      showAlertSettings={true}
      exportEnabled={true}
      criticalAlerts={true}
      {...props}
    />
  );
}

/**
 * PediatricVitalSignsCard - Age-appropriate vital ranges and display
 */
export function PediatricVitalSignsCard({
  vitals,
  ageMonths,
  ...props
}: VitalSignsCardProps & {
  ageMonths: number;
}) {
  // Adjust ranges based on age
  const getAgeAppropriateRange = (vital: string, age: number) => {
    if (vital === 'Heart Rate') {
      if (age < 1) return { min: '100', max: '160' }
      if (age < 12) return { min: '90', max: '150' }
      if (age < 24) return { min: '80', max: '140' }
      return { min: '70', max: '120' }
    }
    if (vital === 'Respiratory Rate') {
      if (age < 1) return { min: '30', max: '60' }
      if (age < 12) return { min: '20', max: '30' }
      if (age < 24) return { min: '18', max: '30' }
      return { min: '16', max: '25' }
    }
    return null
  }

  const enhancedVitals = vitals.map(vital => ({
    ...vital,
    range: getAgeAppropriateRange(vital.label, ageMonths) || vital.range,
    customRange: ageMonths < 12 ? {
      patient: `${ageMonths} months`,
      normal: 'Pediatric range'
    } : undefined
  }))

  return (
    <VitalSignsCard
      vitals={enhancedVitals}
      showAlerts={true}
      showTrends={true}
      compact={ageMonths < 12}
      {...props}
    />
  );
}

/**
 * TelemedicineVitalSignsCard - For remote patient monitoring
 */
export function TelemedicineVitalSignsCard({
  vitals,
  connectionStatus = 'connected',
  deviceInfo,
  ...props
}: VitalSignsCardProps & {
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'error';
  deviceInfo?: {
    devices: string[];
    quality: 'excellent' | 'good' | 'fair' | 'poor';
  };
}) {
  return (
    <VitalSignsCard
      vitals={vitals}
      realtimeMode={connectionStatus === 'connected'}
      showAlertSettings={connectionStatus === 'connected'}
      showTrends={connectionStatus === 'connected'}
      connectedDevices={deviceInfo?.devices || []}
      criticalAlerts={connectionStatus === 'connected'}
      {...props}
    />
  );
}