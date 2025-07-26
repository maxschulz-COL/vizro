# Vizro GUI Builder - Architecture Deep Dive

## System Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Vizro GUI Builder                        │
├─────────────────────────────────────────────────────────────┤
│  Frontend (React/TypeScript)                               │
│  ├── Tree Builder Form (Left Panel)                       │
│  ├── Live Preview Canvas (Center)                         │
│  ├── Property Editor Form (Right Panel)                   │
│  ├── Schema Form Engine                                    │
│  └── Configuration Export/Import                           │
├─────────────────────────────────────────────────────────────┤
│  Backend Services (FastAPI/Python)                         │
│  ├── Schema Validation Service                             │
│  ├── Dashboard Preview Generator                           │
│  ├── Template Management                                   │
│  └── Configuration Persistence                             │
├─────────────────────────────────────────────────────────────┤
│  Data Layer                                                │
│  ├── PostgreSQL (Dashboards, Templates, Users)            │
│  ├── Redis (Session State, Preview Cache)                 │
│  └── S3/MinIO (Assets, Exports)                           │
└─────────────────────────────────────────────────────────────┘
```

## Frontend Architecture

### Technology Stack
- **Framework**: React 18 + TypeScript
- **State Management**: Zustand (lightweight, performant)
- **UI Framework**: Mantine or Chakra UI (component consistency)
- **Form Generation**: Custom schema-driven forms (avoiding limiting JSON form libraries)
- **Form Handling**: React Hook Form + JSON Schema validation
- **Layout**: CSS Grid/Flexbox for three-panel layout (Left Form | Center Canvas | Right Form)
- **Build Tool**: Vite (fast development, modern bundling)

### Component Architecture

#### 1. Tree Builder Form (Left Panel)
```typescript
interface TreeBuilderForm {
  // Component hierarchy state
  dashboardConfig: VizroDashboard;
  selectedComponentPath: ComponentPath | null;
  
  // Tree building operations
  addComponent(parentPath: ComponentPath, type: ComponentType): void;
  removeComponent(path: ComponentPath): void;
  moveComponent(fromPath: ComponentPath, toPath: ComponentPath): void;
  selectComponent(path: ComponentPath): void;
  
  // Schema-driven form generation
  renderAddComponentForm(parentSchema: JSONSchema): ReactElement;
  getAvailableChildTypes(parentType: ComponentType): ComponentType[];
}
```

**Key Features:**
- Schema-driven component addition forms
- Hierarchical component tree visualization
- Context-aware component type filtering
- Real-time validation for tree structure

#### 2. Property Editor Form (Right Panel)
```typescript
interface PropertyEditorForm {
  selectedComponent: Component | null;
  schemaDefinition: JSONSchema;
  validationErrors: ValidationError[];
  
  // Property editing (non-children properties only)
  updateProperty(path: string, value: any): void;
  validateProperty(path: string, value: any): ValidationResult;
  
  // Custom form generation from schema
  renderPropertyForm(schema: JSONSchema): ReactElement;
  handleConditionalProperties(dependencies: SchemaDependencies): void;
}
```

**Advanced Features:**
- Custom form fields generated from JSON Schema
- Conditional property visibility based on other field values
- Inline validation with helpful error messages
- Excludes children/hierarchy properties (handled by Tree Builder)

#### 3. Schema Form Engine
```typescript
interface SchemaFormEngine {
  // Core form generation
  generateFormFromSchema(schema: JSONSchema): FormDefinition;
  renderFormField(fieldSchema: JSONSchemaProperty): ReactElement;
  
  // Custom field types
  registerCustomField(type: string, renderer: FieldRenderer): void;
  getFieldRenderer(type: string): FieldRenderer;
  
  // Validation
  validateFieldValue(value: any, schema: JSONSchemaProperty): ValidationResult;
  validateFormData(data: object, schema: JSONSchema): ValidationResult;
}
```

**Design Goals:**
- Avoid limitations of existing JSON form libraries
- Custom field renderers for complex Vizro-specific types
- Better UX than generic form solutions
- Full control over validation and error display

#### 4. Live Preview Canvas (Center)
```typescript
interface PreviewCanvas {
  previewMode: 'desktop' | 'tablet' | 'mobile';
  previewData: DataSource[];
  
