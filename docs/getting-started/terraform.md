# Infrastructure Provisioning with Terraform

WebHook Hub uses infrastructure-as-code (IaC) to guarantee consistent resource setup across environments.

---

## 1. Directory Structure

The Terraform configuration is modularized:
```text
terraform/
├── main.tf                 # Feeds inputs to the webhook-platform module
├── provider.tf             # Declares the Cloudflare provider configuration
├── variables.tf            # Root input variables declaration
├── outputs.tf              # Root outputs exposing resource IDs
├── terraform.tfvars        # Local variable values (git-ignored)
└── modules/
    └── webhook-platform/
        ├── main.tf         # Creates D1 database and KV namespaces
        ├── variables.tf    # Module variables
        └── outputs.tf      # Module outputs (d1_id and kv_id)
```

---

## 2. Resource Definitions

The module under `terraform/modules/webhook-platform/main.tf` defines the core primitives:

```hcl
resource "cloudflare_d1_database" "db" {
  account_id = var.account_id
  name       = "${var.project_name}-db"
}

resource "cloudflare_workers_kv_namespace" "cache" {
  account_id = var.account_id
  title      = "${var.project_name}-cache"
}
```

---

## 3. Inputs & Variables Configuration

To customize your deployment, configure these variables in `terraform/terraform.tfvars`:

* **`cloudflare_api_token`** (String, Sensitive): Your Cloudflare API token.
* **`account_id`** (String): Your Cloudflare Account ID.
* **`project_name`** (String, Default: `webhook-platform`): Base prefix for resource naming.
* **`retention_days`** (Number, Default: `30`): Default retention period for the project.
* **`rate_limit`** (Number, Default: `60`): Max requests per minute default configuration.

---

## 4. State Management
By default, running `terraform apply` locally creates local state files:
* `terraform.tfstate`
* `terraform.tfstate.backup`

These files contain resource metadata and sensitive values. They are automatically added to the `.gitignore` to prevent leakage. For production teams, it is recommended to configure a remote state backend (such as Cloudflare R2, AWS S3, or Terraform Cloud).
