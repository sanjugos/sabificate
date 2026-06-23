import { Building2, Users, FileText, TrendingUp, Flame, Target, BarChart3 } from 'lucide-react';
import { getStats, getCompanies, getDossiers } from '../lib/store';
import { SECTOR_CONFIG } from '../lib/utils';
import { Link } from 'react-router-dom';

const COLORS = ['#1E40AF','#7C3AED','#0891B2','#B45309','#DB2777','#059669','#DC2626','#4F46E5','#0D9488','#CA8A04','#9333EA','#2563EB','#E11D48','#16A34A','#EA580C'];

export default function Dashboard() {
  const stats = getStats();
  const dossiers = getDossiers().slice(0, 5);
  const sectorData = stats.bySector
    .sort(([,a],[,b]) => b - a)
    .map(([k, v]) => ({ name: SECTOR_CONFIG[k]?.shortLabel || k, value: v, fullName: SECTOR_CONFIG[k]?.label || k, sector: k }));

  const kpis = [
    { label: 'Total Companies', value: stats.total, icon: Building2, color: 'text-blue-600 bg-blue-50', to: '/companies' },
    { label: 'Hot Leads', value: stats.hot, icon: Flame, color: 'text-red-600 bg-red-50', to: '/companies?tier=hot' },
    { label: 'Named Contacts', value: stats.totalContacts, icon: Users, color: 'text-emerald-600 bg-emerald-50', to: '/contacts' },
    { label: 'Dossiers Ready', value: stats.totalDossiers, icon: FileText, color: 'text-purple-600 bg-purple-50', to: '/dossiers' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Nigeria HR/OD consulting lead intelligence</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(k => (
          <Link key={k.label} to={k.to} className="card p-4 hover:bg-brand-50 cursor-pointer transition-colors">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${k.color}`}>
                <k.icon size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold">{k.value}</p>
                <p className="text-xs text-gray-500">{k.label}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* By Sector — circles with listing */}
      <div className="card p-5">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><BarChart3 size={18} /> Companies by Sector</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {sectorData.map((s, i) => (
            <Link key={s.name} to={`/companies?sector=${s.sector}`} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }}>
                {s.value}
              </div>
              <span className="text-sm text-gray-700 leading-tight hover:text-brand-800">{s.fullName}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Priority Targets — full width */}
      <div className="card p-5">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Target size={18} /> Priority Outreach Targets</h2>
        <div className="space-y-3">
          {dossiers.map((d, i) => (
            <Link to={`/companies/${d.companyId}`} state={{ from: 'dossiers' }} key={d.companyId} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100">
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${i < 3 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>{d.rank}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{d.company}</p>
                <p className="text-xs text-gray-500 truncate">{d.trigger}</p>
              </div>
              <span className={`badge shrink-0 ${d.urgency === 'CRITICAL' ? 'badge-hot' : d.urgency === 'HIGH' ? 'bg-orange-100 text-orange-800' : 'bg-yellow-100 text-yellow-800'}`}>{d.urgency}</span>
              <span className="text-xs text-gray-400 shrink-0">{d.dealSize}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="card p-5">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><TrendingUp size={18} /> Sector Intelligence Summary</h2>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="font-semibold text-blue-900">Banking</p>
            <p className="text-blue-700 mt-1">CBN recapitalization complete. Banks raised N4.65T. Post-recap restructuring = HR consulting demand surge. 47% tech talent attrition risk.</p>
          </div>
          <div className="p-3 bg-purple-50 rounded-lg">
            <p className="font-semibold text-purple-900">Government</p>
            <p className="text-purple-700 mt-1">NRS institutional rebirth. NNPC IPO prep. CBN Consolidation Phase after 1,000+ staff exit. World Bank SPESSE training 25K+ staff.</p>
          </div>
          <div className="p-3 bg-pink-50 rounded-lg">
            <p className="font-semibold text-pink-900">Fintech</p>
            <p className="text-pink-700 mt-1">Moniepoint: 500 unfilled roles. OPay: dual-CEO at 4,100 staff. 70% of startups can't hire devs. Compensation gap: N15M local vs $120K remote.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
