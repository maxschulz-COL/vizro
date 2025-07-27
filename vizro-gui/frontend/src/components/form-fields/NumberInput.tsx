import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { NumberInputProps } from '@/types/schema';

/**
 * Numeric input component with validation
 * 
 * Handles integer and float inputs with min/max validation and step controls.
 * Provides real-time validation feedback and proper number formatting.
 */
export const NumberInput: React.FC<NumberInputProps> = ({
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
  min,
  max,
  step = 1,
  placeholder,
  ...props
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Allow empty string for clearing the field
    if (inputValue === '') {
      onChange(null);
      return;
    }
    
    // Parse the number based on step precision
    const numValue = step % 1 === 0 ? parseInt(inputValue, 10) : parseFloat(inputValue);
    
    // Only update if it's a valid number
    if (!isNaN(numValue)) {
      onChange(numValue);
    }
  };

  const handleBlur = () => {
    // Validate range on blur
    if (value !== null && value !== undefined) {
      let validatedValue = value;
      
      if (min !== undefined && value < min) {
        validatedValue = min;
        onChange(min);
      } else if (max !== undefined && value > max) {
        validatedValue = max;
        onChange(max);
      }
    }
    
    if (onBlur) onBlur();
  };

  // Format display value
  const displayValue = value === null || value === undefined ? '' : String(value);

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
      
      <Input
        id={name}
        name={name}
        type="number"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        disabled={disabled}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        className={cn(
          error && "border-destructive focus-visible:ring-destructive",
          className
        )}
        aria-describedby={description ? `${name}-description` : undefined}
        aria-invalid={!!error}
        {...props}
      />
      
      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
      
      {(min !== undefined || max !== undefined) && (
        <p className="text-xs text-muted-foreground">
          {min !== undefined && max !== undefined 
            ? `Range: ${min} to ${max}`
            : min !== undefined 
            ? `Minimum: ${min}`
            : `Maximum: ${max}`
          }
        </p>
      )}
    </div>
  );
};