  // Preview generation
  generatePreview(config: VizroDashboard): Promise<PreviewResult>;
  updatePreviewData(dataSource: DataSource): void;
  
  // Real-time sync with forms
  syncWithTreeChanges(treeChanges: ComponentTreeChange[]): void;
  syncWithPropertyChanges(propertyChanges: PropertyChange[]): void;
  
  // Visual feedback
  highlightSelectedComponent(componentPath: ComponentPath): void;
  showValidationErrors(errors: ValidationError[]): void;
}
```

**Key Features:**
- Real-time preview updates from both left and right forms
- Component highlighting when selected in tree
- Visual validation error display
- Responsive preview modes

### State Management Strategy

#### Global State (Zustand)
```typescript
interface AppState {
  // Dashboard configuration
  dashboard: VizroDashboard;
  updateDashboard: (updates: Partial<VizroDashboard>) => void;
  
  // UI state - two-mode system
  mode: 'tree-building' | 'property-editing';
  selectedComponentPath: ComponentPath | null;
  activePanel: 'tree' | 'properties' | 'both';
  
  // Tree building state
  expandedTreeNodes: ComponentPath[];
  availableComponentTypes: ComponentType[];
  
  // Property editing state  
  editingProperties: Record<string, any>;
  propertyValidationErrors: ValidationError[];
  
  // History management
  history: DashboardSnapshot[];
  historyIndex: number;
  undo: () => void;
  redo: () => void;
  
  // Validation
  globalValidationErrors: ValidationError[];
  validateDashboard: () => Promise<ValidationResult>;
}
```

#### Component-Level State
- Local form state for tree building operations
- Local form state for property editing
- Preview loading and error states
- Form validation states per panel

## Backend Architecture

### Technology Stack
- **Framework**: FastAPI (async, auto-docs, type hints)
- **Database**: PostgreSQL + SQLAlchemy (robust relational data)
- **Cache**: Redis (session state, preview caching)
- **Validation**: Pydantic (schema validation, data parsing)
- **Queue**: Celery + Redis (async preview generation)
- **Storage**: S3/MinIO (file assets, exports)

### API Design

#### 1. Schema Management
```python
@router.get("/api/v1/schema/{version}")
async def get_schema(version: str) -> JSONSchema:
    """Get Vizro schema for specific version"""

@router.post("/api/v1/validate")
async def validate_dashboard(config: VizroDashboard) -> ValidationResult:
    """Validate dashboard configuration"""
```

#### 2. Dashboard Operations
```python
@router.post("/api/v1/dashboards")
async def create_dashboard(dashboard: DashboardCreate) -> Dashboard:
    """Create new dashboard"""

@router.put("/api/v1/dashboards/{dashboard_id}")
async def update_dashboard(dashboard_id: UUID, updates: DashboardUpdate) -> Dashboard:
    """Update dashboard configuration"""

@router.post("/api/v1/dashboards/{dashboard_id}/preview")
async def generate_preview(dashboard_id: UUID, data: PreviewData) -> PreviewResult:
    """Generate dashboard preview with data"""
```

#### 3. Template System
```python
@router.get("/api/v1/templates")
async def list_templates(category: str = None) -> List[Template]:
    """List available dashboard templates"""

@router.post("/api/v1/templates")
async def create_template(template: TemplateCreate) -> Template:
    """Create dashboard template"""
```

### Data Models

#### Core Models
```python
class Dashboard(BaseModel):
    id: UUID
    name: str
    description: Optional[str]
    config: VizroDashboard  # Full Vizro configuration
    created_at: datetime
    updated_at: datetime
    created_by: UUID
    
class Template(BaseModel):
    id: UUID
    name: str
    description: str
    category: str
    config: VizroDashboard
    preview_image: Optional[str]
    tags: List[str]
    
class PreviewSession(BaseModel):
    id: UUID
    dashboard_id: UUID
    data_sources: List[DataSource]
    expires_at: datetime
