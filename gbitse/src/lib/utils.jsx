export const SECTOR_CONFIG = {
  banking: { label: 'Banking & Financial Services', color: 'banking', icon: 'Landmark', shortLabel: 'Banking' },
  conglomerates: { label: 'Conglomerates & Industrials', color: 'conglomerates', icon: 'Factory', shortLabel: 'Conglomerates' },
  'consumer-goods': { label: 'Consumer Goods & FMCG', color: 'conglomerates', icon: 'Package', shortLabel: 'Consumer Goods' },
  education: { label: 'Education', color: 'government', icon: 'GraduationCap', shortLabel: 'Education' },
  fintech: { label: 'Fintech & Tech', color: 'fintech', icon: 'Cpu', shortLabel: 'Fintech' },
  government: { label: 'Government Agencies', color: 'government', icon: 'Building2', shortLabel: 'Government' },
  healthcare: { label: 'Healthcare & Pharma', color: 'insurance', icon: 'HeartPulse', shortLabel: 'Healthcare' },
  insurance: { label: 'Insurance', color: 'insurance', icon: 'ShieldCheck', shortLabel: 'Insurance' },
  logistics: { label: 'Logistics & Transport', color: 'conglomerates', icon: 'Truck', shortLabel: 'Logistics' },
  media: { label: 'Media & Entertainment', color: 'fintech', icon: 'Tv', shortLabel: 'Media' },
  'oil-gas': { label: 'Oil & Gas', color: 'conglomerates', icon: 'Flame', shortLabel: 'Oil & Gas' },
  pension: { label: 'Pension Fund Administration', color: 'pension', icon: 'Shield', shortLabel: 'Pension' },
  'professional-services': { label: 'Professional Services', color: 'government', icon: 'Briefcase', shortLabel: 'Prof. Services' },
  'real-estate': { label: 'Real Estate & Construction', color: 'conglomerates', icon: 'Building', shortLabel: 'Real Estate' },
  telecoms: { label: 'Telecommunications', color: 'fintech', icon: 'Radio', shortLabel: 'Telecoms' },
};

export const TIER_CONFIG = {
  hot: { label: 'Hot', min: 60, badge: 'badge-hot' },
  warm: { label: 'Warm', min: 40, badge: 'badge-warm' },
  cool: { label: 'Cool', min: 25, badge: 'badge-cool' },
  watch: { label: 'Watch', min: 0, badge: 'badge-watch' },
};

export const PERSONAS = {
  'hr-director': { label: 'HR Director / CPO', short: 'HR Dir' },
  'ld-manager': { label: 'L&D Manager', short: 'L&D' },
  'talent-specialist': { label: 'Talent Specialist', short: 'Talent' },
  'strategy-manager': { label: 'Strategy Manager', short: 'Strategy' },
  'corp-comms': { label: 'Corp Comms Manager', short: 'Comms' },
};

export const STATUS_OPTIONS = [
  'new', 'researched', 'contacted', 'engaged', 'proposal_sent', 'won', 'lost', 'parked'
];

export function sectorBadgeClass(sector) {
  return `badge badge-${sector}`;
}

export function tierBadgeClass(tier) {
  return `badge badge-${tier}`;
}

export function formatScore(score) {
  if (score >= 60) return { class: 'text-red-700 bg-red-50', label: 'Hot' };
  if (score >= 40) return { class: 'text-orange-700 bg-orange-50', label: 'Warm' };
  if (score >= 25) return { class: 'text-blue-700 bg-blue-50', label: 'Cool' };
  return { class: 'text-gray-600 bg-gray-50', label: 'Watch' };
}

export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

// Build sorted dropdown options with counts from an array of items
export function buildDropdownOptions(items, field, labelFn) {
  const counts = items.reduce((acc, item) => {
    const val = item[field];
    if (val) acc[val] = (acc[val] || 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([value, count]) => ({
      value,
      label: `${labelFn ? labelFn(value) : value} (${count})`,
      count
    }));
}

// Render sorted <option> elements with counts
export function DropdownOptions({ items, field, labelFn, allLabel = 'All', showTotalInAll = false }) {
  const options = buildDropdownOptions(items, field, labelFn);
  return (
    <>
      <option value="all">{allLabel}{showTotalInAll ? ` (${items.length})` : ''}</option>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </>
  );
}
