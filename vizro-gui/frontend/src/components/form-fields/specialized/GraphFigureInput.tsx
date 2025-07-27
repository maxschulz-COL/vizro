import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Code, Eye, Edit } from 'lucide-react';
import { FormFieldProps } from '@/types/schema';

/**
 * Specialized input for Graph figure configuration
 * 
 * Handles CapturedCallable function definitions for Plotly figures.
 * Provides both code editing and visual preview modes.
 */
export const GraphFigureInput: React.FC<FormFieldProps> = ({
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
  ...props
}) => {
  const [mode, setMode] = useState<'code' | 'preview'>('code');
  const [isValid, setIsValid] = useState(true);

  const handleChange = (newValue: string) => {
    onChange(newValue);
    
    // Basic validation for Python function syntax
    try {
      // Simple check for basic function structure
      const hasFunction = /def\s+\w+\s*\(/.test(newValue) || /lambda\s*[^:]*:/.test(newValue);
      const hasReturn = /return\s+/.test(newValue) || newValue.includes('lambda');
      setIsValid(newValue === '' || (hasFunction && hasReturn));
    } catch {
      setIsValid(false);
    }
  };

  const handleBlur = () => {
    if (onBlur) onBlur();
  };

  const getDefaultTemplate = () => {
    return `import plotly.express as px

def create_figure(data_frame):
    """
    Create a Plotly figure for the Graph component.
    
    Args:
        data_frame: The DataFrame to visualize
        
    Returns:
        plotly.graph_objects.Figure: The figure to display
    """
    return px.scatter(
        data_frame,
        x="x_column",
        y="y_column",
        title="My Chart"
    )`;
  };

  const insertTemplate = () => {
    if (!value.trim()) {
      onChange(getDefaultTemplate());
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <Label 
          htmlFor={name}
          className={cn(
            "text-sm font-medium",
            required && "after:content-['*'] after:ml-0.5 after:text-destructive"
          )}
        >
          {label}
        </Label>
        
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={mode === 'code' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('code')}
            disabled={disabled}
            className="h-7 px-2"
          >
            <Code className="h-3 w-3 mr-1" />
            Code
          </Button>
          <Button
            type="button"
            variant={mode === 'preview' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('preview')}
            disabled={disabled || !isValid}
            className="h-7 px-2"
          >
            <Eye className="h-3 w-3 mr-1" />
            Preview
          </Button>
        </div>
      </div>
      
      {description && (
        <p className="text-xs text-muted-foreground">
          {description}
        </p>
      )}
      
      {mode === 'code' && (
        <>
          <div className="space-y-2">
            <Textarea
              id={name}
              name={name}
              value={value || ''}
              onChange={(e) => handleChange(e.target.value)}
              onBlur={handleBlur}
              disabled={disabled}
              placeholder="Enter Python function that returns a Plotly figure..."
              className={cn(
                "min-h-[200px] font-mono text-sm",
                error && "border-destructive focus-visible:ring-destructive",
                !isValid && value && "border-orange-400 focus-visible:ring-orange-400"
              )}
              aria-describedby={description ? `${name}-description` : undefined}
              aria-invalid={!!error}
              {...props}
            />
            
            {!value.trim() && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={insertTemplate}
                disabled={disabled}
                className="w-full"
              >
                <Edit className="h-3 w-3 mr-1" />
                Insert Template
              </Button>
            )}
          </div>
          
          <div className="text-xs space-y-1">
            <div className={cn(
              "flex items-center gap-2",
              isValid ? "text-green-600" : "text-orange-600"
            )}>
              <div className={cn(
                "w-2 h-2 rounded-full",
                isValid ? "bg-green-500" : "bg-orange-500"
              )} />
              {isValid ? "Valid function syntax" : "Function syntax needs review"}
            </div>
            
            <p className="text-muted-foreground">
              Expected: Python function that accepts data_frame and returns a Plotly figure
            </p>
          </div>
        </>
      )}
      
      {mode === 'preview' && (
        <div className="border rounded-md p-4 bg-muted/50 min-h-[200px]">
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <Eye className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Figure preview will be implemented
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                This would show a live preview of the Plotly figure
              </p>
            </div>
          </div>
        </div>
      )}
      
      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
      
      <div className="text-xs text-muted-foreground">
        <details className="group">
          <summary className="cursor-pointer hover:text-foreground">
            Documentation & Examples
          </summary>
          <div className="mt-2 space-y-2 pl-4 border-l-2 border-muted">
            <p>The function should:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Accept a pandas DataFrame as the first parameter</li>
              <li>Return a plotly.graph_objects.Figure or plotly.express figure</li>
              <li>Handle data filtering and transformation as needed</li>
            </ul>
            <p className="mt-2">
              <strong>Example:</strong> px.bar(data_frame, x="category", y="value")
            </p>
          </div>
        </details>
      </div>
    </div>
  );
};