```

### Preview Generation System

#### Architecture
```python
class PreviewGenerator:
    def __init__(self, redis_client: Redis, vizro_runner: VizroRunner):
        self.cache = redis_client
        self.runner = vizro_runner
    
    async def generate_preview(
        self, 
        config: VizroDashboard, 
        data: Dict[str, DataFrame]
    ) -> PreviewResult:
        # 1. Validate configuration
        validation = await self.validate_config(config)
        if not validation.is_valid:
            return PreviewResult(errors=validation.errors)
        
        # 2. Check cache
        cache_key = self.get_cache_key(config, data)
        cached = await self.cache.get(cache_key)
        if cached:
            return PreviewResult.parse_raw(cached)
        
        # 3. Generate preview
        preview = await self.runner.generate_preview(config, data)
        
        # 4. Cache result
        await self.cache.setex(
            cache_key, 
            timedelta(minutes=10), 
            preview.json()
        )
        
        return preview
```

## Critical Design Decisions

### 1. Real-time Collaboration
**Decision**: WebSocket-based real-time sync for multi-user editing
**Implementation**:
- Socket.IO for reliable WebSocket communication
- Operational Transform (OT) for conflict resolution
- Component-level locking to prevent conflicts

### 2. Performance Optimization
**Decisions**:
- **Canvas Virtualization**: Only render visible components
- **Debounced Updates**: Batch property changes
- **Preview Caching**: Cache generated previews with TTL
- **Lazy Loading**: Load component schemas on-demand

### 3. Extensibility Architecture
**Plugin System**:
```typescript
interface ComponentPlugin {
  type: string;
  schema: JSONSchema;
  renderer: ComponentRenderer;
  propertyEditor: PropertyEditor;
  validator?: CustomValidator;
}

class PluginRegistry {
  register(plugin: ComponentPlugin): void;
  getComponent(type: string): ComponentPlugin;
  listComponents(): ComponentPlugin[];
}
```

### 4. Data Integration Strategy
**Approach**: Mock data for prototyping + real data connection
```typescript
interface DataSource {
  id: string;
  type: 'mock' | 'csv' | 'api' | 'database';
  connection: ConnectionConfig;
  schema: DataSchema;
}
```

## Security Considerations

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (Admin, Editor, Viewer)
- Dashboard-level permissions

### Data Security
- Input sanitization for all user content
- SQL injection prevention (parameterized queries)
- XSS protection in preview generation
- File upload restrictions and scanning

### Infrastructure Security
- HTTPS enforcement
- CORS configuration
- Rate limiting on API endpoints
- Secure session management

## Deployment Architecture

### Container Strategy
```yaml
services:
  frontend:
    image: vizro-gui-frontend:latest
    ports: ["3000:3000"]
    
  backend:
    image: vizro-gui-backend:latest
    ports: ["8000:8000"]
    depends_on: [postgres, redis]
    
  postgres:
    image: postgres:15
    volumes: ["postgres_data:/var/lib/postgresql/data"]
    
  redis:
    image: redis:7-alpine
    
  nginx:
    image: nginx:alpine
    ports: ["80:80", "443:443"]
    volumes: ["./nginx.conf:/etc/nginx/nginx.conf"]
```

### Scaling Considerations
- **Horizontal scaling**: Stateless backend services
- **Database scaling**: Read replicas for dashboard queries
- **Cache scaling**: Redis Cluster for high availability
- **CDN integration**: Static assets and preview images

## Development Phases

### Phase 1: Core Infrastructure (4-6 weeks)
- Three-panel layout (Left Form | Center Canvas | Right Form)
- Custom Schema Form Engine (avoiding limiting JSON form libraries)
- Backend API structure
- Database models and migrations

### Phase 2: Form-Based Component System (6-8 weeks)
- Tree Builder Form (left panel) for component hierarchy
- Property Editor Form (right panel) for component details
- Live preview canvas with real-time updates
- Basic validation and error handling

### Phase 3: Advanced Form Features (4-6 weeks)
- Complex nested component relationships
- Conditional form fields based on schema dependencies
- Two-state management (tree building vs property editing)
- Template system and configuration export

### Phase 4: Production Readiness (3-4 weeks)
- Comprehensive form validation
- Performance optimization for large dashboards
- Security hardening
- Documentation and user guides

**Total Estimated Timeline: 17-24 weeks (4-6 months)**

This architecture provides a solid foundation for building a production-grade Vizro GUI builder that can scale with user needs while maintaining performance and reliability.