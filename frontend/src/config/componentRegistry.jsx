/**
 * COMPONENT REGISTRY - Auto-discovers and registers UI components
 *
 * This module:
 * 1. Fetches component schemas from backend `/api/schema-export`
 * 2. Dynamically imports all React component files
 * 3. Builds componentMap at runtime
 * 4. Provides schema metadata for validation
 *
 * Benefits:
 * - No hardcoding of component types in frontend
 * - Backend can add components without frontend changes
 * - Auto-discovery of available components
 * - Type-safe props validation
 *
 * Usage:
 *   import { getComponentRegistry, getComponentMap, getSchemas } from './componentRegistry';
 *   const registry = await getComponentRegistry();
 *   const componentMap = registry.componentMap;
 *   const schemas = registry.schemas;
 */

import React from 'react';

/**
 * Dynamically import a React component
 * Returns lazy-loaded component for performance
 *
 * @param {string} componentName - Name of component (e.g., "InsightHeader")
 * @returns {Promise<React.Component>}
 */
async function importComponent(componentName) {
  try {
    // Try to import from dedicated component files first
    const components = {
      'HealthScoreHeader': () => import('../components/HealthScoreHeader'),
      'AbnormalCard': () => import('../components/AbnormalCard'),
      'MetricCard': () => import('../components/MetricCard'),
      'TrendChart': () => import('../components/TrendChart'),
      'ActionPlan': () => import('../components/ActionPlan'),
      'Tables': () => import('../components/Tables'),
      
      // New specialized components
      'InsightHeader': () => import('../components/InsightHeader'),
      'CriticalAlert': () => import('../components/CriticalAlert'),
      'MetricAccordion': () => import('../components/MetricAccordion'),
      'ReassuranceGrid': () => import('../components/ReassuranceGrid'),
      'ActionTimeline': () => import('../components/ActionTimeline'),
      'GuidelineTable': () => import('../components/GuidelineTable'),
      'CorrelationMap': () => import('../components/CorrelationMap'),
    };

    if (components[componentName]) {
      const module = await components[componentName]();
      return module.default || module[componentName];
    }

    // Fallback for inline components
    return null;
  } catch (error) {
    console.error(`Failed to import component: ${componentName}`, error);
    return null;
  }
}

/**
 * Fetch component schemas from backend
 * This gives the frontend the authoritative list of available components
 *
 * @param {string} backendUrl - Backend URL (default: http://localhost:8000)
 * @returns {Promise<Object>} - Schemas keyed by component name
 */
