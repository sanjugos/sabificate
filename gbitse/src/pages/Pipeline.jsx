import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getCompanies, updateCompany } from '../lib/store';
import { SECTOR_CONFIG, formatScore, DropdownOptions } from '../lib/utils';

const COLUMNS = [
  { key: 'hot', label: 'Hot Leads', color: 'border-red-400 bg-red-50' },
  { key: 'warm', label: 'Warm Leads', color: 'border-orange-400 bg-orange-50' },
  { key: 'cool', label: 'Cool Leads', color: 'border-blue-400 bg-blue-50' },
  { key: 'watch', label: 'Watch', color: 'border-gray-300 bg-gray-50' },
];

const STATUS_COLS = [
  { key: 'new', label: 'New', color: 'border-gray-300 bg-gray-50' },
  { key: 'contacted', label: 'Contacted', color: 'border-blue-400 bg-blue-50' },
  { key: 'engaged', label: 'Engaged', color: 'border-purple-400 bg-purple-50' },
  { key: 'proposal_sent', label: 'Proposal Sent', color: 'border-amber-400 bg-amber-50' },
  { key: 'won', label: 'Won', color: 'border-green-400 bg-green-50' },
];

export default function Pipeline() {
  const [view, setView] = useState('tier');
  const [sectorFilter, setSectorFilter] = useState('all');
  const [, forceUpdate] = useState(0);

  const companies = useMemo(() => {
    let list = getCompanies();
    if (sectorFilter !== 'all') list = list.filter(c => c.sector === sectorFilter);
    return list;
  }, [sectorFilter]);

  const cols = view === 'tier' ? COLUMNS : STATUS_COLS;
  const groupKey = view === 'tier' ? 'tier' : 'status';

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pipeline</h1>
          <p className="text-sm text-gray-500">{companies.length} companies in pipeline</p>
        </div>
        <div className="flex gap-2">
          <select className="input w-auto text-sm" value={sectorFilter} onChange={e => setSectorFilter(e.target.value)}>
            <DropdownOptions items={getCompanies()} field="sector" labelFn={s => SECTOR_CONFIG[s]?.shortLabel || s} allLabel="All Sectors" />
          </select>
          <button className={`px-3 py-1.5 text-sm rounded-lg ${view === 'tier' ? 'bg-brand-800 text-white' : 'bg-gray-100 text-gray-600'}`} onClick={() => setView('tier')}>By Tier</button>
          <button className={`px-3 py-1.5 text-sm rounded-lg ${view === 'status' ? 'bg-brand-800 text-white' : 'bg-gray-100 text-gray-600'}`} onClick={() => setView('status')}>By Status</button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {cols.map(col => {
          const items = companies.filter(c => c[groupKey] === col.key);
          return (
            <div key={col.key} className={`rounded-xl border-t-4 ${col.color} p-3`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm text-gray-700">{col.label}</h3>
                <span className="badge bg-white text-gray-600 border border-gray-200">{items.length}</span>
              </div>
              <div className="space-y-2 max-h-[calc(100vh-240px)] overflow-y-auto">
                {items.sort((a, b) => b.score - a.score).map(c => {
                  const sc = formatScore(c.score);
                  return (
                    <Link to={`/companies/${c.id}`} state={{ from: 'pipeline' }} key={c.id} className="block p-3 bg-white rounded-lg border border-gray-100 hover:shadow-sm transition-shadow cursor-pointer">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`badge badge-${c.sector} text-[10px]`}>{SECTOR_CONFIG[c.sector]?.shortLabel}</span>
                        <span className={`text-xs font-bold ${sc.class} px-1.5 py-0.5 rounded`}>{c.score}</span>
                      </div>
                      <p className="font-medium text-sm truncate">{c.name}</p>
                      <p className="text-xs text-gray-400 truncate">{c.hqCity} · {c.employees?.toLocaleString()} emp</p>
                      {c.status === 'client' && <span className="badge bg-green-100 text-green-700 text-[10px] mt-1">Client</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
