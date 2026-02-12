# Plan: Production-Ready Declarative Gen UI Implementation

## TL;DR
Transform your prototype's hardcoded UI mapping into a production-grade declarative system. Phase 1 restructures the folder layout and creates an authoritative component registry with Pydantic models. Phase 2 replaces hardcoded UI mapper with a rules-based engine that dynamically generates UI manifests. Phase 3 adds enhanced Master Prompt with clinical correlation logic. Phase 4 implements the 7 new specialized components. Full end-to-end type safety (JSDoc frontend, Pydantic backend), semantic versioning for components, and zero breaking changes to existing data flow.

---

## PHASE 0: Production Folder Restructuring

**Goal:** Establish maintainable, scalable directory layout.

**Steps:**

### 1. Backend Structure [backend/]
- `backend/agents.py` - Keep, will refactor
- `backend/main.py` - Keep, will enhance
- `backend/schema.py` - Expand with UI contract models
- `backend/prompts.py` - Will add enhanced Master Prompt
- **NEW** `backend/components.py` - Replace docs with authoritative component registry (Pydantic models)
- **NEW** `backend/ui_mapper.py` - Extract UI mapping logic into dedicated module with rules engine
- **NEW** `backend/ui_rules.py` - Declarative rules for manifest generation (severity thresholds, grouping logic, tone adaptation)

### 2. Frontend Structure [frontend/src/]
- `frontend/src/components/` - Existing components stay, add 7 new ones
- **NEW** `frontend/src/types/components.ts` - JSDoc type definitions imported from /api/schema-export
- **NEW** `frontend/src/config/componentRegistry.js` - Import component Pydantic schemas, auto-generate componentMap at runtime
- **NEW** `frontend/src/utils/manifestValidator.js` - Runtime validation via JSON Schema
- `frontend/src/App.jsx` - Refactor to use auto-generated componentMap

### 3. API Contract Export
- Add new FastAPI endpoint: `/api/schema-export` (returns JSON Schemas + TypeScript type definitions for all components)
- Allows frontend to auto-discover component props at runtime

---

## PHASE 1: Backend Component Registry & Type Safety

**Goal:** Create authoritative, versioned component definitions with validation.

**Steps:**

### 1. Expand [backend/schema.py]

Keep existing `SmartSummary`, `AbnormalFinding`, etc. models.

**Add new models:**
- `ComponentVersion` - {name: str, version: str, deprecations: []}
- `PropSchema` - Pydantic model for each component's expected props
- `UIManifestItem` - {id: UUID, type: str, version: str, props: dict, rendering_hints: dict}
- `UIManifest` - Root manifest with metadata: {version: str, generated_at: datetime, items: UIManifestItem[], validation_errors: []}

**Specific prop classes:**
- `InsightHeaderProps` - {patient_info: dict, risk_level, date}
- `CriticalAlertProps` - {findings: CriticalFinding[]}
- `MetricAccordionProps` - {parameter, value, causes[], effects[]}
- `ReassuranceGridProps` - {items: {name, value, interpretation}[]}
- `ActionTimelineProps` - {events: {time, test, why}[]}
- `GuidelineTableProps` - {headers[], rows[], themeColor}
- `CorrelationMapProps` - {nodes: {source, target, explanation}[], edges: []}
- (+ existing 6 components adapted to this schema)

### 2. Rewrite [backend/components.py]

Replace docs with Pydantic registry:

```python
COMPONENT_REGISTRY = {
  "InsightHeader": ComponentDefinition(
    name="InsightHeader",
    version="1.0.0",
    display_name="Patient Insight & Risk Badge",
    props_model=InsightHeaderProps,
    rendering_hints={"position": "top", "width": "full", "severity_triggers": ["CRITICAL", "HIGH"]},
    description="...",
    visual_role="Displays patient info & overall risk badge"
  ),
  "CriticalAlert": {...},
  "MetricAccordion": {...},
  ...
}
```

Export as Pydantic JSON schema (used by frontend + validation).

### 3. Create [backend/ui_mapper.py] (NEW module)

Replace hardcoded mapper logic from `agents.py` (lines 67-90).

