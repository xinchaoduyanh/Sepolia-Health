'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import {
    AlertTriangle,
    CheckCircle,
    XCircle,
    Clock,
    User,
    Calendar,
    Heart,
    TrendingUp,
    TrendingDown,
    Minus,
    Activity,
    Zap,
    Shield,
    Stethoscope,
    Pill,
    Syringe,
    FileMedical,
    Users,
    AlertCircle,
    Info,
    ChevronUp,
    ChevronDown,
    BarChart3,
    Radio,
    Thermometer,
    Droplet,
    Brain,
    Eye,
    Ear,
    Bone
} from 'lucide-react';
import { useHealthcareTheme } from '@/providers/healthcare-theme-context';

const medicalBadgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 relative',
  {
    variants: {
      status: {
        // Patient Status - Enhanced
        'critical': 'bg-destructive text-destructive-foreground animate-pulse border border-destructive/20 shadow-sm',
        'serious': 'bg-warning text-warning-foreground border border-warning/20 shadow-sm',
        'stable': 'bg-success text-success-foreground border border-success/20',
        'recovering': 'bg-primary text-primary-foreground border border-primary/20',
        'improving': 'bg-success/10 text-success border border-success/30',
        'declining': 'bg-warning/10 text-warning border border-warning/30',
        'discharged': 'bg-muted text-muted-foreground border border-muted/20',
        'transferred': 'bg-accent/10 text-accent border border-accent/30',
        'admitted': 'bg-primary/10 text-primary border border-primary/30',

        // Appointment Status - Enhanced
        'scheduled': 'bg-primary text-primary-foreground border border-primary/20',
        'confirmed': 'bg-success text-success-foreground border border-success/20',
        'in-progress': 'bg-warning text-warning-foreground animate-pulse border border-warning/20',
        'completed': 'bg-success text-success-foreground border border-success/20',
        'cancelled': 'bg-destructive text-destructive-foreground border border-destructive/20',
        'no-show': 'bg-muted text-muted-foreground border border-muted/20',
        'rescheduled': 'bg-accent text-accent-foreground border border-accent/20',
        'waiting': 'bg-warning/10 text-warning border border-warning/30',
        'checked-in': 'bg-success/10 text-success border border-success/30',

        // Medical Priority - Enhanced
        'urgent': 'bg-destructive text-destructive-foreground border border-destructive/50 animate-pulse',
        'high': 'bg-warning text-warning-foreground border border-warning/50',
        'medium': 'bg-accent text-accent-foreground border border-accent/50',
        'low': 'bg-success text-success-foreground border border-success/50',
        'routine': 'bg-muted text-muted-foreground border border-muted/50',
        'stat': 'bg-destructive text-destructive-foreground border-2 border-destructive animate-pulse font-bold',
        'priority-1': 'bg-destructive text-destructive-foreground border border-destructive/60 animate-pulse',
        'priority-2': 'bg-warning text-warning-foreground border border-warning/60',
        'priority-3': 'bg-accent text-accent-foreground border border-accent/60',

        // Clinical Status - Enhanced
        'positive': 'bg-success text-success-foreground border border-success/20',
        'negative': 'bg-muted text-muted-foreground border border-muted/20',
        'inconclusive': 'bg-warning text-warning-foreground border border-warning/20',
        'pending': 'bg-accent text-accent-foreground border border-accent/20',
        'abnormal': 'bg-destructive text-destructive-foreground border border-destructive/20',
        'normal': 'bg-success text-success-foreground border border-success/20',
        'borderline': 'bg-warning/10 text-warning border border-warning/30',
        'critical-value': 'bg-destructive text-destructive-foreground border-2 border-destructive animate-pulse font-bold',

        // Vital Sign Status - Enhanced
        'vital-critical': 'bg-destructive text-destructive-foreground border border-destructive/30 pulse-critical',
        'vital-warning': 'bg-warning text-warning-foreground border border-warning/30',
        'vital-normal': 'bg-success text-success-foreground border border-success/30',
        'vital-elevated': 'bg-warning/10 text-warning border border-warning/30',
        'vital-low': 'bg-accent/10 text-accent border border-accent/30',

        // Emergency Status - Enhanced
        'emergency': 'bg-destructive text-destructive-foreground border-2 border-destructive animate-pulse font-bold',
        'code-blue': 'bg-destructive text-destructive-foreground border-2 border-destructive animate-pulse font-bold',
        'code-red': 'bg-destructive text-destructive-foreground border-2 border-destructive animate-pulse font-bold',
        'code-yellow': 'bg-warning text-warning-foreground border-2 border-warning animate-pulse font-semibold',
        'code-green': 'bg-success text-success-foreground border-2 border-success font-semibold',
        'rapid-response': 'bg-warning text-warning-foreground border-2 border-warning animate-pulse font-bold',
        'isolation': 'bg-warning text-warning-foreground border-2 border-warning font-semibold',
        'quarantine': 'bg-accent text-accent-foreground border-2 border-accent font-semibold',

        // Treatment Status
        'treatment-active': 'bg-primary text-primary-foreground border border-primary/30',
        'treatment-completed': 'bg-success text-success-foreground border border-success/30',
        'treatment-paused': 'bg-warning text-warning-foreground border border-warning/30',
        'treatment-cancelled': 'bg-destructive text-destructive-foreground border border-destructive/30',
        'medication-administered': 'bg-success/10 text-success border border-success/30',
        'procedure-completed': 'bg-primary/10 text-primary border border-primary/30',

        // Department/Specialty Status
        'icu': 'bg-destructive text-destructive-foreground border border-destructive/30',
        'er': 'bg-warning text-warning-foreground border border-warning/30',
        'or': 'bg-accent text-accent-foreground border border-accent/30',
        'pediatrics': 'bg-primary text-primary-foreground border border-primary/30',
        'cardiology': 'bg-destructive/10 text-destructive border border-destructive/30',
        'neurology': 'bg-purple-100 text-purple-800 border border-purple-300',
        'oncology': 'bg-warning/10 text-warning border border-warning/30',
        'radiology': 'bg-accent/10 text-accent border border-accent/30',
        'laboratory': 'bg-success/10 text-success border border-success/30',
        'pharmacy': 'bg-primary/10 text-primary border border-primary/30',

        // Diagnostic Results
        'diagnosis-confirmed': 'bg-success text-success-foreground border border-success/30',
        'diagnosis-provisional': 'bg-warning text-warning-foreground border border-warning/30',
        'diagnosis-differential': 'bg-accent text-accent-foreground border border-accent/30',
        'test-ordered': 'bg-primary text-primary-foreground border border-primary/30',
        'test-collected': 'bg-warning/10 text-warning border border-warning/30',
        'test-processing': 'bg-accent/10 text-accent border border-accent/30 animate-pulse',
        'test-completed': 'bg-success/10 text-success border border-success/30',
        'review-required': 'bg-warning text-warning-foreground border border-warning/30',

        // Telemedicine Status
        'telemedicine-active': 'bg-success text-success-foreground border border-success/30',
        'telemedicine-waiting': 'bg-warning text-warning-foreground animate-pulse border border-warning/30',
        'telemedicine-ended': 'bg-muted text-muted-foreground border border-muted/30',
        'video-connected': 'bg-success/10 text-success border border-success/30',
        'audio-connected': 'bg-primary/10 text-primary border border-primary/30',

        // Medication Status
        'medication-active': 'bg-success text-success-foreground border border-success/30',
        'medication-hold': 'bg-warning text-warning-foreground border border-warning/30',
        'medication-discontinued': 'bg-destructive text-destructive-foreground border border-destructive/30',
        'medication-due': 'bg-warning/10 text-warning border border-warning/30 animate-pulse',
        'medication-overdue': 'bg-destructive/10 text-destructive border border-destructive/30',
        'medication-administered': 'bg-success/10 text-success border border-success/30',
        'medication-refused': 'bg-accent/10 text-accent border border-accent/30',

        // Allergy Status
        'allergy-severe': 'bg-destructive text-destructive-foreground border-2 border-destructive animate-pulse',
        'allergy-moderate': 'bg-warning text-warning-foreground border border-warning/50',
        'allergy-mild': 'bg-accent text-accent-foreground border border-accent/50',
        'no-allergies': 'bg-success text-success-foreground border border-success/30',

        // Risk Assessment
        'risk-high': 'bg-destructive text-destructive-foreground border border-destructive/50',
        'risk-medium': 'bg-warning text-warning-foreground border border-warning/50',
        'risk-low': 'bg-success text-success-foreground border border-success/50',
        'risk-minimal': 'bg-success/10 text-success border border-success/30',

        // Compliance Status
        'compliant': 'bg-success text-success-foreground border border-success/30',
        'non-compliant': 'bg-warning text-warning-foreground border border-warning/30',
        'partial-compliance': 'bg-accent text-accent-foreground border border-accent/30',

        // Insurance/Billing Status
        'insurance-approved': 'bg-success text-success-foreground border border-success/30',
        'insurance-pending': 'bg-warning text-warning-foreground border border-warning/30',
        'insurance-denied': 'bg-destructive text-destructive-foreground border border-destructive/30',
        'self-pay': 'bg-muted text-muted-foreground border border-muted/30',
        'billing-complete': 'bg-success/10 text-success border border-success/30',
      },
      size: {
        xs: 'px-1.5 py-0.5 text-[10px] rounded-md',
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-0.5 text-sm',
        lg: 'px-3 py-1 text-base',
        xl: 'px-4 py-1.5 text-lg',
        // Healthcare-specific sizes
        'vital-sm': 'px-2 py-1 text-xs font-medium',
        'vital-md': 'px-3 py-1.5 text-sm font-semibold',
        'vital-lg': 'px-4 py-2 text-base font-bold',
        'alert': 'px-3 py-1.5 text-sm font-bold',
        'compact': 'px-1.5 py-0.5 text-[10px]',
      },
      variant: {
        solid: '',
        outline: 'bg-background border-2',
        soft: 'bg-opacity-20',
        // Healthcare-specific variants
        'soft-solid': 'bg-opacity-90',
        'minimal': 'bg-transparent border border-current/20',
        'medical': 'shadow-sm',
        'emergency': 'shadow-md animate-pulse',
        'sterile': 'bg-white/95 border-gray-200',
      }
    },
    defaultVariants: {
      status: 'stable',
      size: 'md',
      variant: 'solid',
    },
  }
);

