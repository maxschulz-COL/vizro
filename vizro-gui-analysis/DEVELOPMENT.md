# Vizro GUI Builder - Development History

This document tracks the development progress, decisions, and learnings for the Vizro GUI Builder project.

## Project Timeline

### 2025-01-26 - Project Initialization

**Context:**
- Fork created from main Vizro monorepo for GUI builder development
- Goal: Replace entire monorepo with single GUI application
- Development focused in `vizro-gui-analysis/` folder

**Initial Analysis:**
- Reviewed existing Vizro schema (`vizro-core/schemas/0.1.43.json`)
- 2,241 lines, 30+ model types with comprehensive validation rules
- High feasibility for GUI generation due to well-structured JSON Schema
- Identified core component categories: Layout, Data, Interactive, Controls, Actions

**Architecture Decisions:**
- **Frontend**: React 18 + TypeScript, Zustand state management
- **Backend**: FastAPI + Python, PostgreSQL + Redis
- **Approach**: Schema-driven development for 100% Vizro compatibility
- **Key Components**: Canvas Editor, Component Library, Property Inspector, Live Preview

**Documentation Structure:**
- `CLAUDE.md`: Core guidance for AI assistant
- `DEVELOPMENT.md`: Development history (this file)
- `advanced-context/`: Detailed technical documentation
  - `architecture-deep-dive.md`: Comprehensive technical architecture
  - `vizro-schema-analysis.md`: Schema feasibility analysis

**Risk Assessment:**
- **Low Risk**: Schema parsing, form generation, property editing
- **Medium Risk**: Complex nested relationships, dynamic data binding
- **High Risk**: Real-time data integration, custom component extensibility

**Success Metrics Defined:**
- Technical: >95% schema coverage, <2s load time, 100% export fidelity
- UX: <5min time to first dashboard, <5% error rate, >4.5/5 satisfaction

## Next Steps

**Immediate Priorities:**
1. Docker development environment setup (docker-compose + Makefile)
2. Technology stack validation and setup (React + TypeScript + shadcn/ui + Tailwind)
3. Four-panel app layout (Top Bar | Left Form | Central Preview | Right Form)
4. Proof of concept for Dynamic Schema Form Engine (zero hardcoding)
5. Tree Builder and Property Editor form prototypes

**Development Phases Planned:**
- **Phase 1** (4-6 weeks): Core infrastructure and custom form engine
- **Phase 2** (6-8 weeks): Tree Builder and Property Editor forms with JSON output
- **Phase 3** (4-6 weeks): Advanced form features and two-state management
- **Phase 4** (3-4 weeks): Production readiness and testing
- **Phase 5** (Future): WebAssembly preview integration via iframe

---

## Development Log

### 2025-01-26 - Major Architectural Decision: Form-Based Approach
**What was accomplished:**
- Clarified project requirements and interface approach
- Decided against drag-and-drop in favor of form-based interface
- Defined three-panel layout: Tree Builder (Left) | Preview Canvas (Center) | Property Editor (Right)

**Decisions made:**
- **Form-Based Interface**: Clean form interface over drag-and-drop complexity
- **Custom Form Engine**: Avoid limiting JSON form libraries, build tailored solution
- **Dual-Mode System**: Tree building (hierarchy) vs Property editing (details)
- **Schema-Driven**: All forms generated from Vizro JSON Schema

**Rationale:**
- Forms provide more predictable, accessible interface
- Existing JSON form libraries too limiting for complex Vizro schema
- Clear separation between hierarchy building and property editing
- Better suited for complex nested component relationships

**Architecture Updated:**
- Updated all documentation to reflect form-based approach
- Removed drag-and-drop references and libraries
- Added Schema Form Engine as core component
- Defined clear interfaces for Tree Builder and Property Editor

**Next actions:**
- Begin Schema Form Engine prototype
- Design two-panel layout structure with JSON output
- Research form validation patterns for complex schemas

### 2025-01-26 - Preview Strategy: Phased Approach
**What was accomplished:**
- Decided to defer live preview to future phase
- Focus current phase on form-based JSON generation
- Planned WebAssembly + iframe integration for later

