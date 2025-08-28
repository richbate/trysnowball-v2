# Variables for Terraform configuration

variable "domain_name" {
  description = "The domain name for the application"
  type        = string
  default     = "trysnowball.co.uk"
}

variable "pages_subdomain" {
  description = "Cloudflare Pages subdomain"
  type        = string
  default     = "trysnowball-frontend.pages.dev"
}

variable "sendgrid_user_id" {
  description = "SendGrid user ID for DNS records"
  type        = string
  default     = "u54675486"
}

variable "sendgrid_wl_id" {
  description = "SendGrid WhiteLabel ID"
  type        = string
  default     = "wl237"
}

variable "sendgrid_bounce_subdomain" {
  description = "SendGrid bounce tracking subdomain"
  type        = string
  default     = "em6593"
}

variable "sendgrid_link_id" {
  description = "SendGrid link tracking ID"
  type        = string
  default     = "54675486"
}

variable "sendgrid_url_id" {
  description = "SendGrid URL branding ID"
  type        = string
  default     = "url3555"
}

# Worker Secrets
variable "jwt_secret" {
  description = "JWT signing secret"
  type        = string
  sensitive   = true
}

variable "sendgrid_api_key" {
  description = "SendGrid API key for sending emails"
  type        = string
  sensitive   = true
}

variable "base_url" {
  description = "Base URL for magic link redirects"
  type        = string
  default     = "https://trysnowball.co.uk"
}