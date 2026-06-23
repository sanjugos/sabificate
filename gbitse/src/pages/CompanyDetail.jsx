import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Building2, MapPin, Globe, Users as UsersIcon, ExternalLink, MessageSquare, Mail, Plus, FileText, TrendingUp, Zap, Briefcase } from 'lucide-react';
import { useState } from 'react';
import { getCompany, getContactsForCompany, getDossier, getActivities, addActivity, deleteActivity, updateCompany } from '../lib/store';
import { SECTOR_CONFIG, formatScore, STATUS_OPTIONS } from '../lib/utils';
import { getProfile, extractSignals } from '../data/profiles';
import { getCompanyContact } from '../data/company-contacts';

export default function CompanyDetail() {
  const { id } = useParams();
  const company = getCompany(id);
  const allContacts = getContactsForCompany(id);
  const namedContacts = allContacts.filter(c => c.confidence !== 'placeholder');
  const dossier = getDossier(id);
  const profile = getProfile(id);
  const signals = profile ? extractSignals(profile) : [];
  const companyContact = getCompanyContact(company?.name);
  const [activities, setActivities] = useState(getActivities(id));
  const [noteText, setNoteText] = useState('');
  const [, forceUpdate] = useState(0);

  if (!company) return <div className="p-6">Company not found</div>;

  const sc = formatScore(company.score);

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    addActivity(id, { type: 'note', notes: noteText, channel: 'internal' });
    setActivities(getActivities(id));
    setNoteText('');
  };

  const handleStatusChange = (status) => {
    updateCompany(id, { status });
    forceUpdate(n => n + 1);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            {company.name}
            <span className={`badge badge-${SECTOR_CONFIG[company.sector]?.color || company.sector}`}>{SECTOR_CONFIG[company.sector]?.shortLabel}</span>
            <span className={`badge ${sc.class}`}>{company.score} {sc.label}</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">{company.subSector} {company.parent ? `· ${company.parent}` : ''}</p>
        </div>
        <select className="border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500" style={{width:'120px'}} value={company.status} onChange={e => handleStatusChange(e.target.value)}>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g,' ')}</option>)}
        </select>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Column 1: Company Info + Profile */}
        <div className="space-y-4">
          <div className="card p-4 space-y-3">
            <h3 className="font-semibold text-gray-900 text-sm">Company Info</h3>
            <div className="space-y-2 text-sm">
              <p className="flex items-center gap-2 text-gray-600"><MapPin size={14} />{company.hqCity}, Nigeria</p>
              <p className="flex items-center gap-2 text-gray-600"><UsersIcon size={14} />{company.employees?.toLocaleString()} employees (est.)</p>
              <p className="flex items-center gap-2 text-gray-600"><Building2 size={14} />{company.ownership} {company.ngxListed ? '· NGX Listed' : ''}</p>
              {company.website && <a href={`https://${company.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-brand-600 hover:underline"><Globe size={14} />{company.website} <ExternalLink size={12} /></a>}
              {companyContact?.email && <p className="flex items-center gap-2 text-gray-600"><Mail size={14} /><a href={`mailto:${companyContact.email}`} className="text-brand-600 hover:underline">{companyContact.email}</a></p>}
              {companyContact?.phone && <p className="flex items-center gap-2 text-gray-600"><span className="text-xs">📞</span>{companyContact.phone}</p>}
              {companyContact?.phone2 && <p className="flex items-center gap-2 text-gray-600 pl-5">{companyContact.phone2}</p>}
              {companyContact?.address && <p className="text-xs text-gray-400 mt-1">{companyContact.address}</p>}
              {companyContact?.careers && <a href={`https://${companyContact.careers}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-blue-500 hover:underline mt-1">Careers portal: {companyContact.careers}</a>}
            </div>
          </div>

          {/* Website Intelligence */}
          {profile && (
            <div className="card p-4 space-y-3">
              <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2"><Globe size={14} /> Website Intelligence</h3>
              {profile.about && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">About</p>
                  <p className="text-sm text-gray-700 mt-0.5">{profile.about}</p>
                </div>
              )}
              {profile.services && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Services / Products</p>
                  <p className="text-sm text-gray-700 mt-0.5">{profile.services}</p>
                </div>
              )}
              {profile.locations && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Locations</p>
                  <p className="text-sm text-gray-600 mt-0.5">{profile.locations}</p>
                </div>
              )}
            </div>
          )}

          {/* Signals */}
          <div className="card p-4 space-y-3">
            <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2"><Zap size={14} /> Intent Signals</h3>
            {signals.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {signals.map(s => <span key={s} className="badge bg-amber-50 text-amber-700 text-xs">{s}</span>)}
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {company.flags?.map(f => <span key={f} className="badge bg-brand-50 text-brand-700 text-xs">{f.replace(/_/g, ' ')}</span>)}
              </div>
            )}
          </div>
        </div>

        {/* Column 2: Contacts */}
        <div className="space-y-4">
          <div className="card p-4 space-y-3">
            <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2"><UsersIcon size={14} /> Decision-Makers ({namedContacts.length} named)</h3>
            {namedContacts.length === 0 ? (
              <div className="p-3 bg-yellow-50 rounded-lg text-sm text-yellow-700">
                <p className="font-medium">No named contacts yet</p>
                <p className="text-xs mt-1">Visit <a href={`https://${company.website}/about`} target="_blank" rel="noopener noreferrer" className="underline">{company.website}/about</a> or search LinkedIn to find contacts.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {namedContacts.map(ct => (
                  <div key={ct.id} className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium text-sm">{ct.name}</p>
                    <p className="text-xs text-gray-500">{ct.title}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="badge bg-indigo-50 text-indigo-700 text-[10px]">{ct.persona?.replace(/-/g, ' ')}</span>
                      {ct.linkedin && <a href={ct.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-xs flex items-center gap-0.5"><ExternalLink size={10} /> LinkedIn</a>}
                      {ct.email && <a href={`mailto:${ct.email}`} className="text-gray-600 hover:text-gray-800"><Mail size={12} /></a>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Leadership from website profile */}
            {profile?.leadership && profile.leadership.length > 0 && (
              <div className="mt-3 pt-3 border-t">
                <p className="text-xs font-medium text-gray-500 uppercase mb-2">From Website</p>
                <div className="space-y-1.5">
                  {profile.leadership.map((l, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                      <span className="font-medium text-gray-700">{l.name}</span>
                      <span className="text-gray-400">—</span>
                      <span className="text-gray-500">{l.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Column 3: Dossier */}
        <div className="space-y-4">
          {dossier ? (
            <div className="card p-4 space-y-3">
              <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2"><FileText size={14} /> Intelligence Dossier</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Opening Line</p>
                  <p className="text-gray-700 italic">"{dossier.openingLine}"</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Key Trigger</p>
                  <p className="text-gray-700">{dossier.trigger}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Deal Size</p>
                  <p className="text-gray-700 font-medium">{dossier.dealSize}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Pain Points</p>
                  <ul className="list-disc list-inside text-gray-600 space-y-0.5">
                    {dossier.painPoints?.map((p, i) => <li key={i}>{p}</li>)}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Recent News</p>
                  <p className="text-gray-600">{dossier.recentNews}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="card p-4 space-y-3">
              <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2"><Briefcase size={14} /> Quick Intel</h3>
              <div className="space-y-2 text-sm">
                <div className="p-2 bg-gray-50 rounded">
                  <span className="text-xs text-gray-500">Sector:</span>
                  <span className="ml-2 text-gray-700">{SECTOR_CONFIG[company.sector]?.label}</span>
                </div>
                <div className="p-2 bg-gray-50 rounded">
                  <span className="text-xs text-gray-500">Sub-sector:</span>
                  <span className="ml-2 text-gray-700">{company.subSector}</span>
                </div>
                <div className="p-2 bg-gray-50 rounded">
                  <span className="text-xs text-gray-500">Ownership:</span>
                  <span className="ml-2 text-gray-700">{company.ownership}{company.ngxListed ? ' (NGX Listed)' : ''}</span>
                </div>
                {company.parent && (
                  <div className="p-2 bg-gray-50 rounded">
                    <span className="text-xs text-gray-500">Parent:</span>
                    <span className="ml-2 text-gray-700">{company.parent}</span>
                  </div>
                )}
                <div className="p-2 bg-gray-50 rounded">
                  <span className="text-xs text-gray-500">ICP Tier:</span>
                  <span className={`ml-2 badge ${sc.class}`}>{company.score} {sc.label}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Activity Log */}
      <div className="card p-4 space-y-3">
        <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2"><MessageSquare size={14} /> Activity Log</h3>
        <div className="flex gap-2">
          <input className="input flex-1" placeholder="Add a note or activity..." value={noteText} onChange={e => setNoteText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddNote()} />
          <button onClick={handleAddNote} className="btn-primary flex items-center gap-1"><Plus size={14} />Add</button>
        </div>
        <div className="space-y-2 mt-3">
          {activities.length === 0 ? <p className="text-sm text-gray-400">No activities yet</p> : activities.map(a => (
            <div key={a.id} className="flex gap-3 p-2 rounded-lg bg-gray-50 text-sm group">
              <div className="w-2 h-2 rounded-full bg-brand-500 mt-1.5 shrink-0" />
              <div className="flex-1">
                <p className="text-gray-700">{a.notes}</p>
                <p className="text-xs text-gray-400 mt-0.5">{new Date(a.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              <button onClick={() => { deleteActivity(id, a.id); setActivities(getActivities(id)); }} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity text-xs shrink-0" title="Delete">✕</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