**Decisions made:**
- **Current Phase**: Two forms + JSON output (no live preview yet)
- **Future Phase**: WebAssembly preview via backend-generated iframe links
- **JSON-First**: Ensure forms generate valid Vizro JSON before adding preview
- **Simpler Layout**: Left form | Right form + JSON display (not three panels)

**Rationale:**
- Reduces complexity of initial implementation
- Ensures solid foundation before adding preview
- WebAssembly approach will provide better performance than client-side rendering
- Focus on core form engine without preview distractions

**Architecture Updated:**
- Removed live preview from current phase documentation
- Added JSON output display as core component
- Updated layout from three-panel to two-panel + output
- Added future WebAssembly preview phase

**Next actions:**
- Focus on Schema Form Engine and backend validation integration
- Design layout for forms + validated output display
- Plan WebAssembly integration for future phase

### 2025-01-26 - Backend Validation Strategy
**What was accomplished:**
- Clarified validation approach: backend-driven via Pydantic
- Defined API endpoints for combining and validating frontend states
- Updated architecture to reflect validation flow

**Decisions made:**
- **Backend Validation**: Frontend sends raw tree + property states to backend
- **Pydantic Integration**: Use Dashboard.model_validate for validation
- **Minimal Frontend Validation**: Only basic field types and required fields
- **Backend Response**: Return validated config OR detailed validation errors

**Rationale:**
- Ensures 100% compatibility with Vizro schema validation
- Centralizes complex validation logic in Python/Pydantic
- Reduces frontend complexity and bundle size
- Provides authoritative validation source

**API Design:**
```python
@router.post("/api/v1/validate")
async def validate_dashboard(tree_state: ComponentTree, property_state: ComponentProperties) -> ValidationResult:
    """Combine frontend states and validate via Dashboard.model_validate"""
```

**Frontend Flow:**
1. Tree form updates → tree state
2. Property form updates → property state  
3. Send both states to backend `/validate`
4. Backend combines + validates via Pydantic
5. Display validated JSON or validation errors

**Next actions:**
- Define ComponentTree and ComponentProperties data structures
- Implement backend validation endpoint
- Design frontend validation error display

### 2025-01-26 - CRITICAL: Zero Hardcoding Architecture
**What was accomplished:**
- Established absolute requirement: NO hardcoded field names or component types
- Designed schema-driven architecture that works with ANY schema version
- Defined component field registry pattern for extensibility

**CRITICAL Requirements:**
- **Zero Hardcoding**: No field names, component names, or types in code
- **Version Agnostic**: Must work with 0.1.43 → 0.1.44 → future versions automatically
- **Schema Discovery**: All forms generated dynamically from schema analysis
- **Component Registry**: Specific field renderers + generic fallbacks for standard types

**Architecture Patterns:**

**TREE STRUCTURE (ZERO hardcoding allowed):**
```typescript
// ❌ WRONG - Hardcoded tree logic
if (componentType === 'Graph') {
  return <GraphTreeNode />
} else if (componentType === 'Table') {
  return <TableTreeNode />
}

// ✅ RIGHT - Schema-driven tree
const TreeNode = ({ componentSchema, path }) => {
  // Extract ALL possible children from schema - no hardcoding
  const childrenProperties = extractAllChildrenProperties(componentSchema);
  const validChildTypes = extractValidChildTypes(componentSchema);
  const currentChildren = getCurrentChildren(path, childrenProperties);
  
  return (
    <GenericTreeNode 
      schema={componentSchema} 
      childrenProperties={childrenProperties}
      validChildTypes={validChildTypes}
      currentChildren={currentChildren}
    />
  );
};
```

