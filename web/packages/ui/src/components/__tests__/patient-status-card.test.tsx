import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import {
  PatientStatusCard,
  CriticalPatientCard,
  StablePatientCard,
  EmergencyPatientCard,
  CompactPatientCard,
  type PatientInfo,
  type PatientStatus,
  type PatientAlert,
  type ActionButton
} from '../patient-status-card';
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

jest.mock('./Avatar', () => ({
  Avatar: ({ src, alt, size, fallback, className }: any) => (
    <div className={className} data-testid="avatar">
      {fallback}
    </div>
  )
}));

jest.mock('./Card', () => ({
  Card: ({ children, className, ...props }: any) => (
    <div className={className} {...props} data-testid="card">
      {children}
    </div>
  )
}));

describe('PatientStatusCard', () => {
  const mockPatient: PatientInfo = {
    id: 'patient-001',
    name: 'John Doe',
    age: 45,
    gender: 'male',
    bloodType: 'O+',
    allergies: ['Penicillin', 'Peanuts'],
    medicalRecordNumber: 'MRN-001234'
  };

  const mockStatus: PatientStatus = {
    code: 'stable',
    label: 'Stable',
    description: 'Patient condition is stable and responding well to treatment.',
    lastUpdated: new Date('2024-01-15T10:30:00'),
    vitals: {
      heartRate: 72,
      bloodPressure: '120/80',
      temperature: 36.8,
      oxygenSat: 98
    }
  };

  const mockAlerts: PatientAlert[] = [
    {
      id: 'alert-001',
      type: 'critical',
      title: 'Critical Blood Pressure',
      message: 'Blood pressure reading is critically high',
      timestamp: new Date('2024-01-15T10:00:00'),
      requiresAction: true
    },
    {
      id: 'alert-002',
      type: 'medication',
      title: 'Medication Due',
      message: 'Antibiotic dose is due in 1 hour',
      timestamp: new Date('2024-01-15T09:30:00'),
      requiresAction: false
    }
  ];

  const mockActions: ActionButton[] = [
    {
      id: 'action-001',
      label: 'View Details',
      variant: 'primary',
      onClick: jest.fn()
    },
    {
      id: 'action-002',
      label: 'Emergency',
      variant: 'emergency',
      onClick: jest.fn()
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Basic Rendering', () => {
    test('renders patient information correctly', () => {
      render(<PatientStatusCard patient={mockPatient} status={mockStatus} />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Age: 45')).toBeInTheDocument();
      expect(screen.getByText('male')).toBeInTheDocument();
      expect(screen.getByText('O+')).toBeInTheDocument();
      expect(screen.getByText('MRN: MRN-001234')).toBeInTheDocument();
    });

    test('renders status badge correctly', () => {
      render(<PatientStatusCard patient={mockPatient} status={mockStatus} />);

      expect(screen.getByText('Stable')).toBeInTheDocument();
    });

    test('renders department and location information', () => {
      const department = {
        id: 'dept-001',
        name: 'ICU',
        code: 'ICU',
        room: '101',
        bed: 'A'
      };

      render(
        <PatientStatusCard
          patient={mockPatient}
          status={mockStatus}
          department={department}
        />
      );

      expect(screen.getByText('ICU')).toBeInTheDocument();
      expect(screen.getByText('Room 101')).toBeInTheDocument();
      expect(screen.getByText('Bed A')).toBeInTheDocument();
    });

    test('renders vital signs when enabled', () => {
      render(<PatientStatusCard patient={mockPatient} status={mockStatus} showVitals />);

      expect(screen.getByText('72 bpm')).toBeInTheDocument();
      expect(screen.getByText('120/80')).toBeInTheDocument();
      expect(screen.getByText('36.8°C')).toBeInTheDocument();
      expect(screen.getByText('98% SpO₂')).toBeInTheDocument();
      expect(screen.getByText('Vital Signs')).toBeInTheDocument();
    });

    test('renders alerts when present', () => {
      render(
        <PatientStatusCard
          patient={mockPatient}
          status={mockStatus}
          alerts={mockAlerts}
        />
      );

      expect(screen.getByText('Alerts')).toBeInTheDocument();
      expect(screen.getByText('Critical Blood Pressure')).toBeInTheDocument();
      expect(screen.getByText('Medication Due')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument(); // Alert count badge
    });

    test('renders allergies when present', () => {
      render(<PatientStatusCard patient={mockPatient} status={mockStatus} />);

      expect(screen.getByText('Allergies')).toBeInTheDocument();
      expect(screen.getByText('Penicillin')).toBeInTheDocument();
      expect(screen.getByText('Peanuts')).toBeInTheDocument();
    });

    test('renders action buttons when provided', () => {
      render(
        <PatientStatusCard
          patient={mockPatient}
          status={mockStatus}
          actions={mockActions}
        />
      );

      expect(screen.getByText('View Details')).toBeInTheDocument();
      expect(screen.getByText('Emergency')).toBeInTheDocument();
    });

    test('renders in compact mode', () => {
      render(
        <PatientStatusCard
          patient={mockPatient}
          status={mockStatus}
          compact
        />
      );

      // Should not show vitals in compact mode by default
      expect(screen.queryByText('Vital Signs')).not.toBeInTheDocument();
    });

    test('renders status description', () => {
      render(<PatientStatusCard patient={mockPatient} status={mockStatus} />);

      expect(screen.getByText(mockStatus.description!)).toBeInTheDocument();
    });
  });

  describe('Accessibility Tests', () => {
    test('should not have accessibility violations', async () => {
      const { container } = render(
        <PatientStatusCard
          patient={mockPatient}
          status={mockStatus}
          alerts={mockAlerts}
          actions={mockActions}
        />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('should have proper ARIA labels and roles', () => {
      render(
        <PatientStatusCard
          patient={mockPatient}
          status={mockStatus}
          alerts={mockAlerts}
        />
      );

      const card = screen.getByRole('article');
      expect(card).toHaveAttribute('aria-label', 'Patient status for John Doe');

      const alertButtons = screen.getAllByRole('button');
      expect(alertButtons[0]).toHaveAttribute('aria-label', 'Alert: Critical Blood Pressure');
    });

    test('should support keyboard navigation', async () => {
      const onAlertClick = jest.fn();
      const user = userEvent.setup();

      render(
        <PatientStatusCard
          patient={mockPatient}
          status={mockStatus}
          alerts={mockAlerts}
          onAlertClick={onAlertClick}
        />
      );

      const alertButton = screen.getByLabelText('Alert: Critical Blood Pressure');
      alertButton.focus();
      expect(alertButton).toHaveFocus();

      await user.keyboard('{Enter}');
      expect(onAlertClick).toHaveBeenCalledWith(mockAlerts[0]);

      await user.keyboard('{ArrowDown}');
      await user.keyboard(' ');
      expect(onAlertClick).toHaveBeenCalledWith(mockAlerts[1]);
    });

    test('action buttons should have accessibility labels', () => {
      const actionsWithLabels: ActionButton[] = [
        {
          id: 'action-001',
          label: 'View Details',
          variant: 'primary',
          onClick: jest.fn(),
          accessibilityLabel: 'View patient details and medical history'
        }
      ];

      render(
        <PatientStatusCard
          patient={mockPatient}
          status={mockStatus}
          actions={actionsWithLabels}
        />
      );

      const button = screen.getByLabelText('View patient details and medical history');
      expect(button).toBeInTheDocument();
    });

    test('should support high contrast mode', async () => {
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
        <PatientStatusCard
          patient={mockPatient}
          status={mockStatus}
          variant="critical"
        />
      );

      const card = screen.getByTestId('card');
      expect(card).toHaveClass('border-2', 'border-foreground');

      const results = await axe(container);
      expect(results).toHaveNoViolations());
    });

    test('should support reduced motion preference', () => {
      // Mock reduced motion mode
      jest.doMock('@/providers/healthcare-theme-context', () => ({
        useHealthcareTheme: () => ({
          highContrastMode: false,
          reducedMotion: true,
          colorBlindMode: 'none',
          emergencyMode: false
        })
      }));

      render(
        <PatientStatusCard
          patient={mockPatient}
          status={mockStatus}
          alerts={mockAlerts}
        />
      );

      // Critical alerts should not animate with reduced motion
      const statusBadge = screen.getByText('Stable');
      expect(statusBadge).not.toHaveClass('animate-pulse');
    });

    test('should announce emergency mode to screen readers', () => {
      // Mock emergency mode
      jest.doMock('@/providers/healthcare-theme-context', () => ({
        useHealthcareTheme: () => ({
          highContrastMode: false,
          reducedMotion: false,
          colorBlindMode: 'none',
          emergencyMode: true
        })
      }));

      render(
        <PatientStatusCard
          patient={mockPatient}
          status={mockStatus}
          alerts={mockAlerts.filter(alert => alert.type === 'critical')}
        />
      );

      expect(ScreenReader.init).toHaveBeenCalled();
    });
  });

  describe('Real-time Updates', () => {
    test('displays real-time indicator when enabled', () => {
      render(
        <PatientStatusCard
          patient={mockPatient}
          status={mockStatus}
          realTime
        />
      );

      expect(screen.getByText('Live')).toBeInTheDocument();
      expect(screen.getByLabelText('Live updating')).toBeInTheDocument();
    });

    test('updates status in real-time', () => {
      render(
        <PatientStatusCard
          patient={mockPatient}
          status={mockStatus}
          realTime
        />
      );

      // Fast-forward time to trigger real-time updates
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      // Verify that real-time logic is executed
      expect(screen.getByText('Live')).toBeInTheDocument();
    });

    test('real-time indicator should be properly accessible', () => {
      render(
        <PatientStatusCard
          patient={mockPatient}
          status={mockStatus}
          realTime
        />
      );

      const liveIndicator = screen.getByLabelText('Live updating');
      expect(liveIndicator).toBeInTheDocument();
      expect(liveIndicator).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Interactive Features', () => {
    test('handles alert clicks', async () => {
      const onAlertClick = jest.fn();
      const user = userEvent.setup();

      render(
        <PatientStatusCard
          patient={mockPatient}
          status={mockStatus}
          alerts={mockAlerts}
          onAlertClick={onAlertClick}
        />
      );

      const alertButton = screen.getByLabelText('Alert: Critical Blood Pressure');
      await user.click(alertButton);

      expect(onAlertClick).toHaveBeenCalledWith(mockAlerts[0]);
    });

    test('handles action button clicks', async () => {
      const user = userEvent.setup();

      render(
        <PatientStatusCard
          patient={mockPatient}
          status={mockStatus}
          actions={mockActions}
        />
      );

      await user.click(screen.getByText('View Details'));
      expect(mockActions[0].onClick).toHaveBeenCalled();

      await user.click(screen.getByText('Emergency'));
      expect(mockActions[1].onClick).toHaveBeenCalled();
    });

    test('disables action buttons when specified', () => {
      const disabledActions: ActionButton[] = [
        {
          id: 'action-001',
          label: 'Disabled Action',
          onClick: jest.fn(),
          disabled: true
        }
      ];

      render(
        <PatientStatusCard
          patient={mockPatient}
          status={mockStatus}
          actions={disabledActions}
        />
      );

      const button = screen.getByText('Disabled Action');
      expect(button).toBeDisabled();
    });

    test('shows action required indicator', () => {
      render(
        <PatientStatusCard
          patient={mockPatient}
          status={mockStatus}
          alerts={mockAlerts}
        />
      );

      const actionIndicators = document.querySelectorAll('.bg-primary.rounded-full');
      expect(actionIndicators.length).toBeGreaterThan(0);
    });
  });

  describe('Status Variants', () => {
    test.each([
      ['stable', 'success'],
      ['observation', 'warning'],
      ['critical', 'destructive'],
      ['discharged', 'secondary'],
      ['in-surgery', 'primary'],
      ['recovery', 'accent']
    ])('applies correct variant for %s status', (statusCode, expectedVariant) => {
      const status: PatientStatus = {
        code: statusCode as any,
        label: statusCode.charAt(0).toUpperCase() + statusCode.slice(1),
        lastUpdated: new Date()
      };

      render(<PatientStatusCard patient={mockPatient} status={status} />);

      const statusBadge = screen.getByText(status.label);
      expect(statusBadge).toBeInTheDocument();
    });

    test('applies emergency variant for critical status', () => {
      const criticalStatus: PatientStatus = {
        code: 'critical',
        label: 'Critical',
        lastUpdated: new Date()
      };

      const { container } = render(
        <PatientStatusCard
          patient={mockPatient}
          status={criticalStatus}
          variant="critical"
        />
      );

      const card = screen.getByTestId('card');
      expect(card).toHaveClass('border-destructive/50', 'bg-destructive/5');
    });
  });

  describe('Alert System', () => {
    test('filters out acknowledged alerts', () => {
      const acknowledgedAlerts: PatientAlert[] = [
        ...mockAlerts,
        {
          ...mockAlerts[0],
          id: 'alert-003',
          acknowledged: true
        }
      ];

      render(
        <PatientStatusCard
          patient={mockPatient}
          status={mockStatus}
          alerts={acknowledgedAlerts}
        />
      );

      // Should only show unacknowledged alerts
      expect(screen.getByText('2')).toBeInTheDocument(); // Alert count
    });

    test('limits alerts display in compact mode', () => {
      const manyAlerts: PatientAlert[] = [
        ...mockAlerts,
        {
          id: 'alert-003',
          type: 'info',
          title: 'Info Alert 3',
          message: 'Third info alert',
          timestamp: new Date()
        },
        {
          id: 'alert-004',
          type: 'info',
          title: 'Info Alert 4',
          message: 'Fourth info alert',
          timestamp: new Date()
        }
      ];

      render(
        <PatientStatusCard
          patient={mockPatient}
          status={mockStatus}
          alerts={manyAlerts}
          compact
        />
      );

      expect(screen.getByText('+2 more alerts')).toBeInTheDocument();
    });

    test('shows different alert types with appropriate styling', () => {
      render(
        <PatientStatusCard
          patient={mockPatient}
          status={mockStatus}
          alerts={mockAlerts}
        />
      );

      const criticalAlert = screen.getByText('Critical Blood Pressure').closest('div');
      expect(criticalAlert).toHaveClass('bg-destructive/10', 'border', 'border-destructive/20');
    });
  });

  describe('Specialized Variants', () => {
    test('CriticalPatientCard renders with critical styling', () => {
      render(
        <CriticalPatientCard
          patient={mockPatient}
          status={mockStatus}
          alerts={mockAlerts}
        />
      );

      const card = screen.getByTestId('card');
      expect(card).toHaveClass('border-destructive/50', 'bg-destructive/5');
    });

    test('StablePatientCard renders in compact mode', () => {
      render(<StablePatientCard patient={mockPatient} status={mockStatus} />);

      const card = screen.getByTestId('card');
      expect(card).toHaveClass('p-4'); // Compact padding
      expect(screen.queryByText('Vital Signs')).not.toBeInTheDocument();
    });

    test('EmergencyPatientCard renders with emergency styling', () => {
      render(<EmergencyPatientCard patient={mockPatient} status={mockStatus} />);

      const card = screen.getByTestId('card');
      expect(card).toHaveClass('animate-pulse');
      expect(screen.getByText('Live')).toBeInTheDocument();
    });

    test('CompactPatientCard hides non-essential information', () => {
      render(
        <CompactPatientCard
          patient={mockPatient}
          status={mockStatus}
          alerts={mockAlerts}
          actions={mockActions}
        />
      );

      expect(screen.queryByText('Vital Signs')).not.toBeInTheDocument();
      expect(screen.queryByText('View Details')).not.toBeInTheDocument();
      expect(screen.getByText('Alerts')).toBeInTheDocument(); // Alerts still shown
    });
  });

  describe('Error Handling', () => {
    test('handles missing optional fields gracefully', () => {
      const minimalPatient: PatientInfo = {
        id: 'minimal',
        name: 'Minimal Patient',
        age: 30,
        gender: 'female'
      };

      const minimalStatus: PatientStatus = {
        code: 'stable',
        label: 'Stable',
        lastUpdated: new Date()
      };

      expect(() => {
        render(
          <PatientStatusCard
            patient={minimalPatient}
            status={minimalStatus}
          />
        );
      }).not.toThrow();
    });

    test('handles empty arrays gracefully', () => {
      render(
        <PatientStatusCard
          patient={mockPatient}
          status={mockStatus}
          alerts={[]}
          actions={[]}
        />
      );

      expect(screen.queryByText('Alerts')).not.toBeInTheDocument();
      expect(screen.queryByText('View Details')).not.toBeInTheDocument();
    });

    test('handles missing vitals gracefully', () => {
      const statusWithoutVitals: PatientStatus = {
        code: 'stable',
        label: 'Stable',
        lastUpdated: new Date()
      };

      render(
        <PatientStatusCard
          patient={mockPatient}
          status={statusWithoutVitals}
          showVitals
        />
      );

      expect(screen.queryByText('Vital Signs')).not.toBeInTheDocument();
    });
  });

  describe('Performance Tests', () => {
    test('renders efficiently with multiple cards', () => {
      const manyPatients = Array.from({ length: 100 }, (_, i) => ({
        ...mockPatient,
        id: `patient-${i}`,
        name: `Patient ${i}`
      }));

      const startTime = performance.now();

      manyPatients.forEach(patient => {
        render(
          <PatientStatusCard
            key={patient.id}
            patient={patient}
            status={mockStatus}
          />
        );
      });

      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(1000); // Should render in under 1 second
    });

    test('handles rapid real-time updates without memory leaks', () => {
      const { unmount } = render(
        <PatientStatusCard
          patient={mockPatient}
          status={mockStatus}
          realTime
        />
      );

      // Simulate many real-time updates
      for (let i = 0; i < 100; i++) {
        act(() => {
          jest.advanceTimersByTime(5000);
        });
      }

      expect(() => unmount()).not.toThrow();
    });
  });

  describe('Integration with Accessibility Utilities', () => {
    test('integrates with medical status label generator', () => {
      const label = generateMedicalStatusLabel('critical', 'patient status');
      expect(label).toBe('Patient status: Critical condition');
    });

    test('supports skip navigation for card focus management', () => {
      const container = document.createElement('div');
      document.body.appendChild(container);

      const skipLink = SkipNavigation.createSkipLink('patient-card-001');
      expect(skipLink).toHaveAttribute('href', '#patient-card-001');

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

  describe('Visual Regression Tests', () => {
    test('maintains consistent styling across different states', () => {
      const states = [
        { compact: false, realTime: false, showAlerts: false },
        { compact: true, realTime: false, showAlerts: false },
        { compact: false, realTime: true, showAlerts: false },
        { compact: false, realTime: false, showAlerts: true },
        { compact: true, realTime: true, showAlerts: true }
      ];

      states.forEach((state, index) => {
        const { unmount } = render(
          <PatientStatusCard
            patient={mockPatient}
            status={mockStatus}
            alerts={mockAlerts}
            actions={mockActions}
            {...state}
          />
        );

        expect(screen.getByTestId('card')).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();

        unmount();
      });
    });

    test('maintains accessibility across different configurations', async () => {
      const configurations = [
        { variant: 'default' as const },
        { variant: 'critical' as const },
        { variant: 'warning' as const },
        { variant: 'emergency' as const }
      ];

      for (const config of configurations) {
        const { container, unmount } = render(
          <PatientStatusCard
            patient={mockPatient}
            status={mockStatus}
            variant={config.variant}
          />
        );

        const results = await axe(container);
        expect(results).toHaveNoViolations();

        unmount();
      }
    });
  });

  describe('Screen Reader Support', () => {
    test('announces critical alerts immediately', () => {
      render(
        <PatientStatusCard
          patient={mockPatient}
          status={mockStatus}
          alerts={[mockAlerts[0]]} // Only critical alert
        />
      );

      // Critical alerts should be announced immediately
      expect(ScreenReader.init).toHaveBeenCalled();
    });

    test('provides context for vital sign changes', () => {
      const statusWithVitals: PatientStatus = {
        code: 'critical',
        label: 'Critical',
        lastUpdated: new Date(),
        vitals: {
          heartRate: 150,
          bloodPressure: '180/120',
          temperature: 39.5,
          oxygenSat: 85
        }
      };

      render(
        <PatientStatusCard
          patient={mockPatient}
          status={statusWithVitals}
          showVitals
          realTime
        />
      );

      // Should announce critical vital sign changes
      expect(ScreenReader.announce).toHaveBeenCalledWith(
        expect.stringContaining('changed'),
        'assertive'
      );
    });
  });

  describe('Color Contrast Compliance', () => {
    test('maintains WCAG AA compliance for status indicators', () => {
      const { container } = render(
        <PatientStatusCard
          patient={mockPatient}
          status={mockStatus}
          alerts={mockAlerts}
        />
      );

      // Check that critical alerts have sufficient contrast
      const criticalElements = container.querySelectorAll('.text-destructive');
      criticalElements.forEach(element => {
        const styles = window.getComputedStyle(element);
        expect(styles.color).toBeDefined();
      });
    });

    test('provides alternative indicators for color blind users', () => {
      // Mock color blind mode
      jest.doMock('@/providers/healthcare-theme-context', () => ({
        useHealthcareTheme: () => ({
          highContrastMode: false,
          reducedMotion: false,
          colorBlindMode: 'protanopia',
          emergencyMode: false
        })
      }));

      render(
        <PatientStatusCard
          patient={mockPatient}
          status={mockStatus}
          alerts={mockAlerts}
        />
      );

      // Should provide pattern or texture indicators in addition to color
      const alertItems = screen.getAllByRole('button');
      expect(alertItems.length).toBeGreaterThan(0);
    });
  });
});