**Implement** `class UIManifestGenerator`:
- Method: `generate_from_summary(smart_summary: SmartSummary) -> UIManifest`
- Method: `validate_manifest(manifest: UIManifest) -> ValidationResult`
- Internal: Calls rules engine (next step)

### 4. Create [backend/ui_rules.py] (NEW module)

Declarative rules (not hardcoded if/else):

```python
MANIFEST_RULES = [
  Rule(
    name="critical_alert_priority",
    condition=lambda summary: any(f.status == "CRITICAL" for f in summary.abnormal_findings),
    actions=[
      Action(type="prepend", component="CriticalAlert", 
             props=lambda s: {findings: [f for f in s.abnormal_findings if f.status == "CRITICAL"]})
    ]
  ),
  Rule(
    name="risk_high_tone",
    condition=lambda s: s.overall_assessment.risk_level in ["High", "Critical"],
    actions=[
      Action(type="prepend", component="InsightHeader", ...),
      Action(type="after_abnormal", component="ActionTimeline", ...)
    ]
  ),
  Rule(
    name="group_lipid_studies",
    condition=lambda s: len([f for f in s.abnormal_findings if "Lipid" in f.parameter]) > 3,
    actions=[Rule(type="merge", component="MetricAccordion", ...)]
  ),
  ...
]
```

---

## PHASE 2: Enhanced Master Prompt & Agent Improvements

**Goal:** Implement clinical correlation logic and fix Summarizer agent.

**Steps:**

### 1. Enhance [backend/prompts.py]

Add below context to MASTER_PROMPT with append at last:

```
### SYSTEM ROLE: Clinical Synthesis Specialist (Agent 1)
You are a Clinical Data Analyst specializing in diagnostic correlations.

### INPUT: Raw diagnostic lab report (JSON/text)

### ENHANCED ANALYSIS REQUIREMENTS:
1. Biological Systems Grouping: Group abnormal findings by system (Metabolic, Hematological, Renal, Cardiac, etc.)
2. Pathophysiological Correlation: Link related findings (e.g., high HbA1c + high glucose = diabetes pattern)
3. Reference Range Normalization: Standardize values to [low/normal/high] interpretation
4. Trend Sensitivity: If historical data exists, note direction (Improving/Worsening/Stable)
5. Causality Analysis: For each abnormal finding, list likely causes AND downstream effects

### OUTPUT FORMAT (STRICT JSON):
{
  "abnormal_findings": [
    {
      "parameter": "HbA1c",
      "value": "8.2%",
      "reference_range": "< 5.7%",
      "status": "HIGH",
      "interpretation": "Above target",
      "causes": ["Type 2 Diabetes", "Pre-diabetes", "Insulin resistance"],
      "effects": ["Increased cardiovascular risk", "Nephropathy risk"],
      "clinical_note": "Poorly controlled glycemia. Correlates with elevated glucose.",
      "correlation": {
        "related_findings": ["Glucose", "Triglycerides"],
        "pattern": "Metabolic disorder pattern",
        "evidence": "HbA1c + Glucose both elevated → metabolic syndrome risk"
      },
      "trend": "Worsening" (if historical available)
    }
  ],
  ...
}
```

### 2. Refactor [backend/agents.py]

Update Summarizer node to use new enhanced prompt.

**Replace UI Mapper node** with new rules-based engine:

```python
async def ui_mapper_node(state: AgentState):
    from ui_mapper import UIManifestGenerator
    generator = UIManifestGenerator()
    manifest = generator.generate_from_summary(state["smart_summary"])
    validation = generator.validate_manifest(manifest)
    
    if not validation.is_valid:
        raise ValueError(f"Manifest validation failed: {validation.errors}")
    
    return {"ui_manifest": manifest}
```

---

## PHASE 3: Frontend Component Registry & Runtime Loading

**Goal:** Auto-discover components, eliminate hardcoded componentMap.

**Steps:**

### 1. Create [frontend/src/config/componentRegistry.js]

Fetch component schemas from `/api/schema-export` on app startup.

Build componentMap dynamically:

