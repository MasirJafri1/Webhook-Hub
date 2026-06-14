module "webhook_platform" {
  source = "./modules/webhook-platform"

  project_name   = var.project_name
  account_id     = var.account_id
  retention_days = var.retention_days
  rate_limit     = var.rate_limit
  custom_domain  = var.custom_domain
}
