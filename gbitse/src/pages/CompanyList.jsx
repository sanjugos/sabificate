import { useState, useMemo } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Search, MapPin, ArrowUpDown, ArrowUp, ArrowDown, RefreshCw, Plus } from 'lucide-react';
import { getCompanies, getContacts } from '../lib/store';
import { SECTOR_CONFIG, formatScore, DropdownOptions } from '../lib/utils';

export default function CompanyList() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [sectorFilter, setSectorFilter] = useState(searchParams.get('sector') || 'all');
  const [tierFilter, setTierFilter] = useState(searchParams.get('tier') || 'all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [sortField, setSortField] = useState('score');
  const [sortDir, setSortDir] = useState('desc');

  const allCompanies = getCompanies();
  const contacts = getContacts();

  // Pre-compute contact counts per company for sorting
  const contactCounts = useMemo(() => {
    const map = {};
    contacts.forEach(ct => { map[ct.companyId] = (map[ct.companyId] || 0) + 1; });
    return map;
  }, [contacts]);

  const companies = useMemo(() => {
    let list = allCompanies;
    if (search) { const q = search.toLowerCase(); list = list.filter(c => c.name.toLowerCase().includes(q) || c.hqCity?.toLowerCase().includes(q) || c.subSector?.toLowerCase().includes(q) || c.parent?.toLowerCase().includes(q) || c.sector?.toLowerCase().includes(q)); }
    if (sectorFilter !== 'all') list = list.filter(c => c.sector === sectorFilter);
    if (tierFilter !== 'all') list = list.filter(c => c.tier === tierFilter);
    if (statusFilter !== 'all') list = list.filter(c => c.status === statusFilter);
    if (cityFilter !== 'all') list = list.filter(c => c.hqCity === cityFilter);

    // Sort
    const dir = sortDir === 'asc' ? 1 : -1;
    list = [...list].sort((a, b) => {
      switch (sortField) {
        case 'name': return dir * a.name.localeCompare(b.name);
        case 'sector': return dir * (a.sector || '').localeCompare(b.sector || '');
        case 'hqCity': return dir * (a.hqCity || '').localeCompare(b.hqCity || '');
        case 'employees': return dir * ((a.employees || 0) - (b.employees || 0));
        case 'contacts': return dir * ((contactCounts[a.id] || 0) - (contactCounts[b.id] || 0));
        case 'score': return dir * (a.score - b.score);
        case 'status': return dir * (a.status || '').localeCompare(b.status || '');
        default: return 0;
      }
    });
    return list;
  }, [search, sectorFilter, tierFilter, statusFilter, cityFilter, sortField, sortDir, allCompanies, contactCounts]);

  const toggleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir(field === 'name' || field === 'sector' || field === 'hqCity' ? 'asc' : 'desc'); }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ArrowUpDown size={12} className="text-gray-300" />;
    return sortDir === 'asc' ? <ArrowUp size={12} className="text-brand-600" /> : <ArrowDown size={12} className="text-brand-600" />;
  };

  const sectorLabel = (s) => SECTOR_CONFIG[s]?.shortLabel || s;
  const filtered = companies.length < allCompanies.length;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Companies ({allCompanies.length})</h1>
          {filtered && <p className="text-sm text-gray-500">{companies.length} shown after filters</p>}
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary text-xs flex items-center gap-1"><RefreshCw size={12} /> Update Scores</button>
          <button className="btn-primary text-xs flex items-center gap-1"><Plus size={12} /> Scan More</button>
        </div>
      </div>

      <div className="flex gap-2 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9 text-sm py-1.5" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input text-xs py-1.5 w-[130px]" value={sectorFilter} onChange={e => setSectorFilter(e.target.value)}>
          <DropdownOptions items={allCompanies} field="sector" labelFn={sectorLabel} allLabel="Sector" />
        </select>
        <select className="input text-xs py-1.5 w-[90px]" value={tierFilter} onChange={e => setTierFilter(e.target.value)}>
          <DropdownOptions items={allCompanies} field="tier" labelFn={t => t.charAt(0).toUpperCase() + t.slice(1)} allLabel="Tier" />
        </select>
        <select className="input text-xs py-1.5 w-[100px]" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <DropdownOptions items={allCompanies} field="status" labelFn={s => s.charAt(0).toUpperCase() + s.slice(1)} allLabel="Status" />
        </select>
        <select className="input text-xs py-1.5 w-[100px]" value={cityFilter} onChange={e => setCityFilter(e.target.value)}>
          <DropdownOptions items={allCompanies} field="hqCity" allLabel="City" />
        </select>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {[
                { key: 'name', label: 'Company', align: 'text-left' },
                { key: 'sector', label: 'Sector', align: 'text-left' },
                { key: 'hqCity', label: 'HQ', align: 'text-left' },
                { key: 'employees', label: 'Employees', align: 'text-right' },
                { key: 'contacts', label: 'Contacts', align: 'text-center' },
                { key: 'score', label: 'Score', align: 'text-center' },
                { key: 'status', label: 'Status', align: 'text-center' },
              ].map(col => (
                <th key={col.key} className={`${col.align} px-4 py-3 font-medium text-gray-600 cursor-pointer hover:text-gray-900 select-none`} onClick={() => toggleSort(col.key)}>
                  <span className="inline-flex items-center gap-1">{col.label} <SortIcon field={col.key} /></span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {companies.map(c => {
              const sc = formatScore(c.score);
              const namedCount = contactCounts[c.id] || 0;
              return (
                <tr key={c.id} className="hover:bg-brand-50 cursor-pointer transition-colors" onClick={() => navigate(`/companies/${c.id}`)}>
                  <td className="px-4 py-3">
                    <span className="font-medium text-brand-800">{c.name}</span>
                    {c.parent && <p className="text-xs text-gray-400">{c.parent}</p>}
                  </td>
                  <td className="px-4 py-3"><span className={`badge badge-${SECTOR_CONFIG[c.sector]?.color || c.sector}`}>{SECTOR_CONFIG[c.sector]?.shortLabel || c.sector}</span></td>
                  <td className="px-4 py-3 text-gray-600"><span className="flex items-center gap-1"><MapPin size={12} />{c.hqCity}</span></td>
                  <td className="px-4 py-3 text-right text-gray-700 font-medium">{c.employees?.toLocaleString()}</td>
                  <td className="px-4 py-3 text-center">{namedCount > 0 ? <span className="badge bg-emerald-100 text-emerald-700">{namedCount}</span> : <span className="text-gray-300">-</span>}</td>
                  <td className="px-4 py-3 text-center"><span className={`badge ${sc.class}`}>{c.score} {sc.label}</span></td>
                  <td className="px-4 py-3 text-center"><span className={`badge ${c.status === 'client' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>{c.status}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
