/**
 * Main GUI Builder Component - Three Panel Layout
 * 
 * Provides the core interface for the Vizro GUI Builder with:
 * - Left Panel: Component Tree Builder
 * - Center Panel: Preview (JSON/YAML output)
 * - Right Panel: Property Editor
 */

import React, { useEffect } from 'react';
import './gui-builder.css';
import { useDashboardStore } from '@/stores/dashboardStore';
import { schemaClient } from '@/lib/schema-client';
import { ComponentTree } from './ComponentTree';
import { PreviewPanel } from './PreviewPanel';
import { PropertyPanel } from './PropertyPanel';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Save, 
  Download, 
  Upload, 
  RefreshCw, 
  Settings,
  FileText,
  Play
} from 'lucide-react';

/**
 * Top navigation bar for the GUI Builder
 */
const TopNavigation: React.FC = () => {
  const dashboard = useDashboardStore(state => state.dashboard);
  const selectedComponent = useDashboardStore(state => state.selectedComponent);
  const exportDashboard = useDashboardStore(state => state.exportDashboard);
  const resetDashboard = useDashboardStore(state => state.resetDashboard);

  const handleExport = () => {
    const config = exportDashboard();
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${dashboard.title.toLowerCase().replace(/\s+/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.yaml,.yml';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const config = JSON.parse(e.target?.result as string);
            // TODO: Implement import logic
            console.log('Import config:', config);
          } catch (error) {
            console.error('Failed to parse config file:', error);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  return (
    <div className="h-14 border-b bg-background flex items-center justify-between px-6">
      {/* Left section - Title and info */}
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-lg font-semibold">{dashboard.title}</h1>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Pages: {dashboard.pages.length}</span>
            <Separator orientation="vertical" className="h-3" />
            <span>Components: {dashboard.pages.reduce((acc, page) => acc + page.components.length, 0)}</span>
            {selectedComponent && (
              <>
                <Separator orientation="vertical" className="h-3" />
                <Badge variant="secondary" className="text-xs">
                  {selectedComponent.nodeType}: {selectedComponent.nodeId.split('-')[0]}
                </Badge>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right section - Actions */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={handleImport}>
          <Upload className="h-4 w-4 mr-1" />
          Import
        </Button>
        
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="h-4 w-4 mr-1" />
          Export
        </Button>
        
        <Separator orientation="vertical" className="h-4" />
        
        <Button variant="outline" size="sm">
          <Save className="h-4 w-4 mr-1" />
          Save
        </Button>
        
        <Button variant="outline" size="sm">
          <Play className="h-4 w-4 mr-1" />
          Preview
        </Button>
        
        <Button variant="outline" size="sm" onClick={resetDashboard}>
          <RefreshCw className="h-4 w-4 mr-1" />
          Reset
        </Button>
        
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

/**
 * Panel divider with resize handle (future enhancement)
 */
const PanelDivider: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`w-px bg-border ${className}`} />
);

/**
 * Main GUI Builder component with three-panel layout
 */
export const GUIBuilder: React.FC = () => {
  const setAvailableComponents = useDashboardStore(state => state.setAvailableComponents);
  const selectedComponent = useDashboardStore(state => state.selectedComponent);
  const initializeDashboard = useDashboardStore(state => state.initializeDashboard);

  // Load available components on mount
  useEffect(() => {
    const loadComponents = async () => {
      try {
        const response = await schemaClient.getComponents();
        const componentTypes = response.components
          .filter(c => c.is_root_component)
          .map(c => c.component_type)
          .sort();
        setAvailableComponents(componentTypes);
      } catch (error) {
        console.error('Failed to load components:', error);
        // Fallback to common component types
        setAvailableComponents(['Graph', 'Table', 'Card', 'Container', 'Filter']);
      }
    };

    loadComponents();
  }, [setAvailableComponents]);

  // Initialize dashboard on mount
  useEffect(() => {
    initializeDashboard('My Dashboard');
  }, [initializeDashboard]);

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top Navigation */}
      <TopNavigation />

      {/* Main Three-Panel Layout */}
      <div className="flex-1 flex overflow-hidden gui-builder-panels">
        {/* Left Panel - Component Tree */}
        <div className="w-80 border-r bg-background flex flex-col panel-left panel-transition">
          <div className="p-4 border-b bg-muted/20">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <h2 className="font-medium">Component Tree</h2>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Build your dashboard structure
            </p>
          </div>
          <div className="flex-1 overflow-auto custom-scrollbar">
            <ComponentTree />
          </div>
        </div>

        <PanelDivider />

        {/* Center Panel - Preview */}
        <div className="flex-1 flex flex-col min-w-0 panel-center">
          <div className="p-4 border-b bg-muted/20">
            <div className="flex items-center gap-2">
              <Play className="h-4 w-4 text-primary" />
              <h2 className="font-medium">Configuration Preview</h2>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Generated Vizro configuration
            </p>
          </div>
          <div className="flex-1 overflow-auto">
            <PreviewPanel />
          </div>
        </div>

        <PanelDivider />

        {/* Right Panel - Property Editor */}
        <div className="w-96 border-l bg-background flex flex-col panel-right panel-transition">
          <div className="p-4 border-b bg-muted/20">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-primary" />
              <h2 className="font-medium">Properties</h2>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {selectedComponent 
                ? `Edit ${selectedComponent.nodeType} properties`
                : 'Select a component to edit properties'
              }
            </p>
          </div>
          <div className="flex-1 overflow-auto custom-scrollbar">
            <PropertyPanel />
          </div>
        </div>
      </div>
    </div>
  );
};

export default GUIBuilder;