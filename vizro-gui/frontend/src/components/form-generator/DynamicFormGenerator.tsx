/**
 * Dynamic Form Generator - Core Implementation
 * 
 * This is the main form generator that brings together all the pieces:
 * - React Hook Form integration
 * - Schema-to-form bridging
 * - Component registry
 * - Dual-mode support (Tree Builder vs Property Editor)
 * - Real-time validation and field dependencies
 */

import React, { useMemo, useEffect, useCallback, useState } from 'react';
import { useForm, Controller, useFieldArray, FieldValues, UseFormReturn } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight, AlertCircle, CheckCircle2, Settings, TreePine } from 'lucide-react';
import { 
  ComponentSchema, 
  FieldDefinition, 
  ComponentContext
} from '@/types/schema';
import { SchemaFormBridge, BridgeConfig, FormSection, FieldConfig } from '@/lib/schema-form-bridge';
import { FormSchemaTransformer, FormIntegrationConfig } from '@/lib/form-integration';

// Enhanced props for the main form generator
export interface DynamicFormGeneratorProps<T extends FieldValues = FieldValues> {
  schema: ComponentSchema;
  initialValues?: Partial<T>;
  mode?: 'tree_builder' | 'property_editor' | 'dual';
  onSubmit?: (values: T) => void;
  onChange?: (values: T, isValid: boolean) => void;
  onModeChange?: (mode: 'tree_builder' | 'property_editor') => void;
  className?: string;
  config?: {
    integration?: Partial<FormIntegrationConfig>;
    bridge?: Partial<BridgeConfig>;
  };
  enableRealTimeValidation?: boolean;
  enableBackendValidation?: boolean;
  enableModeToggle?: boolean;
  showFormStatus?: boolean;
  autoSave?: boolean;
  autoSaveDelay?: number;
}

// Form section component that handles collapsible sections
interface FormSectionComponentProps {
  section: FormSection;
  form: UseFormReturn<any>;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  enableConditionalFields: boolean;
}

