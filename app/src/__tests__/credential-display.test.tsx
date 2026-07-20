import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { Credential } from '../../contracts/api/credentials';

// ── Mock data ────────────────────────────────────────────────────────────

const MOCK_CREDENTIALS: Credential[] = [
  {
    id: 'cred-1',
    certificate_number: 'SAB-202607-00001',
    user_id: 'user-1',
    course_id: 'course-1',
    course_title: 'AML/KYC Compliance for Nigerian Financial Institutions',
    credential_json: {},
    verification_url: 'https://sabificate.com/verify/cred-1',
    qr_code_url: 'https://sabificate.com/verify/cred-1',
    status: 'active',
    credential_tier: 'completion_badge',
    assessment_score: null,
    cpd_hours_awarded: null,
    co_brand_org_id: null,
    co_brand_logo_url: null,
    co_brand_signatory: null,
    issued_at: '2026-06-15T10:00:00.000Z',
    expires_at: null,
  },
  {
    id: 'cred-2',
    certificate_number: 'SAB-202607-00002',
    user_id: 'user-1',
    course_id: 'course-2',
    course_title: 'Nigeria Data Protection Act (NDPA) 2023 Compliance',
    credential_json: {},
    verification_url: 'https://sabificate.com/verify/cred-2',
    qr_code_url: 'https://sabificate.com/verify/cred-2',
    status: 'active',
    credential_tier: 'verified_certificate',
    assessment_score: 85,
    cpd_hours_awarded: 4,
    co_brand_org_id: null,
    co_brand_logo_url: null,
    co_brand_signatory: null,
    issued_at: '2026-07-01T14:30:00.000Z',
    expires_at: null,
  },
];

// ── Mocks ────────────────────────────────────────────────────────────────

const mockApiGet = vi.fn();

vi.mock('../lib/api/client', () => ({
  api: {
    get: (...args: unknown[]) => mockApiGet(...args),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
  setAccessToken: vi.fn(),
}));

import { CredentialList } from '../components/credentials/CredentialList';
import { CredentialDetail } from '../components/credentials/CredentialDetail';

// ── Test suite ──────────────────────────────────────────────────────────

describe('Credential Display', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── AC-8.1: CredentialList renders 2 cards with course title and date ──

  it('renders 2 credential cards with course title and issued date', async () => {
    mockApiGet.mockResolvedValue({ credentials: MOCK_CREDENTIALS });

    const handleSelect = vi.fn();

    render(
      <MemoryRouter>
        <CredentialList onSelect={handleSelect} />
      </MemoryRouter>,
    );

    // Wait for credentials to load
    await waitFor(() => {
      expect(
        screen.getByText('AML/KYC Compliance for Nigerian Financial Institutions'),
      ).toBeTruthy();
    }, { timeout: 5000 });

    // Both credential cards should be visible
    expect(
      screen.getByText('Nigeria Data Protection Act (NDPA) 2023 Compliance'),
    ).toBeTruthy();

    // Dates should be formatted in en-NG locale (day month year)
    expect(screen.getByText('15 Jun 2026')).toBeTruthy();
    expect(screen.getByText('1 Jul 2026')).toBeTruthy();

    // Tier badges should be present
    expect(screen.getByText('Completion Badge')).toBeTruthy();
    expect(screen.getByText('Verified Certificate')).toBeTruthy();
  });

  // ── AC-8.2: Clicking credential card shows CredentialDetail ───────────

  it('calls onSelect when a credential card is clicked', async () => {
    mockApiGet.mockResolvedValue({ credentials: MOCK_CREDENTIALS });

    const handleSelect = vi.fn();

    render(
      <MemoryRouter>
        <CredentialList onSelect={handleSelect} />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(
        screen.getByText('AML/KYC Compliance for Nigerian Financial Institutions'),
      ).toBeTruthy();
    }, { timeout: 5000 });

    // Click the first credential card
    const firstCard = screen.getByText('AML/KYC Compliance for Nigerian Financial Institutions');
    fireEvent.click(firstCard);

    expect(handleSelect).toHaveBeenCalledWith(MOCK_CREDENTIALS[0]);
  });

  // ── AC-8.3: CredentialDetail shows full info ──────────────────────────

  it('renders CredentialDetail with full credential information', () => {
    const credential = MOCK_CREDENTIALS[1]; // The verified certificate
    const handleBack = vi.fn();

    render(
      <MemoryRouter>
        <CredentialDetail credential={credential} onBack={handleBack} />
      </MemoryRouter>,
    );

    // Course title
    expect(
      screen.getByText('Nigeria Data Protection Act (NDPA) 2023 Compliance'),
    ).toBeTruthy();

    // Certificate number
    expect(screen.getByText('SAB-202607-00002')).toBeTruthy();

    // Status
    expect(screen.getByText('Active')).toBeTruthy();

    // Issued date (en-NG long format)
    expect(screen.getByText('1 July 2026')).toBeTruthy();

    // Assessment score (label + value in separate elements)
    expect(screen.getByText('Score')).toBeTruthy();
    expect(screen.getByText('85%')).toBeTruthy();

    // CPD hours (label + value in separate elements)
    expect(screen.getByText('CPD Hours')).toBeTruthy();
    expect(screen.getByText('4 hours')).toBeTruthy();

    // Verification link button
    expect(screen.getByText('Share verification link')).toBeTruthy();

    // Back button
    expect(screen.getByText('Back to credentials')).toBeTruthy();
  });
});
