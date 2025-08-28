# Cloudflare Workers and D1 Database Management
# Note: For now, commenting out Worker management as the existing Worker is already deployed
# This allows us to manage DNS while keeping the existing Worker functional

# # D1 Database
# resource "cloudflare_d1_database" "auth_db" {
#   account_id = var.cloudflare_account_id
#   name       = "auth_db"
# }

# # Worker Script
# resource "cloudflare_workers_script" "auth_worker" {
#   account_id = var.cloudflare_account_id
#   name       = "trysnowball-auth"
#   content    = file("${path.module}/../cloudflare-workers/auth-magic.js")

#   # D1 Database binding
#   d1_database_binding {
#     name        = "DB"
#     database_id = cloudflare_d1_database.auth_db.id
#   }

#   # Environment variables as secrets
#   secret_text_binding {
#     name = "JWT_SECRET"
#     text = var.jwt_secret
#   }

#   secret_text_binding {
#     name = "SENDGRID_API_KEY"
#     text = var.sendgrid_api_key
#   }

#   secret_text_binding {
#     name = "BASE_URL"
#     text = var.base_url
#   }
# }

# # Worker Routes
# resource "cloudflare_worker_route" "auth_routes" {
#   zone_id     = data.cloudflare_zone.trysnowball.id
#   pattern     = "${var.domain_name}/auth/*"
#   script_name = cloudflare_workers_script.auth_worker.name
# }