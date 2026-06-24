import { useState, useEffect, useCallback } from 'react';
import { api } from '../../lib/api/client';

interface ConceptEntry {
  id: string;
  concept_id: string;
  name: string;
  domain: string;
  prerequisites: string[];
  spine_position: number | null;
  created_at: string;
}

export default function ConceptCatalog() {
  const [entries, setEntries] = useState<ConceptEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [domainFilter, setDomainFilter] = useState('All');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  // ── Form state ──────────────────────────────────────────────────────────
  const [formConceptId, setFormConceptId] = useState('');
  const [formName, setFormName] = useState('');
  const [formDomain, setFormDomain] = useState('');
  const [formPrerequisites, setFormPrerequisites] = useState('');
  const [formSpinePosition, setFormSpinePosition] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // ── Fetch catalog ───────────────────────────────────────────────────────

  const fetchCatalog = useCallback(async (q?: string, domain?: string) => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (domain && domain !== 'All') params.set('domain', domain);
      const qs = params.toString();
      const path = `/studio/concept-catalog${qs ? `?${qs}` : ''}`;
      const result = await api.get<{ data: ConceptEntry[] }>(path);
      setEntries(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load concept catalog');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  // ── Derived data ────────────────────────────────────────────────────────

  const domains = ['All', ...Array.from(new Set(entries.map((e) => e.domain).filter(Boolean)))];

  // ── Search handler ──────────────────────────────────────────────────────

  const handleSearch = () => {
    fetchCatalog(searchQuery, domainFilter);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleDomainChange = (domain: string) => {
    setDomainFilter(domain);
    fetchCatalog(searchQuery, domain);
  };

  // ── Create concept ──────────────────────────────────────────────────────

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      const body: {
        concept_id: string;
        name: string;
        domain: string;
        prerequisites?: string[];
        spine_position?: number;
      } = {
        concept_id: formConceptId.trim(),
        name: formName.trim(),
        domain: formDomain.trim(),
      };
      if (formPrerequisites.trim()) {
        body.prerequisites = formPrerequisites
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
      }
      if (formSpinePosition.trim()) {
        body.spine_position = parseInt(formSpinePosition, 10);
      }
      await api.post<{ status: string; data: ConceptEntry }>(
        '/studio/concept-catalog',
        body,
      );
      // Reset form
      setFormConceptId('');
      setFormName('');
      setFormDomain('');
      setFormPrerequisites('');
      setFormSpinePosition('');
      setShowForm(false);
      // Refresh list
      fetchCatalog(searchQuery, domainFilter);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create concept');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Concept Catalog</h2>
          <p className="text-sm text-gray-600 mt-1">
            Reusable competency concepts with stable IDs for cross-track linking
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
        >
          {showForm ? 'Cancel' : '+ Add Concept'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">
            dismiss
          </button>
        </div>
      )}

      {/* ── Add Concept Form ─────────────────────────────────────────────── */}

      {showForm && (
        <div className="mb-6 border border-gray-200 rounded-lg p-4 bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">New Concept</h3>
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Concept ID (slug)
                </label>
                <input
                  type="text"
                  value={formConceptId}
                  onChange={(e) => setFormConceptId(e.target.value)}
                  placeholder="e.g. aml-fundamentals-001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. AML Fundamentals"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Domain</label>
                <input
                  type="text"
                  value={formDomain}
                  onChange={(e) => setFormDomain(e.target.value)}
                  placeholder="e.g. compliance"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Spine Position
                </label>
                <input
                  type="number"
                  min={0}
                  value={formSpinePosition}
                  onChange={(e) => setFormSpinePosition(e.target.value)}
                  placeholder="Optional"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prerequisites (comma-separated concept IDs)
              </label>
              <input
                type="text"
                value={formPrerequisites}
                onChange={(e) => setFormPrerequisites(e.target.value)}
                placeholder="e.g. kyc-basics-001, risk-intro-001"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              disabled={submitting || !formConceptId.trim() || !formName.trim() || !formDomain.trim()}
              className="w-full py-2 px-4 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Creating...' : 'Create Concept'}
            </button>
          </form>
        </div>
      )}

      {/* ── Search & Filter ──────────────────────────────────────────────── */}

      <div className="flex items-center gap-3 mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search by name or domain..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <select
          value={domainFilter}
          onChange={(e) => handleDomainChange(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
        >
          {domains.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <button
          onClick={handleSearch}
          className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 border border-gray-300"
        >
          Search
        </button>
      </div>

      {/* ── Results ──────────────────────────────────────────────────────── */}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        </div>
      )}

      {!loading && entries.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg font-medium">No concepts found</p>
          <p className="text-sm mt-1">Add your first concept or adjust your search.</p>
        </div>
      )}

      {!loading && entries.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="border border-gray-200 rounded-md p-4 hover:border-blue-300 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-gray-900 truncate">
                    {entry.name}
                  </h3>
                  <code className="text-xs text-gray-500 font-mono">{entry.concept_id}</code>
                </div>
                <span className="inline-block ml-2 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium shrink-0">
                  {entry.domain}
                </span>
              </div>

              {entry.spine_position != null && (
                <p className="text-xs text-gray-500 mb-1">
                  Spine position: <span className="font-medium">{entry.spine_position}</span>
                </p>
              )}

              {entry.prerequisites && entry.prerequisites.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-gray-500 mb-1">Prerequisites:</p>
                  <div className="flex flex-wrap gap-1">
                    {entry.prerequisites.map((prereq) => (
                      <span
                        key={prereq}
                        className="inline-block px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 text-xs font-mono"
                      >
                        {prereq}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
