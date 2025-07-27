import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { CheckboxInputProps } from '@/types/schema';

/**
 * Boolean checkbox input component
 * 
 * Provides a clean interface for boolean values with proper labeling
 * and accessibility support.
 */
export const CheckboxInput: React.FC<CheckboxInputProps> = ({
  name,
  label,
  description,
  required = false,
  disabled = false,
  value = false,
  onChange,
  onBlur,
  error,
  className,
  ...props
}) => {
  const handleChange = (checked: boolean) => {
    onChange(checked);
  };

  const handleBlur = () => {
    if (onBlur) onBlur();
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center space-x-2">
        <Checkbox
          id={name}
          name={name}
          checked={value}
          onCheckedChange={handleChange}
          onBlur={handleBlur}
          disabled={disabled}
          className={cn(
            error && "border-destructive focus-visible:ring-destructive"
          )}
          aria-describedby={description ? `${name}-description` : undefined}
          aria-invalid={!!error}
          {...props}
        />
        <Label 
          htmlFor={name}
          className={cn(
            "text-sm font-medium cursor-pointer",
            required && "after:content-['*'] after:ml-0.5 after:text-destructive",
            disabled && "cursor-not-allowed opacity-50"
          )}
        >
          {label}
        </Label>
      </div>
      
      {description && (
        <p id={`${name}-description`} className="text-xs text-muted-foreground ml-6">
          {description}
        </p>
      )}
      
      {error && (
        <p className="text-xs text-destructive ml-6" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};