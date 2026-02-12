"""
UI RULES ENGINE - Declarative rules for dynamic manifest generation

This module implements a rules-based system for determining which components
to render and in what order, based on clinical urgency and data availability.

Rule Categories:
1. SEVERITY RULES - Prioritize CRITICAL findings
2. GROUPING RULES - Merge related abnormal findings
3. TONE ADAPTATION - Adjust UI hierarchy based on risk level
4. CONDITIONAL RENDERING - Show/hide components based on data presence

Usage:
    engine = RulesEngine()
    component_specs = engine.apply_rules(smart_summary)
    # Returns list of {type, props_generator, rendering_hints}
"""

from typing import Callable, List, Dict, Any, Optional
from schema import SmartSummary, AbnormalFinding


class Rule:
    """Single declarative rule: condition + actions"""
    
    def __init__(
        self,
        name: str,
        condition: Callable[[SmartSummary], bool],
        actions: List["Action"],
        priority: int = 0
    ):
        self.name = name
        self.condition = condition
        self.actions = actions
        self.priority = priority  # Higher priority evaluated first
    
    def applies_to(self, summary: SmartSummary) -> bool:
        """Check if this rule's condition is met"""
        return self.condition(summary)


class Action:
    """Action triggered by a rule: add/modify component"""
    
    def __init__(
        self,
        action_type: str,  # "prepend", "append", "replace", "merge"
        component_type: str,
        props_generator: Optional[Callable] = None,
        target_index: int = None,
        rendering_hints: Optional[Dict] = None
    ):
        self.action_type = action_type
        self.component_type = component_type
        self.props_generator = props_generator or (lambda s: {})
        self.target_index = target_index
        self.rendering_hints = rendering_hints or {}


