import json
import os
from typing import TypedDict, List
from langgraph.graph import StateGraph, END
from langchain_google_genai import ChatGoogleGenerativeAI
from schema import RawLabReport, SmartSummary
from prompts import MASTER_PROMPT
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
    
    # Call Gemini
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

# --- NODE 2: UI MAPPER (Generative UI) ---
def map_to_ui(state: AgentState):
    print("--- Mapping to UI Components ---")
    summary = state['smart_summary']
    manifest = []

    # 1. Header Card (Overall Status)
    manifest.append({
        "type": "HealthScoreHeader",
        "props": {
            "risk_level": summary['overall_assessment']['risk_level'],
            "concerns": summary['overall_assessment']['key_concerns']
        }
    })

    # 2. Abnormal Findings (The "Red" Section)
    if summary['abnormal_findings']:
        manifest.append({"type": "SectionDivider", "props": {"title": "⚠️ Attention Required"}}),
        for item in summary['abnormal_findings']:
            manifest.append({
                "type": "AbnormalCard",
                "props": item # Passes parameter, causes, effects, etc.
            })

    # 3. Management Plan (Tables)
    if summary['follow_up_plan']:
        manifest.append({"type": "SectionDivider", "props": {"title": "📅 Recommended Action Plan"}})
        manifest.append({
            "type": "FollowUpTable",
            "props": {"rows": summary['follow_up_plan']}
        })

    if summary['lifestyle_modifications']:
        manifest.append({
            "type": "LifestyleTable",
            "props": {"rows": summary['lifestyle_modifications']}
        })

    # 4. Normal Findings (Reassurance)
    if summary['normal_findings']:
        manifest.append({"type": "SectionDivider", "props": {"title": "✅ Good News"}}),
        manifest.append({
            "type": "NormalList",
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