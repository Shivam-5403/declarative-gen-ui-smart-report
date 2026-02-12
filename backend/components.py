"""
COMPONENT REGISTRY - Authoritative source of truth for all renderable UI components.

This module defines the complete component catalog with:
- Props schemas (Pydantic models for validation)
- Rendering hints (positioning, styling, severity triggers)
- Semantic versioning for backward compatibility
- Component metadata (description, visual role, category)

The registry is used by:
1. Backend: To validate generated manifests before sending to frontend
2. Frontend: To auto-discover available components and build componentMap at runtime
3. API Export: To generate JSON schemas and TypeScript types
"""

from typing import Type, Dict, List, Optional, Any
from pydantic import BaseModel
from datetime import datetime
from schema import (
    InsightHeaderProps,
    CriticalAlertProps,
    MetricAccordionProps,
    ReassuranceGridProps,
    ActionTimelineProps,
    GuidelineTableProps,
    CorrelationMapProps,
    AbnormalCardProps,
    HealthScoreHeaderProps,
    FollowUpTableProps,
    LifestyleTableProps,
    MetricCardProps,
    TrendChartProps,
    SectionDividerProps,
    NormalListProps,
)


class ComponentDefinition(BaseModel):
    """Metadata for a single component in the registry"""
    
    name: str  # Unique component identifier
    version: str  # Semantic version (e.g., "1.0.0")
    display_name: str  # Human-readable name
    visual_role: str  # What the component does (e.g., "Displays patient info & risk badge")
    description: str  # Detailed description
    category: str  # "Header", "Alert", "Card", "Table", "Visualization", "Grid"
    props_model: Type[BaseModel]  # Pydantic model for props validation
    rendering_hints: Dict[str, Any]  # {position, width, severity_triggers, etc.}
    deprecations: Optional[List[str]] = None  # Lists deprecated versions
    breaking_changes: Optional[Dict[str, str]] = None  # {version: description}


# ============================================================================
# SPECIALIZED MEDICAL COMPONENTS (New)
# ============================================================================

INSIGHT_HEADER_DEF = ComponentDefinition(
    name="InsightHeader",
    version="1.0.0",
    display_name="Patient Insight & Risk Badge",
    visual_role="Displays patient demographics and overall risk level assessment",
    description="Large header with patient info (age, gender, name) and color-coded risk badge. Primary hero component for high-risk patients.",
    category="Header",
    props_model=InsightHeaderProps,
    rendering_hints={
        "position": "top",
        "width": "full",
        "height": "auto",
        "severity_triggers": ["CRITICAL", "HIGH"],
        "background": "gradient",
        "padding": "large",
    },
)

CRITICAL_ALERT_DEF = ComponentDefinition(
    name="CriticalAlert",
    version="1.0.0",
    display_name="Critical Finding Alert",
    visual_role="High-visibility banner for CRITICAL lab findings requiring immediate attention",
    description="Full-width red banner displaying CRITICAL findings. Non-dismissible. Always placed at top after InsightHeader.",
    category="Alert",
    props_model=CriticalAlertProps,
    rendering_hints={
        "position": "top",
        "width": "full",
        "severity_triggers": ["CRITICAL"],
        "background": "red-600",
        "animation": "pulse",
        "dismiss": False,
    },
)

METRIC_ACCORDION_DEF = ComponentDefinition(
    name="MetricAccordion",
    version="1.0.0",
    display_name="Expandable Medical Parameter Card",
    visual_role="Expandable card for HIGH/LOW findings with causes, effects, and clinical correlation",
    description="Collapsible detail card that expands to show root causes, downstream effects, clinical notes, and correlation to other findings. Primary component for abnormal findings.",
    category="Card",
    props_model=MetricAccordionProps,
    rendering_hints={
        "position": "middle",
        "width": "full",
        "expandable": True,
        "status_colors": {"CRITICAL": "red-600", "HIGH": "orange-500", "LOW": "blue-500"},
        "default_expanded": "CRITICAL",
    },
)

REASSURANCE_GRID_DEF = ComponentDefinition(
    name="ReassuranceGrid",
    version="1.0.0",
    display_name="Normal Findings Reassurance Grid",
    visual_role="Compact 2-3 column grid showing normal/good test results with reassuring tone",
    description="Green-themed grid displaying normal findings. Used to reassure patients that not all values are abnormal. Reduces cognitive load.",
    category="Grid",
    props_model=ReassuranceGridProps,
    rendering_hints={
        "position": "bottom",
        "width": "full",
        "columns": 3,
        "background": "green-50",
        "tone": "reassuring",
        "show_checkmarks": True,
    },
)

