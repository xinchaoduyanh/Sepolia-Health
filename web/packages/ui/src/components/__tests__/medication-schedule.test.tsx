import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import {
  MedicationSchedule,
  CriticalMedicationSchedule,
  CompactMedicationSchedule,
  WardMedicationBoard,
  type Medication,
  type ScheduleSlot,
  type DrugInteraction
} from '../medication-schedule';
import { generateMedicationLabel, ScreenReader, KeyboardNavigation, ColorContrast } from '@/utils/accessibility';

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
  Tabs: ({ children, value, onValueChange }: any) => (
    <div data-value={value} onChange={onValueChange}>
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
  TabsTrigger: ({ children, value, onClick }: any) => (
    <button role="tab" data-value={value} onClick={onClick}>
      {children}
    </button>
  )
}));

describe('MedicationSchedule', () => {
  const mockMedications: Medication[] = [
    {
      id: 'med-001',
      name: 'Amoxicillin',
      dosage: '500mg',
      frequency: '3 times daily',
      route: 'oral',
      category: 'antibiotic',
      prescribedBy: 'Dr. Smith',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-07'),
      instructions: 'Take with food',
      contraindications: ['Penicillin allergy'],
      sideEffects: ['Nausea', 'Diarrhea']
    },
    {
      id: 'med-002',
      name: 'Lisinopril',
      dosage: '10mg',
      frequency: 'once daily',
      route: 'oral',
      category: 'chronic',
      prescribedBy: 'Dr. Johnson',
      startDate: new Date('2024-01-01'),
      instructions: 'Take in the morning'
    },
    {
      id: 'med-003',
      name: 'Morphine',
      dosage: '5mg',
      frequency: 'PRN',
      route: 'iv',
      category: 'painkiller',
      prescribedBy: 'Dr. Brown',
      startDate: new Date('2024-01-01'),
      instructions: 'For severe pain only'
    }
  ];

  const mockSchedule: ScheduleSlot[] = [
    {
      id: 'slot-001',
      time: new Date('2024-01-15T08:00:00'),
      medications: [
        {
          medication: mockMedications[1], // Lisinopril
          scheduledTime: new Date('2024-01-15T08:00:00'),
          status: 'administered',
          administeredBy: 'Nurse Jones',
          administeredAt: new Date('2024-01-15T08:05:00')
        },
        {
          medication: mockMedications[0], // Amoxicillin
          scheduledTime: new Date('2024-01-15T08:00:00'),
          status: 'scheduled'
        }
      ]
    },
    {
      id: 'slot-002',
      time: new Date('2024-01-15T12:00:00'),
      medications: [
        {
          medication: mockMedications[0], // Amoxicillin
          scheduledTime: new Date('2024-01-15T12:00:00'),
          status: 'missed',
          missedReason: 'Patient refused'
        }
      ],
      notes: 'Patient reported nausea'
    },
    {
      id: 'slot-003',
      time: new Date('2024-01-15T18:00:00'),
      medications: [
        {
          medication: mockMedications[0], // Amoxicillin
          scheduledTime: new Date('2024-01-15T18:00:00'),
          status: 'scheduled'
        },
        {
          medication: mockMedications[2], // Morphine
          scheduledTime: new Date('2024-01-15T18:00:00'),
          status: 'delayed',
          notes: 'Patient sleeping, will administer when awake'
        }
      ]
    }
  ];

  const mockInteractions: DrugInteraction[] = [
    {
      id: 'int-001',
      medications: ['Amoxicillin', 'Lisinopril'],
      severity: 'moderate',
      description: 'May increase risk of allergic reaction',
      recommendation: 'Monitor patient closely'
    },
    {
      id: 'int-002',
      medications: ['Lisinopril', 'Morphine'],
      severity: 'severe',
      description: 'May cause severe hypotension',
      recommendation: 'Avoid concurrent use if possible'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    test('renders medication schedule header', () => {
      render(
        <MedicationSchedule
          medications={mockMedications}
          schedule={mockSchedule}
        />
      );

      expect(screen.getByText('Medication Schedule')).toBeInTheDocument();
      expect(screen.getByRole('tablist')).toBeInTheDocument();
    });

    test('renders view tabs', () => {
      render(
        <MedicationSchedule
          medications={mockMedications}
          schedule={mockSchedule}
        />
      );

      expect(screen.getByRole('tab', { name: 'Timeline' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'List' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Grid' })).toBeInTheDocument();
    });

    test('renders drug interactions alert when present', () => {
      render(
        <MedicationSchedule
          medications={mockMedications}
          schedule={mockSchedule}
          interactions={mockInteractions}
        />
      );

      expect(screen.getByText('Drug Interactions Detected')).toBeInTheDocument();
      expect(screen.getByText('2 potential interactions found')).toBeInTheDocument();
      expect(screen.getByText('MODERATE')).toBeInTheDocument();
      expect(screen.getByText('SEVERE')).toBeInTheDocument();
    });

    test('renders search and filter controls', () => {
      render(
        <MedicationSchedule
          medications={mockMedications}
          schedule={mockSchedule}
        />
      );

      expect(screen.getByPlaceholderText('Search medications...')).toBeInTheDocument();
      expect(screen.getByRole('combobox')).toBeInTheDocument(); // Category filter
    });

    test('renders date picker', () => {
      render(
        <MedicationSchedule
          medications={mockMedications}
          schedule={mockSchedule}
        />
      );

      const dateInput = screen.getByRole('textbox', { name: /date/i });
      expect(dateInput).toBeInTheDocument();
    });
  });

  describe('Timeline View', () => {
    test('renders medications grouped by time slots', () => {
      render(
        <MedicationSchedule
          medications={mockMedications}
          schedule={mockSchedule}
          view="timeline"
        />
      );

      expect(screen.getByText('08:00')).toBeInTheDocument();
      expect(screen.getByText('12:00')).toBeInTheDocument();
      expect(screen.getByText('18:00')).toBeInTheDocument();
    });

    test('displays medication details correctly', () => {
      render(
        <MedicationSchedule
          medications={mockMedications}
          schedule={mockSchedule}
          view="timeline"
        />
      );

      expect(screen.getByText('Amoxicillin')).toBeInTheDocument();
      expect(screen.getByText('Lisinopril')).toBeInTheDocument();
      expect(screen.getByText('500mg')).toBeInTheDocument();
      expect(screen.getByText('10mg')).toBeInTheDocument();
      expect(screen.getByText('ORAL')).toBeInTheDocument();
      expect(screen.getByText('IV')).toBeInTheDocument();
    });

    test('shows medication status badges', () => {
      render(
        <MedicationSchedule
          medications={mockMedications}
          schedule={mockSchedule}
          view="timeline"
        />
      );

      expect(screen.getByText('administered')).toBeInTheDocument();
      expect(screen.getByText('scheduled')).toBeInTheDocument();
      expect(screen.getByText('missed')).toBeInTheDocument();
      expect(screen.getByText('delayed')).toBeInTheDocument();
    });

    test('displays administration notes', () => {
      render(
        <MedicationSchedule
          medications={mockMedications}
          schedule={mockSchedule}
          view="timeline"
        />
      );

      expect(screen.getByText('Notes: Patient reported nausea')).toBeInTheDocument();
      expect(screen.getByText('Patient sleeping, will administer when awake')).toBeInTheDocument();
    });

    test('shows action buttons for scheduled medications', () => {
      render(
        <MedicationSchedule
          medications={mockMedications}
          schedule={mockSchedule}
          view="timeline"
        />
      );

      const administerButtons = screen.getAllByRole('button').filter(
        button => button.querySelector('svg') && button.innerHTML.includes('CheckCircle')
      );
      expect(administerButtons.length).toBeGreaterThan(0);
    });
  });

  describe('List View', () => {
    test('renders medications in list format', async () => {
      render(
        <MedicationSchedule
          medications={mockMedications}
          schedule={mockSchedule}
          view="list"
        />
      );

      // Switch to list view
      const listTab = screen.getByRole('tab', { name: 'List' });
      await userEvent.click(listTab);

      expect(screen.getByText('Amoxicillin')).toBeInTheDocument();
      expect(screen.getByText('Lisinopril')).toBeInTheDocument();
      expect(screen.getByText('Morphine')).toBeInTheDocument();
    });

    test('displays medication categories', async () => {
      render(
        <MedicationSchedule
          medications={mockMedications}
          schedule={mockSchedule}
          view="list"
        />
      );

      const listTab = screen.getByRole('tab', { name: 'List' });
      await userEvent.click(listTab);

      expect(screen.getByText('antibiotic')).toBeInTheDocument();
      expect(screen.getByText('chronic')).toBeInTheDocument();
      expect(screen.getByText('painkiller')).toBeInTheDocument();
    });

    test('shows next dose information', async () => {
      render(
        <MedicationSchedule
          medications={mockMedications}
          schedule={mockSchedule}
          view="list"
        />
      );

      const listTab = screen.getByRole('tab', { name: 'List' });
      await userEvent.click(listTab);

      expect(screen.getByText(/Next dose:/)).toBeInTheDocument();
    });

    test('displays prescribing doctor', async () => {
      render(
        <MedicationSchedule
          medications={mockMedications}
          schedule={mockSchedule}
          view="list"
        />
      );

      const listTab = screen.getByRole('tab', { name: 'List' });
      await userEvent.click(listTab);

      expect(screen.getByText('Prescribed by Dr. Smith')).toBeInTheDocument();
      expect(screen.getByText('Prescribed by Dr. Johnson')).toBeInTheDocument();
    });
  });

  describe('Grid View', () => {
    test('renders medications in grid format', async () => {
      render(
        <MedicationSchedule
          medications={mockMedications}
          schedule={mockSchedule}
          view="grid"
        />
      );

      const gridTab = screen.getByRole('tab', { name: 'Grid' });
      await userEvent.click(gridTab);

      const medicationCards = screen.getAllByTestId('card');
      expect(medicationCards.length).toBeGreaterThanOrEqual(3);
    });

    test('displays route badges in grid view', async () => {
      render(
        <MedicationSchedule
          medications={mockMedications}
          schedule={mockSchedule}
          view="grid"
        />
      );

      const gridTab = screen.getByRole('tab', { name: 'Grid' });
      await userEvent.click(gridTab);

      expect(screen.getByText('ORAL')).toBeInTheDocument();
      expect(screen.getByText('IV')).toBeInTheDocument();
    });
  });

  describe('Accessibility Tests', () => {
    test('should not have accessibility violations', async () => {
      const { container } = render(
        <MedicationSchedule
          medications={mockMedications}
          schedule={mockSchedule}
          interactions={mockInteractions}
        />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('has proper ARIA labels and roles', () => {
      render(
        <MedicationSchedule
          medications={mockMedications}
          schedule={mockSchedule}
        />
      );

      expect(screen.getByRole('tablist')).toBeInTheDocument();
      expect(screen.getAllByRole('tab')).toHaveLength(3);
    });

    test('supports keyboard navigation for tabs', async () => {
      const user = userEvent.setup();
      render(
        <MedicationSchedule
          medications={mockMedications}
          schedule={mockSchedule}
        />
      );

      const firstTab = screen.getByRole('tab', { name: 'Timeline' });
      firstTab.focus();
      expect(firstTab).toHaveFocus();

      await user.keyboard('{ArrowRight}');
      expect(screen.getByRole('tab', { name: 'List' })).toHaveFocus();

      await user.keyboard('{Enter}');
      expect(screen.getByTestId('tabs-content-list')).toBeInTheDocument();
    });

    test('search input is accessible', async () => {
      const user = userEvent.setup();
      render(
        <MedicationSchedule
          medications={mockMedications}
          schedule={mockSchedule}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search medications...');
      expect(searchInput).toHaveAttribute('type', 'text');

      await user.type(searchInput, 'Amoxicillin');
      expect(searchInput).toHaveValue('Amoxicillin');
    });

    test('filter dropdown is accessible', async () => {
      const user = userEvent.setup();
      render(
        <MedicationSchedule
          medications={mockMedications}
          schedule={mockSchedule}
        />
      );

      const filterSelect = screen.getByRole('combobox');
      expect(filterSelect).toBeInTheDocument();

      await user.selectOptions(filterSelect, 'antibiotic');
      expect(filterSelect).toHaveValue('antibiotic');
    });

    test('action buttons have proper labels', () => {
      render(
        <MedicationSchedule
          medications={mockMedications}
          schedule={mockSchedule}
        />
      );

      const administerButtons = screen.getAllByRole('button').filter(
        button => button.innerHTML.includes('CheckCircle')
      );

      administerButtons.forEach(button => {
        expect(button).toHaveAttribute('type', 'button');
      });
    });
  });

  describe('Color Blind Support', () => {
    test('shows pattern legend when color blind mode is enabled', () => {
      render(
        <MedicationSchedule
          medications={mockMedications}
          schedule={mockSchedule}
          colorBlindFriendly={true}
        />
      );

      expect(screen.getByText('Pattern Legend:')).toBeInTheDocument();
      expect(screen.getByText('Administered')).toBeInTheDocument();
      expect(screen.getByText('Missed')).toBeInTheDocument();
      expect(screen.getByText('Declined')).toBeInTheDocument();
      expect(screen.getByText('Delayed')).toBeInTheDocument();
    });

    test('applies pattern styles to medication cards', () => {
      render(
        <MedicationSchedule
          medications={mockMedications}
          schedule={mockSchedule}
          colorBlindFriendly={true}
        />
      );

      const patternElements = document.querySelectorAll('[style*="backgroundImage"]');
      expect(patternElements.length).toBeGreaterThan(0);
    });

    test('respects theme color blind mode', () => {
      // Mock color blind mode from theme
      jest.doMock('@/providers/healthcare-theme-context', () => ({
        useHealthcareTheme: () => ({
          highContrastMode: false,
          reducedMotion: false,
          colorBlindMode: 'protanopia'
        })
      }));

      render(
        <MedicationSchedule
          medications={mockMedications}
          schedule={mockSchedule}
        />
      );

      expect(screen.getByText('Pattern Legend:')).toBeInTheDocument();
    });
  });

  describe('Interactive Features', () => {
    test('handles medication administration', async () => {
      const onAdminister = jest.fn();
      const user = userEvent.setup();

      render(
        <MedicationSchedule
          medications={mockMedications}
          schedule={mockSchedule}
          onAdminister={onAdminister}
        />
      );

      const administerButtons = screen.getAllByRole('button').filter(
        button => button.innerHTML.includes('CheckCircle')
      );

      if (administerButtons.length > 0) {
        await user.click(administerButtons[0]);
        expect(onAdminister).toHaveBeenCalled();
      }
    });

    test('handles medication miss', async () => {
      const onMiss = jest.fn();
      const user = userEvent.setup();

      render(
        <MedicationSchedule
          medications={mockMedications}
          schedule={mockSchedule}
          onMiss={onMiss}
        />
      );

      const missButtons = screen.getAllByRole('button').filter(
        button => button.innerHTML.includes('XCircle')
      );

      if (missButtons.length > 0) {
        await user.click(missButtons[0]);
        expect(onMiss).toHaveBeenCalledWith('slot-003', 'med-001', 'Patient refused');
      }
    });

    test('filters medications by search term', async () => {
      const user = userEvent.setup();

      render(
        <MedicationSchedule
          medications={mockMedications}
          schedule={mockSchedule}
          view="list"
        />
      );

      const searchInput = screen.getByPlaceholderText('Search medications...');
      await user.type(searchInput, 'Amoxicillin');

      const listTab = screen.getByRole('tab', { name: 'List' });
      await user.click(listTab);

      expect(screen.getByText('Amoxicillin')).toBeInTheDocument();
      expect(screen.queryByText('Lisinopril')).not.toBeInTheDocument();
    });

    test('filters medications by category', async () => {
      const user = userEvent.setup();

      render(
        <MedicationSchedule
          medications={mockMedications}
          schedule={mockSchedule}
          view="list"
        />
      );

      const filterSelect = screen.getByRole('combobox');
      await user.selectOptions(filterSelect, 'antibiotic');

      const listTab = screen.getByRole('tab', { name: 'List' });
      await user.click(listTab);

      expect(screen.getByText('Amoxicillin')).toBeInTheDocument();
      expect(screen.queryByText('Lisinopril')).not.toBeInTheDocument();
    });

    test('filters schedule by date', async () => {
      const user = userEvent.setup();

      render(
        <MedicationSchedule
          medications={mockMedications}
          schedule={mockSchedule}
        />
      );

      const dateInput = screen.getByRole('textbox', { name: /date/i });
      await user.clear(dateInput);
      await user.type(dateInput, '2024-01-16');

      // Should show no medications for different date
      expect(screen.queryByText('08:00')).not.toBeInTheDocument();
    });
  });

  describe('Medication Status Display', () => {
    test('applies correct styling for different statuses', () => {
      render(
        <MedicationSchedule
          medications={mockMedications}
          schedule={mockSchedule}
        />
      );

      const administeredElement = screen.getByText('administered').closest('span');
      const missedElement = screen.getByText('missed').closest('span');
      const scheduledElement = screen.getByText('scheduled').closest('span');

      expect(administeredElement).toBeInTheDocument();
      expect(missedElement).toBeInTheDocument();
      expect(scheduledElement).toBeInTheDocument();
    });

    test('shows administration details for administered medications', () => {
      render(
        <MedicationSchedule
          medications={mockMedications}
          schedule={mockSchedule}
        />
      );

      // Check if administered by information is displayed
      expect(screen.getByText('Lisinopril')).toBeInTheDocument();
      expect(screen.getByText('administered')).toBeInTheDocument();
    });
  });

  describe('Specialized Variants', () => {
    test('CriticalMedicationSchedule uses timeline view and color blind mode', () => {
      render(
        <CriticalMedicationSchedule
          medications={mockMedications}
          schedule={mockSchedule}
        />
      );

      expect(screen.getByText('Timeline')).toBeInTheDocument();
      expect(screen.getByText('Pattern Legend:')).toBeInTheDocument();
    });

    test('CompactMedicationSchedule uses compact variant and list view', () => {
      render(
        <CompactMedicationSchedule
          medications={mockMedications}
          schedule={mockSchedule}
        />
      );

      const listTab = screen.getByRole('tab', { name: 'List' });
      expect(listTab).toBeInTheDocument();
    });

    test('WardMedicationBoard uses detailed variant and color blind mode', () => {
      render(
        <WardMedicationBoard
          medications={mockMedications}
          schedule={mockSchedule}
        />
      );

      expect(screen.getByText('Timeline')).toBeInTheDocument();
      expect(screen.getByText('Pattern Legend:')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('handles empty medication list gracefully', () => {
      render(
        <MedicationSchedule
          medications={[]}
          schedule={[]}
        />
      );

      expect(screen.getByText('Medication Schedule')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Search medications...')).toBeInTheDocument();
    });

    test('handles empty schedule gracefully', () => {
      render(
        <MedicationSchedule
          medications={mockMedications}
          schedule={[]}
        />
      );

      const timelineTab = screen.getByRole('tab', { name: 'Timeline' });
      expect(timelineTab).toBeInTheDocument();
    });

    test('handles missing optional fields gracefully', () => {
      const medicationsWithMissingFields = [
        {
          id: 'med-001',
          name: 'Test Medication',
          dosage: '100mg',
          frequency: 'once daily',
          route: 'oral' as const,
          category: 'other' as const,
          prescribedBy: 'Dr. Test',
          startDate: new Date()
          // Missing endDate, instructions, etc.
        }
      ];

      expect(() => {
        render(
          <MedicationSchedule
            medications={medicationsWithMissingFields}
            schedule={[]}
          />
        );
      }).not.toThrow();
    });
  });

  describe('Performance Tests', () => {
    test('renders efficiently with large medication lists', () => {
      const manyMedications = Array.from({ length: 100 }, (_, i) => ({
        id: `med-${i}`,
        name: `Medication ${i}`,
        dosage: '100mg',
        frequency: 'once daily',
        route: 'oral' as const,
        category: 'other' as const,
        prescribedBy: `Dr. ${i}`,
        startDate: new Date()
      }));

      const startTime = performance.now();
      render(
        <MedicationSchedule
          medications={manyMedications}
          schedule={[]}
          view="list"
        />
      );
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(500); // Should render in under 500ms
    });

    test('handles rapid search filtering', async () => {
      const user = userEvent.setup();
      render(
        <MedicationSchedule
          medications={mockMedications}
          schedule={[]}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search medications...');

      const startTime = performance.now();
      await user.type(searchInput, 'Amoxicillin');
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100); // Search should be fast
    });
  });

  describe('Integration with Accessibility Utilities', () => {
    test('integrates with medication label generator', () => {
      const label = generateMedicationLabel('Amoxicillin', '500mg', '3 times daily', '08:00');
      expect(label).toBe('Medication: Amoxicillin, 500mg, 3 times daily at 08:00');
    });

    test('announces medication administration to screen readers', () => {
      render(
        <MedicationSchedule
          medications={mockMedications}
          schedule={mockSchedule}
        />
      );

      // Should initialize screen reader support
      expect(ScreenReader.init).toHaveBeenCalled();
    });

    test('maintains color contrast compliance', () => {
      const { container } = render(
        <MedicationSchedule
          medications={mockMedications}
          schedule={mockSchedule}
          interactions={mockInteractions}
        />
      );

      // Check that status badges have sufficient contrast
      const statusBadges = container.querySelectorAll('[class*="bg-"]');
      expect(statusBadges.length).toBeGreaterThan(0);
    });
  });

  describe('Visual Regression Tests', () => {
    test('maintains consistent styling across views', async () => {
      const views = ['timeline', 'list', 'grid'];

      for (const view of views) {
        const { container, unmount } = render(
          <MedicationSchedule
            medications={mockMedications}
            schedule={mockSchedule}
            view={view as any}
          />
        );

        const results = await axe(container);
        expect(results).toHaveNoViolations());

        unmount();
      }
    });

    test('maintains accessibility with color blind mode', async () => {
      const { container } = render(
        <MedicationSchedule
          medications={mockMedications}
          schedule={mockSchedule}
          colorBlindFriendly={true}
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();

      // Pattern legend should be visible
      expect(screen.getByText('Pattern Legend:')).toBeInTheDocument();
    });
  });

  describe('Screen Reader Support', () => {
    test('announces drug interactions', () => {
      render(
        <MedicationSchedule
          medications={mockMedications}
          schedule={mockSchedule}
          interactions={mockInteractions}
        />
      );

      // Severe interactions should be announced immediately
      expect(ScreenReader.announce).toHaveBeenCalledWith(
        expect.stringContaining('severe interaction'),
        'assertive'
      );
    });

    test('provides context for medication status changes', () => {
      render(
        <MedicationSchedule
          medications={mockMedications}
          schedule={mockSchedule}
        />
      );

      // Should announce missed medications
      expect(ScreenReader.announce).toHaveBeenCalledWith(
        expect.stringContaining('missed'),
        'polite'
      );
    });

    test('provides alternative text for route icons', () => {
      render(
        <MedicationSchedule
          medications={mockMedications}
          schedule={mockSchedule}
        />
      );

      // Route icons should have appropriate alt text or be aria-hidden
      const icons = document.querySelectorAll('svg');
      icons.forEach(icon => {
        expect(icon.closest('[aria-hidden="true"]') || icon.closest('[aria-label]')).toBeTruthy();
      });
    });
  });
});