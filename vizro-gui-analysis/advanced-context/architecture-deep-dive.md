# Vizro GUI Builder - Architecture Deep Dive

## System Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Vizro GUI Builder                        │
├─────────────────────────────────────────────────────────────┤
│  Frontend Layout (React/TypeScript + shadcn/ui)            │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ Top Navigation Bar (Login, Save, Export, etc.)         │ │
│  ├─────────────────┬─────────────────┬─────────────────────┤ │
│  │ Tree Builder    │ Central Preview │ Property Editor     │ │
│  │ Form            │ (JSON/YAML +    │ Form                │ │
│  │ (Left Panel)    │ Future: iframe) │ (Right Panel)       │ │
│  │                 │ (Center Panel)  │                     │ │
│  └─────────────────┴─────────────────┴─────────────────────┘ │
│  Components: Schema Form Engine, Export/Import             │
├─────────────────────────────────────────────────────────────┤
│  Backend Services (FastAPI/Python)                         │
│  ├── Authentication & User Management                      │
│  ├── Schema Validation Service                             │
│  ├── JSON Configuration Generator                          │
│  ├── Template Management                                   │
│  ├── Configuration Persistence                             │
│  └── [Future] WebAssembly Preview Link Generator           │
├─────────────────────────────────────────────────────────────┤
│  Data Layer                                                │
│  ├── PostgreSQL (Dashboards, Templates, Users)            │
│  ├── Redis (Session State)                                │
│  └── S3/MinIO (Assets, Exports)                           │
└─────────────────────────────────────────────────────────────┘
```

## Frontend Architecture

### Technology Stack
- **Framework**: React 18 + TypeScript
- **State Management**: Zustand (lightweight, performant)
- **UI Framework**: shadcn/ui + Tailwind CSS (modern, customizable, excellent form components)
- **Form Generation**: Custom schema-driven forms (avoiding limiting JSON form libraries)
- **Form Handling**: React Hook Form + real-time backend validation (debounced)
- **Layout**: CSS Grid with Tailwind for app layout (Top Bar | Left Form | Central Preview | Right Form)
- **Build Tool**: Vite (fast development, modern bundling)

### Component Architecture

#### 0. Top Navigation Bar
```typescript
interface TopNavigationBar {
  // User authentication
  user: User | null;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
  
  // Dashboard management
  currentDashboard: Dashboard | null;
  saveDashboard: () => Promise<void>;
  loadDashboard: (id: string) => Promise<void>;
  newDashboard: () => void;
  
  // User account navigation
  openDashboardLibrary: () => void;
  openDatasetManager: () => void;
  openAccountSettings: () => void;
  
  // Export/Import
  exportConfig: (format: 'json' | 'yaml') => void;
  importConfig: (file: File) => Promise<void>;
  
  // Application settings
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}
```

**Key Features:**
- User authentication and account management
- Dashboard save/load/new operations
- Quick access to dashboard library and dataset manager
- Configuration export/import functionality
- Theme toggle and application settings
- Responsive design for different screen sizes

#### 1. Tree Builder Form (Left Panel) - SCHEMA DRIVEN
```typescript
interface TreeBuilderForm {
  // Current schema and extracted metadata
  currentSchema: JSONSchema;
  componentDefinitions: Map<string, ComponentDefinition>;
  
  // Component hierarchy state (derived from schema)
  dashboardConfig: any; // Dynamic structure based on schema
  selectedComponentPath: ComponentPath | null;
  
  // Dynamic tree building operations (NO hardcoded types)
  addComponent(parentPath: ComponentPath, componentType: string): void;
  removeComponent(path: ComponentPath): void;
  moveComponent(fromPath: ComponentPath, toPath: ComponentPath): void;
  selectComponent(path: ComponentPath): void;
  
  // Schema-driven form generation (ZERO hardcoding)
  renderAddComponentForm(parentSchemaPath: string): ReactElement;
  getAvailableChildTypes(parentSchemaPath: string): string[];
  extractHierarchicalFields(componentSchema: JSONSchemaDefinition): HierarchicalField[];
  
