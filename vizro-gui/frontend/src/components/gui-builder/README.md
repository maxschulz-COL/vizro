# GUI Builder Components

This directory contains the main components for the Vizro GUI Builder interface, implementing a three-panel layout for building Vizro dashboards through a visual interface.

## Components Overview

### GUIBuilder.tsx
Main component that orchestrates the three-panel layout:
- **Left Panel**: Component Tree Builder
- **Center Panel**: Configuration Preview (JSON/YAML)
- **Right Panel**: Property Editor
- **Top Navigation**: Dashboard actions and metadata

### ComponentTree.tsx
Left panel component for building dashboard structure:
- Hierarchical tree view (Dashboard > Pages > Components)
- Add component functionality with dropdown menus
- Component selection and navigation
- Inline editing of component titles
- Context menus for component actions (rename, duplicate, delete)
- Icons and visual indicators for different component types

### PropertyPanel.tsx
Right panel component for editing component properties:
- Dynamic form generation based on selected component schema
- Two-mode operation: Tree Builder vs Property Editor
- Real-time property updates with validation
- Schema-driven form fields with proper type handling
- Form state management and error display

### PreviewPanel.tsx
Center panel component for configuration output:
- Real-time JSON/YAML configuration display
- Copy to clipboard and download functionality
- Configuration statistics and validation status
- Syntax highlighting and formatting
- Minimizable interface for more workspace

## Key Features

### Schema-Driven Architecture
- All forms and validation based on Vizro schema definitions
- Zero hardcoding of component types or field names
- Automatic adaptation to schema changes
- Version-agnostic component handling

### State Management
- Zustand store for dashboard tree state
- Component selection and navigation
- Real-time property updates
- Undo/redo capability (planned)

### Dynamic Component Registry
- Pattern-matching system for form field components
- Fallback components for unknown field types
- Extensible architecture for custom components

### User Experience
- Intuitive three-panel workflow
- Visual feedback for selection and validation
- Responsive design with proper panel sizing
- Keyboard shortcuts and accessibility (planned)

## Integration Points

### Backend API
- Schema retrieval via `/api/v1/schema/components/{version}/{component}`
- Component list via `/api/v1/schema/components/{version}`
- Configuration validation via `/api/v1/validation/validate`

### Form System
- Integration with existing `DynamicForm` component
- Reuse of form field components (TextInput, SelectInput, etc.)
- Schema-to-form transformation via `schema-form-bridge`

### State Persistence
- Dashboard state persistence in browser storage
- Import/export of dashboard configurations
- Session recovery (planned)

## Future Enhancements

### Phase 1 (Current)
- ✅ Three-panel layout
- ✅ Component tree building
- ✅ Property editing
- ✅ Configuration preview

### Phase 2 (Planned)
- [ ] Live dashboard preview via WebAssembly
- [ ] Drag & drop component reordering
- [ ] Advanced validation with backend integration
- [ ] Template system for quick dashboard creation

### Phase 3 (Future)
- [ ] GenAI assistant integration
- [ ] Collaborative editing
- [ ] Version control and history
- [ ] Advanced theming and customization

## Development Guidelines

### Adding New Component Types
1. Ensure component is defined in Vizro schema
2. Add icon mapping in `ComponentTree.tsx`
3. Test form generation and property editing
4. Verify configuration export format

### Extending Form Fields
1. Add new field component to `form-fields/` directory
2. Register pattern in component registry
3. Update type definitions in `types/schema.ts`
4. Test with various component schemas

### State Management
- Use Zustand actions for all state modifications
- Maintain referential integrity in tree structure
- Implement optimistic updates with rollback capability
- Consider performance for large dashboard trees

### Testing Strategy
- Unit tests for individual components
- Integration tests for three-panel workflow
- E2E tests for complete dashboard creation
- Schema compatibility tests across versions