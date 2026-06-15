# API Error Codes & Troubleshooting

WebHook Hub returns structured JSON error payloads containing descriptive messages and status codes.

---

## 1. Standard Error Envelope
All error responses follow this exact schema:
```json
{
  "error": "error_code_identifier",
  "message": "Descriptive troubleshooting message"
}
```

---

## 2. Relational Error Code Registry

| HTTP Code | Error Code (`error`) | Scenario / Cause |
| :--- | :--- | :--- |
| **400 Bad Request** | `validation_error` | Missing required parameters, invalid URL formats, or malformed JSON payloads. |
| **401 Unauthorized** | `unauthorized` | Missing, malformed, or invalid Authorization headers/tokens. |
| **403 Forbidden** | `pending_approval` | Login succeeded, but the user account has not been approved by a Super Admin. |
| **403 Forbidden** | `quota_exceeded` | The project has hit its monthly event ingestion quota. |
| **404 Not Found** | `not_found` | The requested resource (endpoint, event, workspace) does not exist or belongs to another project. |
| **409 Conflict** | `duplicate_event` | An event with the specified `idempotencyKey` has already been processed within the last 24 hours. |
| **500 Internal Server**| `internal_error` | database locks or unexpected runtime errors. Check wrangler logs for exact details. |

---

## 3. Resolving "Authentication error" [code: 10000] (CI/CD)
When deploying the worker from GitHub Actions, Wrangler might exit with code 1 and error 10000.
* **Root Cause**: The Cloudflare API Token used in GitHub Secrets is missing the necessary Account permissions.
* **Resolution**: Edit the API Token on the Cloudflare dashboard to add the **`Account ➡️ Workers Scripts ➡️ Edit`** permission. (See Deployment guide).
