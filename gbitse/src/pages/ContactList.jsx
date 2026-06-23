import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ExternalLink, Mail, RefreshCw, UserPlus } from 'lucide-react';
import { getContacts, getCompanies } from '../lib/store';
import { PERSONAS, SECTOR_CONFIG, DropdownOptions } from '../lib/utils';

export default function ContactList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [personaFilter, setPersonaFilter] = useState('all');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [confidenceFilter, setConfidenceFilter] = useState('all');

  const allContacts = getContacts();

  const contacts = useMemo(() => {
    let list = allContacts;
    if (search) { const q = search.toLowerCase(); list = list.filter(c => c.name.toLowerCase().includes(q) || c.company.toLowerCase().includes(q) || c.title.toLowerCase().includes(q)); }
    if (personaFilter !== 'all') list = list.filter(c => c.persona === personaFilter);
    if (companyFilter !== 'all') list = list.filter(c => c.company === companyFilter);
    if (confidenceFilter !== 'all') list = list.filter(c => c.confidence === confidenceFilter);
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [search, personaFilter, companyFilter, confidenceFilter, allContacts]);

  const personaLabel = (p) => PERSONAS[p]?.short || p;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Contacts ({allContacts.length})</h1>
          {contacts.length < allContacts.length && <p className="text-sm text-gray-500">{contacts.length} shown after filters</p>}
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary text-xs flex items-center gap-1"><RefreshCw size={12} /> Enrich</button>
          <button className="btn-primary text-xs flex items-center gap-1"><UserPlus size={12} /> Discover More</button>
        </div>
      </div>

      <div className="flex gap-2 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9 text-sm py-1.5" placeholder="Search name, company, title..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input text-xs py-1.5 w-[110px]" value={personaFilter} onChange={e => setPersonaFilter(e.target.value)}>
          <DropdownOptions items={allContacts} field="persona" labelFn={personaLabel} allLabel="Persona" />
        </select>
        <select className="input text-xs py-1.5 w-[140px]" value={companyFilter} onChange={e => setCompanyFilter(e.target.value)}>
          <DropdownOptions items={allContacts} field="company" allLabel="Company" />
        </select>
        <select className="input text-xs py-1.5 w-[110px]" value={confidenceFilter} onChange={e => setConfidenceFilter(e.target.value)}>
          <DropdownOptions items={allContacts} field="confidence" labelFn={c => c.charAt(0).toUpperCase() + c.slice(1)} allLabel="Confidence" />
        </select>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Title</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Company</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">Persona</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">Confidence</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">Links</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {contacts.map(c => (
              <tr key={c.id} className="hover:bg-brand-50 cursor-pointer transition-colors" onClick={(e) => { if (e.target.tagName !== 'A') navigate(`/companies/${c.companyId}`, { state: { from: 'contacts' } }); }}>
                <td className="px-4 py-3 font-medium text-brand-800">{c.name}</td>
                <td className="px-4 py-3 text-gray-600 max-w-[250px] truncate">{c.title}</td>
                <td className="px-4 py-3 text-brand-700 font-medium">{c.company}</td>
                <td className="px-4 py-3 text-center"><span className="badge bg-indigo-50 text-indigo-700">{PERSONAS[c.persona]?.short || c.persona}</span></td>
                <td className="px-4 py-3 text-center"><span className={`badge ${c.confidence === 'high' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{c.confidence}</span></td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    {c.linkedin && <a href={c.linkedin} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="text-blue-600 hover:text-blue-800 underline text-xs flex items-center gap-0.5"><ExternalLink size={12} /> LinkedIn</a>}
                    {c.email && <a href={`mailto:${c.email}`} onClick={e => e.stopPropagation()} className="text-blue-600 hover:text-blue-800 underline text-xs flex items-center gap-0.5"><Mail size={12} /> Email</a>}
                    {!c.linkedin && !c.email && <span className="text-gray-300">-</span>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
