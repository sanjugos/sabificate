import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { VerifyPage } from '../components/credentials/VerifyPage';

// Mock the API client
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

function renderVerifyPage(credentialId: string) {
  return render(
    <MemoryRouter initialEntries={[`/verify/${credentialId}`]}>
      <Routes>
        <Route path="/verify/:credentialId" element={<VerifyPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('VerifyPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays learner name, course title, completion date, and Verified marker for a valid credential', async () => {
    mockGet.mockResolvedValue({
      valid: true,
      credential: {
        id: 'cred-123',
        certificate_number: 'SAB-202601-00001',
        user_id: 'user-1',
        course_id: 'course-1',
        course_title: 'Introduction to Data Science',
        credential_json: {},
        verification_url: 'https://sabificate.com/verify/cred-123',
        qr_code_url: 'https://sabificate.com/verify/cred-123',
        status: 'active',
        credential_tier: 'completion_badge',
        assessment_score: null,
        cpd_hours_awarded: null,
        co_brand_org_id: null,
        co_brand_logo_url: null,
        co_brand_signatory: null,
        issued_at: '2026-03-15T10:00:00.000Z',
        expires_at: null,
      },
      learner_name: 'Amina Okafor',
      course_title: 'Introduction to Data Science',
      issued_at: '2026-03-15T10:00:00.000Z',
      evidence_urls: [],
    });

    renderVerifyPage('cred-123');

    await waitFor(() => {
      expect(screen.getByText('Amina Okafor')).toBeTruthy();
    });

    expect(screen.getByText('Introduction to Data Science')).toBeTruthy();
    expect(screen.getByText('15 March 2026')).toBeTruthy();
    expect(screen.getByText('Valid Credential')).toBeTruthy();
  });

  it('displays "This credential could not be found" for a 404 and exposes no error details', async () => {
    mockGet.mockRejectedValue({
      name: 'ApiError',
      status: 404,
      message: 'Request failed (404)',
    });

    renderVerifyPage('nonexistent-id');

    await waitFor(() => {
      expect(
        screen.getByText('This credential could not be found'),
      ).toBeTruthy();
    });

    // Should NOT show raw error details or a generic "Verification failed" message
    expect(screen.queryByText('Request failed (404)')).toBeNull();
    expect(screen.queryByText('Verification failed')).toBeNull();
    expect(screen.queryByText('Verification Error')).toBeNull();
  });
});
