# Quick Reference Guide

## Component Props Reference

### 1. InsightHeader
```jsx
<InsightHeader
  patient_info={{name: "John Doe", age: 45, gender: "Male"}}
  risk_level="High"  // "Low" | "Moderate" | "High" | "Critical"
  overall_concerns={["Uncontrolled diabetes", "Dyslipidemia"]}
  date="2025-02-12"
/>
```

### 2. CriticalAlert
```jsx
<CriticalAlert
  findings={[
    {test_name: "Glucose", value: "250 mg/dL", warning_text: "Dangerously high", status: "CRITICAL"},
    {test_name: "Potassium", value: "6.8 mmol/L", warning_text: "Hyperkalemia risk", status: "CRITICAL"}
  ]}
  urgency_level="CRITICAL"
/>
```

### 3. MetricAccordion
```jsx
<MetricAccordion
  parameter="HbA1c"
  value="8.2%"
  reference_range="< 5.7%"
  status="HIGH"  // "CRITICAL" | "HIGH" | "LOW"
  causes={["Insulin resistance", "Poor dietary control"]}
  effects={["Cardiovascular risk", "Nephropathy risk"]}
  clinical_note="Poorly controlled glycemia. Correlates with elevated glucose."
  correlation={{related_findings: ["Glucose", "Triglycerides"], pattern: "Metabolic"}}
/>
```

### 4. ReassuranceGrid
```jsx
<ReassuranceGrid
  items={[
    {name: "TSH", value: "2.1 mIU/L", interpretation: "Normal thyroid function"},
    {name: "Hemoglobin", value: "14.5 g/dL", interpretation: "Healthy oxygen capacity"}
  ]}
/>
```

### 5. ActionTimeline
```jsx
<ActionTimeline
  events={[
    {time: "Immediate (1 week)", test_name: "Fasting Glucose", rationale: "Urgent metabolic assessment", priority: "high"},
    {time: "1 Month", test_name: "HbA1c Repeat", rationale: "Therapy effectiveness", priority: "normal"},
    {time: "3 Months", test_name: "Lipid Panel", rationale: "Cardiovascular risk update", priority: "normal"}
  ]}
/>
```

### 6. GuidelineTable
```jsx
<GuidelineTable
  type="lifestyle"  // "lifestyle" | "medication"
  themeColor="green"  // "green" | "blue" | "yellow"
  headers={["Category", "Recommendation"]}
  rows={[
    {category: "Diet", recommendation: "Low glycemic index diet, reduce refined carbs"},
    {category: "Exercise", recommendation: "Aerobic 150 min/week + resistance 2x/week"}
  ]}
/>
```

### 7. CorrelationMap
```jsx
<CorrelationMap
  nodes={[
    {id: "glucose", label: "Glucose", severity: "HIGH"},
    {id: "hba1c", label: "HbA1c", severity: "HIGH"},
    {id: "insulin", label: "Insulin", severity: "HIGH"}
  ]}
  edges={[
    {source: "glucose", target: "hba1c", relationship: "direct_correlation"},
    {source: "glucose", target: "insulin", relationship: "feedback_loop"}
  ]}
/>
```

## Rules Engine Reference

### Rule Structure
```python
Rule(
    name="unique_rule_name",
    condition=lambda s: <boolean check on SmartSummary>,
    priority=<int 0-100>,  # Higher = evaluated first
    actions=[
        Action("prepend", "ComponentName", props_generator_func),
        Action("append", "ComponentName", props_generator_func)
    ]
)
```

### Available Rules (Priority Order)
1. **critical_alert_prepend** (100) - If any finding is CRITICAL
2. **high_risk_insight_header** (90) - If risk_level is High/Critical
3. **render_abnormal_findings** (80) - If abnormal_findings exist
4. **group_lipid_panel** (70) - If > 2 lipid-related findings
5. **group_metabolic_findings** (65) - If > 3 metabolic findings
6. **render_action_timeline** (60) - If follow_up_plan exists
7. **render_lifestyle_guidelines** (55) - If lifestyle_modifications exist
8. **render_reassurance** (50) - If normal_findings exist
9. **low_risk_lead_with_reassurance** (40) - If risk_level is Low

### Props Generators
```python
def _props_critical_alert(self, summary: SmartSummary) -> Dict:
    critical_findings = [f for f in summary.abnormal_findings if f.status == "CRITICAL"]
    return {
        "findings": [
            {"test_name": f.parameter, "value": f.value, ...}
            for f in critical_findings
        ],
        "urgency_level": "CRITICAL"
    }
```

