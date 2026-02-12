/**
 * ActionTimeline.jsx - Follow-Up Tests Timeline Component
 *
 * Vertical timeline showing recommended follow-up tests with:
 * - Timeline (Immediate, 1 week, 1 month, 3 months, etc.)
 * - Test name
 * - Rationale (why this test is needed)
 * - Priority level (high/normal)
 *
 * Props:
 * - events: [{time: string, test_name: string, rationale: string, priority: "high"|"normal"}]
 */

import React from 'react';
import { Calendar, AlertCircle, Clock } from 'lucide-react';

function getPriorityStyles(priority) {
  return priority === 'high'
    ? {
        dotColor: 'bg-red-500',
        lineColor: 'border-red-300',
        badgeColor: 'bg-red-100 text-red-800',
        icon: '🔴',
      }
    : {
        dotColor: 'bg-blue-500',
        lineColor: 'border-blue-300',
        badgeColor: 'bg-blue-100 text-blue-800',
        icon: '🔵',
      };
}

export default function ActionTimeline({ events = [] }) {
  if (!events || events.length === 0) {
    return null;
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-8 flex items-center gap-3">
        <Calendar size={28} className="text-blue-600 flex-shrink-0" />
        <div>
          <h3 className="text-2xl font-black text-gray-900 tracking-tight">Follow-Up Plan</h3>
          <p className="text-sm text-gray-600">Recommended timeline for monitoring and re-assessment</p>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-6 relative">
        {/* Timeline Line (Decorative) */}
        <div className="absolute left-6 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-300 via-blue-200 to-transparent" />

        {/* Events */}
        {events.map((event, idx) => {
          const priority = event.priority || 'normal';
          const styles = getPriorityStyles(priority);

          return (
            <div key={idx} className="relative pl-20">
              {/* Timeline Dot */}
              <div className={`absolute -left-3 top-1 w-12 h-12 ${styles.dotColor} rounded-full flex items-center justify-center border-4 border-white shadow-md`}>
                <span className="text-lg">{styles.icon}</span>
              </div>

              {/* Event Card */}
              <div className={`${styles.lineColor} border-l-4 pl-5 py-4 bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all`}>
                {/* Time Badge */}
                <div className={`${styles.badgeColor} inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold mb-3`}>
                  <Clock size={12} />
                  {event.time || 'Unspecified'}
                </div>

                {/* Test Name */}
                <h4 className="font-bold text-gray-900 mb-2">{event.test_name}</h4>

                {/* Rationale */}
                {event.rationale && (
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border-l-4 border-gray-300">
                    "{event.rationale}"
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-900">
          <p className="font-semibold mb-1">Timeline Priorities:</p>
          <p>
            <span className="inline-block mr-4">
              <span className="text-red-500 font-bold">●</span> High priority = within days/weeks
            </span>
            <span className="inline-block">
              <span className="text-blue-500 font-bold">●</span> Normal = routine monitoring
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
