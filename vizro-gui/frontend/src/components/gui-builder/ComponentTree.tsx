/**
 * Component Tree - Left Panel of GUI Builder
 * 
 * Displays the hierarchical structure of the dashboard with:
 * - Dashboard > Pages > Components tree view
 * - Add buttons for new components
 * - Selection and navigation
 * - Drag & drop support (future)
 */

import React, { useState } from 'react';
import { useDashboardStore, useCanAddComponent } from '@/stores/dashboardStore';
import { DashboardNode, PageTreeNode, ComponentTreeNode } from '@/types/dashboard';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  Layout, 
  FileText, 
  BarChart3, 
  Table, 
  CreditCard, 
  Container,
  Filter,
  Trash2,
  Copy,
  Edit,
  MoreHorizontal
} from 'lucide-react';

// Icon mapping for different component types
const getComponentIcon = (type: string, nodeType: 'dashboard' | 'page' | 'component') => {
  if (nodeType === 'dashboard') return Layout;
  if (nodeType === 'page') return FileText;
  
  // Component icons based on type
  switch (type) {
    case 'Graph': return BarChart3;
    case 'Table': return Table;
    case 'Card': return CreditCard;
    case 'Container': return Container;
    case 'Filter': return Filter;
    default: return CreditCard;
  }
};

/**
 * Add Component Dropdown Menu
 */
interface AddComponentDropdownProps {
  parentId: string;
  parentType: 'dashboard' | 'page' | 'component';
  onAdd: (componentType: string) => void;
}