## Frontend Integration

### 1. Initialize Registry
```jsx
useEffect(() => {
  const initRegistry = async () => {
    const registry = await initializeComponentRegistry('http://localhost:8000');
    setComponentMap(registry.componentMap);
    setSchemas(registry.schemas);
  };
  initRegistry();
}, []);
```

### 2. Validate Manifest
```jsx
const validation = validateManifest(manifest, schemas);
if (!validation.isValid && !isSafeToRender(validation)) {
  console.error('Validation failed:', validation.errors);
}
```

### 3. Render Dynamic Components
```jsx
{manifest.items.map((item, index) => {
  const Component = componentMap[item.type];
  return <Component key={item.id || index} {...item.props} />;
})}
```

## Backend Integration

### Call /analyze Endpoint
```python
import requests

response = requests.post(
    'http://localhost:8000/analyze',
    json={
        "patient_details": {"name": "John", "age": "45", "gender": "Male"},
        "report_results": [
            {"test_name": "Glucose", "value": 110, "unit": "mg/dL"},
            ...
        ]
    }
)

manifest = response.json()['ui_manifest']
```

### Fetch Schemas
```python
import requests

schemas = requests.get('http://localhost:8000/api/schema-export').json()
for component_name, schema in schemas.items():
    print(f"{component_name} v{schema['version']}")
```

## SmartSummary Output Format (from LLM)

```json
{
  "abnormal_findings": [
    {
      "parameter": "HbA1c",
      "value": "8.2%",
      "status": "HIGH",
      "causes": ["Insulin resistance", "Poor dietary control"],
      "effects": ["Cardiovascular risk", "Nephropathy risk"],
      "clinical_note": "Poorly controlled glycemia",
      "correlation": {
        "related_findings": ["Glucose", "Triglycerides"],
        "pattern": "Metabolic pattern",
        "evidence": "..."
      }
    }
  ],
  "normal_findings": [
    {
      "parameter": "TSH",
      "value": "2.1 mIU/L",
      "clinical_interpretation": "Normal thyroid"
    }
  ],
  "overall_assessment": {
    "risk_level": "High",
    "key_concerns": ["Uncontrolled diabetes", "Dyslipidemia"],
    "immediate_actions": ["Consider escalation", "Start statin"]
  },
  "follow_up_plan": [
    {
      "timeline": "Immediate (1-2 weeks)",
      "test_name": "Repeat Fasting Glucose",
      "rationale": "Urgent metabolic reassessment"
    }
  ],
  "lifestyle_modifications": [
    {
      "category": "Diet",
      "recommendation": "Low glycemic index diet"
    }
  ]
}
```

## Common Integration Patterns

### Pattern 1: Backend-to-Frontend Data Flow
```
RawLabReport → SmartSummary (LLM) → UIManifest (Rules) → Components (React)
```

### Pattern 2: Adding a New Component
1. Define Pydantic model in `backend/schema.py`
2. Create ComponentDefinition in `backend/components.py`
3. Add props generator in `backend/ui_rules.py`
4. Create React component in `frontend/src/components/`
5. Add to componentRegistry.js imports
6. Optional: Add rule to ui_rules.py

### Pattern 3: Custom Rule
```python
Rule(
    name="my_custom_rule",
    condition=lambda s: some_condition(s),
    priority=75,
    actions=[
        Action("append", "CustomComponent", lambda s: {"key": s.value})
    ]
)
```

## Debugging Tips

### Backend Debugging
```bash
# Check Gemini API key
echo $GOOGLE_API_KEY

# Test endpoint directly
curl -X POST http://localhost:8000/analyze \
  -H "Content-Type: application/json" \
  -d '{"patient_details":{...}, "report_results":[...]}'

# Check logs
tail -f backend.log
```

### Frontend Debugging
```javascript
// Enable verbose logging
localStorage.setItem('DEBUG_MANIFEST', 'true');

// Check component registry
console.log(componentMap);

// Validate manifest
console.log(validateManifest(manifest, schemas));

// Check component props
console.log(manifest.items[0]);
```

### Common Issues

**Issue**: "Unknown component: ComponentName"
- Check: Is component in componentRegistry.js imports?
- Check: Does `/api/schema-export` include the component?

**Issue**: Props validation failing
- Check: Props match the Pydantic model in schema.py?
- Check: Are all required fields present?

**Issue**: Rules not triggering
- Check: Does condition match the summary data?
- Check: Is priority high enough?
- Check: Are previous prepend rules blocking it?

---

Last Updated: February 12, 2025
Implementation Status: COMPLETE ✅
