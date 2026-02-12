/**
 * ReassuranceGrid.jsx - Normal Findings Reassurance Grid
 *
 * Green-themed grid displaying normal/good test results. Shows that
 * not all lab values are abnormal, providing reassurance to patients.
 *
 * Props:
 * - items: [{name: string, value: string, interpretation: string}]
 */

import React from 'react';
import { CheckCircle2 } from 'lucide-react';

export default function ReassuranceGrid({ items = [] }) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <CheckCircle2 size={28} className="text-green-600 flex-shrink-0" />
        <div>
          <h3 className="text-2xl font-black text-green-900 tracking-tight">Good News</h3>
          <p className="text-sm text-green-700">These values are within healthy ranges</p>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-5 hover:shadow-md transition-all"
          >
            {/* Checkmark Icon */}
            <div className="flex items-start justify-between mb-3">
              <CheckCircle2 size={24} className="text-green-600 flex-shrink-0" />
              <span className="text-green-700 font-bold text-xs uppercase tracking-wider">Normal</span>
            </div>

            {/* Parameter Name */}
            <h4 className="font-bold text-green-900 mb-1">{item.name || item.parameter}</h4>

            {/* Value */}
            <p className="text-lg font-mono font-semibold text-green-700 mb-2">{item.value}</p>

            {/* Interpretation */}
            {item.interpretation && (
              <p className="text-sm text-green-700">{item.interpretation}</p>
            )}
          </div>
        ))}
      </div>

      {/* Footer Message */}
      <div className="mt-6 bg-green-100/50 border border-green-200 rounded-lg p-4 text-center">
        <p className="text-green-800 text-sm font-semibold">
          {items.length} parameter{items.length !== 1 ? 's' : ''} are within normal ranges — {' '}
          <span className="text-green-900 font-black">that's great!</span>
        </p>
      </div>
    </div>
  );
}
