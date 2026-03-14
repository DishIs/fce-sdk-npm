// ─────────────────────────────────────────────────────────────────────────────
//  Domains resource — @freecustom/email SDK
// ─────────────────────────────────────────────────────────────────────────────
import type { HttpClient } from '../http.js';
import type {
  ApiResponse,
  DomainInfo,
  CustomDomain,
  AddCustomDomainResult,
  VerifyCustomDomainResult,
  RemoveCustomDomainResult,
} from '../types.js';

export class DomainsResource {
  constructor(private readonly http: HttpClient) {}

  /** List all platform domains available on your plan. */
  async list(): Promise<DomainInfo[]> {
    const res = await this.http.request<ApiResponse<DomainInfo[]>>('/domains');
    return res.data;
  }

  /** List all platform domains with full expiry metadata. */
  async listWithExpiry(): Promise<DomainInfo[]> {
    const res = await this.http.request<ApiResponse<DomainInfo[]>>('/domains/all');
    return res.data;
  }

  /** List custom domains on your account (Growth+ only). */
  async listCustom(): Promise<CustomDomain[]> {
    const res = await this.http.request<ApiResponse<CustomDomain[]>>('/custom-domains');
    return res.data;
  }

  /**
   * Add a custom domain (Growth+ only).
   * Returns DNS records to configure before verifying.
   */
  async addCustom(domain: string): Promise<AddCustomDomainResult> {
    const res = await this.http.request<{ success: boolean; data: AddCustomDomainResult }>(
      '/custom-domains',
      { method: 'POST', body: { domain } },
    );
    return res.data;
  }

  /**
   * Trigger DNS verification for a custom domain.
   * DNS propagation can take up to 48 hours.
   */
  async verifyCustom(domain: string): Promise<VerifyCustomDomainResult> {
    return this.http.request<VerifyCustomDomainResult>(
      `/custom-domains/${encodeURIComponent(domain)}/verify`,
      { method: 'POST', body: {} },
    );
  }

  /**
   * Remove a custom domain.
   * Also unregisters all API inboxes using that domain.
   */
  async removeCustom(domain: string): Promise<RemoveCustomDomainResult> {
    return this.http.request<RemoveCustomDomainResult>(
      `/custom-domains/${encodeURIComponent(domain)}`,
      { method: 'DELETE' },
    );
  }
}
