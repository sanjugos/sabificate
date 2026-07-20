import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TrustClaimsPanel } from '../components/studio/TrustClaimsPanel';

// ── Mock api/client ─────────────────────────────────────────────────────
const mockGet = vi.fn();
const mockPut = vi.fn();

vi.mock('../lib/api/client', () => ({
  api: {
    get: (...args: unknown[]) => mockGet(...args),
    put: (...args: unknown[]) => mockPut(...args),
    post: vi.fn(),
    delete: vi.fn(),
  },
  setAccessToken: vi.fn(),
}));

// ── Test data ───────────────────────────────────────────────────────────

function makeClaim(overrides: Partial<{
  id: string;
  track_id: string;
  spine_node_index: number;
  depth_tier: string;
  claim_text: string;
  claim_type: string;
  source_url: string | null;
  source_label: string | null;
  verified: boolean;
  verified_by: string | null;
  verified_at: string | null;
}> = {}) {
  return {
    id: 'claim-1',
    track_id: 'track-abc',
    spine_node_index: 0,
    depth_tier: 'working',
    claim_text: 'CBN regulatory threshold of NGN 5 million for CTRs',
    claim_type: 'regulatory',
    source_url: null,
    source_label: null,
    verified: false,
    verified_by: null,
    verified_at: null,
    ...overrides,
  };
}

const TRACK_ID = 'track-abc';

