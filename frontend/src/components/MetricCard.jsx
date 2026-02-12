import { AlertCircle, CheckCircle } from 'lucide-react';

export default function MetricCard({ label, value, unit, status, advice }) {
  const isCritical = status === 'critical' || status === 'High' || status === 'Low';
  
  return (
    <div className={`p-4 rounded-xl border-2 ${isCritical ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'} shadow-sm transition-all hover:shadow-md`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-500 uppercase">{label}</p>
          <h3 className="text-2xl font-bold text-gray-900">{value} <span className="text-lg font-normal text-gray-500">{unit}</span></h3>
        </div>
        {isCritical ? <AlertCircle className="text-red-500" /> : <CheckCircle className="text-green-500" />}
      </div>
      {advice && <p className="mt-2 text-sm text-gray-700 italic border-t pt-2 border-gray-200">{advice}</p>}
    </div>
  );
}