export interface MedicalBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof medicalBadgeVariants> {
  icon?: React.ReactNode;
  pulse?: boolean;
  showIcon?: boolean;
  label?: string;
  // Enhanced healthcare props
  trend?: 'up' | 'down' | 'stable';
  trendValue?: number;
  realtimeUpdate?: boolean;
  colorBlindFriendly?: boolean;
  accessibilityLabel?: string;
  criticalAlert?: boolean;
  lastUpdated?: string;
  showTimestamp?: boolean;
  showTrendIcon?: boolean;
  department?: string;
  specialty?: string;
  severity?: 'mild' | 'moderate' | 'severe' | 'critical';
}

const getStatusIcon = (status: string) => {
  switch (status) {
    // Patient Status
    case 'critical':
    case 'vital-critical':
    case 'priority-1':
    case 'stat':
    case 'code-blue':
    case 'code-red':
    case 'rapid-response':
    case 'allergy-severe':
      return <XCircle className="h-3 w-3" />;
    case 'serious':
    case 'urgent':
    case 'high':
    case 'priority-2':
    case 'risk-high':
    case 'allergy-moderate':
    case 'code-yellow':
    case 'declining':
      return <AlertTriangle className="h-3 w-3" />;
    case 'stable':
    case 'normal':
    case 'positive':
    case 'vital-normal':
    case 'improving':
    case 'compliant':
    case 'low':
    case 'priority-3':
    case 'risk-low':
    case 'risk-minimal':
    case 'allergy-mild':
    case 'no-allergies':
    case 'code-green':
      return <CheckCircle className="h-3 w-3" />;
    case 'recovering':
      return <Heart className="h-3 w-3" />;
    case 'transferred':
      return <Users className="h-3 w-3" />;
    case 'admitted':
      return <Activity className="h-3 w-3" />;

    // Appointment Status
    case 'scheduled':
    case 'rescheduled':
      return <Calendar className="h-3 w-3" />;
    case 'confirmed':
      return <CheckCircle className="h-3 w-3" />;
    case 'in-progress':
    case 'waiting':
    case 'telemedicine-waiting':
      return <Clock className="h-3 w-3" />;
    case 'completed':
      return <CheckCircle className="h-3 w-3" />;
    case 'cancelled':
    case 'no-show':
      return <XCircle className="h-3 w-3" />;
    case 'checked-in':
      return <CheckCircle className="h-3 w-3" />;

    // Clinical Status
    case 'pending':
    case 'insurance-pending':
      return <Clock className="h-3 w-3" />;
    case 'inconclusive':
    case 'borderline':
    case 'diagnosis-provisional':
    case 'review-required':
      return <AlertTriangle className="h-3 w-3" />;
    case 'abnormal':
    case 'critical-value':
      return <XCircle className="h-3 w-3" />;
    case 'diagnosis-confirmed':
      return <CheckCircle className="h-3 w-3" />;

    // Treatment Status
    case 'treatment-active':
      return <Activity className="h-3 w-3" />;
    case 'treatment-completed':
    case 'procedure-completed':
    case 'medication-administered':
      return <CheckCircle className="h-3 w-3" />;
    case 'treatment-paused':
    case 'medication-hold':
      return <AlertTriangle className="h-3 w-3" />;
    case 'treatment-cancelled':
    case 'medication-discontinued':
      return <XCircle className="h-3 w-3" />;
    case 'medication-due':
    case 'medication-overdue':
      return <Clock className="h-3 w-3" />;
    case 'medication-refused':
      return <XCircle className="h-3 w-3" />;

    // Department/Specialty Status
    case 'icu':
    case 'er':
      return <AlertTriangle className="h-3 w-3" />;
    case 'or':
      return <Zap className="h-3 w-3" />;
    case 'pediatrics':
      return <Heart className="h-3 w-3" />;
    case 'cardiology':
      return <Heart className="h-3 w-3" />;
    case 'neurology':
      return <Brain className="h-3 w-3" />;
    case 'oncology':
      return <Shield className="h-3 w-3" />;
    case 'radiology':
      return <Radio className="h-3 w-3" />;
    case 'laboratory':
      return <Droplet className="h-3 w-3" />;
    case 'pharmacy':
      return <Pill className="h-3 w-3" />;

    // Test Status
    case 'test-ordered':
    case 'test-collected':
      return <FileMedical className="h-3 w-3" />;
    case 'test-processing':
      return <Clock className="h-3 w-3" />;
    case 'test-completed':
      return <CheckCircle className="h-3 w-3" />;

    // Telemedicine Status
    case 'telemedicine-active':
    case 'video-connected':
      return <Eye className="h-3 w-3" />;
    case 'audio-connected':
      return <Ear className="h-3 w-3" />;
    case 'telemedicine-ended':
      return <XCircle className="h-3 w-3" />;

    // Emergency Status
    case 'emergency':
    case 'isolation':
    case 'quarantine':
      return <AlertTriangle className="h-3 w-3" />;

    // Insurance/Billing Status
    case 'insurance-approved':
    case 'billing-complete':
      return <CheckCircle className="h-3 w-3" />;
    case 'insurance-denied':
      return <XCircle className="h-3 w-3" />;
    case 'self-pay':
      return <Users className="h-3 w-3" />;

    // Compliance Status
    case 'non-compliant':
      return <XCircle className="h-3 w-3" />;
    case 'partial-compliance':
      return <AlertTriangle className="h-3 w-3" />;

    // Default cases
    default:
      return <Info className="h-3 w-3" />;
  }
};

