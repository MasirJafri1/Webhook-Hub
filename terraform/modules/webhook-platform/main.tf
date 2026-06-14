terraform {
  required_providers {
    cloudflare = {
      source = "cloudflare/cloudflare"
    }
  }
}

resource "cloudflare_d1_database" "db" {
  account_id = var.account_id
  name       = "${var.project_name}-db"
}

resource "cloudflare_workers_kv_namespace" "cache" {
  account_id = var.account_id
  title      = "${var.project_name}-cache"
}
