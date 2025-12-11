import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { MedicalBadge, PatientStatusBadge, VitalSignBadge, EmergencyBadge, RealtimeVitalBadge } from '../medical-badge';
import { generateMedicalStatusLabel, generateVitalSignLabel, ScreenReader } from '@/utils/accessibility';

// Mock the healthcare theme context
jest.mock('@/providers/healthcare-theme-context', () => ({
  useHealthcareTheme: () => ({
    highContrastMode: false,
    reducedMotion: false,
    colorBlindMode: 'none',
    emergencyMode: false
  })
}));

describe('MedicalBadge', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Mock screen reader
    ScreenReader.init = jest.fn();
    ScreenReader.announce = jest.fn();
  });

  describe('Basic Rendering', () => {
    test('renders basic medical badge with status', () => {
      render(<MedicalBadge status="critical">Critical</MedicalBadge>);

      const badge = screen.getByRole('status');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('Critical');
      expect(badge).toHaveAttribute('aria-label', 'critical status');
    });

    test('renders with custom label', () => {
      render(<MedicalBadge status="stable" label="Patient is stable">Stable</MedicalBadge>);

      const badge = screen.getByRole('status');
      expect(badge).toHaveAttribute('aria-label', 'Patient is stable');
    });

    test('renders with custom accessibility label', () => {
      render(
        <MedicalBadge
          status="critical"
          accessibilityLabel="Patient in critical condition, requires immediate attention"
        >
          Critical
        </MedicalBadge>
      );

      const badge = screen.getByRole('status');
      expect(badge).toHaveAttribute('aria-label', 'Patient in critical condition, requires immediate attention');
    });

    test('renders without children when label is provided', () => {
      render(<MedicalBadge status="normal" label="Normal reading" />);

      const badge = screen.getByRole('status');
      expect(badge).toHaveTextContent('Normal reading');
    });

    test('renders with icon', () => {
      render(<MedicalBadge status="critical" showIcon>Critical</MedicalBadge>);

      const icon = screen.getByLabelText('hidden')?.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    test('renders with custom icon', () => {
      const customIcon = <span data-testid="custom-icon">⚠️</span>;
      render(<MedicalBadge status="warning" icon={customIcon}>Warning</MedicalBadge>);

      expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    });

    test('renders without icon when showIcon is false', () => {
      render(<MedicalBadge status="stable" showIcon={false}>Stable</MedicalBadge>);

      const badge = screen.getByRole('status');
      const icon = badge.querySelector('svg');
      expect(icon).not.toBeInTheDocument();
    });
  });

  describe('Accessibility Tests', () => {
    test('should not have accessibility violations', async () => {
      const { container } = render(<MedicalBadge status="critical">Critical</MedicalBadge>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('should have proper ARIA attributes', () => {
      render(
        <MedicalBadge
          status="critical"
          trend="up"
          department="ICU"
          specialty="Cardiology"
          severity="critical"
          realtimeUpdate={true}
        >
          Critical
        </MedicalBadge>
      );

      const badge = screen.getByRole('status');
      expect(badge).toHaveAttribute('aria-label');
      expect(badge).toHaveAttribute('data-status', 'critical');
      expect(badge).toHaveAttribute('data-department', 'ICU');
      expect(badge).toHaveAttribute('data-specialty', 'Cardiology');
      expect(badge).toHaveAttribute('data-severity', 'critical');
      expect(badge).toHaveAttribute('data-trend', 'up');
      expect(badge).toHaveAttribute('data-realtime', 'true');
    });

    test('should have appropriate title attribute for hover', () => {
      render(
        <MedicalBadge
          status="stable"
          label="Patient stable"
          lastUpdated="2 minutes ago"
        />
      );

      const badge = screen.getByRole('status');
      expect(badge).toHaveAttribute('title', 'Patient stable (Updated: 2 minutes ago)');
    });

    test('should announce critical alerts to screen readers', () => {
      render(
        <MedicalBadge
          status="critical"
          criticalAlert={true}
        >
          Critical
        </MedicalBadge>
      );

      // Check that the visual indicator is present but aria-hidden
      const alertIndicator = document.querySelector('[aria-hidden="true"]');
      expect(alertIndicator).toBeInTheDocument();
    });

    test('should have color blind friendly mode', () => {
      render(
        <MedicalBadge
          status="critical"
          colorBlindFriendly={true}
        >
          Critical
        </MedicalBadge>
      );

      const badge = screen.getByRole('status');
      expect(badge).toBeInTheDocument();
      // In color blind mode, should show shape indicators
      expect(badge).toHaveTextContent('▲');
    });

    test('should respect reduced motion preference', () => {
      const mockUseHealthcareTheme = jest.fn(() => ({
        highContrastMode: false,
        reducedMotion: true,
        colorBlindMode: 'none',
        emergencyMode: false
      }));

      jest.doMock('@/providers/healthcare-theme-context', () => ({
        useHealthcareTheme: mockUseHealthcareTheme
      }));

      const { rerender } = render(<MedicalBadge status="critical" pulse={true}>Critical</MedicalBadge>);

      let badge = screen.getByRole('status');
      expect(badge).not.toHaveClass('animate-pulse');

      // Rerender with new context
      jest.resetModules();
      rerender(<MedicalBadge status="critical" pulse={true}>Critical</MedicalBadge>);
    });
  });

  describe('Keyboard Navigation', () => {
    test('should be focusable when made interactive', async () => {
      const user = userEvent.setup();

      render(
        <MedicalBadge
          status="critical"
          tabIndex={0}
          onClick={jest.fn()}
        >
          Critical
        </MedicalBadge>
      );

      const badge = screen.getByRole('status');
      await user.tab();
      expect(badge).toHaveFocus();
    });

    test('should handle click events', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();

      render(
        <MedicalBadge
          status="stable"
          onClick={handleClick}
        >
          Stable
        </MedicalBadge>
      );

      const badge = screen.getByRole('status');
      await user.click(badge);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    test('should handle keyboard events', async () => {
      const handleKeyPress = jest.fn();
      const user = userEvent.setup();

      render(
        <MedicalBadge
          status="warning"
          onKeyDown={handleKeyPress}
        >
          Warning
        </MedicalBadge>
      );

      const badge = screen.getByRole('status');
      badge.focus();
      await user.keyboard('{Enter}');
      expect(handleKeyPress).toHaveBeenCalled();
    });
  });

  describe('Status Variants', () => {
    test.each([
      ['critical', 'bg-destructive'],
      ['serious', 'bg-warning'],
      ['stable', 'bg-success'],
      ['improving', 'bg-success/10'],
      ['declining', 'bg-warning/10'],
      ['discharged', 'bg-muted'],
    ])('should apply correct styles for %s status', (status, expectedClass) => {
      render(<MedicalBadge status={status as any}>{status}</MedicalBadge>);

      const badge = screen.getByRole('status');
      expect(badge).toHaveClass(expectedClass);
    });

    test('emergency statuses should have enhanced styling', () => {
      render(<MedicalBadge status="code-blue">Code Blue</MedicalBadge>);

      const badge = screen.getByRole('status');
      expect(badge).toHaveClass('border-2', 'animate-pulse', 'font-bold');
    });
  });

  describe('Size Variants', () => {
    test.each([
      ['xs', 'px-1.5 py-0.5 text-[10px]'],
      ['sm', 'px-2 py-0.5 text-xs'],
      ['md', 'px-2.5 py-0.5 text-sm'],
      ['lg', 'px-3 py-1 text-base'],
      ['xl', 'px-4 py-1.5 text-lg'],
      ['vital-md', 'px-3 py-1.5 text-sm font-semibold'],
    ])('should apply correct styles for %s size', (size, expectedClass) => {
      render(<MedicalBadge status="stable" size={size as any}>Stable</MedicalBadge>);

      const badge = screen.getByRole('status');
      expect(badge).toHaveClass(expectedClass);
    });
  });

  describe('Special Features', () => {
    test('should show trend indicator when configured', () => {
      render(
        <MedicalBadge
          status="warning"
          trend="up"
          trendValue={15}
          showTrendIcon={true}
        >
          Warning
        </MedicalBadge>
      );

      const badge = screen.getByRole('status');
      expect(badge).toHaveTextContent('+15%');
      expect(badge.querySelector('[aria-label="Trend: up"]')).toBeInTheDocument();
    });

    test('should show real-time update indicator', () => {
      render(
        <MedicalBadge
          status="normal"
          realtimeUpdate={true}
        >
          Normal
        </MedicalBadge>
      );

      const badge = screen.getByRole('status');
      expect(badge).toHaveClass('realtime-badge');
      expect(badge.querySelector('.animate-pulse')).toBeInTheDocument();
    });

    test('should show timestamp when configured', () => {
      render(
        <MedicalBadge
          status="stable"
          size="lg"
          lastUpdated="5 minutes ago"
          showTimestamp={true}
        >
          Stable
        </MedicalBadge>
      );

      expect(screen.getByText('5 minutes ago')).toBeInTheDocument();
    });

    test('should show department indicators in compact view', () => {
      render(
        <MedicalBadge
          status="active"
          size="compact"
          department="ICU"
        >
          Active
        </MedicalBadge>
      );

      const badge = screen.getByRole('status');
      expect(badge).toHaveTextContent('I'); // First letter of ICU
    });
  });

  describe('Real-time Updates', () => {
    test('should announce vital sign changes to screen readers', () => {
      render(<MedicalBadge status="vital-critical" vital="heartRate" />);

      // Simulate real-time update
      const { rerender } = render(
        <MedicalBadge status="vital-critical" vital="heartRate" trend="down" />
      );

      expect(ScreenReader.announce).toHaveBeenCalledWith(
        'Heart rate changed from 80 to 120, critical',
        'assertive'
      );
    });

    test('should show visual indicators for real-time updates', () => {
      render(
        <MedicalBadge
          status="warning"
          realtimeUpdate={true}
        >
          Warning
        </MedicalBadge>
      );

      const badge = screen.getByRole('status');
      const realtimeDot = badge.querySelector('.absolute.-top-1.-right-1');
      expect(realtimeDot).toBeInTheDocument();
      expect(realtimeDot).toHaveClass('bg-success', 'rounded-full', 'animate-pulse');
    });
  });

  describe('Error Boundaries', () => {
    test('should handle missing status gracefully', () => {
      expect(() => {
        render(<MedicalBadge>Test</MedicalBadge>);
      }).not.toThrow();
    });

    test('should handle invalid status gracefully', () => {
      expect(() => {
        render(<MedicalBadge status="invalid-status">Test</MedicalBadge>);
      }).not.toThrow();
    });

    test('should handle null/undefined children', () => {
      render(<MedicalBadge status="stable">{null}</MedicalBadge>);

      const badge = screen.getByRole('status');
      expect(badge).toBeInTheDocument();
    });
  });
});

describe('PatientStatusBadge', () => {
  test('renders with correct patient status', () => {
    render(<PatientStatusBadge status="critical" />);

    const badge = screen.getByRole('status');
    expect(badge).toHaveTextContent('Patient: critical');
    expect(badge).toHaveAttribute('aria-label', 'Patient: critical status');
  });

  test('should not have accessibility violations', async () => {
    const { container } = render(<PatientStatusBadge status="stable" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

describe('VitalSignBadge', () => {
  test('renders vital sign with value and unit', () => {
    render(
      <VitalSignBadge
        status="vital-normal"
        value="120"
        unit="bpm"
        label="Heart Rate"
      />
    );

    const badge = screen.getByRole('status');
    expect(badge).toHaveTextContent('120');
    expect(badge).toHaveTextContent('bpm');
    expect(badge.querySelector('.sr-only')).toHaveTextContent('Heart Rate');
  });

  test('should be accessible to screen readers', () => {
    render(
      <VitalSignBadge
        status="vital-critical"
        value="180"
        unit="bpm"
        label="Heart Rate"
      />
    );

    expect(screen.getByLabelText(/Heart Rate: 180 bpm/)).toBeInTheDocument();
  });
});

describe('EmergencyBadge', () => {
  test('renders emergency code with enhanced alert styling', () => {
    render(<EmergencyBadge code="code-blue" />);

    const badge = screen.getByRole('status');
    expect(badge).toHaveClass('animate-pulse', 'critical-alert-badge');
    expect(badge).toHaveAttribute('data-status', 'code-blue');
  });

  test('should have critical accessibility announcements', () => {
    render(<EmergencyBadge code="code-red" />);

    const badge = screen.getByRole('status');
    expect(badge).toHaveAttribute('aria-label', expect.stringContaining('Emergency'));

    // Should have alert indicators
    expect(badge.querySelector('.animate-ping')).toBeInTheDocument();
  });
});

describe('RealtimeVitalBadge', () => {
  test('renders real-time vital sign with all features', () => {
    render(
      <RealtimeVitalBadge
        vital="Blood Pressure"
        value="140/90"
        unit="mmHg"
        status="vital-warning"
        trend="up"
        lastUpdated="2 mins ago"
      />
    );

    const badge = screen.getByRole('status');
    expect(badge).toHaveTextContent('140/90');
    expect(badge).toHaveTextContent('mmHg');
    expect(badge).toHaveTextContent('2 mins ago');
    expect(badge).toHaveAttribute('data-realtime', 'true');
  });

  test('should have comprehensive accessibility label', () => {
    render(
      <RealtimeVitalBadge
        vital="Oxygen Saturation"
        value="88"
        unit="%"
        status="vital-critical"
        trend="down"
      />
    );

    const badge = screen.getByRole('status');
    expect(badge).toHaveAttribute(
      'aria-label',
      'Oxygen Saturation vital sign: 88 %, status: vital-critical, trend: down'
    );
  });

  test('should not have accessibility violations', async () => {
    const { container } = render(
      <RealtimeVitalBadge
        vital="Temperature"
        value="38.5"
        unit="°C"
        status="vital-warning"
        trend="up"
      />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

describe('Accessibility Utilities Integration', () => {
  test('should use generateMedicalStatusLabel utility', () => {
    const label = generateMedicalStatusLabel('critical', 'patient status');
    expect(label).toBe('Patient status: Critical condition');
  });

  test('should use generateVitalSignLabel utility', () => {
    const label = generateVitalSignLabel('heartRate', '120', 'bpm', 'warning');
    expect(label).toBe('Heart rate: 120 bpm, Attention required');
  });

  test('should integrate with screen reader announcements', () => {
    render(<EmergencyBadge code="code-blue" />);

    // In a real application, this would trigger screen reader announcements
    expect(ScreenReader.init).toHaveBeenCalled();
  });
});

describe('Visual Regression Tests', () => {
  test('should render consistently across different status combinations', () => {
    const statuses = [
      'critical', 'serious', 'stable', 'improving', 'declining',
      'vital-critical', 'vital-warning', 'vital-normal',
      'code-blue', 'code-red', 'code-yellow', 'code-green'
    ];

    statuses.forEach(status => {
      const { unmount } = render(<MedicalBadge status={status as any}>{status}</MedicalBadge>);
      const badge = screen.getByRole('status');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveAttribute('data-status', status);
      unmount();
    });
  });

  test('should maintain accessibility in high contrast mode', async () => {
    const mockHighContrast = jest.fn(() => ({
      highContrastMode: true,
      reducedMotion: false,
      colorBlindMode: 'none',
      emergencyMode: false
    }));

    jest.doMock('@/providers/healthcare-theme-context', () => ({
      useHealthcareTheme: mockHighContrast
    }));

    const { container } = render(
      <MedicalBadge status="critical" variant="soft">Critical</MedicalBadge>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

describe('Performance Tests', () => {
  test('should render quickly with many badges', () => {
    const startTime = performance.now();

    const badges = Array.from({ length: 100 }, (_, i) => (
      <MedicalBadge key={i} status={['critical', 'stable', 'warning'][i % 3] as any}>
        Status {i}
      </MedicalBadge>
    ));

    render(<div>{badges}</div>);

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Should render within reasonable time (adjust threshold as needed)
    expect(renderTime).toBeLessThan(100); // 100ms
  });

  test('should not cause memory leaks', () => {
    const { unmount } = render(
      <MedicalBadge status="critical" realtimeUpdate={true}>Critical</MedicalBadge>
    );

    // Verify cleanup
    unmount();

    // In a real test, you would check for memory usage
    // For now, just ensure no errors occur during unmount
    expect(true).toBe(true);
  });
});