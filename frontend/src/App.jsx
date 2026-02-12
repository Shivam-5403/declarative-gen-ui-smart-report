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
  "patient_details": {
    "patient_id": null,
    "name": "Mr. SURENDER SINGH",
    "age": "51 Years",
    "address": "FPSC VISHWAS NAGAR 27/1, Street no6, Opposite chintpurni temple, Vishwas nagar New Delhi"
  },
  "lab_details": {
    "lab_name": "Dr Lal Path Labs",
    "lab_address": "Dr Lal PathLabs Ltd, Block-E, Sector-18, Rohini, New Delhi-110085",
    "lab_website": "www.lalpathlabs.com",
    "lab_code": "L74899DL1995PLC065388",
    "email": "customer.care@lalpathlabs.com",
    "phone": "01149885050",
    "referred_by": "Self"
  },
  "sample_details": {
    "sample_id": "321457519",
    "specimen": null,
    "collected_at": "2025-07-06T14:14:00",
    "received_at": null,
    "reported_at": "2025-07-06T19:38:51"
  },
  "report_results": [
    {
      "is_panel": true,
      "test_name": "URINE EXAMINATION, ROUTINE; URINE, R/E",
      "sample_type": "URINE",
      "method": "Diazonium salt",
      "technology": null,
      "value": null,
      "value_text": "Sample Not Received",
      "unit": null,
      "reference_range": null,
      "interpretation": null,
      "test_remarks": null,
      "test_notes": null,
      "test_interpretations": null,
      "extra_details": null,
      "members": [
        {
          "is_panel": false,
          "test_name": "Gross Examination",
          "value": null,
          "value_text": "Sample Not Received",
          "unit": null,
          "reference_range": null,
          "interpretation": null,
          "sample_type": "URINE",
          "method": null,
          "test_remarks": null,
          "extra_details": null
        },
        {
          "is_panel": false,
          "test_name": "Microscopy",
          "value": null,
          "value_text": "Sample Not Received",
          "unit": null,
          "reference_range": null,
          "interpretation": null,
          "sample_type": "URINE",
          "method": null,
          "test_remarks": null,
          "extra_details": null
        }
      ]
    },
    {
      "is_panel": true,
      "test_name": "LIVER & KIDNEY PANEL, SERUM",
      "sample_type": "SERUM",
      "method": null,
      "technology": null,
      "value": null,
      "value_text": null,
      "unit": null,
      "reference_range": null,
      "interpretation": null,
      "test_remarks": null,
      "test_notes": null,
      "test_interpretations": null,
      "extra_details": null,
      "members": [
        {
          "is_panel": false,
          "test_name": "Creatinine",
          "value": 0.76,
          "value_text": null,
          "unit": "mg/dL",
          "reference_range": "0.70-1.30",
          "interpretation": "Normal",
          "sample_type": "SERUM",
          "method": "Modified Jaffe, Kinetic",
          "test_remarks": null,
          "extra_details": null
        },
        {
          "is_panel": false,
          "test_name": "GFR Estimated",
          "value": 109,
          "value_text": null,
          "unit": "mL/min/1.73m2",
          "reference_range": ">59",
          "interpretation": "Normal",
          "sample_type": "SERUM",
          "method": "Calculated",
          "test_remarks": null,
          "extra_details": null
        },
        {
          "is_panel": false,
          "test_name": "GFR Category",
          "value": null,
          "value_text": "G1",
          "unit": null,
          "reference_range": null,
          "interpretation": "Normal",
          "sample_type": "SERUM",
          "method": "Calculated",
          "test_remarks": null,
          "extra_details": null
        },
        {
          "is_panel": false,
          "test_name": "Urea",
          "value": 15.1,
          "value_text": null,
          "unit": "mg/dL",
          "reference_range": "13.00-43.00",
          "interpretation": "Normal",
          "sample_type": "SERUM",
          "method": "Urease",
          "test_remarks": null,
          "extra_details": null
        },
        {
          "is_panel": false,
          "test_name": "Urea Nitrogen Blood",
          "value": 7.05,
          "value_text": null,
          "unit": "mg/dL",
          "reference_range": "6.00-20.00",
          "interpretation": "Normal",
          "sample_type": "SERUM",
          "method": null,
          "test_remarks": null,
          "extra_details": null
        },
        {
          "is_panel": false,
          "test_name": "BUN/Creatinine Ratio",
          "value": 9,
          "value_text": null,
          "unit": null,
          "reference_range": null,
          "interpretation": null,
          "sample_type": "SERUM",
          "method": "Calculated",
          "test_remarks": null,
          "extra_details": null
        },
        {
          "is_panel": false,
          "test_name": "Uric Acid",
          "value": 6.84,
          "value_text": null,
          "unit": "mg/dL",
          "reference_range": "3.50-7.20",
          "interpretation": "Normal",
          "sample_type": "SERUM",
          "method": "Uricase",
          "test_remarks": null,
          "extra_details": null
        },
        {
          "is_panel": false,
          "test_name": "AST (SGOT)",
          "value": 27.0,
          "value_text": null,
          "unit": "U/L",
          "reference_range": "15.00-40.00",
          "interpretation": "Normal",
          "sample_type": "SERUM",
          "method": "IFCC",
          "test_remarks": null,
          "extra_details": null
        },
        {
          "is_panel": false,
          "test_name": "ALT (SGPT)",
          "value": 36.0,
          "value_text": null,
          "unit": "U/L",
          "reference_range": "10.00-49.00",
          "interpretation": "Normal",
          "sample_type": "SERUM",
          "method": "IFCC",
          "test_remarks": null,
          "extra_details": null
        },
        {
          "is_panel": false,
          "test_name": "GGTP",
          "value": 40.0,
          "value_text": null,
          "unit": "U/L",
          "reference_range": "0-73",
          "interpretation": "Normal",
          "sample_type": "SERUM",
          "method": "IFCC,L-y-glutamyl-3-carboxy-4-nitroanilide",
          "test_remarks": null,
          "extra_details": null
        },
        {
          "is_panel": false,
          "test_name": "Alkaline Phosphatase (ALP)",
          "value": 65.0,
          "value_text": null,
          "unit": "U/L",
          "reference_range": "30.00-120.00",
          "interpretation": "Normal",
          "sample_type": "SERUM",
          "method": "IFCC-AMP",
          "test_remarks": null,
          "extra_details": null
        },
        {
          "is_panel": false,
          "test_name": "Bilirubin Total",
          "value": 0.61,
          "value_text": null,
          "unit": "mg/dL",
          "reference_range": "0.30-1.20",
          "interpretation": "Normal",
          "sample_type": "SERUM",
          "method": "Oxidation",
          "test_remarks": null,
          "extra_details": null
        },
        {
          "is_panel": false,
          "test_name": "Bilirubin Direct",
          "value": 0.22,
          "value_text": null,
          "unit": "mg/dL",
          "reference_range": "<0.3",
          "interpretation": "Normal",
          "sample_type": "SERUM",
          "method": "Oxidation",
          "test_remarks": null,
          "extra_details": null
        },
        {
          "is_panel": false,
          "test_name": "Bilirubin Indirect",
          "value": 0.39,
          "value_text": null,
          "unit": "mg/dL",
          "reference_range": "<1.10",
          "interpretation": "Normal",
          "sample_type": "SERUM",
          "method": "Calculated",
          "test_remarks": null,
          "extra_details": null
        },
        {
          "is_panel": false,
          "test_name": "Total Protein",
          "value": 7.1,
          "value_text": null,
          "unit": "g/dL",
          "reference_range": "5.70-8.20",
          "interpretation": "Normal",
          "sample_type": "SERUM",
          "method": "Biuret",
          "test_remarks": null,
          "extra_details": null
        },
        {
          "is_panel": false,
          "test_name": "Albumin",
          "value": 4.42,
          "value_text": null,
          "unit": "g/dL",
          "reference_range": "3.20-4.80",
          "interpretation": "Normal",
          "sample_type": "SERUM",
          "method": "BCG",
          "test_remarks": null,
          "extra_details": null
        },
        {
          "is_panel": false,
          "test_name": "Globulin",
          "value": 2.68,
          "value_text": null,
          "unit": "gm/dL",
          "reference_range": "2.0-3.5",
          "interpretation": "Normal",
          "sample_type": "SERUM",
          "method": "Calculated",
          "test_remarks": null,
          "extra_details": null
        },
        {
          "is_panel": false,
          "test_name": "A: G Ratio",
          "value": 1.65,
          "value_text": null,
          "unit": null,
          "reference_range": "0.90-2.00",
          "interpretation": "Normal",
          "sample_type": "SERUM",
          "method": "Calculated",
          "test_remarks": null,
          "extra_details": null
        },
        {
          "is_panel": false,
          "test_name": "Calcium, Total",
          "value": 8.7,
          "value_text": null,
          "unit": "mg/dL",
          "reference_range": "8.70-10.40",
          "interpretation": "Normal",
          "sample_type": "SERUM",
          "method": "Arsenazo III",
          "test_remarks": null,
          "extra_details": null
        },
        {
          "is_panel": false,
          "test_name": "Phosphorus",
          "value": 3.7,
          "value_text": null,
          "unit": "mg/dL",
          "reference_range": "2.40-5.10",
          "interpretation": "Normal",
          "sample_type": "SERUM",
          "method": "Phosphomolybdate UV",
          "test_remarks": null,
          "extra_details": null
        },
        {
          "is_panel": false,
          "test_name": "Sodium",
          "value": 138.5,
          "value_text": null,
          "unit": "mEq/L",
          "reference_range": "136.00-146.00",
          "interpretation": "Normal",
          "sample_type": "SERUM",
          "method": "Indirect ISE",
          "test_remarks": null,
          "extra_details": null
        },
        {
          "is_panel": false,
          "test_name": "Potassium",
          "value": 3.63,
          "value_text": null,
          "unit": "mEq/L",
          "reference_range": "3.50-5.10",
          "interpretation": "Normal",
          "sample_type": "SERUM",
          "method": "Indirect ISE",
          "test_remarks": null,
          "extra_details": null
        },
        {
          "is_panel": false,
          "test_name": "Chloride",
          "value": 100.1,
          "value_text": null,
          "unit": "mEq/L",
          "reference_range": "101.00-109.00",
          "interpretation": "Low",
          "sample_type": "SERUM",
          "method": "Indirect ISE",
          "test_remarks": null,
          "extra_details": null
        }
      ]
    },
    {
      "is_panel": true,
      "test_name": "LIPID SCREEN, SERUM",
      "sample_type": "SERUM",
      "method": null,
      "technology": null,
      "value": null,
      "value_text": null,
      "unit": null,
      "reference_range": null,
      "interpretation": null,
      "test_remarks": null,
      "test_notes": "1. Measurements in the same patient can show physiological & analytical variations. Three serial samples 1 week apart are recommended for Total Cholesterol, Triglycerides, HDL& LDL Cholesterol. 2. Additional testing for Apolipoprotein B, hsCRP, Lp(a) & LP-PLA2 should be considered among patients with moderate risk for ASCVD for risk refinement.",
      "test_interpretations": null,
      "extra_details": {
        "Treatment Goals as per Lipid Association of India 2020": [
          {
            "RISK CATEGORY": "Extreme Risk Group Category A",
            "LDL CHOLESTEROL (LDL-C) (mg/dL)": "<50 (Optional goal ≤30)",
            "NON HDL CHLOESTEROL (NON HDL-C) (mg/dL)": "<80 (Optional goal ≤60)",
            "CONSIDER THERAPY LDL CHOLESTEROL (LDL-C) (mg/dL)": "≥50",
            "CONSIDER THERAPY NON HDL CHLOESTEROL (NON HDL-C) (mg/dL)": "≥80"
          },
          {
            "RISK CATEGORY": "Extreme Risk Group Category B",
            "LDL CHOLESTEROL (LDL-C) (mg/dL)": "≤30",
            "NON HDL CHLOESTEROL (NON HDL-C) (mg/dL)": "≤60",
            "CONSIDER THERAPY LDL CHOLESTEROL (LDL-C) (mg/dL)": ">30",
            "CONSIDER THERAPY NON HDL CHLOESTEROL (NON HDL-C) (mg/dL)": ">60"
          },
          {
            "RISK CATEGORY": "Very High",
            "LDL CHOLESTEROL (LDL-C) (mg/dL)": "<50",
            "NON HDL CHLOESTEROL (NON HDL-C) (mg/dL)": "<80",
            "CONSIDER THERAPY LDL CHOLESTEROL (LDL-C) (mg/dL)": "≥50",
            "CONSIDER THERAPY NON HDL CHLOESTEROL (NON HDL-C) (mg/dL)": "≥80"
          },
          {
            "RISK CATEGORY": "High",
            "LDL CHOLESTEROL (LDL-C) (mg/dL)": "<70",
            "NON HDL CHLOESTEROL (NON HDL-C) (mg/dL)": "<100",
            "CONSIDER THERAPY LDL CHOLESTEROL (LDL-C) (mg/dL)": "≥70",
            "CONSIDER THERAPY NON HDL CHLOESTEROL (NON HDL-C) (mg/dL)": "≥100"
          },
          {
            "RISK CATEGORY": "Moderate",
            "LDL CHOLESTEROL (LDL-C) (mg/dL)": "<100",
            "NON HDL CHLOESTEROL (NON HDL-C) (mg/dL)": "<130",
            "CONSIDER THERAPY LDL CHOLESTEROL (LDL-C) (mg/dL)": "≥100",
            "CONSIDER THERAPY NON HDL CHLOESTEROL (NON HDL-C) (mg/dL)": "≥130"
          },
          {
            "RISK CATEGORY": "Low",
            "LDL CHOLESTEROL (LDL-C) (mg/dL)": "<100",
            "NON HDL CHLOESTEROL (NON HDL-C) (mg/dL)": "<130",
            "CONSIDER THERAPY LDL CHOLESTEROL (LDL-C) (mg/dL)": "≥130*",
            "CONSIDER THERAPY NON HDL CHLOESTEROL (NON HDL-C) (mg/dL)": "≥160*"
          }
        ],
        "Low Risk Patient Note": "*In low risk patient, consider therapy after an initial non-pharmacological intervention for at least 3 months"
      },
      "members": [
        {
          "is_panel": false,
          "test_name": "Cholesterol, Total",
          "value": 165.0,
          "value_text": null,
          "unit": "mg/dL",
          "reference_range": "<200.00",
          "interpretation": "Normal",
          "sample_type": "SERUM",
          "method": "CHO-POD",
          "test_remarks": null,
          "extra_details": null
        },
        {
          "is_panel": false,
          "test_name": "Triglycerides",
          "value": 193.0,
          "value_text": null,
          "unit": "mg/dL",
          "reference_range": "<150.00",
          "interpretation": "High",
          "sample_type": "SERUM",
          "method": "GPO",
          "test_remarks": null,
          "extra_details": null
        },
        {
          "is_panel": false,
          "test_name": "HDL Cholesterol",
          "value": 35.1,
          "value_text": null,
          "unit": "mg/dL",
          "reference_range": ">40.00",
          "interpretation": "Low",
          "sample_type": "SERUM",
          "method": "Enzymatic Immunoinhibition",
          "test_remarks": null,
          "extra_details": null
        },
        {
          "is_panel": false,
          "test_name": "LDL Cholesterol, Calculated",
          "value": 91.3,
          "value_text": null,
          "unit": "mg/dL",
          "reference_range": "<100.00",
          "interpretation": "Normal",
          "sample_type": "SERUM",
          "method": "Calculated",
          "test_remarks": null,
          "extra_details": null
        },
        {
          "is_panel": false,
          "test_name": "VLDL Cholesterol, Calculated",
          "value": 38.6,
          "value_text": null,
          "unit": "mg/dL",
          "reference_range": "<30.00",
          "interpretation": "High",
          "sample_type": "SERUM",
          "method": "Calculated",
          "test_remarks": null,
          "extra_details": null
        },
        {
          "is_panel": false,
          "test_name": "Non-HDL Cholesterol",
          "value": 130,
          "value_text": null,
          "unit": "mg/dL",
          "reference_range": "<130",
          "interpretation": "High",
          "sample_type": "SERUM",
          "method": "Calculated",
          "test_remarks": null,
          "extra_details": null
        }
      ]
    },
    {
      "is_panel": false,
      "test_name": "Glucose Fasting",
      "sample_type": "PLASMA",
      "method": "Hexokinase",
      "technology": null,
      "value": 97.0,
      "value_text": null,
      "unit": "mg/dL",
      "reference_range": "70-100",
      "interpretation": "Normal",
      "test_remarks": null,
      "test_notes": null,
      "test_interpretations": null,
      "extra_details": null
    },
    {
      "is_panel": false,
      "test_name": "Vitamin B12; Cyanocobalamin",
      "sample_type": "SERUM",
      "method": "CLIA",
      "technology": null,
      "value": 202.0,
      "value_text": null,
      "unit": "pg/mL",
      "reference_range": "211.00-911.00",
      "interpretation": "Low",
      "test_remarks": null,
      "test_notes": "1. Interpretation of the result should be considered in relation to clinical circumstances. 2. It is recommended to consider supplementary testing with plasma Methylmalonic acid (MMA) or plasma homocysteine levels to determine biochemical cobalamin deficiency in presence of clinical suspicion of deficiency but indeterminate levels. Homocysteine levels are more sensitive but MMA is more specific 3. False increase in Vitamin B12 levels may be observed in patients with intrinsic factor blocking antibodies, MMA measurement should be considered in such patients 4. The concentration of Vitamin B12 obtained with different assay methods cannot be used interchangeably due to differences in assay methods and reagent specificity",
      "test_interpretations": null,
      "extra_details": null
    },
    {
      "is_panel": false,
      "test_name": "Vitamin D, 25 Hydroxy",
      "sample_type": "SERUM",
      "method": "CLIA",
      "technology": null,
      "value": 23.82,
      "value_text": null,
      "unit": "nmol/L",
      "reference_range": "75.00-250.00",
      "interpretation": "Deficient",
      "test_remarks": null,
      "test_notes": "• The assay measures both D2 (Ergocalciferol) and D3 (Cholecalciferol) metabolites of vitamin D. • 25 (OH)D is influenced by sunlight, latitude, skin pigmentation, sunscreen use and hepatic function. • Optimal calcium absorption requires vitamin D 25 (OH) levels exceeding 75 nmol/L. • It shows seasonal variation, with values being 40-50% lower in winter than in summer. • Levels vary with age and are increased in pregnancy. • A new test Vitamin D, Ultrasensitive by LC-MS/MS is also available",
      "test_interpretations": null,
      "extra_details": {
        "Interpretation": [
          {
            "LEVEL": "Deficient",
            "REFERENCE RANGE IN nmol/L": "< 50",
            "COMMENTS": "High risk for developing bone disease"
          },
          {
            "LEVEL": "Insufficient",
            "REFERENCE RANGE IN nmol/L": "50-74",
            "COMMENTS": "Vitamin D concentration which normalizes Parathyroid hormone concentration"
          },
          {
            "LEVEL": "Sufficient",
            "REFERENCE RANGE IN nmol/L": "75-250",
            "COMMENTS": "Optimal concentration for maximal health benefit"
          },
          {
            "LEVEL": "Potential intoxication",
            "REFERENCE RANGE IN nmol/L": ">250",
            "COMMENTS": "High risk for toxic effects"
          }
        ]
      }
    },
    {
      "is_panel": true,
      "test_name": "THYROID PROFILE, TOTAL, SERUM",
      "sample_type": "SERUM",
      "method": "CLIA",
      "technology": null,
      "value": null,
      "value_text": null,
      "unit": null,
      "reference_range": null,
      "interpretation": null,
      "test_remarks": null,
      "test_notes": "1. TSH levels are subject to circadian variation, reaching peak levels between 2 - 4.a.m. and at a minimum between 6-10 pm. The variation is of the order of 50%. hence time of the day has influence on the measured serum TSH concentrations. 2. Alteration in concentration of Thyroid hormone binding protein can profoundly affect Total T3 and/or Total T4 levels especially in pregnancy and in patients on steroid therapy. 3. Unbound fraction (Free, T4 /Free, T3) of thyroid hormone is biologically active form and correlate more closely with clinical status of the patient than total T4/T3 concentration 4. Values <0.03 ulU/mL need to be clinically correlated due to presence of a rare TSH variant in some individuals",
      "test_interpretations": null,
      "extra_details": null,
      "members": [
        {
          "is_panel": false,
          "test_name": "T3, Total",
          "value": 1.29,
          "value_text": null,
          "unit": "ng/mL",
          "reference_range": "0.60-1.81",
          "interpretation": "Normal",
          "sample_type": "SERUM",
          "method": null,
          "test_remarks": null,
          "extra_details": null
        },
        {
          "is_panel": false,
          "test_name": "T4, Total",
          "value": 9.5,
          "value_text": null,
          "unit": "µg/dL",
          "reference_range": "4.50-11.60",
          "interpretation": "Normal",
          "sample_type": "SERUM",
          "method": null,
          "test_remarks": null,
          "extra_details": null
        },
        {
          "is_panel": false,
          "test_name": "TSH",
          "value": 1.49,
          "value_text": null,
          "unit": "µIU/mL",
          "reference_range": "0.550-4.780",
          "interpretation": "Normal",
          "sample_type": "SERUM",
          "method": null,
          "test_remarks": null,
          "extra_details": null
        }
      ]
    },
    {
      "is_panel": false,
      "test_name": "Amylase",
      "sample_type": "SERUM",
      "method": "Ethylidene Blocked-pNPG7",
      "technology": null,
      "value": 63.0,
      "value_text": null,
      "unit": "U/L",
      "reference_range": "30.00-118.00",
      "interpretation": "Normal",
      "test_remarks": null,
      "test_notes": null,
      "test_interpretations": null,
      "extra_details": null
    },
    {
      "is_panel": false,
      "test_name": "HbA1c (GLYCOSYLATED HEMOGLOBIN)",
      "sample_type": "BLOOD",
      "method": "HPLC, NGSP certified",
      "technology": null,
      "value": 6.5,
      "value_text": null,
      "unit": "%",
      "reference_range": "4.00-5.60",
      "interpretation": "High",
      "test_remarks": null,
      "test_notes": "Presence of Hemoglobin variants and/or conditions that affect red cell turnover must be considered, particularly when the HbA1C result does not correlate with the patient's blood glucose levels.",
      "test_interpretations": "HbA1c result is suggestive of Diabetes/ well controlled Diabetes in a known Diabetic",
      "extra_details": {
        "Estimated average glucose (eAG)": {
          "value": 140,
          "unit": "mg/dL"
        },
        "Interpretation as per American Diabetes Association (ADA) Guidelines": [
          {
            "Reference Group": "Non diabetic adults >=18 years",
            "HbA1c in %": "4.0-5.6",
            "At risk (Prediabetes)": "5.7-6.4",
            "Diagnosing Diabetes": ">= 6.5",
            "Therapeutic goals for glycemic control": "<7.0"
          }
        ],
        "FACTORS THAT INTERFERE WITH HbA1C MEASUREMENT": "Hemoglobin variants, elevated fetal hemoglobin (HbF) and chemically modified derivatives of hemoglobin (e.g. carbamylated Hb in patients with renal failure) can affect the accuracy of HbA1c measurements",
        "FACTORS THAT AFFECT INTERPRETATION OF HBA1C RESULTS": "Any condition that shortens erythrocyte survival or decreases mean erythrocyte age (e.g.,recovery from acute blood loss, hemolytic anemia, HbSS, HbCC, and HbSC) will falsely lower HbA1c test results regardless of the assay method used.Iron deficiency anemia is associated with higher HbA1c"
      }
    },
    {
      "is_panel": false,
      "test_name": "CARDIO C-REACTIVE PROTEIN (hsCRP)",
      "sample_type": "SERUM",
      "method": "Immunoturbidimetry",
      "technology": null,
      "value": 0.93,
      "value_text": null,
      "unit": "mg/L",
      "reference_range": "<1.00",
      "interpretation": "Normal",
      "test_remarks": null,
      "test_notes": null,
      "test_interpretations": null,
      "extra_details": {
        "CARDIOVASCULAR RISK": [
          {
            "CARDIO CRP IN mg/L": "<1",
            "RISK": "Low"
          },
          {
            "CARDIO CRP IN mg/L": "1-3",
            "RISK": "Average"
          },
          {
            "CARDIO CRP IN mg/L": "3-10",
            "RISK": "High"
          },
          {
            "CARDIO CRP IN mg/L": ">10",
            "RISK": "Persistent elevation may represent Non cardiovascular inflammation"
          }
        ]
      }
    },
    {
      "is_panel": true,
      "test_name": "APOLIPOPROTEINS A1 & B, SERUM",
      "sample_type": "SERUM",
      "method": "Immunoturbidometry",
      "technology": null,
      "value": null,
      "value_text": null,
      "unit": null,
      "reference_range": null,
      "interpretation": null,
      "test_remarks": null,
      "test_notes": "As per recommendations of National Cholesterol Education Program (NCEP) the clinical significance of results is as follows:",
      "test_interpretations": null,
      "extra_details": {
        "Apolipoprotein B": [
          {
            "RESULT IN mg/dL": "<23",
            "REMARKS": "Abetalipoproteinemia/Hypobetalipoproteinemia"
          },
          {
            "RESULT IN mg/dL": "23-45",
            "REMARKS": "Hypobetalipoproteinemia"
          },
          {
            "RESULT IN mg/dL": "46-135",
            "REMARKS": "Normal"
          },
          {
            "RESULT IN mg/dL": ">135",
            "REMARKS": "Hyperapobetalipoproteinemia/Increased CAD risk"
          }
        ],
        "Apo B to A1 Ratio": [
          {
            "RATIO": "0.35-0.98",
            "REMARKS": "Desirable"
          },
          {
            "RATIO": ">0.98",
            "REMARKS": "Increased CAD risk"
          }
        ]
      },
      "members": [
        {
          "is_panel": false,
          "test_name": "Apolipoprotein (Apo A1)",
          "value": 97,
          "value_text": null,
          "unit": "mg/dL",
          "reference_range": "79-169",
          "interpretation": "Normal",
          "sample_type": "SERUM",
          "method": null,
          "test_remarks": null,
          "extra_details": null
        },
        {
          "is_panel": false,
          "test_name": "Apolipoprotein (Apo B)",
          "value": 94,
          "value_text": null,
          "unit": "mg/dL",
          "reference_range": "46.00-174.00",
          "interpretation": "Normal",
          "sample_type": "SERUM",
          "method": null,
          "test_remarks": null,
          "extra_details": null
        },
        {
          "is_panel": false,
          "test_name": "Apo B / Apo A1 Ratio",
          "value": 0.97,
          "value_text": null,
          "unit": null,
          "reference_range": "0.35-0.98",
          "interpretation": "Normal",
          "sample_type": "SERUM",
          "method": null,
          "test_remarks": null,
          "extra_details": null
        }
      ]
    },
    {
      "is_panel": true,
      "test_name": "IRON STUDIES, SERUM",
      "sample_type": "SERUM",
      "method": null,
      "technology": null,
      "value": null,
      "value_text": null,
      "unit": null,
      "reference_range": null,
      "interpretation": null,
      "test_remarks": null,
      "test_notes": null,
      "test_interpretations": null,
      "extra_details": null,
      "members": [
        {
          "is_panel": false,
          "test_name": "Iron",
          "value": 91.0,
          "value_text": null,
          "unit": "µg/dL",
          "reference_range": "65.00-175.00",
          "interpretation": "Normal",
          "sample_type": "SERUM",
          "method": "Ferrozine",
          "test_remarks": null,
          "extra_details": null
        },
        {
          "is_panel": false,
          "test_name": "Total Iron Binding Capacity (TIBC)",
          "value": 331.65,
          "value_text": null,
          "unit": "µg/dL",
          "reference_range": "250-425",
          "interpretation": "Normal",
          "sample_type": "SERUM",
          "method": "Chromozural B",
          "test_remarks": null,
          "extra_details": null
        },
        {
          "is_panel": false,
          "test_name": "Transferrin Saturation",
          "value": 27.44,
          "value_text": null,
          "unit": "%",
          "reference_range": "20.00-50.00",
          "interpretation": "Normal",
          "sample_type": "SERUM",
          "method": "Calculated",
          "test_remarks": null,
          "extra_details": null
        }
      ]
    },
    {
      "is_panel": true,
      "test_name": "HEMOGRAM",
      "sample_type": "BLOOD",
      "method": null,
      "technology": null,
      "value": null,
      "value_text": null,
      "unit": null,
      "reference_range": null,
      "interpretation": null,
      "test_remarks": "In anaemic conditions Mentzer index is used to differentiate Iron Deficiency Anaemia from Beta- Thalassemia trait. If Mentzer Index value is >13, there is probability of Iron Deficiency Anaemia. A value <13 indicates likelihood of Beta- Thalassemia trait and Hb HPLC is advised to rule out the Thalassemia trait.",
      "test_notes": "1. As per the recommendation of International council for Standardization in Hematology, the differential leucocyte counts are additionally being reported as absolute numbers of each cell in per unit volume of blood 2. Test conducted on EDTA whole blood",
      "test_interpretations": null,
      "extra_details": null,
      "members": [
        {
          "is_panel": false,
          "test_name": "Hemoglobin",
          "value": 12.4,
          "value_text": null,
          "unit": "g/dL",
          "reference_range": "13.00-17.00",
          "interpretation": "Low",
          "sample_type": null,
          "method": "Photometry",
          "test_remarks": null,
          "extra_details": null
        },
        {
          "is_panel": false,
          "test_name": "Packed Cell Volume (PCV)",
          "value": 37.1,
          "value_text": null,
          "unit": "%",
          "reference_range": "40.00-50.00",
          "interpretation": "Low",
          "sample_type": null,
          "method": "Calculated",
          "test_remarks": null,
          "extra_details": null
        },
        {
          "is_panel": false,
          "test_name": "RBC Count",
          "value": 3.68,
          "value_text": null,
          "unit": "mill/mm3",
          "reference_range": "4.50-5.50",
          "interpretation": "Low",
          "sample_type": null,
          "method": "Electrical impedence",
          "test_remarks": null,
          "extra_details": null
        },
        {
          "is_panel": false,
          "test_name": "MCV",
          "value": 100.8,
          "value_text": null,
          "unit": "fL",
          "reference_range": "83.00-101.00",
          "interpretation": "Normal",
          "sample_type": null,
          "method": "Derived from RBC histogram",
          "test_remarks": null,
          "extra_details": null
        },
        {
          "is_panel": false,
          "test_name": "Mentzer Index",
          "value": 27.4,
          "value_text": null,
          "unit": null,
          "reference_range": null,
          "interpretation": null,
          "sample_type": null,
          "method": "Calculated",
          "test_remarks": null,
          "extra_details": null
        },
        {
          "is_panel": false,
          "test_name": "MCH",
          "value": 33.7,
          "value_text": null,
          "unit": "pg",
          "reference_range": "27.00-32.00",
          "interpretation": "High",
          "sample_type": null,
          "method": "Calculated",
          "test_remarks": null,
          "extra_details": null
        },
        {
          "is_panel": false,
          "test_name": "MCHC",
          "value": 33.5,
          "value_text": null,
          "unit": "g/dL",
          "reference_range": "31.50-34.50",
          "interpretation": "Normal",
          "sample_type": null,
          "method": "Calculated",
          "test_remarks": null,
          "extra_details": null
        },
        {
          "is_panel": false,
          "test_name": "Red Cell Distribution Width (RDW)",
          "value": 16.8,
          "value_text": null,
          "unit": "%",
          "reference_range": "11.60-14.00",
          "interpretation": "High",
          "sample_type": null,
          "method": "Derived from RBC histogram",
          "test_remarks": null,
          "extra_details": null
        },
        {
          "is_panel": false,
          "test_name": "Total Leukocyte Count (TLC)",
          "value": 7.8,
          "value_text": null,
          "unit": "thou/mm3",
          "reference_range": "4.00-10.00",
          "interpretation": "Normal",
          "sample_type": null,
          "method": "Electrical Impedence",
          "test_remarks": null,
          "extra_details": null
        },
        {
          "is_panel": true,
          "test_name": "Differential Leucocyte Count (DLC)",
          "value": null,
          "value_text": null,
          "unit": null,
          "reference_range": null,
          "interpretation": null,
          "sample_type": null,
          "method": null,
          "test_remarks": null,
          "extra_details": null,
          "members": [
            {
              "is_panel": false,
              "test_name": "Segmented Neutrophils",
              "value": 57.9,
              "value_text": null,
              "unit": "%",
              "reference_range": "40.00-80.00",
              "interpretation": "Normal",
              "sample_type": null,
              "method": null,
              "technology": "VCS Technology",
              "test_remarks": null,
              "extra_details": null
            },
            {
              "is_panel": false,
              "test_name": "Lymphocytes",
              "value": 29.5,
              "value_text": null,
              "unit": "%",
              "reference_range": "20.00-40.00",
              "interpretation": "Normal",
              "sample_type": null,
              "method": null,
              "technology": "VCS Technology",
              "test_remarks": null,
              "extra_details": null
            },
            {
              "is_panel": false,
              "test_name": "Monocytes",
              "value": 5.9,
              "value_text": null,
              "unit": "%",
              "reference_range": "2.00-10.00",
              "interpretation": "Normal",
              "sample_type": null,
              "method": null,
              "technology": "VCS Technology",
              "test_remarks": null,
              "extra_details": null
            },
            {
              "is_panel": false,
              "test_name": "Eosinophils",
              "value": 6.2,
              "value_text": null,
              "unit": "%",
              "reference_range": "1.00-6.00",
              "interpretation": "High",
              "sample_type": null,
              "method": null,
              "technology": "VCS Technology",
              "test_remarks": null,
              "extra_details": null
            },
            {
              "is_panel": false,
              "test_name": "Basophils",
              "value": 0.5,
              "value_text": null,
              "unit": "%",
              "reference_range": "<2.00",
              "interpretation": "Normal",
              "sample_type": null,
              "method": null,
              "technology": "VCS Technology",
              "test_remarks": null,
              "extra_details": null
            }
          ]
        },
        {
          "is_panel": true,
          "test_name": "Absolute Leucocyte Count",
          "value": null,
          "value_text": null,
          "unit": null,
          "reference_range": null,
          "interpretation": null,
          "sample_type": null,
          "method": null,
          "test_remarks": null,
          "extra_details": null,
          "members": [
            {
              "is_panel": false,
              "test_name": "Neutrophils",
              "value": 4.52,
              "value_text": null,
              "unit": "thou/mm3",
              "reference_range": "2.00-7.00",
              "interpretation": "Normal",
              "sample_type": null,
              "method": "Calculated",
              "test_remarks": null,
              "extra_details": null
            },
            {
              "is_panel": false,
              "test_name": "Lymphocytes",
              "value": 2.3,
              "value_text": null,
              "unit": "thou/mm3",
              "reference_range": "1.00-3.00",
              "interpretation": "Normal",
              "sample_type": null,
              "method": "Calculated",
              "test_remarks": null,
              "extra_details": null
            },
            {
              "is_panel": false,
              "test_name": "Monocytes",
              "value": 0.46,
              "value_text": null,
              "unit": "thou/mm3",
              "reference_range": "0.20-1.00",
              "interpretation": "Normal",
              "sample_type": null,
              "method": "Calculated",
              "test_remarks": null,
              "extra_details": null
            },
            {
              "is_panel": false,
              "test_name": "Eosinophils",
              "value": 0.48,
              "value_text": null,
              "unit": "thou/mm3",
              "reference_range": "0.02-0.50",
              "interpretation": "Normal",
              "sample_type": null,
              "method": "Calculated",
              "test_remarks": null,
              "extra_details": null
            }
          ]
        },
        {
          "is_panel": false,
          "test_name": "Basophils",
          "value": 0.04,
          "value_text": null,
          "unit": "thou/mm3",
          "reference_range": "0.02-0.10",
          "interpretation": "Normal",
          "sample_type": null,
          "method": "Calculated",
          "test_remarks": null,
          "extra_details": null
        },
        {
          "is_panel": false,
          "test_name": "Platelet Count",
          "value": 227,
          "value_text": null,
          "unit": "thou/mm3",
          "reference_range": "150.00-410.00",
          "interpretation": "Normal",
          "sample_type": null,
          "method": "Electrical impedence",
          "test_remarks": null,
          "extra_details": null
        },
        {
          "is_panel": false,
          "test_name": "Mean Platelet Volume",
          "value": 8.7,
          "value_text": null,
          "unit": "fL",
          "reference_range": "6.5-12.0",
          "interpretation": "Normal",
          "sample_type": null,
          "method": "Derived from Platelet histogram",
          "test_remarks": null,
          "extra_details": null
        },
        {
          "is_panel": false,
          "test_name": "E.S.R.",
          "value": 5,
          "value_text": null,
          "unit": "mm/hr",
          "reference_range": "0.00-20.00",
          "interpretation": "Normal",
          "sample_type": null,
          "method": "Automated, Modified Westergren",
          "test_remarks": null,
          "extra_details": null
        }
      ]
    }
  ],
  "result_details": null,
  "global_remarks": "Test results released pertain to the specimen submitted. All test results are dependent on the quality of the sample received by the Laboratory. Laboratory investigations are only a tool to facilitate in arriving at a diagnosis and should be clinically correlated by the Referring Physician. Report delivery may be delayed due to unforeseen circumstances. Inconvenience is regretted. Certain tests may require further testing at additional cost for derivation of exact value. Kindly submit request within 72 hours post reporting. Test results may show interlaboratory variations. The Courts/Forum at Delhi shall have exclusive jurisdiction in all disputes/claims concerning the test(s) & or results of test(s). Test results are not valid for medico legal purposes. This is computer generated medical diagnostic report that has been validated by Authorized Medical Practitioner/Doctor. The report does not need physical signature. (#) Sample drawn from outside source.",
  "global_notes": "If Test results are alarming or unexpected, client is advised to contact the Customer Care immediately for possible remedial action.",
  "extra_details": null
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

  // --- MANUAL INPUT STATE ---
  const [manualJson, setManualJson] = useState('');
  const [manualLoading, setManualLoading] = useState(false);

  const handleManualVisualize = async () => {
    if (!manualJson) return;
    setManualLoading(true);
    setError(null);
    setValidationWarnings([]);

    try {
      let parsed;
      try {
        parsed = JSON.parse(manualJson);
      } catch (e) {
        throw new Error("Invalid JSON format");
      }

      console.log('[App] Sending manual JSON to debug endpoint...');
      const response = await axios.post(`${BACKEND_URL}/debug/generate-manifest`, parsed);

      const generatedManifest = response.data.ui_manifest;

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
      console.log('[App] Manual Report generated successfully');

    } catch (err) {
      console.error('[App] Manual Analysis failed:', err);
      setError(`Manual Input Error: ${err.message || 'Unknown error'}`);
      if (err.response) {
        setError(`Backend Error (${err.response.status}): ${JSON.stringify(err.response.data)}`);
      }
    } finally {
      setManualLoading(false);
    }
  };

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

        {/* MANUAL INPUT SECTION - DEBUG TOOL */}
        <div style={{ marginTop: '4rem', padding: '2rem', backgroundColor: '#e2e8f0', borderRadius: '1rem', border: '1px solid #cbd5e1' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🛠 Developer Tools: Manual Smart Summary Input
          </h3>
          <p style={{ marginBottom: '1rem', fontSize: '0.875rem', color: '#64748b' }}>
            Paste the <strong>Smart Summary JSON</strong> (output from backend logic) here to visualize it without re-running the full AI pipeline.
          </p>
          <textarea
            value={manualJson}
            onChange={(e) => setManualJson(e.target.value)}
            placeholder='Paste valid JSON here (e.g. { "patient_info": {...}, "clinical_summary": {...} })'
            style={{
              width: '100%',
              height: '200px',
              padding: '1rem',
              borderRadius: '0.5rem',
              border: '1px solid #cbd5e1',
              fontFamily: 'monospace',
              marginBottom: '1rem',
              fontSize: '0.875rem'
            }}
          />
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button
              onClick={handleManualVisualize}
              disabled={manualLoading || !manualJson}
              style={{
                backgroundColor: '#475569',
                color: 'white',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                fontWeight: 600,
                cursor: (manualLoading || !manualJson) ? 'not-allowed' : 'pointer',
                opacity: (manualLoading || !manualJson) ? 0.7 : 1,
                display: 'flex', alignItems: 'center', gap: '0.5rem'
              }}
            >
              {manualLoading ? (
                <><RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> Processing...</>
              ) : (
                'Visualize JSON'
              )}
            </button>
          </div>
        </div>

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