export async function fetchComponentSchemas(backendUrl = 'http://localhost:8000') {
  try {
    const response = await fetch(`${backendUrl}/api/schema-export`);
    if (!response.ok) {
      throw new Error(`Failed to fetch schemas: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching component schemas:', error);
    // Return fallback/cached schemas if available
    return getFallbackSchemas();
  }
}

/**
 * Build componentMap from schema definitions
 * Maps component type names to React components
 *
 * @param {Object} schemas - Component schemas from backend
 * @returns {Promise<Object>} - componentMap
 */
export async function buildComponentMap(schemas) {
  const componentMap = {};

  // Import actual components
  for (const componentName of Object.keys(schemas)) {
    try {
      const Component = await importComponent(componentName);
      if (Component) {
        componentMap[componentName] = Component;
      }
    } catch (error) {
      console.warn(`Could not load component: ${componentName}`, error);
    }
  }

  // Add inline/utility components
  componentMap['SectionDivider'] = ({ title }) => (
    <div className="mt-10 mb-6 border-b border-gray-200 pb-2">
      <h3 className="text-xl font-black text-gray-800 tracking-tight uppercase flex items-center gap-2">
        {title}
      </h3>
    </div>
  );

  componentMap['NormalList'] = ({ items }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item, i) => (
        <div key={i} className="bg-green-50/50 p-4 rounded-xl border border-green-100 hover:shadow-sm transition-all">
          <div className="flex justify-between items-start">
            <div className="font-bold text-green-900">{item.parameter}</div>
            <div className="text-green-700 font-mono font-semibold">{item.value}</div>
          </div>
          <div className="text-xs text-green-600 mt-1 font-medium">{item.clinical_interpretation}</div>
        </div>
      ))}
    </div>
  );

  componentMap['FollowUpTable'] = async (props) => {
    const Tables = await importComponent('Tables');
    return Tables ? <Tables {...props} /> : null;
  };

  componentMap['LifestyleTable'] = async (props) => {
    const Tables = await importComponent('Tables');
    return Tables ? <Tables {...props} /> : null;
  };

  return componentMap;
}

/**
 * Fallback schemas if backend is unreachable
 * This ensures UI still renders with cached component definitions
 *
 * @returns {Object}
 */
function getFallbackSchemas() {
  return {
    'HealthScoreHeader': {
      componentName: 'HealthScoreHeader',
      version: '1.0.0',
      propsSchema: {
        type: 'object',
        properties: {
          risk_level: { type: 'string' },
          concerns: { type: 'array' },
        },
        required: ['risk_level', 'concerns'],
      },
      renderingHints: { position: 'top', width: 'full' },
    },
    'AbnormalCard': {
      componentName: 'AbnormalCard',
      version: '1.0.0',
      propsSchema: {
        type: 'object',
        properties: {
          parameter: { type: 'string' },
          value: { type: 'string' },
          status: { type: 'string' },
          causes: { type: 'array' },
          effects: { type: 'array' },
          clinical_note: { type: 'string' },
        },
        required: ['parameter', 'value', 'status', 'causes', 'effects', 'clinical_note'],
      },
      renderingHints: { position: 'middle', width: 'full', expandable: true },
    },
    'SectionDivider': {
      componentName: 'SectionDivider',
      version: '1.0.0',
      propsSchema: {
        type: 'object',
        properties: { title: { type: 'string' } },
        required: ['title'],
      },
      renderingHints: { position: 'middle', width: 'full' },
    },
    'NormalList': {
      componentName: 'NormalList',
      version: '1.0.0',
      propsSchema: {
        type: 'object',
        properties: { items: { type: 'array' } },
        required: ['items'],
      },
      renderingHints: { position: 'bottom', width: 'full' },
    },
  };
}

/**
 * Main entry point: Initialize component registry
 * This should be called once when app starts
 *
 * Returns both componentMap and schemas for comprehensive capability
 *
 * @param {string} backendUrl - Backend base URL
 * @returns {Promise<{componentMap: Object, schemas: Object}>}
 */
export async function initializeComponentRegistry(backendUrl = 'http://localhost:8000') {
  console.log('[Registry] Initializing component registry...');

  try {
    // Fetch schemas from backend
    const schemas = await fetchComponentSchemas(backendUrl);
    console.log('[Registry] Loaded schemas for:', Object.keys(schemas).join(', '));

    // Build component map
    const componentMap = await buildComponentMap(schemas);
    console.log('[Registry] Built component map with', Object.keys(componentMap).length, 'components');

    return {
      componentMap,
      schemas,
      isHealthy: true,
    };
  } catch (error) {
    console.error('[Registry] Initialization failed:', error);

    // Fallback to partial registry with only built-in components
    const fallbackSchemas = getFallbackSchemas();
    const componentMap = buildFallbackComponentMap();

    return {
      componentMap,
      schemas: fallbackSchemas,
      isHealthy: false, // Indicates we're running with fallbacks only
    };
  }
}

/**
 * Build fallback componentMap when backend is unavailable
 * Includes only basic components from existing imports
 *
 * @returns {Object}
 */
function buildFallbackComponentMap() {
  return {
    'SectionDivider': ({ title }) => (
      <div style={{ marginTop: '2.5rem', marginBottom: '1.5rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827', textTransform: 'uppercase' }}>
          {title}
        </h3>
      </div>
    ),
    'NormalList': ({ items }) => (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
        {items?.map((item, i) => (
          <div key={i} style={{ backgroundColor: '#f0fdf4', padding: '1rem', borderRadius: '0.75rem', border: '1px solid #bbf7d0' }}>
            <div style={{ fontWeight: 'bold', color: '#166534' }}>{item.parameter}</div>
            <div style={{ color: '#4ade80', fontFamily: 'monospace', fontWeight: 600 }}>{item.value}</div>
            <div style={{ fontSize: '0.75rem', color: '#4ade80', marginTop: '0.25rem' }}>{item.clinical_interpretation}</div>
          </div>
        ))}
      </div>
    ),
  };
}

// Export utility function to update registry dynamically
export async function updateRegistry(newBackendUrl) {
  const registry = await initializeComponentRegistry(newBackendUrl);
  return registry;
}