const FormSectionComponent: React.FC<FormSectionComponentProps> = ({
  section,
  form,
  collapsed,
  onToggleCollapsed,
  enableConditionalFields
}) => {
  const { control, watch, formState: { errors, touchedFields } } = form;
  const watchedValues = watch();

  // Filter fields based on conditional logic
  const visibleFields = useMemo(() => {
    if (!enableConditionalFields) return section.fields;

    return section.fields.filter(field => {
      if (!field.conditional) return true;
      
      const dependentValue = watchedValues[field.conditional.dependsOn];
      return field.conditional.condition(dependentValue);
    });
  }, [section.fields, watchedValues, enableConditionalFields]);

  if (visibleFields.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center gap-3">
        {section.collapsible && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onToggleCollapsed}
            className="h-6 w-6 p-0"
          >
            {collapsed ? (
              <ChevronRight className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </Button>
        )}
        
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium">{section.title}</h3>
            <Badge variant="outline" className="text-xs">
              {visibleFields.length} field{visibleFields.length !== 1 ? 's' : ''}
            </Badge>
          </div>
          {section.description && (
            <p className="text-xs text-muted-foreground mt-1">{section.description}</p>
          )}
        </div>

        {/* Section status indicator */}
        <div className="flex items-center gap-1">
          {visibleFields.some(field => errors[field.name]) && (
            <AlertCircle className="h-4 w-4 text-destructive" />
          )}
          {visibleFields.every(field => 
            !errors[field.name] && 
            touchedFields[field.name] && 
            watchedValues[field.name] !== undefined
          ) && (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          )}
        </div>
      </div>

      {/* Section Content */}
      {(!section.collapsible || !collapsed) && (
        <div className="space-y-4 ml-6">
          {visibleFields.map((fieldConfig) => (
            <DynamicField
              key={fieldConfig.name}
              fieldConfig={fieldConfig}
              control={control}
              errors={errors}
              watchedValues={watchedValues}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Individual dynamic field component
interface DynamicFieldProps {
  fieldConfig: FieldConfig;
  control: any;
  errors: Record<string, any>;
  watchedValues: Record<string, any>;
}

const DynamicField: React.FC<DynamicFieldProps> = ({
  fieldConfig,
  control,
  errors,
  watchedValues
}) => {
  const FieldComponent = fieldConfig.component;
  const fieldError = errors[fieldConfig.name];

  return (
    <div className="space-y-2">
      <Controller
        name={fieldConfig.name}
        control={control}
        rules={fieldConfig.registerOptions}
        render={({ field: { onChange, onBlur, value, name, ref } }) => (
          <FieldComponent
            {...fieldConfig.props}
            name={name}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            error={fieldError?.message}
            ref={ref}
          />
        )}
      />
      
      {/* Field dependencies info (debug mode) */}
      {process.env.NODE_ENV === 'development' && fieldConfig.dependencies && (
        <div className="text-xs text-muted-foreground">
          Dependencies: {fieldConfig.dependencies.join(', ')}
        </div>
      )}
    </div>
  );
};

// Main form generator component
export const DynamicFormGenerator = <T extends FieldValues = FieldValues>({
  schema,
  initialValues = {} as Partial<T>,
  mode = 'property_editor',
  onSubmit,
  onChange,
  onModeChange,
  className,
  config = {},
  enableRealTimeValidation = true,
  enableBackendValidation = false,
  enableModeToggle = true,
  showFormStatus = true,
  autoSave = false,
  autoSaveDelay = 1000,
  ...props
}: DynamicFormGeneratorProps<T>) => {
  const [currentMode, setCurrentMode] = useState<'tree_builder' | 'property_editor'>(
    mode === 'dual' ? 'property_editor' : mode
  );
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  // Initialize form integration
  const formTransformer = useMemo(() => {
    return new FormSchemaTransformer(schema, {
      mode: currentMode,
      enableRealTimeValidation,
      reValidateMode: enableRealTimeValidation ? 'onChange' : 'onBlur',
      ...config.integration
    });
  }, [schema, currentMode, enableRealTimeValidation, config.integration]);

  // Initialize form bridge
  const formBridge = useMemo(() => {
    return new SchemaFormBridge(schema, {
      mode: currentMode,
      enableConditionalFields: true,
      enableFieldDependencies: true,
      groupByCategory: true,
      ...config.bridge
    }, initialValues as Record<string, any>);
  }, [schema, currentMode, initialValues, config.bridge]);

  // Generate form configuration
  const formConfig = useMemo(() => {
    return formTransformer.generateFormConfig(initialValues);
  }, [formTransformer, initialValues]);

  // Generate form sections
  const formSections = useMemo(() => {
    return formBridge.generateFormSections();
  }, [formBridge]);

  // Initialize React Hook Form
  const form = useForm<T>(formConfig);
  const { control, handleSubmit, watch, formState: { errors, isValid, isDirty, touchedFields } } = form;

  // Watch all form values for real-time updates
  const watchedValues = watch();

  // Handle mode changes
  const handleModeChange = useCallback((newMode: 'tree_builder' | 'property_editor') => {
    setCurrentMode(newMode);
    onModeChange?.(newMode);
  }, [onModeChange]);

  // Handle form submission
  const handleFormSubmit = useCallback((values: T) => {
    onSubmit?.(values);
  }, [onSubmit]);

  // Handle real-time form changes
  useEffect(() => {
    if (enableRealTimeValidation && onChange) {
      onChange(watchedValues as T, isValid);
    }
  }, [watchedValues, isValid, onChange, enableRealTimeValidation]);

  // Auto-save functionality
  useEffect(() => {
    if (!autoSave || !isDirty) return;

    const timeoutId = setTimeout(() => {
      if (isValid && onSubmit) {
        onSubmit(watchedValues as T);
      }
    }, autoSaveDelay);

    return () => clearTimeout(timeoutId);
  }, [watchedValues, isValid, isDirty, autoSave, autoSaveDelay, onSubmit]);

  // Section collapse handling
  const toggleSectionCollapse = useCallback((sectionId: string) => {
    const newCollapsed = new Set(collapsedSections);
    if (newCollapsed.has(sectionId)) {
      newCollapsed.delete(sectionId);
    } else {
      newCollapsed.add(sectionId);
    }
    setCollapsedSections(newCollapsed);
  }, [collapsedSections]);

  // Initialize collapsed sections based on defaults
  useEffect(() => {
    const defaultCollapsed = new Set<string>();
    formSections.forEach(section => {
      if (section.defaultCollapsed) {
        defaultCollapsed.add(section.id);
      }
    });
    setCollapsedSections(defaultCollapsed);
  }, [formSections]);

  // Filter sections for current mode
  const visibleSections = useMemo(() => {
    if (mode !== 'dual') return formSections;
    
    // In dual mode, show different sections per tab
    return formSections.filter(section => {
      if (currentMode === 'tree_builder') {
        return section.category === 'structural';
      } else {
        return section.category !== 'structural';
      }
    });
  }, [formSections, currentMode, mode]);

  // Form status summary
  const formStatus = useMemo(() => {
    const totalFields = formSections.reduce((acc, section) => acc + section.fields.length, 0);
    const touchedCount = Object.keys(touchedFields).length;
    const errorCount = Object.keys(errors).length;
    
    return { totalFields, touchedCount, errorCount, isValid, isDirty };
  }, [formSections, touchedFields, errors, isValid, isDirty]);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Form Header */}
      <div className="pb-4 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">{schema.title}</h2>
            {schema.description && (
              <p className="text-sm text-muted-foreground mt-1">{schema.description}</p>
            )}
          </div>

          {/* Mode toggle for dual mode */}
          {mode === 'dual' && enableModeToggle && (
            <Tabs value={currentMode} onValueChange={handleModeChange as any}>
              <TabsList className="grid w-[400px] grid-cols-2">
                <TabsTrigger value="tree_builder" className="flex items-center gap-2">
                  <TreePine className="h-4 w-4" />
                  Tree Builder
                </TabsTrigger>
                <TabsTrigger value="property_editor" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Properties
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}
        </div>

        {/* Form Status */}
        {showFormStatus && (
          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
            <span>Component: {schema.component_type}</span>
            <span>Mode: {currentMode === 'tree_builder' ? 'Tree Builder' : 'Property Editor'}</span>
            <span>Fields: {formStatus.totalFields}</span>
            <span>Completed: {formStatus.touchedCount}</span>
            {formStatus.errorCount > 0 && (
              <span className="text-destructive">Errors: {formStatus.errorCount}</span>
            )}
            {formStatus.isValid && formStatus.isDirty && (
              <Badge variant="outline" className="text-green-600 border-green-600">
                Valid
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {mode === 'dual' ? (
          <Tabs value={currentMode} onValueChange={handleModeChange as any}>
            <TabsContent value="tree_builder" className="space-y-6">
              {visibleSections
                .filter(section => section.category === 'structural')
                .map(section => (
                  <FormSectionComponent
                    key={section.id}
                    section={section}
                    form={form}
                    collapsed={collapsedSections.has(section.id)}
                    onToggleCollapsed={() => toggleSectionCollapse(section.id)}
                    enableConditionalFields={formBridge.getConfig().enableConditionalFields}
                  />
                ))}
            </TabsContent>
            
            <TabsContent value="property_editor" className="space-y-6">
              {visibleSections
                .filter(section => section.category !== 'structural')
                .map(section => (
                  <FormSectionComponent
                    key={section.id}
                    section={section}
                    form={form}
                    collapsed={collapsedSections.has(section.id)}
                    onToggleCollapsed={() => toggleSectionCollapse(section.id)}
                    enableConditionalFields={formBridge.getConfig().enableConditionalFields}
                  />
                ))}
            </TabsContent>
          </Tabs>
        ) : (
          visibleSections.map(section => (
            <FormSectionComponent
              key={section.id}
              section={section}
              form={form}
              collapsed={collapsedSections.has(section.id)}
              onToggleCollapsed={() => toggleSectionCollapse(section.id)}
              enableConditionalFields={formBridge.getConfig().enableConditionalFields}
            />
          ))
        )}

        {/* Empty state */}
        {visibleSections.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">
              No fields available for {currentMode === 'tree_builder' ? 'tree building' : 'property editing'} mode.
            </p>
          </div>
        )}

        {/* Form Actions */}
        {onSubmit && (
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="submit"
              disabled={!isValid}
              className="min-w-[120px]"
            >
              Save Changes
            </Button>
          </div>
        )}
      </form>
    </div>
  );
};

// Export the original DynamicForm as a legacy alias
export { DynamicForm } from './DynamicForm';

// Convenience hook for using the form generator
export function useDynamicFormGenerator<T extends FieldValues = FieldValues>(
  schema: ComponentSchema,
  config?: DynamicFormGeneratorProps<T>['config']
) {
  const transformer = useMemo(() => 
    new FormSchemaTransformer(schema, config?.integration), 
    [schema, config?.integration]
  );
  
  const bridge = useMemo(() => 
    new SchemaFormBridge(schema, config?.bridge), 
    [schema, config?.bridge]
  );

  return {
    transformer,
    bridge,
    formConfig: transformer.generateFormConfig(),
    formSections: bridge.generateFormSections()
  };
}