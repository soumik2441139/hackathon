terraform {
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

variable "resource_group_name" {
  description = "The name of the resource group"
  default     = "opushire-rg"
}

variable "location" {
  description = "The Azure Region"
  default     = "East US"
}

resource "azurerm_resource_group" "main" {
  name     = var.resource_group_name
  location = var.location
}

# The App Service Plan (Server farm to host Web Apps)
resource "azurerm_service_plan" "app_plan" {
  name                = "opushire-app-plan"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  os_type             = "Linux"
  sku_name            = "B1" # Basic Tier (Modify to P1v2 or Free as needed)
}

# The Backend Node.js Web App
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
    "WEBSITE_NODE_DEFAULT_VERSION" = "~20"
    "WEBSITE_RUN_FROM_PACKAGE"     = "1"
    "NODE_ENV"                     = "production"
    "SCM_DO_BUILD_DURING_DEPLOYMENT" = "false"
  }
}

# The Frontend Next.js Web App
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
    "WEBSITE_NODE_DEFAULT_VERSION" = "~20"
    "WEBSITE_RUN_FROM_PACKAGE"     = "1"
    "NODE_ENV"                     = "production"
    "SCM_DO_BUILD_DURING_DEPLOYMENT" = "false"
    "PORT"                         = "3000"
  }
}
