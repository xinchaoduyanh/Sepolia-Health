# Sepolia-Health Design Guidelines

## Overview

This document outlines the design system, patterns, and guidelines for the Sepolia-Health clinic management system. The design system is built with healthcare professionals in mind, focusing on clarity, accessibility, and efficiency in medical environments.

## Design Principles

### 1. Clarity First
- Information hierarchy that supports quick scanning
- Clear visual indicators for status and priority
- Medical-grade typography with tabular numbers for data
- High contrast modes for critical information

### 2. Accessibility Always
- WCAG 2.1 AA compliance minimum
- Color-blind friendly alternatives
- Keyboard navigation support
- Screen reader optimization
- Emergency mode overrides

### 3. Healthcare Context
- Medical terminology consistency
- Time-critical information prominence
- Emergency workflow optimization
- Clinical environment considerations

### 4. Responsive & Adaptive
- Mobile-first approach
- Touch-friendly interactions
- Adaptive layouts for different screen sizes
- Device-specific optimizations

## Color System

### Primary Healthcare Colors

| Color | Usage | Hex |
|-------|-------|-----|
| Medical Blue | Primary actions, links | #0284c7 |
| Health Green | Success, stable status | #10b981 |
| Warning Amber | Warnings, observations | #f59e0b |
| Emergency Red | Critical, emergencies | #ef4444 |
| Clinical Purple | Secondary actions, diagnostics | #8b5cf6 |

### Status Colors

| Status | Color | Meaning |
|--------|-------|---------|
| Stable | Green | Normal vital signs, no issues |
| Observation | Yellow | Monitoring required |
| Critical | Red | Immediate attention needed |
| In Treatment | Blue | Currently being treated |
| Recovery | Purple | Recovery phase |
| Discharged | Gray | Process complete |

### Department Themes

The system supports department-specific themes:

- **Emergency Department**: High-energy red theme
- **Pediatrics**: Soft, friendly blue-green
- **Surgery**: Precise, sterile blue
- **Cardiology**: Deep red for heart focus
- **Radiology**: Cool purple for imaging
- **Laboratory**: Scientific teal
- **Pharmacy**: Medical green
- **Night Shift**: Reduced blue light theme

## Typography

### Font Stack
- **Primary**: Inter (system-ui fallback)
- **Monospace**: JetBrains Mono (for medical data)
- **Vietnamese Support**: All Google Fonts selected include Vietnamese characters

### Type Scale

| Element | Size | Weight | Usage |
|---------|------|--------|-------|
| H1 | 2.25rem | Bold | Page headers |
| H2 | 1.875rem | Semibold | Section headers |
| H3 | 1.5rem | Medium | Card titles |
| Body | 1rem | Regular | Content |
| Small | 0.875rem | Regular | Secondary info |
| XSmall | 0.75rem | Regular | Labels, metadata |

### Medical Data Typography
- Tabular numbers for aligned data
- Slightly increased letter spacing (0.01em)
- Medium weight for vital signs
- Monospace for medical record numbers

## Component Patterns

### 1. Patient Status Cards

**Purpose**: Display comprehensive patient information at a glance

**Key Elements**:
- Patient photo and basic information
- Status indicator with color coding
- Critical alerts section
- Quick action buttons
- Department/room information
- Real-time update indicators

**Variants**:
- `default`: Standard view with all information
- `compact`: Minimal view for dashboards
- `critical`: Enhanced view for critical patients
- `emergency`: High-contrast emergency mode

```tsx
<PatientStatusCard
  patient={patientInfo}
  status={patientStatus}
  alerts={activeAlerts}
  actions={quickActions}
  realTime={true}
/>
```

### 2. Medication Schedule

**Purpose**: Track and manage patient medications effectively

**Key Elements**:
- Time-based schedule display
- Administration status tracking
- Drug interaction warnings
- Multiple view modes (timeline, list, grid)
- Color-blind friendly patterns

