# Frontend Component Registry System

A robust, extensible system for mapping Vizro schema field definitions to React form components. The registry enables dynamic form generation that adapts to any schema version without hardcoding component names or field types.

## Overview

The Component Registry System is the second high-priority task in our schema form engine implementation. It provides:

- **Schema-driven architecture**: All forms generated from Vizro JSON schema
- **Pattern-based matching**: Flexible component resolution using priority-based patterns
- **Zero hardcoding**: Works with any schema version (0.1.43 → 0.1.44 → future)
- **Extensible design**: Easy registration of new components and patterns
- **Type safety**: Full TypeScript support with proper interfaces

## Architecture

### Core Components

```
frontend/src/
├── types/
│   └── schema.ts                 # TypeScript interfaces
├── lib/
│   ├── component-registry.ts     # Core registry implementation
│   ├── schema-client.ts          # Backend API integration
│   └── registry-extensions.ts   # Vizro-specific patterns
├── components/
│   ├── form-fields/
│   │   ├── TextInput.tsx         # Generic components
│   │   ├── NumberInput.tsx
│   │   ├── SelectInput.tsx
│   │   ├── ArrayInput.tsx
│   │   ├── ObjectInput.tsx
│   │   └── specialized/
│   │       ├── GraphFigureInput.tsx
│   │       ├── ComponentListInput.tsx
│   │       └── ActionsInput.tsx
│   └── form-generator/
│       └── DynamicForm.tsx       # Main form generator
```

### Pattern Matching System

The registry uses a priority-based pattern matching system:

```typescript
interface ComponentPattern {
  id: string;
  priority: number;              // Higher = matched first
  matcher: ComponentMatcher;     // Matching rules
  component: FormFieldComponent; // React component
  description?: string;
}
```

#### Matcher Types

1. **Field Type**: `{ type: 'field_type', pattern: 'string' }`
2. **Field Name**: `{ type: 'field_name', pattern: /^actions$/i }`
3. **Component Type**: `{ type: 'component_type', pattern: 'Graph' }`
4. **Category**: `{ type: 'category', pattern: 'structural' }`
5. **Validation**: `{ type: 'validation', rule: 'enum_values', exists: true }`
6. **Custom**: `{ type: 'custom', predicate: (field, context) => boolean }`

### Component Resolution

```typescript
// 1. Check registered patterns by priority
for (const pattern of this.patterns) {
  if (this.matchesPattern(pattern.matcher, field, context)) {
    return pattern.component;
  }
}

// 2. Fall back to generic type-based component
const fallbackComponent = this.config.fallbackComponents[field.field_type];
if (fallbackComponent) {
  return fallbackComponent;
}

// 3. Ultimate fallback - treat as string
return this.config.fallbackComponents.string;
```

## Component Library

### Generic Components

#### TextInput
- Handles string fields
- Auto-detects multiline based on content length
- Supports pattern validation and length limits

#### NumberInput
- Integer and float support
- Min/max validation
- Step controls

#### SelectInput
- Single and multi-select
- Enum value handling
- Searchable options

#### CheckboxInput
- Boolean fields
- Proper accessibility

#### ArrayInput
- Dynamic list management
- Drag-and-drop reordering
- Add/remove functionality

#### ObjectInput
- Key-value structures
- Nested property support
- Dynamic property addition

### Specialized Components

#### GraphFigureInput
- Code editor for Python functions
- Plotly figure templates
- Syntax validation
- Preview mode (placeholder)

#### ComponentListInput
- Page/Container component management
- Component type selection
- Drag-and-drop ordering
- ID and title configuration

#### ActionsInput
- Action type selection
- Target configuration
- Input/output parameter setup
- Built-in action templates

## API Usage

### Basic Form Generation

```typescript
import { DynamicForm } from '@/components/form-fields';

function MyForm() {
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  return (
    <DynamicForm
      schema={componentSchema}
      values={values}
      errors={errors}
      touched={touched}
      onChange={(field, value) => setValues(prev => ({ ...prev, [field]: value }))}
      onBlur={(field) => setTouched(prev => ({ ...prev, [field]: true }))}
      mode="property_editor" // or "tree_builder"
    />
  );
}
```

### Component Registration

```typescript
import { ComponentRegistryAPI } from '@/components/form-fields';

// Register for specific component + field combination
ComponentRegistryAPI.registerForComponentField('Graph', 'figure', MyCustomInput, 150);

// Register for field pattern across all components
ComponentRegistryAPI.registerForFieldPattern(/^.*_id$/i, IdInput, 100);

// Register with custom matching logic
ComponentRegistryAPI.registerCustom(
  'complex-validation',
  (field, context) => field.validation.pattern && context.componentType === 'Filter',
  PatternInput,
  120
);
```

