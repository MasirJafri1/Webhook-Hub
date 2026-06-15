# Filtering & Transformations Guide

WebHook Hub allows developers to customize the delivery pipeline to match the exact requirements of their webhook consumers. You can configure endpoints to receive only specific event types (Event Filtering) and shape the JSON payload format (Payload Transformations) directly inside WebHook Hub, eliminating the need for intermediary adapter code.

---

## Event Filtering

By default, a webhook endpoint receives all events dispatched to a project. **Event Filtering** allows you to restrict delivery to a set of specified event types.

### How It Works
* An endpoint configuration can include an array of strings in the `eventFilters` column (e.g., `["order.created", "order.shipped"]`).
* When the background job executes `runDeliveryJob`, it compares the event's `eventType` against the endpoint's filters.
* If filters are set and the event type is **not** present in the filters array:
  1. The event is filtered out.
  2. The database updates the event's status to `delivered` (to prevent future delivery attempts).
  3. No HTTP POST request is sent to the target URL, saving egress bandwidth and receiver compute.

---

## Payload Transformations

Payload transformation is a powerful feature that re-shapes the outgoing JSON payload in real time before signing and delivering it. This is extremely useful when integrating with third-party APIs (e.g., Slack, Discord, Zapier) that require specific request structures.

The transformation config is specified as a JSON object with four optional directives:
1. `rename`
2. `remove`
3. `static`
4. `template`

---

## Transformation Directives

### 1. Rename Keys (`rename`)
A map of `oldKey: newKey` string pairs. Renames keys at the root level of the payload.
* **Rule**: If the key exists, its value is assigned to the new key, and the old key is deleted.

```json
{
  "rename": {
    "user_id": "userId",
    "tx_status": "transactionStatus"
  }
}
```

### 2. Remove Keys (`remove`)
An array of string keys to strip from the payload. Useful for removing sensitive data (e.g., passwords, raw hashes, internal database IDs) before egress.

```json
{
  "remove": ["internalId", "dbCredentials"]
}
```

### 3. Add Static Keys (`static`)
An object of key-value pairs merged directly into the root level of the payload.

```json
{
  "static": {
    "source": "webhook-hub",
    "environment": "production"
  }
}
```

### 4. Nested Templates (`template`)
A mapping dictionary that dynamically restructures the payload using dot-notated target paths. Useful for nesting raw variables into deep object configurations.
* **Rule**: Uses a recursive deep-merge utility to generate nested JSON objects from paths like `user.profile.name`.

```json
{
  "template": {
    "user.profile.id": "userId",
    "user.profile.fullName": "userName"
  }
}
```

---

## Complete Transformation Example

### Original Payload:
```json
{
  "user_id": "usr_9982",
  "userName": "Masir Jafri",
  "internalId": "idx_secret_772",
  "amount": 2500,
  "currency": "USD"
}
```

### Transformation JSON Config:
```json
{
  "rename": {
    "user_id": "id"
  },
  "remove": ["internalId"],
  "static": {
    "provider": "stripe-direct"
  },
  "template": {
    "customer.meta.identifier": "id",
    "customer.profile.name": "userName",
    "payment.charge.amount": "amount",
    "payment.charge.currency": "currency"
  }
}
```

### Output Transformed Payload:
```json
{
  "id": "usr_9982",
  "userName": "Masir Jafri",
  "provider": "stripe-direct",
  "customer": {
    "meta": {
      "identifier": "usr_9982"
    },
    "profile": {
      "name": "Masir Jafri"
    }
  },
  "payment": {
    "charge": {
      "amount": 2500,
      "currency": "USD"
    }
  }
}
```

---

## Ordering of Execution

The transformation service (`TransformService.apply`) processes directories in a strict order:
1. **Rename** keys.
2. **Remove** keys.
3. **Static** key additions.
4. **Template** nested mapping.

If the payload parsing fails at any point due to malformed JSON data, the transformation step is bypassed, and the original raw payload is dispatched to the consumer to guarantee delivery.