ACTION_TIMELINE_DEF = ComponentDefinition(
    name="ActionTimeline",
    version="1.0.0",
    display_name="Follow-Up Tests Timeline",
    visual_role="Vertical timeline showing recommended follow-up tests with timing and rationale",
    description="Milestone-based timeline component showing when and why follow-up tests should be performed. Helps patient understand clinical pathway.",
    category="Visualization",
    props_model=ActionTimelineProps,
    rendering_hints={
        "position": "middle",
        "width": "full",
        "orientation": "vertical",
        "milestone_colors": {"Immediate": "red", "1 Week": "orange", "1 Month": "blue", "3 Months": "green"},
        "show_rationale": True,
    },
)

GUIDELINE_TABLE_DEF = ComponentDefinition(
    name="GuidelineTable",
    version="1.0.0",
    display_name="Lifestyle & Treatment Guidelines Table",
    visual_role="Clean, scannable table for lifestyle modifications and medication recommendations",
    description="Professional table component showing recommended actions (diet, exercise, medication). Supports two types: lifestyle and medication. Includes category badges and priority indicators.",
    category="Table",
    props_model=GuidelineTableProps,
    rendering_hints={
        "position": "bottom",
        "width": "full",
        "striped": True,
        "hover_effects": True,
        "category_icons": True,
        "priority_indicators": True,
    },
)

CORRELATION_MAP_DEF = ComponentDefinition(
    name="CorrelationMap",
    version="1.0.0",
    display_name="Clinical Parameter Correlation Network",
    visual_role="Force-directed graph visualizing relationships between related lab findings",
    description="Interactive graph showing how different biomarkers correlate and influence each other. Example: HbA1c → Glucose → Insulin. Helps patients understand systemic patterns.",
    category="Visualization",
    props_model=CorrelationMapProps,
    rendering_hints={
        "position": "middle",
        "width": "full",
        "interactive": True,
        "node_size": "severity",
        "edge_weight": "correlation_strength",
        "show_labels": True,
    },
)

# ============================================================================
# EXISTING COMPONENTS (Adapted to new schema)
# ============================================================================

ABNORMAL_CARD_DEF = ComponentDefinition(
    name="AbnormalCard",
    version="1.0.0",
    display_name="Abnormal Finding Card (Legacy)",
    visual_role="Expandable card for abnormal lab findings",
    description="Legacy component for displaying individual abnormal findings. Similar to MetricAccordion but predates the new specialized component library.",
    category="Card",
    props_model=AbnormalCardProps,
    rendering_hints={
        "position": "middle",
        "width": "full",
        "expandable": True,
        "legacy": True,
    },
    deprecations=["Use MetricAccordion instead for better UX"],
)

HEALTH_SCORE_HEADER_DEF = ComponentDefinition(
    name="HealthScoreHeader",
    version="1.0.0",
    display_name="Health Risk Badge Header",
    visual_role="Risk level badge with key concerns list",
    description="Simple header showing overall risk level and bullet-point list of key concerns. Legacy component, simpler than InsightHeader.",
    category="Header",
    props_model=HealthScoreHeaderProps,
    rendering_hints={
        "position": "top",
        "width": "full",
        "legacy": True,
    },
)

FOLLOW_UP_TABLE_DEF = ComponentDefinition(
    name="FollowUpTable",
    version="1.0.0",
    display_name="Follow-Up Tests Table (Legacy)",
    visual_role="Simple table for follow-up test recommendations",
    description="Legacy table component. Use GuidelineTable or ActionTimeline for better organization.",
    category="Table",
    props_model=FollowUpTableProps,
    rendering_hints={
        "position": "bottom",
        "width": "full",
        "legacy": True,
    },
    deprecations=["Use ActionTimeline or GuidelineTable instead"],
)

LIFESTYLE_TABLE_DEF = ComponentDefinition(
    name="LifestyleTable",
    version="1.0.0",
    display_name="Lifestyle Recommendations Table (Legacy)",
    visual_role="Lifestyle modification recommendations",
    description="Legacy table for lifestyle changes. Use GuidelineTable(type='lifestyle') for consistency.",
    category="Table",
    props_model=LifestyleTableProps,
    rendering_hints={
        "position": "bottom",
        "width": "full",
        "legacy": True,
    },
    deprecations=["Use GuidelineTable(type='lifestyle') instead"],
)

