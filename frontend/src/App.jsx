// import React, { useState, useEffect } from 'react';
// import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
// import { 
//   HeartPulse, 
//   AlertTriangle, 
//   CheckCircle2, 
//   Activity, 
//   TrendingUp, 
//   Thermometer,
//   FileText,
//   ChevronRight,
//   BrainCircuit
// } from 'lucide-react';

// // --- 1. MOCK DATA (Simulating your PostgreSQL/JSONB Data) ---
// const PATIENT_DATA = {
//   patient_id: "RL00350879",
//   name: "Sagar Tiwari",
//   history: [
//     { date: "2023-01", glucose: 95, hb1ac: 5.4, creatinine: 0.8 },
//     { date: "2024-01", glucose: 110, hb1ac: 5.8, creatinine: 0.9 },
//     { date: "2025-06", glucose: 169, hb1ac: 6.1, creatinine: 1.1 }
//   ],
//   current_report: [
//     { 
//       test_name: "Glucose Fasting", 
//       value: 169, 
//       unit: "mg/dL", 
//       interpretation: "High", 
//       is_panel: false,
//       test_notes: "Consistent with Diabetes Mellitus profile. Immediate dietary intervention advised."
//     },
//     { 
//       test_name: "HbA1c", 
//       value: 6.1, 
//       unit: "%", 
//       interpretation: "High", 
//       is_panel: false 
//     },
//     { 
//       test_name: "Creatinine", 
//       value: 1.06, 
//       unit: "mg/dL", 
//       interpretation: "Normal", 
//       is_panel: false 
//     },
//     {
//       test_name: "Lipid Profile",
//       is_panel: true,
//       members: [
//         { test_name: "Total Cholesterol", value: 195, unit: "mg/dL", interpretation: "Borderline" },
//         { test_name: "Triglycerides", value: 235, unit: "mg/dL", interpretation: "High", test_notes: "Elevated TG levels. Avoid refined sugars." }
//       ]
//     }
//   ]
// };

// // --- 2. UI COMPONENT REGISTRY (The "Tools") ---

// // A. Metric Card (The Standard Block)
// const MetricCard = ({ data }) => {
//   const isCritical = data.interpretation === "High" || data.interpretation === "Low";
//   const statusColor = isCritical ? "bg-red-50 border-red-200 text-red-700" : "bg-green-50 border-green-200 text-green-700";
//   const icon = isCritical ? <AlertTriangle size={20} /> : <CheckCircle2 size={20} />;

//   return (
//     <div className={`p-5 rounded-xl border ${statusColor} transition-all hover:shadow-md`}>
//       <div className="flex justify-between items-start mb-2">
//         <span className="text-xs font-bold uppercase tracking-wider opacity-70">{data.test_name}</span>
//         {icon}
//       </div>
//       <div className="flex items-baseline gap-1">
//         <span className="text-3xl font-black">{data.value}</span>
//         <span className="text-sm font-medium opacity-80">{data.unit}</span>
//       </div>
//       <div className="mt-3 text-sm font-medium px-2 py-1 bg-white/50 rounded-md inline-block">
//         {data.interpretation}
//       </div>
//       {data.test_notes && (
//         <div className="mt-3 pt-3 border-t border-black/5 text-xs italic opacity-90">
//           "{data.test_notes}"
//         </div>
//       )}
//     </div>
//   );
// };

// // B. Smart Trend Chart (Visualizes History)
// const TrendWidget = ({ history, targetKey, title }) => (
//   <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm col-span-full md:col-span-2">
//     <div className="flex items-center gap-2 mb-6">
//       <TrendingUp className="text-blue-500" size={20} />
//       <h3 className="font-bold text-gray-800">{title} Trajectory (3 Year)</h3>
//     </div>
//     <div className="h-64 w-full">
//       <ResponsiveContainer width="100%" height="100%">
//         <AreaChart data={history}>
//           <defs>
//             <linearGradient id={`color${targetKey}`} x1="0" y1="0" x2="0" y2="1">
//               <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
//               <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
//             </linearGradient>
//           </defs>
//           <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
//           <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
//           <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
//           <Tooltip 
//             contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} 
//           />
//           <Area 
//             type="monotone" 
//             dataKey={targetKey} 
//             stroke="#3b82f6" 
//             strokeWidth={3} 
//             fillOpacity={1} 
//             fill={`url(#color${targetKey})`} 
//           />
//         </AreaChart>
//       </ResponsiveContainer>
//     </div>
//   </div>
// );

