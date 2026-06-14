export interface Webhook {
  id: string;
  name: string;
  url: string;
  currentSecret: string;
  previousSecret: string | null;
  secretRotatedAt: number | null;
  active: boolean;
  requestsPerMinute: number;
  createdAt: number;
}

export interface Event {
  id: string;
  endpointId: string;
  eventType: string;
  payload: unknown;
  status: string;
  retryCount: number;
  nextRetryAt: number | null;
  lastAttemptAt: number | null;
  idempotencyKey: string | null;
  lastErrorHash: string | null;
  poisoned: boolean;
  createdAt: number;
}

export interface Delivery {
  id: string;
  eventId: string;
  endpointId: string;
  status: "success" | "failed";
  responseCode: number | null;
  responseBody: string | null;
  latencyMs: number;
  createdAt: number;
}

export interface EndpointHealth {
  endpoint_id: string;
  total: number;
  successful: number;
}

export interface MetricsData {
  overview: {
    total: number;
    success: number;
    failed: number;
    successRate: number;
    failureRate: number;
  };
  latency: {
    avg_latency: number;
  };
  retry: {
    average_retry: number;
    max_retry: number;
  };
  dead: {
    dead: number;
  };
  endpointHealth: EndpointHealth[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
