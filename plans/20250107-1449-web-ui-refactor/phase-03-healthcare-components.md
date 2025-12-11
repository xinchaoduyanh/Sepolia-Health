# Phase 3: Healthcare-Specific Components

**Duration:** Week 3 (7 days)
**Objective:** Create specialized healthcare components for vital signs monitoring, medical data visualization, and clinical workflows.

## Day 1-3: Vital Signs & Medical Data Components

### 1.1 Vital Signs Card Component
Create `web/packages/ui/src/components/vital-signs-card.tsx`:

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { MedicalBadge } from './medical-badge';
import { Button } from './button';
import { cn } from '@/lib/utils';
import {
  Heart,
  Activity,
  Thermometer,
  Droplets,
  Wind,
  Eye,
  Brain,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Clock,
  User,
} from 'lucide-react';

export interface VitalSign {
  id: string;
  name: string;
  value: number;
  unit: string;
  status: 'normal' | 'warning' | 'critical' | 'elevated' | 'low';
  trend?: 'up' | 'down' | 'stable';
  lastUpdated: string;
  range?: {
    min: number;
    max: number;
    optimal: { min: number; max: number };
  };
  icon?: React.ReactNode;
  history?: Array<{
    timestamp: string;
    value: number;
  }>;
}

interface VitalSignsCardProps {
  vitals: VitalSign[];
  patientInfo?: {
    name: string;
    id: string;
    age: number;
    room?: string;
  };
  monitoringMode?: 'continuous' | 'periodic' | 'manual';
  showAlerts?: boolean;
  showHistory?: boolean;
  className?: string;
  onVitalClick?: (vital: VitalSign) => void;
  onEmergencyAlert?: (criticalVitals: VitalSign[]) => void;
}