// Color blind friendly icon mapping
const getColorBlindIcon = (status: string) => {
  // Use shape-based indicators for color blind users
  const criticalShapes = {
    'critical': '▲',
    'urgent': '⚠',
    'warning': '●',
    'normal': '○',
    'success': '✓',
  };
  return criticalShapes[status as keyof typeof criticalShapes] || '○';
};

export function MedicalBadge({
  className,
  status,
  size,
  variant,
  icon,
  pulse,
  showIcon = true,
  children,
  label,
  trend,
  trendValue,
  realtimeUpdate = false,
  colorBlindFriendly = false,
  accessibilityLabel,
  criticalAlert = false,
  lastUpdated,
  showTimestamp = false,
  showTrendIcon = false,
  department,
  specialty,
  severity,
  ...props
}: MedicalBadgeProps) {
  const { highContrastMode, reducedMotion, colorBlindMode, emergencyMode } = useHealthcareTheme()

  // Determine if we should use color blind friendly mode
  const shouldUseColorBlindFriendly = colorBlindFriendly || colorBlindMode !== 'none'

  // Get appropriate icon based on color blind preferences
  const statusIcon = showIcon ? (icon || (
    shouldUseColorBlindFriendly ?
    <span className="text-xs font-bold">{getColorBlindIcon(status || '')}</span> :
    getStatusIcon(status || '')
  )) : null

  // Get trend icon
  const getTrendIcon = () => {
    if (!trend || !showTrendIcon) return null

    const trendIcons = {
      up: <ChevronUp className="h-2 w-2 text-success" />,
      down: <ChevronDown className="h-2 w-2 text-destructive" />,
      stable: <Minus className="h-2 w-2 text-muted-foreground" />
    }

    return (
      <span className="ml-1" aria-label={`Trend: ${trend}`}>
        {trendIcons[trend]}
        {trendValue && (
          <span className="ml-1 text-xs">{trendValue > 0 ? '+' : ''}{trendValue}%</span>
        )}
      </span>
    )
  }

  // Adjust variant based on healthcare theme
  const getFinalVariant = () => {
    if (highContrastMode && variant === 'soft') return 'outline'
    if (emergencyMode && (status?.includes('critical') || status?.includes('emergency'))) return 'emergency'
    return variant
  }

  // Generate accessibility label
  const generateAriaLabel = () => {
    if (accessibilityLabel) return accessibilityLabel

    let label = `${status} status`
    if (department) label += `, ${department}`
    if (specialty) label += `, ${specialty}`
    if (severity) label += `, severity: ${severity}`
    if (trend) label += `, trend: ${trend}`
    if (realtimeUpdate) label += `, real-time updates enabled`

    return label
  }

  // Generate title for hover
  const generateTitle = () => {
    let title = label || `${status}`
    if (lastUpdated) title += ` (Updated: ${lastUpdated})`
    if (department) title += ` | ${department}`
    if (specialty) title += ` | ${specialty}`
    return title
  }

  return (
    <div
      className={cn(
        medicalBadgeVariants({
          status,
          size,
          variant: getFinalVariant(),
        }),
        // Healthcare accessibility classes
        highContrastMode && 'high-contrast-badge',
        reducedMotion && 'reduce-motion-badge',
        // Real-time updates
        realtimeUpdate && 'realtime-badge',
        // Critical alerts
        criticalAlert && 'critical-alert-badge',
        // Severity indicators
        severity === 'critical' && 'severity-critical',
        severity === 'severe' && 'severity-severe',
        severity === 'moderate' && 'severity-moderate',
        severity === 'mild' && 'severity-mild',
        // Pulse animation
        (pulse ||
          status?.includes('critical') ||
          status?.includes('urgent') ||
          status?.includes('emergency')) && !reducedMotion && 'animate-pulse',
        className
      )}
      role="status"
      aria-label={generateAriaLabel()}
      title={generateTitle()}
      data-status={status}
      data-department={department}
      data-specialty={specialty}
      data-severity={severity}
      data-trend={trend}
      data-realtime={realtimeUpdate}
      {...props}
    >
      {/* Real-time indicator dot */}
      {realtimeUpdate && !reducedMotion && (
        <span
          className="absolute -top-1 -right-1 w-2 h-2 bg-success rounded-full animate-pulse"
          aria-hidden="true"
        />
      )}

      {/* Critical alert indicator */}
      {criticalAlert && !reducedMotion && (
        <span
          className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full animate-ping"
          aria-hidden="true"
        />
      )}

      <div className="flex items-center gap-1">
        {statusIcon && (
          <span className="flex-shrink-0" aria-hidden="true">
            {statusIcon}
          </span>
        )}

        <span className="truncate">
          {children || (label || status)}
        </span>

        {/* Trend indicator */}
        {getTrendIcon()}

        {/* Department/specialty indicators for compact view */}
        {(department || specialty) && size === 'compact' && (
          <span className="text-xs opacity-60 ml-1">
            {department?.charAt(0)?.toUpperCase() || specialty?.charAt(0)?.toUpperCase()}
          </span>
        )}
      </div>

      {/* Timestamp for larger badges */}
      {showTimestamp && lastUpdated && ['lg', 'xl', 'vital-lg'].includes(size || '') && (
        <div className="text-xs opacity-60 mt-1 text-center">
          {lastUpdated}
        </div>
      )}
    </div>
  );
}

