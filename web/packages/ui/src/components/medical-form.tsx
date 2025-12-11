'use client';

import React from 'react';
import { Field } from './Field';
import { MedicalBadge } from './medical-badge';
import { Button } from './Button';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MedicalFormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'date' | 'textarea' | 'email' | 'tel' | 'password';
  required?: boolean;
  options?: { value: string; label: string }[];
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    custom?: string;
  };
  placeholder?: string;
  description?: string;
  defaultValue?: string | number;
  medicalType?: 'vital' | 'diagnostic' | 'medication' | 'allergy' | 'symptom' | 'general';
}

export interface MedicalFormSection {
  title: string;
  description?: string;
  fields: MedicalFormField[];
  badge?: {
    status: 'emergency' | 'critical' | 'warning' | 'normal';
    label?: string;
  };
}

interface MedicalFormProps {
  sections: MedicalFormSection[];
  onSubmit: (data: any) => void;
  className?: string;
  title?: string;
  subtitle?: string;
  emergency?: boolean;
  autoSave?: boolean;
  onAutoSave?: (data: any) => void;
  submitButtonText?: string;
  cancelButtonText?: string;
  showCancelButton?: boolean;
  disabled?: boolean;
}

export function MedicalForm({
  sections,
  onSubmit,
  className,
  title,
  subtitle,
  emergency = false,
  autoSave = false,
  onAutoSave,
  submitButtonText = emergency ? 'Emergency Submit' : 'Submit',
  cancelButtonText = 'Cancel',
  showCancelButton = true,
  disabled = false,
}: MedicalFormProps) {
  const [formData, setFormData] = React.useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  // Initialize form data with default values
  React.useEffect(() => {
    const initialData: Record<string, any> = {};
    sections.forEach(section => {
      section.fields.forEach(field => {
        if (field.defaultValue !== undefined) {
          initialData[field.name] = field.defaultValue;
        }
      });
    });
    setFormData(initialData);
  }, [sections]);

  // Auto-save functionality
  React.useEffect(() => {
    if (autoSave && onAutoSave && Object.keys(formData).length > 0) {
      const timer = setTimeout(() => {
        onAutoSave(formData);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [formData, autoSave, onAutoSave]);

  const handleFieldChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateField = (field: MedicalFormField, value: any): string => {
    if (field.required && (!value || value.toString().trim() === '')) {
      return `${field.label} is required`;
    }

    if (!value) return '';

    const stringValue = value.toString();

    if (field.validation) {
      const { pattern, min, max, minLength, maxLength, custom } = field.validation;

      if (min && parseFloat(stringValue) < min) {
        return `${field.label} must be at least ${min}`;
      }

      if (max && parseFloat(stringValue) > max) {
        return `${field.label} must be no more than ${max}`;
      }

      if (minLength && stringValue.length < minLength) {
        return `${field.label} must be at least ${minLength} characters`;
      }

      if (maxLength && stringValue.length > maxLength) {
        return `${field.label} must be no more than ${maxLength} characters`;
      }

      if (pattern && !new RegExp(pattern).test(stringValue)) {
        return `${field.label} format is invalid`;
      }

      if (custom && !new RegExp(custom).test(stringValue)) {
        return `${field.label} is not valid`;
      }
    }

    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validate all fields
    const newErrors: Record<string, string> = {};
    let isValid = true;

    sections.forEach(section => {
      section.fields.forEach(field => {
        const error = validateField(field, formData[field.name]);
        if (error) {
          newErrors[field.name] = error;
          isValid = false;
        }
      });
    });

    setErrors(newErrors);

    if (isValid) {
      try {
        await onSubmit(formData);
      } catch (error) {
        console.error('Form submission error:', error);
        setErrors({ _form: 'Failed to submit form. Please try again.' });
      }
    }

    setIsSubmitting(false);
  };

  const getFieldClassName = (field: MedicalFormField) => {
    const baseClassName = 'medical-field';

    switch (field.medicalType) {
      case 'vital':
        return cn(baseClassName, 'border-l-4 border-l-success');
      case 'diagnostic':
        return cn(baseClassName, 'border-l-4 border-l-primary');
      case 'medication':
        return cn(baseClassName, 'border-l-4 border-l-warning');
      case 'allergy':
        return cn(baseClassName, 'border-l-4 border-l-destructive');
      case 'symptom':
        return cn(baseClassName, 'border-l-4 border-l-accent');
      default:
        return baseClassName;
    }
  };

  return (
    <div className={cn('medical-form max-w-4xl mx-auto', className)}>
      {title && (
        <div className="mb-6 text-center">
          <h2 className={cn(
            'text-2xl font-bold text-foreground flex items-center justify-center gap-2',
            emergency && 'text-destructive'
          )}>
            {emergency && <AlertTriangle className="h-6 w-6" />}
            {title}
          </h2>
          {subtitle && (
            <p className="text-muted-foreground mt-2">{subtitle}</p>
          )}
        </div>
      )}

      {errors._form && (
        <Card className="mb-6 border-destructive/50 bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">{errors._form}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {sections.map((section, sectionIndex) => (
          <Card key={sectionIndex} className="medical-form-section">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg text-foreground flex items-center gap-2">
                    {section.badge && (
                      <MedicalBadge
                        status={section.badge.status}
                        size="sm"
                        pulse={section.badge.status === 'emergency' || section.badge.status === 'critical'}
                      >
                        {section.badge.label || section.badge.status}
                      </MedicalBadge>
                    )}
                    {section.title}
                  </CardTitle>
                  {section.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {section.description}
                    </p>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <div className={cn(
                "grid gap-6",
                section.fields.length === 1 ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"
              )}>
                {section.fields.map((field, fieldIndex) => (
                  <div key={fieldIndex} className={getFieldClassName(field)}>
                    <Field
                      name={field.name}
                      label={field.label}
                      type={field.type}
                      required={field.required}
                      options={field.options}
                      placeholder={field.placeholder}
                      defaultValue={field.defaultValue}
                      description={field.description}
                      validation={field.validation}
                      className={cn(
                        "transition-all focus:ring-2 focus:ring-primary/20",
                        errors[field.name] && "border-destructive focus:ring-destructive/20",
                        field.medicalType === 'vital' && "medical-input",
                        field.medicalType === 'diagnostic' && "diagnostic-input"
                      )}
                      onChange={(value) => handleFieldChange(field.name, value)}
                      error={errors[field.name]}
                    />

                    {/* Field type specific indicators */}
                    {field.medicalType && (
                      <div className="mt-1 flex items-center gap-1">
                        {field.medicalType === 'vital' && (
                          <CheckCircle className="h-3 w-3 text-success" />
                        )}
                        {field.medicalType === 'diagnostic' && (
                          <Info className="h-3 w-3 text-primary" />
                        )}
                        {field.medicalType === 'allergy' && (
                          <AlertTriangle className="h-3 w-3 text-destructive" />
                        )}
                        <span className="text-xs text-muted-foreground capitalize">
                          {field.medicalType}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Form Actions */}
        <Card className="bg-background/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {autoSave && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <CheckCircle className="h-3 w-3" />
                    <span>Auto-saving enabled</span>
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                {showCancelButton && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => window.history.back()}
                    disabled={isSubmitting || disabled}
                  >
                    {cancelButtonText}
                  </Button>
                )}

                <Button
                  type="submit"
                  variant={emergency ? 'emergency' : 'medical'}
                  size="medical"
                  disabled={isSubmitting || disabled}
                  className={cn(
                    emergency && "animate-pulse"
                  )}
                >
                  {isSubmitting ? 'Submitting...' : submitButtonText}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}

// Convenience components for common medical form types
export function PatientRegistrationForm({ onSubmit, ...props }: Omit<MedicalFormProps, 'sections' | 'title'>) {
  const sections: MedicalFormSection[] = [
    {
      title: 'Personal Information',
      fields: [
        { name: 'firstName', label: 'First Name', type: 'text', required: true },
        { name: 'lastName', label: 'Last Name', type: 'text', required: true },
        { name: 'dateOfBirth', label: 'Date of Birth', type: 'date', required: true },
        { name: 'email', label: 'Email', type: 'email', required: true },
        { name: 'phone', label: 'Phone Number', type: 'tel', required: true },
      ],
    },
    {
      title: 'Medical Information',
      badge: { status: 'normal', label: 'Medical' },
      fields: [
        { name: 'bloodType', label: 'Blood Type', type: 'select', options: [
          { value: 'A+', label: 'A+' }, { value: 'A-', label: 'A-' },
          { value: 'B+', label: 'B+' }, { value: 'B-', label: 'B-' },
          { value: 'AB+', label: 'AB+' }, { value: 'AB-', label: 'AB-' },
          { value: 'O+', label: 'O+' }, { value: 'O-', label: 'O-' },
        ]},
        { name: 'allergies', label: 'Known Allergies', type: 'textarea', medicalType: 'allergy' },
        { name: 'medications', label: 'Current Medications', type: 'textarea', medicalType: 'medication' },
      ],
    },
  ];

  return (
    <MedicalForm
      title="Patient Registration"
      sections={sections}
      onSubmit={onSubmit}
      {...props}
    />
  );
}

export function VitalSignsForm({ onSubmit, ...props }: Omit<MedicalFormProps, 'sections' | 'title'>) {
  const sections: MedicalFormSection[] = [
    {
      title: 'Vital Signs',
      badge: { status: 'normal', label: 'Vitals' },
      fields: [
        {
          name: 'heartRate',
          label: 'Heart Rate',
          type: 'number',
          required: true,
          medicalType: 'vital',
          validation: { min: 30, max: 200 },
          placeholder: '60-100 bpm',
        },
        {
          name: 'bloodPressureSystolic',
          label: 'Blood Pressure (Systolic)',
          type: 'number',
          required: true,
          medicalType: 'vital',
          validation: { min: 70, max: 200 },
          placeholder: '120',
        },
        {
          name: 'bloodPressureDiastolic',
          label: 'Blood Pressure (Diastolic)',
          type: 'number',
          required: true,
          medicalType: 'vital',
          validation: { min: 40, max: 130 },
          placeholder: '80',
        },
        {
          name: 'temperature',
          label: 'Temperature',
          type: 'number',
          required: true,
          medicalType: 'vital',
          validation: { min: 35, max: 42 },
          placeholder: '36.5-37.5°C',
          step: '0.1',
        },
        {
          name: 'oxygenSaturation',
          label: 'Oxygen Saturation',
          type: 'number',
          required: true,
          medicalType: 'vital',
          validation: { min: 70, max: 100 },
          placeholder: '95-100%',
        },
      ],
    },
    {
      title: 'Notes',
      fields: [
        {
          name: 'notes',
          label: 'Additional Notes',
          type: 'textarea',
          placeholder: 'Any observations or concerns...',
        },
      ],
    },
  ];

  return (
    <MedicalForm
      title="Record Vital Signs"
      sections={sections}
      onSubmit={onSubmit}
      autoSave={true}
      {...props}
    />
  );
}