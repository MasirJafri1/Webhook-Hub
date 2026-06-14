export const json = (data: unknown, status = 200): Response => {
  return Response.json(data, {
    status,
    headers: {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET, POST, PUT, DELETE, OPTIONS",
      "access-control-allow-headers":
        "content-type, x-webhook-id, x-webhook-timestamp, x-webhook-signature, idempotency-key",
    },
  });
};
