import json
import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from schema import SmartSummary
from schema import SmartSummary
from ui_mapper import UIManifestGenerator

# Sample JSON matching the new schema
SAMPLE_JSON = {
  "patient_info": {
     "age": 45,
     "gender": "Male",
     "test_package_name": "Comprehensive Metabolic Panel",
     "report_date": "2023-10-27"
  },
  "clinical_summary": {
    "abnormal_readings": [
      {
        "parameter_name": "HbA1c",
        "value": "8.2%",
        "units": "%",
        "normal_range": "< 5.7%",
        "status": "HIGH",
        "risk_level": "CRITICAL",
        "system": "Metabolic",
        "causes": ["Type 2 Diabetes", "Insulin resistance"],
        "effects": ["Cardiovascular risk", "Nephropathy"],
        "clinical_note": "Poor glycemic control."
      },
      {
        "parameter_name": "Triglycerides",
        "value": "210",
        "units": "mg/dL",
        "normal_range": "< 150",
        "status": "HIGH",
        "risk_level": "HIGH",
        "system": "Metabolic",
        "causes": ["Diet", "Genetics"],
        "effects": ["Pancreatitis risk"],
        "clinical_note": "Elevated triglycerides."
      }
    ],
    "normal_readings": [
      {
        "parameter_name": "TSH",
        "value": "2.1",
        "units": "mIU/L",
        "normal_range": "0.4-4.0",
        "clinical_interpretation": "Normal thyroid function"
      }
    ],
    "overall_health_status": {
      "risk_assessment": "Critical",
      "key_concerns": ["Uncontrolled Diabetes", "Dyslipidemia"],
      "immediate_action_items": ["Consult Endocrinologist"]
    }
  },
  "management_plan": {
    "follow_up_tests": [
       { "timeline": "Immediate", "recommended_tests": "Repeat Glucose", "rationale": "Confirm hyperglycemia" }
    ],
    "lifestyle_modifications": [
       { "category": "Diet", "recommendations": "Low carb diet" }
    ],
    "medication_considerations": []
  },
  "detailed_analysis": []
}

def verify():
    print("--- Verifying Schema Update ---")
    
    # 1. Test Pydantic Model Validation
    try:
        print("Validating Pydantic Model...", end=" ")
        summary = SmartSummary(**SAMPLE_JSON)
        print("✅ Success")
    except Exception as e:
        print(f"❌ Failed: {e}")
        return

    # 2. Test Manifest Generation
    try:
        print("Generating UI Manifest...", end=" ")
        generator = UIManifestGenerator()
        manifest = generator.generate_from_summary(summary)
        print(f"✅ Success. Generated {len(manifest.items)} items.")
        
        # Verify critical alert is present
        has_critical = any(item.type == 'CriticalAlert' for item in manifest.items)
        if has_critical:
            print("  - CriticalAlert component found: ✅")
        else:
            print("  - CriticalAlert component found: ❌ (Expected, but missing)")
            
        # Verify abnormal section
        has_abnormal = any(item.props.get('title') == "⚠️ Findings Requiring Attention" for item in manifest.items if item.type == 'SectionDivider')
        if has_abnormal:
             print("  - Abnormal Section Header found: ✅")
        
        # Verify props are correctly populated
        critical_item = next((item for item in manifest.items if item.type == 'CriticalAlert'), None)
        if critical_item:
            findings = critical_item.props.get('findings', [])
            if len(findings) > 0 and findings[0]['test_name'] == "HbA1c":
                 print("  - CriticalAlert props mapped correctly: ✅")
            else:
                 print(f"  - CriticalAlert props mismatch: {findings}")

    except Exception as e:
        print(f"❌ Manifest Generation Failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    verify()
