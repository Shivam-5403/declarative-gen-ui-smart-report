import { AlertTriangle, ChevronDown } from 'lucide-react';
import { useState } from 'react';

export default function AbnormalCard({ parameter, value, status, causes, effects, clinical_note }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white rounded-xl border-l-4 border-red-500 shadow-sm mb-4 overflow-hidden">
      <div 
        className="p-4 flex justify-between items-center cursor-pointer bg-red-50/50"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex gap-4 items-center">
          <div className="bg-red-100 p-2 rounded-full text-red-600"><AlertTriangle size={20} /></div>
          <div>
            <h3 className="font-bold text-gray-800">{parameter}</h3>
            <p className="text-sm font-semibold text-red-600">{value} • {status}</p>
          </div>
        </div>
        <ChevronDown className={`transition-transform text-gray-400 ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      
      {isOpen && (
        <div className="p-4 bg-white border-t border-gray-100 grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-bold text-gray-700 mb-2">Potential Causes:</h4>
            <ul className="list-disc pl-4 text-gray-600 space-y-1">
              {causes.map((c, i) => <li key={i}>{c}</li>)}
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-gray-700 mb-2">Health Effects:</h4>
            <ul className="list-disc pl-4 text-gray-600 space-y-1">
              {effects.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          </div>
          <div className="col-span-full mt-2 bg-blue-50 p-3 rounded-lg text-blue-800 text-xs">
            <strong>Clinical Note:</strong> {clinical_note}
          </div>
        </div>
      )}
    </div>
  );
}