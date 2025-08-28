# Outputs for the Terraform configuration

output "zone_id" {
  description = "Cloudflare Zone ID"
  value       = data.cloudflare_zone.trysnowball.id
}

output "domain_name" {
  description = "Main domain name"
  value       = var.domain_name
}

output "website_url" {
  description = "Main website URL"
  value       = "https://${var.domain_name}"
}

output "auth_api_url" {
  description = "Auth API URL"
  value       = "https://${var.domain_name}/auth"
}

output "dns_records" {
  description = "Summary of DNS records created"
  value = {
    main_site      = "${var.domain_name} -> ${var.pages_subdomain}"
    www_redirect   = "www.${var.domain_name} -> ${var.domain_name}"
    mx_records     = "iCloud Mail MX records configured"
    sendgrid_auth  = "SendGrid authentication records configured"
    dmarc_policy   = "DMARC policy set to none (monitoring)"
  }
}

# Worker info output commented out since Worker resources are managed separately
# output "worker_info" {
#   description = "Cloudflare Worker deployment information"
#   value = {
#     worker_name   = cloudflare_worker_script.auth_worker.name
#     database_id   = cloudflare_d1_database.auth_db.id
#     database_name = cloudflare_d1_database.auth_db.name
#     route_pattern = "${var.domain_name}/auth/*"
#   }
# }

output "auth_endpoints" {
  description = "Available authentication endpoints"
  value = {
    health      = "https://${var.domain_name}/auth/health"
    request     = "https://${var.domain_name}/auth/request-link"
    verify      = "https://${var.domain_name}/auth/verify"
    check       = "https://${var.domain_name}/auth/check"
    me          = "https://${var.domain_name}/auth/me"
    stats       = "https://${var.domain_name}/auth/stats"
    refresh     = "https://${var.domain_name}/auth/refresh"
    logout      = "https://${var.domain_name}/auth/logout"
  }
}