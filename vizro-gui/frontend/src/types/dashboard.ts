/**
 * TypeScript interfaces for Vizro Dashboard structure and GUI Builder state
 * 
 * These interfaces represent the tree structure of a Vizro dashboard
 * and provide type safety for the GUI builder's state management.
 */

// Base interface for all dashboard tree nodes
export interface DashboardNode {
  id: string;
  type: 'dashboard' | 'page' | 'component';
  title: string;
  componentType?: string; // The actual Vizro component type (Graph, Table, etc.)
  properties: Record<string, any>;
  children?: DashboardNode[];
}

// Specific interfaces for different node types
export interface DashboardTreeNode extends DashboardNode {
  type: 'dashboard';
  pages: PageTreeNode[];
}

export interface PageTreeNode extends DashboardNode {
  type: 'page';
  components: ComponentTreeNode[];
}

export interface ComponentTreeNode extends DashboardNode {
  type: 'component';
  componentType: string; // Graph, Table, Container, etc.
  children?: ComponentTreeNode[]; // For container components
}

// Selection state for the GUI builder
export interface ComponentSelection {
  nodeId: string;
  nodeType: 'dashboard' | 'page' | 'component';
  path: string[]; // Array of IDs representing the path to the selected node
  parentId?: string;
}

// Dashboard state structure
export interface DashboardState {
  dashboard: DashboardTreeNode;
  selectedComponent: ComponentSelection | null;
  availableComponents: string[]; // List of available Vizro component types
  schemaVersion: string;
}

// Actions for dashboard state management
export interface DashboardActions {
  // Selection actions
  selectComponent: (selection: ComponentSelection) => void;
  clearSelection: () => void;
  
  // Tree manipulation actions
  addPage: (title?: string) => void;
  addComponent: (parentId: string, componentType: string, title?: string) => void;
  removeNode: (nodeId: string) => void;
  updateNodeProperties: (nodeId: string, properties: Record<string, any>) => void;
  updateNodeTitle: (nodeId: string, title: string) => void;
  
  // Dashboard actions
  setAvailableComponents: (components: string[]) => void;
  initializeDashboard: (title?: string) => void;
  resetDashboard: () => void;
  
  // Import/Export actions
  importDashboard: (dashboardConfig: any) => void;
  exportDashboard: () => any;
}

// Combined store interface
export interface DashboardStore extends DashboardState, DashboardActions {}

// Utility types for component addition
export interface AddComponentOptions {
  parentId: string;
  parentType: 'page' | 'component';
  componentType: string;
  title?: string;
  position?: number; // Insert at specific position
}

// Tree navigation utilities
export interface TreePath {
  nodeId: string;
  path: string[];
  depth: number;
}

// Component metadata for UI display
export interface ComponentMetadata {
  type: string;
  title: string;
  description?: string;
  icon?: string;
  isContainer: boolean;
  canHaveChildren: boolean;
  allowedParents: string[];
  defaultProperties: Record<string, any>;
}

// Form mode context
export type FormMode = 'tree_builder' | 'property_editor';

// Tree node display state
export interface TreeNodeDisplayState {
  expanded: boolean;
  selected: boolean;
  hasChildren: boolean;
  canAddChildren: boolean;
  depth: number;
}

// Validation state for real-time feedback
export interface ValidationState {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  lastValidated: Date;
}

export interface ValidationError {
  nodeId: string;
  field?: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationWarning {
  nodeId: string;
  field?: string;
  message: string;
  suggestion?: string;
}

// Configuration export format
export interface DashboardExport {
  vizro_version: string;
  dashboard: {
    pages: any[];
    [key: string]: any;
  };
  metadata: {
    created_by: string;
    created_at: string;
    gui_builder_version: string;
  };
}