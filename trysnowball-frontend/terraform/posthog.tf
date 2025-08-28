# PostHog Analytics Infrastructure for TrySnowball
# Note: PostHog Terraform provider has limited functionality
# Advanced features like dashboards, insights, and subscriptions must be configured manually

# Configure PostHog provider
provider "posthog" {
  host  = "https://eu.i.posthog.com"
  token = var.posthog_api_key
}

# Variables
variable "posthog_api_key" {
  description = "PostHog API key for managing resources"
  type        = string
  sensitive   = true
}

variable "notification_email" {
  description = "Email for reports and alerts"
  type        = string
  default     = "hello@trysnowball.co.uk"
}

# Output PostHog configuration details
output "posthog_setup" {
  description = "PostHog configuration status"
  value = {
    host             = "https://eu.i.posthog.com"
    notification_email = var.notification_email
    manual_setup_required = "Dashboards, insights, and automated reports must be configured manually in PostHog UI"
  }
}

# Documentation for manual PostHog setup
locals {
  posthog_manual_setup_instructions = <<-EOT
    MANUAL POSTHOG SETUP REQUIRED:
    
    The PostHog Terraform provider only supports basic project management.
    For advanced features, configure these manually in PostHog:
    
    1. Create Business Metrics Dashboard:
       - User Growth (New users per week)
       - Debt Milestones (debt_milestone events)
       - AI Coach Usage (chat_started, ai_coach_message events)
       - Feature Funnel ($pageview → debt_added_first → debt_balance_updated → debt_milestone)
    
    2. Set up Email Reports:
       - Weekly Business Report (Mondays 9 AM to ${var.notification_email})
       - Monthly Milestone Report (1st of month 10 AM to ${var.notification_email})
    
    3. Configure Alerts:
       - Low Daily Signups (< 5 new users per day)
    
    PostHog Dashboard URL: https://eu.i.posthog.com/dashboard/
  EOT
}

output "manual_setup_instructions" {
  description = "Instructions for completing PostHog setup manually"
  value       = local.posthog_manual_setup_instructions
}