// // C. Clinical Insight Widget (The "Doctor" View)
// const InsightWidget = ({ insights }) => (
//   <div className="bg-slate-900 text-white p-6 rounded-2xl col-span-full">
//     <div className="flex items-center gap-2 mb-4">
//       <BrainCircuit className="text-purple-400" size={24} />
//       <h3 className="text-lg font-bold">AI Clinical Synthesis</h3>
//     </div>
//     <div className="space-y-3">
//       {insights.map((insight, idx) => (
//         <div key={idx} className="flex gap-3 bg-white/5 p-3 rounded-lg border border-white/10">
//           <div className="mt-1 min-w-[4px] h-4 bg-purple-500 rounded-full"></div>
//           <p className="text-sm text-gray-300 leading-relaxed">{insight}</p>
//         </div>
//       ))}
//     </div>
//   </div>
// );

// // --- 3. THE "MOCK AI" AGENT (Simulates Backend Logic) ---
// const generateUiManifest = (data) => {
//   const manifest = [];
//   const insights = [];

//   // Logic 1: Scan for Critical Standalone Tests
//   data.current_report.forEach(test => {
//     if (!test.is_panel) {
//       manifest.push({ type: 'MetricCard', props: { data: test } });

//       // Agentic Reasoning: If Glucose is High, Trigger specific insights
//       if (test.test_name.includes("Glucose") && test.interpretation === "High") {
//         insights.push(`Detected Hyperglycemia (${test.value} ${test.unit}). This represents a ${Math.round(((test.value - 100)/100)*100)}% increase over standard baseline.`);
//         // Agent Decides: User needs a trend chart because this is a chronic issue
//         manifest.push({ 
//           type: 'TrendWidget', 
//           props: { history: data.history, targetKey: 'glucose', title: 'Blood Glucose' } 
//         });
//       }
//     } else {
//       // Handle Panels (Recursion)
//       test.members.forEach(member => {
//         manifest.push({ type: 'MetricCard', props: { data: member } });
//       });
//     }
//   });

//   // Logic 2: Add Insight Widget if we found issues
//   if (insights.length > 0) {
//     manifest.unshift({ type: 'InsightWidget', props: { insights } });
//   }

//   return manifest;
// };


// // --- 4. THE RENDERER (App Shell) ---
// function App() {
//   const [manifest, setManifest] = useState([]);
//   const [isGenerating, setIsGenerating] = useState(false);

//   const handleGenerate = () => {
//     setIsGenerating(true);
//     // Simulate AI Processing Delay
//     setTimeout(() => {
//       const generatedManifest = generateUiManifest(PATIENT_DATA);
//       setManifest(generatedManifest);
//       setIsGenerating(false);
//     }, 1500);
//   };

//   return (
//     <div className="min-h-screen bg-gray-50 p-6 md:p-12 font-sans">
//       <div className="max-w-5xl mx-auto">
//         {/* Header */}
//         <header className="flex justify-between items-end mb-12">
//           <div>
//             <div className="flex items-center gap-2 text-blue-600 mb-2">
//               <Activity size={20} />
//               <span className="font-bold tracking-wide text-sm uppercase">Smart Health Engine</span>
//             </div>
//             <h1 className="text-4xl font-black text-gray-900 tracking-tight">Patient Report Synthesis</h1>
//             <p className="text-gray-500 mt-2">Target: {PATIENT_DATA.name} | ID: {PATIENT_DATA.patient_id}</p>
//           </div>