### Convenience Functions

```typescript
import { 
  registerForGraph, 
  registerForTable, 
  registerForIds 
} from '@/components/form-fields';

// Specialized registration shortcuts
registerForGraph('figure', MyGraphInput);
registerForTable('figure', MyTableInput);
registerForIds(IdSelectorInput);
```

## Backend Integration

### Schema Client

```typescript
import { schemaClient } from '@/components/form-fields';

// Get all components
const response = await schemaClient.getComponents('0.1.43');

// Get specific component schema
const schema = await schemaClient.getComponent('0.1.43', 'Graph');

// Validate configuration
const validation = await schemaClient.validateConfiguration(config);
```

### API Endpoints

- `GET /api/v1/schema/components/{version}` - List all components
- `GET /api/v1/schema/components/{version}/{component_type}` - Component details
- `POST /api/v1/validation/validate` - Configuration validation

## Form Modes

### Tree Builder Mode
- Shows only `structural` category fields
- Focus on component hierarchy and relationships
- Components, children, navigation structure

### Property Editor Mode  
- Shows `property` and `metadata` category fields
- Focus on component-specific configuration
- Titles, descriptions, styling, behavior

## Extension Examples

### Custom Field Type

```typescript
// 1. Create component
const ColorInput: React.FC<FormFieldProps> = ({ value, onChange, ...props }) => {
  return (
    <input
      type="color"
      value={value || '#000000'}
      onChange={(e) => onChange(e.target.value)}
      {...props}
    />
  );
};

// 2. Register pattern
ComponentRegistryAPI.registerForFieldPattern(/color$/i, ColorInput, 90);
```

### Component-Specific Override

```typescript
// Override title field for Graph components specifically
ComponentRegistryAPI.registerForComponentField(
  'Graph', 
  'title', 
  RichTextInput, 
  130
);
```

### Validation-Based Registration

```typescript
// Use special input for fields with enum validation
ComponentRegistryAPI.registerForValidation(
  'enum_values',
  EnhancedSelectInput,
  true, // rule exists
  110
);
```

## Type Safety

### Field Definition Types

```typescript
interface FieldDefinition {
  name: string;
  field_type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  category: 'metadata' | 'property' | 'structural';
  validation: ValidationRules;
  default_value: any;
  // ... additional properties
}
```

### Component Context

```typescript
interface ComponentContext {
  componentType: string;      // 'Graph', 'Table', etc.
  fieldName: string;         // 'figure', 'title', etc.
  fieldPath: string[];       // ['components', '0', 'figure']
  parentField?: FieldDefinition;
  rootComponent: ComponentSchema;
}
```

## Debug Mode

Enable debug logging to see pattern matching in action:

```typescript
import { ComponentRegistryAPI } from '@/components/form-fields';

ComponentRegistryAPI.enableDebug();
// Console will show matching decisions for each field
```

## Performance Considerations

- Patterns are sorted by priority once during registration
- Component resolution is O(n) where n = number of patterns
- Memoization used for expensive field property calculations
- Lazy loading of specialized components

## Testing

The system includes a comprehensive demo component (`RegistryDemo.tsx`) that provides:

- Live schema loading from backend API
- Interactive component selection
- Pattern matching visualization
- Form value inspection
- Registry debugging tools

## Future Extensions

### Planned Features

1. **Live Preview**: WebAssembly + iframe integration
2. **Template System**: Pre-built component configurations
3. **Validation UI**: Real-time backend validation display
4. **Drag-and-Drop**: Visual component tree editing
5. **Undo/Redo**: Form state history management

### Extension Points

- Custom pattern matchers
- Field preprocessors
- Validation rule handlers
- Component decorators
- Form layout engines

## Schema Compatibility

The registry is designed to work with **any Vizro schema version**:

- ✅ Current: 0.1.43
- ✅ Future: 0.1.44, 0.2.0, etc.
- ✅ New field types automatically handled
- ✅ New components get generic fallbacks
- ✅ Custom patterns can be added for new features

This zero-hardcoding approach ensures the GUI builder remains compatible as Vizro evolves.

## Success Criteria ✅

- [x] Support all field types returned by backend schema analysis
- [x] Zero hardcoded component names
- [x] Extensible for new field types
- [x] Clean TypeScript interfaces
- [x] Ready for dynamic form generation
- [x] Component registry maps schema patterns → form components
- [x] Specific renderers for complex cases + generic fallbacks
- [x] Works with ANY schema version without code changes
- [x] Uses shadcn/ui components as building blocks

The Frontend Component Registry System is now complete and ready to power the next phase of dynamic form generation for the Vizro GUI Builder.