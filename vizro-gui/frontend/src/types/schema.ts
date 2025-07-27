/**
 * TypeScript interfaces for Vizro schema and form component registry
 * 
 * These types mirror the backend schema API responses and provide
 * type safety for the dynamic form generation system.
 */

// Core schema types matching backend API response
export interface ValidationRules {
  required: boolean;
  min_length: number | null;
  max_length: number | null;
  minimum: number | null;
  maximum: number | null;
  pattern: string | null;
  enum_values: string[] | null;
  min_items: number | null;
  max_items: number | null;
  const_value: any | null;
}

export interface UnionType {
  ref_path: string;
  component_type: string;
}

export interface FieldDefinition {
  name: string;
  title: string;
  description: string | null;
  field_type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'null';
  category: 'metadata' | 'property' | 'structural';
  validation: ValidationRules;
  default_value: any;
  array_item_type: string | null;
  array_item_ref: string | null;
  object_properties: Record<string, FieldDefinition> | null;
  additional_properties: boolean;
  union_types: UnionType[] | null;
  discriminator_property: string | null;
  discriminator_mapping: Record<string, string> | null;
}

export interface ComponentSchema {
  component_type: string;
  title: string;
  description: string;
  fields: Record<string, FieldDefinition>;
  required_fields: string[];
  structural_fields: string[];
  is_root_component: boolean;
  is_child_component: boolean;
}

export interface ComponentListItem {
  component_type: string;
  title: string;
  description: string;
  field_count: number;
  is_root_component: boolean;
  has_children: boolean;
}

export interface SchemaApiResponse {
  schema_version: string;
  components: ComponentListItem[];
  total_count: number;
}

// Form component registry types
export interface FormFieldProps {
  name: string;
  label: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
  value: any;
  onChange: (value: any) => void;
  onBlur?: () => void;
  error?: string;
  className?: string;
}

export interface FormFieldComponent {
  (props: FormFieldProps): React.ReactElement;
}

// Enhanced props for specific field types
export interface TextInputProps extends FormFieldProps {
  placeholder?: string;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  multiline?: boolean;
}

export interface NumberInputProps extends FormFieldProps {
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
}

export interface SelectInputProps extends FormFieldProps {
  options: Array<{ value: string; label: string }>;
  multi?: boolean;
  searchable?: boolean;
  placeholder?: string;
}

export interface CheckboxInputProps extends FormFieldProps {
  value: boolean;
}

export interface DateInputProps extends FormFieldProps {
  min?: string;
  max?: string;
  range?: boolean;
}

export interface ArrayInputProps extends FormFieldProps {
  value: any[];
  itemSchema: FieldDefinition;
  minItems?: number;
  maxItems?: number;
}

export interface ObjectInputProps extends FormFieldProps {
  value: Record<string, any>;
  properties: Record<string, FieldDefinition>;
  additionalProperties?: boolean;
}

// Component registry pattern matching
export interface ComponentPattern {
  id: string;
  priority: number;
  matcher: ComponentMatcher;
  component: FormFieldComponent;
  description?: string;
}

export type ComponentMatcher = 
  | { type: 'field_type'; pattern: string }
  | { type: 'field_name'; pattern: string | RegExp }
  | { type: 'component_type'; pattern: string | RegExp }
  | { type: 'category'; pattern: string }
  | { type: 'validation'; rule: keyof ValidationRules; exists?: boolean }
  | { type: 'custom'; predicate: (field: FieldDefinition, context: ComponentContext) => boolean };

export interface ComponentContext {
  componentType: string;
  fieldName: string;
  fieldPath: string[];
  parentField?: FieldDefinition;
  rootComponent: ComponentSchema;
}

// Registry configuration
export interface RegistryConfig {
  fallbackComponents: {
    string: FormFieldComponent;
    number: FormFieldComponent;
    boolean: FormFieldComponent;
    array: FormFieldComponent;
    object: FormFieldComponent;
  };
  debugMode?: boolean;
  logMatching?: boolean;
}

// Form generation context
export interface FormGenerationContext {
  schema: ComponentSchema;
  values: Record<string, any>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  onChange: (field: string, value: any) => void;
  onBlur: (field: string) => void;
  mode: 'tree_builder' | 'property_editor';
  fieldFilter?: (field: FieldDefinition, context: ComponentContext) => boolean;
}

// API client types
export interface SchemaApiClient {
  getComponents(version: string): Promise<SchemaApiResponse>;
  getComponent(version: string, componentType: string): Promise<ComponentSchema>;
  validateConfiguration(config: any): Promise<ValidationResponse>;
}

export interface ValidationResponse {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  validated_config: any;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
}

// Component categories for organization
export type FieldCategory = 'metadata' | 'property' | 'structural';

export interface CategoryConfig {
  metadata: {
    label: string;
    description: string;
    priority: number;
    collapsible: boolean;
  };
  property: {
    label: string;
    description: string;
    priority: number;
    collapsible: boolean;
  };
  structural: {
    label: string;
    description: string;
    priority: number;
    collapsible: boolean;
  };
}