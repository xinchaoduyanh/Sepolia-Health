'use client'

import React, { useState, useMemo } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@workspace/ui/lib/utils'
import { Badge } from './Badge'
import { Button } from './Button'
import { Card } from './Card'
import { Avatar } from './Avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './Tabs'
import {
  User,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
  Users,
  ArrowRight,
  Stethoscope,
  Calendar,
  Phone,
  MapPin,
  Filter,
  Search,
  MoreVertical,
  Play,
  Pause,
  SkipForward,
  AlertCircle,
  Shield,
  FileText,
  Heart,
  Zap
} from 'lucide-react'
import { useHealthcareTheme } from '@/providers/healthcare-theme-context'

// Types
export interface Task {
  id: string
  title: string
  description?: string
  status: 'pending' | 'in-progress' | 'completed' | 'blocked' | 'cancelled'
  priority: 'low' | 'normal' | 'high' | 'urgent' | 'emergency'
  category: 'admission' | 'assessment' | 'treatment' | 'medication' | 'documentation' | 'discharge' | 'emergency'
  assignedTo?: StaffInfo
  patient?: PatientFlowInfo
  department?: DepartmentInfo
  dueDate?: Date
  estimatedDuration?: number // in minutes
  actualDuration?: number // in minutes
  dependencies?: string[] // task IDs
  tags?: string[]
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
}

export interface StaffInfo {
  id: string
  name: string
  role: 'doctor' | 'nurse' | 'receptionist' | 'technician' | 'specialist' | 'admin'
  department: string
  avatar?: string
  status: 'available' | 'busy' | 'off-duty' | 'emergency'
  currentLoad?: number
  maxCapacity?: number
}

export interface PatientFlowInfo {
  id: string
  name: string
  age: number
  mrn: string
  currentLocation: string
  status: 'waiting' | 'in-treatment' | 'tests' | 'surgery' | 'recovery' | 'discharged'
  priority: 'low' | 'normal' | 'high' | 'urgent' | 'emergency'
  estimatedWaitTime?: number
  actualWaitTime?: number
  nextStep?: string
  alerts?: string[]
}

export interface WorkflowDefinition {
  id: string
  name: string
  description: string
  category: 'admission' | 'emergency' | 'surgery' | 'routine' | 'discharge'
  steps: WorkflowStep[]
  estimatedDuration: number
  departments: string[]
  priority: 'low' | 'normal' | 'high' | 'urgent' | 'emergency'
}

export interface WorkflowStep {
  id: string
  name: string
  description?: string
  department: string
  requiredRole: StaffInfo['role']
  estimatedDuration: number
  dependencies?: string[]
  parallel?: boolean
  optional?: boolean
}

export interface HandoffRecord {
  id: string
  from: StaffInfo
  to: StaffInfo
  patient: PatientFlowInfo
  department: string
  timestamp: Date
  notes?: string
  acknowledgements?: boolean
  criticalInfo?: string[]
}

export interface EmergencyProtocol {
  id: string
  name: string
  trigger: string
  steps: EmergencyStep[]
  category: 'cardiac' | 'respiratory' | 'trauma' | 'neurological' | 'other'
  severity: 'low' | 'medium' | 'high' | 'critical'
}

export interface EmergencyStep {
  id: string
  action: string
  timeframe: string
  responsible: StaffInfo['role']
  critical: boolean
}

export interface ClinicalWorkflowProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof clinicalWorkflowVariants> {
  workflow?: WorkflowDefinition
  tasks: Task[]
  patients?: PatientFlowInfo[]
  handoffs?: HandoffRecord[]
  emergencyProtocols?: EmergencyProtocol[]
  staff?: StaffInfo[]
  view?: 'kanban' | 'timeline' | 'workload' | 'board'
  department?: string
  showEmergency?: boolean
  allowDragDrop?: boolean
  realTimeUpdates?: boolean
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => void
  onHandoff?: (handoff: Omit<HandoffRecord, 'id' | 'timestamp'>) => void
  onEmergencyActivate?: (protocolId: string) => void
}