**Features**:
- Real-time status updates
- Interaction checking
- Administration recording
- Missed dose tracking
- Color pattern alternatives for accessibility

```tsx
<MedicationSchedule
  medications={patientMeds}
  schedule={todaySchedule}
  interactions={drugInteractions}
  view="timeline"
  colorBlindFriendly={true}
/>
```

### 3. Patient Charts

**Purpose**: Visualize medical data and trends

**Chart Types**:
- Vital signs trends (line charts)
- Laboratory results (bar charts)
- Progress tracking (area charts)
- Combined views for comprehensive overview

**Features**:
- Multiple time ranges
- Reference ranges display
- Annotations and events
- Export capabilities
- Real-time data updates
- Color-blind friendly palettes

```tsx
<PatientChart
  data={patientData}
  type="vitals"
  timeRange={selectedRange}
  showAnnotations={true}
  exportOptions={formats}
/>
```

### 4. Clinical Workflow

**Purpose**: Optimize clinical task and patient management

**Views**:
- Kanban board for task management
- Timeline view for scheduling
- Workload view for staff management
- Board view for comprehensive overview

**Features**:
- Drag-and-drop task management
- Priority-based organization
- Emergency protocol integration
- Handoff tracking
- Staff workload balancing

```tsx
<ClinicalWorkflow
  tasks={activeTasks}
  patients={currentPatients}
  view="kanban"
  emergencyMode={isEmergency}
/>
```

## Layout Patterns

### Dashboard Layout
```tsx
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  {/* Main content */}
  <div className="lg:col-span-2 space-y-6">
    <PatientStatusCard />
    <PatientChart />
  </div>

  {/* Sidebar */}
  <div className="space-y-6">
    <MedicationSchedule />
    <TaskQueue />
  </div>
</div>
```

### Patient Detail Layout
```tsx
<div className="space-y-6">
  {/* Patient header */}
  <PatientStatusCard variant="detailed" />

  {/* Tabs for different views */}
  <Tabs>
    <TabsList>
      <TabsTrigger>Overview</TabsTrigger>
      <TabsTrigger>Vitals</TabsTrigger>
      <TabsTrigger>Medications</TabsTrigger>
      <TabsTrigger>Notes</TabsTrigger>
    </TabsList>

    <TabsContent value="overview">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PatientChart type="vitals" />
        <PatientChart type="progress" />
      </div>
    </TabsContent>
  </Tabs>
</div>
```

## Accessibility Guidelines

### Color Vision Deficiency
- Use patterns and textures in addition to colors
- Provide high contrast alternatives
- Support for:
  - Protanopia (red-blind)
  - Deuteranopia (green-blind)
  - Tritanopia (blue-blind)

### Emergency Mode
- High contrast overrides
- Larger touch targets
- Simplified interfaces
- Critical information prominence
- Audio alert support

### Keyboard Navigation
- Tab order follows logical flow
- Focus indicators clearly visible
- Skip links for main navigation
- Modal focus trapping

### Screen Reader Support
- Semantic HTML structure
- ARIA labels and descriptions
- Live regions for dynamic content
- Heading hierarchy maintained

## Icon Usage

### Healthcare Icons
- Use Lucide React for consistency
- Maintain medical meaning
- Include text labels for clarity

### Common Patterns
- **Patient**: User icon
- **Doctor/Medical Staff**: Stethoscope icon
- **Emergency**: Alert triangle
- **Vital Signs**: Heart, thermometer, activity
- **Medication**: Pill/prescription icon
- **Lab/Test**: Vial or microscope
- **Schedule**: Calendar icon
- **Notes**: Document icon

## Animation Guidelines

### Principles
- Support reduced motion preferences
- Use purposeful animations
- Avoid distracting movements
- Maintain medical professionalism

### Allowed Animations
- Pulse for critical alerts
- Smooth transitions for state changes
- Loading indicators
- Progress animations

### Disabled in:
- Emergency mode (unless critical)
- Reduced motion preference
- High contrast mode

## Responsive Design

