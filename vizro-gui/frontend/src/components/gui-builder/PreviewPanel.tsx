/**
 * Preview Panel - Center Panel of GUI Builder
 * 
 * Displays the generated Vizro configuration in real-time:
 * - JSON format with syntax highlighting
 * - YAML format option
 * - Copy to clipboard functionality
 * - Download configuration
 * - Live validation status
 */

import React, { useState, useMemo } from 'react';
import { useDashboardStore } from '@/stores/dashboardStore';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Copy, 
  Download, 
  Eye, 
  Code, 
  CheckCircle2, 
  AlertTriangle,
  RefreshCw,
  Minimize2,
  Maximize2
} from 'lucide-react';

/**
 * Syntax highlighted JSON component
 */
interface JsonDisplayProps {
  data: any;
  maxHeight?: string;
}

const JsonDisplay: React.FC<JsonDisplayProps> = ({ data, maxHeight = "100%" }) => {
  const jsonString = JSON.stringify(data, null, 2);
  
  return (
    <div className="relative">
      <pre 
        className="text-sm bg-muted/30 p-4 rounded-md overflow-auto font-mono"
        style={{ maxHeight }}
      >
        <code className="text-foreground">{jsonString}</code>
      </pre>
    </div>
  );
};

/**
 * YAML display component (simplified - just formatted JSON for now)
 */
const YamlDisplay: React.FC<JsonDisplayProps> = ({ data, maxHeight = "100%" }) => {
  // For now, we'll show formatted JSON. In future, add proper YAML conversion
  const yamlString = `# Vizro Dashboard Configuration (YAML format coming soon)
${JSON.stringify(data, null, 2)}`;
  
  return (
    <div className="relative">
      <pre 
        className="text-sm bg-muted/30 p-4 rounded-md overflow-auto font-mono"
        style={{ maxHeight }}
      >
        <code className="text-foreground">{yamlString}</code>
      </pre>
    </div>
  );
};

/**
 * Configuration stats component
 */
interface ConfigStatsProps {
  config: any;
}

const ConfigStats: React.FC<ConfigStatsProps> = ({ config }) => {
  const stats = useMemo(() => {
    const dashboard = config.dashboard || {};
    const pages = dashboard.pages || [];
    const totalComponents = pages.reduce((acc: number, page: any) => acc + (page.components?.length || 0), 0);
    
    return {
      pages: pages.length,
      components: totalComponents,
      size: JSON.stringify(config).length,
      hasNavigation: !!dashboard.navigation,
      hasTheme: !!dashboard.theme
    };
  }, [config]);

  return (
    <div className="flex items-center gap-4 text-xs text-muted-foreground">
      <div className="flex items-center gap-1">
        <Badge variant="outline" className="text-xs">
          {stats.pages} Page{stats.pages !== 1 ? 's' : ''}
        </Badge>
        <Badge variant="outline" className="text-xs">
          {stats.components} Component{stats.components !== 1 ? 's' : ''}
        </Badge>
      </div>
      <div className="text-muted-foreground">
        {(stats.size / 1024).toFixed(1)}KB
      </div>
      {stats.hasTheme && (
        <Badge variant="secondary" className="text-xs">
          Themed
        </Badge>
      )}
      {stats.hasNavigation && (
        <Badge variant="secondary" className="text-xs">
          Navigation
        </Badge>
      )}
    </div>
  );
};

/**
 * Action buttons for the preview panel
 */
interface PreviewActionsProps {
  config: any;
  onCopy: () => void;
  onDownload: () => void;
  onRefresh: () => void;
  isValid: boolean;
}

const PreviewActions: React.FC<PreviewActionsProps> = ({
  config,
  onCopy,
  onDownload,
  onRefresh,
  isValid
}) => {
  return (
    <div className="flex items-center gap-2">
      {/* Validation status */}
      <div className="flex items-center gap-1">
        {isValid ? (
          <>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span className="text-xs text-green-600">Valid</span>
          </>
        ) : (
          <>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <span className="text-xs text-yellow-600">Needs validation</span>
          </>
        )}
      </div>

      {/* Action buttons */}
      <Button variant="outline" size="sm" onClick={onRefresh}>
        <RefreshCw className="h-4 w-4 mr-1" />
        Refresh
      </Button>
      
      <Button variant="outline" size="sm" onClick={onCopy}>
        <Copy className="h-4 w-4 mr-1" />
        Copy
      </Button>
      
      <Button variant="outline" size="sm" onClick={onDownload}>
        <Download className="h-4 w-4 mr-1" />
        Download
      </Button>
      
      <Button variant="default" size="sm">
        <Eye className="h-4 w-4 mr-1" />
        Preview
      </Button>
    </div>
  );
};