**PROPERTY EDITING (Specific renderers allowed and encouraged):**
```typescript
// ✅ RIGHT - Specific property renderers for complex cases
const GraphPropertyEditor = ({ graphComponent }) => {
  return (
    <div>
      <FigureSelector 
        value={graphComponent.figure} 
        onChange={handleFigureChange}
        options={plotlyExpressCharts} 
      />
      <DataFrameSelector 
        value={graphComponent.data_frame}
        onChange={handleDataFrameChange}
      />
      <ChartArgumentsEditor 
        figure={graphComponent.figure}
        args={graphComponent.chart_args}
        onChange={handleArgsChange}
      />
    </div>
  );
};

// ✅ RIGHT - Registry with specific + fallback pattern
fieldRegistry.registerSpecific(/.*\.graph\.properties/, GraphPropertyEditor);
fieldRegistry.registerSpecific(/.*\.table\.properties/, TablePropertyEditor);
fieldRegistry.registerSpecific(/.*\.card\.properties/, CardPropertyEditor);

// ✅ RIGHT - Generic fallbacks for unknown component types
fieldRegistry.registerGeneric('string', TextInput);
fieldRegistry.registerGeneric('number', NumberInput);
fieldRegistry.registerGeneric('boolean', CheckboxInput);
fieldRegistry.registerGeneric('array', ArrayEditor);
fieldRegistry.registerGeneric('object', ObjectEditor);

// When schema 0.1.44 introduces "NewComponent":
// 1. Tree automatically shows it based on schema structure
// 2. Property editor automatically uses generic fallbacks
// 3. Later, we can add NewComponentPropertyEditor for better UX
```

**Two-Level Architecture:**

**1. TREE STRUCTURE LEVEL (ZERO hardcoding):**
- Schema analysis extracts ALL possible children for each component type
- Schema analysis determines which child types are valid for each parent
- Generic tree rendering based on schema-defined children properties
- Tree knows about ALL children relationships purely from schema
- NO component-specific logic in tree building
- Works with any new component types and relationships in future schemas

**2. PROPERTY EDITING LEVEL (Specific renderers + smart fallbacks):**
- **Known components**: Custom property editors (Graph figure selection, Table formatting, Card styling)
- **Unknown components**: Automatic fallback to generic renderers based on JSON Schema types
- **Progressive enhancement**: Start with fallbacks, add specific renderers later for better UX
- **Registry system**: Maps schema patterns to renderers with graceful degradation

**Perfect Future-Proofing:**
When schema 0.1.44 introduces "VideoComponent":
1. **Tree**: Automatically handles it (schema-driven structure)
2. **Properties**: Uses generic fallbacks (string → TextInput, boolean → Checkbox)
3. **Later**: Add VideoPropertyEditor for rich video configuration UI
4. **Zero breaking changes**: App continues working immediately

**Success Metric:**
When schema 0.1.44 is released, the application should:
1. Load new schema automatically
2. Generate forms for any new component types
3. Handle new properties without code changes
4. Use appropriate renderers (specific or generic)
5. Maintain full functionality with ZERO code modifications

**Next actions:**
- Design component field registry architecture
- Implement schema analysis and extraction utilities
- Create dynamic form generation engine prototype

### 2025-01-26 - Docker-Based Development Strategy
**What was accomplished:**
- Decided to use Docker-based development from day one
- Designed docker-compose setup for all services
- Created Makefile for convenient development commands

**Decisions made:**
- **Docker Development**: All services containerized from start
- **Makefile Interface**: Simple commands (`make up`, `make test`, etc.)
- **Environment Consistency**: Same containers for dev/staging/production
- **Service Isolation**: Frontend, Backend, PostgreSQL, Redis in separate containers

**Architecture Benefits:**
- **No Environment Issues**: Identical setup across all developers
- **Easy Onboarding**: New developers just need `make up`
- **Deployment Ready**: Production images built from same Dockerfiles
- **Service Management**: Easy debugging and log viewing per service
- **Database Management**: Automated PostgreSQL setup and migrations

**Development Workflow:**
```bash
# Start entire stack
make up

# View logs
make logs-backend
make logs-frontend

# Run tests
make test

# Database operations
make migrate
make seed
make db-reset
```

**Production Benefits:**
- Same containers used in development and production
- Infrastructure as code with docker-compose files
- Easy scaling and orchestration
- No deployment surprises or environment differences

**Next actions:**
- Create initial docker-compose.yml and Dockerfiles
- Set up Makefile with all development commands
- Test Docker development workflow

