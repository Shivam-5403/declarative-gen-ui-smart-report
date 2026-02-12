"""
UI RULES ENGINE - Declarative rules for dynamic manifest generation

This module implements the business logic that determines:
- Which components to render
- In what order
- With what data (props)

Rules are organized by categories:
1. Severity Rules - Priority based on finding criticality
2. Grouping Rules - Consolidating related findings
3. Tone Adaptation Rules - Adjusting language/tone by risk level
4. Conditional Rendering - Adding optional components
"""

from typing import List, Dict, Any, Callable, Optional
from schema import SmartSummary, AbnormalFinding, NormalFinding


class Rule:
    """
    A single rule: IF condition THEN execute actions.
    
    Attributes:
        name: Rule identifier
        condition: Lambda that returns True/False based on SmartSummary
        actions: List of actions to execute if condition is True
        priority: Higher priority rules execute first (default 0)
    """
    
    def __init__(
        self,
        name: str,
        condition: Callable[[SmartSummary], bool],
        actions: List['Action'],
        priority: int = 0,
    ):
        self.name = name
        self.condition = condition
        self.actions = actions
        self.priority = priority


class Action:
    """
    Action to execute when a rule matches.
    
    Types:
    - "prepend": Add component at start of manifest
    - "append": Add component at end of manifest
    - "after_header": Add after InsightHeader/HealthScoreHeader
    - "after_critical": Add after CriticalAlert
    - "after_abnormal": Add after all abnormal finding cards
    - "after_normal": Add after normal findings section
    - "replace": Replace existing component type
    - "merge": Group multiple findings into single accordion
    """
    
    def __init__(
        self,
        action_type: str,  # prepend, append, after_header, etc.
        component_type: str,
        props_generator: Callable[[SmartSummary], Dict[str, Any]],
        condition: Optional[Callable[[SmartSummary], bool]] = None,  # Optional sub-condition
    ):
        self.action_type = action_type
        self.component_type = component_type
        self.props_generator = props_generator
        self.condition = condition


# ============================================================================
# PROPS GENERATORS - Reusable functions for generating component props
# ============================================================================

def generate_insight_header_props(summary: SmartSummary) -> Dict[str, Any]:
    """Generate props for InsightHeader component"""
    return {
        "patient_info": summary.__dict__.get("patient_info", {}),  # Would come from context
        "risk_level": summary.overall_assessment.risk_level,
        "overall_concerns": summary.overall_assessment.key_concerns,
        "date": datetime.utcnow().isoformat(),
    }


def generate_health_score_header_props(summary: SmartSummary) -> Dict[str, Any]:
    """Generate props for HealthScoreHeader component (legacy)"""
    return {
        "risk_level": summary.overall_assessment.risk_level,
        "concerns": summary.overall_assessment.key_concerns,
    }


def generate_critical_alert_props(summary: SmartSummary) -> Dict[str, Any]:
    """Generate props for CriticalAlert component"""
    critical_findings = [f for f in summary.abnormal_findings if f.status == "CRITICAL"]
    return {
        "findings": [
            {
                "test_name": f.parameter,
                "value": f.value,
                "warning_text": f.clinical_note,
                "status": f.status,
            }
            for f in critical_findings
        ],
        "urgency_level": "CRITICAL",
    }


def generate_metric_accordion_props(finding: AbnormalFinding, index: int = 0) -> Dict[str, Any]:
    """Generate props for a single MetricAccordion component"""
    return {
        "parameter": finding.parameter,
        "value": finding.value,
        "status": finding.status,
        "causes": finding.causes,
        "effects": finding.effects,
        "clinical_note": finding.clinical_note,
        "correlation": finding.__dict__.get("correlation", None),
    }


def generate_reassurance_grid_props(summary: SmartSummary) -> Dict[str, Any]:
    """Generate props for ReassuranceGrid component"""
    items = [
        {
            "name": f.parameter,
            "value": f.value,
            "interpretation": f.clinical_interpretation,
        }
        for f in summary.normal_findings
    ]
    return {"items": items}


def generate_action_timeline_props(summary: SmartSummary) -> Dict[str, Any]:
    """Generate props for ActionTimeline component"""
    events = [
        {
            "time": f.timeline,
            "test_name": f.test_name,
            "rationale": f.rationale,
            "priority": "high" if f.timeline == "Immediate" else "normal",
        }
        for f in summary.follow_up_plan
    ]
    return {"events": events}


def generate_guideline_table_props(summary: SmartSummary, type_: str = "lifestyle") -> Dict[str, Any]:
    """Generate props for GuidelineTable component"""
    rows = [
        {
            "category": item.category,
            "recommendation": item.recommendation,
        }
        for item in summary.lifestyle_modifications
    ]
    return {
        "headers": ["Category", "Recommendation"],
        "rows": rows,
        "type": type_,
        "themeColor": "green" if type_ == "lifestyle" else "blue",
    }


def generate_abnormal_card_props(finding: AbnormalFinding) -> Dict[str, Any]:
    """Generate props for legacy AbnormalCard component"""
    return {
        "parameter": finding.parameter,
        "value": finding.value,
        "status": finding.status,
        "causes": finding.causes,
        "effects": finding.effects,
        "clinical_note": finding.clinical_note,
    }


