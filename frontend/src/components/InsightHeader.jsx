/**
 * InsightHeader.jsx - Patient Insight & Risk Badge Component
 *
 * Displays patient demographics (name, age, gender) and overall risk level
 * assessment with color-coded badge and key concerns list.
 *
 * Props:
 * - patient_info: {name, age, gender, dob}
 * - risk_level: "Low" | "Moderate" | "High" | "Critical"
 * - overall_concerns: string[]
 * - date: string (ISO or readable format)
 */

import React from 'react';
import { AlertCircle, TrendingUp, User } from 'lucide-react';

/**
 * Get risk level styling and icon
 */
function getRiskStyles(riskLevel) {
  const styles = {
    Low: {
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      badgeColor: 'bg-green-100 text-green-800',
      icon: '✓',
      textColor: 'text-green-900',
    },
    Moderate: {
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      badgeColor: 'bg-blue-100 text-blue-800',
      icon: '⚠',
      textColor: 'text-blue-900',
    },
    High: {
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      badgeColor: 'bg-orange-100 text-orange-800',
      icon: '⚠',
      textColor: 'text-orange-900',
    },
    Critical: {
      bgColor: 'bg-red-50',
      borderColor: 'border-red-300',
      badgeColor: 'bg-red-200 text-red-900',
      icon: '🔴',
      textColor: 'text-red-900',
    },
  };

  return styles[riskLevel] || styles.Moderate;
}

export default function InsightHeader({
  patient_info = {},
  risk_level = 'Moderate',
  overall_concerns = [],
  date = new Date().toLocaleDateString(),
}) {
  const styles = getRiskStyles(risk_level);
  const { name = 'Patient', age = 'N/A', gender = 'N/A' } = patient_info;

  return (
    <div className={`${styles.bgColor} ${styles.borderColor} border rounded-2xl p-6 md:p-8 shadow-sm`}>
      {/* Header Row: Patient Info + Risk Badge */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6">
        <div className="flex items-center gap-4">
          {/* Patient Avatar */}
          <div className={`${styles.badgeColor} rounded-full p-4 flex items-center justify-center`}>
            <User size={32} className="opacity-70" />
          </div>

          {/* Patient Details */}
          <div>
            <h1 className={`text-3xl font-black ${styles.textColor} tracking-tight`}>{name}</h1>
            <p className="text-sm text-gray-600 mt-1">
              {age} • {gender}
            </p>
            <p className="text-xs text-gray-500 mt-1">{date}</p>
          </div>
        </div>

        {/* Risk Level Badge */}
        <div
          className={`${styles.badgeColor} px-6 py-3 rounded-full font-bold flex items-center gap-2 whitespace-nowrap shadow-md`}
        >
          <span className="text-lg">{styles.icon}</span>
          <span>Risk: {risk_level}</span>
        </div>
      </div>

      {/* Concerns Section */}
      {overall_concerns && overall_concerns.length > 0 && (
        <div className="mt-6 pt-6 border-t border-current/10">
          <h3 className={`text-sm font-bold uppercase tracking-wider ${styles.textColor} mb-3 flex items-center gap-2`}>
            <AlertCircle size={16} />
            Key Concerns
          </h3>
          <ul className="space-y-2">
            {overall_concerns.map((concern, idx) => (
              <li key={idx} className={`flex items-start gap-3 text-sm ${styles.textColor}`}>
                <span className="font-bold mt-0.5">•</span>
                <span>{concern}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
