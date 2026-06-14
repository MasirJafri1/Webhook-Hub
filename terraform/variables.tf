variable "cloudflare_api_token" {
  type      = string
  sensitive = true
}

variable "account_id" {
  type = string
}

variable "project_name" {
  type    = string
  default = "webhook-platform"
}

variable "retention_days" {
  type    = number
  default = 30
}

variable "rate_limit" {
  type    = number
  default = 60
}

variable "custom_domain" {
  type    = string
  default = null
}