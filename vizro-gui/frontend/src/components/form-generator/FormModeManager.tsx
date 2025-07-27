/**
 * Form Mode Manager
 * 
 * Manages the dual-mode interface for Tree Builder vs Property Editor modes.
 * Handles mode switching, state preservation, field filtering, and provides
 * a clean interface for managing complex form configurations.
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { FieldValues } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { 
  TreePine, 
  Settings, 
  Eye, 
  EyeOff, 
  RotateCcw,
  Save,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { ComponentSchema } from '@/types/schema';
import { DynamicFormGenerator, DynamicFormGeneratorProps } from './DynamicFormGenerator';
import { SchemaFormBridge, BridgeConfig } from '@/lib/schema-form-bridge';
import { FormIntegrationConfig } from '@/lib/form-integration';

export type FormMode = 'tree_builder' | 'property_editor' | 'dual';

export interface FormModeManagerProps<T extends FieldValues = FieldValues> {
  schema: ComponentSchema;
  initialValues?: Partial<T>;
  defaultMode?: FormMode;
  onSubmit?: (values: T, mode: FormMode) => void;
  onChange?: (values: T, isValid: boolean, mode: FormMode) => void;
  onModeChange?: (mode: FormMode) => void;
  className?: string;
  enablePreview?: boolean;
  enableHistory?: boolean;
  enableModeComparison?: boolean;
  config?: {
    integration?: Partial<FormIntegrationConfig>;
    bridge?: Partial<BridgeConfig>;
  };
}

interface ModeState<T extends FieldValues = FieldValues> {
  values: Partial<T>;
  isValid: boolean;
  isDirty: boolean;
  errors: Record<string, string>;
  touchedFields: Record<string, boolean>;
}

interface FormModeManagerState<T extends FieldValues = FieldValues> {
  currentMode: FormMode;
  treeBuilderState: ModeState<T>;
  propertyEditorState: ModeState<T>;
  sharedValues: Partial<T>;
  history: Array<{
    timestamp: number;
    mode: FormMode;
    values: Partial<T>;
    action: string;
  }>;
}

/**
 * Mode comparison component that shows differences between modes
 */
