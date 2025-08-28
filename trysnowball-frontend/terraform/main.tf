terraform {
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
    posthog = {
      source  = "terraform-community-providers/posthog"
      version = "~> 0.1"
    }
  }
}

# Configure the Cloudflare Provider
provider "cloudflare" {
  # Uses CLOUDFLARE_API_TOKEN environment variable
}

# Get your zone ID
data "cloudflare_zone" "trysnowball" {
  name = "trysnowball.co.uk"
}

# Main website - Pages
resource "cloudflare_record" "root" {
  zone_id         = data.cloudflare_zone.trysnowball.id
  name            = "@"
  type            = "CNAME"
  content         = "trysnowball-frontend.pages.dev"
  proxied         = true
  allow_overwrite = true
  comment         = "Main website via Cloudflare Pages"
}

# WWW redirect
resource "cloudflare_record" "www" {
  zone_id         = data.cloudflare_zone.trysnowball.id
  name            = "www"
  type            = "CNAME"
  content         = "trysnowball.co.uk"
  proxied         = true
  allow_overwrite = true
  comment         = "WWW redirect to main domain"
}

# iCloud Mail MX Records - commented out as they already exist
# resource "cloudflare_record" "mx_primary" {
#   zone_id         = data.cloudflare_zone.trysnowball.id
#   name            = "@"
#   type            = "MX"
#   content         = "mx01.mail.icloud.com"
#   priority        = 10
#   proxied         = false
#   allow_overwrite = true
#   comment         = "iCloud Mail Primary MX"
# }

# resource "cloudflare_record" "mx_secondary" {
#   zone_id         = data.cloudflare_zone.trysnowball.id
#   name            = "@"
#   type            = "MX"
#   content         = "mx02.mail.icloud.com"
#   priority        = 20
#   proxied         = false
#   allow_overwrite = true
#   comment         = "iCloud Mail Secondary MX"
# }

# SendGrid Domain Authentication Records
resource "cloudflare_record" "sendgrid_dkim1" {
  zone_id         = data.cloudflare_zone.trysnowball.id
  name            = "s1._domainkey"
  type            = "CNAME"
  content         = "s1.domainkey.u54675486.wl237.sendgrid.net"
  proxied         = false
  allow_overwrite = true
  comment         = "SendGrid DKIM Key 1"
}

resource "cloudflare_record" "sendgrid_dkim2" {
  zone_id         = data.cloudflare_zone.trysnowball.id
  name            = "s2._domainkey"
  type            = "CNAME"
  content         = "s2.domainkey.u54675486.wl237.sendgrid.net"
  proxied         = false
  allow_overwrite = true
  comment         = "SendGrid DKIM Key 2"
}

resource "cloudflare_record" "sendgrid_bounce_em2595" {
  zone_id         = data.cloudflare_zone.trysnowball.id
  name            = "em2595"
  type            = "CNAME"
  content         = "u54675486.wl237.sendgrid.net"
  proxied         = false
  allow_overwrite = true
  comment         = "SendGrid Bounce Handling - em2595"
}

resource "cloudflare_record" "sendgrid_bounce_em7106" {
  zone_id         = data.cloudflare_zone.trysnowball.id
  name            = "em7106"
  type            = "CNAME"
  content         = "u54675486.wl237.sendgrid.net"
  proxied         = false
  allow_overwrite = true
  comment         = "SendGrid Bounce Handling - em7106"
}

resource "cloudflare_record" "sendgrid_tracking" {
  zone_id         = data.cloudflare_zone.trysnowball.id
  name            = "54675486"
  type            = "CNAME"
  content         = "sendgrid.net"
  proxied         = false
  allow_overwrite = true
  comment         = "SendGrid Link Tracking"
}

resource "cloudflare_record" "sendgrid_links" {
  zone_id         = data.cloudflare_zone.trysnowball.id
  name            = "url3555"
  type            = "CNAME"
  content         = "sendgrid.net"
  proxied         = false
  allow_overwrite = true
  comment         = "SendGrid Link Branding - url3555"
}

# DMARC Policy
resource "cloudflare_record" "dmarc" {
  zone_id         = data.cloudflare_zone.trysnowball.id
  name            = "_dmarc"
  type            = "TXT"
  content         = "v=DMARC1; p=none;"
  proxied         = false
  allow_overwrite = true
  comment         = "DMARC Policy for Email Authentication"
}

# SPF Record (if needed)
resource "cloudflare_record" "spf" {
  zone_id         = data.cloudflare_zone.trysnowball.id
  name            = "@"
  type            = "TXT"
  content         = "v=spf1 include:sendgrid.net ~all"
  proxied         = false
  allow_overwrite = true
  comment         = "SPF Record for SendGrid"
}