### 2025-01-26 - Real-Time Validation Architecture
**What was accomplished:**
- Clarified validation approach: real-time backend validation with debouncing
- Designed validation state management and visual indicators
- Updated architecture documentation with implementation details

**Decisions made:**
- **Real-Time Validation**: Debounced validation on every form change (500ms delay)
- **Visual Feedback**: Validation indicators throughout UI (⏳ validating, ✅ valid, ❌ invalid, ◯ not validated)
- **Frontend State Only**: No JSON Schema validation on frontend since only combined states are valid
- **Pydantic Errors**: Display detailed validation errors from backend in UI

**Rationale:**
- Only combined tree + property states form valid Vizro dashboard
- Frontend cannot validate individual form states against schema
- Real-time feedback improves user experience
- Debouncing prevents excessive API calls during typing

**Implementation Pattern:**
```typescript
// Watch form changes and trigger debounced validation
const treeState = watch();
useEffect(() => {
  debouncedValidate(treeState, propertyState);
}, [treeState, propertyState]);
```

**Next actions:**
- Implement useRealtimeValidation hook
- Create ValidationIndicator component
- Design backend validation API endpoint

### [Date] - [Milestone/Feature]
*Template for future entries*

**What was accomplished:**
- 

**Decisions made:**
- 

**Challenges encountered:**
- 

**Solutions implemented:**
- 

**Next actions:**
- 

---

## Key Decisions

### Decision 1: Form-Based Interface Over Drag-and-Drop
**Date:** 2025-01-26  
**Context:** Need intuitive interface for building complex Vizro dashboards  
**Decision:** Form-based interface with three-panel layout instead of drag-and-drop  
**Rationale:** More predictable, accessible, better for complex nested structures  
**Alternatives considered:** Drag-and-drop canvas, hybrid approach  

### Decision 2: Custom Schema Form Engine
**Date:** 2025-01-26  
**Context:** Need dynamic forms from JSON Schema, existing libraries too limiting  
**Decision:** Build custom form engine rather than use existing JSON form libraries  
**Rationale:** Full control over UX, better support for Vizro-specific patterns  
**Alternatives considered:** React JSON Schema Form, Formly, other JSON form libraries  

### Decision 3: Dual-Mode System (Tree vs Properties)
**Date:** 2025-01-26  
**Context:** Clear separation needed between hierarchy building and property editing  
**Decision:** Left panel for tree building, right panel for property editing  
**Rationale:** Reduces cognitive load, clearer user mental model, focused workflows  
**Alternatives considered:** Single unified form, tabbed interface  

### Decision 4: Schema-Driven Development Approach
**Date:** 2025-01-26  
**Context:** Need to ensure 100% compatibility with existing Vizro runtime  
**Decision:** Build all UI components directly from JSON Schema definitions  
**Rationale:** Guarantees compatibility, reduces maintenance, enables dynamic form generation  
**Alternatives considered:** Manual component definitions, hybrid approach  

### Decision 5: React + TypeScript Frontend
**Date:** 2025-01-26  
**Context:** Need modern, maintainable frontend with good tooling  
**Decision:** React 18 + TypeScript with Zustand state management  
**Rationale:** Strong ecosystem, TypeScript safety, Zustand simplicity over Redux  
**Alternatives considered:** Vue.js, Svelte, Redux Toolkit

### Decision 7: shadcn/ui + Tailwind CSS
**Date:** 2025-01-26  
**Context:** Need high-quality, customizable UI components for forms  
**Decision:** shadcn/ui component library with Tailwind CSS  
**Rationale:** Excellent form components, highly customizable, copy-paste approach, modern design, great TypeScript support  
**Alternatives considered:** Mantine, Chakra UI, Ant Design, headless UI  

### Decision 6: FastAPI Backend
**Date:** 2025-01-26  
**Context:** Need async Python backend with good API documentation  
**Decision:** FastAPI with Pydantic validation  
**Rationale:** Async support, auto-generated docs, excellent Pydantic integration  
**Alternatives considered:** Django REST, Flask, Node.js  

---

## Technical Debt & Known Issues

*To be populated as development progresses*

---

## Performance Observations

*To be populated during implementation*

---

## Testing Approach

*To be defined during Phase 1 implementation*