import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Plus, Trash2, GripVertical, ChevronDown, ChevronRight } from 'lucide-react';
import { FormFieldProps } from '@/types/schema';
import { SelectInput } from '@/components/form-fields/SelectInput';

interface ComponentReference {
  id: string;
  type: string;
  title?: string;
}

/**
 * Specialized input for Page components list
 * 
 * Manages the list of components on a page with proper ordering,
 * component type selection, and reference management.
 */
export const ComponentListInput: React.FC<FormFieldProps> = ({
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
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  // Available component types (would come from schema in real implementation)
  const componentTypes = [
    { value: 'Graph', label: 'Graph' },
    { value: 'Table', label: 'Table' },
    { value: 'Text', label: 'Text' },
    { value: 'Card', label: 'Card' },
    { value: 'Button', label: 'Button' },
    { value: 'Container', label: 'Container' },
    { value: 'Tabs', label: 'Tabs' },
  ];

  const handleAddComponent = () => {
    const newComponent: ComponentReference = {
      id: `component_${Date.now()}`,
      type: 'Graph',
      title: ''
    };
    
    const newValue = Array.isArray(value) ? [...value] : [];
    newValue.push(newComponent);
    onChange(newValue);
  };

  const handleRemoveComponent = (index: number) => {
    const newValue = Array.isArray(value) ? value.filter((_, i) => i !== index) : [];
    onChange(newValue);
    
    // Remove from expanded items
    const newExpanded = new Set(expandedItems);
    newExpanded.delete(index);
    setExpandedItems(newExpanded);
  };

  const handleComponentChange = (index: number, field: keyof ComponentReference, fieldValue: any) => {
    const newValue = Array.isArray(value) ? [...value] : [];
    const component = { ...newValue[index] };
    component[field] = fieldValue;
    newValue[index] = component;
    onChange(newValue);
  };

  const toggleExpanded = (index: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null) return;
    
    const newValue = Array.isArray(value) ? [...value] : [];
    const draggedItem = newValue[draggedIndex];
    
    // Remove the dragged item
    newValue.splice(draggedIndex, 1);
    
    // Insert at new position
    newValue.splice(dropIndex, 0, draggedItem);
    
    onChange(newValue);
    setDraggedIndex(null);
  };

  const handleBlur = () => {
    if (onBlur) onBlur();
  };

  const components = Array.isArray(value) ? value : [];

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
          onClick={handleAddComponent}
          disabled={disabled}
          className="h-7 px-2"
        >
          <Plus className="h-3 w-3 mr-1" />
          Add Component
        </Button>
      </div>
      
      {description && (
        <p className="text-xs text-muted-foreground">
          {description}
        </p>
      )}
      
      {components.length === 0 ? (
        <div className="p-6 border-2 border-dashed border-muted-foreground/25 rounded-md text-center">
          <p className="text-sm text-muted-foreground">
            No components added yet. Click "Add Component" to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {components.map((component: ComponentReference, index: number) => {
            const isExpanded = expandedItems.has(index);
            
            return (
              <div
                key={component.id || index}
                className="border rounded-md bg-background"
                draggable={!disabled}
                onDragStart={() => handleDragStart(index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
              >
                {/* Component Header */}
                <div className="flex items-center gap-2 p-3">
                  <div className="cursor-move text-muted-foreground">
                    <GripVertical className="h-4 w-4" />
                  </div>
                  
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
                        {component.type}
                      </span>
                      {component.title && (
                        <span className="text-xs text-muted-foreground">
                          - {component.title}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        ({component.id})
                      </span>
                    </div>
                  </div>
                  
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveComponent(index)}
                    disabled={disabled}
                    className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                
                {/* Component Details */}
                {isExpanded && (
                  <div className="px-3 pb-3 space-y-3 border-t bg-muted/20">
                    <div className="grid grid-cols-2 gap-3 pt-3">
                      <div>
                        <Label className="text-xs font-medium">Component Type</Label>
                        <SelectInput
                          name={`${name}-${index}-type`}
                          label=""
                          value={component.type}
                          onChange={(newType) => handleComponentChange(index, 'type', newType)}
                          onBlur={handleBlur}
                          options={componentTypes}
                          disabled={disabled}
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label className="text-xs font-medium">Component ID</Label>
                        <input
                          type="text"
                          value={component.id || ''}
                          onChange={(e) => handleComponentChange(index, 'id', e.target.value)}
                          onBlur={handleBlur}
                          disabled={disabled}
                          className="mt-1 h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                          placeholder="unique_component_id"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-xs font-medium">Title (Optional)</Label>
                      <input
                        type="text"
                        value={component.title || ''}
                        onChange={(e) => handleComponentChange(index, 'title', e.target.value)}
                        onBlur={handleBlur}
                        disabled={disabled}
                        className="mt-1 h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                        placeholder="Component display title"
                      />
                    </div>
                    
                    <div className="text-xs text-muted-foreground">
                      <p>Configure additional properties for this {component.type} component in the Property Editor.</p>
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
        {components.length} component{components.length !== 1 ? 's' : ''} configured
      </div>
    </div>
  );
};