```javascript
const componentRegistry = await fetch('/api/schema-export').then(r => r.json());
export const componentMap = Object.entries(componentRegistry).reduce((acc, [name, schema]) => {
  acc[name] = require(`../components/${name}.jsx`).default;
  return acc;
}, {});
```

### 2. Create [frontend/src/utils/manifestValidator.js]

Import Ajv library for JSON Schema validation.

Validate incoming manifest against schemas:

```javascript
export function validateManifest(manifest, schemas) {
  for (const item of manifest) {
    const schema = schemas[item.type];
    if (!schema) throw new Error(`Unknown component: ${item.type}`);
    ajv.validate(schema.propsSchema, item.props);
  }
}
```

### 3. Refactor [frontend/src/App.jsx]

Replace hardcoded componentMap.

Import from componentRegistry.

Add validateManifest() call before rendering:

```javascript
useEffect(() => {
  fetchManifest()
    .then(manifest => {
      validateManifest(manifest, componentSchemas);
      setManifest(manifest);
    })
    .catch(err => setError(err));
}, []);
```

---

## PHASE 4: Build Specialized Component Library (7 New Components)

**Goal:** Implement specialized medical visualization components.

**Steps:**

### 1. Create [frontend/src/components/InsightHeader.jsx]

- Props: `{patient_info: {name, age, gender, dob}, risk_level, overall_concerns[], date}`
- Displays: Patient demographics + large risk badge (color-coded by severity)
- Integrates: Lucide icons for risk indicators

### 2. Create [frontend/src/components/CriticalAlert.jsx]

- Props: `{findings: [{test_name, value, warning_text, status}], urgency_level}`
- Displays: Full-width red banner with critical finding(s)
- Behavior: Non-dismissible, permanent at top
- Styling: Tailwind red-600/700 with bold typography

### 3. Create [frontend/src/components/MetricAccordion.jsx]

- Props: `{parameter, value, reference_range, status, causes[], effects[], clinical_note, correlation}`
- Displays: Expandable card that reveals causes/effects/correlation on click
- Styling: Icon + color badges by status (CRITICAL=red, HIGH=orange, LOW=blue)

### 4. Create [frontend/src/components/ReassuranceGrid.jsx]

- Props: `{items: [{name, value, interpretation}]}`
- Displays: 2-3 column grid of normal findings with green checkmarks
- Styling: Light green background, reassuring tone (e.g., "✓ All Good")

### 5. Create [frontend/src/components/ActionTimeline.jsx]

- Props: `{events: [{time, test_name, rationale, priority}]}`
- Displays: Vertical timeline of follow-up tests with dates
- Styling: Recharts Timeline or custom CSS with milestones
- Interactivity: Hover to reveal rationale

### 6. Create [frontend/src/components/GuidelineTable.jsx]

- Props: `{headers: [], rows: [], type: "lifestyle"|"medication", themeColor}`
- Displays: Clean, scannable table for recommendations
- Features: Striped rows, hover effects, icon badges by category

### 7. Create [frontend/src/components/CorrelationMap.jsx]

- Props: `{nodes: [{id, label, severity}], edges: [{source, target, relationship}]}`
- Displays: Force-directed graph linking related parameters (e.g., HbA1c → Glucose → Insulin)
- Library: React-Force-Graph or D3.js wrapper
- Styling: Color nodes by severity, animate edge hover

---

## PHASE 5: Enhanced UI Mapper Logic (Rules Engine)

**Goal:** Replace hardcoded manifest generation with declarative rules.

**Steps:**

### Rule Categories

#### a. Severity Rules:
- If ANY finding = CRITICAL → prepend `CriticalAlert` component
- If risk_level = "High" or "Critical" → prepend `InsightHeader` + lead with `MetricAccordion`
- If risk_level = "Low" → lead with `ReassuranceGrid`

#### b. Grouping Rules:
- If abnormal_findings count > 5 → group by system (Metabolic, Hematological, etc.) into single `MetricAccordion`
- If >3 Lipid panel findings → merge into one accordion entry
- If follow_up_plan.length > 0 → always render `ActionTimeline`

#### c. Tone Adaptation Rules:
- If risk_level = "Low" → use cheerful language, prioritize `ReassuranceGrid`
- If risk_level = "Critical" → urgent language, suppress non-critical details

