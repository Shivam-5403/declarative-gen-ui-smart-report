export function LifestyleTable({ rows }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
      <table className="w-full text-sm text-left">
        <thead className="bg-gray-50 text-gray-500 uppercase">
          <tr>
            <th className="px-6 py-3">Category</th>
            <th className="px-6 py-3">Recommendation</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-gray-50">
              <td className="px-6 py-4 font-bold text-gray-700">{row.category}</td>
              <td className="px-6 py-4 text-gray-600">{row.recommendation}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function FollowUpTable({ rows }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
       <table className="w-full text-sm text-left">
        <thead className="bg-blue-50 text-blue-600 uppercase">
          <tr>
            <th className="px-6 py-3">Timeline</th>
            <th className="px-6 py-3">Test</th>
            <th className="px-6 py-3">Rationale</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((row, i) => (
            <tr key={i}>
              <td className="px-6 py-4 font-bold text-gray-800">{row.timeline}</td>
              <td className="px-6 py-4 text-gray-600">{row.test_name}</td>
              <td className="px-6 py-4 text-gray-500 italic">{row.rationale}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}