class RulesEngine:
    """Evaluates rules and generates component specifications"""
    
    def __init__(self):
        self.rules = self._build_rules()
    
    def _build_rules(self) -> List[Rule]:
        """
        Construct the declarative rules for manifest generation.
        
        Rules are evaluated in order of priority (highest first).
        Rules can add, modify, or merge components based on conditions.
        """
        
        return [
            # ================================================================
            # SEVERITY RULES - Handle CRITICAL/HIGH findings
            # ================================================================
            
            Rule(
                name="critical_alert_prepend",
                condition=lambda s: self._has_critical_findings(s),
                priority=100,
                actions=[
                    Action(
                        action_type="prepend",
                        component_type="CriticalAlert",
                        props_generator=self._props_critical_alert,
                    )
                ]
            ),
            
            Rule(
                name="high_risk_insight_header",
                condition=lambda s: s.overall_assessment.risk_level in ["High", "Critical"],
                priority=90,
                actions=[
                    Action(
                        action_type="prepend",
                        component_type="InsightHeader",
                        props_generator=self._props_insight_header,
                    )
                ]
            ),
            
            # ================================================================
            # ABNORMAL FINDINGS RENDERING
            # ================================================================
            
            Rule(
                name="render_abnormal_findings",
                condition=lambda s: len(s.abnormal_findings) > 0,
                priority=80,
                actions=[]  # Will be dynamically built in apply_rules
            ),
            
            # ================================================================
            # GROUPING RULES - Merge related findings
            # ================================================================
            
            Rule(
                name="group_lipid_panel",
                condition=lambda s: self._count_findings_by_category(s, "Lipid") > 2,
                priority=70,
                actions=[
                    Action(
                        action_type="append",
                        component_type="MetricAccordion",
                        props_generator=self._props_lipid_group,
                    )
                ]
            ),
            
            Rule(
                name="group_metabolic_findings",
                condition=lambda s: self._count_findings_by_system(s, "Metabolic") > 3,
                priority=65,
                actions=[
                    Action(
                        action_type="append",
                        component_type="MetricAccordion",
                        props_generator=self._props_metabolic_group,
                    )
                ]
            ),
            
            # ================================================================
            # FOLLOW-UP & ACTIONS
            # ================================================================
            
            Rule(
                name="render_action_timeline",
                condition=lambda s: len(s.follow_up_plan) > 0,
                priority=60,
                actions=[
                    Action(
                        action_type="append",
                        component_type="SectionDivider",
                        props_generator=lambda s: {"title": "📋 Recommended Follow-Up Tests"},
                    ),
                    Action(
                        action_type="append",
                        component_type="ActionTimeline",
                        props_generator=self._props_action_timeline,
                    )
                ]
            ),
            
            Rule(
                name="render_lifestyle_guidelines",
                condition=lambda s: len(s.lifestyle_modifications) > 0,
                priority=55,
                actions=[
                    Action(
                        action_type="append",
                        component_type="SectionDivider",
                        props_generator=lambda s: {"title": "💡 Lifestyle Recommendations"},
                    ),
                    Action(
                        action_type="append",
                        component_type="GuidelineTable",
                        props_generator=self._props_lifestyle_table,
                    )
                ]
            ),
            
            # ================================================================
            # REASSURANCE SECTION - Normal findings
            # ================================================================
            
            Rule(
                name="render_reassurance",
                condition=lambda s: len(s.normal_findings) > 0,
                priority=50,
                actions=[
                    Action(
                        action_type="append",
                        component_type="SectionDivider",
                        props_generator=lambda s: {"title": "✅ Good News - Normal Results"},
                    ),
                    Action(
                        action_type="append",
                        component_type="ReassuranceGrid",
                        props_generator=self._props_reassurance_grid,
                    )
                ]
            ),
            
            # ================================================================
            # LOW-RISK TONE ADAPTATION
            # ================================================================
            
            Rule(
                name="low_risk_lead_with_reassurance",
                condition=lambda s: s.overall_assessment.risk_level == "Low",
                priority=40,
                actions=[
                    # Prepend ReassuranceGrid if not already there
                    Action(
                        action_type="prepend",
                        component_type="ReassuranceGrid",
                        props_generator=self._props_reassurance_grid,
                    )
                ]
            ),
        ]
    
    def apply_rules(self, summary: SmartSummary) -> List[Dict[str, Any]]:
        """
        Apply all matching rules to generate component specifications.
        
        Process:
        1. Sort rules by priority (highest first)
        2. For each rule, check condition
        3. If true, execute actions to add/modify components
        4. Return final component list
        
        Args:
            summary: SmartSummary to analyze
            
        Returns:
            List of component specs: {type, props_generator, rendering_hints}
        """
        
        # Sort rules by priority (highest first)
        sorted_rules = sorted(self.rules, key=lambda r: r.priority, reverse=True)
        
        # Track components in insertion order
        components: List[Dict[str, Any]] = []
        
        # Apply rules
        for rule in sorted_rules:
            if rule.applies_to(summary):
                # Special handling for abnormal findings
                if rule.name == "render_abnormal_findings":
                    components.append({
                        "type": "SectionDivider",
                        "props_generator": lambda s: {"title": "⚠️ Findings Requiring Attention"},
                        "rendering_hints": {},
                        "id": f"{len(components)}_divider",
                    })
                    for finding in summary.abnormal_findings:
                        components.append({
                            "type": "MetricAccordion",
                            "props_generator": lambda s, f=finding: self._props_metric_accordion(s, f),
                            "rendering_hints": {},
                            "id": f"{len(components)}_finding",
                        })
                else:
                    # Regular rule action processing
                    for action in rule.actions:
                        if action.action_type == "prepend":
                            components.insert(0, {
                                "type": action.component_type,
                                "props_generator": action.props_generator,
                                "rendering_hints": action.rendering_hints,
                                "id": f"{len(components)}_prepend",
                            })
                        elif action.action_type == "append":
                            components.append({
                                "type": action.component_type,
                                "props_generator": action.props_generator,
                                "rendering_hints": action.rendering_hints,
                                "id": f"{len(components)}_append",
                            })
        
        return components
    
    # ========================================================================
    # HELPER METHODS - Condition checks
    # ========================================================================
    
    def _has_critical_findings(self, summary: SmartSummary) -> bool:
        """Check if any finding has CRITICAL status"""
        return any(f.status == "CRITICAL" for f in summary.abnormal_findings)
    
    def _count_findings_by_category(self, summary: SmartSummary, category: str) -> int:
        """Count findings matching a category keyword"""
        return sum(1 for f in summary.abnormal_findings if category in f.parameter)
    
    def _count_findings_by_system(self, summary: SmartSummary, system: str) -> int:
        """Count findings by biological system"""
        system_keywords = {
            "Metabolic": ["Glucose", "HbA1c", "Triglycerides", "Cholesterol"],
            "Hematological": ["WBC", "RBC", "Hemoglobin", "Platelets"],
            "Renal": ["Creatinine", "BUN", "eGFR"],
            "Cardiac": ["Troponin", "BNP"],
        }
        keywords = system_keywords.get(system, [])
        return sum(1 for f in summary.abnormal_findings if any(k in f.parameter for k in keywords))
    
    # ========================================================================
    # PROPS GENERATORS - Build component props from SmartSummary
    # ========================================================================
    
    def _props_critical_alert(self, summary: SmartSummary) -> Dict[str, Any]:
        """Generate props for CriticalAlert component"""
        critical_findings = [f for f in summary.abnormal_findings if f.status == "CRITICAL"]
        return {
            "findings": [
                {
                    "test_name": f.parameter,
                    "value": f.value,
                    "warning_text": f.clinical_note,
                    "status": f.status
                }
                for f in critical_findings
            ],
            "urgency_level": "CRITICAL"
        }
    
    def _props_insight_header(self, summary: SmartSummary) -> Dict[str, Any]:
        """Generate props for InsightHeader component"""
        return {
            "patient_info": {
                "name": "Patient",
                "age": 0,
                "gender": "N/A",
            },
            "risk_level": summary.overall_assessment.risk_level,
            "overall_concerns": summary.overall_assessment.key_concerns,
            "date": "Today"
        }
    
    def _props_metric_accordion(self, summary: SmartSummary, finding: AbnormalFinding) -> Dict[str, Any]:
        """Generate props for MetricAccordion component"""
        return {
            "parameter": finding.parameter,
            "value": finding.value,
            "status": finding.status,
            "causes": finding.causes,
            "effects": finding.effects,
            "clinical_note": finding.clinical_note,
            "correlation": {}
        }
    
    def _props_lipid_group(self, summary: SmartSummary) -> Dict[str, Any]:
        """Generate props for grouped lipid findings"""
        lipid_findings = [f for f in summary.abnormal_findings if "Lipid" in f.parameter]
        return {
            "parameter": "Lipid Panel",
            "value": f"{len(lipid_findings)} abnormalities",
            "status": "HIGH" if any(f.status == "HIGH" for f in lipid_findings) else "LOW",
            "causes": list(set(c for f in lipid_findings for c in f.causes)),
            "effects": list(set(e for f in lipid_findings for e in f.effects)),
            "clinical_note": "Multiple lipid abnormalities detected",
        }
    
    def _props_metabolic_group(self, summary: SmartSummary) -> Dict[str, Any]:
        """Generate props for grouped metabolic findings"""
        metabolic_keywords = ["Glucose", "HbA1c", "Triglycerides"]
        metabolic_findings = [f for f in summary.abnormal_findings if any(k in f.parameter for k in metabolic_keywords)]
        return {
            "parameter": "Metabolic Syndrome Indicators",
            "value": f"{len(metabolic_findings)} abnormalities",
            "status": "HIGH" if any(f.status in ["CRITICAL", "HIGH"] for f in metabolic_findings) else "LOW",
            "causes": list(set(c for f in metabolic_findings for c in f.causes)),
            "effects": list(set(e for f in metabolic_findings for e in f.effects)),
            "clinical_note": "Pattern suggests metabolic dysfunction",
        }
    
    def _props_action_timeline(self, summary: SmartSummary) -> Dict[str, Any]:
        """Generate props for ActionTimeline component"""
        return {
            "events": [
                {
                    "time": f.timeline,
                    "test_name": f.test_name,
                    "rationale": f.rationale,
                    "priority": "high" if "Immediate" in f.timeline else "normal"
                }
                for f in summary.follow_up_plan
            ]
        }
    
    def _props_lifestyle_table(self, summary: SmartSummary) -> Dict[str, Any]:
        """Generate props for GuidelineTable (lifestyle)"""
        return {
            "headers": ["Category", "Recommendation"],
            "rows": [
                {
                    "category": item.category,
                    "recommendation": item.recommendation
                }
                for item in summary.lifestyle_modifications
            ],
            "type": "lifestyle",
            "themeColor": "green"
        }
    
    def _props_reassurance_grid(self, summary: SmartSummary) -> Dict[str, Any]:
        """Generate props for ReassuranceGrid component"""
        return {
            "items": [
                {
                    "name": f.parameter,
                    "value": f.value,
                    "interpretation": f.clinical_interpretation
                }
                for f in summary.normal_findings
            ]
        }


# End of RulesEngine class

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
