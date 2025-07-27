import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-8">
          Vizro GUI Builder
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-96">
          {/* Top Navigation Bar */}
          <div className="lg:col-span-4 bg-card border rounded-lg p-4">
            <h2 className="text-lg font-semibold">Top Navigation Bar</h2>
            <p className="text-muted-foreground">Login, Save, Export, etc.</p>
          </div>
          
          {/* Tree Builder (Left Panel) */}
          <div className="bg-card border rounded-lg p-4">
            <h2 className="text-lg font-semibold">Tree Builder</h2>
            <p className="text-muted-foreground">Schema-driven form for component hierarchy</p>
          </div>
          
          {/* Central Preview */}
          <div className="lg:col-span-2 bg-card border rounded-lg p-4">
            <h2 className="text-lg font-semibold">Central Preview</h2>
            <p className="text-muted-foreground">JSON/YAML output with validation</p>
            
            <div className="mt-4 p-4 bg-muted rounded">
              <p>✅ Connected to backend API</p>
              <p>Frontend is running on: <code>http://localhost:3000</code></p>
              <p>Backend API expected at: <code>http://localhost:8000</code></p>
            </div>
          </div>
          
          {/* Property Editor (Right Panel) */}
          <div className="bg-card border rounded-lg p-4">
            <h2 className="text-lg font-semibold">Property Editor</h2>
            <p className="text-muted-foreground">Schema-driven form for component properties</p>
          </div>
        </div>
        
        <div className="text-center mt-8">
          <button 
            className="bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90"
            onClick={() => setCount((count) => count + 1)}
          >
            Test Counter: {count}
          </button>
        </div>
      </div>
    </div>
  )
}

export default App