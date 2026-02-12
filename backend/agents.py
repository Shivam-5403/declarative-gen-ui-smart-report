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
    manifest.append({
        "id": "header",
        "type": "HealthScoreHeader",
        "version": "1.0.0",
        "props": {
            "risk_level": summary['overall_assessment']['risk_level'],
            "concerns": summary['overall_assessment']['key_concerns']
        }
    })

    # 2. Abnormal Findings (The "Red" Section)
    if summary['abnormal_findings']:
        manifest.append({
            "id": "section_abnormal",
            "type": "SectionDivider",
            "version": "1.0.0",
            "props": {"title": "⚠️ Attention Required"}
        })
        for i, item in enumerate(summary['abnormal_findings']):
            manifest.append({
                "id": f"abnormal_{i}",
                "type": "AbnormalCard",
                "version": "1.0.0",
                "props": item
            })

    # 3. Management Plan (Tables)
    if summary['follow_up_plan']:
        manifest.append({
            "id": "section_followup",
            "type": "SectionDivider",
            "version": "1.0.0",
            "props": {"title": "📅 Recommended Action Plan"}
        })
        manifest.append({
            "id": "followup_table",
            "type": "FollowUpTable",
            "version": "1.0.0",
            "props": {"rows": summary['follow_up_plan']}
        })

    if summary['lifestyle_modifications']:
        manifest.append({
            "id": "lifestyle_table",
            "type": "LifestyleTable",
            "version": "1.0.0",
            "props": {"rows": summary['lifestyle_modifications']}
        })

    # 4. Normal Findings (Reassurance)
    if summary['normal_findings']:
        manifest.append({
            "id": "section_normal",
            "type": "SectionDivider",
            "version": "1.0.0",
            "props": {"title": "✅ Good News"}
        })
        manifest.append({
            "id": "normal_list",
            "type": "NormalList",
            "version": "1.0.0",
            "props": {"items": summary['normal_findings']}
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