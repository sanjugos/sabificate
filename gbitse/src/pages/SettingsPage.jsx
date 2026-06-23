import { useState } from 'react';
import { Settings, Database, Key, Trash2 } from 'lucide-react';
import { getStats } from '../lib/store';

export default function SettingsPage() {
  const stats = getStats();
  const [msg, setMsg] = useState('');

  const handleClear = () => {
    if (confirm('Clear all local overrides and activities? Company data will reset to defaults.')) {
      const keys = Object.keys(localStorage).filter(k => k.startsWith('gbitse-'));
      keys.forEach(k => localStorage.removeItem(k));
      setMsg('Local data cleared. Refresh to reload defaults.');
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Settings size={24} /> Settings</h1>
        <p className="text-sm text-gray-500">Configuration and data management</p>
      </div>

      <div className="card p-5 space-y-3">
        <h2 className="font-semibold flex items-center gap-2"><Database size={16} /> Data Summary</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="p-3 bg-gray-50 rounded-lg"><span className="text-gray-500">Companies</span><span className="float-right font-medium">{stats.total}</span></div>
          <div className="p-3 bg-gray-50 rounded-lg"><span className="text-gray-500">Contacts</span><span className="float-right font-medium">{stats.totalContacts}</span></div>
          <div className="p-3 bg-gray-50 rounded-lg"><span className="text-gray-500">Dossiers</span><span className="float-right font-medium">{stats.totalDossiers}</span></div>
          <div className="p-3 bg-gray-50 rounded-lg"><span className="text-gray-500">Hot Leads</span><span className="float-right font-medium">{stats.hot}</span></div>
          <div className="p-3 bg-gray-50 rounded-lg"><span className="text-gray-500">Clients</span><span className="float-right font-medium">{stats.clients}</span></div>
          <div className="p-3 bg-gray-50 rounded-lg"><span className="text-gray-500">Total Employees (tracked)</span><span className="float-right font-medium">{stats.totalEmployees?.toLocaleString()}</span></div>
        </div>
      </div>

      <div className="card p-5 space-y-3">
        <h2 className="font-semibold flex items-center gap-2"><Key size={16} /> Data Sources</h2>
        <p className="text-sm text-gray-600">30 verified Nigerian data sources across 6 categories.</p>
        <div className="text-xs text-gray-500 space-y-1">
          <p>Tier 1: CAC, CBN, PenCom, NAICOM, NGX, Google News RSS, BusinessDay RSS, CIPM, LinkedIn, Jobberman</p>
          <p>Tier 2: BusinessList.ng, VConnect, African Financials, LCCI, AllAfrica</p>
        </div>
      </div>

      <div className="card p-5 space-y-3">
        <h2 className="font-semibold">Local Data</h2>
        <button onClick={handleClear} className="flex items-center gap-2 px-4 py-2 rounded-lg text-red-700 bg-red-50 hover:bg-red-100 transition-colors text-sm"><Trash2 size={14} /> Clear Local Overrides</button>
        {msg && <p className="text-sm text-green-600">{msg}</p>}
      </div>
    </div>
  );
}
