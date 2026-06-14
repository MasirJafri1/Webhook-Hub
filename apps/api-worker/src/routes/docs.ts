import { json } from "../utils/response";

const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Webhook Platform API",
    version: "1.0.0",
    description: "Enterprise-grade serverless webhook delivery and management engine API.",
  },
  servers: [
    {
      url: "/",
      description: "Current Host",
    },
  ],
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: "apiKey",
        in: "header",
        name: "Authorization",
        description: "Standard Bearer Token (e.g. Bearer whpk_live_...)",
      },
    },
  },
  security: [
    {
      ApiKeyAuth: [],
    },
  ],
  paths: {
    "/api/v1/orgs": {
      post: {
        summary: "Create Organization",
        tags: ["Organizations"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name"],
                properties: {
                  name: { type: "string", example: "Acme Corp" },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Organization created successfully",
          },
        },
      },
    },
    "/api/v1/projects": {
      post: {
        summary: "Create Project",
        tags: ["Projects"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["organizationId", "name"],
                properties: {
                  organizationId: { type: "string" },
                  name: { type: "string", example: "Production" },
                  monthlyEventLimit: { type: "integer", example: 100000 },
                  retentionDays: { type: "integer", default: 30 },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Project created successfully",
          },
        },
      },
    },
    "/api/v1/api-keys": {
      post: {
        summary: "Create API Key",
        tags: ["Authentication"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["projectId", "name"],
                properties: {
                  projectId: { type: "string" },
                  name: { type: "string", example: "Production Publish Key" },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "API Key created, returns raw unhashed token once",
          },
        },
      },
    },
    "/api/v1/webhooks": {
      get: {
        summary: "List Webhooks",
        tags: ["Webhooks"],
        responses: {
          "200": {
            description: "Successful response",
          },
        },
      },
      post: {
        summary: "Create Webhook Endpoint",
        tags: ["Webhooks"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "url"],
                properties: {
                  name: { type: "string", example: "Billing service receiver" },
                  url: { type: "string", format: "uri", example: "https://api.acme.com/webhooks" },
                  requestsPerMinute: { type: "integer", default: 60 },
                  eventFilters: {
                    type: "array",
                    items: { type: "string" },
                    example: ["user.created", "invoice.paid"],
                  },
                  version: { type: "string", enum: ["v1", "v2"], default: "v1" },
                  customHeaders: {
                    type: "object",
                    additionalProperties: { type: "string" },
                    example: { "Authorization": "Bearer secret_token" },
                  },
                  payloadTransform: {
                    type: "object",
                    properties: {
                      rename: { type: "object", additionalProperties: { type: "string" } },
                      remove: { type: "array", items: { type: "string" } },
                      static: { type: "object" },
                      template: { type: "object", additionalProperties: { type: "string" } },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Webhook registered successfully",
          },
        },
      },
    },
    "/api/v1/webhooks/{id}": {
      get: {
        summary: "Get Webhook details",
        tags: ["Webhooks"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Successful response" },
          "404": { description: "Webhook not found" },
        },
      },
      delete: {
        summary: "Delete Webhook",
        tags: ["Webhooks"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Successful deletion" },
          "404": { description: "Webhook not found" },
        },
      },
    },
    "/api/v1/webhooks/{id}/rotate-secret": {
      post: {
        summary: "Rotate Webhook Secret",
        tags: ["Webhooks"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Secret rotated successfully" },
        },
      },
    },
    "/api/v1/webhooks/{id}/signing-info": {
      get: {
        summary: "Get Webhook Signing Headers Info",
        tags: ["Webhooks"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Successful response" },
        },
      },
    },
    "/api/v1/webhooks/{id}/metrics": {
      get: {
        summary: "Get Webhook Endpoint Metrics",
        tags: ["Webhooks"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Successful response" },
        },
      },
    },
    "/api/v1/events": {
      get: {
        summary: "List Events",
        tags: ["Events"],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
        ],
        responses: {
          "200": { description: "Successful response" },
        },
      },
      post: {
        summary: "Publish Event (Triggers Instant Delivery)",
        tags: ["Events"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["endpointId", "eventType", "payload"],
                properties: {
                  endpointId: { type: "string" },
                  eventType: { type: "string", example: "user.created" },
                  payload: { type: "object" },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Event published and queued for background delivery" },
          "403": { description: "Quota exceeded" },
          "404": { description: "Webhook endpoint not found" },
        },
      },
    },
    "/api/v1/events/{id}": {
      get: {
        summary: "Get Event status details",
        tags: ["Events"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Successful response" },
          "404": { description: "Event not found" },
        },
      },
    },
    "/api/v1/events/{id}/timeline": {
      get: {
        summary: "Get Event Delivery Attempts Timeline",
        tags: ["Events"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Successful response" },
        },
      },
    },
    "/api/v1/events/{id}/replay": {
      post: {
        summary: "Manually Replay Single Event",
        tags: ["Events"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Successful response" },
        },
      },
    },
    "/api/v1/events/replay-all": {
      post: {
        summary: "Replay All Dead/Poisoned Events",
        tags: ["Events"],
        responses: {
          "200": { description: "Successful response" },
        },
      },
    },
    "/api/v1/events/replay-window": {
      post: {
        summary: "Replay Events within Date Window",
        tags: ["Events"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["from", "to"],
                properties: {
                  from: { type: "string", format: "date-time", example: "2026-06-14T00:00:00.000Z" },
                  to: { type: "string", format: "date-time", example: "2026-06-15T00:00:00.000Z" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Successful response" },
        },
      },
    },
    "/api/v1/events/dead": {
      get: {
        summary: "List Dead Events",
        tags: ["Events"],
        responses: {
          "200": { description: "Successful response" },
        },
      },
    },
    "/api/v1/events/poisoned": {
      get: {
        summary: "List Poisoned Events",
        tags: ["Events"],
        responses: {
          "200": { description: "Successful response" },
        },
      },
    },
    "/api/v1/events/search": {
      get: {
        summary: "Search Events Logs",
        tags: ["Search"],
        parameters: [
          { name: "eventType", in: "query", schema: { type: "string" } },
          { name: "status", in: "query", schema: { type: "string" } },
          { name: "endpointId", in: "query", schema: { type: "string" } },
          { name: "from", in: "query", schema: { type: "integer" }, description: "Epoch millisecond start" },
          { name: "to", in: "query", schema: { type: "integer" }, description: "Epoch millisecond end" },
        ],
        responses: {
          "200": { description: "Successful search results" },
        },
      },
    },
    "/api/v1/deliveries/search": {
      get: {
        summary: "Search Delivery Attempts Logs",
        tags: ["Search"],
        parameters: [
          { name: "status", in: "query", schema: { type: "string" } },
          { name: "endpointId", in: "query", schema: { type: "string" } },
          { name: "from", in: "query", schema: { type: "integer" } },
          { name: "to", in: "query", schema: { type: "integer" } },
        ],
        responses: {
          "200": { description: "Successful search results" },
        },
      },
    },
    "/api/v1/audit-logs/search": {
      get: {
        summary: "Search Tenant Audit Trails",
        tags: ["Search"],
        parameters: [
          { name: "action", in: "query", schema: { type: "string" } },
          { name: "from", in: "query", schema: { type: "integer" } },
          { name: "to", in: "query", schema: { type: "integer" } },
        ],
        responses: {
          "200": { description: "Successful search results" },
        },
      },
    },
  },
};

const scalarHtml = `
<!doctype html>
<html>
  <head>
    <title>Webhook Platform API Reference</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body {
        margin: 0;
      }
    </style>
  </head>
  <body>
    <script id="api-reference" type="application/json"></script>
    <script>
      document.getElementById('api-reference').textContent = JSON.stringify(${JSON.stringify(openApiSpec)});
    </script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
  </body>
</html>
`;

export const registerDocsRoutes = (router: any) => {
  router.get("/openapi.json", () => {
    return json(openApiSpec);
  });

  router.get("/docs", () => {
    return new Response(scalarHtml, {
      headers: {
        "content-type": "text/html; charset=utf-8",
      },
    });
  });
};