def generate_section_divider_props(title: str, icon: str = "") -> Callable:
    """Factory for SectionDivider props generator"""
    def generator(summary: SmartSummary) -> Dict[str, Any]:
        return {"title": title, "icon": icon}
    return generator


def generate_normal_list_props(summary: SmartSummary) -> Dict[str, Any]:
    """Generate props for legacy NormalList component"""
    return {
        "items": [
            {"name": f.parameter, "value": f.value}
            for f in summary.normal_findings
        ]
    }


from datetime import datetime


# ============================================================================
# DECLARATIVE RULES
# ============================================================================

class RulesEngine:
    """
    Orchestrates rule evaluation and component generation.
    
    Workflow:
    1. Load all rules
    2. Sort by priority (highest first)
    3. For each rule, check condition
    4. If condition matches, execute actions to build component sequence
    5. Return list of (component_type, props_generator) tuples
    """
    
    def __init__(self):
        self.rules = self._initialize_rules()
    
    def _initialize_rules(self) -> List[Rule]:
        """Initialize all declarative rules"""
        rules = [
            # ===== CRITICAL SEVERITY RULES (Priority 100) =====
            Rule(
                name="critical_finding_alert",
                condition=lambda s: any(f.status == "CRITICAL" for f in s.abnormal_findings),
                actions=[
                    Action(
                        "prepend",
                        "CriticalAlert",
                        generate_critical_alert_props,
                    )
                ],
                priority=100,
            ),
            
            # ===== HIGH RISK RULES (Priority 90) =====
            Rule(
                name="high_risk_tone",
                condition=lambda s: s.overall_assessment.risk_level in ["High", "Critical"],
                actions=[
                    Action("prepend", "InsightHeader", generate_insight_header_props),
                    Action(
                        "after_critical",
                        "SectionDivider",
                        generate_section_divider_props("⚠️ Findings Requiring Attention"),
                    ),
                ],
                priority=90,
            ),
            
            # ===== LOW RISK RULES (Priority 80) =====
            Rule(
                name="low_risk_reassurance_first",
                condition=lambda s: s.overall_assessment.risk_level == "Low" and len(s.abnormal_findings) == 0,
                actions=[
                    Action("prepend", "ReassuranceGrid", generate_reassurance_grid_props),
                ],
                priority=80,
            ),
            
            # ===== GROUPING RULES (Priority 70) =====
            Rule(
                name="group_abnormal_findings",
                condition=lambda s: len(s.abnormal_findings) > 0,
                actions=[],  # Dynamic: handled in apply_rules
                priority=70,
            ),
            
            # ===== ACTION/FOLLOW-UP RULES (Priority 60) =====
            Rule(
                name="add_follow_up_timeline",
                condition=lambda s: len(s.follow_up_plan) > 0,
                actions=[
                    Action("after_abnormal", "ActionTimeline", generate_action_timeline_props),
                ],
                priority=60,
            ),
            
            # ===== NORMAL FINDINGS SECTION (Priority 50) =====
            Rule(
                name="add_reassurance_section",
                condition=lambda s: len(s.normal_findings) > 0,
                actions=[
                    Action(
                        "append",
                        "SectionDivider",
                        generate_section_divider_props("✅ Good News - Normal Results"),
                    ),
                    Action("append", "ReassuranceGrid", generate_reassurance_grid_props),
                ],
                priority=50,
            ),
            
            # ===== LIFESTYLE/MEDICATION RULES (Priority 40) =====
            Rule(
                name="add_lifestyle_recommendations",
                condition=lambda s: len(s.lifestyle_modifications) > 0,
                actions=[
                    Action(
                        "append",
                        "SectionDivider",
                        generate_section_divider_props("💡 Recommended Changes"),
                    ),
                    Action(
                        "append",
                        "GuidelineTable",
                        lambda s: generate_guideline_table_props(s, "lifestyle"),
                    ),
                ],
                priority=40,
            ),
        ]
        
        return sorted(rules, key=lambda r: r.priority, reverse=True)
    
    def apply_rules(self, summary: SmartSummary) -> List[Dict[str, Any]]:
        """
        Apply all rules to generate component sequence.
        
        Returns:
            List of component specs: [
                {"type": "CriticalAlert", "props_generator": fn},
                {"type": "InsightHeader", "props_generator": fn},
                ...
            ]
        """
        
        components: List[Dict[str, Any]] = []
        
        # Sort rules by priority (highest first)
        for rule in sorted(self.rules, key=lambda r: r.priority, reverse=True):
            # Check if rule condition matches
            if rule.condition(summary):
                # Handle special case: abnormal findings grouping
                if rule.name == "group_abnormal_findings":
                    # Add one component per abnormal finding
                    # Using MetricAccordion (new) instead of AbnormalCard (legacy)
                    for finding in summary.abnormal_findings:
                        components.append({
                            "type": "MetricAccordion",
                            "props_generator": lambda s, f=finding: generate_metric_accordion_props(f),
                        })
                else:
                    # Execute actions for this rule
                    for action in rule.actions:
                        if action.condition is None or action.condition(summary):
                            components.append({
                                "type": action.component_type,
                                "props_generator": action.props_generator,
                            })
        
        return components
