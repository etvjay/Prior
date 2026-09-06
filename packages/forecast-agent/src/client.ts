import {
  FIXTURE_PROVIDER_A,
  FIXTURE_PROVIDER_B,
  parseForecastRequestWire,
  parseForecastSubmissionAcceptedWire,
  parseForecastSubmissionWire,
  parseUnauthorizedExecutionResponseWire,
  serializeWire,
  type FixtureProviderProfile,
  type ForecastRequestWire,
  type ForecastSubmissionAcceptedWire,
  type ForecastSubmissionWire,
  type UnauthorizedExecutionResponseWire,
  type WireProviderIdentity,
} from "@prior/forecast-protocol";

export interface UnauthorizedExecutionRequest {
  readonly requestId: string;
  readonly marketId: string;
  readonly actionId: string;
}

export interface ForecastProviderClient {
  readonly provider: WireProviderIdentity;
  getForecastRequest(): Promise<ForecastRequestWire>;
  submitForecast(submission: ForecastSubmissionWire): Promise<ForecastSubmissionAcceptedWire>;
  getForecastSubmission(submissionId: string): Promise<ForecastSubmissionAcceptedWire>;
  requestExecution(request: UnauthorizedExecutionRequest): Promise<UnauthorizedExecutionResponseWire>;
}

export class ForecastProviderHttpError extends Error {
  public readonly status: number;
  public readonly body: unknown;

  public constructor(status: number, body: unknown) {
    super(`Forecast Provider HTTP request failed with status ${status}`);
    this.name = "ForecastProviderHttpError";
    this.status = status;
    this.body = body;
  }
}

export interface HttpForecastProviderClientOptions {
  readonly baseUrl: string;
  readonly profile: FixtureProviderProfile;
}

/** HTTP-only client. It has no dependency on Prior internal code. */
export class HttpForecastProviderClient implements ForecastProviderClient {
  public readonly provider: WireProviderIdentity;
  protected readonly profile: FixtureProviderProfile;
  private readonly baseUrl: string;

  public constructor(options: HttpForecastProviderClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.profile = options.profile;
    this.provider = options.profile.provider;
  }

  public async getForecastRequest(): Promise<ForecastRequestWire> {
    const query = new URLSearchParams({
      providerId: this.profile.provider.providerId,
      sessionId: this.profile.sessionId,
    });
    const response = await this.fetchJson(`/v1/forecast-requests/next?${query.toString()}`);
    return parseForecastRequestWire(response);
  }

  public async submitForecast(submission: ForecastSubmissionWire): Promise<ForecastSubmissionAcceptedWire> {
    const wire = parseForecastSubmissionWire(submission);
    const response = await this.fetchJson("/v1/forecast-submissions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: serializeWire(wire),
    });
    return parseForecastSubmissionAcceptedWire(response);
  }

  public async getForecastSubmission(submissionId: string): Promise<ForecastSubmissionAcceptedWire> {
    const response = await this.fetchJson(`/v1/forecast-submissions/${encodeURIComponent(submissionId)}`);
    return parseForecastSubmissionAcceptedWire(response);
  }

  public async requestExecution(request: UnauthorizedExecutionRequest): Promise<UnauthorizedExecutionResponseWire> {
    const response = await fetch(`${this.baseUrl}/v1/execution-requests`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: serializeWire({
        protocolVersion: "1",
        requestId: request.requestId,
        marketId: request.marketId,
        actionId: request.actionId,
      }),
    });
    const body = await this.readJson(response);
    if (response.status !== 403) throw new ForecastProviderHttpError(response.status, body);
    return parseUnauthorizedExecutionResponseWire(body);
  }

  protected async fetchJson(path: string, init?: RequestInit): Promise<unknown> {
    const response = await fetch(`${this.baseUrl}${path}`, init);
    const body = await this.readJson(response);
    if (!response.ok) throw new ForecastProviderHttpError(response.status, body);
    return body;
  }

  private async readJson(response: Response): Promise<unknown> {
    const text = await response.text();
    try {
      return JSON.parse(text) as unknown;
    } catch {
      throw new ForecastProviderHttpError(response.status, { code: "INVALID_JSON_RESPONSE" });
    }
  }
}

/** Second named fixture client; it uses exactly the same HTTP/schema path. */
export class FixtureProviderAClient extends HttpForecastProviderClient {
  public constructor(baseUrl: string) {
    super({ baseUrl, profile: FIXTURE_PROVIDER_A });
  }
}

/** Provider independence fixture: no alternate validation or core path. */
export class FixtureProviderBClient extends HttpForecastProviderClient {
  public constructor(baseUrl: string) {
    super({ baseUrl, profile: FIXTURE_PROVIDER_B });
  }
}

export function createFixtureProviderClient(baseUrl: string, key: "A" | "B"): HttpForecastProviderClient {
  return key === "A" ? new FixtureProviderAClient(baseUrl) : new FixtureProviderBClient(baseUrl);
}