  // Schema analysis for tree structure
  isContainerComponent(componentType: string): boolean;
  getChildrenProperty(componentType: string): string | null;
  getComponentDisplayName(componentType: string): string;
}
```

**CRITICAL Features - NO HARDCODING:**
- **Schema Discovery**: Extract all component types from schema dynamically
- **Dynamic Hierarchy**: Determine parent-child relationships from schema definitions
- **Context-Aware Filtering**: Use schema to determine valid child types for any parent
- **Flexible Tree Structure**: Adapt to any schema changes automatically
- **Generic Component Handling**: No hardcoded knowledge of "Graph", "Table", etc.

#### 2. Property Editor Form (Right Panel) - SCHEMA DRIVEN
```typescript
interface PropertyEditorForm {
  // Current schema and component context
  currentSchema: JSONSchema;
  selectedComponentType: string | null;
  selectedComponentPath: ComponentPath | null;
  
  // Dynamic property extraction (NO hardcoded properties)
  componentPropertySchema: JSONSchemaDefinition | null;
  excludedFields: string[]; // Children fields excluded dynamically
  
  // Property editing (non-children properties only)
  updateProperty(propertyPath: string, value: any): void;
  validateProperty(propertyPath: string, value: any): ValidationResult;
  
  // Schema-driven form generation (ZERO hardcoding)
  renderPropertyForm(componentSchemaPath: string): ReactElement;
  extractNonHierarchicalFields(componentSchema: JSONSchemaDefinition): PropertyField[];
  handleConditionalProperties(dependencies: SchemaDependencies): void;
  
  // Dynamic field discovery
  getPropertyFields(componentType: string): PropertyField[];
  isHierarchicalField(fieldName: string, fieldSchema: JSONSchemaProperty): boolean;
  getFieldDisplayName(fieldPath: string, fieldSchema: JSONSchemaProperty): string;
}
```

**CRITICAL Features - NO HARDCODING:**
- **Dynamic Property Discovery**: Extract all non-hierarchical properties from schema
- **Automatic Field Exclusion**: Dynamically identify and exclude children/hierarchy fields
- **Schema-Driven Forms**: Generate forms for ANY component type without hardcoded knowledge
- **Conditional Logic**: Handle schema-defined conditional properties dynamically
- **Field Type Mapping**: Map schema types to appropriate form controls automatically

#### 3. Dynamic Schema Form Engine (ZERO HARDCODING)
```typescript
interface SchemaFormEngine {
  // Schema loading and parsing
  loadSchema(version: string): Promise<JSONSchema>;
  parseSchemaDefinitions(schema: JSONSchema): ComponentDefinitions;
  
  // Dynamic form generation (NO hardcoded field names)
  generateFormFromSchema(schemaDefinition: JSONSchemaDefinition): FormDefinition;
  renderFormField(fieldSchema: JSONSchemaProperty, fieldPath: string): ReactElement;
  
  // Component field registry (specific + fallback)
  registerSpecificField(schemaPattern: string, renderer: FieldRenderer): void;
  registerGenericField(jsonSchemaType: string, renderer: FieldRenderer): void;
  getFieldRenderer(fieldSchema: JSONSchemaProperty): FieldRenderer;
  
  // Schema analysis
  extractComponentTypes(schema: JSONSchema): ComponentType[];
  getFieldProperties(componentType: string): PropertySchema[];
  getChildrenFields(componentType: string): ChildrenSchema[];
  
  // Version agnostic validation
  validateFieldValue(value: any, schema: JSONSchemaProperty): ValidationResult;
  validateFormData(data: object, schema: JSONSchema): ValidationResult;
}
```

**CRITICAL Design Goals:**
- **ZERO HARDCODING**: No field names, component names, or types hardcoded
- **Schema Version Agnostic**: Works with 0.1.43, 0.1.44, future versions automatically
- **Two-Level Architecture**:
  - **Tree Level**: ZERO hardcoding - purely schema-driven hierarchy
  - **Property Level**: Specific renderers encouraged for complex components
- **Component Registry Pattern**: 
  - Specific renderers for complex property editing (e.g., Graph figure selection with Plotly Express charts)
  - Generic fallbacks for standard types (string → TextInput, number → NumberInput)
- **Schema-Driven Discovery**: Extract all component types and properties from schema
- **Extensible**: Easy to add new specific property renderers without touching tree logic

**Example - Graph Component:**
- **Tree Level**: Generic handling - schema determines if Graph can have children
- **Property Level**: Custom GraphPropertyEditor with figure selection, data_frame picker, chart arguments

#### 4. Central Preview Panel
```typescript
interface CentralPreviewPanel {
  // Current states from forms
  treeState: ComponentTree;
  propertyState: ComponentProperties;
  
