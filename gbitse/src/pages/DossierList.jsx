import { useNavigate } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import { getDossiers } from '../lib/store';
import { SECTOR_CONFIG } from '../lib/utils';

export default function DossierList() {
  const dossiers = getDossiers();
  const navigate = useNavigate();

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Intelligence Dossiers ({dossiers.length})</h1>
        <p className="text-sm text-gray-500">Actionable intelligence for priority outreach</p>
      </div>

      <div className="space-y-4">
        {dossiers.map(d => (
          <div key={d.companyId} className="card p-5 hover:bg-brand-50 cursor-pointer transition-colors" onClick={() => navigate(`/companies/${d.companyId}`, { state: { from: 'dossiers' } })}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${d.rank <= 3 ? 'bg-red-100 text-red-700' : d.rank <= 6 ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700'}`}>#{d.rank}</span>
                <div>
                  <span className="font-semibold text-lg text-brand-800">{d.company}</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`badge badge-${SECTOR_CONFIG[d.sector]?.color || d.sector}`}>{SECTOR_CONFIG[d.sector]?.shortLabel}</span>
                    <span className={`badge ${d.urgency === 'CRITICAL' ? 'badge-hot' : d.urgency === 'HIGH' ? 'bg-orange-100 text-orange-800' : 'bg-yellow-100 text-yellow-800'}`}>{d.urgency}</span>
                    <span className="text-xs text-gray-500">{d.dealSize}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mt-3">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase mb-1">Trigger</p>
                <p className="text-sm text-gray-700">{d.trigger}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase mb-1">HR Contact</p>
                <p className="text-sm text-gray-700 font-medium">{d.hrContact}</p>
              </div>
            </div>

            <div className="mt-3 p-3 bg-brand-50 rounded-lg border border-brand-100">
              <p className="text-xs font-medium text-brand-700 uppercase mb-1 flex items-center gap-1"><MessageSquare size={12} /> Opening Line</p>
              <p className="text-sm text-brand-900 italic">"{d.openingLine}"</p>
            </div>

            <div className="mt-3">
              <p className="text-xs font-medium text-gray-500 uppercase mb-1">Pain Points</p>
              <div className="flex flex-wrap gap-1.5">
                {d.painPoints?.slice(0, 3).map((p, i) => <span key={i} className="badge bg-red-50 text-red-700 text-xs">{p.length > 60 ? p.slice(0, 60) + '...' : p}</span>)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