// Healthcare-specific badge components for convenience
export function PatientStatusBadge({ status, ...props }: Omit<MedicalBadgeProps, 'status'> & { status: 'critical' | 'serious' | 'stable' | 'recovering' | 'discharged' }) {
  return <MedicalBadge status={status} label={`Patient: ${status}`} {...props} />;
}

export function AppointmentStatusBadge({ status, ...props }: Omit<MedicalBadgeProps, 'status'> & { status: 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | 'no-show' | 'rescheduled' }) {
  return <MedicalBadge status={status} label={`Appointment: ${status}`} {...props} />;
}

export function PriorityBadge({ status, ...props }: Omit<MedicalBadgeProps, 'status'> & { status: 'urgent' | 'high' | 'medium' | 'low' | 'routine' }) {
  return <MedicalBadge status={status} label={`Priority: ${status}`} {...props} />;
}

export function ClinicalBadge({ status, ...props }: Omit<MedicalBadgeProps, 'status'> & { status: 'positive' | 'negative' | 'inconclusive' | 'pending' | 'abnormal' | 'normal' }) {
  return <MedicalBadge status={status} label={`Clinical: ${status}`} {...props} />;
}

export function VitalSignBadge({ status, value, unit, label, ...props }: Omit<MedicalBadgeProps, 'status' | 'children'> & {
  status: 'vital-critical' | 'vital-warning' | 'vital-normal';
  value: string;
  unit: string;
  label?: string;
}) {
  return (
    <MedicalBadge
      status={status}
      size="lg"
      label={`${label}: ${value} ${unit}`}
      {...props}
    >
      <span className="font-bold">{value}</span>
      <span className="text-xs opacity-75 ml-1">{unit}</span>
      {label && <span className="sr-only">{label}</span>}
    </MedicalBadge>
  );
}

