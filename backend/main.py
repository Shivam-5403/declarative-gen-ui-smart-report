# from fastapi import FastAPI
# from agents import smart_report_app
# from fastapi.middleware.cors import CORSMiddleware

# app = FastAPI()

# # Enable CORS for Frontend Prototype
# app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"])

# @app.post("/generate-ui")
# async def get_report(data: dict):
#     # Invoke the Agentic Graph
#     initial_state = {"health_json": data, "insights": [], "ui_manifest": []}
#     result = smart_report_app.invoke(initial_state)
    
#     # Return the UI Manifest
#     return {"manifest": result['ui_manifest']}

# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run(app, host="0.0.0.0", port=8000)

import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

# Import your agent workflow and component registry
from agents import smart_report_app
from components import export_as_json_schema 

# --- APP CONFIGURATION ---
app = FastAPI(
    title="Smart Health Report API",
    description="Generative AI Engine for Clinical Summarization",
    version="1.0.0"
)

# --- CORS MIDDLEWARE ---
# Required to allow your React Frontend (localhost:5173) to call this Backend (localhost:8000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with ["http://localhost:5173"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- REQUEST MODEL ---
# This matches the structure sent from frontend/App.jsx
class RecursiveMember(BaseModel):
    test_name: str
    value: Optional[float | str] = None
    unit: Optional[str] = None
    reference_range: Optional[str] = None
    interpretation: Optional[str] = None

class RawLabReport(BaseModel):
    patient_details: Dict[str, Any] = Field(default_factory=dict)
    report_results: List[RecursiveMember]

# --- API ENDPOINTS ---

@app.get("/")
def health_check():
    """Simple check to see if backend is running."""
    return {"status": "active", "service": "Smart Health Engine"}

@app.post("/analyze")
async def analyze_report(report: RawLabReport):
    """
    Main Endpoint:
    1. Receives Raw JSON
    2. Invokes LangGraph Agent (Gemini 2.5)
    3. Returns UI Manifest
    """
    try:
        print(f"Received Analysis Request for: {report.patient_details.get('name', 'Unknown')}")
        
        # Convert Pydantic model to standard dictionary for the Agent
        input_data = report.model_dump()
        
        # Invoke the LangGraph workflow defined in agents.py
        # This runs the 'Summarizer' node then the 'UI Mapper' node
        result = smart_report_app.invoke({"raw_data": input_data})
        
        # Extract and return only the UI Manifest list
        manifest = result.get('ui_manifest', [])
        
        if not manifest:
            raise HTTPException(status_code=500, detail="Agent returned empty manifest")
            
        return {"ui_manifest": manifest}

    except Exception as e:
        print(f"CRITICAL ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/schema-export")
def export_component_schemas():
    """
    Schema Export Endpoint for Frontend Runtime Discovery
    
    Returns all component schemas as JSON, allowing the frontend to:
    1. Auto-discover available components
    2. Validate manifests at runtime  
    3. Generate TypeScript types (optional)
    
    Response format:
    {
        "ComponentName": {
            "componentName": "ComponentName",
            "version": "1.0.0",
            "displayName": "...",
            "category": "...",
            "visualRole": "...",
            "description": "...",
            "propsSchema": {...},  // JSON Schema
            "renderingHints": {...},
            "deprecations": [...],
            "breakingChanges": {...}
        },
        ...
    }
    """
    try:
        schemas = export_as_json_schema()
        return schemas
    except Exception as e:
        print(f"Error exporting schemas: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to export schemas: {str(e)}")

# --- DEBUG ENDPOINTS ---

from schema import SmartSummary
from ui_mapper import UIManifestGenerator

@app.post("/debug/generate-manifest")
async def debug_generate_manifest(summary: Dict[str, Any]):
    """
    Debug Endpoint: Directly generate UI Manifest from Smart Summary JSON.
    Bypasses the LLM generation step.
    """
    try:
        # Validate input against schema
        smart_summary = SmartSummary(**summary)
        
        # Generate manifest
        generator = UIManifestGenerator()
        manifest = generator.generate_from_summary(smart_summary)
        
        return {"ui_manifest": [item.dict() for item in manifest.items]}
    except Exception as e:
        print(f"Debug Generation Error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

# --- SERVER ENTRY POINT ---
if __name__ == "__main__":
    # Run with reload enabled for development
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)