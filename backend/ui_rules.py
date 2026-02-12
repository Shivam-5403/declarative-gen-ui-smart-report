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
from schema import SmartSummary, AbnormalReading

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
                name="render_insight_header",
                condition=lambda s: True, # Always render header to show patient info
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
                condition=lambda s: len(s.clinical_summary.abnormal_readings) > 0,
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
                condition=lambda s: len(s.management_plan.follow_up_tests) > 0,
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
                condition=lambda s: len(s.management_plan.lifestyle_modifications) > 0,
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
                condition=lambda s: len(s.clinical_summary.normal_readings) > 0,
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
                condition=lambda s: s.clinical_summary.overall_health_status.risk_assessment == "Low",
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
                    })
                    for finding in summary.clinical_summary.abnormal_readings:
                        # Capture finding in closure properly
                        components.append({
                            "type": "MetricAccordion",
                            "props_generator": (lambda f=finding: lambda s: self._props_metric_accordion(s, f))(),
                            "rendering_hints": {},
                        })
                else:
                    # Regular rule action processing
                    for action in rule.actions:
                        if action.action_type == "prepend":
                            components.insert(0, {
                                "type": action.component_type,
                                "props_generator": action.props_generator,
                                "rendering_hints": action.rendering_hints,
                            })
                        elif action.action_type == "append":
                            components.append({
                                "type": action.component_type,
                                "props_generator": action.props_generator,
                                "rendering_hints": action.rendering_hints,
                            })
        
        return components
    
    # ========================================================================
    # HELPER METHODS - Condition checks
    # ========================================================================
    
    def _has_critical_findings(self, summary: SmartSummary) -> bool:
        """Check if any finding has CRITICAL status"""
        return any(f.risk_level == "CRITICAL" for f in summary.clinical_summary.abnormal_readings)
    
    def _count_findings_by_category(self, summary: SmartSummary, category: str) -> int:
        """Count findings matching a category keyword"""
        return sum(1 for f in summary.clinical_summary.abnormal_readings if category in f.parameter_name)
    
    def _count_findings_by_system(self, summary: SmartSummary, system: str) -> int:
        """Count findings by biological system"""
        # Checks if 'system' field matches or if parameter is in known keywords
        count = 0
        system_keywords = {
            "Metabolic": ["Glucose", "HbA1c", "Triglycerides", "Cholesterol"],
            "Hematological": ["WBC", "RBC", "Hemoglobin", "Platelets"],
            "Renal": ["Creatinine", "BUN", "eGFR"],
            "Cardiac": ["Troponin", "BNP"],
        }
        keywords = system_keywords.get(system, [])
        
        for f in summary.clinical_summary.abnormal_readings:
            if f.system == system:
                count += 1
            elif any(k in f.parameter_name for k in keywords):
                count += 1
        return count
    
    # ========================================================================
    # PROPS GENERATORS - Build component props from SmartSummary
    # ========================================================================
    
    def _props_critical_alert(self, summary: SmartSummary) -> Dict[str, Any]:
        """Generate props for CriticalAlert component"""
        critical_findings = [f for f in summary.clinical_summary.abnormal_readings if f.risk_level == "CRITICAL"]
        return {
            "findings": [
                {
                    "test_name": f.parameter_name,
                    "value": f.value,
                    "warning_text": f.clinical_note,
                    "status": f.risk_level
                }
                for f in critical_findings
            ],
            "urgency_level": "CRITICAL"
        }
    
    def _props_insight_header(self, summary: SmartSummary) -> Dict[str, Any]:
        """Generate props for InsightHeader component"""
        return {
            "patient_info": {
                "name": summary.patient_info.name if summary.patient_info and summary.patient_info.name else "Patient",
                "age": summary.patient_info.age if summary.patient_info else 0,
                "gender": summary.patient_info.gender if summary.patient_info else "N/A",
            },
            "risk_level": summary.clinical_summary.overall_health_status.risk_assessment,
            "overall_concerns": summary.clinical_summary.overall_health_status.key_concerns,
            "date": summary.patient_info.report_date if summary.patient_info else "Today"
        }
    
    def _props_metric_accordion(self, summary: SmartSummary, finding: AbnormalReading) -> Dict[str, Any]:
        """Generate props for MetricAccordion component"""
        return {
            "parameter": finding.parameter_name,
            "value": finding.value,
            "status": finding.risk_level, 
            "causes": finding.causes,
            "effects": finding.effects,
            "clinical_note": finding.clinical_note,
            "correlation": {} 
        }
    
    def _props_lipid_group(self, summary: SmartSummary) -> Dict[str, Any]:
        """Generate props for grouped lipid findings"""
        lipid_findings = [f for f in summary.clinical_summary.abnormal_readings if "Lipid" in f.parameter_name or "Triglycerides" in f.parameter_name or "Cholesterol" in f.parameter_name]
        return {
            "parameter": "Lipid Panel",
            "value": f"{len(lipid_findings)} abnormalities",
            "status": "HIGH" if any(f.risk_level == "HIGH" for f in lipid_findings) else "LOW",
            "causes": list(set(c for f in lipid_findings for c in f.causes)),
            "effects": list(set(e for f in lipid_findings for e in f.effects)),
            "clinical_note": "Multiple lipid abnormalities detected",
        }
    
    def _props_metabolic_group(self, summary: SmartSummary) -> Dict[str, Any]:
        """Generate props for grouped metabolic findings"""
        metabolic_keywords = ["Glucose", "HbA1c", "Triglycerides"]
        metabolic_findings = [f for f in summary.clinical_summary.abnormal_readings if any(k in f.parameter_name for k in metabolic_keywords)]
        return {
            "parameter": "Metabolic Syndrome Indicators",
            "value": f"{len(metabolic_findings)} abnormalities",
            "status": "HIGH" if any(f.risk_level in ["CRITICAL", "HIGH"] for f in metabolic_findings) else "LOW",
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
                    "test_name": f.recommended_tests,
                    "rationale": f.rationale,
                    "priority": "high" if "Immediate" in f.timeline else "normal"
                }
                for f in summary.management_plan.follow_up_tests
            ]
        }
    
    def _props_lifestyle_table(self, summary: SmartSummary) -> Dict[str, Any]:
        """Generate props for GuidelineTable (lifestyle)"""
        return {
            "headers": ["Category", "Recommendation"],
            "rows": [
                {
                    "category": item.category,
                    "recommendation": item.recommendations
                }
                for item in summary.management_plan.lifestyle_modifications
            ],
            "type": "lifestyle",
            "themeColor": "green"
        }
    
    def _props_reassurance_grid(self, summary: SmartSummary) -> Dict[str, Any]:
        """Generate props for ReassuranceGrid component"""
        return {
            "items": [
                {
                    "name": f.parameter_name,
                    "value": f.value,
                    "interpretation": f.clinical_interpretation
                }
                for f in summary.clinical_summary.normal_readings
            ]
        }