export function EmergencyBadge({ code, ...props }: Omit<MedicalBadgeProps, 'status'> & { code: 'emergency' | 'code-blue' | 'code-red' | 'code-yellow' | 'code-green' | 'rapid-response' | 'isolation' | 'quarantine' }) {
  return <MedicalBadge status={code} pulse={true} criticalAlert={true} label={`Emergency: ${code}`} {...props} />;
}

// Enhanced specialized badge components

/**
 * RealtimeVitalBadge - For vital signs with real-time updates
 */
export function RealtimeVitalBadge({
  vital,
  value,
  unit,
  status,
  trend,
  lastUpdated,
  ...props
}: Omit<MedicalBadgeProps, 'status' | 'children' | 'label'> & {
  vital: string;
  value: string;
  unit: string;
  status: 'vital-critical' | 'vital-warning' | 'vital-normal' | 'vital-elevated' | 'vital-low';
  trend?: 'up' | 'down' | 'stable';
  lastUpdated?: string;
}) {
  return (
    <MedicalBadge
      status={status}
      size="vital-md"
      variant="medical"
      realtimeUpdate={true}
      showTrendIcon={true}
      trend={trend}
      lastUpdated={lastUpdated}
      showTimestamp={true}
      label={`${vital}: ${value} ${unit}`}
      accessibilityLabel={`${vital} vital sign: ${value} ${unit}, status: ${status}${trend ? `, trend: ${trend}` : ''}`}
      {...props}
    >
      <span className="font-bold">{value}</span>
      <span className="text-xs opacity-75 ml-1">{unit}</span>
    </MedicalBadge>
  );
}

