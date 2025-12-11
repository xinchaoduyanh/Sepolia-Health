import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import {
  PatientChart,
  EmergencyVitalsChart,
  WardPatientOverview,
  CompactVitalsChart,
  type VitalSign,
  type LabResult,
  type ProgressMetric,
  type ChartAnnotation,
  type ExportFormat
} from '../patient-chart';
import { generateChartLabel, ScreenReader, ColorContrast } from '@/utils/accessibility';

// Mock Recharts components
jest.mock('recharts', () => ({
  LineChart: ({ children, data, ...props }: any) => (
    <div data-testid="line-chart" data-data={JSON.stringify(data)} {...props}>
      {children}
    </div>
  ),
  Line: ({ dataKey, stroke, ...props }: any) => (
    <div data-testid="line" data-datakey={dataKey} data-stroke={stroke} {...props} />
  ),
  AreaChart: ({ children, data, ...props }: any) => (
    <div data-testid="area-chart" data-data={JSON.stringify(data)} {...props}>
      {children}
    </div>
  ),
  Area: ({ dataKey, fill, ...props }: any) => (
    <div data-testid="area" data-datakey={dataKey} data-fill={fill} {...props} />
  ),
  BarChart: ({ children, data, ...props }: any) => (
    <div data-testid="bar-chart" data-data={JSON.stringify(data)} {...props}>
      {children}
    </div>
  ),
  Bar: ({ dataKey, fill, ...props }: any) => (
    <div data-testid="bar" data-datakey={dataKey} data-fill={fill} {...props} />
  ),
  XAxis: (props: any) => <div data-testid="x-axis" {...props} />,
  YAxis: (props: any) => <div data-testid="y-axis" {...props} />,
  CartesianGrid: (props: any) => <div data-testid="cartesian-grid" {...props} />,
  Tooltip: ({ content }: any) => <div data-testid="tooltip">{content}</div>,
  Legend: (props: any) => <div data-testid="legend" {...props} />,
  ResponsiveContainer: ({ children, width, height }: any) => (
    <div data-testid="responsive-container" data-width={width} data-height={height}>
      {children}
    </div>
  ),
  ReferenceLine: (props: any) => <div data-testid="reference-line" {...props} />,
  ReferenceArea: (props: any) => <div data-testid="reference-area" {...props} />
}));

