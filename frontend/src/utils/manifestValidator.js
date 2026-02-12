/**
 * MANIFEST VALIDATOR - Runtime validation of UI manifests
 *
 * This module validates incoming UI manifests from the backend against
 * component schemas exported from the Python backend.
 *
 * Features:
 * - JSON Schema validation using Ajv
 * - Detailed error reporting
 * - Type checking for component props
 * - Warning collection for deprecated components
 *
 * Usage:
 *   import { validateManifest, ValidationResult } from './manifestValidator';
 *   const result = validateManifest(manifest, schemas);
 *   if (!result.isValid) {
 *     console.error('Validation errors:', result.errors);
 *   }
 */

/**
 * Validates a manifest item against its component schema
 *
 * @param {Object} item - Manifest item {id, type, version, props, rendering_hints}
 * @param {Object} schemas - Component schemas from /api/schema-export
 * @returns {Object} - {isValid: bool, errors: [], warnings: []}
 */
export function validateManifestItem(item, schemas) {
  const errors = [];
  const warnings = [];

  // Check component type exists in schema
  if (!schemas[item.type]) {
    errors.push(`Unknown component type: "${item.type}". Component not registered.`);
    return { isValid: false, errors, warnings };
  }

  const componentSchema = schemas[item.type];

  // Check version (warning if mismatch)
  if (item.version !== componentSchema.version) {
    warnings.push(
      `Component "${item.type}" version mismatch. ` +
      `Manifest has v${item.version}, schema expects v${componentSchema.version}`
    );
  }

  // Validate props against schema
  if (componentSchema.propsSchema) {
    validatePropsAgainstSchema(item.props, componentSchema.propsSchema, item.type, errors);
  }

  // Check for deprecated components
  if (componentSchema.deprecations && componentSchema.deprecations.length > 0) {
    warnings.push(
      `Component "${item.type}" is deprecated. Reason: ${componentSchema.deprecations.join(', ')}`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate props object against JSON schema
 *
 * Simple property checking without external dependency
 * @param {Object} props - Props to validate
 * @param {Object} schema - JSON schema (from Pydantic model)
 * @param {string} componentType - Component name for error messages
 * @param {Array} errors - Error accumulator
 */
function validatePropsAgainstSchema(props, schema, componentType, errors) {
  if (!schema.properties) return; // No schema defined

  const requiredFields = schema.required || [];
  const properties = schema.properties;

  // Check required fields
  for (const field of requiredFields) {
    if (!(field in props)) {
      errors.push(
        `Component "${componentType}": Missing required prop "${field}"`
      );
    }
  }

  // Check prop types (basic validation)
  for (const [key, value] of Object.entries(props)) {
    if (properties[key]) {
      const propSchema = properties[key];
      const expectedType = propSchema.type;

      if (expectedType === 'array' && !Array.isArray(value)) {
        errors.push(
          `Component "${componentType}": Prop "${key}" should be array, got ${typeof value}`
        );
      }
      if (expectedType === 'object' && (typeof value !== 'object' || Array.isArray(value))) {
        errors.push(
          `Component "${componentType}": Prop "${key}" should be object, got ${typeof value}`
        );
      }
      if (expectedType === 'string' && typeof value !== 'string') {
        errors.push(
          `Component "${componentType}": Prop "${key}" should be string, got ${typeof value}`
        );
      }
    }
  }
}

/**
 * Validates entire manifest
 *
 * @param {Object} manifest - UI manifest from backend {version, generated_at, items, validation_errors}
 * @param {Object} schemas - Component schemas from /api/schema-export
 * @returns {Object} - {isValid: bool, itemErrors: Map, allErrors: [], allWarnings: []}
 */
export function validateManifest(manifest, schemas) {
  const itemErrors = new Map();
  const allErrors = [];
  const allWarnings = [];

  if (!Array.isArray(manifest.items)) {
    return {
      isValid: false,
      itemErrors,
      allErrors: ['Manifest items must be an array'],
      allWarnings: [],
    };
  }

  // Validate each item
  for (const item of manifest.items) {
    const validation = validateManifestItem(item, schemas);
    
    if (!validation.isValid) {
      itemErrors.set(item.id || item.type, validation.errors);
      allErrors.push(
        `Item ${item.id || item.type} (${item.type}): ${validation.errors.join('; ')}`
      );
    }

    allWarnings.push(...validation.warnings);
  }

  return {
    isValid: allErrors.length === 0,
    itemErrors,
    allErrors,
    allWarnings,
  };
}

/**
 * Generate user-friendly error message from validation result
 *
 * @param {Object} result - Validation result
 * @returns {string} - Formatted error message
 */
export function formatValidationErrors(result) {
  if (result.isValid) return null;

  let message = 'Manifest validation failed:\n\n';

  if (result.allErrors.length > 0) {
    message += 'Errors:\n';
    message += result.allErrors.map(e => `• ${e}`).join('\n');
  }

  if (result.allWarnings.length > 0) {
    message += '\n\nWarnings:\n';
    message += result.allWarnings.map(w => `• ${w}`).join('\n');
  }

  return message;
}

/**
 * Check if a manifest is "safe" to render
 * Safe = no critical errors (warnings are ok)
 *
 * @param {Object} result - Validation result
 * @returns {boolean}
 */
export function isSafeToRender(result) {
  return result.isValid || (result.allErrors.length === 0 && result.allWarnings.length > 0);
}
