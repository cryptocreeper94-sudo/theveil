export class OrbitEcosystemClient {
  private _apiKey?: string;
  private _apiSecret?: string;
  private hubUrl: string;
  private appName: string;

  constructor(apiKey?: string, apiSecret?: string, hubUrl = 'https://orbitstaffing.io') {
    this._apiKey = apiKey;
    this._apiSecret = apiSecret;
    this.hubUrl = hubUrl;
    this.appName = 'Trust Layer Gateway';
  }

  private get apiKey(): string {
    return this._apiKey || process.env.ORBIT_HUB_API_KEY || '';
  }

  private get apiSecret(): string {
    return this._apiSecret || process.env.ORBIT_HUB_API_SECRET || '';
  }

  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'X-API-Key': this.apiKey,
      'X-API-Secret': this.apiSecret,
      'X-App-Name': this.appName,
    };
  }

  async request<T = unknown>(method: string, path: string, data: unknown = null): Promise<T> {
    const body = data ? JSON.stringify(data) : '';

    const response = await fetch(`${this.hubUrl}${path}`, {
      method,
      headers: this.getHeaders(),
      body: data ? body : undefined,
    });
    return response.json() as T;
  }

  async checkStatus() {
    return this.request('GET', '/api/ecosystem/status');
  }

  async getApps() {
    // Use public endpoint (no auth required)
    const response = await fetch(`${this.hubUrl}/api/ecosystem/apps`);
    return response.json();
  }

  async syncWorkers(workers: unknown[]) {
    return this.request('POST', '/api/ecosystem/sync/workers', { workers });
  }

  async syncContractors(contractors: unknown[]) {
    return this.request('POST', '/api/ecosystem/sync/contractors', { contractors });
  }

  async syncTimesheets(timesheets: unknown[]) {
    return this.request('POST', '/api/ecosystem/sync/timesheets', { timesheets });
  }

  async getSnippets(category?: string, language?: string) {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (language) params.set('language', language);
    return this.request('GET', `/api/ecosystem/snippets?${params.toString()}`);
  }

  async pushSnippet(snippet: { title: string; code: string; language: string; category: string; description?: string }) {
    return this.request('POST', '/api/ecosystem/snippets', snippet);
  }

  async getLogs() {
    return this.request('GET', '/api/ecosystem/logs');
  }

  async log(event: { type: string; message: string; data?: unknown }) {
    return this.request('POST', '/api/ecosystem/logs', event);
  }

  async registerApp(appData: {
    appName: string;
    appSlug: string;
    appUrl?: string;
    description?: string;
    category?: string;
    permissions?: string[];
    metadata?: Record<string, unknown>;
  }) {
    return this.request('POST', '/api/admin/ecosystem/register-app', appData);
  }

  isConfigured(): boolean {
    return !!(this.apiKey && this.apiSecret);
  }
}

export const ecosystemClient = new OrbitEcosystemClient();