/**
 * TrendBadge - For showing trend with visual indicators
 */
export function TrendBadge({
  status,
  trend,
  value,
  previousValue,
  showPercentage = true,
  ...props
}: Omit<MedicalBadgeProps, 'children' | 'label'> & {
  trend: 'up' | 'down' | 'stable';
  value: number;
  previousValue: number;
  showPercentage?: boolean;
}) {
  const percentage = previousValue !== 0 ? ((value - previousValue) / previousValue * 100) : 0
  const trendValue = showPercentage ? Math.round(percentage) : undefined

  return (
    <MedicalBadge
      status={status}
      size="compact"
      showTrendIcon={true}
      trend={trend}
      trendValue={trendValue}
      label={`${trend} trend: ${value > previousValue ? '+' : ''}${value} (${showPercentage ? `${percentage > 0 ? '+' : ''}${percentage.toFixed(1)}%` : ''})`}
      accessibilityLabel={`Trend: ${trend}, current value: ${value}, previous value: ${previousValue}${showPercentage ? `, change: ${percentage.toFixed(1)}%` : ''}`}
      {...props}
    >
      <BarChart3 className="h-3 w-3" />
    </MedicalBadge>
  );
}

/**
 * DepartmentBadge - For department/specialty identification
 */
export function DepartmentBadge({
  department,
  specialty,
  status,
  onCall = false,
  ...props
}: Omit<MedicalBadgeProps, 'status' | 'children' | 'label' | 'department' | 'specialty'> & {
  department: string;
  specialty?: string;
  status?: 'icu' | 'er' | 'or' | 'pediatrics' | 'cardiology' | 'neurology' | 'oncology' | 'radiology' | 'laboratory' | 'pharmacy';
  onCall?: boolean;
}) {
  const badgeStatus = status || department.toLowerCase() as any

  return (
    <MedicalBadge
      status={badgeStatus}
      size="compact"
      department={department}
      specialty={specialty}
      pulse={onCall}
      realtimeUpdate={onCall}
      label={`${department}${specialty ? ` - ${specialty}` : ''}${onCall ? ' (On Call)' : ''}`}
      accessibilityLabel={`Department: ${department}${specialty ? `, specialty: ${specialty}` : ''}${onCall ? `, currently on call` : ''}`}
      {...props}
    >
      {specialty ? `${department} - ${specialty}` : department}
      {onCall && <span className="ml-1 text-xs">🔴</span>}
    </MedicalBadge>
  );
}

