resource "cloudflare_d1_database" "main" {
  account_id = var.account_id
  name       = "webhook-platform-db"
}