export function VitalSignsCard({
  vitals,
  patientInfo,
  monitoringMode = 'periodic',
  showAlerts = true,
  showHistory = false,
  className,
  onVitalClick,
  onEmergencyAlert,
}: VitalSignsCardProps) {
  const [criticalVitals, setCriticalVitals] = useState<VitalSign[]>([]);

  const getVitalIcon = (vitalName: string) => {
    const iconMap = {
      'Heart Rate': Heart,
      'Blood Pressure': Activity,
      'Temperature': Thermometer,
      'Oxygen Saturation': Wind,
      'Respiratory Rate': Wind,
      'Blood Glucose': Droplets,
      'Blood Pressure Systolic': Activity,
      'Blood Pressure Diastolic': Activity,
      'Intracranial Pressure': Brain,
      'Eye Pressure': Eye,
    };
    const IconComponent = iconMap[vitalName as keyof typeof iconMap] || Activity;
    return <IconComponent className="h-5 w-5" />;
  };

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-success" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-warning" />;
      case 'stable':
        return <Minus className="h-4 w-4 text-muted-foreground" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return 'text-destructive';
      case 'warning': return 'text-warning';
      case 'elevated': return 'text-warning';
      case 'low': return 'text-primary';
      case 'normal': return 'text-success';
      default: return 'text-muted-foreground';
    }
  };

  const getBackgroundClass = (status: string) => {
    switch (status) {
      case 'critical': return 'bg-destructive/5 border-destructive/20';
      case 'warning': return 'bg-warning/5 border-warning/20';
      case 'elevated': return 'bg-warning/5 border-warning/20';
      case 'low': return 'bg-primary/5 border-primary/20';
      case 'normal': return 'bg-success/5 border-success/20';
      default: return 'bg-background border-border';
    }
  };

  // Check for critical vitals and trigger emergency alerts
  useEffect(() => {
    const critical = vitals.filter(vital => vital.status === 'critical');
    setCriticalVitals(critical);

    if (critical.length > 0 && showAlerts && onEmergencyAlert) {
      onEmergencyAlert(critical);
    }
  }, [vitals, showAlerts, onEmergencyAlert]);

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card className={cn(
      'vital-signs-card',
      criticalVitals.length > 0 && 'border-destructive animate-pulse',
      className
    )}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Vital Signs
            {monitoringMode === 'continuous' && (
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 bg-success rounded-full animate-pulse" />
                <span className="text-xs text-success">Live</span>
              </div>
            )}
          </CardTitle>

          {criticalVitals.length > 0 && (
            <Button
              variant="emergency"
              size="sm"
              onClick={() => onEmergencyAlert?.(criticalVitals)}
              className="animate-pulse"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Emergency: {criticalVitals.length} Critical
            </Button>
          )}
        </div>

        {patientInfo && (
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {patientInfo.name}
            </div>
            <div>ID: {patientInfo.id}</div>
            <div>Age: {patientInfo.age}</div>
            {patientInfo.room && <div>Room: {patientInfo.room}</div>}
          </div>
        )}
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {vitals.map((vital) => (
            <div
              key={vital.id}
              className={cn(
                'relative p-4 rounded-lg border transition-all cursor-pointer hover:shadow-md',
                getBackgroundClass(vital.status),
                vital.status === 'critical' && 'animate-pulse',
                'vital-sign-item'
              )}
              onClick={() => onVitalClick?.(vital)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  onVitalClick?.(vital);
                }
              }}
              aria-label={`Vital sign: ${vital.name}, Value: ${vital.value} ${vital.unit}, Status: ${vital.status}`}
            >
              {/* Critical Indicator */}
              {vital.status === 'critical' && (
                <div className="absolute -top-2 -right-2">
                  <AlertTriangle className="h-4 w-4 text-destructive animate-pulse" />
                </div>
              )}

              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {getVitalIcon(vital.name)}
                  <span className="text-sm font-medium text-muted-foreground">
                    {vital.name}
                  </span>
                </div>
                <MedicalBadge
                  status={`vital-${vital.status}` as any}
                  size="sm"
                  pulse={vital.status === 'critical'}
                />
              </div>

              {/* Value Display */}
              <div className="mb-3">
                <div className={cn(
                  'text-2xl font-bold tabular-nums',
                  getStatusColor(vital.status)
                )}>
                  {vital.value}
                  <span className="text-sm font-normal text-muted-foreground ml-1">
                    {vital.unit}
                  </span>
                </div>

                {/* Range Display */}
                {vital.range && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Normal: {vital.range.optimal.min}-{vital.range.optimal.max} {vital.unit}
                  </div>
                )}
              </div>

              {/* Trend and Timestamp */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  {getTrendIcon(vital.trend)}
                  <span className="text-muted-foreground capitalize">
                    {vital.trend || 'stable'}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {formatTime(vital.lastUpdated)}
                </div>
              </div>

              {/* Mini Chart (if history available and showHistory is true) */}
              {showHistory && vital.history && vital.history.length > 1 && (
                <div className="mt-3 h-8 border-t pt-2">
                  <VitalMiniChart
                    history={vital.history}
                    unit={vital.unit}
                    range={vital.range}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Emergency Alert Section */}
        {criticalVitals.length > 0 && showAlerts && (
          <div className="mt-6 p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-destructive animate-pulse" />
              <h3 className="font-semibold text-destructive">Critical Vital Signs Detected</h3>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {criticalVitals.map((vital) => (
                <div key={vital.id} className="flex items-center gap-2 text-sm">
                  {getVitalIcon(vital.name)}
                  <span className="font-medium">{vital.name}:</span>
                  <span className="text-destructive font-bold">
                    {vital.value} {vital.unit}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <Button variant="emergency" size="sm" onClick={() => onEmergencyAlert?.(criticalVitals)}>
                Initiate Emergency Protocol
              </Button>
              <Button variant="outline" size="sm">
                Notify Medical Team
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Mini Chart Component for Vital History
interface VitalMiniChartProps {
  history: Array<{ timestamp: string; value: number }>;
  unit: string;
  range?: { min: number; max: number };
}

function VitalMiniChart({ history, unit, range }: VitalMiniChartProps) {
  const values = history.map(h => h.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const rangeSize = max - min || 1;

  // Determine if values are within normal range
  const getPointColor = (value: number) => {
    if (!range) return 'text-muted-foreground';
    if (value < range.optimal.min || value > range.optimal.max) {
      return 'text-warning';
    }
    return 'text-success';
  };

  return (
    <div className="relative h-6 flex items-end gap-0.5" role="img" aria-label={`Vital sign trend over ${history.length} readings`}>
      {history.map((reading, index) => {
        const normalizedValue = ((reading.value - min) / rangeSize) * 100;
        return (
          <div
            key={index}
            className={cn(
              'flex-1 rounded-t-sm transition-colors',
              getPointColor(reading.value)
            )}
            style={{
              height: `${Math.max(normalizedValue, 10)}%`,
              backgroundColor: 'currentColor',
              opacity: 0.8,
            }}
            title={`${reading.value} ${unit} at ${new Date(reading.timestamp).toLocaleTimeString()}`}
          />
        );
      })}
    </div>
  );
}
```

### 1.2 Medical Timeline Component
Create `web/packages/ui/src/components/medical-timeline.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { MedicalBadge } from './medical-badge';
import { Button } from './button';
import { cn } from '@/lib/utils';
import {
  Calendar,
  Clock,
  User,
  FileText,
  Activity,
  Pill,
  TestTube,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Plus,
  Filter,
} from 'lucide-react';

export interface TimelineEvent {
  id: string;
  timestamp: string;
  type: 'appointment' | 'medication' | 'lab' | 'vital' | 'diagnosis' | 'treatment' | 'note' | 'emergency';
  title: string;
  description: string;
  status?: 'completed' | 'pending' | 'cancelled' | 'in-progress' | 'critical' | 'normal' | 'abnormal';
  provider?: {
    name: string;
    role: string;
  };
  location?: string;
  details?: Record<string, any>;
  attachments?: Array<{
    name: string;
    type: string;
    url: string;
  }>;
}

interface MedicalTimelineProps {
  events: TimelineEvent[];
  patientInfo?: {
    name: string;
    id: string;
  };
  compact?: boolean;
  showFilters?: boolean;
  className?: string;
  onEventClick?: (event: TimelineEvent) => void;
  onAddEvent?: () => void;
}

export function MedicalTimeline({
  events,
  patientInfo,
  compact = false,
  showFilters = true,
  className,
  onEventClick,
  onAddEvent,
}: MedicalTimelineProps) {
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const getEventIcon = (type: string, status?: string) => {
    const iconMap = {
      appointment: Calendar,
      medication: Pill,
      lab: TestTube,
      vital: Activity,
      diagnosis: FileText,
      treatment: Activity,
      note: FileText,
      emergency: AlertTriangle,
    };

    const IconComponent = iconMap[type as keyof typeof iconMap] || FileText;

    return (
      <div className={cn(
        'p-2 rounded-full',
        status === 'critical' && 'bg-destructive text-destructive-foreground animate-pulse',
        status === 'completed' && 'bg-success text-success-foreground',
        status === 'pending' && 'bg-warning text-warning-foreground',
        status === 'cancelled' && 'bg-muted text-muted-foreground',
        status === 'in-progress' && 'bg-primary text-primary-foreground animate-pulse',
        !status && 'bg-accent text-accent-foreground'
      )}>
        <IconComponent className="h-4 w-4" />
      </div>
    );
  };

  const getStatusBadge = (type: string, status?: string) => {
    if (!status) return null;

    const statusMap = {
      // Appointment statuses
      'appointment-completed': 'appointment-completed',
      'appointment-cancelled': 'appointment-cancelled',
      'appointment-in-progress': 'appointment-in-progress',

      // Medication statuses
      'medication-active': 'medication-active',
      'medication-completed': 'medication-active',
      'medication-overdue': 'medication-overdue',

      // Lab statuses
      'lab-critical': 'lab-critical',
      'lab-abnormal': 'lab-abnormal',
      'lab-normal': 'lab-normal',
      'lab-pending': 'lab-pending',

      // Vital statuses
      'vital-critical': 'vital-critical',
      'vital-warning': 'vital-warning',
      'vital-normal': 'vital-normal',

      // General statuses
      'emergency-active': 'emergency-active',
      'treatment-completed': 'treatment-completed',
      'treatment-in-progress': 'treatment-in-progress',
    };

    const badgeStatus = statusMap[`${type}-${status}` as keyof typeof statusMap] as any;
    return badgeStatus ? <MedicalBadge status={badgeStatus} size="sm" /> : null;
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      });
    }
  };

  // Filter events
  const filteredEvents = events.filter(event => {
    const typeMatch = filter === 'all' || event.type === filter;
    const searchMatch = !searchTerm ||
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.provider?.name.toLowerCase().includes(searchTerm.toLowerCase());

    return typeMatch && searchMatch;
  });

  // Group events by date
  const groupedEvents = filteredEvents.reduce((groups, event) => {
    const date = new Date(event.timestamp).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(event);
    return groups;
  }, {} as Record<string, TimelineEvent[]>);

  const eventTypes = [
    { value: 'all', label: 'All Events' },
    { value: 'appointment', label: 'Appointments' },
    { value: 'medication', label: 'Medications' },
    { value: 'lab', label: 'Lab Results' },
    { value: 'vital', label: 'Vital Signs' },
    { value: 'diagnosis', label: 'Diagnoses' },
    { value: 'treatment', label: 'Treatments' },
    { value: 'emergency', label: 'Emergencies' },
  ];

  return (
    <Card className={cn('medical-timeline', className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Medical Timeline
            {patientInfo && (
              <span className="text-sm font-normal text-muted-foreground">
                - {patientInfo.name}
              </span>
            )}
          </CardTitle>

          <div className="flex items-center gap-2">
            {showFilters && (
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            )}
            {onAddEvent && (
              <Button size="sm" onClick={onAddEvent}>
                <Plus className="h-4 w-4 mr-2" />
                Add Event
              </Button>
            )}
          </div>
        </div>

        {showFilters && (
          <div className="flex flex-col gap-4 sm:flex-row">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-input rounded-md bg-background"
            >
              {eventTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-2 text-sm border border-input rounded-md bg-background flex-1"
            />
          </div>
        )}
      </CardHeader>

      <CardContent className="pb-6">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No events found matching the current filters.
          </div>
        ) : (
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

            {/* Timeline Events */}
            <div className="space-y-6">
              {Object.entries(groupedEvents)
                .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
                .map(([date, dateEvents]) => (
                  <div key={date} className="relative">
                    {/* Date Header */}
                    <div className="sticky top-0 bg-background py-2 z-10 mb-4">
                      <h3 className="text-sm font-medium text-muted-foreground">
                        {new Date(date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </h3>
                    </div>

                    {/* Events for this date */}
                    <div className="space-y-4 pl-10">
                      {dateEvents
                        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                        .map((event) => (
                          <div
                            key={event.id}
                            className={cn(
                              'relative bg-background border rounded-lg p-4 transition-all hover:shadow-md cursor-pointer',
                              event.status === 'critical' && 'border-destructive animate-pulse',
                              event.status === 'emergency' && 'border-destructive',
                              'timeline-event'
                            )}
                            onClick={() => onEventClick?.(event)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                onEventClick?.(event);
                              }
                            }}
                            aria-label={`Event: ${event.title}, Type: ${event.type}, Status: ${event.status || 'unknown'}`}
                          >
                            {/* Connection to timeline */}
                            <div className="absolute -left-10 top-6 flex items-center justify-center w-8 h-8 bg-background border-4 border-border">
                              {getEventIcon(event.type, event.status)}
                            </div>

                            {/* Event Content */}
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-medium text-foreground truncate">
                                    {event.title}
                                  </h4>
                                  {getStatusBadge(event.type, event.status)}
                                </div>

                                <p className="text-sm text-muted-foreground mb-2">
                                  {event.description}
                                </p>

                                {/* Event Details */}
                                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {formatTimestamp(event.timestamp)}
                                  </div>

                                  {event.provider && (
                                    <div className="flex items-center gap-1">
                                      <User className="h-3 w-3" />
                                      {event.provider.name} ({event.provider.role})
                                    </div>
                                  )}

                                  {event.location && (
                                    <div>📍 {event.location}</div>
                                  )}
                                </div>

                                {/* Additional Details */}
                                {event.details && Object.keys(event.details).length > 0 && (
                                  <div className="mt-3 pt-3 border-t border-border">
                                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                      {Object.entries(event.details).map(([key, value]) => (
                                        <div key={key} className="text-xs">
                                          <span className="font-medium capitalize">
                                            {key.replace(/_/g, ' ')}:
                                          </span>{' '}
                                          <span className="text-muted-foreground">
                                            {Array.isArray(value) ? value.join(', ') : String(value)}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Attachments */}
                                {event.attachments && event.attachments.length > 0 && (
                                  <div className="mt-3 pt-3 border-t border-border">
                                    <div className="text-xs font-medium text-muted-foreground mb-2">
                                      Attachments:
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                      {event.attachments.map((attachment, index) => (
                                        <Button
                                          key={index}
                                          variant="outline"
                                          size="sm"
                                          className="text-xs h-7 px-2"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            window.open(attachment.url, '_blank');
                                          }}
                                        >
                                          📄 {attachment.name}
                                        </Button>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

## Day 4-5: Medical Form Components

### 2.1 Comprehensive Medical Form
Create `web/packages/ui/src/components/medical-form.tsx`:

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Form } from './form';
import { Field } from './field';
import { Textfield } from './textfield';
import { Button } from './button';
import { MedicalBadge } from './medical-badge';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { cn } from '@/lib/utils';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  Calendar,
  FileText,
  Upload,
  Save,
  Send,
  Eye,
  EyeOff,
} from 'lucide-react';

export interface MedicalFormField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'tel' | 'date' | 'time' | 'datetime-local' | 'select' | 'textarea' | 'checkbox' | 'radio' | 'file';
  required?: boolean;
  placeholder?: string;
  options?: Array<{ value: string; label: string; description?: string }>;
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    custom?: (value: any) => string | null;
  };
  medical?: {
    category?: 'vital' | 'medication' | 'diagnosis' | 'treatment' | 'lab' | 'allergy' | 'history';
    urgency?: 'low' | 'medium' | 'high' | 'critical';
    units?: string;
    range?: { min: number; max: number; optimal?: { min: number; max: number } };
    format?: string;
    helpText?: string;
    clinicalGuidelines?: string;
  };
  defaultValue?: any;
  disabled?: boolean;
  hidden?: boolean;
  conditional?: {
    field: string;
    value: any;
    operator?: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  };
}

export interface MedicalFormSection {
  id: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  collapsible?: boolean;
  collapsed?: boolean;
  fields: MedicalFormField[];
  required?: boolean;
  validation?: {
    minFields?: number;
    custom?: (data: Record<string, any>) => string | null;
  };
}

export interface MedicalFormConfig {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  type: 'patient-intake' | 'vital-signs' | 'medication' | 'diagnosis' | 'treatment' | 'lab-order' | 'progress-note' | 'discharge' | 'emergency';
  sections: MedicalFormSection[];
  submitLabel?: string;
  submitIcon?: React.ReactNode;
  onSubmit?: (data: Record<string, any>, metadata: { valid: boolean; errors: Record<string, string> }) => void;
  onSave?: (data: Record<string, any>) => void;
  onValidate?: (data: Record<string, any>) => Record<string, string>;
  readonly?: boolean;
  emergency?: boolean;
  autoSave?: boolean;
  privacyMode?: boolean;
}

interface MedicalFormProps {
  config: MedicalFormConfig;
  initialData?: Record<string, any>;
  className?: string;
  mode?: 'create' | 'edit' | 'view';
}

export function MedicalForm({
  config,
  initialData = {},
  className,
  mode = 'create',
}: MedicalFormProps) {
  const [formData, setFormData] = useState<Record<string, any>>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [savedStatus, setSavedStatus] = useState<'unsaved' | 'saving' | 'saved'>('unsaved');
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    config.sections.forEach(section => {
      initial[section.id] = section.collapsed || false;
    });
    return initial;
  });

  // Auto-save functionality
  useEffect(() => {
    if (config.autoSave && savedStatus === 'unsaved') {
      const timer = setTimeout(() => {
        handleAutoSave();
      }, 2000); // Auto-save after 2 seconds of inactivity

      return () => clearTimeout(timer);
    }
  }, [formData, savedStatus]);

  const handleAutoSave = async () => {
    if (config.onSave) {
      setSavedStatus('saving');
      try {
        await config.onSave(formData);
        setSavedStatus('saved');
        setTimeout(() => setSavedStatus('unsaved'), 3000);
      } catch (error) {
        setSavedStatus('unsaved');
        console.error('Auto-save failed:', error);
      }
    }
  };

  const validateField = (field: MedicalFormField, value: any): string | null => {
    // Required validation
    if (field.required && (!value || (Array.isArray(value) && value.length === 0))) {
      return `${field.label} is required`;
    }

    // Skip validation if field is empty and not required
    if (!value && !field.required) {
      return null;
    }

    // Type-specific validation
    switch (field.type) {
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          return 'Please enter a valid email address';
        }
        break;

      case 'tel':
        const phoneRegex = /^[\d\s\-\+\(\)]+$/;
        if (!phoneRegex.test(value)) {
          return 'Please enter a valid phone number';
        }
        break;

      case 'number':
        const numValue = parseFloat(value);
        if (isNaN(numValue)) {
          return 'Please enter a valid number';
        }

        // Medical range validation
        if (field.medical?.range) {
          if (numValue < field.medical.range.min || numValue > field.medical.range.max) {
            return `Value must be between ${field.medical.range.min} and ${field.medical.range.max}`;
          }
        }
        break;
    }

    // Custom validation
    if (field.validation?.custom) {
      return field.validation.custom(value);
    }

    return null;
  };

  const validateSection = (section: MedicalFormSection): string | null => {
    if (section.validation?.custom) {
      const sectionData = {};
      section.fields.forEach(field => {
        sectionData[field.name] = formData[field.name];
      });
      return section.validation.custom(sectionData);
    }

    if (section.validation?.minFields) {
      const filledFields = section.fields.filter(field =>
        formData[field.name] && formData[field.name] !== ''
      ).length;

      if (filledFields < section.validation.minFields) {
        return `At least ${section.validation.minFields} fields must be completed in this section`;
      }
    }

    return null;
  };

  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
    setTouched(prev => ({ ...prev, [fieldName]: true }));
    setSavedStatus('unsaved');

    // Clear error when field is updated
    if (errors[fieldName]) {
      setErrors(prev => ({ ...prev, [fieldName]: undefined }));
    }

    // Validate field on change
    const field = config.sections
      .flatMap(section => section.fields)
      .find(f => f.name === fieldName);

    if (field && touched[fieldName]) {
      const error = validateField(field, value);
      setErrors(prev => ({ ...prev, [fieldName]: error || undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    // Validate all fields
    const newErrors: Record<string, string> = {};

    config.sections.forEach(section => {
      // Validate section
      const sectionError = validateSection(section);
      if (sectionError) {
        newErrors[`section_${section.id}`] = sectionError;
      }

      // Validate fields
      section.fields.forEach(field => {
        const error = validateField(field, formData[field.name]);
        if (error) {
          newErrors[field.name] = error;
        }
      });
    });

    // Custom validation
    if (config.onValidate) {
      const customErrors = config.onValidate(formData);
      Object.assign(newErrors, customErrors);
    }

    setErrors(newErrors);
    setTouched(
      config.sections.flatMap(section => section.fields).reduce((acc, field) => ({
        ...acc,
        [field.name]: true
      }), {})
    );

    const isValid = Object.keys(newErrors).length === 0;

    if (config.onSubmit) {
      try {
        await config.onSubmit(formData, { valid: isValid, errors: newErrors });
      } catch (error) {
        console.error('Form submission failed:', error);
      }
    }

    setSubmitting(false);
  };

  const isFieldVisible = (field: MedicalFormField): boolean => {
    if (!field.conditional) return true;

    const { field: conditionField, value: conditionValue, operator = 'equals' } = field.conditional;
    const fieldValue = formData[conditionField];

    switch (operator) {
      case 'equals':
        return fieldValue === conditionValue;
      case 'not_equals':
        return fieldValue !== conditionValue;
      case 'contains':
        return Array.isArray(fieldValue) ? fieldValue.includes(conditionValue) :
               String(fieldValue).includes(String(conditionValue));
      case 'greater_than':
        return parseFloat(fieldValue) > parseFloat(conditionValue);
      case 'less_than':
        return parseFloat(fieldValue) < parseFloat(conditionValue);
      default:
        return true;
    }
  };

  const getFormIcon = () => {
    switch (config.type) {
      case 'emergency': return <AlertTriangle className="h-5 w-5 text-destructive" />;
      case 'patient-intake': return <User className="h-5 w-5" />;
      case 'vital-signs': return <FileText className="h-5 w-5" />;
      case 'medication': return <FileText className="h-5 w-5" />;
      case 'diagnosis': return <FileText className="h-5 w-5" />;
      case 'treatment': return <FileText className="h-5 w-5" />;
      case 'lab-order': return <FileText className="h-5 w-5" />;
      case 'progress-note': return <FileText className="h-5 w-5" />;
      case 'discharge': return <CheckCircle className="h-5 w-5" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  return (
    <Card className={cn(
      'medical-form',
      config.emergency && 'border-destructive animate-pulse',
      mode === 'view' && 'border-muted',
      className
    )}>
      <CardHeader className="pb-6">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {getFormIcon()}
            {config.title}
            {config.emergency && (
              <MedicalBadge status="emergency-active" pulse>
                Emergency
              </MedicalBadge>
            )}
          </CardTitle>

          <div className="flex items-center gap-2">
            {config.autoSave && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {savedStatus === 'saving' && <Clock className="h-3 w-3 animate-spin" />}
                {savedStatus === 'saved' && <CheckCircle className="h-3 w-3 text-success" />}
                {savedStatus === 'unsaved' && 'Unsaved'}
              </div>
            )}
          </div>
        </div>

        {config.subtitle && (
          <p className="text-muted-foreground">{config.subtitle}</p>
        )}

        {config.description && (
          <p className="text-sm text-muted-foreground mt-2">{config.description}</p>
        )}
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          {config.sections.map((section, sectionIndex) => {
            const sectionError = errors[`section_${section.id}`];
            const isCollapsed = collapsedSections[section.id];

            return (
              <div
                key={section.id}
                className={cn(
                  'medical-form-section',
                  sectionError && 'border-destructive/20'
                )}
              >
                {/* Section Header */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b">
                  <div className="flex items-center gap-3">
                    {section.icon}
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">
                        {section.title}
                        {section.required && <span className="text-destructive ml-1">*</span>}
                      </h3>
                      {section.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {section.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {section.collapsible && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setCollapsedSections(prev => ({
                        ...prev,
                        [section.id]: !prev[section.id]
                      }))}
                    >
                      {isCollapsed ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </Button>
                  )}
                </div>

                {/* Section Error */}
                {sectionError && (
                  <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-destructive">
                      <AlertTriangle className="h-4 w-4" />
                      {sectionError}
                    </div>
                  </div>
                )}

                {/* Section Fields */}
                {!isCollapsed && (
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {section.fields
                      .filter(field => isFieldVisible(field) && !field.hidden)
                      .map((field) => {
                        const fieldError = errors[field.name];
                        const fieldTouched = touched[field.name];

                        return (
                          <Field
                            key={field.id}
                            id={field.name}
                            label={field.label}
                            error={fieldError}
                            hint={field.medical?.helpText}
                            required={field.required}
                            disabled={field.disabled || mode === 'view'}
                            medical={{
                              category: field.medical?.category,
                              urgency: field.medical?.urgency,
                              validation: field.medical?.clinicalGuidelines,
                              units: field.medical?.units,
                              range: field.medical?.range,
                            }}
                          >
                            {field.type === 'select' ? (
                              <select
                                id={field.name}
                                value={formData[field.name] || ''}
                                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                                disabled={field.disabled || mode === 'view'}
                                className={cn(
                                  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                                  fieldError && 'border-destructive focus-visible:ring-destructive',
                                  fieldTouched && !fieldError && field.required && formData[field.name] && 'border-success'
                                )}
                                aria-describedby={fieldError ? `${field.name}-error` : undefined}
                                aria-invalid={!!fieldError}
                              >
                                <option value="">Select {field.label}</option>
                                {field.options?.map(option => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                    {option.description && ` - ${option.description}`}
                                  </option>
                                ))}
                              </select>
                            ) : field.type === 'textarea' ? (
                              <textarea
                                id={field.name}
                                value={formData[field.name] || ''}
                                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                                placeholder={field.placeholder}
                                disabled={field.disabled || mode === 'view'}
                                rows={4}
                                className={cn(
                                  'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                                  fieldError && 'border-destructive focus-visible:ring-destructive',
                                  fieldTouched && !fieldError && field.required && formData[field.name] && 'border-success'
                                )}
                                aria-describedby={fieldError ? `${field.name}-error` : undefined}
                                aria-invalid={!!fieldError}
                              />
                            ) : field.type === 'checkbox' ? (
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id={field.name}
                                  checked={formData[field.name] || false}
                                  onChange={(e) => handleFieldChange(field.name, e.target.checked)}
                                  disabled={field.disabled || mode === 'view'}
                                  className="h-4 w-4 rounded border border-input text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                />
                                <label htmlFor={field.name} className="text-sm text-foreground">
                                  {field.placeholder || `I confirm ${field.label}`}
                                </label>
                              </div>
                            ) : field.type === 'radio' ? (
                              <div className="space-y-2">
                                {field.options?.map(option => (
                                  <div key={option.value} className="flex items-center space-x-2">
                                    <input
                                      type="radio"
                                      id={`${field.name}_${option.value}`}
                                      name={field.name}
                                      value={option.value}
                                      checked={formData[field.name] === option.value}
                                      onChange={(e) => handleFieldChange(field.name, e.target.value)}
                                      disabled={field.disabled || mode === 'view'}
                                      className="h-4 w-4 border border-input text-primary focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                    />
                                    <label htmlFor={`${field.name}_${option.value}`} className="text-sm text-foreground">
                                      {option.label}
                                    </label>
                                  </div>
                                ))}
                              </div>
                            ) : field.type === 'file' ? (
                              <div className="border-2 border-dashed border-input rounded-lg p-4 text-center">
                                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                                <input
                                  type="file"
                                  id={field.name}
                                  onChange={(e) => handleFieldChange(field.name, e.target.files?.[0])}
                                  disabled={field.disabled || mode === 'view'}
                                  className="hidden"
                                />
                                <label htmlFor={field.name} className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                                  Click to upload {field.label}
                                </label>
                              </div>
                            ) : (
                              <Textfield
                                id={field.name}
                                type={field.type}
                                value={formData[field.name] || ''}
                                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                                placeholder={field.placeholder}
                                disabled={field.disabled || mode === 'view'}
                                medical={{
                                  type: field.medical?.category,
                                  validation: field.validation,
                                  autoComplete: 'off',
                                }}
                              />
                            )}
                          </Field>
                        );
                      })}
                  </div>
                )}
              </div>
            );
          })}

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-6 border-t">
            <div className="text-sm text-muted-foreground">
              * Required fields
            </div>

            <div className="flex items-center gap-3">
              {config.onSave && mode !== 'view' && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleAutoSave()}
                  disabled={savedStatus === 'saving'}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {savedStatus === 'saving' ? 'Saving...' : 'Save Draft'}
                </Button>
              )}

              {mode !== 'view' && config.onSubmit && (
                <Button
                  type="submit"
                  variant={config.emergency ? 'emergency' : 'primary'}
                  disabled={submitting}
                  loading={submitting}
                  medicalData={{
                    urgency: config.emergency ? 'urgent' : 'medium',
                    category: config.type,
                    patientSafety: config.emergency,
                  }}
                >
                  {config.submitIcon || <Send className="h-4 w-4 mr-2" />}
                  {config.submitLabel || (config.emergency ? 'Submit Emergency' : 'Submit Form')}
                </Button>
              )}
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
```

## Implementation Checklist

### Day 1-3 Tasks
- [ ] Create comprehensive vital signs component
- [ ] Implement real-time monitoring capabilities
- [ ] Add emergency alert functionality
- [ ] Create medical timeline component
- [ ] Test vital signs display accuracy

### Day 4-5 Tasks
- [ ] Implement medical form system
- [ ] Add validation and range checking
- [ ] Create conditional field logic
- [ ] Implement auto-save functionality
- [ ] Test form accessibility

### Day 6-7 Tasks
- [ ] Create patient dashboard components
- [ ] Implement clinical workflow components
- [ ] Add medical data visualization
- [ ] Test component integration
- [ ] Performance optimization

## Success Criteria

### Technical Success
- [ ] Components handle real-time data updates
- [ ] Emergency alerts trigger immediately
- [ ] Forms validate medical data accurately
- [ ] Components are responsive and accessible
- [ ] Performance meets medical application standards

### Healthcare Success
- [ ] Critical vital signs are prominently displayed
- [ ] Medical forms support clinical workflows
- [ ] Emergency protocols are easily accessible
- [ ] Patient data privacy is maintained
- [ ] Medical accuracy is preserved

### User Experience Success
- [ ] Clinicians can quickly scan vital signs
- [ ] Forms are intuitive for medical staff
- [ ] Emergency situations are handled efficiently
- [ ] Medical data entry is error-resistant
- [ ] Timeline provides comprehensive medical history

---

**Next Phase Preview:** Phase 4 will focus on accessibility compliance, performance optimization, and comprehensive testing to ensure the healthcare UI meets all regulatory requirements and clinical standards.