const ModeComparison: React.FC<{
  schema: ComponentSchema;
  treeState: ModeState;
  propertyState: ModeState;
  className?: string;
}> = ({ schema, treeState, propertyState, className }) => {
  const bridge = useMemo(() => 
    new SchemaFormBridge(schema, { mode: 'property_editor' }), 
    [schema]
  );

  const sections = bridge.generateFormSections();
  
  const structuralFields = sections
    .filter(s => s.category === 'structural')
    .flatMap(s => s.fields.map(f => f.name));
  
  const propertyFields = sections
    .filter(s => s.category !== 'structural')
    .flatMap(s => s.fields.map(f => f.name));

  return (
    <div className={cn("space-y-4", className)}>
      <div className="grid grid-cols-2 gap-4">
        {/* Tree Builder Summary */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <TreePine className="h-4 w-4" />
              Tree Builder
            </CardTitle>
            <CardDescription className="text-xs">
              Structural components and relationships
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-xs text-muted-foreground">
              {structuralFields.length} structural fields
            </div>
            {structuralFields.map(field => (
              <div key={field} className="flex items-center justify-between text-xs">
                <span>{field}</span>
                <div className="flex items-center gap-1">
                  {treeState.values[field] !== undefined ? (
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                  ) : (
                    <div className="h-3 w-3 rounded-full bg-muted" />
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Property Editor Summary */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Property Editor
            </CardTitle>
            <CardDescription className="text-xs">
              Component properties and metadata
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-xs text-muted-foreground">
              {propertyFields.length} property fields
            </div>
            {propertyFields.slice(0, 5).map(field => (
              <div key={field} className="flex items-center justify-between text-xs">
                <span>{field}</span>
                <div className="flex items-center gap-1">
                  {propertyState.values[field] !== undefined ? (
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                  ) : (
                    <div className="h-3 w-3 rounded-full bg-muted" />
                  )}
                </div>
              </div>
            ))}
            {propertyFields.length > 5 && (
              <div className="text-xs text-muted-foreground">
                +{propertyFields.length - 5} more fields...
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

/**
 * Form history component
 */
const FormHistory: React.FC<{
  history: FormModeManagerState['history'];
  onRestore?: (entry: FormModeManagerState['history'][0]) => void;
  className?: string;
}> = ({ history, onRestore, className }) => {
  const recentHistory = history.slice(-10).reverse();

  return (
    <div className={cn("space-y-2", className)}>
      <h4 className="text-sm font-medium">Recent Changes</h4>
      <div className="space-y-1 max-h-40 overflow-y-auto">
        {recentHistory.map((entry, index) => (
          <div key={entry.timestamp} className="flex items-center justify-between p-2 rounded border">
            <div className="flex-1">
              <div className="text-xs font-medium">{entry.action}</div>
              <div className="text-xs text-muted-foreground">
                {entry.mode} • {new Date(entry.timestamp).toLocaleTimeString()}
              </div>
            </div>
            {onRestore && index > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRestore(entry)}
                className="h-6 px-2"
              >
                <RotateCcw className="h-3 w-3" />
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Main Form Mode Manager component
 */
export const FormModeManager = <T extends FieldValues = FieldValues>({
  schema,
  initialValues = {} as Partial<T>,
  defaultMode = 'dual',
  onSubmit,
  onChange,
  onModeChange,
  className,
  enablePreview = true,
  enableHistory = false,
  enableModeComparison = true,
  config = {}
}: FormModeManagerProps<T>) => {
  const [state, setState] = useState<FormModeManagerState<T>>(() => ({
    currentMode: defaultMode,
    treeBuilderState: {
      values: initialValues,
      isValid: false,
      isDirty: false,
      errors: {},
      touchedFields: {}
    },
    propertyEditorState: {
      values: initialValues,
      isValid: false,
      isDirty: false,
      errors: {},
      touchedFields: {}
    },
    sharedValues: initialValues,
    history: []
  }));

  const [showComparison, setShowComparison] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Add history entry
  const addHistoryEntry = useCallback((action: string, mode: FormMode, values: Partial<T>) => {
    if (!enableHistory) return;

    setState(prev => ({
      ...prev,
      history: [
        ...prev.history,
        {
          timestamp: Date.now(),
          mode,
          values: { ...values },
          action
        }
      ].slice(-50) // Keep last 50 entries
    }));
  }, [enableHistory]);

  // Handle mode changes
  const handleModeChange = useCallback((newMode: FormMode) => {
    setState(prev => ({
      ...prev,
      currentMode: newMode
    }));
    
    addHistoryEntry(`Switched to ${newMode}`, newMode, state.sharedValues);
    onModeChange?.(newMode);
  }, [addHistoryEntry, onModeChange, state.sharedValues]);

  // Handle tree builder changes
  const handleTreeBuilderChange = useCallback((values: T, isValid: boolean) => {
    setState(prev => {
      const newSharedValues = { ...prev.sharedValues, ...values };
      return {
        ...prev,
        treeBuilderState: {
          values,
          isValid,
          isDirty: true,
          errors: {},
          touchedFields: {}
        },
        sharedValues: newSharedValues
      };
    });

    onChange?.(values, isValid, 'tree_builder');
  }, [onChange]);

  // Handle property editor changes
  const handlePropertyEditorChange = useCallback((values: T, isValid: boolean) => {
    setState(prev => {
      const newSharedValues = { ...prev.sharedValues, ...values };
      return {
        ...prev,
        propertyEditorState: {
          values,
          isValid,
          isDirty: true,
          errors: {},
          touchedFields: {}
        },
        sharedValues: newSharedValues
      };
    });

    onChange?.(values, isValid, 'property_editor');
  }, [onChange]);

  // Handle form submission
  const handleSubmit = useCallback((values: T, mode: FormMode) => {
    addHistoryEntry('Form submitted', mode, values);
    onSubmit?.(values, mode);
  }, [addHistoryEntry, onSubmit]);

  // Handle history restoration
  const handleHistoryRestore = useCallback((entry: FormModeManagerState<T>['history'][0]) => {
    setState(prev => ({
      ...prev,
      sharedValues: entry.values,
      treeBuilderState: {
        ...prev.treeBuilderState,
        values: entry.values
      },
      propertyEditorState: {
        ...prev.propertyEditorState,
        values: entry.values
      }
    }));
    
    addHistoryEntry('Restored from history', entry.mode, entry.values);
  }, [addHistoryEntry]);

  // Merge values from both modes
  const mergedValues = useMemo(() => {
    return {
      ...state.treeBuilderState.values,
      ...state.propertyEditorState.values
    };
  }, [state.treeBuilderState.values, state.propertyEditorState.values]);

  // Calculate overall validity
  const isOverallValid = useMemo(() => {
    if (state.currentMode === 'dual') {
      return state.treeBuilderState.isValid && state.propertyEditorState.isValid;
    }
    return state.currentMode === 'tree_builder' 
      ? state.treeBuilderState.isValid 
      : state.propertyEditorState.isValid;
  }, [state]);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Manager Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Form Configuration</h2>
          <p className="text-sm text-muted-foreground">
            Configure {schema.component_type} component properties
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode comparison toggle */}
          {enableModeComparison && state.currentMode === 'dual' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowComparison(!showComparison)}
            >
              {showComparison ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showComparison ? 'Hide' : 'Show'} Comparison
            </Button>
          )}

          {/* History toggle */}
          {enableHistory && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
            >
              History ({state.history.length})
            </Button>
          )}

          {/* Overall status */}
          <Badge 
            variant={isOverallValid ? "default" : "destructive"}
            className="flex items-center gap-1"
          >
            {isOverallValid ? (
              <CheckCircle2 className="h-3 w-3" />
            ) : (
              <AlertTriangle className="h-3 w-3" />
            )}
            {isOverallValid ? 'Valid' : 'Issues'}
          </Badge>
        </div>
      </div>

      {/* Mode comparison */}
      {showComparison && enableModeComparison && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Mode Comparison</CardTitle>
            <CardDescription className="text-xs">
              Compare configuration between Tree Builder and Property Editor modes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ModeComparison
              schema={schema}
              treeState={state.treeBuilderState}
              propertyState={state.propertyEditorState}
            />
          </CardContent>
        </Card>
      )}

      {/* History panel */}
      {showHistory && enableHistory && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Change History</CardTitle>
          </CardHeader>
          <CardContent>
            <FormHistory
              history={state.history}
              onRestore={handleHistoryRestore}
            />
          </CardContent>
        </Card>
      )}

      {/* Main form interface */}
      {state.currentMode === 'dual' ? (
        <Tabs defaultValue="property_editor" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="tree_builder" className="flex items-center gap-2">
              <TreePine className="h-4 w-4" />
              Tree Builder
              <Badge variant="outline" className="ml-1">
                {Object.keys(state.treeBuilderState.values).length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="property_editor" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Properties
              <Badge variant="outline" className="ml-1">
                {Object.keys(state.propertyEditorState.values).length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tree_builder">
            <DynamicFormGenerator
              schema={schema}
              initialValues={state.treeBuilderState.values}
              mode="tree_builder"
              onChange={handleTreeBuilderChange}
              onSubmit={(values) => handleSubmit(values, 'tree_builder')}
              config={config}
              enableModeToggle={false}
            />
          </TabsContent>

          <TabsContent value="property_editor">
            <DynamicFormGenerator
              schema={schema}
              initialValues={state.propertyEditorState.values}
              mode="property_editor"
              onChange={handlePropertyEditorChange}
              onSubmit={(values) => handleSubmit(values, 'property_editor')}
              config={config}
              enableModeToggle={false}
            />
          </TabsContent>
        </Tabs>
      ) : (
        <DynamicFormGenerator
          schema={schema}
          initialValues={mergedValues}
          mode={state.currentMode}
          onChange={(values, isValid) => {
            if (state.currentMode === 'tree_builder') {
              handleTreeBuilderChange(values, isValid);
            } else {
              handlePropertyEditorChange(values, isValid);
            }
          }}
          onSubmit={(values) => handleSubmit(values, state.currentMode)}
          onModeChange={handleModeChange}
          config={config}
          enableModeToggle={true}
        />
      )}
    </div>
  );
};

export default FormModeManager;