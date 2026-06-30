# API Authentication & Authorization

WebHook Hub uses a two-pronged authentication strategy: **Publisher API Keys** for system-to-system ingestion, and **Google OAuth JWT sessions** for frontend dashboard operations. Traditional email/password authentication has been removed to eliminate password-based attack vectors.

---

## 1. Publisher API Keys

Used by your core SaaS backend to ingest events or query endpoints.

* **Format**: `whpk_live_[a-zA-Z0-9]{32}`
* **Header**: Passed in the standard `Authorization` header as a Bearer token:
  ```http
  Authorization: Bearer whpk_live_your_api_key_here
  ```
* **Security Model**: The plain key is never stored in the database. When an API key is generated, we compute its `SHA-256` hash and store only the hash in D1. During ingestion, the incoming key is hashed and matched against D1/KV.

---

## 2. Google OAuth JWT Sessions (Dashboard Users)

WebHook Hub uses **passwordless Google Sign-In** for all dashboard authentication. No passwords are stored, transmitted, or validated.

### How It Works

1. The user clicks **"Sign in with Google"** on the login page.
2. Google's Identity Services (GSI) client presents a consent prompt and returns a signed **ID Token** (credential).
3. The dashboard sends this credential to `POST /api/v1/auth/google`.
4. The API Worker verifies the token against Google's `oauth2.googleapis.com/tokeninfo` endpoint.
5. If the token is valid and the email is verified, the worker either:
   - **Existing user**: Looks up the user record and issues a JWT.
   - **New user**: Creates a new user (auto-approved), bootstraps a default workspace (organization, project, API key), and issues a JWT.
6. The signed JWT is returned to the dashboard and stored in `localStorage`.

### JWT Token Format

* **Algorithm**: `HS256` (HMAC-SHA256)
* **Signing Secret**: `JWT_SECRET` stored in Cloudflare Wrangler Secrets (never in code or config files)
* **Header**: Passed in the `Authorization` header as a Bearer token:
  ```http
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  ```
* **JWT Payload Structure**:
  ```json
  {
    "userId": "usr_x5vQ2e9jYO3",
    "email": "developer@domain.com",
    "role": "user"
  }
  ```
  The `role` field is either `"user"` or `"super_admin"`.

---

## 3. Authentication Flow Diagram

```mermaid
sequenceDiagram
    participant Client
    participant AuthMiddleware
    participant Cache as KV Cache
    participant DB as D1 Database
    participant Google as Google OAuth API

    Client->>AuthMiddleware: Send request with Authorization Header
    alt Header starts with Bearer whpk_
        AuthMiddleware->>AuthMiddleware: Hash incoming Key (SHA-256)
        AuthMiddleware->>Cache: Check if Hash exists in cache
        alt Cache hit
            Cache-->>AuthMiddleware: Return Project ID mapping
        else Cache miss
            AuthMiddleware->>DB: Query api_keys table for Hash
            DB-->>AuthMiddleware: Return Project ID & Name
            AuthMiddleware->>Cache: Save Hash mapping in KV Cache
        end
        AuthMiddleware-->>Client: Allow Access (Inject request.projectId)
    else Header contains JWT
        AuthMiddleware->>AuthMiddleware: Verify JWT Signature using env.JWT_SECRET
        alt JWT Valid
            AuthMiddleware->>DB: Lookup user's organization & project from members table
            DB-->>AuthMiddleware: Return Project ID
            AuthMiddleware-->>Client: Allow Access (Inject request.user & request.projectId)
        else JWT Invalid/Expired
            AuthMiddleware-->>Client: Return HTTP 401 Unauthorized
        end
    end
```

---

## 4. Google OAuth Sign-In Flow

```mermaid
sequenceDiagram
    participant User
    participant Dashboard as React Dashboard
    participant GSI as Google Identity Services
    participant Worker as API Worker
    participant TokenInfo as Google TokenInfo API
    participant DB as D1 Database

    User->>Dashboard: Click "Sign in with Google"
    Dashboard->>GSI: Initialize google.accounts.id
    GSI->>User: Display Google consent prompt
    User->>GSI: Select Google account
    GSI-->>Dashboard: Return credential (ID Token)

    Dashboard->>Worker: POST /api/v1/auth/google {credential}
    Worker->>TokenInfo: GET /tokeninfo?id_token=...
    TokenInfo-->>Worker: {email, email_verified, aud, ...}

    Worker->>Worker: Verify email_verified === true
    Worker->>Worker: Verify aud === GOOGLE_CLIENT_ID

    alt User exists in DB
        Worker->>DB: SELECT user by email
        DB-->>Worker: Return user record
        Note over Worker: Auto-approve if not already approved
    else New user
        Worker->>Worker: Check IP signup rate limit (5/3hrs)
        Worker->>DB: INSERT new user (auto-approved)
        Worker->>DB: Bootstrap org, project, API key
    end

    Worker->>Worker: Sign JWT with JWT_SECRET
    Worker-->>Dashboard: {token, user}
    Dashboard->>Dashboard: Store token in localStorage
```

---

## 5. Rate Limiting on Authentication

To prevent brute-force and credential-stuffing attacks, the following rate limits are enforced on authentication endpoints:

| Limit | Scope | Window | Max Requests |
| :--- | :--- | :--- | :--- |
| Auth brute-force | Per IP (`auth:{ip}`) | 60 seconds | 5 |
| Signup abuse | Per IP (`signup:{ip}`) | 3 hours | 5 |
| Global API | Per IP (`req:{ip}`) | 60 seconds | 60 |

When a rate limit is hit, the API returns `HTTP 429 Too Many Requests`.

---

## 6. Security Considerations

* **No Passwords**: Since authentication is exclusively via Google OAuth, there are no password hashes to leak, no brute-force password attacks possible, and no password-reset flows to exploit.
* **Token Audience Verification**: The worker validates that the Google ID token's `aud` claim matches the expected `GOOGLE_CLIENT_ID`, preventing token misuse from other applications.
* **Email Verification**: Only Google accounts with verified emails (`email_verified: true`) are accepted.
* **JWT Secret Isolation**: The `JWT_SECRET` is stored exclusively in Cloudflare Wrangler Secrets, never committed to source code or visible in `wrangler.jsonc`.
