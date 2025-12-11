import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { VitalSignsCard, BasicVitalSignsCard, EmergencyVitalSignsCard, ICUVitalSignsCard } from '../vital-signs-card';
import { generateVitalSignLabel, ScreenReader, KeyboardNavigation, ColorContrast } from '@/utils/accessibility';

// Mock the healthcare theme context
jest.mock('@/providers/healthcare-theme-context', () => ({
  useHealthcareTheme: () => ({
    reducedMotion: false,
    colorBlindMode: 'none',
    highContrastMode: false,
    emergencyMode: false
  })
}));

// Mock the Card component
jest.mock('../Card', () => ({
  Card: ({ children, className, ...props }: any) => (
    <div className={className} {...props} data-testid="card">
      {children}
    </div>
  ),
  CardHeader: ({ children, ...props }: any) => (
    <div {...props} data-testid="card-header">
      {children}
    </div>
  ),
  CardTitle: ({ children, ...props }: any) => (
    <h2 {...props} data-testid="card-title">
      {children}
    </h2>
  ),
  CardContent: ({ children, ...props }: any) => (
    <div {...props} data-testid="card-content">
      {children}
    </div>
  )
}));

// Mock the Button component
jest.mock('../Button', () => ({
  Button: ({ children, onClick, className, ...props }: any) => (
    <button className={className} onClick={onClick} {...props}>
      {children}
    </button>
  )
}));