  // Real-time validation state
  validationState: {
    isValid: boolean | null; // null = not checked, true = valid, false = invalid
    errors: ValidationError[];
    isValidating: boolean;
  };
  
  viewMode: 'json' | 'yaml' | 'preview'; // preview for future iframe
  
  // Real-time debounced validation
  debouncedValidate: (treeData: ComponentTree, propertyData: ComponentProperties) => void;
  
  // Output formatting (after backend validation)
  formatJSON: (config: VizroDashboard) => string;
  formatYAML: (config: VizroDashboard) => string;
  
  // Display controls
  toggleViewMode: (mode: 'json' | 'yaml' | 'preview') => void;
  copyToClipboard: (content: string) => void;
  
  // Future: iframe preview
  previewURL: string | null;
  refreshPreview: () => void;
}
```

**Current Phase Features:**
- Real-time form validation with visual feedback
- Debounced API calls (500ms) to prevent excessive requests
- Visual validation indicators throughout the UI
- Backend combines states and validates via Dashboard.model_validate
- Display validated JSON/YAML output from backend
- Show validation errors with line numbers and field paths
- View mode toggle (JSON/YAML)
- Copy to clipboard functionality

**Real-Time Validation Flow:**
1. Frontend forms update tree/property states
2. Debounced trigger (500ms) sends both states to backend `/validate` endpoint  
3. Backend combines states and runs Dashboard.model_validate
4. Return validated config OR detailed validation errors
5. Frontend displays validation status with visual indicators:
   - ⏳ Validating... (during API call)
   - ✅ Valid (configuration is complete and valid)
   - ❌ Invalid (with detailed Pydantic error messages)
   - ◯ Not validated (initial state)

#### Real-Time Validation Implementation
```typescript
// Custom hook for real-time validation
const useRealtimeValidation = () => {
  const [validationState, setValidationState] = useState({
    isValid: null, // null = not checked, true = valid, false = invalid
    errors: [],
    isValidating: false
  });

  const debouncedValidate = useCallback(
    debounce(async (treeState, propertyState) => {
      setValidationState(prev => ({ ...prev, isValidating: true }));
      
      try {
        const result = await validateWithBackend(treeState, propertyState);
        setValidationState({
          isValid: result.isValid,
          errors: result.errors || [],
          isValidating: false
        });
      } catch (error) {
        setValidationState({
          isValid: false,
          errors: [{ message: 'Validation failed' }],
          isValidating: false
        });
      }
    }, 500), // 500ms delay
    []
  );

  return { validationState, debouncedValidate };
};

// Validation indicator component
const ValidationIndicator = ({ state }) => {
  if (state.isValidating) {
    return <span className="text-yellow-500">⏳ Validating...</span>;
  }
  
  if (state.isValid === true) {
    return <span className="text-green-500">✅ Valid</span>;
  }
  
  if (state.isValid === false) {
    return (
      <div>
        <span className="text-red-500">❌ Invalid</span>
        <ul className="text-red-400 text-sm">
          {state.errors.map(error => (
            <li key={error.path}>{error.message}</li>
          ))}
        </ul>
      </div>
    );
  }
  
  return <span className="text-gray-400">◯ Not validated</span>;
};

// Form integration
const TreeBuilderForm = () => {
  const { register, watch } = useForm();
  const { validationState, debouncedValidate } = useRealtimeValidation();
  const treeState = watch(); // Watch all form changes

  useEffect(() => {
    // Trigger validation on any form change
    debouncedValidate(treeState, propertyState);
  }, [treeState, propertyState, debouncedValidate]);

  return (
    <form>
      <ValidationIndicator state={validationState} />
      <input {...register("componentType")} />
      {/* Form fields */}
    </form>
  );
};
```

**Future Phase Features:**
- Live dashboard preview via iframe
- Backend-generated WebAssembly preview links

#### 5. User Account Management System
```typescript
interface UserAccountSystem {
  // Dashboard library
  userDashboards: Dashboard[];
  createDashboard: (name: string, config: VizroDashboard) => Promise<Dashboard>;
  updateDashboard: (id: string, config: VizroDashboard) => Promise<Dashboard>;
  deleteDashboard: (id: string) => Promise<void>;
  duplicateDashboard: (id: string, newName: string) => Promise<Dashboard>;
  