describe('TrustClaimsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── AC-7.2: Claims are displayed with their type and text ─────────
  it('renders claims with their claim_text, claim_type badge, and depth_tier', async () => {
    const claims = [
      makeClaim({
        id: 'c1',
        claim_text: 'CBN regulatory threshold of NGN 5 million',
        claim_type: 'regulatory',
        depth_tier: 'working',
        spine_node_index: 0,
      }),
      makeClaim({
        id: 'c2',
        claim_text: 'FATF lists 40+9 recommendations',
        claim_type: 'statistical',
        depth_tier: 'applied',
        spine_node_index: 1,
      }),
    ];

    mockGet.mockResolvedValueOnce({ data: claims });

    render(<TrustClaimsPanel trackId={TRACK_ID} />);

    // Wait for claims to load
    await waitFor(() => {
      expect(screen.getByText('CBN regulatory threshold of NGN 5 million')).toBeTruthy();
    });

    // Both claims visible
    expect(screen.getByText('FATF lists 40+9 recommendations')).toBeTruthy();

    // Type badges visible
    expect(screen.getByText('regulatory')).toBeTruthy();
    expect(screen.getByText('statistical')).toBeTruthy();

    // Depth tier labels visible
    expect(screen.getByText('working')).toBeTruthy();
    expect(screen.getByText('applied')).toBeTruthy();
  });

  // ── AC-7.3: Clicking verify makes API call to update claim status ──
  it('calls PUT endpoint when the verify checkbox is clicked on an unverified claim', async () => {
    const claim = makeClaim({
      id: 'c-verify',
      verified: false,
      claim_text: 'Section 6(2) of the ML Act requires STR filing',
      claim_type: 'regulatory',
    });

    mockGet.mockResolvedValueOnce({ data: [claim] });

    // Mock the PUT response to return the updated claim
    const updatedClaim = { ...claim, verified: true, verified_by: 'user-1', verified_at: '2026-07-20T00:00:00Z' };
    mockPut.mockResolvedValueOnce(updatedClaim);

    render(<TrustClaimsPanel trackId={TRACK_ID} />);

    // Wait for claim to render
    await waitFor(() => {
      expect(screen.getByText('Section 6(2) of the ML Act requires STR filing')).toBeTruthy();
    });

    // Find the verify toggle button and click it
    const verifyButton = screen.getByTitle('Mark as verified');
    fireEvent.click(verifyButton);

    // Verify the PUT call was made with the correct path and body
    await waitFor(() => {
      expect(mockPut).toHaveBeenCalledWith(
        `/studio/tracks/${TRACK_ID}/trust-claims/c-verify`,
        { verified: true },
      );
    });
  });

  // ── AC-7.6: Unverified claims show publish-blocking indication ─────
  it('shows unverified count in summary when claims have not been verified', async () => {
    const claims = [
      makeClaim({ id: 'c-a', verified: false }),
      makeClaim({ id: 'c-b', verified: false, spine_node_index: 1 }),
      makeClaim({ id: 'c-c', verified: true, spine_node_index: 1 }),
    ];

    mockGet.mockResolvedValueOnce({ data: claims });

    render(<TrustClaimsPanel trackId={TRACK_ID} />);

    // Wait for the summary text showing verification progress
    await waitFor(() => {
      expect(screen.getByText('1 of 3 claims verified')).toBeTruthy();
    });

    // The progress bar should NOT be fully green (not all verified)
    // The bar uses bg-blue-500 when not all verified, bg-green-500 when all verified
    const progressBar = document.querySelector('.bg-blue-500');
    expect(progressBar).toBeTruthy();

    // The unverified claims should NOT have line-through styling
    const allClaimTexts = screen.getAllByText('CBN regulatory threshold of NGN 5 million for CTRs');
    // At least one unverified claim should have text-gray-900 and no line-through
    const unverifiedClaim = allClaimTexts.find(
      (el) => el.className.includes('text-gray-900') && !el.className.includes('line-through'),
    );
    expect(unverifiedClaim).toBeTruthy();
  });

  // ── Verified claims display with visual distinction ─────────────────
  it('displays verified claims with line-through and green verification date', async () => {
    const claim = makeClaim({
      id: 'c-verified',
      verified: true,
      verified_at: '2026-07-15T12:00:00Z',
      claim_text: 'NFIU requires 24-hour STR submission',
    });

    mockGet.mockResolvedValueOnce({ data: [claim] });

    render(<TrustClaimsPanel trackId={TRACK_ID} />);

    await waitFor(() => {
      expect(screen.getByText('NFIU requires 24-hour STR submission')).toBeTruthy();
    });

    // Verified claim should have line-through styling
    const claimText = screen.getByText('NFIU requires 24-hour STR submission');
    expect(claimText.className).toContain('line-through');
    expect(claimText.className).toContain('text-gray-500');

    // Verified date shown (specific green-colored verification date element)
    const verifiedDateEl = screen.getByText(/verified\s+\d/);
    expect(verifiedDateEl).toBeTruthy();
    expect(verifiedDateEl.className).toContain('text-green-600');
  });

  // ── All verified shows green progress bar ───────────────────────────
  it('shows green progress bar when all claims are verified', async () => {
    const claims = [
      makeClaim({ id: 'c-1', verified: true, verified_at: '2026-07-15T12:00:00Z' }),
      makeClaim({ id: 'c-2', verified: true, verified_at: '2026-07-15T12:00:00Z', spine_node_index: 1 }),
    ];

    mockGet.mockResolvedValueOnce({ data: claims });

    render(<TrustClaimsPanel trackId={TRACK_ID} />);

    await waitFor(() => {
      expect(screen.getByText('2 of 2 claims verified')).toBeTruthy();
    });

    // Progress bar should be green when all verified
    const greenBar = document.querySelector('.bg-green-500');
    expect(greenBar).toBeTruthy();
  });

  // ── AC-7.3: Contradict action marks claim as contradicted ───────────
  it('shows a "Contradict" button on unverified claims and calls PUT with contradicted status', async () => {
    const claim = makeClaim({
      id: 'c-contradict',
      verified: false,
      claim_text: 'Incorrect assertion about CBN thresholds',
      claim_type: 'numeric',
    });

    mockGet.mockResolvedValueOnce({ data: [claim] });
    const updatedClaim = { ...claim, status: 'contradicted' };
    mockPut.mockResolvedValueOnce(updatedClaim);

    render(<TrustClaimsPanel trackId={TRACK_ID} />);

    await waitFor(() => {
      expect(screen.getByText('Incorrect assertion about CBN thresholds')).toBeTruthy();
    });

    // Should have a Contradict button
    const contradictButton = screen.getByText('Contradict');
    expect(contradictButton).toBeTruthy();

    fireEvent.click(contradictButton);

    await waitFor(() => {
      expect(mockPut).toHaveBeenCalledWith(
        `/studio/tracks/${TRACK_ID}/trust-claims/c-contradict`,
        { status: 'contradicted' },
      );
    });
  });

  // ── AC-7.3: Unsource action clears source from a claim ─────────────
  it('shows an "Unsource" button on sourced claims and clears source fields', async () => {
    const claim = makeClaim({
      id: 'c-unsource',
      verified: false,
      source_url: 'https://example.com/source',
      source_label: 'Some Source',
      claim_text: 'Claim with existing source',
      claim_type: 'citation',
    });

    mockGet.mockResolvedValueOnce({ data: [claim] });
    const updatedClaim = { ...claim, source_url: null, source_label: null };
    mockPut.mockResolvedValueOnce(updatedClaim);

    render(<TrustClaimsPanel trackId={TRACK_ID} />);

    await waitFor(() => {
      expect(screen.getByText('Claim with existing source')).toBeTruthy();
    });

    // Should have an Unsource button for claims that have a source but aren't verified
    const unsourceButton = screen.getByText('unsource');
    expect(unsourceButton).toBeTruthy();

    fireEvent.click(unsourceButton);

    await waitFor(() => {
      expect(mockPut).toHaveBeenCalledWith(
        `/studio/tracks/${TRACK_ID}/trust-claims/c-unsource`,
        { source_url: null, source_label: null },
      );
    });
  });

  // ── Save & Verify workflow through source editing ───────────────────
  it('opens source editor when "+ Add source" is clicked, and saves with verify', async () => {
    const claim = makeClaim({
      id: 'c-source',
      verified: false,
      source_url: null,
      source_label: null,
      claim_text: 'ML Act 2022 section reference',
    });

    mockGet.mockResolvedValueOnce({ data: [claim] });
    const updatedClaim = {
      ...claim,
      source_url: 'https://example.com/ml-act',
      source_label: 'ML Act 2022',
      verified: true,
    };
    mockPut.mockResolvedValueOnce(updatedClaim);

    render(<TrustClaimsPanel trackId={TRACK_ID} />);

    await waitFor(() => {
      expect(screen.getByText('ML Act 2022 section reference')).toBeTruthy();
    });

    // Click "+ Add source" to open editor
    const addSourceButton = screen.getByText('+ Add source');
    fireEvent.click(addSourceButton);

    // Fill in source fields
    const urlInput = screen.getByPlaceholderText('https://...');
    const labelInput = screen.getByPlaceholderText('e.g., CBN Annual Report 2025');
    fireEvent.change(urlInput, { target: { value: 'https://example.com/ml-act' } });
    fireEvent.change(labelInput, { target: { value: 'ML Act 2022' } });

    // Click "Save & Verify"
    const saveVerifyButton = screen.getByText('Save & Verify');
    fireEvent.click(saveVerifyButton);

    // Verify the PUT call includes source fields and verified flag
    await waitFor(() => {
      expect(mockPut).toHaveBeenCalledWith(
        `/studio/tracks/${TRACK_ID}/trust-claims/c-source`,
        {
          source_url: 'https://example.com/ml-act',
          source_label: 'ML Act 2022',
          verified: true,
        },
      );
    });
  });
});