const clinicalWorkflowVariants = cva(
  'w-full space-y-4',
  {
    variants: {
      variant: {
        default: '',
        compact: 'space-y-2',
        emergency: 'border-2 border-destructive/50 bg-destructive/5',
        department: 'border border-border/50',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

const getTaskPriorityColor = (priority: Task['priority']) => {
  switch (priority) {
    case 'emergency': return 'destructive'
    case 'urgent': return 'warning'
    case 'high': return 'primary'
    case 'normal': return 'success'
    case 'low': return 'secondary'
    default: return 'secondary'
  }
}

const getTaskStatusColor = (status: Task['status']) => {
  switch (status) {
    case 'completed': return 'success'
    case 'in-progress': return 'primary'
    case 'blocked': return 'destructive'
    case 'cancelled': return 'secondary'
    case 'pending': return 'warning'
    default: return 'secondary'
  }
}

const getPatientPriorityColor = (priority: PatientFlowInfo['priority']) => {
  switch (priority) {
    case 'emergency': return 'destructive'
    case 'urgent': return 'warning'
    case 'high': return 'primary'
    case 'normal': return 'success'
    case 'low': return 'secondary'
    default: return 'secondary'
  }
}

const getRoleIcon = (role: StaffInfo['role']) => {
  switch (role) {
    case 'doctor': return <Stethoscope className="h-4 w-4" />
    case 'nurse': return <Heart className="h-4 w-4" />
    case 'receptionist': return <Users className="h-4 w-4" />
    case 'technician': return <Zap className="h-4 w-4" />
    case 'specialist': return <Shield className="h-4 w-4" />
    case 'admin': return <FileText className="h-4 w-4" />
    default: return <User className="h-4 w-4" />
  }
}

// Task Card Component
const TaskCard = ({ task, onUpdate, draggable }: {
  task: Task
  onUpdate?: (taskId: string, updates: Partial<Task>) => void
  draggable?: boolean
}) => {
  const { reducedMotion, emergencyMode } = useHealthcareTheme()

  const handleStatusChange = (newStatus: Task['status']) => {
    onUpdate?.(task.id, { status: newStatus, updatedAt: new Date() })
  }

  const isOverdue = task.dueDate && new Date() > task.dueDate && task.status !== 'completed'

  return (
    <Card
      className={cn(
        'p-4 cursor-pointer transition-all hover:shadow-md',
        task.status === 'in-progress' && 'border-primary/50 bg-primary/5',
        task.status === 'completed' && 'border-success/50 bg-success/5',
        task.status === 'blocked' && 'border-destructive/50 bg-destructive/5',
        task.priority === 'emergency' && !reducedMotion && 'animate-pulse',
        isOverdue && 'border-warning bg-warning/5',
        draggable && 'cursor-move'
      )}
      draggable={draggable}
    >
      {/* Priority Indicator */}
      <div className={cn(
        'absolute top-0 left-0 w-1 h-full rounded-l',
        task.priority === 'emergency' && 'bg-destructive',
        task.priority === 'urgent' && 'bg-warning',
        task.priority === 'high' && 'bg-primary',
        task.priority === 'normal' && 'bg-success',
        task.priority === 'low' && 'bg-secondary'
      )} />

      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-sm">{task.title}</h4>
        <div className="flex items-center gap-1">
          <Badge
            variant={getTaskPriorityColor(task.priority) as any}
            size="sm"
          >
            {task.priority.toUpperCase()}
          </Badge>
        </div>
      </div>

      {/* Description */}
      {task.description && (
        <p className="text-xs text-muted-foreground mb-3">{task.description}</p>
      )}

      {/* Patient Info */}
      {task.patient && (
        <div className="flex items-center gap-2 mb-3 text-xs">
          <User className="h-3 w-3 text-muted-foreground" />
          <span>{task.patient.name}</span>
          <Badge
            variant={getPatientPriorityColor(task.patient.priority) as any}
            size="sm"
          >
            {task.patient.priority}
          </Badge>
        </div>
      )}

      {/* Assignee */}
      {task.assignedTo && (
        <div className="flex items-center gap-2 mb-3">
          <Avatar
            src={task.assignedTo.avatar}
            alt={task.assignedTo.name}
            size="xs"
            fallback={getRoleIcon(task.assignedTo.role)}
          />
          <div className="text-xs">
            <div>{task.assignedTo.name}</div>
            <div className="text-muted-foreground">{task.assignedTo.role}</div>
          </div>
        </div>
      )}

      {/* Meta Information */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          {task.dueDate && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span className={cn(isOverdue && 'text-warning')}>
                {task.dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          )}
          {task.estimatedDuration && (
            <span>~{task.estimatedDuration}m</span>
          )}
        </div>
        <Badge
          variant={getTaskStatusColor(task.status) as any}
          size="sm"
        >
          {task.status}
        </Badge>
      </div>

      {/* Actions */}
      <div className="flex gap-1 mt-3">
        {task.status === 'pending' && (
          <Button
            variant="medical"
            size="sm"
            onClick={() => handleStatusChange('in-progress')}
            className="flex-1"
          >
            <Play className="h-3 w-3 mr-1" />
            Start
          </Button>
        )}
        {task.status === 'in-progress' && (
          <>
            <Button
              variant="success"
              size="sm"
              onClick={() => handleStatusChange('completed')}
              className="flex-1"
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              Complete
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusChange('blocked')}
            >
              <Pause className="h-3 w-3" />
            </Button>
          </>
        )}
        {task.status === 'blocked' && (
          <Button
            variant="medical"
            size="sm"
            onClick={() => handleStatusChange('in-progress')}
            className="flex-1"
          >
            <Play className="h-3 w-3 mr-1" />
            Resume
          </Button>
        )}
      </div>

      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {task.tags.map((tag, index) => (
            <Badge key={index} variant="outline" size="sm" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </Card>
  )
}

// Patient Flow Card
const PatientFlowCard = ({ patient, onHandoff }: {
  patient: PatientFlowInfo
  onHandoff?: (patientId: string) => void
}) => {
  const { reducedMotion } = useHealthcareTheme()

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="font-medium">{patient.name}</h4>
          <div className="text-sm text-muted-foreground">
            Age: {patient.age} • MRN: {patient.mrn}
          </div>
        </div>
        <Badge
          variant={getPatientPriorityColor(patient.priority) as any}
          size={patient.priority === 'emergency' ? 'default' : 'sm'}
          className={cn(
            patient.priority === 'emergency' && !reducedMotion && 'animate-pulse'
          )}
        >
          {patient.priority.toUpperCase()}
        </Badge>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span>{patient.currentLocation}</span>
        </div>
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-muted-foreground" />
          <span className="capitalize">{patient.status.replace('-', ' ')}</span>
        </div>
        {patient.nextStep && (
          <div className="flex items-center gap-2">
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Next: {patient.nextStep}</span>
          </div>
        )}
        {patient.estimatedWaitTime && (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>Est. wait: {patient.estimatedWaitTime} min</span>
          </div>
        )}
      </div>

      {patient.alerts && patient.alerts.length > 0 && (
        <div className="mt-3 p-2 bg-warning/10 border border-warning/20 rounded">
          <div className="flex items-center gap-2 text-sm">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <span className="text-warning">{patient.alerts.length} alert(s)</span>
          </div>
        </div>
      )}

      {onHandoff && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onHandoff(patient.id)}
          className="w-full mt-3"
        >
          <ArrowRight className="h-4 w-4 mr-1" />
          Handoff
        </Button>
      )}
    </Card>
  )
}

// Emergency Protocol Card
const EmergencyProtocolCard = ({ protocol, onActivate }: {
  protocol: EmergencyProtocol
  onActivate?: (protocolId: string) => void
}) => {
  const { reducedMotion, emergencyMode } = useHealthcareTheme()

  return (
    <Card className={cn(
      'p-4 border-l-4',
      protocol.severity === 'critical' && 'border-l-destructive bg-destructive/5',
      protocol.severity === 'high' && 'border-l-warning bg-warning/5',
      protocol.severity === 'medium' && 'border-l-primary bg-primary/5',
      protocol.severity === 'low' && 'border-l-success bg-success/5'
    )}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-medium">{protocol.name}</h4>
          <p className="text-sm text-muted-foreground">{protocol.trigger}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={protocol.severity === 'critical' ? 'destructive' :
                          protocol.severity === 'high' ? 'warning' :
                          protocol.severity === 'medium' ? 'primary' : 'success'}>
            {protocol.severity.toUpperCase()}
          </Badge>
          <Shield className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-sm font-medium">Steps:</div>
        {protocol.steps.slice(0, 3).map((step, index) => (
          <div key={step.id} className="flex items-start gap-2 text-sm">
            <span className="flex-shrink-0 w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center text-xs font-medium">
              {index + 1}
            </span>
            <div className="flex-1">
              <div className={cn(step.critical && 'font-medium')}>
                {step.action}
              </div>
              <div className="text-xs text-muted-foreground">
                {step.timeframe} • {step.responsible}
              </div>
            </div>
            {step.critical && (
              <AlertTriangle className="h-4 w-4 text-warning flex-shrink-0" />
            )}
          </div>
        ))}
        {protocol.steps.length > 3 && (
          <div className="text-xs text-muted-foreground pl-7">
            +{protocol.steps.length - 3} more steps
          </div>
        )}
      </div>

      {onActivate && (
        <Button
          variant={protocol.severity === 'critical' ? 'emergency' : 'primary'}
          size="sm"
          onClick={() => onActivate(protocol.id)}
          className={cn(
            'w-full mt-3',
            protocol.severity === 'critical' && !reducedMotion && 'animate-pulse'
          )}
        >
          <Zap className="h-4 w-4 mr-1" />
          Activate Protocol
        </Button>
      )}
    </Card>
  )
}

export function ClinicalWorkflow({
  className,
  variant,
  tasks = [],
  patients = [],
  handoffs = [],
  emergencyProtocols = [],
  staff = [],
  view = 'kanban',
  department,
  showEmergency = true,
  allowDragDrop = true,
  realTimeUpdates = false,
  onTaskUpdate,
  onHandoff,
  onEmergencyActivate,
  ...props
}: ClinicalWorkflowProps) {
  const { highContrastMode, reducedMotion, emergencyMode } = useHealthcareTheme()
  const [selectedView, setSelectedView] = useState(view)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesStatus = filterStatus === 'all' || task.status === filterStatus
      const matchesPriority = filterPriority === 'all' || task.priority === filterPriority
      const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           task.patient?.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesDepartment = !department || task.department === department
      return matchesStatus && matchesPriority && matchesSearch && matchesDepartment
    })
  }, [tasks, filterStatus, filterPriority, searchTerm, department])

  // Group tasks by status for Kanban view
  const tasksByStatus = useMemo(() => {
    const groups: Record<string, Task[]> = {
      pending: [],
      'in-progress': [],
      completed: [],
      blocked: [],
      cancelled: []
    }

    filteredTasks.forEach(task => {
      groups[task.status].push(task)
    })

    return groups
  }, [filteredTasks])

  // Calculate workload for staff
  const staffWorkload = useMemo(() => {
    const workload: Record<string, { count: number; hours: number }> = {}

    tasks.forEach(task => {
      if (task.assignedTo) {
        if (!workload[task.assignedTo.id]) {
          workload[task.assignedTo.id] = { count: 0, hours: 0 }
        }
        workload[task.assignedTo.id].count++
        workload[task.assignedTo.id].hours += task.estimatedDuration || 0
      }
    })

    return workload
  }, [tasks])

  // Kanban View
  const KanbanView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Object.entries(tasksByStatus).map(([status, statusTasks]) => (
        <div key={status} className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium capitalize">{status.replace('-', ' ')}</h3>
            <Badge variant="outline" size="sm">
              {statusTasks.length}
            </Badge>
          </div>
          <div className="space-y-2">
            {statusTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onUpdate={onTaskUpdate}
                draggable={allowDragDrop}
              />
            ))}
            {statusTasks.length === 0 && (
              <div className="text-center text-muted-foreground text-sm p-4 border-2 border-dashed rounded-lg">
                No tasks in {status}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )

  // Timeline View
  const TimelineView = () => {
    const sortedTasks = [...filteredTasks].sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0
      if (!a.dueDate) return 1
      if (!b.dueDate) return -1
      return a.dueDate.getTime() - b.dueDate.getTime()
    })

    return (
      <div className="space-y-4">
        {sortedTasks.map(task => (
          <div key={task.id} className="flex gap-4">
            <div className="flex-shrink-0 w-20 text-right text-sm text-muted-foreground">
              {task.dueDate?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className="flex-1">
              <TaskCard
                task={task}
                onUpdate={onTaskUpdate}
              />
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Workload View
  const WorkloadView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {staff.map(staffMember => {
        const workload = staffWorkload[staffMember.id] || { count: 0, hours: 0 }
        const utilization = staffMember.maxCapacity ? (workload.hours / (staffMember.maxCapacity * 60)) * 100 : 0

        return (
          <Card key={staffMember.id} className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <Avatar
                src={staffMember.avatar}
                alt={staffMember.name}
                size="sm"
                fallback={getRoleIcon(staffMember.role)}
              />
              <div className="flex-1">
                <div className="font-medium">{staffMember.name}</div>
                <div className="text-sm text-muted-foreground">{staffMember.role}</div>
              </div>
              <Badge
                variant={staffMember.status === 'available' ? 'success' :
                        staffMember.status === 'busy' ? 'warning' :
                        staffMember.status === 'emergency' ? 'destructive' : 'secondary'}
                size="sm"
              >
                {staffMember.status}
              </Badge>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Active Tasks:</span>
                <span className="font-medium">{workload.count}</span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Hours:</span>
                <span className="font-medium">{(workload.hours / 60).toFixed(1)}h</span>
              </div>
              {staffMember.maxCapacity && (
                <div className="flex justify-between">
                  <span>Utilization:</span>
                  <span className={cn(
                    'font-medium',
                    utilization > 90 && 'text-destructive',
                    utilization > 70 && 'text-warning',
                    utilization <= 70 && 'text-success'
                  )}>
                    {utilization.toFixed(0)}%
                  </span>
                </div>
              )}
            </div>

            {utilization > 90 && (
              <div className="mt-3 p-2 bg-warning/10 border border-warning/20 rounded">
                <div className="flex items-center gap-2 text-sm">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  <span>High workload</span>
                </div>
              </div>
            )}
          </Card>
        )
      })}
    </div>
  )

  // Board View (Combined overview)
  const BoardView = () => (
    <Tabs defaultValue="tasks" className="w-full">
      <TabsList>
        <TabsTrigger value="tasks">Tasks</TabsTrigger>
        <TabsTrigger value="patients">Patients</TabsTrigger>
        <TabsTrigger value="handoffs">Handoffs</TabsTrigger>
        {showEmergency && <TabsTrigger value="emergency">Emergency</TabsTrigger>}
      </TabsList>

      <TabsContent value="tasks" className="mt-4">
        <KanbanView />
      </TabsContent>

      <TabsContent value="patients" className="mt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {patients.map(patient => (
            <PatientFlowCard
              key={patient.id}
              patient={patient}
              onHandoff={onHandoff}
            />
          ))}
        </div>
      </TabsContent>

      <TabsContent value="handoffs" className="mt-4">
        <div className="space-y-3">
          {handoffs.map(handoff => (
            <Card key={handoff.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <Avatar
                      src={handoff.from.avatar}
                      alt={handoff.from.name}
                      size="sm"
                      fallback={getRoleIcon(handoff.from.role)}
                    />
                    <div className="text-xs mt-1">{handoff.from.role}</div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  <div className="text-center">
                    <Avatar
                      src={handoff.to.avatar}
                      alt={handoff.to.name}
                      size="sm"
                      fallback={getRoleIcon(handoff.to.role)}
                    />
                    <div className="text-xs mt-1">{handoff.to.role}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{handoff.patient.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {handoff.timestamp.toLocaleString()}
                  </div>
                  {handoff.acknowledgements && (
                    <Badge variant="success" size="sm" className="mt-1">
                      Acknowledged
                    </Badge>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </TabsContent>

      {showEmergency && (
        <TabsContent value="emergency" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {emergencyProtocols.map(protocol => (
              <EmergencyProtocolCard
                key={protocol.id}
                protocol={protocol}
                onActivate={onEmergencyActivate}
              />
            ))}
          </div>
        </TabsContent>
      )}
    </Tabs>
  )

  return (
    <div className={cn(clinicalWorkflowVariants({ variant }), className)} {...props}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Clinical Workflow</h2>
        <div className="flex items-center gap-2">
          {/* View Selector */}
          <select
            className="px-3 py-1.5 border rounded-md text-sm"
            value={selectedView}
            onChange={(e) => setSelectedView(e.target.value as any)}
          >
            <option value="kanban">Kanban Board</option>
            <option value="timeline">Timeline</option>
            <option value="workload">Staff Workload</option>
            <option value="board">Overview Board</option>
          </select>

          {/* Emergency Mode Toggle */}
          {emergencyMode && (
            <Badge variant="destructive" className="animate-pulse">
              <AlertTriangle className="h-3 w-3 mr-1" />
              EMERGENCY MODE
            </Badge>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search tasks..."
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
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="blocked">Blocked</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select
          className="px-3 py-2 border rounded-md text-sm"
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
        >
          <option value="all">All Priorities</option>
          <option value="emergency">Emergency</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="normal">Normal</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Content based on view */}
      {selectedView === 'kanban' && <KanbanView />}
      {selectedView === 'timeline' && <TimelineView />}
      {selectedView === 'workload' && <WorkloadView />}
      {selectedView === 'board' && <BoardView />}

      {/* Real-time indicator */}
      {realTimeUpdates && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <div className={cn(
            'w-2 h-2 rounded-full bg-success',
            !reducedMotion && 'animate-pulse'
          )} />
          <span>Live updates</span>
        </div>
      )}
    </div>
  )
}

// Specialized Workflow Variants

export function EmergencyWorkflow(props: Omit<ClinicalWorkflowProps, 'variant' | 'view'>) {
  return (
    <ClinicalWorkflow
      {...props}
      variant="emergency"
      view="board"
      showEmergency
      realTimeUpdates
    />
  )
}

export function DepartmentWorkflow(props: Omit<ClinicalWorkflowProps, 'variant'>) {
  return (
    <ClinicalWorkflow
      {...props}
      variant="department"
      view="kanban"
      allowDragDrop
    />
  )
}

export function NurseStationWorkflow(props: Omit<ClinicalWorkflowProps, 'variant' | 'view'>) {
  return (
    <ClinicalWorkflow
      {...props}
      variant="default"
      view="board"
      realTimeUpdates
    />
  )
}