  // Dataset management
  userDatasets: Dataset[];
  uploadDataset: (file: File, name: string) => Promise<Dataset>;
  renameDataset: (id: string, newName: string) => Promise<Dataset>;
  deleteDataset: (id: string) => Promise<void>;
  getDatasetInfo: (id: string) => Promise<DatasetInfo>;
  
  // Account settings
  updateUserProfile: (profile: UserProfile) => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  
  // Usage limits
  checkStorageLimit: () => Promise<StorageUsage>;
  checkUploadLimit: (fileSize: number) => boolean;
}

interface Dataset {
  id: string;
  name: string;
  filename: string;
  size: number;
  uploadedAt: Date;
  columns: string[];
  rowCount: number;
  userId: string;
}

interface Dashboard {
  id: string;
  name: string;
  description?: string;
  config: VizroDashboard;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  isPublic: boolean;
}
```

**Key Features:**
- **Dashboard Library**: Save, load, organize, and share dashboards
- **Dataset Management**: Upload CSV/Excel files with naming and organization
- **Storage Limits**: Configurable limits per user (e.g., 50MB total, 10MB per file)
- **Data References**: Datasets can be referenced by name in dashboard configurations
- **Account Settings**: Profile management and preferences

#### 6. Data Upload & Management
```typescript
interface DataUploadSystem {
  // File upload
  uploadFile: (file: File, name: string) => Promise<UploadResult>;
  validateFile: (file: File) => ValidationResult;
  
  // Supported formats
  supportedFormats: ['csv', 'xlsx', 'json'];
  maxFileSize: number; // e.g., 10MB
  maxTotalStorage: number; // e.g., 50MB per user
  
  // Data processing
  parseCSV: (file: File) => Promise<DataPreview>;
  parseExcel: (file: File) => Promise<DataPreview>;
  inferDataTypes: (data: any[][]) => ColumnInfo[];
  
  // Dataset referencing
  getDatasetReference: (datasetId: string) => string; // Returns name for use in configs
  listAvailableDatasets: (userId: string) => Dataset[];
}

interface DataPreview {
  columns: string[];
  types: Record<string, 'string' | 'number' | 'date' | 'boolean'>;
  sampleRows: any[][];
  totalRows: number;
}
```

**Upload Workflow:**
1. User selects file (CSV/Excel)
2. Client validates file size and format
3. Preview data with column detection
4. User confirms dataset name
5. Upload to backend with processing
6. Dataset becomes available for reference in dashboards

#### 7. Configuration Import/Export System
```typescript
interface ConfigImportExport {
  // Import existing configs
  parseVizroConfig: (config: string | object) => Promise<ParseResult>;
  buildFormStateFromConfig: (config: VizroDashboard) => FormState;
  validateImportedConfig: (config: any) => ValidationResult;
  
  // Export current state
  exportCurrentConfig: (format: 'json' | 'yaml') => string;
  generateConfigFromFormState: (formState: FormState) => VizroDashboard;
  
  // File handling
  importFromFile: (file: File) => Promise<ImportResult>;
  exportToFile: (config: VizroDashboard, filename: string) => void;
}

interface FormState {
  treeState: ComponentTree;
  propertyState: ComponentProperties;
  selectedPath: ComponentPath | null;
}

interface ParseResult {
  success: boolean;
  formState?: FormState;
  errors?: ValidationError[];
  warnings?: string[];
}
```

**Key Features:**
- **Bi-directional Conversion**: Config ↔ Form State
- **Import Validation**: Ensure imported configs are valid
- **Error Handling**: Clear feedback on import issues
- **Format Support**: JSON and YAML import/export

#### 8. History & Undo/Redo System
```typescript
interface HistoryManager {
  // History stack
  history: HistoryEntry[];
  currentIndex: number;
  maxHistorySize: number;
  
  // History operations
  pushState: (state: FormState, action: string) => void;
  undo: () => FormState | null;
  redo: () => FormState | null;
  canUndo: () => boolean;
  canRedo: () => boolean;
  
  // History management
  clearHistory: () => void;
  getHistoryPreview: () => HistoryPreview[];
  jumpToState: (index: number) => FormState;
}

