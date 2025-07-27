import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Plus, Trash2, Settings, ChevronDown, ChevronRight } from 'lucide-react';
import { FormFieldProps } from '@/types/schema';
import { SelectInput } from '@/components/form-fields/SelectInput';

interface ActionReference {
  type: string;
  function?: string;
  inputs?: string[];
  outputs?: string[];
  targets?: string[];
}

/**
 * Specialized input for component actions configuration
 * 
 * Manages the list of actions for components with proper
 * action type selection and parameter configuration.
 */
export const ActionsInput: React.FC<FormFieldProps> = ({
  name,
  label,
  description,
  required = false,
  disabled = false,
  value = [],
  onChange,
  onBlur,
  error,
  className,
  ...props
}) => {
  const [expandedActions, setExpandedActions] = useState<Set<number>>(new Set());

  // Available action types (would come from schema analysis)
  const actionTypes = [
    { value: 'export_data', label: 'Export Data' },
    { value: 'filter_interaction', label: 'Filter Interaction' },
    { value: 'custom', label: 'Custom Action' },
  ];

  const handleAddAction = () => {
    const newAction: ActionReference = {
      type: 'export_data',
      targets: []
    };
    
    const newValue = Array.isArray(value) ? [...value] : [];
    newValue.push(newAction);
    onChange(newValue);
  };

  const handleRemoveAction = (index: number) => {
    const newValue = Array.isArray(value) ? value.filter((_, i) => i !== index) : [];
    onChange(newValue);
    
    // Remove from expanded actions
    const newExpanded = new Set(expandedActions);
    newExpanded.delete(index);
    setExpandedActions(newExpanded);
  };

  const handleActionChange = (index: number, field: keyof ActionReference, fieldValue: any) => {
    const newValue = Array.isArray(value) ? [...value] : [];
    const action = { ...newValue[index] };
    action[field] = fieldValue;
    newValue[index] = action;
    onChange(newValue);
  };

  const toggleExpanded = (index: number) => {
    const newExpanded = new Set(expandedActions);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedActions(newExpanded);
  };

  const handleBlur = () => {
    if (onBlur) onBlur();
  };

  const actions = Array.isArray(value) ? value : [];

  const getActionDescription = (actionType: string) => {
    switch (actionType) {
      case 'export_data':
        return 'Export visible data from target components to CSV/Excel';
      case 'filter_interaction':
        return 'Filter other components when clicking on data points';
      case 'custom':
        return 'Custom action function with configurable inputs/outputs';
      default:
        return 'Action configuration';
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <Label 
          className={cn(
            "text-sm font-medium",
            required && "after:content-['*'] after:ml-0.5 after:text-destructive"
          )}
        >
          {label}
        </Label>
        
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddAction}
          disabled={disabled}
          className="h-7 px-2"
        >
          <Plus className="h-3 w-3 mr-1" />
          Add Action
        </Button>
      </div>
      
      {description && (
        <p className="text-xs text-muted-foreground">
          {description}
        </p>
      )}
      
      {actions.length === 0 ? (
        <div className="p-4 border-2 border-dashed border-muted-foreground/25 rounded-md text-center">
          <Settings className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No actions configured. Add actions to enable interactivity.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {actions.map((action: ActionReference, index: number) => {
            const isExpanded = expandedActions.has(index);
            
            return (
              <div
                key={index}
                className="border rounded-md bg-background"
              >
                {/* Action Header */}
                <div className="flex items-center gap-2 p-3">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExpanded(index)}
                    className="h-6 w-6 p-0"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronRight className="h-3 w-3" />
                    )}
                  </Button>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {action.type}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {getActionDescription(action.type)}
                      </span>
                    </div>
                  </div>
                  
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveAction(index)}
                    disabled={disabled}
                    className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                
                {/* Action Configuration */}
                {isExpanded && (
                  <div className="px-3 pb-3 space-y-3 border-t bg-muted/20">
                    <div className="pt-3">
                      <Label className="text-xs font-medium">Action Type</Label>
                      <SelectInput
                        name={`${name}-${index}-type`}
                        label=""
                        value={action.type}
                        onChange={(newType) => handleActionChange(index, 'type', newType)}
                        onBlur={handleBlur}
                        options={actionTypes}
                        disabled={disabled}
                        className="mt-1"
                      />
                    </div>
                    
                    {/* Custom action fields */}
                    {action.type === 'custom' && (
                      <div>
                        <Label className="text-xs font-medium">Function Name</Label>
                        <input
                          type="text"
                          value={action.function || ''}
                          onChange={(e) => handleActionChange(index, 'function', e.target.value)}
                          onBlur={handleBlur}
                          disabled={disabled}
                          className="mt-1 h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                          placeholder="my_custom_function"
                        />
                      </div>
                    )}
                    
                    {/* Targets field for all action types */}
                    <div>
                      <Label className="text-xs font-medium">
                        Targets {action.type === 'export_data' ? '(Component IDs to export)' : '(Components to affect)'}
                      </Label>
                      <textarea
                        value={Array.isArray(action.targets) ? action.targets.join(', ') : ''}
                        onChange={(e) => {
                          const targets = e.target.value.split(',').map(t => t.trim()).filter(t => t);
                          handleActionChange(index, 'targets', targets);
                        }}
                        onBlur={handleBlur}
                        disabled={disabled}
                        className="mt-1 h-16 w-full rounded-md border border-input bg-background px-3 py-1 text-sm resize-none"
                        placeholder="component_1, component_2 (leave empty for all components)"
                      />
                    </div>
                    
                    {/* Custom action inputs/outputs */}
                    {action.type === 'custom' && (
                      <>
                        <div>
                          <Label className="text-xs font-medium">Inputs</Label>
                          <textarea
                            value={Array.isArray(action.inputs) ? action.inputs.join(', ') : ''}
                            onChange={(e) => {
                              const inputs = e.target.value.split(',').map(t => t.trim()).filter(t => t);
                              handleActionChange(index, 'inputs', inputs);
                            }}
                            onBlur={handleBlur}
                            disabled={disabled}
                            className="mt-1 h-16 w-full rounded-md border border-input bg-background px-3 py-1 text-sm resize-none"
                            placeholder="component_id.property, other_component"
                          />
                        </div>
                        
                        <div>
                          <Label className="text-xs font-medium">Outputs</Label>
                          <textarea
                            value={Array.isArray(action.outputs) ? action.outputs.join(', ') : ''}
                            onChange={(e) => {
                              const outputs = e.target.value.split(',').map(t => t.trim()).filter(t => t);
                              handleActionChange(index, 'outputs', outputs);
                            }}
                            onBlur={handleBlur}
                            disabled={disabled}
                            className="mt-1 h-16 w-full rounded-md border border-input bg-background px-3 py-1 text-sm resize-none"
                            placeholder="component_id.property, other_component"
                          />
                        </div>
                      </>
                    )}
                    
                    <div className="text-xs text-muted-foreground">
                      <p>{getActionDescription(action.type)}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      
      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
      
      <div className="text-xs text-muted-foreground">
        {actions.length} action{actions.length !== 1 ? 's' : ''} configured
      </div>
    </div>
  );
};