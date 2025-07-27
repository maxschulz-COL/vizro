import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DynamicForm } from '@/components/form-generator/DynamicForm';
import { schemaClient } from '@/lib/schema-client';
import { ComponentRegistryAPI } from '@/lib/registry-extensions';
import { componentRegistry } from '@/lib/component-registry';
import { ComponentSchema } from '@/types/schema';
import { Loader2, RefreshCw, Bug, Eye } from 'lucide-react';

/**
 * Demo component showcasing the Component Registry System
 * 
 * Demonstrates:
 * - Dynamic form generation from schema
 * - Component registry pattern matching
 * - Real-time backend integration
 * - Two-mode operation (tree builder vs property editor)
 */
export const RegistryDemo: React.FC = () => {
  const [selectedComponent, setSelectedComponent] = useState<string>('Graph');
  const [componentSchema, setComponentSchema] = useState<ComponentSchema | null>(null);
  const [availableComponents, setAvailableComponents] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formTouched, setFormTouched] = useState<Record<string, boolean>>({});
  const [mode, setMode] = useState<'tree_builder' | 'property_editor'>('property_editor');
  const [debugMode, setDebugMode] = useState(false);

  // Load available components on mount
  useEffect(() => {
    const loadComponents = async () => {
      try {
        const response = await schemaClient.getComponents();
        const componentTypes = response.components
          .filter(c => c.is_root_component)
          .map(c => c.component_type)
          .sort();
        setAvailableComponents(componentTypes);
      } catch (err) {
        console.error('Failed to load components:', err);
        setError('Failed to load component list from backend');
      }
    };

    loadComponents();
  }, []);

  // Load specific component schema
  useEffect(() => {
    if (!selectedComponent) return;

    const loadSchema = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const schema = await schemaClient.getComponent(undefined, selectedComponent);
        setComponentSchema(schema);
        
        // Initialize form values with defaults
        const initialValues: Record<string, any> = {};
        Object.entries(schema.fields).forEach(([fieldName, field]) => {
          initialValues[fieldName] = field.default_value ?? '';
        });
        setFormValues(initialValues);
        setFormErrors({});
        setFormTouched({});
      } catch (err) {
        console.error('Failed to load schema:', err);
        setError(`Failed to load schema for ${selectedComponent}`);
        setComponentSchema(null);
      } finally {
        setLoading(false);
      }
    };

    loadSchema();
  }, [selectedComponent]);

  const handleFieldChange = (fieldName: string, value: any) => {
    setFormValues(prev => ({ ...prev, [fieldName]: value }));
    
    // Clear error when user starts typing
    if (formErrors[fieldName]) {
      setFormErrors(prev => ({ ...prev, [fieldName]: '' }));
    }
  };

  const handleFieldBlur = (fieldName: string) => {
    setFormTouched(prev => ({ ...prev, [fieldName]: true }));
    
    // Simple validation example
    if (componentSchema?.required_fields.includes(fieldName) && !formValues[fieldName]) {
      setFormErrors(prev => ({ ...prev, [fieldName]: 'This field is required' }));
    }
  };

  const toggleDebugMode = () => {
    const newDebugMode = !debugMode;
    setDebugMode(newDebugMode);
    if (newDebugMode) {
      ComponentRegistryAPI.enableDebug();
    } else {
      ComponentRegistryAPI.disableDebug();
    }
  };

  const getRegistryPatterns = () => {
    return componentRegistry.getPatterns();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Component Registry Demo</h1>
        <p className="text-muted-foreground">
          Interactive demonstration of the Vizro GUI Builder component registry system
        </p>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
        <div className="space-y-1">
          <label className="text-sm font-medium">Component Type:</label>
          <select
            value={selectedComponent}
            onChange={(e) => setSelectedComponent(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
          >
            {availableComponents.map(comp => (
              <option key={comp} value={comp}>{comp}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Form Mode:</label>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as any)}
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
          >
            <option value="property_editor">Property Editor</option>
            <option value="tree_builder">Tree Builder</option>
          </select>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleDebugMode}
          >
            <Bug className="h-4 w-4 mr-1" />
            Debug: {debugMode ? 'ON' : 'OFF'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Reset
          </Button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 border border-destructive bg-destructive/10 rounded-lg">
          <p className="text-destructive text-sm">{error}</p>
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue="form" className="space-y-4">
        <TabsList>
          <TabsTrigger value="form">Dynamic Form</TabsTrigger>
          <TabsTrigger value="registry">Registry Patterns</TabsTrigger>
          <TabsTrigger value="schema">Schema Details</TabsTrigger>
          <TabsTrigger value="values">Form Values</TabsTrigger>
        </TabsList>

        {/* Dynamic Form Tab */}
        <TabsContent value="form">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Dynamic Form Generation
                <Badge variant="secondary">{mode}</Badge>
              </CardTitle>
              <CardDescription>
                Schema-driven form generated from backend API with pattern-matched components
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  Loading schema...
                </div>
              ) : componentSchema ? (
                <DynamicForm
                  schema={componentSchema}
                  values={formValues}
                  errors={formErrors}
                  touched={formTouched}
                  onChange={handleFieldChange}
                  onBlur={handleFieldBlur}
                  mode={mode}
                />
              ) : (
                <p className="text-muted-foreground text-center p-8">
                  Select a component to view its dynamic form
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Registry Patterns Tab */}
        <TabsContent value="registry">
          <Card>
            <CardHeader>
              <CardTitle>Registry Patterns</CardTitle>
              <CardDescription>
                Registered component patterns with priority and matching rules
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {getRegistryPatterns().map((pattern, index) => (
                  <div key={pattern.id} className="border rounded p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{pattern.id}</h4>
                      <Badge variant="outline">Priority: {pattern.priority}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {pattern.description}
                    </p>
                    <div className="text-xs text-muted-foreground">
                      <strong>Matcher:</strong> {pattern.matcher.type}
                      {pattern.matcher.type === 'field_type' && ` = ${pattern.matcher.pattern}`}
                      {pattern.matcher.type === 'field_name' && ` = ${pattern.matcher.pattern}`}
                      {pattern.matcher.type === 'category' && ` = ${pattern.matcher.pattern}`}
                      {pattern.matcher.type === 'validation' && ` (${pattern.matcher.rule})`}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Schema Details Tab */}
        <TabsContent value="schema">
          <Card>
            <CardHeader>
              <CardTitle>Schema Details</CardTitle>
              <CardDescription>
                Raw schema information from backend API
              </CardDescription>
            </CardHeader>
            <CardContent>
              {componentSchema ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Component Type:</strong> {componentSchema.component_type}
                    </div>
                    <div>
                      <strong>Total Fields:</strong> {Object.keys(componentSchema.fields).length}
                    </div>
                    <div>
                      <strong>Required Fields:</strong> {componentSchema.required_fields.length}
                    </div>
                    <div>
                      <strong>Structural Fields:</strong> {componentSchema.structural_fields.length}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Field Categories:</h4>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      {['metadata', 'property', 'structural'].map(category => (
                        <div key={category}>
                          <strong>{category}:</strong>
                          <ul className="list-disc list-inside text-muted-foreground">
                            {Object.entries(componentSchema.fields)
                              .filter(([_, field]) => field.category === category)
                              .map(([name]) => (
                                <li key={name}>{name}</li>
                              ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>

                  <details className="space-y-2">
                    <summary className="cursor-pointer text-sm font-medium">
                      Raw Schema JSON
                    </summary>
                    <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-64">
                      {JSON.stringify(componentSchema, null, 2)}
                    </pre>
                  </details>
                </div>
              ) : (
                <p className="text-muted-foreground">No schema loaded</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Form Values Tab */}
        <TabsContent value="values">
          <Card>
            <CardHeader>
              <CardTitle>Form Values</CardTitle>
              <CardDescription>
                Current form state and validation results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Form Values:</h4>
                  <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-48">
                    {JSON.stringify(formValues, null, 2)}
                  </pre>
                </div>

                {Object.keys(formErrors).length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Validation Errors:</h4>
                    <pre className="text-xs bg-destructive/10 p-3 rounded overflow-auto">
                      {JSON.stringify(formErrors, null, 2)}
                    </pre>
                  </div>
                )}

                <div>
                  <h4 className="font-medium mb-2">Touched Fields:</h4>
                  <div className="flex flex-wrap gap-1">
                    {Object.keys(formTouched).map(field => (
                      <Badge key={field} variant="secondary">{field}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};