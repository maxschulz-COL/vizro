/**
 * Form Fields Component Library for Vizro GUI Builder
 * 
 * Exports all form field components and utilities for building
 * dynamic forms from Vizro schema definitions.
 */

// Generic form components
export { TextInput } from './TextInput';
export { NumberInput } from './NumberInput';
export { CheckboxInput } from './CheckboxInput';
export { SelectInput } from './SelectInput';
export { ArrayInput } from './ArrayInput';
export { ObjectInput } from './ObjectInput';

// Specialized Vizro components
export { GraphFigureInput } from './specialized/GraphFigureInput';
export { ComponentListInput } from './specialized/ComponentListInput';
export { ActionsInput } from './specialized/ActionsInput';

// Form generator
export { DynamicForm } from '../form-generator/DynamicForm';

// Component registry and extension API
export { 
  componentRegistry,
  registerComponent,
  registerByFieldType,
  registerByFieldName,
  registerByComponentType
} from '../../lib/component-registry';

export {
  RegistryExtensionAPI as ComponentRegistryAPI,
  registerForGraph,
  registerForTable,
  registerForPage,
  registerForContainer,
  registerForFilter,
  registerForParameter,
  registerForIds,
  registerForTitles,
  registerForDescriptions
} from '../../lib/registry-extensions';

// Schema client
export { 
  VizroSchemaClient,
  schemaClient,
  useSchemaClient
} from '../../lib/schema-client';

// Types
export type {
  ComponentSchema,
  FieldDefinition,
  FormFieldProps,
  ComponentPattern,
  ComponentMatcher,
  ComponentContext,
  FormGenerationContext,
  SchemaApiClient,
  ValidationResponse
} from '../../types/schema';