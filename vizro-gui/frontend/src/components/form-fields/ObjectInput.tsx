import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { ObjectInputProps } from '@/types/schema';

/**
 * Object input component for managing key-value structures
 * 
 * Handles nested objects with property validation and dynamic
 * property addition for objects with additionalProperties.
 */
export const ObjectInput: React.FC<ObjectInputProps> = ({
  name,
  label,
  description,
  required = false,
  disabled = false,
  value = {},
  onChange,
  onBlur,
  error,
  className,
  properties = {},
  additionalProperties = false,
  ...props
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [newPropertyName, setNewPropertyName] = useState('');

  const handlePropertyChange = (propertyName: string, propertyValue: any) => {
    const newValue = { ...value };
    newValue[propertyName] = propertyValue;
    onChange(newValue);
  };

  const handleAddProperty = () => {
    if (!newPropertyName.trim() || value.hasOwnProperty(newPropertyName)) {
      return;
    }

    const newValue = { ...value };
    newValue[newPropertyName] = '';
    onChange(newValue);
    setNewPropertyName('');
  };

  const handleRemoveProperty = (propertyName: string) => {
    const newValue = { ...value };
    delete newValue[propertyName];
    onChange(newValue);
  };

  const handleBlur = () => {
    if (onBlur) onBlur();
  };

  const renderPropertyInput = (propertyName: string, propertySchema: any, propertyValue: any) => {
    const baseProps = {
      name: `${name}.${propertyName}`,
      label: propertySchema?.title || propertyName,
      description: propertySchema?.description,
      value: propertyValue,
      onChange: (newValue: any) => handlePropertyChange(propertyName, newValue),
      onBlur: handleBlur,
      disabled,
      required: properties[propertyName]?.validation?.required || false
    };

    // Simple input rendering - in a full implementation, this would use the component registry
    const fieldType = propertySchema?.field_type || 'string';
    
    switch (fieldType) {
      case 'string':
        return (
          <div key={propertyName} className="space-y-1">
            <Label className="text-xs font-medium">{baseProps.label}</Label>
            <Input
              type="text"
              value={propertyValue || ''}
              onChange={(e) => handlePropertyChange(propertyName, e.target.value)}
              disabled={disabled}
              className="h-8"
            />
          </div>
        );
      case 'number':
        return (
          <div key={propertyName} className="space-y-1">
            <Label className="text-xs font-medium">{baseProps.label}</Label>
            <Input
              type="number"
              value={propertyValue || ''}
              onChange={(e) => handlePropertyChange(propertyName, parseFloat(e.target.value) || 0)}
              disabled={disabled}
              className="h-8"
            />
          </div>
        );
      case 'boolean':
        return (
          <div key={propertyName} className="space-y-1">
            <Label className="text-xs font-medium">{baseProps.label}</Label>
            <select
              value={propertyValue ? 'true' : 'false'}
              onChange={(e) => handlePropertyChange(propertyName, e.target.value === 'true')}
              disabled={disabled}
              className="h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
            >
              <option value="false">False</option>
              <option value="true">True</option>
            </select>
          </div>
        );
      default:
        return (
          <div key={propertyName} className="space-y-1">
            <Label className="text-xs font-medium">{baseProps.label}</Label>
            <div className="p-2 border rounded bg-muted text-xs text-muted-foreground">
              Complex field ({fieldType})
            </div>
          </div>
        );
    }
  };

  const definedProperties = Object.keys(properties);
  const dynamicProperties = Object.keys(value).filter(key => !definedProperties.includes(key));
  const allProperties = [...definedProperties, ...dynamicProperties];

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="h-6 w-6 p-0"
          >
            {collapsed ? (
              <ChevronRight className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </Button>
          <Label 
            className={cn(
              "text-sm font-medium",
              required && "after:content-['*'] after:ml-0.5 after:text-destructive"
            )}
          >
            {label}
          </Label>
        </div>
        
        <div className="text-xs text-muted-foreground">
          {allProperties.length} properties
        </div>
      </div>
      
      {description && (
        <p className="text-xs text-muted-foreground ml-8">
          {description}
        </p>
      )}
      
      {!collapsed && (
        <div className="ml-6 space-y-3 border-l-2 border-muted pl-4">
          {allProperties.length === 0 ? (
            <div className="p-3 border-2 border-dashed border-muted-foreground/25 rounded-md text-center">
              <p className="text-xs text-muted-foreground">
                No properties defined
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {allProperties.map(propertyName => {
                const propertySchema = properties[propertyName];
                const propertyValue = value[propertyName];
                const isDynamic = !definedProperties.includes(propertyName);
                
                return (
                  <div key={propertyName} className="flex items-start gap-2">
                    <div className="flex-1">
                      {renderPropertyInput(propertyName, propertySchema, propertyValue)}
                    </div>
                    
                    {isDynamic && additionalProperties && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveProperty(propertyName)}
                        disabled={disabled}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive mt-5"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          
          {additionalProperties && (
            <div className="pt-2 border-t">
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  placeholder="Property name"
                  value={newPropertyName}
                  onChange={(e) => setNewPropertyName(e.target.value)}
                  disabled={disabled}
                  className="h-8 flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddProperty();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddProperty}
                  disabled={disabled || !newPropertyName.trim() || value.hasOwnProperty(newPropertyName)}
                  className="h-8 px-3"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
      
      {error && (
        <p className="text-xs text-destructive ml-8" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};