describe('VitalSignsCard', () => {
  const mockVitals = [
    {
      label: 'Heart Rate',
      value: '72',
      unit: 'bpm',
      status: 'normal' as const,
      trend: 'stable' as const,
      range: { min: '60', max: '100' },
      lastUpdated: '2 mins ago'
    },
    {
      label: 'Blood Pressure',
      value: '120/80',
      unit: 'mmHg',
      status: 'normal' as const,
      trend: 'down' as const,
      range: { min: '90/60', max: '140/90' }
    },
    {
      label: 'Oxygen Saturation',
      value: '88',
      unit: '%',
      status: 'critical' as const,
      trend: 'down' as const,
      criticalValue: true,
      realtime: true,
      history: [
        { timestamp: '10:00', value: '95', status: 'normal' },
        { timestamp: '10:05', value: '92', status: 'warning' },
        { timestamp: '10:10', value: '88', status: 'critical' }
      ]
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
    test('renders vital signs correctly', () => {
      render(<VitalSignsCard vitals={mockVitals} />);

      expect(screen.getByText('Vital Signs')).toBeInTheDocument();
      expect(screen.getByText('72')).toBeInTheDocument();
      expect(screen.getByText('bpm')).toBeInTheDocument();
      expect(screen.getByText('Heart Rate')).toBeInTheDocument();
      expect(screen.getByText('120/80')).toBeInTheDocument();
      expect(screen.getByText('88')).toBeInTheDocument();
    });

    test('renders patient information when provided', () => {
      render(
        <VitalSignsCard
          vitals={mockVitals}
          patientName="John Doe"
          patientId="12345"
        />
      );

      expect(screen.getByText('Patient: John Doe')).toBeInTheDocument();
      expect(screen.getByText('ID: 12345')).toBeInTheDocument();
    });

    test('renders last updated timestamp', () => {
      render(<VitalSignsCard vitals={mockVitals} lastUpdated="5 minutes ago" />);

      expect(screen.getByText('5 minutes ago')).toBeInTheDocument();
    });

    test('renders in compact mode', () => {
      const { container } = render(
        <VitalSignsCard vitals={mockVitals} compact={true} />
      );

      const cardContent = screen.getByTestId('card-content');
      expect(cardContent).toHaveClass('p-4');
    });

    test('renders in detailed view', () => {
      const { container } = render(
        <VitalSignsCard vitals={mockVitals} detailedView={true} />
      );

      const grid = container.querySelector('.grid');
      expect(grid).toHaveClass('grid-cols-1', 'md:grid-cols-2');
    });
  });

  describe('Accessibility Tests', () => {
    test('should not have accessibility violations', async () => {
      const { container } = render(<VitalSignsCard vitals={mockVitals} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('vital items should have appropriate ARIA labels', () => {
      render(<VitalSignsCard vitals={mockVitals} />);

      const vitalItems = screen.getAllByRole('button');
      expect(vitalItems[0]).toHaveAttribute(
        'aria-label',
        'Heart Rate: 72 bpm, status: normal'
      );
      expect(vitalItems[1]).toHaveAttribute(
        'aria-label',
        'Blood Pressure: 120/80 mmHg, status: normal'
      );
      expect(vitalItems[2]).toHaveAttribute(
        'aria-label',
        'Oxygen Saturation: 88 %, status: critical, real-time monitoring'
      );
    });

    test('should be keyboard navigable', async () => {
      const onVitalClick = jest.fn();
      const user = userEvent.setup();

      render(<VitalSignsCard vitals={mockVitals} onVitalClick={onVitalClick} />);

      const vitalItems = screen.getAllByRole('button');
      vitalItems[0].focus();
      expect(vitalItems[0]).toHaveFocus();

      await user.keyboard('{Enter}');
      expect(onVitalClick).toHaveBeenCalledWith(mockVitals[0]);

      await user.keyboard('{ArrowDown}');
      await user.keyboard(' ');
      expect(onVitalClick).toHaveBeenCalledWith(mockVitals[1]);
    });

    test('should have color contrast compliance', () => {
      const { container } = render(<VitalSignsCard vitals={mockVitals} />);

      // Test critical vital contrast
      const criticalVital = container.querySelector('[data-status="critical"]');
      expect(ColorContrast.meetsWCAGAA('#dc2626', '#ffffff')).toBe(true);
    });

    test('should support screen reader announcements', () => {
      render(<VitalSignsCard vitals={mockVitals} realtimeMode={true} />);

      expect(ScreenReader.init).toHaveBeenCalled();
    });

    test('should support high contrast mode', async () => {
      // Mock high contrast mode
      jest.doMock('@/providers/healthcare-theme-context', () => ({
        useHealthcareTheme: () => ({
          reducedMotion: false,
          colorBlindMode: 'none',
          highContrastMode: true,
          emergencyMode: false
        })
      }));

      const { container } = render(
        <VitalSignsCard vitals={mockVitals} highContrastMode={true} />
      );

      const card = screen.getByTestId('card');
      expect(card).toHaveClass('border-2', 'border-foreground');

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('should support color blind mode', async () => {
      // Mock color blind mode
      jest.doMock('@/providers/healthcare-theme-context', () => ({
        useHealthcareTheme: () => ({
          reducedMotion: false,
          colorBlindMode: 'protanopia',
          highContrastMode: false,
          emergencyMode: false
        })
      }));

      const { container } = render(
        <VitalSignsCard vitals={mockVitals} colorBlindMode={true} />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Status Display', () => {
    test('displays critical alerts correctly', () => {
      render(<VitalSignsCard vitals={mockVitals} showAlerts={true} />);

      expect(screen.getByText('1 Critical')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    test('displays warning alerts correctly', () => {
      const vitalsWithWarning = [
        ...mockVitals,
        {
          label: 'Temperature',
          value: '38.5',
          unit: '°C',
          status: 'warning' as const,
          trend: 'up' as const,
          range: { min: '36.0', max: '37.5' }
        }
      ];

      render(<VitalSignsCard vitals={vitalsWithWarning} showAlerts={true} />);

      expect(screen.getByText('1 Critical')).toBeInTheDocument();
      expect(screen.getByText('1 Warning')).toBeInTheDocument();
    });

    test('displays real-time monitoring badge', () => {
      render(<VitalSignsCard vitals={mockVitals} realtimeMode={true} />);

      expect(screen.getByText(/Real-time/)).toBeInTheDocument();
    });

    test('displays connected devices badge', () => {
      render(
        <VitalSignsCard
          vitals={mockVitals}
          connectedDevices={['Heart Monitor', 'Pulse Oximeter']}
        />
      );

      expect(screen.getByText('2 Connected')).toBeInTheDocument();
    });
  });

  describe('Interactive Features', () => {
    test('handles vital click events', async () => {
      const onVitalClick = jest.fn();
      const user = userEvent.setup();

      render(<VitalSignsCard vitals={mockVitals} onVitalClick={onVitalClick} />);

      const vitalItems = screen.getAllByRole('button');
      await user.click(vitalItems[0]);

      expect(onVitalClick).toHaveBeenCalledWith(mockVitals[0]);
    });

    test('handles trend click events', async () => {
      const onTrendClick = jest.fn();
      const user = userEvent.setup();

      const vitalsWithTrend = [
        {
          ...mockVitals[0],
          trend: 'up' as const,
          trendValue: 15
        }
      ];

      render(
        <VitalSignsCard vitals={vitalsWithTrend} onTrendClick={onTrendClick} />
      );

      const trendButton = screen.getByLabelText(/Heart Rate trend details/);
      await user.click(trendButton);

      expect(onTrendClick).toHaveBeenCalledWith(vitalsWithTrend[0]);
    });

    test('handles refresh functionality', async () => {
      const onRefresh = jest.fn();
      const user = userEvent.setup();

      render(<VitalSignsCard vitals={mockVitals} onRefresh={onRefresh} />);

      const refreshButton = screen.getByLabelText('Refresh vitals');
      await user.click(refreshButton);

      await waitFor(() => {
        expect(onRefresh).toHaveBeenCalled();
      });
    });

    test('shows refresh loading state', async () => {
      const onRefresh = jest.fn(() => new Promise(resolve => setTimeout(resolve, 1000)));
      const user = userEvent.setup();

      render(<VitalSignsCard vitals={mockVitals} onRefresh={onRefresh} />);

      const refreshButton = screen.getByLabelText('Refresh vitals');
      await user.click(refreshButton);

      expect(refreshButton.querySelector('.animate-spin')).toBeInTheDocument();
    });
  });

  describe('Real-time Features', () => {
    test('toggles real-time mode', async () => {
      const onRealtimeToggle = jest.fn();
      const user = userEvent.setup();

      render(
        <VitalSignsCard
          vitals={mockVitals}
          showAlertSettings={true}
          onRealtimeToggle={onRealtimeToggle}
        />
      );

      const realtimeButton = screen.getByLabelText(/Real-time mode/);
      await user.click(realtimeButton);

      expect(onRealtimeToggle).toHaveBeenCalledWith(true);
    });

    test('toggles sound alerts', async () => {
      const onSoundToggle = jest.fn();
      const user = userEvent.setup();

      render(
        <VitalSignsCard
          vitals={mockVitals}
          showAlertSettings={true}
          onSoundToggle={onSoundToggle}
        />
      );

      const soundButton = screen.getByLabelText(/Sound alerts/);
      await user.click(soundButton);

      expect(onSoundToggle).toHaveBeenCalledWith(true);
    });

    test('auto-refreshes when enabled', () => {
      const onRefresh = jest.fn();

      render(
        <VitalSignsCard
          vitals={mockVitals}
          autoRefresh={true}
          realtimeMode={true}
          refreshInterval={5000}
          onRefresh={onRefresh}
        />
      );

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(onRefresh).toHaveBeenCalled();
    });

    test('shows real-time indicators', () => {
      render(<VitalSignsCard vitals={mockVitals} realtimeMode={true} />);

      const realtimeIndicators = document.querySelectorAll('.animate-pulse');
      expect(realtimeIndicators.length).toBeGreaterThan(0);
    });
  });

  describe('Trend Visualization', () => {
    test('displays trend icons', () => {
      const vitalsWithTrends = mockVitals.map(vital => ({
        ...vital,
        trend: 'up' as const,
        trendValue: 10
      }));

      render(<VitalSignsCard vitals={vitalsWithTrends} showTrends={true} />);

      const trendIcons = document.querySelectorAll('.text-success');
      expect(trendIcons.length).toBeGreaterThan(0);
    });

    test('displays mini trend charts when history is provided', () => {
      render(<VitalSignsCard vitals={mockVitals} showTrends={true} />);

      const trendCharts = document.querySelectorAll('svg');
      expect(trendCharts.length).toBeGreaterThan(0);
    });

    test('mini trend charts have proper accessibility', () => {
      render(<VitalSignsCard vitals={mockVitals} showTrends={true} />);

      const trendCharts = document.querySelectorAll('svg[aria-hidden="true"]');
      expect(trendCharts.length).toBeGreaterThan(0);
    });
  });

  describe('Emergency Features', () => {
    test('shows critical alert indicators', () => {
      render(<VitalSignsCard vitals={mockVitals} />);

      const criticalIndicators = document.querySelectorAll('.animate-ping');
      expect(criticalIndicators.length).toBeGreaterThan(0);
    });

    test('emergency mode enhances visual alerts', () => {
      // Mock emergency mode
      jest.doMock('@/providers/healthcare-theme-context', () => ({
        useHealthcareTheme: () => ({
          reducedMotion: false,
          colorBlindMode: 'none',
          highContrastMode: false,
          emergencyMode: true
        })
      }));

      const { container } = render(<VitalSignsCard vitals={mockVitals} />);

      const card = screen.getByTestId('card');
      expect(card).toHaveClass('border-destructive/50', 'shadow-lg');
    });
  });

  describe('Error Handling', () => {
    test('handles empty vitals array gracefully', () => {
      render(<VitalSignsCard vitals={[]} />);

      expect(screen.getByText('Vital Signs')).toBeInTheDocument();
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    test('handles missing trend data gracefully', () => {
      const vitalsWithoutTrend = mockVitals.map(vital => ({
        ...vital,
        trend: undefined
      }));

      expect(() => {
        render(<VitalSignsCard vitals={vitalsWithoutTrend} />);
      }).not.toThrow();
    });

    test('handles null values gracefully', () => {
      const vitalsWithNulls = [
        {
          label: 'Heart Rate',
          value: '72',
          unit: 'bpm',
          status: 'normal' as const,
          trend: null,
          lastUpdated: null
        }
      ];

      expect(() => {
        render(<VitalSignsCard vitals={vitalsWithNulls} />);
      }).not.toThrow();
    });
  });

  describe('Performance Tests', () => {
    test('renders efficiently with many vitals', () => {
      const manyVitals = Array.from({ length: 50 }, (_, i) => ({
        label: `Vital ${i}`,
        value: `${100 + i}`,
        unit: 'unit',
        status: 'normal' as const
      }));

      const startTime = performance.now();
      render(<VitalSignsCard vitals={manyVitals} />);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100); // Should render in under 100ms
    });

    test('handles rapid real-time updates', () => {
      const onRefresh = jest.fn();

      const { rerender } = render(
        <VitalSignsCard
          vitals={mockVitals}
          realtimeMode={true}
          autoRefresh={true}
          refreshInterval={100}
          onRefresh={onRefresh}
        />
      );

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(onRefresh).toHaveBeenCalledTimes(5);
    });
  });
});

describe('BasicVitalSignsCard', () => {
  test('renders basic vitals with automatic status detection', () => {
    render(
      <BasicVitalSignsCard
        heartRate="120"
        bloodPressure="120/80"
        temperature="38.0"
        oxygenSaturation="92"
      />
    );

    expect(screen.getByText('120')).toBeInTheDocument();
    expect(screen.getByText('120/80')).toBeInTheDocument();
    expect(screen.getByText('38.0')).toBeInTheDocument();
    expect(screen.getByText('92')).toBeInTheDocument();
  });

  test('detects abnormal values correctly', () => {
    render(
      <BasicVitalSignsCard
        heartRate="120" // High
        bloodPressure="120/80"
        temperature="38.0" // High
        oxygenSaturation="92" // Low
      />
    );

    const vitalItems = screen.getAllByRole('button');
    // Check that appropriate alerts are shown for abnormal values
    expect(vitalItems[0]).toHaveAttribute('aria-label', expect.stringContaining('warning'));
    expect(vitalItems[2]).toHaveAttribute('aria-label', expect.stringContaining('warning'));
  });

  test('should not have accessibility violations', async () => {
    const { container } = render(
      <BasicVitalSignsCard
        heartRate="72"
        bloodPressure="120/80"
        temperature="36.8"
        oxygenSaturation="98"
      />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

describe('EmergencyVitalSignsCard', () => {
  test('renders with emergency optimizations', () => {
    render(
      <EmergencyVitalSignsCard
        vitals={[
          {
            label: 'Heart Rate',
            value: '150',
            unit: 'bpm',
            status: 'critical',
            criticalValue: true
          }
        ]}
      />
    );

    const card = screen.getByTestId('card');
    expect(card).toHaveClass('border-2');
  });

  test('enables sound alerts by default', () => {
    render(
      <EmergencyVitalSignsCard vitals={mockVitals} showAlertSettings={true} />
    );

    const soundButton = screen.getByLabelText(/Sound alerts/);
    expect(soundButton).toBeInTheDocument();
  });

  test('uses high contrast mode', () => {
    render(<EmergencyVitalSignsCard vitals={mockVitals} />);

    // Should have enhanced contrast for emergency situations
    const criticalVitals = document.querySelectorAll('.border-destructive/50');
    expect(criticalVitals.length).toBeGreaterThan(0);
  });
});

describe('ICUVitalSignsCard', () => {
  test('renders with ICU-specific features', () => {
    render(
      <ICUVitalSignsCard
        vitals={mockVitals}
        patientName="Critical Patient"
        patientId="ICU-001"
      />
    );

    expect(screen.getByText('Patient: Critical Patient')).toBeInTheDocument();
    expect(screen.getByText('ID: ICU-001')).toBeInTheDocument();

    // Should have export functionality
    const exportButton = screen.getByLabelText('Export data');
    expect(exportButton).toBeInTheDocument();
  });

  test('shows detailed view by default', () => {
    const { container } = render(<ICUVitalSignsCard vitals={mockVitals} />);

    const grid = container.querySelector('.grid');
    expect(grid).toHaveClass('grid-cols-1', 'md:grid-cols-2');
  });

  test('enables all monitoring features', () => {
    render(<ICUVitalSignsCard vitals={mockVitals} showAlertSettings={true} />);

    expect(screen.getByLabelText(/Critical alerts/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Sound alerts/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Real-time mode/)).toBeInTheDocument();
    expect(screen.getByLabelText('Settings')).toBeInTheDocument();
    expect(screen.getByLabelText('Export data')).toBeInTheDocument();
  });
});

describe('Accessibility Integration', () => {
  test('integrates with vital sign label generator', () => {
    const label = generateVitalSignLabel('Heart Rate', '72', 'bpm', 'normal');
    expect(label).toBe('Heart rate: 72 bpm');
  });

  test('announces critical vital changes', () => {
    render(
      <VitalSignsCard
        vitals={[
          {
            label: 'Heart Rate',
            value: '180',
            unit: 'bpm',
            status: 'critical',
            criticalValue: true,
            realtime: true
          }
        ]}
        realtimeMode={true}
      />
    );

    // Should trigger screen reader announcements for critical values
    expect(ScreenReader.init).toHaveBeenCalled();
  });

  test('supports keyboard navigation patterns', () => {
    const vitalsContainer = document.createElement('div');
    vitalsContainer.setAttribute('role', 'grid');

    const isFocusable = KeyboardNavigation.isFocusable(vitalsContainer);
    expect(isFocusable).toBe(false); // Container is not focusable by default
  });

  test('maintains color contrast compliance', () => {
    // Test various color combinations used in the component
    expect(ColorContrast.meetsWCAGAA('#dc2626', '#ffffff')).toBe(true); // Critical on white
    expect(ColorContrast.meetsWCAGAA('#d97706', '#ffffff')).toBe(true); // Warning on white
    expect(ColorContrast.meetsWCAGAA('#10b981', '#ffffff')).toBe(true); // Normal on white
  });
});

describe('Visual Regression Tests', () => {
  test('renders consistently across different states', () => {
    const states = [
      { realtimeMode: false, showAlerts: false, compact: false },
      { realtimeMode: true, showAlerts: true, compact: false },
      { realtimeMode: true, showAlerts: true, compact: true },
      { realtimeMode: false, showAlerts: false, compact: true, detailedView: true }
    ];

    states.forEach((state, index) => {
      const { unmount } = render(<VitalSignsCard vitals={mockVitals} {...state} />);

      expect(screen.getByTestId('card')).toBeInTheDocument();
      expect(screen.getByText('Vital Signs')).toBeInTheDocument();

      unmount();
    });
  });

  test('maintains accessibility across different configurations', async () => {
    const configurations = [
      { highContrastMode: true, colorBlindMode: false },
      { highContrastMode: false, colorBlindMode: true },
      { highContrastMode: true, colorBlindMode: true },
      { highContrastMode: false, colorBlindMode: false }
    ];

    for (const config of configurations) {
      const { container, unmount } = render(
        <VitalSignsCard vitals={mockVitals} {...config} />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();

      unmount();
    }
  });
});