METRIC_CARD_DEF = ComponentDefinition(
    name="MetricCard",
    version="1.0.0",
    display_name="Individual Metric Display Card",
    visual_role="Single lab value display with status and advice",
    description="Simple card showing one metric. Not currently used in manifest generation but available if needed.",
    category="Card",
    props_model=MetricCardProps,
    rendering_hints={
        "position": "middle",
        "width": "auto",
    },
)

TREND_CHART_DEF = ComponentDefinition(
    name="TrendChart",
    version="1.0.0",
    display_name="Value Trend Visualization",
    visual_role="Line chart showing historical lab value trends",
    description="Recharts-based line chart for displaying value changes over time. Available for future manifests when historical data is present.",
    category="Visualization",
    props_model=TrendChartProps,
    rendering_hints={
        "position": "middle",
        "width": "full",
        "interactive": True,
    },
)

SECTION_DIVIDER_DEF = ComponentDefinition(
    name="SectionDivider",
    version="1.0.0",
    display_name="Section Divider Header",
    visual_role="Text divider between logical sections",
    description="Simple text divider (e.g., '⚠️ Attention Required', '✅ Good News'). Helps organize visual hierarchy.",
    category="Header",
    props_model=SectionDividerProps,
    rendering_hints={
        "position": "middle",
        "width": "full",
        "padding": "medium",
    },
)

NORMAL_LIST_DEF = ComponentDefinition(
    name="NormalList",
    version="1.0.0",
    display_name="Simple Normal Findings List",
    visual_role="Inline grid of normal findings",
    description="Simple inline component for rendering normal findings. Use ReassuranceGrid for better UX.",
    category="Grid",
    props_model=NormalListProps,
    rendering_hints={
        "position": "bottom",
        "width": "full",
        "legacy": True,
    },
    deprecations=["Use ReassuranceGrid instead for better styling"],
)

# ============================================================================
# AUTHORITATIVE COMPONENT REGISTRY
# ============================================================================

COMPONENT_REGISTRY: Dict[str, ComponentDefinition] = {
    # New specialized components
    "InsightHeader": INSIGHT_HEADER_DEF,
    "CriticalAlert": CRITICAL_ALERT_DEF,
    "MetricAccordion": METRIC_ACCORDION_DEF,
    "ReassuranceGrid": REASSURANCE_GRID_DEF,
    "ActionTimeline": ACTION_TIMELINE_DEF,
    "GuidelineTable": GUIDELINE_TABLE_DEF,
    "CorrelationMap": CORRELATION_MAP_DEF,
    
    # Legacy components (maintained for backward compatibility)
    "AbnormalCard": ABNORMAL_CARD_DEF,
    "HealthScoreHeader": HEALTH_SCORE_HEADER_DEF,
    "FollowUpTable": FOLLOW_UP_TABLE_DEF,
    "LifestyleTable": LIFESTYLE_TABLE_DEF,
    "MetricCard": METRIC_CARD_DEF,
    "TrendChart": TREND_CHART_DEF,
    "SectionDivider": SECTION_DIVIDER_DEF,
    "NormalList": NORMAL_LIST_DEF,
}


def get_component(name: str) -> Optional[ComponentDefinition]:
    """Retrieve a component definition by name"""
    return COMPONENT_REGISTRY.get(name)


def list_components(category: Optional[str] = None) -> List[ComponentDefinition]:
    """List all components, optionally filtered by category"""
    components = list(COMPONENT_REGISTRY.values())
    if category:
        components = [c for c in components if c.category == category]
    return components


def export_as_json_schema() -> Dict[str, Any]:
    """Export entire registry as JSON Schema for API consumption"""
    schemas = {}
    for name, component_def in COMPONENT_REGISTRY.items():
        schemas[name] = {
            "componentName": name,
            "version": component_def.version,
            "displayName": component_def.display_name,
            "category": component_def.category,
            "visualRole": component_def.visual_role,
            "description": component_def.description,
            "propsSchema": component_def.props_model.model_json_schema(),
            "renderingHints": component_def.rendering_hints,
            "deprecations": component_def.deprecations or [],
            "breakingChanges": component_def.breaking_changes or {},
        }
    return schemas