interface HistoryEntry {
  id: string;
  timestamp: Date;
  action: string; // "Add Component", "Update Property", "Delete Component"
  state: FormState;
  preview?: string; // Brief description of changes
}
```

**Key Features:**
- **Action Tracking**: Record what changed with each edit
- **State Snapshots**: Full form state at each step
- **History Navigation**: Jump to any previous state
- **Memory Management**: Limit history size to prevent memory issues

#### 9. Future: GenAI Assistant System
```typescript
interface GenAIAssistant {
  // AI suggestion context
  currentContext: {
    formState: FormState;
    selectedComponent?: ComponentPath;
    userDatasets: Dataset[];
    vizroSchema: JSONSchema;
  };
  
  // AI interactions
  generateSuggestion: (prompt: string, context: AIContext) => Promise<AISuggestion>;
  previewSuggestion: (suggestion: AISuggestion) => PreviewResult;
  applySuggestion: (suggestion: AISuggestion) => FormState;
  
  // Suggestion types
  suggestComponentImprovement: (componentPath: ComponentPath) => Promise<AISuggestion>;
  suggestPageLayout: (pageContext: PageContext) => Promise<AISuggestion>;
  suggestDashboardStructure: (requirements: string) => Promise<AISuggestion>;
  
  // UI integration
  showAIButton: (level: 'dashboard' | 'page' | 'component') => boolean;
  getAIPromptTemplate: (level: string) => string;
}

interface AISuggestion {
  id: string;
  type: 'component' | 'page' | 'dashboard';
  description: string;
  changes: FormStateChange[];
  confidence: number;
  reasoning: string;
  previewConfig?: VizroDashboard;
}

interface AIContext {
  currentConfig: VizroDashboard;
  availableDatasets: Dataset[];
  userIntent: string;
  targetComponent?: ComponentPath;
}
```

**Planned AI Features:**
- **Component-Level AI**: Click AI button on any component for improvement suggestions
- **Page-Level AI**: Suggest layout improvements for entire pages
- **Dashboard-Level AI**: High-level structure and navigation suggestions
- **Data-Aware**: AI considers available user datasets when making suggestions
- **Preview Workflow**: Show AI suggestion → User reviews → Accept/Revert
- **Context-Aware**: AI understands current dashboard state and Vizro capabilities

**AI Integration Points:**
```typescript
// Component level - AI button next to each component
<ComponentEditor>
  <AIButton 
    onClick={() => suggestComponentImprovement(componentPath)}
    level="component" 
  />
</ComponentEditor>

// Page level - AI button in page header
<PageHeader>
  <AIButton 
    onClick={() => suggestPageLayout(pageContext)}
    level="page" 
  />
</PageHeader>

// Dashboard level - AI button in top navigation
<TopNavigation>
  <AIButton 
    onClick={() => suggestDashboardStructure(userPrompt)}
    level="dashboard" 
  />
</TopNavigation>
```

#### 10. Future: WebAssembly Preview
```typescript
interface WebAssemblyPreview {
  previewURL: string | null;
  
  // Preview generation (future phase)
  requestPreviewLink(config: VizroDashboard): Promise<string>;
  refreshPreview(): void;
  
  // iframe integration
  renderPreviewIFrame(url: string): ReactElement;
}
```

**Planned Features:**
- Backend-generated WebAssembly preview links
- iframe integration for live dashboard preview
- Real-time updates when configuration changes

### State Management Strategy

#### Global State (Zustand)
```typescript
interface AppState {
  // Dashboard configuration
  dashboard: VizroDashboard;
  updateDashboard: (updates: Partial<VizroDashboard>) => void;
  
  // UI state - two-state system
  selectedComponentPath: ComponentPath | null;
  activeMode: 'tree-building' | 'property-editing';
  outputFormat: 'json' | 'yaml';
  
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
  
  // JSON output
  generatedJSON: string;
  generatedYAML: string;
  
  // Backend validation
  backendValidationErrors: ValidationError[];
  isValidating: boolean;
  lastValidatedConfig: VizroDashboard | null;
  validateWithBackend: (treeState: ComponentTree, propertyState: ComponentProperties) => Promise<ValidationResult>;
}
```

#### Component-Level State
- Local form state for tree building operations
- Local form state for property editing
- Preview panel state (validation loading, error highlighting)
- Minimal frontend validation (basic field types, required fields)
- Backend validation results integration

## Backend Architecture

### Technology Stack
- **Framework**: FastAPI (async, auto-docs, type hints)
- **Database**: PostgreSQL + SQLAlchemy (robust relational data)
- **Cache**: Redis (session state, preview caching)
- **Validation**: Pydantic (Dashboard.model_validate for combining and validating frontend states)
- **Queue**: Celery + Redis (async preview generation)
- **Storage**: S3/MinIO (file assets, exports)

### API Design

#### 1. Schema Management
```python
@router.get("/api/v1/schema/{version}")
async def get_schema(version: str) -> JSONSchema:
    """Get Vizro schema for specific version"""

