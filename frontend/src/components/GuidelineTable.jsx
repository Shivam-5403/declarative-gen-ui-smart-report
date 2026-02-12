/**
 * GuidelineTable.jsx - Lifestyle & Medication Guidelines Table
 *
 * Clean, scannable table for recommended lifestyle modifications or medications.
 * Supports two types: "lifestyle" and "medication" with different styling.
 *
 * Props:
 * - headers: string[] (e.g., ["Category", "Recommendation"])
 * - rows: [{category: string, recommendation: string}, ...]
 * - type: "lifestyle" | "medication"
 * - themeColor: "green" | "blue" | "yellow" (optional, defaults based on type)
 */

import React from 'react';
import { Utensils, Pill, Activity, AlertCircle } from 'lucide-react';

function getThemeStyles(type, themeColor) {
  const baseStyles = {
    lifestyle: {
      headerBg: 'bg-green-100',
      headerText: 'text-green-900',
      rowBg: 'bg-green-50/30',
      borderColor: 'border-green-200',
      badgeBg: 'bg-green-100 text-green-800',
      icon: Utensils,
      title: 'Lifestyle Recommendations',
    },
    medication: {
      headerBg: 'bg-blue-100',
      headerText: 'text-blue-900',
      rowBg: 'bg-blue-50/30',
      borderColor: 'border-blue-200',
      badgeBg: 'bg-blue-100 text-blue-800',
      icon: Pill,
      title: 'Medication Guidelines',
    },
  };

  return baseStyles[type] || baseStyles.lifestyle;
}

/**
 * Get category icon for lifestyle items
 */
function getCategoryIcon(category) {
  const categoryIcons = {
    Diet: '🍎',
    Exercise: '🏃',
    Lifestyle: '🌟',
    Sleep: '😴',
    Stress: '🧘',
    Medication: '💊',
    Supplement: '🌿',
  };

  for (const [key, icon] of Object.entries(categoryIcons)) {
    if (category.includes(key)) {
      return icon;
    }
  }

  return '→';
}

export default function GuidelineTable({
  headers = ['Category', 'Recommendation'],
  rows = [],
  type = 'lifestyle',
  themeColor = '',
}) {
  if (!rows || rows.length === 0) {
    return null;
  }

  const styles = getThemeStyles(type, themeColor);
  const Icon = styles.icon;

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Icon size={28} className={type === 'lifestyle' ? 'text-green-600' : 'text-blue-600'} />
        <div>
          <h3 className="text-2xl font-black text-gray-900 tracking-tight">{styles.title}</h3>
          <p className="text-sm text-gray-600">
            {type === 'lifestyle'
              ? 'Implement these changes to support your health'
              : 'Follow your healthcare provider\'s instructions'}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-300 shadow-sm">
        <table className="w-full">
          {/* Header Row */}
          <thead>
            <tr className={`${styles.headerBg} ${styles.headerText}`}>
              {headers.map((header, idx) => (
                <th
                  key={idx}
                  className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody className="divide-y divide-gray-200">
            {rows.map((row, idx) => (
              <tr
                key={idx}
                className={`${styles.rowBg} hover:bg-opacity-100 transition-all ${idx % 2 === 0 ? 'bg-white' : styles.rowBg}`}
              >
                {/* Category Cell */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl flex-shrink-0">
                      {getCategoryIcon(row.category || row[headers[0]] || '')}
                    </span>
                    <div>
                      <p className="font-bold text-gray-900">{row.category || row[headers[0]]}</p>
                    </div>
                  </div>
                </td>

                {/* Recommendation Cell */}
                <td className="px-6 py-4">
                  <p className="text-gray-700 text-sm leading-relaxed">{row.recommendation || row[headers[1]]}</p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer Note */}
      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle size={20} className="text-yellow-700 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-yellow-900">
          <span className="font-semibold">Important:</span> These recommendations complement, not replace, your
          doctor's advice. Discuss any major changes with your healthcare provider before implementing.
        </p>
      </div>
    </div>
  );
}