//           <button 
//             onClick={handleGenerate}
//             disabled={isGenerating}
//             className="group flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full font-bold transition-all shadow-lg shadow-blue-200 disabled:opacity-70"
//           >
//             {isGenerating ? (
//               <>Generating View<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div></>
//             ) : (
//               <>Generate Smart View <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" /></>
//             )}
//           </button>
//         </header>

//         {/* Dynamic Grid Layout */}
//         <main className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in-up">
//           {manifest.length === 0 && !isGenerating && (
//             <div className="col-span-full py-20 text-center border-2 border-dashed border-gray-200 rounded-3xl">
//               <FileText className="mx-auto text-gray-300 mb-4" size={48} />
//               <p className="text-gray-400 font-medium">System Idle. Ready to ingest patient data.</p>
//             </div>
//           )}

//           {manifest.map((item, index) => {
//             // THE COMPONENT MAPPER
//             switch (item.type) {
//               case 'InsightWidget':
//                 return <InsightWidget key={index} {...item.props} />;
//               case 'TrendWidget':
//                 return <TrendWidget key={index} {...item.props} />;
//               case 'MetricCard':
//                 return <MetricCard key={index} {...item.props} />;
//               default:
//                 return null;
//             }
//           })}
//         </main>
//       </div>
//     </div>
//   );
// }

// export default App;


import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, Activity, ChevronRight, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';

// Import registry and validator
import { initializeComponentRegistry } from './config/componentRegistry';
import { validateManifest, formatValidationErrors, isSafeToRender } from './utils/manifestValidator';

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', backgroundColor: '#fee2e2', padding: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ backgroundColor: '#fecaca', border: '3px solid #dc2626', borderRadius: '0.75rem', padding: '2rem', maxWidth: '500px' }}>
            <h1 style={{ color: '#991b1b', margin: '0 0 1rem 0' }}>💥 Rendering Error</h1>
            <p style={{ color: '#7f1d1d', fontFamily: 'monospace', whiteSpace: 'pre-wrap', margin: 0 }}>{String(this.state.error)}</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Default component map - only simple inline fallback components