const AddComponentDropdown: React.FC<AddComponentDropdownProps> = ({
  parentId,
  parentType,
  onAdd
}) => {
  const availableComponents = useDashboardStore(state => state.availableComponents);
  const canAdd = useCanAddComponent(parentId);

  if (!canAdd) return null;

  const getAvailableComponentsForParent = () => {
    if (parentType === 'page') {
      // Pages can have all component types
      return availableComponents;
    } else if (parentType === 'component') {
      // Container components can have other components
      return availableComponents.filter(comp => comp !== 'Filter'); // Filters usually go at page level
    }
    return [];
  };

  const componentsToShow = getAvailableComponentsForParent();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
          <Plus className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <DropdownMenuLabel>Add Component</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {componentsToShow.map(componentType => {
          const Icon = getComponentIcon(componentType, 'component');
          return (
            <DropdownMenuItem
              key={componentType}
              onClick={() => onAdd(componentType)}
              className="cursor-pointer"
            >
              <Icon className="h-4 w-4 mr-2" />
              {componentType}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

/**
 * Node Actions Dropdown
 */
interface NodeActionsProps {
  node: DashboardNode;
  onRename: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

const NodeActions: React.FC<NodeActionsProps> = ({
  node,
  onRename,
  onDuplicate,
  onDelete
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
          <MoreHorizontal className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onClick={onRename} className="cursor-pointer">
          <Edit className="h-4 w-4 mr-2" />
          Rename
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onDuplicate} className="cursor-pointer">
          <Copy className="h-4 w-4 mr-2" />
          Duplicate
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={onDelete} 
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

/**
 * Tree Node Component
 */
interface TreeNodeProps {
  node: DashboardNode;
  depth: number;
  isSelected: boolean;
  isExpanded: boolean;
  onSelect: () => void;
  onToggleExpanded: () => void;
  children?: React.ReactNode;
}

const TreeNode: React.FC<TreeNodeProps> = ({
  node,
  depth,
  isSelected,
  isExpanded,
  onSelect,
  onToggleExpanded,
  children
}) => {
  const addComponent = useDashboardStore(state => state.addComponent);
  const addPage = useDashboardStore(state => state.addPage);
  const removeNode = useDashboardStore(state => state.removeNode);
  const updateNodeTitle = useDashboardStore(state => state.updateNodeTitle);

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(node.title);

  const hasChildren = (node.type === 'dashboard' && (node as any).pages?.length > 0) ||
                     (node.type === 'page' && (node as any).components?.length > 0) ||
                     (node.type === 'component' && (node as any).children?.length > 0);

  const canHaveChildren = node.type === 'dashboard' || 
                         node.type === 'page' || 
                         (node.type === 'component' && node.componentType === 'Container');

  const Icon = getComponentIcon(node.componentType || '', node.type);

  const handleAddComponent = (componentType: string) => {
    if (node.type === 'dashboard') {
      addPage();
    } else {
      addComponent(node.id, componentType);
    }
  };

  const handleRename = () => {
    setIsEditing(true);
  };

  const handleConfirmRename = () => {
    if (editTitle.trim() && editTitle !== node.title) {
      updateNodeTitle(node.id, editTitle.trim());
    }
    setIsEditing(false);
  };

  const handleCancelRename = () => {
    setEditTitle(node.title);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConfirmRename();
    } else if (e.key === 'Escape') {
      handleCancelRename();
    }
  };

  const handleDuplicate = () => {
    // TODO: Implement node duplication
    console.log('Duplicate node:', node.id);
  };

  const handleDelete = () => {
    if (node.type !== 'dashboard') { // Don't allow deleting the dashboard itself
      removeNode(node.id);
    }
  };

  return (
    <div>
      <div
        className={cn(
          "group flex items-center gap-1 py-1 px-2 rounded-sm cursor-pointer hover:bg-muted/50",
          isSelected && "bg-muted border-l-2 border-primary",
          "transition-colors"
        )}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
        onClick={onSelect}
      >
        {/* Expand/Collapse button */}
        <Button
          variant="ghost"
          size="sm"
          className="h-4 w-4 p-0 shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            if (canHaveChildren) {
              onToggleExpanded();
            }
          }}
        >
          {canHaveChildren && hasChildren ? (
            isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )
          ) : (
            <div className="w-3 h-3" />
          )}
        </Button>

        {/* Icon */}
        <Icon className="h-4 w-4 shrink-0" />

        {/* Title */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleConfirmRename}
              onKeyDown={handleKeyDown}
              className="w-full text-sm bg-background border border-border rounded px-1 py-0.5"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="text-sm truncate block">{node.title}</span>
          )}
        </div>

        {/* Component type badge */}
        {node.type === 'component' && node.componentType && (
          <span className="text-xs text-muted-foreground shrink-0">
            {node.componentType}
          </span>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Add component button */}
          {canHaveChildren && (
            <AddComponentDropdown
              parentId={node.id}
              parentType={node.type}
              onAdd={handleAddComponent}
            />
          )}

          {/* Node actions */}
          <div onClick={(e) => e.stopPropagation()}>
            <NodeActions
              node={node}
              onRename={handleRename}
              onDuplicate={handleDuplicate}
              onDelete={handleDelete}
            />
          </div>
        </div>
      </div>

      {/* Children */}
      {canHaveChildren && isExpanded && children}
    </div>
  );
};

/**
 * Page Tree Node
 */
const PageNode: React.FC<{
  page: PageTreeNode;
  depth: number;
  expandedNodes: Set<string>;
  onToggleExpanded: (nodeId: string) => void;
}> = ({ page, depth, expandedNodes, onToggleExpanded }) => {
  const selectedComponent = useDashboardStore(state => state.selectedComponent);
  const selectComponent = useDashboardStore(state => state.selectComponent);

  const isSelected = selectedComponent?.nodeId === page.id;
  const isExpanded = expandedNodes.has(page.id);

  const handleSelect = () => {
    selectComponent({
      nodeId: page.id,
      nodeType: 'page',
      path: [page.id], // TODO: Calculate proper path
      parentId: undefined // TODO: Get parent ID
    });
  };

  return (
    <TreeNode
      node={page}
      depth={depth}
      isSelected={isSelected}
      isExpanded={isExpanded}
      onSelect={handleSelect}
      onToggleExpanded={() => onToggleExpanded(page.id)}
    >
      {page.components.map(component => (
        <ComponentNode
          key={component.id}
          component={component}
          depth={depth + 1}
          expandedNodes={expandedNodes}
          onToggleExpanded={onToggleExpanded}
        />
      ))}
    </TreeNode>
  );
};

/**
 * Component Tree Node (with recursive children support)
 */
const ComponentNode: React.FC<{
  component: ComponentTreeNode;
  depth: number;
  expandedNodes: Set<string>;
  onToggleExpanded: (nodeId: string) => void;
}> = ({ component, depth, expandedNodes, onToggleExpanded }) => {
  const selectedComponent = useDashboardStore(state => state.selectedComponent);
  const selectComponent = useDashboardStore(state => state.selectComponent);

  const isSelected = selectedComponent?.nodeId === component.id;
  const isExpanded = expandedNodes.has(component.id);

  const handleSelect = () => {
    selectComponent({
      nodeId: component.id,
      nodeType: 'component',
      path: [component.id], // TODO: Calculate proper path
      parentId: undefined // TODO: Get parent ID
    });
  };

  return (
    <TreeNode
      node={component}
      depth={depth}
      isSelected={isSelected}
      isExpanded={isExpanded}
      onSelect={handleSelect}
      onToggleExpanded={() => onToggleExpanded(component.id)}
    >
      {component.children?.map(child => (
        <ComponentNode
          key={child.id}
          component={child}
          depth={depth + 1}
          expandedNodes={expandedNodes}
          onToggleExpanded={onToggleExpanded}
        />
      ))}
    </TreeNode>
  );
};

/**
 * Main Component Tree
 */
export const ComponentTree: React.FC = () => {
  const dashboard = useDashboardStore(state => state.dashboard);
  const selectedComponent = useDashboardStore(state => state.selectedComponent);
  const selectComponent = useDashboardStore(state => state.selectComponent);
  const addPage = useDashboardStore(state => state.addPage);

  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(
    new Set([dashboard.id])
  );

  const toggleExpanded = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const handleSelectDashboard = () => {
    selectComponent({
      nodeId: dashboard.id,
      nodeType: 'dashboard',
      path: [dashboard.id]
    });
  };

  const handleAddPage = () => {
    addPage();
  };

  const isDashboardSelected = selectedComponent?.nodeId === dashboard.id;
  const isDashboardExpanded = expandedNodes.has(dashboard.id);

  return (
    <div className="p-4 space-y-2">
      {/* Dashboard root node */}
      <TreeNode
        node={dashboard}
        depth={0}
        isSelected={isDashboardSelected}
        isExpanded={isDashboardExpanded}
        onSelect={handleSelectDashboard}
        onToggleExpanded={() => toggleExpanded(dashboard.id)}
      >
        {/* Pages */}
        {dashboard.pages.map(page => (
          <PageNode
            key={page.id}
            page={page}
            depth={1}
            expandedNodes={expandedNodes}
            onToggleExpanded={toggleExpanded}
          />
        ))}
      </TreeNode>

      {/* Add first page button if no pages exist */}
      {dashboard.pages.length === 0 && (
        <div className="p-4 text-center">
          <p className="text-sm text-muted-foreground mb-3">
            No pages yet. Add your first page to get started.
          </p>
          <Button onClick={handleAddPage} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add Page
          </Button>
        </div>
      )}
    </div>
  );
};