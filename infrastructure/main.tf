# ═══════════════════════════════════════════════════════════════════
#  OpusHire — Azure Infrastructure as Code
#  Provisions the full cloud stack in ~5 minutes.
#  Usage:  terraform init && terraform apply -auto-approve
# ═══════════════════════════════════════════════════════════════════

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

provider "azurerm" {
  features {}
}

# ─── Variables ────────────────────────────────────────────────────

variable "resource_group_name" {
  description = "The name of the resource group"
  default     = "opushire-rg"
}

variable "location" {
  description = "The Azure Region"
  default     = "East US"
}

variable "environment" {
  description = "Deployment environment (dev, staging, production)"
  default     = "production"
}

locals {
  common_tags = {
    project     = "OpusHire"
    environment = var.environment
    managed_by  = "terraform"
    owner       = "soumik"
  }
}

# ─── Resource Group ──────────────────────────────────────────────

resource "azurerm_resource_group" "main" {
  name     = var.resource_group_name
  location = var.location
  tags     = local.common_tags
}

# ─── App Service Plan ───────────────────────────────────────────

resource "azurerm_service_plan" "app_plan" {
  name                = "opushire-app-plan"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  os_type             = "Linux"
  sku_name            = "B1" # Basic Tier (Modify to P1v2 or Free as needed)
  tags                = local.common_tags
}

# ─── Azure Cache for Redis ──────────────────────────────────────

resource "azurerm_redis_cache" "primary" {
  name                = "opushire-redis-primary"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  capacity            = 0
  family              = "C"
  sku_name            = "Basic"
  enable_non_ssl_port = false
  minimum_tls_version = "1.2"

  redis_configuration {
    maxmemory_policy = "noeviction" # Required for BullMQ stability
  }

  tags = local.common_tags
}

# ─── Application Insights (APM & Tracing) ───────────────────────

resource "azurerm_log_analytics_workspace" "main" {
  name                = "opushire-logs"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  sku                 = "PerGB2018"
  retention_in_days   = 30
  tags                = local.common_tags
}

resource "azurerm_application_insights" "main" {
  name                = "opushire-appinsights"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  workspace_id        = azurerm_log_analytics_workspace.main.id
  application_type    = "Node.JS"
  tags                = local.common_tags
}

# ─── Azure Container Registry ───────────────────────────────────

resource "azurerm_container_registry" "acr" {
  name                = "opushireacr"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  sku                 = "Basic"
  admin_enabled       = true
  tags                = local.common_tags
}

# ─── Backend Node.js Web App ────────────────────────────────────

resource "azurerm_linux_web_app" "backend" {
  name                = "opushire-backend"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  service_plan_id     = azurerm_service_plan.app_plan.id

  site_config {
    always_on = true
    application_stack {
      node_version = "20-lts"
    }
    
    # Required for GitHub Actions ZIP deployment
    app_command_line = "node dist/server.js"
  }

  app_settings = {
    "WEBSITE_NODE_DEFAULT_VERSION"   = "~20"
    "WEBSITE_RUN_FROM_PACKAGE"       = "1"
    "NODE_ENV"                       = "production"
    "SCM_DO_BUILD_DURING_DEPLOYMENT" = "false"
    "REDIS_HOST"                     = azurerm_redis_cache.primary.hostname
    "REDIS_PORT"                     = tostring(azurerm_redis_cache.primary.ssl_port)
    "REDIS_PASSWORD"                 = azurerm_redis_cache.primary.primary_access_key
    "APPINSIGHTS_INSTRUMENTATIONKEY" = azurerm_application_insights.main.instrumentation_key
  }

  tags = local.common_tags
}

# ─── Frontend Next.js Web App ───────────────────────────────────

resource "azurerm_linux_web_app" "frontend" {
  name                = "opushire-frontend-app"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  service_plan_id     = azurerm_service_plan.app_plan.id

  site_config {
    always_on = true
    application_stack {
      node_version = "20-lts"
    }
    
    # Next.js standalone execution
    app_command_line = "node server.js"
  }

  app_settings = {
    "WEBSITE_NODE_DEFAULT_VERSION"   = "~20"
    "WEBSITE_RUN_FROM_PACKAGE"       = "1"
    "NODE_ENV"                       = "production"
    "SCM_DO_BUILD_DURING_DEPLOYMENT" = "false"
    "PORT"                           = "3000"
  }

  tags = local.common_tags
}

# ─── Outputs ─────────────────────────────────────────────────────

output "backend_url" {
  description = "Live Backend API URL"
  value       = "https://${azurerm_linux_web_app.backend.default_hostname}"
}

output "frontend_url" {
  description = "Live Frontend URL"
  value       = "https://${azurerm_linux_web_app.frontend.default_hostname}"
}

output "redis_hostname" {
  description = "Azure Redis hostname"
  value       = azurerm_redis_cache.primary.hostname
}

output "redis_ssl_port" {
  description = "Azure Redis SSL port"
  value       = azurerm_redis_cache.primary.ssl_port
}

output "acr_login_server" {
  description = "Container Registry login server"
  value       = azurerm_container_registry.acr.login_server
}

output "appinsights_connection_string" {
  description = "Application Insights connection string"
  value       = azurerm_application_insights.main.connection_string
  sensitive   = true
}
