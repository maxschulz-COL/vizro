/**
 * Property Panel - Right Panel of GUI Builder
 * 
 * Displays and edits properties of the currently selected component using:
 * - Dynamic form generation from schema
 * - Real-time property updates
 * - Schema-driven validation
 * - Form mode switching (tree builder vs property editor)
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useDashboardStore, useSelectedNode } from '@/stores/dashboardStore';
import { DynamicForm } from '@/components/form-generator/DynamicForm';
import { schemaClient } from '@/lib/schema-client';
import { ComponentSchema } from '@/types/schema';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, 
  Eye, 
  FileText, 
  Loader2, 
  AlertCircle,
  CheckCircle2,
  Info
} from 'lucide-react';

/**
 * Empty state when no component is selected
 */
const EmptyState: React.FC = () => (
  <div className="p-6 text-center space-y-4">
    <div className="w-12 h-12 mx-auto bg-muted rounded-full flex items-center justify-center">
      <Settings className="h-6 w-6 text-muted-foreground" />
    </div>
    <div>
      <h3 className="text-sm font-medium">No Component Selected</h3>
      <p className="text-xs text-muted-foreground mt-1">
        Select a component from the tree to edit its properties
      </p>
    </div>
  </div>
);

/**
 * Loading state while fetching schema
 */
const LoadingState: React.FC = () => (
  <div className="p-6 text-center space-y-4">
    <Loader2 className="h-6 w-6 mx-auto animate-spin text-muted-foreground" />
    <div>
      <h3 className="text-sm font-medium">Loading Schema</h3>
      <p className="text-xs text-muted-foreground mt-1">
        Fetching component schema from backend...
      </p>
    </div>
  </div>
);

/**
 * Error state when schema loading fails
 */
const ErrorState: React.FC<{ error: string; onRetry: () => void }> = ({ error, onRetry }) => (
  <div className="p-6 text-center space-y-4">
    <div className="w-12 h-12 mx-auto bg-destructive/10 rounded-full flex items-center justify-center">
      <AlertCircle className="h-6 w-6 text-destructive" />
    </div>
    <div>
      <h3 className="text-sm font-medium text-destructive">Schema Load Error</h3>
      <p className="text-xs text-muted-foreground mt-1">{error}</p>
    </div>
    <Button variant="outline" size="sm" onClick={onRetry}>
      Try Again
    </Button>
  </div>
);

/**
 * Component info header showing basic details
 */
interface ComponentInfoProps {
  node: any;
  schema?: ComponentSchema;
}

