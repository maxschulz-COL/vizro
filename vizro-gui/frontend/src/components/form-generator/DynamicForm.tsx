import React, { useMemo, useEffect, useCallback } from 'react';
import { useForm, Controller, useFieldArray, FieldValues } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { 
  ComponentSchema, 
  FieldDefinition, 
  FormGenerationContext, 
  ComponentContext,
  FieldCategory
} from '@/types/schema';
import { componentRegistry } from '@/lib/component-registry';
import { VizroSchemaClient } from '@/lib/schema-client';
import { SchemaFormBridge, BridgeConfig, FormSection, FieldConfig } from '@/lib/schema-form-bridge';
import { FormSchemaTransformer, FormIntegrationConfig } from '@/lib/form-integration';

interface DynamicFormProps {
  schema: ComponentSchema;
  values: Record<string, any>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  onChange: (field: string, value: any) => void;
  onBlur: (field: string) => void;
  mode: 'tree_builder' | 'property_editor';
  fieldFilter?: (field: FieldDefinition, context: ComponentContext) => boolean;
  className?: string;
}

interface FieldGroupProps {
  category: FieldCategory;
  fields: Array<{ name: string; field: FieldDefinition }>;
  schema: ComponentSchema;
  values: Record<string, any>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  onChange: (field: string, value: any) => void;
  onBlur: (field: string) => void;
  mode: 'tree_builder' | 'property_editor';
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

const categoryConfig = {
  metadata: {
    label: 'Component Metadata',
    description: 'Basic component identification and configuration',
    priority: 1,
    collapsible: true
  },
  property: {
    label: 'Properties',
    description: 'Component-specific properties and settings',
    priority: 2,
    collapsible: false
  },
  structural: {
    label: 'Structure',
    description: 'Child components and hierarchical relationships',
    priority: 3,
    collapsible: false
  }
};

/**
 * Field group component for organizing fields by category
 */
const FieldGroup: React.FC<FieldGroupProps> = ({
  category,
  fields,
  schema,
  values,
  errors,
  touched,
  onChange,
  onBlur,
  mode,
  collapsed,
  onToggleCollapsed
}) => {
  const config = categoryConfig[category];
  
  if (fields.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {config.collapsible ? (
        <div className="flex items-center gap-2">
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
          <div>
            <h3 className="text-sm font-medium">{config.label}</h3>
            <p className="text-xs text-muted-foreground">{config.description}</p>
          </div>
          <span className="text-xs text-muted-foreground ml-auto">
            {fields.length} field{fields.length !== 1 ? 's' : ''}
          </span>
        </div>
      ) : (
        <div>
          <h3 className="text-sm font-medium mb-1">{config.label}</h3>
          <p className="text-xs text-muted-foreground mb-3">{config.description}</p>
        </div>
      )}
      
      {(!config.collapsible || !collapsed) && (
        <div className="space-y-4 ml-2">
          {fields.map(({ name, field }) => (
            <DynamicField
              key={name}
              fieldName={name}
              field={field}
              schema={schema}
              values={values}
              errors={errors}
              touched={touched}
              onChange={onChange}
              onBlur={onBlur}
              mode={mode}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Individual field component with dynamic component resolution
 */
interface DynamicFieldProps {
  fieldName: string;
  field: FieldDefinition;
  schema: ComponentSchema;
  values: Record<string, any>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  onChange: (field: string, value: any) => void;
  onBlur: (field: string) => void;
  mode: 'tree_builder' | 'property_editor';
}

const DynamicField: React.FC<DynamicFieldProps> = ({
  fieldName,
  field,
  schema,
  values,
  errors,
  touched,
  onChange,
  onBlur,
  mode
}) => {
  const context: ComponentContext = {
    componentType: schema.component_type,
    fieldName,
    fieldPath: [fieldName],
    rootComponent: schema
  };

  // Get the appropriate component from the registry
  const FieldComponent = componentRegistry.getComponent(field, context);
  
  // Prepare props for the field component
  const fieldProps = {
    name: fieldName,
    label: VizroSchemaClient.getFieldDisplayName(field),
    description: field.description || undefined,
    required: field.validation.required,
    value: values[fieldName] ?? field.default_value,
    onChange: (value: any) => onChange(fieldName, value),
    onBlur: () => onBlur(fieldName),
    error: touched[fieldName] ? errors[fieldName] : undefined,
  };

  // Add type-specific props
  const enhancedProps = useMemo(() => {
    const baseProps = { ...fieldProps };

    // Handle enum values for select inputs
    if (field.validation.enum_values) {
      return {
        ...baseProps,
        options: VizroSchemaClient.enumToOptions(field.validation.enum_values)
      };
    }

    // Handle number inputs
    if (field.field_type === 'number') {
      return {
        ...baseProps,
        min: field.validation.minimum ?? undefined,
        max: field.validation.maximum ?? undefined,
        step: 1 // Could be inferred from validation rules
      };
    }

    // Handle string inputs
    if (field.field_type === 'string') {
      return {
        ...baseProps,
        maxLength: field.validation.max_length ?? undefined,
        minLength: field.validation.min_length ?? undefined,
        pattern: field.validation.pattern ?? undefined,
        multiline: field.validation.max_length ? field.validation.max_length > 100 : false
      };
    }

    // Handle array inputs
    if (field.field_type === 'array') {
      return {
        ...baseProps,
        itemSchema: { field_type: field.array_item_type || 'string' }, // Simplified
        minItems: field.validation.min_items ?? undefined,
        maxItems: field.validation.max_items ?? undefined
      };
    }

    // Handle object inputs
    if (field.field_type === 'object') {
      return {
        ...baseProps,
        properties: field.object_properties || {},
        additionalProperties: field.additional_properties
      };
    }

    return baseProps;
  }, [field, fieldProps]);

  return <FieldComponent {...enhancedProps} />;
};

/**
 * Main dynamic form component
 */
export const DynamicForm: React.FC<DynamicFormProps> = ({
  schema,
  values,
  errors,
  touched,
  onChange,
  onBlur,
  mode,
  fieldFilter,
  className
}) => {
  const [collapsedGroups, setCollapsedGroups] = React.useState<Set<FieldCategory>>(
    new Set(['metadata'])
  );

  // Group fields by category and filter based on mode
  const fieldGroups = useMemo(() => {
    const groups: Record<FieldCategory, Array<{ name: string; field: FieldDefinition }>> = {
      metadata: [],
      property: [],
      structural: []
    };

    Object.entries(schema.fields).forEach(([fieldName, field]) => {
      const context: ComponentContext = {
        componentType: schema.component_type,
        fieldName,
        fieldPath: [fieldName],
        rootComponent: schema
      };

      // Apply mode filtering
      if (!VizroSchemaClient.shouldShowField(field, mode)) {
        return;
      }

      // Apply custom field filter if provided
      if (fieldFilter && !fieldFilter(field, context)) {
        return;
      }

      groups[field.category].push({ name: fieldName, field });
    });

    return groups;
  }, [schema, mode, fieldFilter]);

  const toggleGroupCollapsed = (category: FieldCategory) => {
    const newCollapsed = new Set(collapsedGroups);
    if (newCollapsed.has(category)) {
      newCollapsed.delete(category);
    } else {
      newCollapsed.add(category);
    }
    setCollapsedGroups(newCollapsed);
  };

  // Sort categories by priority
  const sortedCategories = Object.keys(categoryConfig).sort(
    (a, b) => categoryConfig[a as FieldCategory].priority - categoryConfig[b as FieldCategory].priority
  ) as FieldCategory[];

  return (
    <div className={cn("space-y-6", className)}>
      {/* Form header */}
      <div className="pb-3 border-b">
        <h2 className="text-lg font-semibold">{schema.title}</h2>
        {schema.description && (
          <p className="text-sm text-muted-foreground mt-1">{schema.description}</p>
        )}
        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
          <span>Mode: {mode === 'tree_builder' ? 'Tree Builder' : 'Property Editor'}</span>
          <span>Component: {schema.component_type}</span>
          <span>
            Fields: {Object.values(fieldGroups).reduce((acc, group) => acc + group.length, 0)}
          </span>
        </div>
      </div>

      {/* Field groups */}
      {sortedCategories.map(category => (
        <FieldGroup
          key={category}
          category={category}
          fields={fieldGroups[category]}
          schema={schema}
          values={values}
          errors={errors}
          touched={touched}
          onChange={onChange}
          onBlur={onBlur}
          mode={mode}
          collapsed={collapsedGroups.has(category)}
          onToggleCollapsed={() => toggleGroupCollapsed(category)}
        />
      ))}

      {/* Empty state */}
      {Object.values(fieldGroups).every(group => group.length === 0) && (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">
            No fields available for {mode === 'tree_builder' ? 'tree building' : 'property editing'} mode.
          </p>
        </div>
      )}
    </div>
  );
};