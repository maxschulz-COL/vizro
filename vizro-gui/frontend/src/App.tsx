import React, { useState } from 'react'
import { Button } from './components/ui/button'
import { Card } from './components/ui/card'

// Test store import
import { useDashboardStore } from './stores/dashboardStore'

// Test schema client import
import { schemaClient } from './lib/schema-client'

// Try importing GUIBuilder
import { GUIBuilder } from './components/gui-builder/GUIBuilder'

function App() {
  // Test if the store works
  const dashboard = useDashboardStore(state => state.dashboard);
  const [schemaStatus, setSchemaStatus] = useState<string>('Not tested');
  const [showGUI, setShowGUI] = useState(false);
  
  const testSchemaClient = async () => {
    try {
      setSchemaStatus('Testing...');
      const components = await schemaClient.getComponents('0.1.43');
      setSchemaStatus(`✅ Schema client working - Found ${components.components.length} components`);
    } catch (error) {
      setSchemaStatus(`❌ Schema client failed: ${error.message}`);
    }
  };
  
  if (showGUI) {
    return <GUIBuilder />;
  }
  
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-2xl font-bold mb-4">Vizro GUI Builder - Debug Mode</h1>
      <p className="text-gray-600">Testing all dependencies...</p>
      <Card className="mt-4 p-4 space-y-4">
        <p>✅ React is working correctly.</p>
        <p>✅ UI components working (Button, Card)</p>
        <p>✅ Store working - Dashboard title: {dashboard?.title || 'No title'}</p>
        <p>✅ Schema client imported successfully</p>
        <p>✅ GUIBuilder imported successfully</p>
        <p>Schema client test: {schemaStatus}</p>
        <div className="space-y-2">
          <Button onClick={() => alert(`Dashboard has ${dashboard?.pages?.length || 0} pages`)}>
            Show dashboard info
          </Button>
          <Button onClick={testSchemaClient} variant="outline">
            Test schema client
          </Button>
          <Button onClick={() => setShowGUI(true)} variant="default">
            🚀 Launch GUI Builder
          </Button>
        </div>
      </Card>
    </div>
  )
}

export default App