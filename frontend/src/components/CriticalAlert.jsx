/**
 * CriticalAlert.jsx - Critical Finding Alert Banner
 *
 * Full-width red banner displaying CRITICAL lab findings that require
 * immediate medical attention. Non-dismissible, always prominent.
 *
 * Props:
 * - findings: [{test_name, value, warning_text, status}]
 * - urgency_level: "CRITICAL"
 */

import React from 'react';
import { AlertTriangle, Zap } from 'lucide-react';

export default function CriticalAlert({ findings = [], urgency_level = 'CRITICAL' }) {
  if (!findings || findings.length === 0) {
    return null;
  }

  return (
    <div className="w-full mb-8 animate-pulse-slow">
      {/* Main Alert Banner */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-6 md:p-8 rounded-2xl shadow-2xl border-2 border-red-700">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="animate-pulse">
            <Zap size={28} className="text-yellow-300" />
          </div>
          <h2 className="text-2xl font-black tracking-tight">⚡ CRITICAL FINDINGS</h2>
        </div>

        {/* Subheader */}
        <p className="text-red-100 text-sm font-semibold mb-6">
          The following values require IMMEDIATE medical attention
        </p>

        {/* Findings List */}
        <div className="space-y-3">
          {findings.map((finding, idx) => (
            <div
              key={idx}
              className="bg-white/10 backdrop-blur-sm border border-red-300/30 rounded-xl p-4 hover:bg-white/15 transition-all"
            >
              {/* Finding Header */}
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <h4 className="font-bold text-lg text-white">{finding.test_name}</h4>
                  <p className="text-red-100 text-sm">Value: {finding.value}</p>
                </div>
                <div className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold flex-shrink-0">
                  {finding.status || 'CRITICAL'}
                </div>
              </div>

              {/* Warning Text */}
              {finding.warning_text && (
                <div className="bg-red-900/20 text-red-100 p-3 rounded-lg text-sm italic border-l-4 border-red-400/40 mt-2">
                  "{finding.warning_text}"
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Action Prompt */}
        <div className="mt-6 pt-4 border-t border-red-400/30">
          <p className="text-red-50 text-sm font-semibold flex items-center gap-2">
            <AlertTriangle size={18} />
            Please contact your healthcare provider immediately for evaluation and treatment.
          </p>
        </div>
      </div>

      {/* Floating Alert Indicator */}
      <style>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s infinite;
        }
      `}</style>
    </div>
  );
}
