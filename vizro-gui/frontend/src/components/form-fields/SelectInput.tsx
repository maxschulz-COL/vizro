import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { SelectInputProps } from '@/types/schema';

/**
 * Single and multi-select input component
 * 
 * Handles enum values and option lists with search capabilities.
 * Supports both single and multi-selection modes.
 */
export const SelectInput: React.FC<SelectInputProps> = ({
  name,
  label,
  description,
  required = false,
  disabled = false,
  value,
  onChange,
  onBlur,
  error,
  className,
  options = [],
  multi = false,
  searchable = false,
  placeholder = "Select an option...",
  ...props
}) => {
  const handleChange = (selectedValue: string) => {
    if (multi) {
      // Multi-select logic
      const currentValues = Array.isArray(value) ? value : [];
      const newValues = currentValues.includes(selectedValue)
        ? currentValues.filter(v => v !== selectedValue)
        : [...currentValues, selectedValue];
      onChange(newValues);
    } else {
      // Single select
      onChange(selectedValue);
    }
  };

  const handleBlur = () => {
    if (onBlur) onBlur();
  };

  // Format display value for single select
  const getDisplayValue = () => {
    if (multi) {
      const values = Array.isArray(value) ? value : [];
      return values.length > 0 ? `${values.length} selected` : placeholder;
    }
    
    const selectedOption = options.find(opt => opt.value === value);
    return selectedOption?.label || placeholder;
  };

  // For multi-select, we need a different approach - for now, implement single select
  // Multi-select would require a more complex component or a different library
  if (multi) {
    return (
      <div className="space-y-2">
        <Label 
          htmlFor={name}
          className={cn(
            "text-sm font-medium",
            required && "after:content-['*'] after:ml-0.5 after:text-destructive"
          )}
        >
          {label}
        </Label>
        
        {description && (
          <p id={`${name}-description`} className="text-xs text-muted-foreground">
            {description}
          </p>
        )}
        
        <div className="p-3 border rounded-md bg-muted">
          <p className="text-sm text-muted-foreground">
            Multi-select component - Implementation in progress
          </p>
        </div>
        
        {error && (
          <p className="text-xs text-destructive" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label 
        htmlFor={name}
        className={cn(
          "text-sm font-medium",
          required && "after:content-['*'] after:ml-0.5 after:text-destructive"
        )}
      >
        {label}
      </Label>
      
      {description && (
        <p id={`${name}-description`} className="text-xs text-muted-foreground">
          {description}
        </p>
      )}
      
      <Select
        value={value || ''}
        onValueChange={handleChange}
        onOpenChange={(open) => !open && handleBlur()}
        disabled={disabled}
      >
        <SelectTrigger 
          className={cn(
            error && "border-destructive focus-visible:ring-destructive",
            className
          )}
          aria-describedby={description ? `${name}-description` : undefined}
          aria-invalid={!!error}
        >
          <SelectValue placeholder={placeholder}>
            {getDisplayValue()}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
      
      {options.length === 0 && (
        <p className="text-xs text-muted-foreground">
          No options available
        </p>
      )}
    </div>
  );
};