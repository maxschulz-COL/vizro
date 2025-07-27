/**
 * Zustand store for Vizro GUI Builder dashboard state management
 * 
 * Manages the dashboard tree structure, component selection,
 * and provides actions for tree manipulation and navigation.
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { 
  DashboardStore, 
  DashboardTreeNode, 
  PageTreeNode, 
  ComponentTreeNode,
  ComponentSelection,
  AddComponentOptions,
  TreePath
} from '@/types/dashboard';

// Helper function to generate unique IDs
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Helper function to find a node by ID in the tree
const findNodeById = (tree: DashboardTreeNode, nodeId: string): any => {
  if (tree.id === nodeId) return tree;
  
  // Search in pages
  for (const page of tree.pages) {
    if (page.id === nodeId) return page;
    
    // Search in page components
    for (const component of page.components) {
      const found = findComponentById(component, nodeId);
      if (found) return found;
    }
  }
  
  return null;
};

// Helper function to find a component by ID recursively
const findComponentById = (component: ComponentTreeNode, nodeId: string): ComponentTreeNode | null => {
  if (component.id === nodeId) return component;
  
  if (component.children) {
    for (const child of component.children) {
      const found = findComponentById(child, nodeId);
      if (found) return found;
    }
  }
  
  return null;
};

// Helper function to find parent of a node
const findParentNode = (tree: DashboardTreeNode, nodeId: string): any => {
  // Check if it's a page (parent is dashboard)
  for (const page of tree.pages) {
    if (page.id === nodeId) return tree;
    
    // Check if it's a component in this page
    for (const component of page.components) {
      if (component.id === nodeId) return page;
      
      // Recursively check component children
      const parent = findComponentParent(component, nodeId);
      if (parent) return parent;
    }
  }
  
  return null;
};

// Helper function to find parent of a component recursively
const findComponentParent = (component: ComponentTreeNode, nodeId: string): ComponentTreeNode | null => {
  if (component.children) {
    for (const child of component.children) {
      if (child.id === nodeId) return component;
      
      const parent = findComponentParent(child, nodeId);
      if (parent) return parent;
    }
  }
  
  return null;
};

// Helper function to create default dashboard
const createDefaultDashboard = (title = 'New Dashboard'): DashboardTreeNode => ({
  id: generateId(),
  type: 'dashboard',
  title,
  properties: {
    theme: 'vizro_default',
    navigation: null
  },
  pages: []
});

// Helper function to create default page
const createDefaultPage = (title = 'New Page'): PageTreeNode => ({
  id: generateId(),
  type: 'page',
  title,
  properties: {
    layout: {},
    controls: []
  },
  components: []
});

// Helper function to create default component
const createDefaultComponent = (componentType: string, title?: string): ComponentTreeNode => ({
  id: generateId(),
  type: 'component',
  title: title || `New ${componentType}`,
  componentType,
  properties: {
    // Default properties will be filled by schema
  },
  children: componentType === 'Container' ? [] : undefined
});

// Helper function to remove a node from the tree
const removeNodeFromTree = (tree: DashboardTreeNode, nodeId: string): DashboardTreeNode => {
  const newTree = { ...tree };
  
  // Remove from pages
  newTree.pages = newTree.pages.filter(page => page.id !== nodeId);
  
  // Remove from page components
  newTree.pages = newTree.pages.map(page => ({
    ...page,
    components: page.components.filter(comp => comp.id !== nodeId)
      .map(comp => removeComponentFromTree(comp, nodeId))
  }));
  
  return newTree;
};

// Helper function to remove a component from its tree recursively
const removeComponentFromTree = (component: ComponentTreeNode, nodeId: string): ComponentTreeNode => {
  if (component.children) {
    return {
      ...component,
      children: component.children.filter(child => child.id !== nodeId)
        .map(child => removeComponentFromTree(child, nodeId))
    };
  }
  
  return component;
};

// Helper function to update node properties
const updateNodeInTree = (tree: DashboardTreeNode, nodeId: string, updates: Partial<any>): DashboardTreeNode => {
  if (tree.id === nodeId) {
    return { ...tree, ...updates };
  }
  
  return {
    ...tree,
    pages: tree.pages.map(page => {
      if (page.id === nodeId) {
        return { ...page, ...updates };
      }
      
      return {
        ...page,
        components: page.components.map(comp => updateComponentInTree(comp, nodeId, updates))
      };
    })
  };
};

// Helper function to update component in tree recursively
const updateComponentInTree = (component: ComponentTreeNode, nodeId: string, updates: Partial<ComponentTreeNode>): ComponentTreeNode => {
  if (component.id === nodeId) {
    return { ...component, ...updates };
  }
  
  if (component.children) {
    return {
      ...component,
      children: component.children.map(child => updateComponentInTree(child, nodeId, updates))
    };
  }
  
  return component;
};

// Create the Zustand store
export const useDashboardStore = create<DashboardStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      dashboard: createDefaultDashboard(),
      selectedComponent: null,
      availableComponents: [],
      schemaVersion: '0.1.43',

      // Selection actions
      selectComponent: (selection: ComponentSelection) => {
        set(
          { selectedComponent: selection },
          false,
          'selectComponent'
        );
      },

      clearSelection: () => {
        set(
          { selectedComponent: null },
          false,
          'clearSelection'
        );
      },

      // Tree manipulation actions
      addPage: (title) => {
        const state = get();
        const newPage = createDefaultPage(title);
        const updatedDashboard = {
          ...state.dashboard,
          pages: [...state.dashboard.pages, newPage]
        };

        set(
          { 
            dashboard: updatedDashboard,
            selectedComponent: {
              nodeId: newPage.id,
              nodeType: 'page',
              path: [state.dashboard.id, newPage.id],
              parentId: state.dashboard.id
            }
          },
          false,
          'addPage'
        );
      },

      addComponent: (parentId: string, componentType: string, title?: string) => {
        const state = get();
        const newComponent = createDefaultComponent(componentType, title);
        const parentNode = findNodeById(state.dashboard, parentId);
        
        if (!parentNode) {
          console.error(`Parent node with ID ${parentId} not found`);
          return;
        }

        let updatedDashboard = { ...state.dashboard };

        if (parentNode.type === 'page') {
          // Add to page components
          updatedDashboard = updateNodeInTree(updatedDashboard, parentId, {
            components: [...parentNode.components, newComponent]
          });
        } else if (parentNode.type === 'component' && parentNode.children) {
          // Add to component children (for containers)
          updatedDashboard = updateNodeInTree(updatedDashboard, parentId, {
            children: [...parentNode.children, newComponent]
          });
        }

        set(
          {
            dashboard: updatedDashboard,
            selectedComponent: {
              nodeId: newComponent.id,
              nodeType: 'component',
              path: [...(state.selectedComponent?.path || []), newComponent.id],
              parentId
            }
          },
          false,
          'addComponent'
        );
      },

      removeNode: (nodeId: string) => {
        const state = get();
        const updatedDashboard = removeNodeFromTree(state.dashboard, nodeId);
        
        // Clear selection if the selected node was removed
        const newSelection = state.selectedComponent?.nodeId === nodeId 
          ? null 
          : state.selectedComponent;

        set(
          {
            dashboard: updatedDashboard,
            selectedComponent: newSelection
          },
          false,
          'removeNode'
        );
      },

      updateNodeProperties: (nodeId: string, properties: Record<string, any>) => {
        const state = get();
        const updatedDashboard = updateNodeInTree(state.dashboard, nodeId, { properties });

        set(
          { dashboard: updatedDashboard },
          false,
          'updateNodeProperties'
        );
      },

      updateNodeTitle: (nodeId: string, title: string) => {
        const state = get();
        const updatedDashboard = updateNodeInTree(state.dashboard, nodeId, { title });

        set(
          { dashboard: updatedDashboard },
          false,
          'updateNodeTitle'
        );
      },

      // Dashboard actions
      setAvailableComponents: (components: string[]) => {
        set(
          { availableComponents: components },
          false,
          'setAvailableComponents'
        );
      },

      initializeDashboard: (title) => {
        const newDashboard = createDefaultDashboard(title);
        
        set(
          {
            dashboard: newDashboard,
            selectedComponent: {
              nodeId: newDashboard.id,
              nodeType: 'dashboard',
              path: [newDashboard.id]
            }
          },
          false,
          'initializeDashboard'
        );
      },

      resetDashboard: () => {
        const newDashboard = createDefaultDashboard();
        
        set(
          {
            dashboard: newDashboard,
            selectedComponent: null
          },
          false,
          'resetDashboard'
        );
      },

      // Import/Export actions
      importDashboard: (dashboardConfig: any) => {
        // TODO: Implement dashboard import from Vizro JSON/YAML
        console.log('Import dashboard:', dashboardConfig);
      },

      exportDashboard: () => {
        const state = get();
        
        // Convert internal tree structure to Vizro format
        const vizroConfig = {
          dashboard: {
            pages: state.dashboard.pages.map(page => ({
              title: page.title,
              components: page.components.map(comp => ({
                type: comp.componentType,
                ...comp.properties
              })),
              ...page.properties
            })),
            ...state.dashboard.properties
          }
        };

        return vizroConfig;
      }
    }),
    {
      name: 'dashboard-store',
      // Only serialize essential data
      partialize: (state) => ({
        dashboard: state.dashboard,
        selectedComponent: state.selectedComponent,
        schemaVersion: state.schemaVersion
      })
    }
  )
);

// Utility hooks for common operations
export const useSelectedNode = () => {
  const selectedComponent = useDashboardStore(state => state.selectedComponent);
  const dashboard = useDashboardStore(state => state.dashboard);
  
  if (!selectedComponent) return null;
  
  return findNodeById(dashboard, selectedComponent.nodeId);
};

export const useTreePath = (nodeId: string): TreePath | null => {
  const dashboard = useDashboardStore(state => state.dashboard);
  
  // TODO: Implement tree path calculation
  return null;
};

export const useCanAddComponent = (parentId: string): boolean => {
  const dashboard = useDashboardStore(state => state.dashboard);
  const parentNode = findNodeById(dashboard, parentId);
  
  if (!parentNode) return false;
  
  // Pages can always have components
  if (parentNode.type === 'page') return true;
  
  // Container components can have children
  if (parentNode.type === 'component' && parentNode.componentType === 'Container') {
    return true;
  }
  
  return false;
};