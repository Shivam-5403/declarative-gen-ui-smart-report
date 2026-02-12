/**
 * MetricAccordion.jsx - Expandable Medical Parameter Card
 *
 * Expandable card displaying abnormal findings with:
 * - Parameter name, value, status (color-coded)
 * - Root causes list
 * - Downstream effects list
 * - Clinical notes with correlation info
 *
 * Props:
 * - parameter: string
 * - value: string
 * - reference_range: string (optional)
 * - status: "CRITICAL" | "HIGH" | "LOW"
 * - causes: string[]
 * - effects: string[]
 * - clinical_note: string
 * - correlation: {related_findings: [], pattern: string, evidence: string}
 */

import React, { useState } from 'react';
import { ChevronDown, AlertTriangle, Zap, Target } from 'lucide-react';

function getStatusStyles(status) {
  const styles = {
    CRITICAL: {
      bgHeader: 'bg-red-50',
      borderColor: 'border-red-300',
      badgeColor: 'bg-red-100 text-red-800',
      iconColor: 'text-red-600',
      icon: '🔴',
    },
    HIGH: {
      bgHeader: 'bg-orange-50',
      borderColor: 'border-orange-300',
      badgeColor: 'bg-orange-100 text-orange-800',
      iconColor: 'text-orange-600',
      icon: '🟠',
    },
    LOW: {
      bgHeader: 'bg-blue-50',
      borderColor: 'border-blue-300',
      badgeColor: 'bg-blue-100 text-blue-800',
      iconColor: 'text-blue-600',
      icon: '🔵',
    },
  };
  return styles[status] || styles.LOW;
}

export default function MetricAccordion({
  parameter = 'Parameter',
  value = 'N/A',
  reference_range = '',
  status = 'HIGH',
  causes = [],
  effects = [],
  clinical_note = '',
  correlation = {},
}) {
  const [isExpanded, setIsExpanded] = useState(status === 'CRITICAL');
  const styles = getStatusStyles(status);

  return (
    <div className={`${styles.borderColor} border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all`}>
      {/* Header (Always Visible) */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full ${styles.bgHeader} px-6 py-4 flex items-center justify-between gap-4 hover:opacity-90 transition-all`}
      >
        <div className="flex items-center gap-4 flex-1 text-left">
          {/* Icon */}
          <span className="text-2xl flex-shrink-0">{styles.icon}</span>

          {/* Parameter Info */}
          <div className="flex-1">
            <h3 className="font-bold text-lg text-gray-900">{parameter}</h3>
            <p className="text-sm text-gray-600">
              {value}
              {reference_range && <span className="text-gray-500"> (ref: {reference_range})</span>}
            </p>
          </div>

          {/* Status Badge */}
          <div className={`${styles.badgeColor} px-3 py-1 rounded-full text-sm font-bold flex-shrink-0`}>
            {status}
          </div>
        </div>

        {/* Expand Icon */}
        <ChevronDown
          size={20}
          className={`flex-shrink-0 ${styles.iconColor} transition-transform ${isExpanded ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="bg-white px-6 py-4 space-y-6 border-t border-gray-100">
          {/* Clinical Note */}
          {clinical_note && (
            <div className={`${styles.bgHeader} p-4 rounded-lg border-l-4 ${styles.borderColor}`}>
              <p className="text-sm text-gray-800">{clinical_note}</p>
            </div>
          )}

          {/* Causes Section */}
          {causes && causes.length > 0 && (
            <div>
              <h4 className="font-bold text-sm uppercase tracking-wider text-gray-700 mb-2 flex items-center gap-2">
                <Target size={16} className={styles.iconColor} />
                Likely Causes
              </h4>
              <ul className="space-y-2">
                {causes.map((cause, idx) => (
                  <li
                    key={idx}
                    className="text-sm text-gray-700 bg-gray-50 p-2 rounded-lg border-l-4 border-gray-300 pl-3"
                  >
                    • {cause}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Effects Section */}
          {effects && effects.length > 0 && (
            <div>
              <h4 className="font-bold text-sm uppercase tracking-wider text-gray-700 mb-2 flex items-center gap-2">
                <Zap size={16} className={styles.iconColor} />
                Potential Effects (If Untreated)
              </h4>
              <ul className="space-y-2">
                {effects.map((effect, idx) => (
                  <li
                    key={idx}
                    className="text-sm text-gray-700 bg-gray-50 p-2 rounded-lg border-l-4 border-yellow-300 pl-3"
                  >
                    • {effect}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Correlation Info */}
          {correlation && (
            <div>
              {correlation.pattern && (
                <div className="mb-3">
                  <h4 className="font-bold text-sm uppercase tracking-wider text-gray-700 mb-2">
                    Clinical Pattern
                  </h4>
                  <p className="text-sm text-gray-700 bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <span className="font-semibold">{correlation.pattern}</span>
                    {correlation.evidence && <span> — {correlation.evidence}</span>}
                  </p>
                </div>
              )}

              {correlation.related_findings && correlation.related_findings.length > 0 && (
                <div>
                  <h4 className="font-bold text-sm uppercase tracking-wider text-gray-700 mb-2">
                    Related Findings
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {correlation.related_findings.map((finding, idx) => (
                      <span
                        key={idx}
                        className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold"
                      >
                        {finding}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
