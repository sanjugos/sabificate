import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CourseCatalog } from '../components/catalog/CourseCatalog';

// ── Mocks ─────────────────────────────────────────────────────────────────

// Mock API client — make all API calls reject so we use static fallback data
vi.mock('../lib/api/client', () => ({
  api: {
    get: vi.fn().mockRejectedValue(new Error('API unavailable')),
    post: vi.fn().mockRejectedValue(new Error('API unavailable')),
    put: vi.fn().mockRejectedValue(new Error('API unavailable')),
    delete: vi.fn().mockRejectedValue(new Error('API unavailable')),
  },
  setAccessToken: vi.fn(),
}));

function renderCatalog() {
  return render(
    <MemoryRouter>
      <CourseCatalog />
    </MemoryRouter>,
  );
}

describe('CourseCatalog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── AC-3.1: Course cards render with titles ──────────────────────────

  it('renders course cards with titles from the static course catalog', async () => {
    renderCatalog();

    // The component renders static data immediately (no loading state for static).
    // Courses are sorted alphabetically; page 1 shows first 12.
    await waitFor(() => {
      expect(
        screen.getByText('AML/KYC Compliance for Nigerian Financial Institutions'),
      ).toBeTruthy();
    });

    // Verify the heading
    expect(screen.getByText('Course Catalog')).toBeTruthy();

    // Check another course on page 1 is rendered (also alphabetically early)
    expect(
      screen.getByText('Better Business Presentations & Executive Communication'),
    ).toBeTruthy();
  });

  it('displays difficulty tier badges on course cards', async () => {
    renderCatalog();

    await waitFor(() => {
      expect(
        screen.getByText('AML/KYC Compliance for Nigerian Financial Institutions'),
      ).toBeTruthy();
    });

    // Difficulty badges should be rendered (Working, Foundational, Applied)
    // The CourseCard capitalizes the first letter of difficulty_level
    const workingBadges = screen.getAllByText('Working');
    expect(workingBadges.length).toBeGreaterThan(0);

    const foundationalBadges = screen.getAllByText('Foundational');
    expect(foundationalBadges.length).toBeGreaterThan(0);
  });

  it('displays category labels on course cards', async () => {
    renderCatalog();

    await waitFor(() => {
      expect(
        screen.getByText('AML/KYC Compliance for Nigerian Financial Institutions'),
      ).toBeTruthy();
    });

    // Category names should appear as pills on the cards
    const bankingLabels = screen.getAllByText('Banking & Finance');
    expect(bankingLabels.length).toBeGreaterThan(0);
  });

  // ── AC-3.2: Search filtering ────────────────────────────────────────

  it('filters courses when a search query is typed', async () => {
    renderCatalog();

    // Wait for initial render
    await waitFor(() => {
      expect(
        screen.getByText('AML/KYC Compliance for Nigerian Financial Institutions'),
      ).toBeTruthy();
    });

    const searchInput = screen.getByPlaceholderText('Search courses...');
    expect(searchInput).toBeTruthy();

    // Type a specific search term that matches only one course
    fireEvent.change(searchInput, { target: { value: 'NDPA' } });

    // Wait for debounce (300ms) and re-render
    await waitFor(
      () => {
        // The NDPA course should still be visible
        expect(
          screen.getByText('Nigeria Data Protection Act (NDPA) 2023 Compliance'),
        ).toBeTruthy();

        // A course that does NOT match should be gone
        expect(
          screen.queryByText('AML/KYC Compliance for Nigerian Financial Institutions'),
        ).toBeNull();
      },
      { timeout: 2000 },
    );
  });

  it('shows "No courses found" when search matches nothing', async () => {
    renderCatalog();

    await waitFor(() => {
      expect(screen.getByText('Course Catalog')).toBeTruthy();
    });

    const searchInput = screen.getByPlaceholderText('Search courses...');
    fireEvent.change(searchInput, {
      target: { value: 'xyznonexistentcourse12345' },
    });

    await waitFor(
      () => {
        expect(
          screen.getByText('No courses found. Try adjusting your search or filters.'),
        ).toBeTruthy();
      },
      { timeout: 2000 },
    );
  });

  // ── AC-3.3: Category filter ─────────────────────────────────────────

  it('filters courses by category when a category is selected', async () => {
    renderCatalog();

    await waitFor(() => {
      expect(
        screen.getByText('AML/KYC Compliance for Nigerian Financial Institutions'),
      ).toBeTruthy();
    });

    // Find the category select (first select element)
    const selects = screen.getAllByRole('combobox');
    const categorySelect = selects[0]; // First select is categories

    // Select "Governance & Compliance" category
    fireEvent.change(categorySelect, {
      target: { value: 'governance-compliance' },
    });

    await waitFor(() => {
      // NDPA Compliance is in Governance & Compliance
      expect(
        screen.getByText('Nigeria Data Protection Act (NDPA) 2023 Compliance'),
      ).toBeTruthy();

      // AML/KYC is in Banking & Finance — should be filtered out
      expect(
        screen.queryByText('AML/KYC Compliance for Nigerian Financial Institutions'),
      ).toBeNull();
    });
  });

  // ── AC-3.4: Difficulty filter ───────────────────────────────────────

  it('filters courses by difficulty level when a level is selected', async () => {
    renderCatalog();

    await waitFor(() => {
      expect(
        screen.getByText('AML/KYC Compliance for Nigerian Financial Institutions'),
      ).toBeTruthy();
    });

    // Find the difficulty select (second select element)
    const selects = screen.getAllByRole('combobox');
    const difficultySelect = selects[1]; // Second select is difficulty

    // Select "Applied" difficulty
    fireEvent.change(difficultySelect, { target: { value: 'applied' } });

    await waitFor(() => {
      // "Corporate Governance for Nigerian Financial Services" is 'applied'
      expect(
        screen.getByText('Corporate Governance for Nigerian Financial Services'),
      ).toBeTruthy();

      // AML/KYC is 'working' — should be filtered out
      expect(
        screen.queryByText('AML/KYC Compliance for Nigerian Financial Institutions'),
      ).toBeNull();
    });
  });

  // ── Course count display ────────────────────────────────────────────

  it('displays the total course count', async () => {
    renderCatalog();

    await waitFor(() => {
      // Static courses has 33 courses; first page shows 12 so total display should say "33 courses"
      // (the count badge says "N courses" regardless of pagination)
      expect(screen.getByText(/33 courses/)).toBeTruthy();
    });
  });

  // ── Pagination ──────────────────────────────────────────────────────

  it('shows pagination when courses exceed page limit', async () => {
    renderCatalog();

    await waitFor(() => {
      expect(screen.getByText('Course Catalog')).toBeTruthy();
    });

    // 33 static courses / 12 per page = 3 pages
    expect(screen.getByText(/Page 1 of 3/)).toBeTruthy();
    expect(screen.getByRole('button', { name: /next/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /previous/i })).toBeTruthy();
  });
});
