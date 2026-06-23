import COMPANIES from '../data/companies';
import CONTACTS from '../data/contacts';
import DOSSIERS from '../data/dossiers';

let companies = [...COMPANIES];
let contacts = [...CONTACTS];
let listeners = [];

function notify() { listeners.forEach(fn => fn()); }

// Merge localStorage overrides on load
try {
  const overrides = JSON.parse(localStorage.getItem('gbitse-overrides') || '{}');
  companies = companies.map(c => overrides[c.id] ? { ...c, ...overrides[c.id] } : c);
} catch {}

export function getCompanies() { return companies; }
export function getCompany(id) { return companies.find(c => c.id === id); }
export function getContacts() { return contacts; }
export function getContactsForCompany(companyId) { return contacts.filter(c => c.companyId === companyId); }
export function getContact(id) { return contacts.find(c => c.id === id); }
export function getDossiers() { return DOSSIERS; }
export function getDossier(companyId) { return DOSSIERS.find(d => d.companyId === companyId); }

export function updateCompany(id, updates) {
  companies = companies.map(c => c.id === id ? { ...c, ...updates } : c);
  const overrides = JSON.parse(localStorage.getItem('gbitse-overrides') || '{}');
  overrides[id] = { ...(overrides[id] || {}), ...updates };
  localStorage.setItem('gbitse-overrides', JSON.stringify(overrides));
  notify();
}

export function getActivities(companyId) {
  try { return JSON.parse(localStorage.getItem(`gbitse-activities-${companyId}`) || '[]'); } catch { return []; }
}

export function addActivity(companyId, activity) {
  const acts = getActivities(companyId);
  acts.unshift({ ...activity, id: Date.now().toString(), createdAt: new Date().toISOString() });
  localStorage.setItem(`gbitse-activities-${companyId}`, JSON.stringify(acts));
  notify();
}

export function deleteActivity(companyId, activityId) {
  const acts = getActivities(companyId).filter(a => a.id !== activityId);
  localStorage.setItem(`gbitse-activities-${companyId}`, JSON.stringify(acts));
  notify();
}

export function subscribe(fn) { listeners.push(fn); return () => { listeners = listeners.filter(l => l !== fn); }; }

// Stats
export function getStats() {
  const all = companies;
  return {
    total: all.length,
    hot: all.filter(c => c.tier === 'hot').length,
    warm: all.filter(c => c.tier === 'warm').length,
    cool: all.filter(c => c.tier === 'cool').length,
    clients: all.filter(c => c.status === 'client').length,
    contacted: all.filter(c => c.status === 'contacted').length,
    bySector: Object.entries(all.reduce((a, c) => { a[c.sector] = (a[c.sector] || 0) + 1; return a; }, {})),
    totalContacts: contacts.length,
    totalDossiers: DOSSIERS.length,
    totalEmployees: all.reduce((s, c) => s + (c.employees || 0), 0),
  };
}