@router.post("/api/v1/validate")
async def validate_dashboard(tree_state: ComponentTree, property_state: ComponentProperties) -> ValidationResult:
    """Combine frontend states and validate via Dashboard.model_validate"""
```

#### 2. Dashboard Operations
```python
@router.post("/api/v1/dashboards")
async def create_dashboard(dashboard: DashboardCreate) -> Dashboard:
    """Create new dashboard"""

@router.put("/api/v1/dashboards/{dashboard_id}")
async def update_dashboard(dashboard_id: UUID, updates: DashboardUpdate) -> Dashboard:
    """Update dashboard configuration"""

@router.post("/api/v1/dashboards/{dashboard_id}/generate-json")
async def generate_json(dashboard_id: UUID, tree_state: ComponentTree, property_state: ComponentProperties) -> VizroDashboard:
    """Combine frontend states, validate via Pydantic, and return valid Vizro JSON"""

@router.post("/api/v1/dashboards/{dashboard_id}/preview-link")
async def generate_preview_link(dashboard_id: UUID) -> PreviewLinkResponse:
    """[Future] Generate WebAssembly preview link"""
```

#### 3. Template System
```python
@router.get("/api/v1/templates")
async def list_templates(category: str = None) -> List[Template]:
    """List available dashboard templates"""

@router.post("/api/v1/templates")
async def create_template(template: TemplateCreate) -> Template:
    """Create dashboard template"""

#### 4. User & Data Management
```python
@router.get("/api/v1/users/{user_id}/dashboards")
async def list_user_dashboards(user_id: UUID) -> List[Dashboard]:
    """List all dashboards for a user"""

@router.post("/api/v1/users/{user_id}/dashboards")
async def create_dashboard(user_id: UUID, dashboard: DashboardCreate) -> Dashboard:
    """Create new dashboard"""

@router.get("/api/v1/users/{user_id}/datasets")
async def list_user_datasets(user_id: UUID) -> List[Dataset]:
    """List all datasets for a user"""

@router.post("/api/v1/users/{user_id}/datasets/upload")
async def upload_dataset(user_id: UUID, file: UploadFile, name: str) -> Dataset:
    """Upload and process dataset file"""

@router.delete("/api/v1/users/{user_id}/datasets/{dataset_id}")
async def delete_dataset(user_id: UUID, dataset_id: UUID) -> None:
    """Delete user dataset"""

@router.get("/api/v1/users/{user_id}/storage")
async def get_storage_usage(user_id: UUID) -> StorageUsage:
    """Get current storage usage and limits"""
```

### Data Models

#### Core Models
```python
class User(BaseModel):
    id: UUID
    email: str
    username: str
    created_at: datetime
    storage_limit: int = 50 * 1024 * 1024  # 50MB default
    storage_used: int = 0

class Dashboard(BaseModel):
    id: UUID
    name: str
    description: Optional[str]
    config: VizroDashboard  # Full Vizro configuration
    created_at: datetime
    updated_at: datetime
    created_by: UUID
    is_public: bool = False
    
class Dataset(BaseModel):
    id: UUID
    name: str
    filename: str
    file_size: int
    file_path: str  # S3/storage path
    columns: List[str]
    row_count: int
    data_types: Dict[str, str]  # column -> type mapping
    uploaded_at: datetime
    created_by: UUID

class Template(BaseModel):
    id: UUID
    name: str
    description: str
    category: str
    config: VizroDashboard
    preview_image: Optional[str]
    tags: List[str]
    
class StorageUsage(BaseModel):
    used_bytes: int
    limit_bytes: int
    dataset_count: int
    dashboard_count: int
    available_bytes: int
    
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

### Docker Development Strategy

**docker-compose.yml (Development)**
```yaml
version: '3.8'
services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    volumes:
      - ./frontend:/app
      - /app/node_modules
    environment:
      - VITE_API_URL=http://localhost:8000
    depends_on:
      - backend

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.dev
    ports:
      - "8000:8000"
    volumes:
      - ./backend:/app
    environment:
      - DATABASE_URL=postgresql://vizro:vizro@postgres:5432/vizro_gui
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=vizro_gui
      - POSTGRES_USER=vizro
      - POSTGRES_PASSWORD=vizro
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backend/migrations:/docker-entrypoint-initdb.d
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

