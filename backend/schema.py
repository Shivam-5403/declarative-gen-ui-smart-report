# from pydantic import BaseModel, Field
# from typing import List, Optional, Union, Dict, Any

# class Observation(BaseModel):
#     test_name: str
#     value: Optional[Union[float, str]] = None
#     unit: Optional[str] = None
#     interpretation: Optional[str] = None
#     test_notes: Optional[str] = None
#     extra_details: Optional[Dict[str, Any]] = None
#     is_panel: bool = False
#     members: Optional[List['Observation']] = []

# class SmartReportData(BaseModel):
#     patient_name: str
#     patient_id: str
#     reports: List[Observation]
#     global_remarks: Optional[str] = None


from pydantic import BaseModel, Field
from typing import List, Optional, Union, Dict, Any

# --- INPUT SCHEMA (Raw Lab Report) ---
class RecursiveMember(BaseModel):
    is_panel: bool = False
    test_name: str
    value: Optional[Union[float, str]] = None
    value_text: Optional[str] = None
    unit: Optional[str] = None
    reference_range: Optional[str] = None
    interpretation: Optional[str] = None
    test_notes: Optional[str] = None
    members: Optional[List['RecursiveMember']] = None

# Needed for self-referencing Pydantic models
RecursiveMember.model_rebuild()

class RawLabReport(BaseModel):
    patient_details: Dict[str, Any]
    lab_details: Dict[str, Any]
    sample_details: Dict[str, Any]
    report_results: List[RecursiveMember]
    global_remarks: Optional[str] = None

# --- OUTPUT SCHEMA (Smart Summary Structure) ---

class PatientInfo(BaseModel):
    name: Optional[str] = None
    age: Optional[Union[str, int]] = None
    gender: Optional[str] = None
    test_package_name: Optional[str] = None
    report_date: Optional[str] = None

class AbnormalReading(BaseModel):
    parameter_name: str
    value: str
    units: Optional[str] = None
    normal_range: Optional[str] = None
    status: str  # HIGH/LOW/ABNORMAL
    risk_level: str  # CRITICAL/HIGH/MODERATE/LOW
    system: Optional[str] = None
    causes: List[str]
    effects: List[str]
    clinical_note: str

class NormalReading(BaseModel):
    parameter_name: str
    value: str
    units: Optional[str] = None
    normal_range: Optional[str] = None
    clinical_interpretation: str

class OverallHealthStatus(BaseModel):
    risk_assessment: str  # Low/Moderate/High/Critical
    key_concerns: List[str]
    immediate_action_items: List[str]

class ClinicalSummary(BaseModel):
    abnormal_readings: List[AbnormalReading]
    normal_readings: List[NormalReading]
    overall_health_status: OverallHealthStatus

class FollowUpTest(BaseModel):
    timeline: str
    recommended_tests: str
    rationale: str

class LifestyleModification(BaseModel):
    category: str
    recommendations: str

class MedicationConsideration(BaseModel):
    condition: str
    supplements: Optional[str] = None
    interactions: Optional[str] = None

class ManagementPlan(BaseModel):
    follow_up_tests: List[FollowUpTest]
    lifestyle_modifications: List[LifestyleModification]
    medication_considerations: Optional[List[MedicationConsideration]] = []

class DetailedAnalysisItem(BaseModel):
    parameter: str
    interpretation: str
    correlation: Optional[str] = None
    severity: Optional[str] = None
    monitoring: Optional[str] = None

class SmartSummary(BaseModel):
    patient_info: Optional[PatientInfo] = None
    clinical_summary: ClinicalSummary
    management_plan: ManagementPlan
    detailed_analysis: Optional[List[DetailedAnalysisItem]] = []

# --- UI MANIFEST SCHEMA (Component Registry & Dynamic Rendering) ---

class ComponentVersion(BaseModel):
    """Tracks component versioning for breaking changes detection"""
    name: str
    version: str  # semantic versioning: v1.0.0
    deprecations: Optional[List[str]] = None

class InsightHeaderProps(BaseModel):
    """Props for InsightHeader component"""
    patient_info: Dict[str, Any]  # {name, age, gender, dob}
    risk_level: str
    overall_concerns: List[str]
    date: str

class CriticalAlertProps(BaseModel):
    """Props for CriticalAlert component"""
    findings: List[Dict[str, Any]]  # [{test_name, value, warning_text, status}]
    urgency_level: str

class MetricAccordionProps(BaseModel):
    """Props for MetricAccordion component"""
    parameter: str
    value: str
    reference_range: Optional[str] = None
    status: str
    causes: List[str]
    effects: List[str]
    clinical_note: str
    correlation: Optional[Dict[str, Any]] = None

class ReassuranceGridProps(BaseModel):
    """Props for ReassuranceGrid component"""
    items: List[Dict[str, Any]]  # [{name, value, interpretation}]

class ActionTimelineProps(BaseModel):
    """Props for ActionTimeline component"""
    events: List[Dict[str, Any]]  # [{time, test_name, rationale, priority}]

class GuidelineTableProps(BaseModel):
    """Props for GuidelineTable component"""
    headers: List[str]
    rows: List[Dict[str, Any]]
    type: str  # "lifestyle" or "medication"
    themeColor: Optional[str] = "blue"

class CorrelationMapProps(BaseModel):
    """Props for CorrelationMap component"""
    nodes: List[Dict[str, Any]]  # [{id, label, severity}]
    edges: List[Dict[str, Any]]  # [{source, target, relationship}]

class AbnormalCardProps(BaseModel):
    """Props for existing AbnormalCard component"""
    parameter: str
    value: str
    status: str
    causes: List[str]
    effects: List[str]
    clinical_note: str

class HealthScoreHeaderProps(BaseModel):
    """Props for existing HealthScoreHeader component"""
    risk_level: str
    concerns: List[str]

class FollowUpTableProps(BaseModel):
    """Props for existing FollowUpTable component"""
    rows: List[Dict[str, Any]]

class LifestyleTableProps(BaseModel):
    """Props for existing LifestyleTable component"""
    rows: List[Dict[str, Any]]

class MetricCardProps(BaseModel):
    """Props for existing MetricCard component"""
    label: str
    value: str
    unit: Optional[str] = None
    status: str
    advice: Optional[str] = None

class TrendChartProps(BaseModel):
    """Props for existing TrendChart component"""
    title: str
    data: List[Dict[str, Any]]

class SectionDividerProps(BaseModel):
    """Props for inline SectionDivider component"""
    title: str
    icon: Optional[str] = None

class NormalListProps(BaseModel):
    """Props for inline NormalList component"""
    items: List[Dict[str, Any]]

# Union type for flexible props validation
PropTypes = Union[
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
]

class UIManifestItem(BaseModel):
    """Individual component in the UI manifest"""
    id: str  # UUID
    type: str  # Component name
    version: str  # Component version
    props: Dict[str, Any]  # Component props (validated against PropSchema)
    rendering_hints: Optional[Dict[str, Any]] = None

class ValidationError(BaseModel):
    """Validation error details"""
    component_id: str
    component_type: str
    error_message: str
    severity: str  # "error" or "warning"

class UIManifest(BaseModel):
    """Complete UI manifest with metadata"""
    version: str  # Manifest schema version
    generated_at: str  # ISO datetime
    items: List[UIManifestItem]
    validation_errors: List[ValidationError] = []
    notes: Optional[str] = None

class ValidationResult(BaseModel):
    """Result of manifest validation"""
    is_valid: bool
    errors: List[str] = []
    warnings: List[str] = []