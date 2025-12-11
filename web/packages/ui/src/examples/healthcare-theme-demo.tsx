'use client';

import React from 'react';
import { ThemeProvider } from '@/providers/theme-provider';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/Button';
import { MedicalBadge } from '@/components/medical-badge';
import { VitalSignsCard, BasicVitalSignsCard } from '@/components/vital-signs-card';
import { PatientRegistrationForm, VitalSignsForm } from '@/components/medical-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';

export function HealthcareThemeDemo() {
  const handlePatientSubmit = (data: any) => {
    console.log('Patient registration data:', data);
    alert('Patient registration submitted!');
  };

  const handleVitalsSubmit = (data: any) => {
    console.log('Vitals data:', data);
    alert('Vital signs recorded!');
  };

  const handleVitalClick = (vital: any) => {
    console.log('Vital clicked:', vital);
  };

  const sampleVitals = [
    {
      label: 'Heart Rate',
      value: '85',
      unit: 'bpm',
      status: 'normal' as const,
      trend: 'stable' as const,
      range: { min: '60', max: '100' },
    },
    {
      label: 'Blood Pressure',
      value: '120/80',
      unit: 'mmHg',
      status: 'normal' as const,
      trend: 'down' as const,
      range: { min: '90/60', max: '120/80' },
    },
    {
      label: 'Temperature',
      value: '38.5',
      unit: '°C',
      status: 'warning' as const,
      trend: 'up' as const,
      range: { min: '36.5', max: '37.5' },
    },
    {
      label: 'Oxygen Saturation',
      value: '92',
      unit: '%',
      status: 'critical' as const,
      trend: 'down' as const,
      range: { min: '95', max: '100' },
    },
  ];

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background text-foreground p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Sepolia-Health UI Demo
              </h1>
              <p className="text-muted-foreground">
                Healthcare Professional Theme System with Enhanced Accessibility
              </p>
            </div>
            <ThemeToggle />
          </div>

          {/* Theme Variants Showcase */}
          <Card>
            <CardHeader>
              <CardTitle>Healthcare Button Variants</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button variant="medical">Medical Action</Button>
                <Button variant="emergency" pulse>Emergency</Button>
                <Button variant="success">Success</Button>
                <Button variant="warning">Warning</Button>
                <Button variant="clinical">Clinical</Button>
                <Button variant="diagnostic">Diagnostic</Button>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant="critical">Critical</Button>
                <Button variant="urgent">Urgent</Button>
                <Button variant="stable">Stable</Button>
                <Button variant="pending">Pending</Button>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button size="medical" variant="medical">Medical Size</Button>
                <Button size="vital" variant="success">Vital Size</Button>
                <Button size="compact" variant="outline">Compact</Button>
                <Button size="diagnostic" variant="clinical">Diagnostic</Button>
              </div>
            </CardContent>
          </Card>

          {/* Medical Badges */}
          <Card>
            <CardHeader>
              <CardTitle>Medical Status Badges</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Patient Status</h4>
                <div className="flex flex-wrap gap-2">
                  <MedicalBadge status="critical" />
                  <MedicalBadge status="serious" />
                  <MedicalBadge status="stable" />
                  <MedicalBadge status="recovering" />
                  <MedicalBadge status="discharged" />
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Appointment Status</h4>
                <div className="flex flex-wrap gap-2">
                  <MedicalBadge status="scheduled" />
                  <MedicalBadge status="confirmed" />
                  <MedicalBadge status="in-progress" />
                  <MedicalBadge status="completed" />
                  <MedicalBadge status="cancelled" />
                  <MedicalBadge status="no-show" />
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Medical Priority</h4>
                <div className="flex flex-wrap gap-2">
                  <MedicalBadge status="urgent" />
                  <MedicalBadge status="high" />
                  <MedicalBadge status="medium" />
                  <MedicalBadge status="low" />
                  <MedicalBadge status="routine" />
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Emergency Status</h4>
                <div className="flex flex-wrap gap-2">
                  <MedicalBadge status="emergency" />
                  <MedicalBadge status="code-blue" />
                  <MedicalBadge status="isolation" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vital Signs Cards */}
          <div className="grid md:grid-cols-2 gap-6">
            <BasicVitalSignsCard
              patientName="John Doe"
              patientId="P001"
              heartRate="85"
              bloodPressure="120/80"
              temperature="38.5"
              oxygenSaturation="92"
              lastUpdated="2 minutes ago"
              showAlerts={true}
              onRefresh={() => console.log('Refresh vitals')}
              onVitalClick={handleVitalClick}
            />

            <VitalSignsCard
              patientName="Jane Smith"
              patientId="P002"
              vitals={sampleVitals}
              lastUpdated="1 minute ago"
              showAlerts={true}
              compact={false}
              onRefresh={() => console.log('Refresh vitals')}
              onVitalClick={handleVitalClick}
            />
          </div>

          {/* Medical Forms */}
          <div className="grid md:grid-cols-2 gap-6">
            <PatientRegistrationForm
              onSubmit={handlePatientSubmit}
              autoSave={true}
              onAutoSave={(data) => console.log('Auto-saving:', data)}
            />

            <VitalSignsForm
              onSubmit={handleVitalsSubmit}
              autoSave={true}
              onAutoSave={(data) => console.log('Auto-saving vitals:', data)}
            />
          </div>

          {/* Accessibility Features */}
          <Card>
            <CardHeader>
              <CardTitle>Accessibility Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Medical Typography</h4>
                    <div className="space-y-2">
                      <div className="medical-data">Medical Data: 123.45 mg/dL</div>
                      <div className="vital-signs">Vital Signs: 85 BPM</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Healthcare Gradients</h4>
                    <div className="space-y-2">
                      <div className="medical-gradient p-3 rounded text-white text-sm">
                        Medical Gradient
                      </div>
                      <div className="vital-gradient-normal p-3 rounded text-white text-sm">
                        Normal Vital
                      </div>
                      <div className="vital-gradient-warning p-3 rounded text-white text-sm">
                        Warning Vital
                      </div>
                      <div className="vital-gradient-critical p-3 rounded text-white text-sm">
                        Critical Vital
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Accessibility Features</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li>High Contrast Mode support</li>
                    <li>Color Blind Friendly palettes</li>
                    <li>Screen Reader compatible</li>
                    <li>Keyboard Navigation optimized</li>
                    <li>Medical data uses tabular numbers for readability</li>
                    <li>Emergency indicators with pulse animations</li>
                    <li>Reduced Motion support</li>
                    <li>Large Text Mode support</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Theme Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>Theme Controls</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Use the theme toggle button in the top-right corner to:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Switch between Light, Dark, Clinical, and Emergency themes</li>
                <li>Enable High Contrast mode for accessibility</li>
                <li>Select Color Blind support (Protanopia, Deuteranopia, Tritanopia)</li>
                <li>Toggle Reduced Motion and Large Text display options</li>
                <li>Activate Emergency mode for critical situations</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </ThemeProvider>
  );
}

export default HealthcareThemeDemo;