import { useState, useMemo } from 'react';
import { TRACK_TEMPLATES, type TrackTemplate } from './trackTemplateData';

interface TemplatePickerProps {
  onSelect: (template: TrackTemplate) => void;
  onStartBlank: () => void;
}

export function TemplatePicker({ onSelect, onStartBlank }: TemplatePickerProps) {
  const [search, setSearch] = useState('');
  const [domainFilter, setDomainFilter] = useState('');

  // Derive unique domains from seed data for the filter dropdown
  const domains = useMemo(() => {
    const set = new Set(TRACK_TEMPLATES.map((t) => t.domain));
    return Array.from(set).sort();
  }, []);

  // Filter templates by search text (case-insensitive) and domain
  const filtered = useMemo(() => {
    let result = TRACK_TEMPLATES;

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.domain.toLowerCase().includes(q) ||
          t.skill_statement.toLowerCase().includes(q),
      );
    }

    if (domainFilter) {
      result = result.filter((t) => t.domain === domainFilter);
    }

    return result;
  }, [search, domainFilter]);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">
          Start from a Template
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Choose a pre-populated template from the Gbitse catalogue, or start
          blank.
        </p>
      </div>

      {/* Search + domain filter row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search templates..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <select
          data-testid="domain-filter"
          value={domainFilter}
          onChange={(e) => setDomainFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
        >
          <option value="">All domains</option>
          {domains.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      {/* Template cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-8 text-gray-500 text-sm">
          No templates found. Try adjusting your search or start blank.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((t) => (
            <div
              key={t.id}
              data-testid="template-card"
              onClick={() => onSelect(t)}
              className="border border-gray-200 rounded-md p-4 hover:border-blue-400 hover:shadow-sm cursor-pointer transition-colors"
            >
              <h4 className="text-sm font-semibold text-gray-900">{t.name}</h4>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-block px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                  {t.domain}
                </span>
                <span className="text-xs text-gray-500">{t.vertical}</span>
              </div>
              <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                {t.skill_statement}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Start Blank button */}
      <div className="pt-2 border-t border-gray-100">
        <button
          type="button"
          onClick={onStartBlank}
          className="w-full py-2 px-4 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50"
        >
          Start Blank
        </button>
      </div>
    </div>
  );
}
