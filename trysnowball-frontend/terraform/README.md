# TrySnowball Infrastructure - Terraform

This Terraform configuration manages the DNS and Cloudflare setup for trysnowball.co.uk.

## What it manages:

### DNS Records
- **Main site**: `trysnowball.co.uk` → Cloudflare Pages
- **WWW redirect**: `www.trysnowball.co.uk` → `trysnowball.co.uk`
- **Mail (iCloud)**: MX records for receiving email
- **SendGrid**: Authentication records for sending magic link emails
- **DMARC**: Email security policy

### Cloudflare Workers & D1
- **Auth Worker**: Magic link authentication system
- **D1 Database**: User data, auth logs, preferences
- **Worker Routes**: `trysnowball.co.uk/auth/*` routing
- **Secrets Management**: JWT secret, SendGrid API key
- **Database Bindings**: Automatic D1 connection

### Cloudflare Settings
- Proxying configuration (Pages proxied, email DNS-only)
- Proper TTL settings
- Comments on all records for documentation

## Setup

1. **Install Terraform** (if not already installed):
   ```bash
   brew install terraform
   ```

2. **Get Cloudflare API Token**:
   - Go to: https://dash.cloudflare.com/profile/api-tokens
   - Create token with `Zone:Edit` permissions for `trysnowball.co.uk`

3. **Set environment variable**:
   ```bash
   export CLOUDFLARE_API_TOKEN="your-token-here"
   ```

4. **Initialize and apply**:
   ```bash
   cd terraform/
   terraform init
   terraform plan
   terraform apply
   ```

## Commands

```bash
# Initialize Terraform
terraform init

# See what changes will be made
terraform plan

# Apply changes
terraform apply

# See current state
terraform show

# Destroy everything (careful!)
terraform destroy
```

## Files

- `main.tf` - Main configuration with all DNS records
- `variables.tf` - Configurable values (SendGrid IDs, domain name, etc.)
- `outputs.tf` - Information displayed after apply
- `terraform.tfstate` - Current state (auto-generated, don't edit)

## Benefits

- **Version control** - All DNS changes tracked in git
- **Reproducible** - Can recreate exact same setup
- **Documentation** - Clear what each record does
- **Validation** - Terraform checks configuration before applying
- **Rollback** - Easy to revert changes

## Safety

- Always run `terraform plan` before `apply`
- Keep `terraform.tfstate` file safe (contains current state)
- Never edit DNS records manually once using Terraform