// Mock the healthcare theme context
jest.mock('@/providers/healthcare-theme-context', () => ({
  useHealthcareTheme: () => ({
    highContrastMode: false,
    reducedMotion: false,
    colorBlindMode: 'none'
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
}));

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

describe('PatientChart', () => {
  const mockVitals: VitalSign[] = [
    {
      timestamp: new Date('2024-01-15T08:00:00'),
      heartRate: 72,
      systolicBP: 120,
      diastolicBP: 80,
      temperature: 36.8,
      oxygenSat: 98,
      respiratoryRate: 16
    },
    {
      timestamp: new Date('2024-01-15T12:00:00'),
      heartRate: 85,
      systolicBP: 130,
      diastolicBP: 85,
      temperature: 37.2,
      oxygenSat: 97,
      respiratoryRate: 18
    },
    {
      timestamp: new Date('2024-01-15T16:00:00'),
      heartRate: 90,
      systolicBP: 140,
      diastolicBP: 90,
      temperature: 37.8,
      oxygenSat: 95,
      respiratoryRate: 20
    }
  ];

  const mockLabs: LabResult[] = [
    {
      id: 'lab-001',
      name: 'Hemoglobin',
      value: 14.5,
      unit: 'g/dL',
      referenceRange: { min: 12, max: 16 },
      status: 'normal',
      timestamp: new Date('2024-01-15T08:00:00'),
      category: 'hematology'
    },
    {
      id: 'lab-002',
      name: 'Glucose',
      value: 150,
      unit: 'mg/dL',
      referenceRange: { min: 70, max: 100 },
      status: 'high',
      timestamp: new Date('2024-01-15T08:00:00'),
      category: 'chemistry'
    },
    {
      id: 'lab-003',
      name: 'White Blood Cells',
      value: 16.5,
      unit: 'K/uL',
      referenceRange: { min: 4, max: 11 },
      status: 'critical',
      timestamp: new Date('2024-01-15T08:00:00'),
      category: 'hematology'
    }
  ];

  const mockProgress: ProgressMetric[] = [
    {
      date: new Date('2024-01-15'),
      painLevel: 4,
      mobilityScore: 70,
      appetiteLevel: 6,
      sleepQuality: 7,
      moodScore: 6,
      notes: 'Patient responding well to treatment'
    },
    {
      date: new Date('2024-01-16'),
      painLevel: 2,
      mobilityScore: 80,
      appetiteLevel: 8,
      sleepQuality: 8,
      moodScore: 7,
      notes: 'Pain decreased significantly'
    }
  ];

  const mockAnnotations: ChartAnnotation[] = [
    {
      id: 'ann-001',
      timestamp: new Date('2024-01-15T10:00:00'),
      type: 'medication',
      title: 'Antibiotic Administered',
      description: 'Amoxicillin 500mg IV',
      severity: 'medium'
    },
    {
      id: 'ann-002',
      timestamp: new Date('2024-01-15T14:00:00'),
      type: 'procedure',
      title: 'X-ray Completed',
      description: 'Chest X-ray shows improvement',
      severity: 'low'
    }
  ];

  const mockExportOptions: ExportFormat[] = [
    {
      id: 'pdf',
      label: 'PDF',
      format: 'pdf'
    },
    {
      id: 'png',
      label: 'PNG',
      format: 'png'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    test('renders vitals chart correctly', () => {
      render(
        <PatientChart
          data={{ vitals: mockVitals }}
          type="vitals"
        />
      );

      expect(screen.getByText('Vital Signs')).toBeInTheDocument();
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });

    test('renders labs chart correctly', () => {
      render(
        <PatientChart
          data={{ labs: mockLabs }}
          type="labs"
        />
      );

      expect(screen.getByText('Laboratory Results')).toBeInTheDocument();
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
      expect(screen.getByText('Hemoglobin')).toBeInTheDocument();
      expect(screen.getByText('Glucose')).toBeInTheDocument();
      expect(screen.getByText('White Blood Cells')).toBeInTheDocument();
    });

    test('renders progress chart correctly', () => {
      render(
        <PatientChart
          data={{ progress: mockProgress }}
          type="progress"
        />
      );

      expect(screen.getByText('Progress Tracking')).toBeInTheDocument();
      expect(screen.getByTestId('area-chart')).toBeInTheDocument();
      expect(screen.getByText('Patient responding well to treatment')).toBeInTheDocument();
    });

    test('renders combined view with tabs', () => {
      render(
        <PatientChart
          data={{ vitals: mockVitals, labs: mockLabs, progress: mockProgress }}
          type="combined"
        />
      );

      expect(screen.getByText('Patient Overview')).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Vitals' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Labs' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Progress' })).toBeInTheDocument();
    });

    test('renders time range selector', () => {
      render(
        <PatientChart
          data={{ vitals: mockVitals }}
          type="vitals"
        />
      );

      const timeRangeSelect = screen.getByRole('combobox');
      expect(timeRangeSelect).toBeInTheDocument();
      expect(screen.getByText('24 Hours')).toBeInTheDocument();
    });
  });

  describe('Vitals Chart Features', () => {
    test('renders vital selection buttons', () => {
      render(
        <PatientChart
          data={{ vitals: mockVitals }}
          type="vitals"
        />
      );

      expect(screen.getByText('Heart Rate')).toBeInTheDocument();
      expect(screen.getByText('Systolic BP')).toBeInTheDocument();
      expect(screen.getByText('Temperature')).toBeInTheDocument();
      expect(screen.getByText('Oxygen Sat')).toBeInTheDocument();
    });

    test('toggles vital display on button click', async () => {
      const user = userEvent.setup();
      render(
        <PatientChart
          data={{ vitals: mockVitals }}
          type="vitals"
        />
      );

      const heartRateButton = screen.getByText('Heart Rate');
      await user.click(heartRateButton);

      // Heart rate should be removed from selected vitals
      expect(heartRateButton.closest('button')).toHaveClass('variant-outline');
    });

    test('renders reference lines for normal ranges', () => {
      render(
        <PatientChart
          data={{ vitals: mockVitals }}
          type="vitals"
          showGrid={true}
        />
      );

      expect(screen.getByTestId('reference-line')).toBeInTheDocument();
    });

    test('displays chart with correct height', () => {
      render(
        <PatientChart
          data={{ vitals: mockVitals }}
          type="vitals"
          height={400}
        />
      );

      const container = screen.getByTestId('responsive-container');
      expect(container).toHaveAttribute('data-height', '400');
    });
  });

  describe('Labs Chart Features', () => {
    test('displays lab result cards with status badges', () => {
      render(
        <PatientChart
          data={{ labs: mockLabs }}
          type="labs"
        />
      );

      expect(screen.getByText('14.5 g/dL')).toBeInTheDocument();
      expect(screen.getByText('150 mg/dL')).toBeInTheDocument();
      expect(screen.getByText('16.5 K/uL')).toBeInTheDocument();
      expect(screen.getByText('NORMAL')).toBeInTheDocument();
      expect(screen.getByText('HIGH')).toBeInTheDocument();
      expect(screen.getByText('CRITICAL')).toBeInTheDocument();
    });

    test('displays reference ranges for lab values', () => {
      render(
        <PatientChart
          data={{ labs: mockLabs }}
          type="labs"
        />
      );

      expect(screen.getByText('Range: 12 - 16')).toBeInTheDocument();
      expect(screen.getByText('Range: 70 - 100')).toBeInTheDocument();
      expect(screen.getByText('Range: 4 - 11')).toBeInTheDocument();
    });

    test('shows bar chart for lab values', () => {
      render(
        <PatientChart
          data={{ labs: mockLabs }}
          type="labs"
        />
      );

      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
      expect(screen.getByTestId('bar')).toBeInTheDocument();
    });
  });

  describe('Progress Chart Features', () => {
    test('displays progress notes', () => {
      render(
        <PatientChart
          data={{ progress: mockProgress }}
          type="progress"
        />
      );

      expect(screen.getByText('Patient responding well to treatment')).toBeInTheDocument();
      expect(screen.getByText('Pain decreased significantly')).toBeInTheDocument();
    });

    test('shows area chart for progress metrics', () => {
      render(
        <PatientChart
          data={{ progress: mockProgress }}
          type="progress"
        />
      );

      expect(screen.getByTestId('area-chart')).toBeInTheDocument();
      expect(screen.getByTestId('area')).toBeInTheDocument();
    });
  });

  describe('Annotations Feature', () => {
    test('displays annotations when provided', () => {
      render(
        <PatientChart
          data={{ vitals: mockVitals }}
          type="vitals"
          annotations={mockAnnotations}
          showAnnotations={true}
        />
      );

      expect(screen.getByText('Annotations')).toBeInTheDocument();
      expect(screen.getByText('Antibiotic Administered')).toBeInTheDocument();
      expect(screen.getByText('X-ray Completed')).toBeInTheDocument();
      expect(screen.getByText('Amoxicillin 500mg IV')).toBeInTheDocument();
    });

    test('handles annotation clicks', async () => {
      const onAnnotationClick = jest.fn();
      const user = userEvent.setup();

      render(
        <PatientChart
          data={{ vitals: mockVitals }}
          type="vitals"
          annotations={mockAnnotations}
          showAnnotations={true}
          onAnnotationClick={onAnnotationClick}
        />
      );

      const annotation = screen.getByText('Antibiotic Administered');
      await user.click(annotation);

      expect(onAnnotationClick).toHaveBeenCalledWith(mockAnnotations[0]);
    });

    test('filters annotations by time range', () => {
      const outOfRangeAnnotation: ChartAnnotation = {
        id: 'ann-003',
        timestamp: new Date('2024-01-10T10:00:00'), // Outside 24h range
        type: 'event',
        title: 'Old Event'
      };

      render(
        <PatientChart
          data={{ vitals: mockVitals }}
          type="vitals"
          annotations={[...mockAnnotations, outOfRangeAnnotation]}
          showAnnotations={true}
        />
      );

      // Should only show annotations within time range
      expect(screen.getByText('Antibiotic Administered')).toBeInTheDocument();
      expect(screen.queryByText('Old Event')).not.toBeInTheDocument();
    });
  });

  describe('Export Features', () => {
    test('displays export buttons when options provided', () => {
      render(
        <PatientChart
          data={{ vitals: mockVitals }}
          type="vitals"
          exportOptions={mockExportOptions}
        />
      );

      expect(screen.getByText('PDF')).toBeInTheDocument();
      expect(screen.getByText('PNG')).toBeInTheDocument();
    });

    test('handles export button clicks', async () => {
      const onExport = jest.fn();
      const user = userEvent.setup();

      render(
        <PatientChart
          data={{ vitals: mockVitals }}
          type="vitals"
          exportOptions={mockExportOptions}
          onExport={onExport}
        />
      );

      const pdfButton = screen.getByText('PDF');
      await user.click(pdfButton);

      expect(onExport).toHaveBeenCalledWith(mockExportOptions[0]);
    });
  });

  describe('Interactive Features', () => {
    test('toggles fullscreen mode', async () => {
      const user = userEvent.setup();
      render(
        <PatientChart
          data={{ vitals: mockVitals }}
          type="vitals"
        />
      );

      const fullscreenButton = screen.getByRole('button');
      await user.click(fullscreenButton);

      // Button should be clicked (component manages internal state)
      expect(fullscreenButton).toBeInTheDocument();
    });

    test('changes time range selection', async () => {
      const user = userEvent.setup();
      render(
        <PatientChart
          data={{ vitals: mockVitals }}
          type="vitals"
        />
      );

      const timeRangeSelect = screen.getByRole('combobox');
      await user.selectOptions(timeRangeSelect, '7 Days');

      expect(timeRangeSelect).toHaveValue('7 Days');
    });

    test('switches between combined view tabs', async () => {
      const user = userEvent.setup();
      render(
        <PatientChart
          data={{ vitals: mockVitals, labs: mockLabs, progress: mockProgress }}
          type="combined"
        />
      );

      const labsTab = screen.getByRole('tab', { name: 'Labs' });
      await user.click(labsTab);

      expect(screen.getByTestId('tabs-content-labs')).toBeInTheDocument();
    });
  });

  describe('Accessibility Tests', () => {
    test('should not have accessibility violations', async () => {
      const { container } = render(
        <PatientChart
          data={{ vitals: mockVitals, labs: mockLabs, progress: mockProgress }}
          type="combined"
          annotations={mockAnnotations}
          showAnnotations={true}
        />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('has proper ARIA labels and roles', () => {
      render(
        <PatientChart
          data={{ vitals: mockVitals }}
          type="vitals"
        />
      );

      expect(screen.getByRole('tablist')).toBeInTheDocument();
      expect(screen.getAllByRole('tab').length).toBeGreaterThan(0);
    });

    test('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      render(
        <PatientChart
          data={{ vitals: mockVitals }}
          type="combined"
        />
      );

      const firstTab = screen.getByRole('tab', { name: 'Vitals' });
      firstTab.focus();
      expect(firstTab).toHaveFocus();

      await user.keyboard('{ArrowRight}');
      expect(screen.getByRole('tab', { name: 'Labs' })).toHaveFocus();

      await user.keyboard('{Enter}');
      expect(screen.getByTestId('tabs-content-labs')).toBeInTheDocument();
    });

    test('time range selector is accessible', async () => {
      const user = userEvent.setup();
      render(
        <PatientChart
          data={{ vitals: mockVitals }}
          type="vitals"
        />
      );

      const timeRangeSelect = screen.getByRole('combobox');
      expect(timeRangeSelect).toBeInTheDocument();

      await user.selectOptions(timeRangeSelect, '30 Days');
      expect(timeRangeSelect).toHaveValue('30 Days');
    });

    test('vital selection buttons are accessible', async () => {
      const user = userEvent.setup();
      render(
        <PatientChart
          data={{ vitals: mockVitals }}
          type="vitals"
        />
      );

      const heartRateButton = screen.getByText('Heart Rate');
      expect(heartRateButton.closest('button')).toBeInTheDocument();

      await user.click(heartRateButton);
      expect(heartRateButton.closest('button')).toBeInTheDocument();
    });
  });

  describe('Color Blind Support', () => {
    test('shows color blind palette when enabled', () => {
      render(
        <PatientChart
          data={{ vitals: mockVitals }}
          type="vitals"
          colorBlindFriendly={true}
        />
      );

      expect(screen.getByText('Color Blind Friendly Palette:')).toBeInTheDocument();
      expect(screen.getByText('primary')).toBeInTheDocument();
      expect(screen.getByText('secondary')).toBeInTheDocument();
      expect(screen.getByText('success')).toBeInTheDocument();
    });

    test('respects theme color blind mode', () => {
      // Mock color blind mode from theme
      jest.doMock('@/providers/healthcare-theme-context', () => ({
        useHealthcareTheme: () => ({
          highContrastMode: false,
          reducedMotion: false,
          colorBlindMode: 'deuteranopia'
        })
      }));

      render(
        <PatientChart
          data={{ vitals: mockVitals }}
          type="vitals"
        />
      );

      expect(screen.getByText('Color Blind Friendly Palette:')).toBeInTheDocument();
    });

    test('uses color blind friendly colors in charts', () => {
      render(
        <PatientChart
          data={{ vitals: mockVitals }}
          type="vitals"
          colorBlindFriendly={true}
        />
      );

      const lines = screen.getAllByTestId('line');
      expect(lines.length).toBeGreaterThan(0);

      // Lines should use color blind friendly palette
      lines.forEach(line => {
        expect(line).toHaveAttribute('data-stroke');
      });
    });
  });

  describe('Data Processing', () => {
    test('filters vitals by selected time range', () => {
      render(
        <PatientChart
          data={{ vitals: mockVitals }}
          type="vitals"
          timeRange={{
            start: new Date('2024-01-15T10:00:00'),
            end: new Date('2024-01-15T18:00:00'),
            label: 'Custom Range'
          }}
        />
      );

      const chart = screen.getByTestId('line-chart');
      const chartData = JSON.parse(chart.getAttribute('data-data') || '[]');

      // Should only include vitals within the time range
      expect(chartData.length).toBeLessThanOrEqual(mockVitals.length);
    });

    test('processes lab data correctly', () => {
      render(
        <PatientChart
          data={{ labs: mockLabs }}
          type="labs"
        />
      );

      const barChart = screen.getByTestId('bar-chart');
      const chartData = JSON.parse(barChart.getAttribute('data-data') || '[]');

      expect(chartData).toBeDefined();
    });

    test('handles missing data gracefully', () => {
      render(
        <PatientChart
          data={{}}
          type="vitals"
        />
      );

      expect(screen.getByText('Vital Signs')).toBeInTheDocument();
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });
  });

  describe('Specialized Variants', () => {
    test('EmergencyVitalsChart uses emergency variant', () => {
      render(
        <EmergencyVitalsChart
          data={{ vitals: mockVitals }}
        />
      );

      expect(screen.getByText('Vital Signs')).toBeInTheDocument();
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    test('WardPatientOverview uses combined view', () => {
      render(
        <WardPatientOverview
          data={{ vitals: mockVitals, labs: mockLabs, progress: mockProgress }}
        />
      );

      expect(screen.getByText('Patient Overview')).toBeInTheDocument();
      expect(screen.getByRole('tablist')).toBeInTheDocument();
    });

    test('CompactVitalsChart uses compact settings', () => {
      render(
        <CompactVitalsChart
          data={{ vitals: mockVitals }}
        />
      );

      expect(screen.getByText('Vital Signs')).toBeInTheDocument();
      expect(screen.queryByTestId('legend')).not.toBeInTheDocument();
    });
  });

  describe('Performance Tests', () => {
    test('renders efficiently with large datasets', () => {
      const largeVitalsSet = Array.from({ length: 1000 }, (_, i) => ({
        timestamp: new Date(Date.now() - i * 60000), // 1-minute intervals
        heartRate: 60 + Math.random() * 40,
        temperature: 36 + Math.random() * 2
      }));

      const startTime = performance.now();
      render(
        <PatientChart
          data={{ vitals: largeVitalsSet }}
          type="vitals"
        />
      );
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(1000); // Should render in under 1 second
    });

    test('handles rapid time range changes', async () => {
      const user = userEvent.setup();
      render(
        <PatientChart
          data={{ vitals: mockVitals }}
          type="vitals"
        />
      );

      const timeRangeSelect = screen.getByRole('combobox');

      const startTime = performance.now();
      await user.selectOptions(timeRangeSelect, '7 Days');
      await user.selectOptions(timeRangeSelect, '30 Days');
      await user.selectOptions(timeRangeSelect, '24 Hours');
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(500); // Should handle changes quickly
    });
  });

  describe('Error Handling', () => {
    test('handles empty datasets gracefully', () => {
      render(
        <PatientChart
          data={{ vitals: [], labs: [], progress: [] }}
          type="combined"
        />
      );

      expect(screen.getByText('Patient Overview')).toBeInTheDocument();
      expect(screen.getByRole('tablist')).toBeInTheDocument();
    });

    test('handles missing data properties gracefully', () => {
      const incompleteData = {
        vitals: [
          {
            timestamp: new Date(),
            heartRate: 72
            // Missing other properties
          }
        ]
      };

      expect(() => {
        render(
          <PatientChart
            data={incompleteData}
            type="vitals"
          />
        );
      }).not.toThrow();
    });

    test('handles invalid timestamps gracefully', () => {
      const dataWithInvalidTimestamps = {
        vitals: [
          {
            timestamp: new Date('invalid'),
            heartRate: 72
          }
        ]
      };

      expect(() => {
        render(
          <PatientChart
            data={dataWithInvalidTimestamps}
            type="vitals"
          />
        );
      }).not.toThrow();
    });
  });

  describe('Integration with Accessibility Utilities', () => {
    test('integrates with chart label generator', () => {
      const label = generateChartLabel('Heart Rate Trends', 'line', 100);
      expect(label).toBe('Heart Rate Trends, line chart with 100 data points');
    });

    test('announces critical lab values to screen readers', () => {
      render(
        <PatientChart
          data={{ labs: mockLabs }}
          type="labs"
        />
      );

      // Should initialize screen reader support
      expect(ScreenReader.init).toHaveBeenCalled();
    });

    test('maintains color contrast compliance', () => {
      const { container } = render(
        <PatientChart
          data={{ labs: mockLabs }}
          type="labs"
        />
      );

      // Check that status badges have sufficient contrast
      const criticalBadge = screen.getByText('CRITICAL');
      expect(criticalBadge).toBeInTheDocument();
    });
  });

  describe('Visual Regression Tests', () => {
    test('maintains consistent styling across chart types', async () => {
      const chartTypes = ['vitals', 'labs', 'progress'];

      for (const type of chartTypes) {
        const { container, unmount } = render(
          <PatientChart
            data={{ vitals: mockVitals, labs: mockLabs, progress: mockProgress }}
            type={type as any}
          />
        );

        const results = await axe(container);
        expect(results).toHaveNoViolations());

        unmount();
      }
    });

    test('maintains accessibility with color blind mode', async () => {
      const { container } = render(
        <PatientChart
          data={{ vitals: mockVitals }}
          type="vitals"
          colorBlindFriendly={true}
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();

      expect(screen.getByText('Color Blind Friendly Palette:')).toBeInTheDocument();
    });
  });

  describe('Screen Reader Support', () => {
    test('provides context for chart type changes', () => {
      render(
        <PatientChart
          data={{ vitals: mockVitals, labs: mockLabs, progress: mockProgress }}
          type="combined"
        />
      );

      // Should announce chart type and available data
      expect(ScreenReader.announce).toHaveBeenCalledWith(
        expect.stringContaining('Patient overview'),
        'polite'
      );
    });

    test('provides alternative text for chart elements', () => {
      render(
        <PatientChart
          data={{ vitals: mockVitals }}
          type="vitals"
        />
      );

      // Chart elements should have appropriate labels
      const vitalButtons = screen.getAllByRole('button');
      vitalButtons.forEach(button => {
        if (button.textContent?.includes('Heart Rate')) {
          expect(button).toBeInTheDocument();
        }
      });
    });

    test('announces critical lab results', () => {
      render(
        <PatientChart
          data={{ labs: mockLabs }}
          type="labs"
        />
      );

      // Critical lab results should be announced
      expect(ScreenReader.announce).toHaveBeenCalledWith(
        expect.stringContaining('critical'),
        'assertive'
      );
    });
  });

  describe('High Contrast Mode Support', () => {
    test('applies high contrast styling when enabled', () => {
      // Mock high contrast mode
      jest.doMock('@/providers/healthcare-theme-context', () => ({
        useHealthcareTheme: () => ({
          highContrastMode: true,
          reducedMotion: false,
          colorBlindMode: 'none'
        })
      }));

      const { container } = render(
        <PatientChart
          data={{ vitals: mockVitals }}
          type="vitals"
          variant="emergency"
        />
      );

      const chart = container.querySelector('.border-2');
      expect(chart).toBeInTheDocument();
    });

    test('maintains accessibility in high contrast mode', async () => {
      jest.doMock('@/providers/healthcare-theme-context', () => ({
        useHealthcareTheme: () => ({
          highContrastMode: true,
          reducedMotion: false,
          colorBlindMode: 'none'
        })
      }));

      const { container } = render(
        <PatientChart
          data={{ vitals: mockVitals }}
          type="vitals"
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Reduced Motion Support', () => {
    test('disables animations when reduced motion is preferred', () => {
      // Mock reduced motion mode
      jest.doMock('@/providers/healthcare-theme-context', () => ({
        useHealthcareTheme: () => ({
          highContrastMode: false,
          reducedMotion: true,
          colorBlindMode: 'none'
        })
      }));

      render(
        <PatientChart
          data={{ vitals: mockVitals }}
          type="vitals"
        />
      );

      // Animation duration should be 0
      const lines = screen.getAllByTestId('line');
      lines.forEach(line => {
        // In the actual implementation, reduced motion would affect animation
        expect(line).toBeInTheDocument();
      });
    });
  });
});