const ComponentInfo: React.FC<ComponentInfoProps> = ({ node, schema }) => {
  const updateNodeTitle = useDashboardStore(state => state.updateNodeTitle);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(node.title);

  const handleSaveTitle = () => {
    if (editTitle.trim() && editTitle !== node.title) {
      updateNodeTitle(node.id, editTitle.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditTitle(node.title);
    setIsEditing(false);
  };

  const getNodeTypeInfo = () => {
    switch (node.type) {
      case 'dashboard':
        return { icon: FileText, label: 'Dashboard', color: 'bg-blue-500' };
      case 'page':
        return { icon: FileText, label: 'Page', color: 'bg-green-500' };
      case 'component':
        return { icon: Settings, label: node.componentType || 'Component', color: 'bg-orange-500' };
      default:
        return { icon: Settings, label: 'Unknown', color: 'bg-gray-500' };
    }
  };

  const nodeInfo = getNodeTypeInfo();
  const Icon = nodeInfo.icon;

  return (
    <div className="p-4 border-b space-y-3">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded ${nodeInfo.color} flex items-center justify-center`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="space-y-2">
              <input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full text-sm font-medium bg-background border border-border rounded px-2 py-1"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveTitle();
                  if (e.key === 'Escape') handleCancelEdit();
                }}
              />
              <div className="flex gap-1">
                <Button size="sm" variant="outline" onClick={handleSaveTitle}>
                  Save
                </Button>
                <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <h3 
                className="text-sm font-medium truncate cursor-pointer hover:text-primary"
                onClick={() => setIsEditing(true)}
                title="Click to edit title"
              >
                {node.title}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {nodeInfo.label}
                </Badge>
                {schema && (
                  <span className="text-xs text-muted-foreground">
                    {Object.keys(schema.fields).length} fields
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {schema && (
        <div className="text-xs text-muted-foreground">
          <p>{schema.description}</p>
          {schema.required_fields.length > 0 && (
            <p className="mt-1">
              Required: {schema.required_fields.join(', ')}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Form mode selector
 */
interface FormModeSelectorProps {
  mode: 'tree_builder' | 'property_editor';
  onModeChange: (mode: 'tree_builder' | 'property_editor') => void;
  schema?: ComponentSchema;
}

const FormModeSelector: React.FC<FormModeSelectorProps> = ({ mode, onModeChange, schema }) => {
  if (!schema) return null;

  const structuralFieldCount = Object.values(schema.fields).filter(f => f.category === 'structural').length;
  const propertyFieldCount = Object.values(schema.fields).filter(f => f.category !== 'structural').length;

  return (
    <Tabs value={mode} onValueChange={onModeChange as any} className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="tree_builder" className="text-xs">
          Structure ({structuralFieldCount})
        </TabsTrigger>
        <TabsTrigger value="property_editor" className="text-xs">
          Properties ({propertyFieldCount})
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
};

/**
 * Main Property Panel Component
 */
export const PropertyPanel: React.FC = () => {
  const selectedComponent = useDashboardStore(state => state.selectedComponent);
  const updateNodeProperties = useDashboardStore(state => state.updateNodeProperties);
  const selectedNode = useSelectedNode();

  const [schema, setSchema] = useState<ComponentSchema | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formTouched, setFormTouched] = useState<Record<string, boolean>>({});
  const [formMode, setFormMode] = useState<'tree_builder' | 'property_editor'>('property_editor');

  // Load schema when selected component changes
  useEffect(() => {
    if (!selectedComponent || !selectedNode) {
      setSchema(null);
      setFormValues({});
      setFormErrors({});
      setFormTouched({});
      return;
    }

    // For dashboard and page types, create a simple schema
    if (selectedNode.type === 'dashboard' || selectedNode.type === 'page') {
      const simpleSchema: ComponentSchema = {
        component_type: selectedNode.type,
        title: selectedNode.type === 'dashboard' ? 'Dashboard Configuration' : 'Page Configuration',
        description: `Configure ${selectedNode.type} properties`,
        fields: {
          title: {
            name: 'title',
            title: 'Title',
            description: `The title of this ${selectedNode.type}`,
            field_type: 'string',
            category: 'metadata',
            validation: { required: true, min_length: 1, max_length: 100, minimum: null, maximum: null, pattern: null, enum_values: null, min_items: null, max_items: null, const_value: null },
            default_value: selectedNode.title,
            array_item_type: null,
            array_item_ref: null,
            object_properties: null,
            additional_properties: false,
            union_types: null,
            discriminator_property: null,
            discriminator_mapping: null
          }
        },
        required_fields: ['title'],
        structural_fields: [],
        is_root_component: true,
        is_child_component: false
      };

      setSchema(simpleSchema);
      setFormValues({ title: selectedNode.title, ...selectedNode.properties });
      return;
    }

    // For component types, load schema from backend
    if (selectedNode.type === 'component' && selectedNode.componentType) {
      loadComponentSchema(selectedNode.componentType);
    }
  }, [selectedComponent, selectedNode]);

  const loadComponentSchema = async (componentType: string) => {
    setLoading(true);
    setError(null);

    try {
      const componentSchema = await schemaClient.getComponent(undefined, componentType);
      setSchema(componentSchema);
      
      // Initialize form values with defaults and existing properties
      const initialValues: Record<string, any> = {};
      Object.entries(componentSchema.fields).forEach(([fieldName, field]) => {
        initialValues[fieldName] = selectedNode?.properties[fieldName] ?? field.default_value ?? '';
      });
      
      setFormValues(initialValues);
      setFormErrors({});
      setFormTouched({});
    } catch (err) {
      console.error('Failed to load schema:', err);
      setError(`Failed to load schema for ${componentType}`);
      setSchema(null);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (fieldName: string, value: any) => {
    const newValues = { ...formValues, [fieldName]: value };
    setFormValues(newValues);
    
    // Update the node properties in the store
    if (selectedComponent) {
      updateNodeProperties(selectedComponent.nodeId, newValues);
    }
    
    // Clear error when user starts typing
    if (formErrors[fieldName]) {
      setFormErrors(prev => ({ ...prev, [fieldName]: '' }));
    }
  };

  const handleFieldBlur = (fieldName: string) => {
    setFormTouched(prev => ({ ...prev, [fieldName]: true }));
    
    // Simple validation
    if (schema?.required_fields.includes(fieldName) && !formValues[fieldName]) {
      setFormErrors(prev => ({ ...prev, [fieldName]: 'This field is required' }));
    }
  };

  const retryLoadSchema = () => {
    if (selectedNode?.type === 'component' && selectedNode.componentType) {
      loadComponentSchema(selectedNode.componentType);
    }
  };

  // No selection
  if (!selectedComponent || !selectedNode) {
    return <EmptyState />;
  }

  // Loading state
  if (loading) {
    return <LoadingState />;
  }

  // Error state
  if (error) {
    return <ErrorState error={error} onRetry={retryLoadSchema} />;
  }

  // No schema loaded
  if (!schema) {
    return <EmptyState />;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Component Info Header */}
      <ComponentInfo node={selectedNode} schema={schema} />

      {/* Form Mode Selector */}
      <div className="p-4 border-b">
        <FormModeSelector 
          mode={formMode} 
          onModeChange={setFormMode} 
          schema={schema} 
        />
      </div>

      {/* Dynamic Form */}
      <div className="flex-1 overflow-auto">
        <div className="p-4">
          <DynamicForm
            schema={schema}
            values={formValues}
            errors={formErrors}
            touched={formTouched}
            onChange={handleFieldChange}
            onBlur={handleFieldBlur}
            mode={formMode}
          />
        </div>
      </div>

      {/* Form Status Footer */}
      <div className="p-4 border-t bg-muted/30">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            {Object.keys(formErrors).length > 0 ? (
              <>
                <AlertCircle className="h-3 w-3 text-destructive" />
                <span className="text-destructive">
                  {Object.keys(formErrors).length} error(s)
                </span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-3 w-3 text-green-600" />
                <span className="text-green-600">Valid</span>
              </>
            )}
          </div>
          <div className="text-muted-foreground">
            {Object.keys(formTouched).length} field(s) modified
          </div>
        </div>
      </div>
    </div>
  );
};