export default function HealthScoreHeader({ risk_level, concerns }) {
  const colors = {
    Low: "bg-green-100 text-green-800 border-green-200",
    Moderate: "bg-yellow-100 text-yellow-800 border-yellow-200",
    High: "bg-orange-100 text-orange-800 border-orange-200",
    Critical: "bg-red-100 text-red-800 border-red-200"
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-md mb-6 border border-gray-100">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Health Summary</h2>
          <p className="text-gray-500 mt-1">AI-Generated Assessment</p>
        </div>
        <span className={`px-4 py-1 rounded-full text-sm font-bold border ${colors[risk_level] || colors.Moderate}`}>
          {risk_level} Risk
        </span>
      </div>
      <div className="mt-4">
        <h4 className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-2">Key Concerns</h4>
        <div className="flex flex-wrap gap-2">
          {concerns.map((c, i) => (
            <span key={i} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-sm font-medium">
              {c}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}