/**
 * MedicationBadge - For medication status tracking
 */
export function MedicationBadge({
  medication,
  status,
  dueTime,
  administeredTime,
  ...props
}: Omit<MedicalBadgeProps, 'status' | 'children' | 'label'> & {
  medication: string;
  status: 'medication-active' | 'medication-hold' | 'medication-discontinued' | 'medication-due' | 'medication-overdue' | 'medication-administered' | 'medication-refused';
  dueTime?: string;
  administeredTime?: string;
}) {
  const timeInfo = administeredTime || dueTime
  const label = `${medication}${timeInfo ? ` - ${timeInfo}` : ''}`

  return (
    <MedicalBadge
      status={status}
      size="compact"
      criticalAlert={status === 'medication-overdue'}
      pulse={status === 'medication-due' || status === 'medication-overdue'}
      realtimeUpdate={status === 'medication-due'}
      lastUpdated={administeredTime}
      showTimestamp={!!administeredTime}
      label={label}
      accessibilityLabel={`Medication: ${medication}, status: ${status}${timeInfo ? `, time: ${timeInfo}` : ''}`}
      {...props}
    >
      <Pill className="h-3 w-3 mr-1" />
      <span className="truncate">{medication}</span>
    </MedicalBadge>
  );
}

/**
 * AllergyBadge - For allergy severity indication
 */
export function AllergyBadge({
  allergen,
  severity,
  reaction,
  ...props
}: Omit<MedicalBadgeProps, 'status' | 'severity' | 'children' | 'label'> & {
  allergen: string;
  severity: 'mild' | 'moderate' | 'severe' | 'critical';
  reaction?: string;
}) {
  const getStatus = () => {
    switch (severity) {
      case 'critical': return 'allergy-severe'
      case 'severe': return 'allergy-moderate'
      case 'moderate': return 'allergy-moderate'
      case 'mild': return 'allergy-mild'
      default: return 'allergy-mild'
    }
  }

  return (
    <MedicalBadge
      status={getStatus()}
      severity={severity}
      criticalAlert={severity === 'critical'}
      pulse={severity === 'critical'}
      label={`Allergy: ${allergen}${reaction ? ` - ${reaction}` : ''}`}
      accessibilityLabel={`Allergy: ${allergen}, severity: ${severity}${reaction ? `, reaction: ${reaction}` : ''}`}
      {...props}
    >
      <AlertTriangle className="h-3 w-3 mr-1" />
      <span className="truncate">{allergen}</span>
    </MedicalBadge>
  );
}