// Complex components like HealthScoreHeader, AbnormalCard are loaded dynamically from registry
const DEFAULT_COMPONENT_MAP = {
  // Simple inline components for structural elements
  SectionDivider: ({ title }) => (
    <div style={{ marginTop: '2.5rem', marginBottom: '1.5rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>
      <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#111827', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
        {title.includes("Attention") ? <AlertCircle size={20} style={{ color: '#ef4444' }} /> : null}
        {title}
      </h3>
    </div>
  ),

  NormalList: ({ items }) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
      {items.map((item, i) => (
        <div key={i} style={{ backgroundColor: '#dcfce7', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #86efac' }}>
          <div style={{ fontWeight: 'bold', color: '#166534' }}>{item.parameter}</div>
          <div style={{ color: '#22c55e', fontFamily: 'monospace', fontWeight: 600 }}>{item.value}</div>
          <div style={{ fontSize: '0.75rem', color: '#4ade80', marginTop: '0.25rem' }}>{item.clinical_interpretation}</div>
        </div>
      ))}
    </div>
  )
};

// --- MOCK INPUT DATA ---
// In a real app, this comes from your database or file upload
const MOCK_RAW_REPORT = {
  "patient_details": { "name": "Sagar Tiwari", "age": "35 Years", "gender": "Male" },
  "report_results": [
    { "test_name": "Glucose Fasting", "value": 169, "unit": "mg/dL", "reference_range": "70-100", "interpretation": "High" },
    { "test_name": "HbA1c", "value": 6.1, "unit": "%", "reference_range": "<5.7", "interpretation": "High" },
    { "test_name": "Total Cholesterol", "value": 240, "unit": "mg/dL", "reference_range": "<200", "interpretation": "High" },
    { "test_name": "Hemoglobin", "value": 14.5, "unit": "g/dL", "reference_range": "13-17", "interpretation": "Normal" },
    { "test_name": "Creatinine", "value": 0.9, "unit": "mg/dL", "reference_range": "0.7-1.3", "interpretation": "Normal" }
  ]
};

// Backend URL configuration
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

export default function AppWrapper() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}

function App() {
  const [manifest, setManifest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [registryReady, setRegistryReady] = useState(true);
  const [componentMap, setComponentMap] = useState(DEFAULT_COMPONENT_MAP);
  const [schemas, setSchemas] = useState({});
  const [validationWarnings, setValidationWarnings] = useState([]);

  // Initialize component registry on app start
  useEffect(() => {
    const initRegistry = async () => {
      console.log('[App] Initializing component registry...');
      try {
        const registry = await initializeComponentRegistry(BACKEND_URL);
        console.log('[App] Registry response:', registry);
        setComponentMap({ ...DEFAULT_COMPONENT_MAP, ...registry.componentMap });
        setSchemas(registry.schemas);
        console.log('[App] Registry ready with', Object.keys(registry.componentMap).length, 'components');

        if (!registry.isHealthy) {
          console.warn('[App] Registry initialized with fallbacks only (backend may be unreachable)');
        }
      } catch (err) {
        console.error('[App] Failed to initialize registry:', err);
        console.log('[App] Using default component map as fallback');
        setComponentMap(DEFAULT_COMPONENT_MAP);
      }
    };

    initRegistry();
  }, []);

  const generateSmartReport = async () => {
    setLoading(true);
    setError(null);
    setValidationWarnings([]);

    try {
      // Send raw data to backend
      const response = await axios.post(`${BACKEND_URL}/analyze`, MOCK_RAW_REPORT);

      const generatedManifest = response.data.ui_manifest || response.data.manifest;

      if (!generatedManifest) {
        throw new Error('Backend returned no manifest');
      }

      // Validate manifest against schemas
      const validation = validateManifest({ items: generatedManifest }, schemas);

      if (!validation.isValid && !isSafeToRender(validation)) {
        setError(formatValidationErrors(validation));
        console.error('[App] Manifest validation failed:', validation);
        return;
      }

      // Store warnings if any
      if (validation.allWarnings.length > 0) {
        setValidationWarnings(validation.allWarnings);
        console.warn('[App] Manifest validation warnings:', validation.allWarnings);
      }

      setManifest(generatedManifest);
      console.log('[App] Report generated successfully with', generatedManifest.items?.length || 0, 'components');
    } catch (err) {
      console.error('[App] Analysis failed:', err);
      let errorMsg = 'Failed to generate report.';

      if (err.response?.status === 500) {
        errorMsg = 'Backend error: Check backend logs for details.';
      } else if (err.message?.includes('Network')) {
        errorMsg = 'Cannot reach backend. Ensure backend is running on ' + BACKEND_URL;
      }

      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', padding: '1.5rem', fontFamily: 'system-ui, sans-serif', color: '#111827' }}>
      <div style={{ maxWidth: '56rem', margin: '0 auto' }}>
        <h1 style={{ color: '#111827', fontSize: '2rem', textAlign: 'center' }}>🎯 Smart Report Generator</h1>
        <p style={{ textAlign: 'center', color: '#6b7280' }}>Frontend is working! ✓</p>

        {/* HEADER SECTION */}
        <header style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '3rem', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ backgroundColor: '#2563eb', padding: '0.75rem', borderRadius: '1rem', boxShadow: '0 20px 25px -5px rgba(37, 99, 235, 0.2)' }}>
              <Activity color="white" size={28} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.875rem', fontWeight: 900, letterSpacing: '-0.025em', margin: '0', color: '#111827' }}>Smart Report</h1>
              <p style={{ color: '#6b7280', fontWeight: 500, margin: '0', fontSize: '0.875rem' }}>Generative Clinical Synthesis</p>
              <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: '0.25rem 0 0 0' }}>
                {registryReady ? (
                  <>✓ Registry ready: {Object.keys(componentMap).length} components</>
                ) : (
                  <>Initializing...</>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={generateSmartReport}
            disabled={loading}
            style={{
              backgroundColor: '#111827',
              color: 'white',
              padding: '0.75rem 2rem',
              borderRadius: '9999px',
              fontWeight: 700,
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
            onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#000')}
            onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = '#111827')}
          >
            {loading ? (
              <><RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} /> Analyzing...</>
            ) : (
              <>Generate <ChevronRight size={18} /></>
            )}
          </button>
        </header>

        {/* STATUS */}
        {!registryReady && (
          <div style={{ backgroundColor: '#dbeafe', border: '1px solid #93c5fd', color: '#1e40af', padding: '1rem', borderRadius: '0.75rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Activity size={20} style={{ animation: 'spin 2s linear infinite' }} />
            <span>Initializing component registry...</span>
          </div>
        )}

        {/* ERROR STATE */}
        {error && (
          <div style={{ backgroundColor: '#fee2e2', border: '1px solid #fecaca', color: '#991b1b', padding: '1rem', borderRadius: '0.75rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertCircle size={20} />
            <div style={{ whiteSpace: 'pre-wrap' }}>{error}</div>
          </div>
        )}

        {/* VALIDATION WARNINGS */}
        {validationWarnings.length > 0 && (
          <div style={{ backgroundColor: '#fef3c7', border: '1px solid #fcd34d', color: '#92400e', padding: '1rem', borderRadius: '0.75rem', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 600 }}>
              <AlertCircle size={20} />
              <span>Validation Warnings ({validationWarnings.length})</span>
            </div>
            <ul style={{ margin: 0, paddingLeft: '1.5rem', fontSize: '0.875rem', lineHeight: '1.5' }}>
              {validationWarnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>
        )}

        {/* EMPTY STATE */}
        {!manifest && !loading && !error && (
          <div style={{ textAlign: 'center', paddingY: '5rem', border: '2px dashed #e5e7eb', borderRadius: '1.5rem', backgroundColor: 'white', padding: '5rem 1rem' }}>
            <FileText style={{ margin: '0 auto 1rem', color: '#d1d5db' }} size={64} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#9ca3af', margin: '0' }}>Ready to Analyze</h3>
            <p style={{ color: '#9ca3af', margin: '0.5rem 0 0 0' }}>Click "Generate" to analyze patient data.</p>
          </div>
        )}

        {/* DYNAMIC REPORT RENDERING */}
        {manifest && (
          <div style={{ animation: 'fadeIn 0.3s ease-in', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {Array.isArray(manifest) ? (
              manifest.map((item, index) => {
                const Component = componentMap[item.type];

                if (!Component) {
                  console.warn(`[App] Unknown component type: ${item.type}`);
                  return (
                    <div key={index} style={{ backgroundColor: '#fee2e2', border: '1px solid #fecaca', padding: '1rem', borderRadius: '0.75rem' }}>
                      <p style={{ color: '#991b1b', fontWeight: 700, margin: '0' }}>Unknown Component: {item.type}</p>
                      <p style={{ color: '#dc2626', fontSize: '0.875rem', margin: '0' }}>This component type is not registered.</p>
                    </div>
                  );
                }

                try {
                  return <Component key={item.id || index} {...item.props} />;
                } catch (renderErr) {
                  console.error(`[App] Error rendering ${item.type}:`, renderErr);
                  return (
                    <div key={index} style={{ backgroundColor: '#fed7aa', border: '1px solid #fdba74', padding: '1rem', borderRadius: '0.75rem' }}>
                      <p style={{ color: '#92400e', fontWeight: 700, margin: '0' }}>Render Error: {item.type}</p>
                      <p style={{ color: '#b45309', fontSize: '0.875rem', margin: '0' }}>{renderErr.message}</p>
                    </div>
                  );
                }
              })
            ) : (
              <div style={{ backgroundColor: '#fee2e2', border: '1px solid #fecaca', padding: '1rem', borderRadius: '0.75rem' }}>
                <p style={{ color: '#991b1b', fontWeight: 700, margin: '0' }}>Invalid Manifest</p>
                <p style={{ color: '#dc2626', fontSize: '0.875rem', margin: '0' }}>Manifest items is not an array</p>
              </div>
            )}
          </div>
        )}

        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
        `}</style>

      </div>
    </div>
  );
}