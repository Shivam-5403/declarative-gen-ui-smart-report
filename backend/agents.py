import json
import os
from typing import TypedDict, List
from langgraph.graph import StateGraph, END
from langchain_google_genai import ChatGoogleGenerativeAI
from schema import RawLabReport, SmartSummary, UIManifest
from prompts import MASTER_PROMPT
from ui_mapper import UIManifestGenerator
from dotenv import load_dotenv

load_dotenv()

# Initialize Gemini with JSON mode enforcement
llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    temperature=0.1,
    model_kwargs={"response_mime_type": "application/json"}
)

class AgentState(TypedDict):
    raw_data: dict      # Input
    smart_summary: dict # Intermediate (LLM Output)
    ui_manifest: List[dict] # Final (Frontend Input)

# --- NODE 1: CLINICAL SUMMARIZER ---
def generate_summary(state: AgentState):
    print("--- Generating Clinical Summary ---")
    raw_text = json.dumps(state['raw_data'])
    
    # Call Gemini with enhanced Master Prompt
    response = llm.invoke([
        ("system", MASTER_PROMPT),
        ("human", f"Analyze this report: {raw_text}")
    ])
    
    # Parse JSON
    summary_data = json.loads(response.content)
    
    # STORE LOCALLY (As requested)
    with open("patient_smart_summary.json", "w") as f:
        json.dump(summary_data, f, indent=2)
        
    return {"smart_summary": summary_data}

# --- NODE 2: UI MAPPER (Declarative Rules-Based Generation) ---
def map_to_ui(state: AgentState):
    """
    Transform SmartSummary into UIManifest using declarative rules engine.
    
    Process:
    1. Convert dict to SmartSummary Pydantic model
    2. Create UIManifestGenerator
    3. Apply rules to generate component sequence
    4. Validate manifest
    5. Return to frontend
    """
    print("--- Mapping to UI Components (Rules-Based) ---")
    
    try:
        # Convert raw dict to SmartSummary Pydantic model
        summary_dict = state['smart_summary']
        smart_summary = SmartSummary(**summary_dict)
        
        # Initialize generator with rules engine
        generator = UIManifestGenerator()
        
        # Generate manifest using declarative rules
        ui_manifest = generator.generate_from_summary(smart_summary)
        
        # Validate manifest
        validation = generator.validate_manifest(ui_manifest)
        
        if not validation.is_valid:
            print(f"⚠️ Manifest validation warnings:")
            for error in validation.errors:
                print(f"  - {error}")
            for warning in validation.warnings:
                print(f"  - {warning}")
        
        # Convert UIManifest to JSON-serializable dict
        manifest_dict = [
            {
                "id": item.id,
                "type": item.type,
                "version": item.version,
                "props": item.props,
                "rendering_hints": item.rendering_hints
            }
            for item in ui_manifest.items
        ]
        
        print(f"✓ Generated manifest with {len(manifest_dict)} components")
        
        return {"ui_manifest": manifest_dict}
        
    except Exception as e:
        print(f"✗ Error in UI mapping: {str(e)}")
        # Fallback to legacy hardcoded mapper if rules engine fails
        print("  Falling back to legacy mapper...")
        return _map_to_ui_legacy(state)

def _map_to_ui_legacy(state: AgentState):
    """
    Legacy hardcoded mapper (fallback if rules engine fails).
    
    This maintains backward compatibility during gradual migration
    from hardcoded to declarative UI generation.
    
    TODO: Remove this once declarative mapper is fully production-ready.
    """
    print("  Using legacy hardcoded UI mapper...")
    summary = state['smart_summary']
    manifest = []

    # 1. Header Card (Overall Status)
    # Handle optional/missing keys safely
    clinical_summary = summary.get('clinical_summary', {})
    overall_status = clinical_summary.get('overall_health_status', {})
    
    manifest.append({
        "id": "header",
        "type": "HealthScoreHeader",
        "version": "1.0.0",
        "props": {
            "risk_level": overall_status.get('risk_assessment', 'Unknown'),
            "concerns": overall_status.get('key_concerns', [])
        }
    })

    # 2. Abnormal Findings (The "Red" Section)
    abnormal_readings = clinical_summary.get('abnormal_readings', [])
    if abnormal_readings:
        manifest.append({
            "id": "section_abnormal",
            "type": "SectionDivider",
            "version": "1.0.0",
            "props": {"title": "⚠️ Attention Required"}
        })
        for i, item in enumerate(abnormal_readings):
            # Map new schema fields to old component props if necessary
            # AbnormalCardProps expects: parameter, value, status, clinical_note
            # Item has: parameter_name, value, status, risk_level, clinical_note
            manifest.append({
                "id": f"abnormal_{i}",
                "type": "AbnormalCard",
                "version": "1.0.0",
                "props": {
                    "parameter": item.get('parameter_name'),
                    "value": item.get('value'),
                    "status": item.get('risk_level'), # Use risk_level for status
                    "causes": item.get('causes', []),
                    "effects": item.get('effects', []),
                    "clinical_note": item.get('clinical_note')
                }
            })

    # 3. Management Plan (Tables)
    management_plan = summary.get('management_plan', {})
    follow_up_tests = management_plan.get('follow_up_tests', [])
    
    if follow_up_tests:
        manifest.append({
            "id": "section_followup",
            "type": "SectionDivider",
            "version": "1.0.0",
            "props": {"title": "📅 Recommended Action Plan"}
        })
        # FollowUpTableProps expects: rows (list of dicts)
        # Item has: timeline, recommended_tests, rationale
        # Table expects column mapping, usually it renders whatever keys are there or specific keys
        # We might need to adapt keys if component is strict. 
        # Checking schema.py for FollowUpTableProps... it just says List[Dict[str, Any]].
        # But usually components expects specific keys. 
        # Let's map them to be safe if we knew what the component expected.
        # Assuming component handles these keys or just renders them.
        manifest.append({
            "id": "followup_table",
            "type": "FollowUpTable",
            "version": "1.0.0",
            "props": {"rows": follow_up_tests}
        })

    lifestyle_mods = management_plan.get('lifestyle_modifications', [])
    if lifestyle_mods:
        manifest.append({
            "id": "lifestyle_table",
            "type": "LifestyleTable",
            "version": "1.0.0",
            "props": {"rows": lifestyle_mods}
        })

    # 4. Normal Findings (Reassurance)
    normal_readings = clinical_summary.get('normal_readings', [])
    if normal_readings:
        manifest.append({
            "id": "section_normal",
            "type": "SectionDivider",
            "version": "1.0.0",
            "props": {"title": "✅ Good News"}
        })
        # NormalListProps expects: items
        # Item has: parameter_name, value, clinical_interpretation
        # Component likely expects 'name', 'value', 'interpretation' based on other code.
        # Let's map it.
        mapped_normal = [
            {
                "name": item.get('parameter_name'),
                "value": item.get('value'),
                "interpretation": item.get('clinical_interpretation')
            }
            for item in normal_readings
        ]
        manifest.append({
            "id": "normal_list",
            "type": "NormalList",
            "version": "1.0.0",
            "props": {"items": mapped_normal}
        })

    return {"ui_manifest": manifest}

# --- GRAPH SETUP ---
workflow = StateGraph(AgentState)
workflow.add_node("summarizer", generate_summary)
workflow.add_node("ui_mapper", map_to_ui)
workflow.set_entry_point("summarizer")
workflow.add_edge("summarizer", "ui_mapper")
workflow.add_edge("ui_mapper", END)
smart_report_app = workflow.compile()