variable "project_name" {
  type        = string
  description = "The prefix name for resources"
}

variable "account_id" {
  type        = string
  description = "Cloudflare Account ID"
}

variable "retention_days" {
  type        = number
  default     = 30
  description = "Default retention policy in days"
}

variable "rate_limit" {
  type        = number
  default     = 60
  description = "Default rate limit in requests per minute"
}

variable "custom_domain" {
  type        = string
  nullable    = true
  default     = null
  description = "Custom domain for the webhook receiver (optional)"
}