/**
 * Empty state when no configuration is available
 */
const EmptyPreview: React.FC = () => (
  <div className="flex items-center justify-center h-full">
    <div className="text-center space-y-4">
      <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
        <Code className="h-8 w-8 text-muted-foreground" />
      </div>
      <div>
        <h3 className="text-lg font-medium">No Configuration Yet</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Add pages and components to see the generated configuration
        </p>
      </div>
    </div>
  </div>
);

/**
 * Main Preview Panel Component
 */
export const PreviewPanel: React.FC = () => {
  const dashboard = useDashboardStore(state => state.dashboard);
  const exportDashboard = useDashboardStore(state => state.exportDashboard);
  
  const [format, setFormat] = useState<'json' | 'yaml'>('json');
  const [isMinimized, setIsMinimized] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Generate the configuration
  const config = useMemo(() => {
    return exportDashboard();
  }, [dashboard, exportDashboard]);

  // Check if configuration is meaningful (has content)
  const hasContent = useMemo(() => {
    return config.dashboard.pages.length > 0;
  }, [config]);

  // Basic validation (more sophisticated validation would come from backend)
  const isValid = useMemo(() => {
    // Simple checks for now
    return config.dashboard && 
           Array.isArray(config.dashboard.pages) &&
           config.dashboard.pages.every((page: any) => 
             page.title && Array.isArray(page.components)
           );
  }, [config]);

  const handleCopy = async () => {
    try {
      const text = format === 'json' 
        ? JSON.stringify(config, null, 2)
        : `# Vizro Dashboard Configuration\n${JSON.stringify(config, null, 2)}`;
      
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const handleDownload = () => {
    const text = format === 'json' 
      ? JSON.stringify(config, null, 2)
      : `# Vizro Dashboard Configuration\n${JSON.stringify(config, null, 2)}`;
    
    const blob = new Blob([text], { type: format === 'json' ? 'application/json' : 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${dashboard.title.toLowerCase().replace(/\s+/g, '-')}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRefresh = () => {
    // Force a re-render by updating a timestamp or similar
    // The config is already reactive through the store
  };

  if (!hasContent) {
    return <EmptyPreview />;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with stats and actions */}
      <div className="p-4 border-b space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium">Configuration Output</h3>
            <ConfigStats config={config} />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            {isMinimized ? (
              <Maximize2 className="h-4 w-4" />
            ) : (
              <Minimize2 className="h-4 w-4" />
            )}
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <Tabs value={format} onValueChange={setFormat as any} className="w-auto">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="json">JSON</TabsTrigger>
              <TabsTrigger value="yaml">YAML</TabsTrigger>
            </TabsList>
          </Tabs>

          <PreviewActions
            config={config}
            onCopy={handleCopy}
            onDownload={handleDownload}
            onRefresh={handleRefresh}
            isValid={isValid}
          />
        </div>

        {copySuccess && (
          <div className="text-xs text-green-600 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Copied to clipboard!
          </div>
        )}
      </div>

      {/* Configuration display */}
      {!isMinimized && (
        <div className="flex-1 overflow-hidden">
          <Tabs value={format} className="h-full flex flex-col">
            <TabsContent value="json" className="flex-1 overflow-auto m-0 p-4">
              <JsonDisplay data={config} />
            </TabsContent>
            <TabsContent value="yaml" className="flex-1 overflow-auto m-0 p-4">
              <YamlDisplay data={config} />
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Footer with additional info */}
      <div className="p-4 border-t bg-muted/30">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div>
            Last updated: {new Date().toLocaleTimeString()}
          </div>
          <div>
            Vizro GUI Builder v1.0.0
          </div>
        </div>
      </div>
    </div>
  );
};