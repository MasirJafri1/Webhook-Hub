resource "cloudflare_workers_kv_namespace" "cache" {
  account_id = var.account_id
  title      = "webhook-platform-cache"
}