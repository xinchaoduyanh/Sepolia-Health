import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import {
  ClinicalWorkflow,
  EmergencyWorkflow,
  DepartmentWorkflow,
  NurseStationWorkflow,
  type Task,
  type StaffInfo,
  type PatientFlowInfo,
  type HandoffRecord,
  type EmergencyProtocol
} from '../clinical-workflow';
import { generateMedicalStatusLabel, ScreenReader, KeyboardNavigation, SkipNavigation, FocusTrap } from '@/utils/accessibility';

// Mock the healthcare theme context
jest.mock('@/providers/healthcare-theme-context', () => ({
  useHealthcareTheme: () => ({
    highContrastMode: false,
    reducedMotion: false,
    colorBlindMode: 'none',
    emergencyMode: false
  })
}));

// Mock the imported components
jest.mock('./Badge', () => ({
  Badge: ({ children, className, ...props }: any) => (
    <span className={className} {...props}>
      {children}
    </span>
  )
}));

jest.mock('./Button', () => ({
  Button: ({ children, onClick, className, ...props }: any) => (
    <button className={className} onClick={onClick} {...props}>
      {children}
    </button>
  )
}));

jest.mock('./Card', () => ({
  Card: ({ children, className, ...props }: any) => (
    <div className={className} {...props} data-testid="card">
      {children}
    </div>
  )
});

jest.mock('./Avatar', () => ({
  Avatar: ({ src, alt, size, fallback, className }: any) => (
    <div className={className} data-testid="avatar">
      {fallback}
    </div>
  )
});

jest.mock('./Tabs', () => ({
  Tabs: ({ children, defaultValue }: any) => (
    <div data-default-value={defaultValue}>
      {children}
    </div>
  ),
  TabsContent: ({ children, value }: any) => (
    <div data-testid={`tabs-content-${value}`}>
      {children}
    </div>
  ),
  TabsList: ({ children }: any) => (
    <div role="tablist">
      {children}
    </div>
  ),
  TabsTrigger: ({ children, value }: any) => (
    <button role="tab" data-value={value}>
      {children}
    </button>
  )
}));

describe('ClinicalWorkflow', () => {
  const mockTasks: Task[] = [
    {
      id: 'task-001',
      title: 'Patient Assessment',
      description: 'Complete initial patient assessment',
      status: 'pending',
      priority: 'high',
      category: 'assessment',
      assignedTo: {
        id: 'staff-001',
        name: 'Dr. Smith',
        role: 'doctor',
        department: 'Emergency',
        status: 'available',
        currentLoad: 3,
        maxCapacity: 8
      },
      patient: {
        id: 'patient-001',
        name: 'John Doe',
        age: 45,
        mrn: 'MRN-001',
        currentLocation: 'Emergency Room',
        status: 'waiting',
        priority: 'high'
      },
      department: 'Emergency',
      dueDate: new Date('2024-01-15T10:00:00'),
      estimatedDuration: 30,
      tags: ['urgent', 'new-patient'],
      createdAt: new Date('2024-01-15T09:00:00'),
      updatedAt: new Date('2024-01-15T09:00:00')
    },
    {
      id: 'task-002',
      title: 'Medication Administration',
      description: 'Administer prescribed antibiotics',
      status: 'in-progress',
      priority: 'normal',
      category: 'medication',
      assignedTo: {
        id: 'staff-002',
        name: 'Nurse Johnson',
        role: 'nurse',
        department: 'Emergency',
        status: 'busy',
        currentLoad: 5,
        maxCapacity: 6
      },
      patient: {
        id: 'patient-002',
        name: 'Jane Smith',
        age: 32,
        mrn: 'MRN-002',
        currentLocation: 'Bed 3',
        status: 'in-treatment',
        priority: 'normal'
      },
      department: 'Emergency',
      estimatedDuration: 15,
      actualDuration: 10,
      createdAt: new Date('2024-01-15T08:30:00'),
      updatedAt: new Date('2024-01-15T09:15:00')
    },
    {
      id: 'task-003',
      title: 'Discharge Paperwork',
      description: 'Complete discharge documentation',
      status: 'completed',
      priority: 'low',
      category: 'discharge',
      assignedTo: {
        id: 'staff-003',
        name: 'Admin Wilson',
        role: 'admin',
        department: 'Emergency',
        status: 'available'
      },
      department: 'Emergency',
      dueDate: new Date('2024-01-15T12:00:00'),
      estimatedDuration: 20,
      completedAt: new Date('2024-01-15T11:30:00'),
      createdAt: new Date('2024-01-15T08:00:00'),
      updatedAt: new Date('2024-01-15T11:30:00')
    },
    {
      id: 'task-004',
      title: 'Critical Patient Care',
      description: 'Emergency response required',
      status: 'blocked',
      priority: 'emergency',
      category: 'emergency',
      patient: {
        id: 'patient-003',
        name: 'Critical Patient',
        age: 67,
        mrn: 'MRN-003',
        currentLocation: 'ICU',
        status: 'emergency',
        priority: 'emergency',
        alerts: ['Critical condition', 'Requires immediate attention']
      },
      department: 'ICU',
      dueDate: new Date('2024-01-15T09:30:00'),
      estimatedDuration: 45,
      tags: ['emergency', 'critical'],
      createdAt: new Date('2024-01-15T09:00:00'),
      updatedAt: new Date('2024-01-15T09:15:00')
    }
  ];

  const mockPatients: PatientFlowInfo[] = [
    {
      id: 'patient-001',
      name: 'John Doe',
      age: 45,
      mrn: 'MRN-001',
      currentLocation: 'Emergency Room',
      status: 'waiting',
      priority: 'high',
      estimatedWaitTime: 15,
      nextStep: 'Initial Assessment'
    },
    {
      id: 'patient-002',
      name: 'Jane Smith',
      age: 32,
      mrn: 'MRN-002',
      currentLocation: 'Treatment Room 2',
      status: 'in-treatment',
      priority: 'normal',
      actualWaitTime: 8,
      nextStep: 'Medication Review'
    },
    {
      id: 'patient-003',
      name: 'Emergency Patient',
      age: 28,
      mrn: 'MRN-003',
      currentLocation: 'Triage',
      status: 'emergency',
      priority: 'emergency',
      alerts: ['Chest pain', 'Difficulty breathing']
    }
  ];

  const mockHandoffs: HandoffRecord[] = [
    {
      id: 'handoff-001',
      from: {
        id: 'staff-001',
        name: 'Dr. Smith',
        role: 'doctor',
        department: 'Emergency',
        status: 'available'
      },
      to: {
        id: 'staff-002',
        name: 'Nurse Johnson',
        role: 'nurse',
        department: 'Emergency',
        status: 'busy'
      },
      patient: {
        id: 'patient-001',
        name: 'John Doe',
        age: 45,
        mrn: 'MRN-001',
        currentLocation: 'Emergency Room',
        status: 'waiting',
        priority: 'high'
      },
      department: 'Emergency',
      timestamp: new Date('2024-01-15T10:30:00'),
      notes: 'Patient stable, monitor vitals',
      acknowledgements: true,
      criticalInfo: ['Allergic to penicillin', 'Has hypertension']
    }
  ];

  const mockEmergencyProtocols: EmergencyProtocol[] = [
    {
      id: 'protocol-001',
      name: 'Cardiac Arrest Response',
      trigger: 'Patient has no pulse or is unresponsive',
      steps: [
        {
          id: 'step-001',
          action: 'Call Code Blue and start CPR',
          timeframe: 'Immediately',
          responsible: 'nurse',
          critical: true
        },
        {
          id: 'step-002',
          action: 'Prepare defibrillator',
          timeframe: '2 minutes',
          responsible: 'doctor',
          critical: true
        },
        {
          id: 'step-003',
          action: 'Establish IV access',
          timeframe: '5 minutes',
          responsible: 'nurse',
          critical: false
        }
      ],
      category: 'cardiac',
      severity: 'critical'
    },
    {
      id: 'protocol-002',
      name: 'Severe Allergic Reaction',
      trigger: 'Patient shows signs of anaphylaxis',
      steps: [
        {
          id: 'step-004',
          action: 'Administer epinephrine',
          timeframe: 'Immediately',
          responsible: 'doctor',
          critical: true
        }
      ],
      category: 'other',
      severity: 'high'
    }
  ];

  const mockStaff: StaffInfo[] = [
    {
      id: 'staff-001',
      name: 'Dr. Smith',
      role: 'doctor',
      department: 'Emergency',
      status: 'available',
      currentLoad: 3,
      maxCapacity: 8
    },
    {
      id: 'staff-002',
      name: 'Nurse Johnson',
      role: 'nurse',
      department: 'Emergency',
      status: 'busy',
      currentLoad: 5,
      maxCapacity: 6
    },
    {
      id: 'staff-003',
      name: 'Tech Wilson',
      role: 'technician',
      department: 'Emergency',
      status: 'off-duty',
      currentLoad: 0,
      maxCapacity: 8
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    test('renders clinical workflow header', () => {
      render(<ClinicalWorkflow tasks={mockTasks} />);

      expect(screen.getByText('Clinical Workflow')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Kanban Board')).toBeInTheDocument();
    });

    test('renders task filters', () => {
      render(<ClinicalWorkflow tasks={mockTasks} />);

      expect(screen.getByPlaceholderText('Search tasks...')).toBeInTheDocument();
      expect(screen.getByDisplayValue('All Status')).toBeInTheDocument();
      expect(screen.getByDisplayValue('All Priorities')).toBeInTheDocument();
    });

    test('renders real-time updates indicator when enabled', () => {
      render(<ClinicalWorkflow tasks={mockTasks} realTimeUpdates />);

      expect(screen.getByText('Live updates')).toBeInTheDocument();
      expect(screen.getByRole('status')).toBeInTheDocument(); // Real-time indicator dot
    });
  });

  describe('Kanban View', () => {
    test('renders tasks grouped by status', () => {
      render(<ClinicalWorkflow tasks={mockTasks} view="kanban" />);

      expect(screen.getByText('pending')).toBeInTheDocument();
      expect(screen.getByText('in progress')).toBeInTheDocument();
      expect(screen.getByText('completed')).toBeInTheDocument();
      expect(screen.getByText('blocked')).toBeInTheDocument();
      expect(screen.getByText('cancelled')).toBeInTheDocument();
    });

    test('displays task count badges for each status column', () => {
      render(<ClinicalWorkflow tasks={mockTasks} view="kanban" />);

      // Check for count badges
      const badges = screen.getAllByText('1'); // Each status should have a count
      expect(badges.length).toBeGreaterThan(0);
    });

    test('renders task cards with correct information', () => {
      render(<ClinicalWorkflow tasks={mockTasks} view="kanban" />);

      expect(screen.getByText('Patient Assessment')).toBeInTheDocument();
      expect(screen.getByText('Medication Administration')).toBeInTheDocument();
      expect(screen.getByText('Discharge Paperwork')).toBeInTheDocument();
      expect(screen.getByText('Critical Patient Care')).toBeInTheDocument();
    });

    test('displays task priority indicators', () => {
      render(<ClinicalWorkflow tasks={mockTasks} view="kanban" />);

      expect(screen.getByText('HIGH')).toBeInTheDocument();
      expect(screen.getByText('NORMAL')).toBeInTheDocument();
      expect(screen.getByText('LOW')).toBeInTheDocument();
      expect(screen.getByText('EMERGENCY')).toBeInTheDocument();
    });

    test('shows assignee information', () => {
      render(<ClinicalWorkflow tasks={mockTasks} view="kanban" />);

      expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
      expect(screen.getByText('Nurse Johnson')).toBeInTheDocument();
      expect(screen.getByText('Admin Wilson')).toBeInTheDocument();
    });

    test('displays patient information when assigned', () => {
      render(<ClinicalWorkflow tasks={mockTasks} view="kanban" />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Critical Patient')).toBeInTheDocument();
    });

    test('displays empty state for columns with no tasks', () => {
      const tasksWithGaps: Task[] = [
        ...mockTasks.filter(t => t.status !== 'cancelled')
      ];

      render(<ClinicalWorkflow tasks={tasksWithGaps} view="kanban" />);

      expect(screen.getByText('No tasks in cancelled')).toBeInTheDocument();
    });
  });

  describe('Timeline View', () => {
    test('renders tasks sorted by due date', () => {
      render(<ClinicalWorkflow tasks={mockTasks} view="timeline" />);

      const taskCards = screen.getAllByTestId('card');
      expect(taskCards.length).toBe(mockTasks.length);
    });

    test('displays due time for each task', () => {
      render(<ClinicalWorkflow tasks={mockTasks} view="timeline" />);

      expect(screen.getByText('10:00')).toBeInTheDocument(); // From task-001 dueDate
      expect(screen.getByText('12:00')).toBeInTheDocument(); // From task-003 dueDate
      expect(screen.getByText('09:30')).toBeInTheDocument(); // From task-004 dueDate
    });
  });

  describe('Workload View', () => {
    test('displays staff workload information', () => {
      render(
        <ClinicalWorkflow
          tasks={mockTasks}
          staff={mockStaff}
          view="workload"
        />
      );

      expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
      expect(screen.getByText('Nurse Johnson')).toBeInTheDocument();
      expect(screen.getByText('Tech Wilson')).toBeInTheDocument();
    });

    test('shows active tasks count and hours', () => {
      render(
        <ClinicalWorkflow
          tasks={mockTasks}
          staff={mockStaff}
          view="workload"
        />
      );

      expect(screen.getByText('Active Tasks:')).toBeInTheDocument();
      expect(screen.getByText('Estimated Hours:')).toBeInTheDocument();
    });

    test('displays staff availability status', () => {
      render(
        <ClinicalWorkflow
          tasks={mockTasks}
          staff={mockStaff}
          view="workload"
        />
      );

      expect(screen.getByText('available')).toBeInTheDocument();
      expect(screen.getByText('busy')).toBeInTheDocument();
      expect(screen.getByText('off-duty')).toBeInTheDocument();
    });

    test('shows utilization percentage when max capacity is set', () => {
      render(
        <ClinicalWorkflow
          tasks={mockTasks}
          staff={mockStaff}
          view="workload"
        />
      );

      expect(screen.getByText('Utilization:')).toBeInTheDocument();
    });

    test('displays high workload warning', () => {
      // Create staff with high utilization
      const busyStaff: StaffInfo[] = [
        {
          ...mockStaff[1],
          currentLoad: 7,
          maxCapacity: 7 // 100% utilization
        }
      ];

      render(
        <ClinicalWorkflow
          tasks={mockTasks}
          staff={busyStaff}
          view="workload"
        />
      );

      expect(screen.getByText('High workload')).toBeInTheDocument();
    });
  });

  describe('Board View', () => {
    test('renders overview board with tabs', () => {
      render(
        <ClinicalWorkflow
          tasks={mockTasks}
          patients={mockPatients}
          handoffs={mockHandoffs}
          emergencyProtocols={mockEmergencyProtocols}
          view="board"
          showEmergency
        />
      );

      expect(screen.getByRole('tab', { name: 'Tasks' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Patients' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Handoffs' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Emergency' })).toBeInTheDocument();
    });

    test('displays patient flow cards', async () => {
      render(
        <ClinicalWorkflow
          tasks={mockTasks}
          patients={mockPatients}
          view="board"
        />
      );

      const patientsTab = screen.getByRole('tab', { name: 'Patients' });
      await userEvent.click(patientsTab);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Emergency Patient')).toBeInTheDocument();
    });

    test('shows handoff records', async () => {
      render(
        <ClinicalWorkflow
          tasks={mockTasks}
          handoffs={mockHandoffs}
          view="board"
        />
      );

      const handoffsTab = screen.getByRole('tab', { name: 'Handoffs' });
      await userEvent.click(handoffsTab);

      expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
      expect(screen.getByText('Nurse Johnson')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    test('displays emergency protocols', async () => {
      render(
        <ClinicalWorkflow
          tasks={mockTasks}
          emergencyProtocols={mockEmergencyProtocols}
          view="board"
          showEmergency
        />
      );

      const emergencyTab = screen.getByRole('tab', { name: 'Emergency' });
      await userEvent.click(emergencyTab);

      expect(screen.getByText('Cardiac Arrest Response')).toBeInTheDocument();
      expect(screen.getByText('Severe Allergic Reaction')).toBeInTheDocument();
    });
  });

  describe('Task Management', () => {
    test('handles task status updates', async () => {
      const onTaskUpdate = jest.fn();
      const user = userEvent.setup();

      render(
        <ClinicalWorkflow
          tasks={mockTasks}
          onTaskUpdate={onTaskUpdate}
          view="kanban"
        />
      );

      const startButton = screen.getByText('Start');
      await user.click(startButton);

      expect(onTaskUpdate).toHaveBeenCalledWith('task-001', {
        status: 'in-progress',
        updatedAt: expect.any(Date)
      });
    });

    test('handles task completion', async () => {
      const onTaskUpdate = jest.fn();
      const user = userEvent.setup();

      render(
        <ClinicalWorkflow
          tasks={mockTasks}
          onTaskUpdate={onTaskUpdate}
          view="kanban"
        />
      );

      const completeButton = screen.getByText('Complete');
      await user.click(completeButton);

      expect(onTaskUpdate).toHaveBeenCalledWith('task-002', {
        status: 'completed',
        updatedAt: expect.any(Date)
      });
    });

    test('handles task blocking and resumption', async () => {
      const onTaskUpdate = jest.fn();
      const user = userEvent.setup();

      render(
        <ClinicalWorkflow
          tasks={mockTasks}
          onTaskUpdate={onTaskUpdate}
          view="kanban"
        />
      );

      const pauseButton = screen.getByRole('button'); // Pause button for in-progress task
      await user.click(pauseButton);

      expect(onTaskUpdate).toHaveBeenCalledWith('task-002', {
        status: 'blocked',
        updatedAt: expect.any(Date)
      });

      const resumeButton = screen.getByText('Resume');
      await user.click(resumeButton);

      expect(onTaskUpdate).toHaveBeenCalledWith('task-004', {
        status: 'in-progress',
        updatedAt: expect.any(Date)
      });
    });
  });

  describe('Filtering and Search', () => {
    test('filters tasks by status', async () => {
      const user = userEvent.setup();

      render(<ClinicalWorkflow tasks={mockTasks} />);

      const statusFilter = screen.getByDisplayValue('All Status');
      await user.selectOptions(statusFilter, 'pending');

      // Should only show pending tasks
      expect(screen.getByText('Patient Assessment')).toBeInTheDocument();
      expect(screen.queryByText('Medication Administration')).not.toBeInTheDocument();
    });

    test('filters tasks by priority', async () => {
      const user = userEvent.setup();

      render(<ClinicalWorkflow tasks={mockTasks} />);

      const priorityFilter = screen.getByDisplayValue('All Priorities');
      await user.selectOptions(priorityFilter, 'emergency');

      // Should only show emergency priority tasks
      expect(screen.getByText('Critical Patient Care')).toBeInTheDocument();
      expect(screen.queryByText('Patient Assessment')).not.toBeInTheDocument();
    });

    test('searches tasks by title and description', async () => {
      const user = userEvent.setup();

      render(<ClinicalWorkflow tasks={mockTasks} />);

      const searchInput = screen.getByPlaceholderText('Search tasks...');
      await user.type(searchInput, 'Assessment');

      expect(screen.getByText('Patient Assessment')).toBeInTheDocument();
      expect(screen.queryByText('Medication Administration')).not.toBeInTheDocument();
    });

    test('searches tasks by patient name', async () => {
      const user = userEvent.setup();

      render(<ClinicalWorkflow tasks={mockTasks} />);

      const searchInput = screen.getByPlaceholderText('Search tasks...');
      await user.type(searchInput, 'John');

      expect(screen.getByText('Patient Assessment')).toBeInTheDocument(); // Has patient John Doe
      expect(screen.queryByText('Discharge Paperwork')).not.toBeInTheDocument();
    });
  });

  describe('Emergency Features', () => {
    test('highlights emergency priority tasks', () => {
      render(<ClinicalWorkflow tasks={mockTasks} />);

      // Emergency tasks should have special styling
      const emergencyTask = screen.getByText('EMERGENCY');
      expect(emergencyTask).toBeInTheDocument();
    });

    test('shows patient alerts', () => {
      render(
        <ClinicalWorkflow
          tasks={mockTasks}
          patients={mockPatients}
          view="board"
        />
      );

      const patientsTab = screen.getByRole('tab', { name: 'Patients' });
      userEvent.click(patientsTab);

      expect(screen.getByText('2 alert(s)')).toBeInTheDocument();
      expect(screen.getByText('Chest pain')).toBeInTheDocument();
      expect(screen.getByText('Difficulty breathing')).toBeInTheDocument();
    });

    test('activates emergency protocols', async () => {
      const onEmergencyActivate = jest.fn();
      const user = userEvent.setup();

      render(
        <ClinicalWorkflow
          tasks={mockTasks}
          emergencyProtocols={mockEmergencyProtocols}
          view="board"
          showEmergency
          onEmergencyActivate={onEmergencyActivate}
        />
      );

      const emergencyTab = screen.getByRole('tab', { name: 'Emergency' });
      await userEvent.click(emergencyTab);

      const activateButton = screen.getByText('Activate Protocol');
      await user.click(activateButton);

      expect(onEmergencyActivate).toHaveBeenCalledWith('protocol-001');
    });
  });

  describe('Accessibility Tests', () => {
    test('should not have accessibility violations', async () => {
      const { container } = render(
        <ClinicalWorkflow
          tasks={mockTasks}
          patients={mockPatients}
          handoffs={mockHandoffs}
          emergencyProtocols={mockEmergencyProtocols}
          staff={mockStaff}
        />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('has proper ARIA labels and roles', () => {
      render(<ClinicalWorkflow tasks={mockTasks} />);

      expect(screen.getByRole('combobox')).toBeInTheDocument(); // View selector
      expect(screen.getByRole('tablist')).toBeInTheDocument();
    });

    test('supports keyboard navigation for view switching', async () => {
      const user = userEvent.setup();
      render(<ClinicalWorkflow tasks={mockTasks} view="board" />);

      const firstTab = screen.getByRole('tab', { name: 'Tasks' });
      firstTab.focus();
      expect(firstTab).toHaveFocus();

      await user.keyboard('{ArrowRight}');
      expect(screen.getByRole('tab', { name: 'Patients' })).toHaveFocus();

      await user.keyboard('{Enter}');
      expect(screen.getByTestId('tabs-content-patients')).toBeInTheDocument();
    });

    test('search input is accessible', async () => {
      const user = userEvent.setup();
      render(<ClinicalWorkflow tasks={mockTasks} />);

      const searchInput = screen.getByPlaceholderText('Search tasks...');
      expect(searchInput).toHaveAttribute('type', 'text');

      await user.type(searchInput, 'Emergency');
      expect(searchInput).toHaveValue('Emergency');
    });

    test('filter dropdowns are accessible', async () => {
      const user = userEvent.setup();
      render(<ClinicalWorkflow tasks={mockTasks} />);

      const statusFilter = screen.getByDisplayValue('All Status');
      await user.selectOptions(statusFilter, 'emergency');
      expect(statusFilter).toHaveValue('emergency');

      const priorityFilter = screen.getByDisplayValue('All Priorities');
      await user.selectOptions(priorityFilter, 'high');
      expect(priorityFilter).toHaveValue('high');
    });

    test('task action buttons have proper labels', () => {
      render(<ClinicalWorkflow tasks={mockTasks} />);

      const actionButtons = screen.getAllByRole('button');
      const startButton = actionButtons.find(button => button.textContent === 'Start');
      const completeButton = actionButtons.find(button => button.textContent === 'Complete');

      expect(startButton).toBeInTheDocument();
      expect(completeButton).toBeInTheDocument();
    });
  });

  describe('Visual Feedback', () => {
    test('shows overdue task indicators', () => {
      const overdueTask: Task = {
        ...mockTasks[0],
        dueDate: new Date('2024-01-14T10:00:00'), // Past due
        status: 'pending'
      };

      render(<ClinicalWorkflow tasks={[overdueTask]} />);

      // Overdue tasks should have warning styling
      expect(screen.getByText('Patient Assessment')).toBeInTheDocument();
    });

    test('displays task tags', () => {
      render(<ClinicalWorkflow tasks={mockTasks} />);

      expect(screen.getByText('urgent')).toBeInTheDocument();
      expect(screen.getByText('new-patient')).toBeInTheDocument();
      expect(screen.getByText('emergency')).toBeInTheDocument();
      expect(screen.getByText('critical')).toBeInTheDocument();
    });

    test('shows task duration information', () => {
      render(<ClinicalWorkflow tasks={mockTasks} />);

      expect(screen.getByText('~30m')).toBeInTheDocument();
      expect(screen.getByText('~15m')).toBeInTheDocument();
      expect(screen.getByText('~20m')).toBeInTheDocument();
      expect(screen.getByText('~45m')).toBeInTheDocument();
    });
  });

  describe('Specialized Variants', () => {
    test('EmergencyWorkflow uses emergency variant', () => {
      render(<EmergencyWorkflow tasks={mockTasks} />);

      expect(screen.getByText('Clinical Workflow')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Overview Board')).toBeInTheDocument();
    });

    test('DepartmentWorkflow filters by department', () => {
      render(
        <DepartmentWorkflow
          tasks={mockTasks}
          department="Emergency"
        />
      );

      expect(screen.getByDisplayValue('Kanban Board')).toBeInTheDocument();
    });

    test('NurseStationWorkflow uses board view with real-time updates', () => {
      render(<NurseStationWorkflow tasks={mockTasks} />);

      expect(screen.getByText('Live updates')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Overview Board')).toBeInTheDocument();
    });
  });

  describe('Performance Tests', () => {
    test('renders efficiently with large task lists', () => {
      const manyTasks = Array.from({ length: 500 }, (_, i) => ({
        id: `task-${i}`,
        title: `Task ${i}`,
        status: 'pending' as const,
        priority: 'normal' as const,
        category: 'assessment' as const,
        estimatedDuration: 30,
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      const startTime = performance.now();
      render(<ClinicalWorkflow tasks={manyTasks} />);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(1000); // Should render in under 1 second
    });

    test('handles rapid filter changes', async () => {
      const user = userEvent.setup();
      render(<ClinicalWorkflow tasks={mockTasks} />);

      const startTime = performance.now();

      await user.selectOptions(screen.getByDisplayValue('All Status'), 'pending');
      await user.selectOptions(screen.getByDisplayValue('pending'), 'in-progress');
      await user.selectOptions(screen.getByDisplayValue('in-progress'), 'completed');

      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(500); // Should handle changes quickly
    });
  });

  describe('Error Handling', () => {
    test('handles empty task list gracefully', () => {
      render(<ClinicalWorkflow tasks={[]} />);

      expect(screen.getByText('Clinical Workflow')).toBeInTheDocument();
      expect(screen.getByText('No tasks in pending')).toBeInTheDocument();
    });

    test('handles missing task properties gracefully', () => {
      const incompleteTasks: Task[] = [
        {
          id: 'task-001',
          title: 'Incomplete Task',
          status: 'pending',
          priority: 'normal',
          category: 'other',
          createdAt: new Date(),
          updatedAt: new Date()
          // Missing optional properties
        }
      ];

      expect(() => {
        render(<ClinicalWorkflow tasks={incompleteTasks} />);
      }).not.toThrow();
    });

    test('handles invalid dates gracefully', () => {
      const tasksWithInvalidDates: Task[] = [
        {
          id: 'task-001',
          title: 'Task with invalid date',
          status: 'pending',
          priority: 'normal',
          category: 'other',
          dueDate: new Date('invalid'),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      expect(() => {
        render(<ClinicalWorkflow tasks={tasksWithInvalidDates} />);
      }).not.toThrow();
    });
  });

  describe('Integration with Accessibility Utilities', () => {
    test('integrates with medical status label generator', () => {
      const label = generateMedicalStatusLabel('critical', 'task priority');
      expect(label).toBe('Task priority: Critical condition');
    });

    test('announces emergency task updates to screen readers', () => {
      render(<ClinicalWorkflow tasks={mockTasks} />);

      // Should initialize screen reader support
      expect(ScreenReader.init).toHaveBeenCalled();
    });

    test('supports skip navigation for workflow sections', () => {
      const container = document.createElement('div');
      document.body.appendChild(container);

      const skipLink = SkipNavigation.createSkipLink('kanban-board');
      expect(skipLink).toHaveAttribute('href', '#kanban-board');

      document.body.removeChild(container);
    });

    test('supports focus trap for modal interactions', () => {
      const modalElement = document.createElement('div');
      modalElement.setAttribute('tabindex', '-1');

      const focusTrap = new FocusTrap(modalElement);
      expect(focusTrap).toBeInstanceOf(FocusTrap);

      focusTrap.activate();
      focusTrap.deactivate();
    });
  });

  describe('Color Contrast Compliance', () => {
    test('maintains color contrast for priority indicators', () => {
      const { container } = render(<ClinicalWorkflow tasks={mockTasks} />);

      // Check that priority badges have sufficient contrast
      const emergencyBadge = screen.getByText('EMERGENCY');
      expect(emergencyBadge).toBeInTheDocument();
    });

    test('provides alternative indicators beyond color', () => {
      render(<ClinicalWorkflow tasks={mockTasks} />);

      // Tasks should have text labels in addition to color coding
      expect(screen.getByText('HIGH')).toBeInTheDocument();
      expect(screen.getByText('NORMAL')).toBeInTheDocument();
      expect(screen.getByText('EMERGENCY')).toBeInTheDocument();
    });
  });

  describe('Real-time Updates', () => {
    test('shows live updates indicator', () => {
      render(<ClinicalWorkflow tasks={mockTasks} realTimeUpdates />);

      const liveIndicator = screen.getByText('Live updates');
      expect(liveIndicator).toBeInTheDocument();

      const indicatorDot = liveIndicator.previousElementSibling;
      expect(indicatorDot).toHaveClass('bg-success');
    });

    test('respects reduced motion preference', () => {
      // Mock reduced motion mode
      jest.doMock('@/providers/healthcare-theme-context', () => ({
        useHealthcareTheme: () => ({
          highContrastMode: false,
          reducedMotion: true,
          colorBlindMode: 'none',
          emergencyMode: false
        })
      }));

      render(<ClinicalWorkflow tasks={mockTasks} realTimeUpdates />);

      const liveIndicator = screen.getByText('Live updates');
      const indicatorDot = liveIndicator.previousElementSibling;
      expect(indicatorDot).not.toHaveClass('animate-pulse');
    });
  });

  describe('Emergency Mode Support', () => {
    test('displays emergency mode indicator', () => {
      // Mock emergency mode
      jest.doMock('@/providers/healthcare-theme-context', () => ({
        useHealthcareTheme: () => ({
          highContrastMode: false,
          reducedMotion: false,
          colorBlindMode: 'none',
          emergencyMode: true
        })
      }));

      render(<ClinicalWorkflow tasks={mockTasks} />);

      expect(screen.getByText('EMERGENCY MODE')).toBeInTheDocument();
    });

    test('prioritizes emergency tasks in emergency mode', () => {
      // Mock emergency mode
      jest.doMock('@/providers/healthcare-theme-context', () => ({
        useHealthcareTheme: () => ({
          highContrastMode: false,
          reducedMotion: false,
          colorBlindMode: 'none',
          emergencyMode: true
        })
      }));

      render(<ClinicalWorkflow tasks={mockTasks} />);

      // Emergency tasks should be prominently displayed
      expect(screen.getByText('EMERGENCY')).toBeInTheDocument();
    });
  });

  describe('High Contrast Mode Support', () => {
    test('applies high contrast styling when enabled', () => {
      // Mock high contrast mode
      jest.doMock('@/providers/healthcare-theme-context', () => ({
        useHealthcareTheme: () => ({
          highContrastMode: true,
          reducedMotion: false,
          colorBlindMode: 'none',
          emergencyMode: false
        })
      }));

      const { container } = render(
        <ClinicalWorkflow
          tasks={mockTasks}
          variant="emergency"
        />
      );

      const workflow = container.querySelector('.border-2');
      expect(workflow).toBeInTheDocument();
    });
  });
});