**Makefile**
```makefile
.PHONY: up down build logs test migrate

# Development commands
up:
	docker-compose up -d

down:
	docker-compose down

build:
	docker-compose build

logs:
	docker-compose logs -f

logs-frontend:
	docker-compose logs -f frontend

logs-backend:
	docker-compose logs -f backend

# Development shells
shell-frontend:
	docker-compose exec frontend sh

shell-backend:
	docker-compose exec backend bash

shell-db:
	docker-compose exec postgres psql -U vizro -d vizro_gui

# Testing
test:
	docker-compose exec backend pytest
	docker-compose exec frontend npm test

test-backend:
	docker-compose exec backend pytest

test-frontend:
	docker-compose exec frontend npm test

# Database management
migrate:
	docker-compose exec backend alembic upgrade head

seed:
	docker-compose exec backend python scripts/seed_db.py

db-reset:
	docker-compose exec postgres psql -U vizro -d vizro_gui -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
	make migrate

# Production builds
build-prod:
	docker-compose -f docker-compose.prod.yml build

deploy-staging:
	docker-compose -f docker-compose.staging.yml up -d

deploy-prod:
	docker-compose -f docker-compose.prod.yml up -d
```

### Docker Development Benefits

**Environment Consistency:**
- Identical development/staging/production environments
- No "works on my machine" issues
- Simplified onboarding for new developers

**Service Management:**
- All dependencies containerized (PostgreSQL, Redis)
- Easy service isolation and debugging
- Clean separation of concerns

**Deployment Ready:**
- Production images built from same Dockerfiles
- Infrastructure as code with docker-compose
- Easy scaling and orchestration

**Development Workflow:**
- Single command to start entire stack (`make up`)
- Hot reloading with volume mounts
- Integrated testing and database management

### Scaling Considerations
- **Horizontal scaling**: Stateless backend services
- **Database scaling**: Read replicas for dashboard queries
- **Cache scaling**: Redis Cluster for high availability
- **CDN integration**: Static assets and preview images
- **Container orchestration**: Kubernetes for production scaling

## Development Phases

### Phase 1: Core Infrastructure (4-6 weeks)
- **Docker Development Environment** (docker-compose + Makefile setup)
- Four-panel layout (Top Bar | Left Form | Central Preview | Right Form)
- **Dynamic Schema Form Engine** (ZERO hardcoding, version agnostic)
- **Component Field Registry** (specific + generic fallback patterns)
- User authentication and dashboard management
- Backend API structure and database models

### Phase 2: Schema-Driven Form System (6-8 weeks)
- **Dynamic Tree Builder** (extract hierarchy from schema, no hardcoded components)
- **Dynamic Property Editor** (extract properties from schema, exclude hierarchy automatically)
- **Field Renderer Registry** (specific renderers + generic fallbacks)
- JSON/YAML output generation and display
- Backend validation integration

### Phase 3: Advanced Schema Features (4-6 weeks)
- **Schema Version Management** (seamless 0.1.43 → 0.1.44 transitions)
- **Complex Conditional Logic** (schema-driven conditional fields)
- **Custom Field Renderers** (for complex Vizro-specific UI patterns)
- Template system and configuration export
- Performance optimization for dynamic form generation

### Phase 4: Production Readiness (3-4 weeks)
- Comprehensive schema compatibility testing
- Performance optimization for large schemas
- Security hardening
- Documentation and extension guides

### Phase 5: Live Preview Integration (Future)
- WebAssembly integration
- Backend preview link generation
- iframe-based live dashboard preview

**Current Phase Timeline: 17-24 weeks (4-6 months)**

**CRITICAL SUCCESS METRIC**: When schema 0.1.44 is released, ZERO code changes should be needed - forms should automatically adapt to new schema structure.

This architecture provides a solid foundation for building a production-grade Vizro GUI builder that can scale with user needs while maintaining performance and reliability.