import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { ArrayInputProps } from '@/types/schema';

/**
 * Array input component for managing lists of items
 * 
 * Provides add/remove functionality with proper validation
 * and drag-and-drop reordering for array items.
 */
export const ArrayInput: React.FC<ArrayInputProps> = ({
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
  itemSchema,
  minItems,
  maxItems,
  ...props
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleAddItem = () => {
    const newValue = [...value];
    
    // Create default value based on item schema
    let defaultItem: any = null;
    switch (itemSchema.field_type) {
      case 'string':
        defaultItem = '';
        break;
      case 'number':
        defaultItem = 0;
        break;
      case 'boolean':
        defaultItem = false;
        break;
      case 'object':
        defaultItem = {};
        break;
      case 'array':
        defaultItem = [];
        break;
      default:
        defaultItem = itemSchema.default_value ?? null;
    }
    
    newValue.push(defaultItem);
    onChange(newValue);
  };

  const handleRemoveItem = (index: number) => {
    const newValue = value.filter((_, i) => i !== index);
    onChange(newValue);
  };

  const handleItemChange = (index: number, itemValue: any) => {
    const newValue = [...value];
    newValue[index] = itemValue;
    onChange(newValue);
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
    
    const newValue = [...value];
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

  const canAddMore = !maxItems || value.length < maxItems;
  const canRemove = !minItems || value.length > minItems;

  const renderSimpleItem = (item: any, index: number) => {
    const itemProps = {
      name: `${name}-${index}`,
      label: '',
      value: item,
      onChange: (newValue: any) => handleItemChange(index, newValue),
      onBlur: handleBlur,
      disabled,
      className: "flex-1"
    };

    switch (itemSchema.field_type) {
      case 'string':
        return (
          <input
            type="text"
            {...itemProps}
            className="flex-1 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
            onChange={(e) => handleItemChange(index, e.target.value)}
          />
        );
      case 'number':
        return (
          <input
            type="number"
            {...itemProps}
            className="flex-1 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
            onChange={(e) => handleItemChange(index, parseFloat(e.target.value) || 0)}
          />
        );
      case 'boolean':
        return (
          <select
            {...itemProps}
            className="flex-1 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
            onChange={(e) => handleItemChange(index, e.target.value === 'true')}
          >
            <option value="false">False</option>
            <option value="true">True</option>
          </select>
        );
      default:
        return (
          <div className="flex-1 p-2 border rounded bg-muted">
            <span className="text-xs text-muted-foreground">
              Complex item ({itemSchema.field_type})
            </span>
          </div>
        );
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
        
        {canAddMore && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddItem}
            disabled={disabled}
            className="h-7 px-2"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add
          </Button>
        )}
      </div>
      
      {description && (
        <p className="text-xs text-muted-foreground">
          {description}
        </p>
      )}
      
      {value.length === 0 ? (
        <div className="p-4 border-2 border-dashed border-muted-foreground/25 rounded-md text-center">
          <p className="text-sm text-muted-foreground">
            No items yet. Click "Add" to create the first item.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {value.map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-2 p-2 border rounded-md bg-background"
              draggable={!disabled}
              onDragStart={() => handleDragStart(index)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
            >
              <div className="cursor-move text-muted-foreground">
                <GripVertical className="h-4 w-4" />
              </div>
              
              <div className="flex-1">
                {renderSimpleItem(item, index)}
              </div>
              
              {canRemove && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveItem(index)}
                  disabled={disabled}
                  className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
      
      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
      
      {(minItems || maxItems) && (
        <p className="text-xs text-muted-foreground">
          {minItems && maxItems
            ? `${minItems} to ${maxItems} items`
            : minItems
            ? `At least ${minItems} items`
            : `Up to ${maxItems} items`
          }
          {` (${value.length} current)`}
        </p>
      )}
    </div>
  );
};