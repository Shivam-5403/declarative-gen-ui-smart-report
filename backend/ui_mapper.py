"""
UI MANIFEST GENERATOR - Coordinates the generation of dynamic UI manifests from SmartSummary data.

This module replaces the hardcoded UI mapper logic with a declarative, rules-based approach:
1. Takes SmartSummary (output from Summarizer agent)
2. Applies declarative rules from ui_rules.py
3. Generates UIManifest (array of {type, props} components)
4. Validates manifest against component schemas
5. Returns to frontend for rendering

Key design:
- Decouples data extraction (SmartSummary) from display logic (manifest generation)
- Enables adding new components without code changes (only rule config)
- Provides detailed error tracking for debugging
- Supports versioning and backward compatibility
"""

import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import ValidationError

from schema import SmartSummary, UIManifest, UIManifestItem, ValidationResult
from schema import ValidationError as UIValidationError
from components import COMPONENT_REGISTRY
from ui_rules import RulesEngine


class UIManifestGenerator:
    """
    Generates UI manifests from clinical summaries using declarative rules.
    
    Usage:
        generator = UIManifestGenerator()
        manifest = generator.generate_from_summary(smart_summary)
        validation = generator.validate_manifest(manifest)
    """
    
    def __init__(self):
        self.rules_engine = RulesEngine()
    
    def generate_from_summary(self, smart_summary: SmartSummary) -> UIManifest:
        """
        Generate a complete UI manifest from a SmartSummary.
        
        Args:
            smart_summary: Processed clinical summary with abnormal/normal findings
        
        Returns:
            UIManifest: Generated manifest with component sequence and props
        """
        
        items: List[UIManifestItem] = []
        
        # Stage 1: Apply rules to determine component sequence
        component_specs = self.rules_engine.apply_rules(smart_summary)
        
        # Stage 2: Convert component specs to UIManifestItems with full props
        for spec in component_specs:
            item = self._create_manifest_item(spec, smart_summary)
            items.append(item)
        
        # Stage 3: Create manifest with metadata
        manifest = UIManifest(
            version="1.0.0",
            generated_at=datetime.utcnow().isoformat(),
            items=items,
            validation_errors=[],
        )
        
        return manifest
    
    def _create_manifest_item(self, spec: Dict[str, Any], smart_summary: SmartSummary) -> UIManifestItem:
        """
        Convert a component specification into a UIManifestItem with props.
        
        Args:
            spec: Component specification from rules engine
                {type: str, props_generator: callable}
            smart_summary: Full summary for context
        
        Returns:
            UIManifestItem: Complete item with ID, type, version, props
        """
        
        component_type = spec["type"]
        component_def = COMPONENT_REGISTRY.get(component_type)
        
        if not component_def:
            raise ValueError(f"Unknown component type: {component_type}")
        
        # Generate props using the spec's props_generator function
        props_generator = spec.get("props_generator")
        if props_generator:
            props = props_generator(smart_summary)
        else:
            props = {}
        
        # Get rendering hints from component definition
        rendering_hints = component_def.rendering_hints.copy()
        
        # Create manifest item
        item = UIManifestItem(
            id=str(uuid.uuid4()),
            type=component_type,
            version=component_def.version,
            props=props,
            rendering_hints=rendering_hints,
        )
        
        return item
    
    def validate_manifest(self, manifest: UIManifest) -> ValidationResult:
        """
        Validate a generated manifest against component schemas.
        
        Checks:
        - All component types exist in registry
        - All props match component's Pydantic model
        - Required fields are present
        
        Args:
            manifest: UIManifest to validate
        
        Returns:
            ValidationResult: is_valid flag + error list
        """
        
        errors = []
        warnings = []
        
        for item in manifest.items:
            # Check component exists
            component_def = COMPONENT_REGISTRY.get(item.type)
            if not component_def:
                errors.append(f"Unknown component type: {item.type}")
                continue
            
            # Check version matches (warning if different)
            if item.version != component_def.version:
                warnings.append(
                    f"Component {item.type} version mismatch: "
                    f"manifest has {item.version}, current is {component_def.version}"
                )
            
            # Validate props against component's Pydantic model
            try:
                component_def.props_model(**item.props)
            except Exception as e:
                errors.append(
                    f"Invalid props for component {item.type} (id={item.id}): {str(e)}"
                )
        
        is_valid = len(errors) == 0
        return ValidationResult(is_valid=is_valid, errors=errors, warnings=warnings)
    
    def generate_and_validate(self, smart_summary: SmartSummary) -> tuple[UIManifest, ValidationResult]:
        """
        Generate manifest and validate in one call.
        
        Returns:
            Tuple of (UIManifest, ValidationResult)
        
        Raises:
            ValueError if validation fails
        """
        
        manifest = self.generate_from_summary(smart_summary)
        validation = self.validate_manifest(manifest)
        
        if not validation.is_valid:
            manifest.validation_errors = [
                {"severity": "error", "message": err} for err in validation.errors
            ]
        
        return manifest, validation