/**
 * TelemedicineBadge - For telemedicine connection status
 */
export function TelemedicineBadge({
  status,
  connectionType = 'video',
  startTime,
  ...props
}: Omit<MedicalBadgeProps, 'status' | 'children' | 'label'> & {
  status: 'telemedicine-active' | 'telemedicine-waiting' | 'telemedicine-ended' | 'video-connected' | 'audio-connected';
  connectionType?: 'video' | 'audio' | 'chat';
  startTime?: string;
}) {
  return (
    <MedicalBadge
      status={status}
      size="compact"
      realtimeUpdate={status !== 'telemedicine-ended'}
      pulse={status === 'telemedicine-waiting'}
      lastUpdated={startTime}
      showTimestamp={!!startTime}
      label={`Telemedicine: ${status}${connectionType ? ` (${connectionType})` : ''}`}
      accessibilityLabel={`Telemedicine ${connectionType}: ${status}${startTime ? `, started at ${startTime}` : ''}`}
      {...props}
    >
      {connectionType === 'video' ? <Eye className="h-3 w-3 mr-1" /> :
       connectionType === 'audio' ? <Ear className="h-3 w-3 mr-1" /> :
       <Users className="h-3 w-3 mr-1" />}
      <span className="truncate">{status}</span>
    </MedicalBadge>
  );
}

/**
 * RiskAssessmentBadge - For risk level visualization
 */
export function RiskAssessmentBadge({
  riskLevel,
  factors,
  lastAssessment,
  ...props
}: Omit<MedicalBadgeProps, 'status' | 'children' | 'label'> & {
  riskLevel: 'risk-high' | 'risk-medium' | 'risk-low' | 'risk-minimal';
  factors?: string[];
  lastAssessment?: string;
}) {
  return (
    <MedicalBadge
      status={riskLevel}
      size="sm"
      criticalAlert={riskLevel === 'risk-high'}
      lastUpdated={lastAssessment}
      showTimestamp={!!lastAssessment}
      label={`Risk: ${riskLevel.replace('risk-', '')}${factors && factors.length > 0 ? ` (${factors.length} factors)` : ''}`}
      accessibilityLabel={`Risk assessment: ${riskLevel.replace('risk-', '')}${factors && factors.length > 0 ? `, ${factors.length} risk factors` : ''}${lastAssessment ? `, last assessed: ${lastAssessment}` : ''}`}
      {...props}
    >
      <Shield className="h-3 w-3 mr-1" />
      <span className="font-medium capitalize">{riskLevel.replace('risk-', '')} Risk</span>
    </MedicalBadge>
  );
}

/**
 * DiagnosticBadge - For diagnostic test status
 */
export function DiagnosticBadge({
  test,
  status,
  result,
  orderedBy,
  completedTime,
  ...props
}: Omit<MedicalBadgeProps, 'status' | 'children' | 'label'> & {
  test: string;
  status: 'test-ordered' | 'test-collected' | 'test-processing' | 'test-completed' | 'review-required';
  result?: string;
  orderedBy?: string;
  completedTime?: string;
}) {
  return (
    <MedicalBadge
      status={status}
      size="compact"
      realtimeUpdate={status === 'test-processing'}
      pulse={status === 'test-processing'}
      lastUpdated={completedTime}
      showTimestamp={!!completedTime}
      label={`${test}: ${status}${result ? ` - ${result}` : ''}`}
      accessibilityLabel={`Diagnostic test: ${test}, status: ${status}${result ? `, result: ${result}` : ''}${orderedBy ? `, ordered by: ${orderedBy}` : ''}`}
      {...props}
    >
      <FileMedical className="h-3 w-3 mr-1" />
      <span className="truncate">{test}</span>
    </MedicalBadge>
  );
}

export { medicalBadgeVariants };