#### d. Conditional Rendering:
- If normal_findings exist → render `ReassuranceGrid` at end with "Good News" divider
- If correlation data exists → render `CorrelationMap` between abnormal sections
- If lifestyle_modifications exist → render `GuidelineTable` (type="lifestyle")

### Test rule engine with parametric test cases:
- Test case: CRITICAL finding_present → verify CriticalAlert prepended
- Test case: Multiple lipid findings → verify MetricAccordion grouping
- Test case: Low risk → verify ReassuranceGrid leads

---

## PHASE 6: API Contract Export & Type Safety

**Goal:** Enable frontend to auto-discover types + enable IDE support.

**Steps:**

### 1. Add new endpoint to [backend/main.py]

```python
@app.get("/api/schema-export")
def export_schemas():
    """Export component registry as JSON Schema + TypeScript types"""
    from components import COMPONENT_REGISTRY
    from pydantic.json_schema import models_json_schema
    
    schemas = {}
    for name, component_def in COMPONENT_REGISTRY.items():
        schemas[name] = {
            "componentName": name,
            "version": component_def.version,
            "propsSchema": component_def.props_model.model_json_schema(),
            "renderingHints": component_def.rendering_hints
        }
    return schemas
```

### 2. Generate TypeScript types (optional enhancement)

Frontend can run: `npm run generate-types` to pull schemas and generate `.d.ts` files.

Enables VSCode autocomplete in `.jsx` files via JSDoc.

---

## PHASE 7: Data Validation & Error Handling

**Goal:** Ensure manifest completeness and catch bugs early.

**Steps:**

### 1. Add validation layer in [backend/ui_mapper.py]

```python
def validate_manifest(manifest: UIManifest) -> ValidationResult:
    errors = []
    for item in manifest.items:
        if item.type not in COMPONENT_REGISTRY:
            errors.append(f"Unknown component: {item.type}")
        component_def = COMPONENT_REGISTRY[item.type]
        try:
            component_def.props_model(**item.props)
        except ValidationError as e:
            errors.append(f"Invalid props for {item.type}: {e}")
    return ValidationResult(is_valid=len(errors)==0, errors=errors)
```

### 2. Frontend validation in [frontend/src/App.jsx]

- Catch and display validation errors to user
- Log errors to console for debugging
- Fallback UI if manifest invalid

---

## PHASE 8: Backward Compatibility & Migration

**Goal:** Ensure zero breaking changes during rollout.

**Steps:**

### 1. Version existing components:
- AbnormalCard v1.0.0
- HealthScoreHeader v1.0.0
- etc.

### 2. API versioning:
- `/analyze` endpoint becomes `/v1/analyze`
- New endpoint with rules-based mapper: `/v2/analyze`
- Frontend can be configured to use v1 or v2 via env var

### 3. Gradual rollout:
- Deploy new components, keep both endpoints alive
- Test v2 with staging environment
- Switch prod traffic when confident

---

## Verification

**After each phase:**

1. Run `pytest backend/` for schema validation tests
2. Manual UI test: submit test lab report, verify manifest structure matches schema
3. Frontend test: componentMap successfully loads all 13 components
4. Manifest validator catches intentionally-broken props (e.g., missing required fields)

**End-to-end integration test:**
- Submit raw lab report to `/v2/analyze`
- Verify 7-step manifest generated (no hardcoded fallbacks)
- Render in frontend, verify no console errors
- Check TypeScript autocomplete in VSCode (if JSDoc types generated)

**Performance validation:**
- Measure LLM response time (should be <2s with caching)
- Measure manifest generation time (<100ms)
- Measure UI render time (<200ms)

---

## Decisions Made

- **Folder location:** Component registry stays in `backend/` for easier LLM access
- **Type system:** JSDoc in .jsx files with optional TypeScript schema export (no build setup changes required)
- **Scope:** All 13 components built together with semantic versioning for future extensibility
- **Backward compatibility:** Dual endpoints (v1 hardcoded, v2 rules-based) to enable gradual migration
- **Validation:** Pydantic on backend + JSON Schema on frontend for defense-in-depth
