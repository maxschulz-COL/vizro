import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { TextInputProps } from '@/types/schema';

/**
 * Generic text input component with multiline support
 * 
 * Handles both single-line and multiline text input based on field requirements.
 * Automatically switches to textarea for longer content or when explicitly configured.
 */
export const TextInput: React.FC<TextInputProps> = ({
  name,
  label,
  description,
  required = false,
  disabled = false,
  value = '',
  onChange,
  onBlur,
  error,
  className,
  placeholder,
  maxLength,
  minLength,
  pattern,
  multiline = false,
  ...props
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const handleBlur = () => {
    if (onBlur) onBlur();
  };

  // Auto-detect multiline based on content length or explicit setting
  const shouldUseTextarea = multiline || (typeof value === 'string' && value.length > 100);

  const commonProps = {
    id: name,
    name,
    value: value || '',
    onChange: handleChange,
    onBlur: handleBlur,
    disabled,
    placeholder,
    maxLength,
    minLength,
    pattern,
    className: cn(
      error && "border-destructive focus-visible:ring-destructive",
      className
    ),
    'aria-describedby': description ? `${name}-description` : undefined,
    'aria-invalid': !!error,
    ...props
  };

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
      
      {shouldUseTextarea ? (
        <Textarea {...commonProps} />
      ) : (
        <Input type="text" {...commonProps} />
      )}
      
      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
      
      {maxLength && (
        <p className="text-xs text-muted-foreground text-right">
          {(value?.length || 0)}/{maxLength}
        </p>
      )}
    </div>
  );
};