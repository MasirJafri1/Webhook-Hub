# API Authentication & Authorization

WebHook Hub uses a two-pronged authentication strategy: **Publisher API Keys** for system-to-system ingestion, and **JSON Web Tokens (JWT)** for frontend dashboard operations.

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

## 2. Developer Portal JWT Sessions
Used by developers and administrators to manage resources from the dashboard.
* **Format**: Standard cryptographically signed HS256 JWT containing user payload.
* **Header**: Passed in the `Authorization` header as a Bearer token:
  ```http
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  ```
* **JWT Payload Structure**:
  ```json
  {
    "userId": "usr_x5vQ2e9jYO3",
    "email": "developer@domain.com",
    "role": "user" // 'user' | 'super_admin'
  }
  ```

---

## 3. Authentication Flow Diagram

```mermaid
sequenceDiagram
    participant Client
    participant AuthMiddleware
    participant Cache as KV Cache
    participant DB as D1 Database

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
