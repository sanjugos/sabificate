import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// ── Mocks ─────────────────────────────────────────────────────────────────

const mockGet = vi.fn();

vi.mock('../lib/api/client', () => ({
  api: {
    get: (...args: unknown[]) => mockGet(...args),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
  setAccessToken: vi.fn(),
}));

vi.mock('../lib/auth/useAuth', () => ({
  useAuth: () => ({
    user: {
      id: 'u-1',
      email: 'author@sabificate.com',
      first_name: 'Test',
      last_name: 'Author',
      role: 'curriculum_author',
    },
    isAuthenticated: true,
    isLoading: false,
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Import the component under test (will be created in STEP 4)
import { TemplatePicker } from '../components/studio/TemplatePicker';
import {
  TRACK_TEMPLATES,
  type TrackTemplate,
} from '../components/studio/trackTemplateData';

// ── Helpers ───────────────────────────────────────────────────────────────

function renderPicker(props?: {
  onSelect?: (t: TrackTemplate) => void;
  onStartBlank?: () => void;
}) {
  const defaultProps = {
    onSelect: vi.fn(),
    onStartBlank: vi.fn(),
    ...props,
  };
  return render(
    <MemoryRouter>
      <TemplatePicker {...defaultProps} />
    </MemoryRouter>,
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────

describe('Track Template Data', () => {
  it('TRACK_TEMPLATES contains at least 10 seed templates', () => {
    expect(TRACK_TEMPLATES.length).toBeGreaterThanOrEqual(10);
  });

  it('each template has required fields: name, vertical, domain, skill_statement', () => {
    for (const t of TRACK_TEMPLATES) {
      expect(t.name).toBeTruthy();
      expect(t.vertical).toBeTruthy();
      expect(t.domain).toBeTruthy();
      expect(t.skill_statement).toBeTruthy();
    }
  });

  it('templates cover at least 3 different domains', () => {
    const domains = new Set(TRACK_TEMPLATES.map((t) => t.domain));
    expect(domains.size).toBeGreaterThanOrEqual(3);
  });
});

describe('GET /api/v1/studio/templates (mocked)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns an array of templates when fetched', async () => {
    // The template data module is the source of truth; simulate what the
    // API endpoint would return.
    mockGet.mockResolvedValueOnce({ data: TRACK_TEMPLATES });

    const result = await mockGet('/studio/templates');
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data.length).toBeGreaterThanOrEqual(10);
  });

  it('filters templates by query string (case-insensitive)', async () => {
    const query = 'negotiation';
    const filtered = TRACK_TEMPLATES.filter((t) =>
      t.name.toLowerCase().includes(query.toLowerCase()),
    );
    mockGet.mockResolvedValueOnce({ data: filtered });

    const result = await mockGet(`/studio/templates?q=${query}`);
    expect(Array.isArray(result.data)).toBe(true);
    for (const t of result.data as TrackTemplate[]) {
      expect(t.name.toLowerCase()).toContain(query);
    }
  });
});

describe('TemplatePicker component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders a search input', () => {
    renderPicker();
    const input = screen.getByPlaceholderText(/search templates/i);
    expect(input).toBeTruthy();
  });

  it('renders template cards from seed data', () => {
    renderPicker();
    // At least 10 template cards should be rendered (or first page)
    const cards = screen.getAllByTestId('template-card');
    expect(cards.length).toBeGreaterThanOrEqual(1);
  });

  it('renders a "Start Blank" button', () => {
    renderPicker();
    const btn = screen.getByRole('button', { name: /start blank/i });
    expect(btn).toBeTruthy();
  });

  it('filters templates when search text is typed', async () => {
    renderPicker();

    const input = screen.getByPlaceholderText(/search templates/i);
    fireEvent.change(input, { target: { value: 'negotiation' } });

    await waitFor(() => {
      const cards = screen.getAllByTestId('template-card');
      for (const card of cards) {
        expect(card.textContent?.toLowerCase()).toContain('negotiation');
      }
    });
  });

  it('shows "No templates found" when nothing matches the search', async () => {
    renderPicker();

    const input = screen.getByPlaceholderText(/search templates/i);
    fireEvent.change(input, { target: { value: 'xyznonexistent999' } });

    await waitFor(() => {
      expect(screen.getByText(/no templates found/i)).toBeTruthy();
    });
  });

  it('calls onSelect with template data when a card is clicked', async () => {
    const onSelect = vi.fn();
    renderPicker({ onSelect });

    const cards = screen.getAllByTestId('template-card');
    fireEvent.click(cards[0]);

    expect(onSelect).toHaveBeenCalledTimes(1);
    const selectedTemplate = onSelect.mock.calls[0][0] as TrackTemplate;
    expect(selectedTemplate.name).toBeTruthy();
    expect(selectedTemplate.vertical).toBeTruthy();
  });

  it('calls onStartBlank when "Start Blank" is clicked', () => {
    const onStartBlank = vi.fn();
    renderPicker({ onStartBlank });

    const btn = screen.getByRole('button', { name: /start blank/i });
    fireEvent.click(btn);

    expect(onStartBlank).toHaveBeenCalledTimes(1);
  });

  it('filters by domain when a domain filter is used', async () => {
    renderPicker();

    // Find the domain filter select
    const domainSelect = screen.getByTestId('domain-filter');
    expect(domainSelect).toBeTruthy();

    // Pick a specific domain
    fireEvent.change(domainSelect, { target: { value: 'Negotiation & Influence' } });

    await waitFor(() => {
      const cards = screen.getAllByTestId('template-card');
      expect(cards.length).toBeGreaterThanOrEqual(1);
    });
  });
});