### Breakpoints
- Mobile: 320px - 767px
- Tablet: 768px - 1023px
- Desktop: 1024px+

### Mobile Adaptations
- Stack layouts vertically
- Larger touch targets (44px minimum)
- Simplified navigation
- Collapsible sections

### Tablet Adaptations
- Two-column layouts
- Touch-optimized interactions
- Side-by-side comparisons
- Swipe gestures where appropriate

### Desktop Features
- Multi-column layouts
- Hover states
- Keyboard shortcuts
- Complex interactions

## Healthcare-Specific Patterns

### Time Display
- 24-hour format for medical contexts
- Relative time for recent events ("2 hours ago")
- Absolute time for scheduled events ("14:30")
- Timezone awareness for multi-location systems

### Medical Data Display
- Tabular numbers for alignment
- Consistent units of measurement
- Reference ranges clearly marked
- Abnormal values highlighted

### Alert Hierarchy
1. **Critical**: Life-threatening, immediate action required
2. **Urgent**: Serious, prompt attention needed
3. **Warning**: Monitor closely, may need attention
4. **Info**: For awareness, no action needed

### Workflow Optimization
- Minimize clicks for common tasks
- Batch related actions
- Contextual menus
- Keyboard shortcuts for power users
- Undo for destructive actions

## Error Handling

### Display Patterns
- Clear error messages
- Suggested actions
- Contact information for support
- Non-blocking when possible

### Validation
- Real-time when possible
- Clear error indicators
- Grouped validation messages
- Prevention over correction

## Performance Considerations

### Optimizations
- Virtual scrolling for long lists
- Lazy loading for images
- Debounced real-time updates
- Efficient re-renders

### Critical Path
- Above-the-fold content first
- Progressive enhancement
- Graceful degradation
- Offline considerations

## Component Library Structure

```
web/packages/ui/src/components/
├── healthcare/
│   ├── patient-status-card.tsx
│   ├── medication-schedule.tsx
│   ├── patient-chart.tsx
│   ├── clinical-workflow.tsx
│   └── index.ts
├── forms/
│   ├── medical-form.tsx
│   └── vital-inputs.tsx
├── display/
│   ├── medical-badge.tsx
│   ├── vital-signs-card.tsx
│   └── status-indicator.tsx
└── providers/
    ├── healthcare-theme-context.tsx
    └── theme-provider.tsx
```

## Usage Examples

### Emergency Dashboard
```tsx
<EmergencyWorkflow
  tasks={emergencyTasks}
  patients={criticalPatients}
  emergencyProtocols={activeProtocols}
  realTimeUpdates={true}
/>
```

### Patient Monitoring Station
```tsx
<div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
  <PatientStatusCard
    patient={patient}
    status={currentStatus}
    variant="critical"
    realTime
    showAlerts
    showVitals
  />

  <PatientChart
    data={vitalsData}
    type="vitals"
    timeRange={{ start: lastHour, end: now }}
    height={300}
    interactive
  />
</div>
```

### Medication Administration
```tsx
<MedicationSchedule
  medications={scheduledMeds}
  schedule={timeSlots}
  view="timeline"
  colorBlindFriendly
  onAdminister={handleAdminister}
  onMiss={handleMissedDose}
/>
```

## Testing Guidelines

### Accessibility Testing
- Screen reader testing (NVDA, VoiceOver)
- Keyboard-only navigation
- Color contrast verification
- Voice control compatibility

### Healthcare Context Testing
- Medical terminology accuracy
- Emergency scenario testing
- Time-critical workflows
- Multi-user collaboration

### Performance Testing
- Large data sets handling
- Real-time update performance
- Mobile device optimization
- Network condition testing

## Maintenance

### Regular Reviews
- Quarterly accessibility audit
- Annual design system review
- User feedback collection
- Healthcare guideline updates

### Version Management
- Semantic versioning
- Breaking change documentation
- Migration guides
- Backward compatibility

This design system is a living document that evolves with the needs of healthcare professionals and patient care requirements.