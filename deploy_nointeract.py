#!/usr/bin/env python3
"""
Non-interactive deployment script using DefaultAzureCredential
This avoids browser popups by using environment credentials or Azure CLI cached login
"""
import sys
import os
from dotenv import load_dotenv
from azure.identity import DefaultAzureCredential, AzureCliCredential
from azure.mgmt.appcontainers import ContainerAppsAPIClient

load_dotenv()

subscription_id = "4e78cd80-41c7-4f58-b92b-334cde20f39b"
resource_group = "deep-diver-rg"
container_app_name = "deep-diver-backend"
image = "shuklaashu1/deep-diver-backend:latest"

# Environment variables
env_vars = [
    {"name": "PORT", "value": os.getenv("PORT", "3000")},
    {"name": "GITHUB_TOKEN", "value": os.getenv("GITHUB_TOKEN", "")},
    {"name": "GITHUB_WEBHOOK_SECRET", "value": os.getenv("GITHUB_WEBHOOK_SECRET", "")},
    {"name": "OPENROUTER_API_KEY", "value": os.getenv("OPENROUTER_API_KEY", "")},
    {"name": "LLM_API_KEY", "value": os.getenv("LLM_API_KEY", "")},
    {"name": "PUBLIC_BASE_URL", "value": os.getenv("PUBLIC_BASE_URL", "")},
    {"name": "STORAGE_DIR", "value": os.getenv("STORAGE_DIR", "generated")}
]

try:
    print("🔐 Authenticating with Azure (non-interactive)...")
    
    # Try to use Azure CLI credentials first (no browser popup)
    # Falls back to other credential sources (env vars, managed identity, etc.)
    try:
        credential = AzureCliCredential()
        print("✓ Using Azure CLI credentials")
    except Exception as e:
        print(f"⚠️ Azure CLI auth failed, trying DefaultAzureCredential: {e}")
        credential = DefaultAzureCredential()
        print("✓ Using DefaultAzureCredential")
    
    client = ContainerAppsAPIClient(credential, subscription_id)
    
    print(f"📦 Fetching container app: {container_app_name}")
    container_app = client.container_apps.get(resource_group, container_app_name)
    
    print(f"🔄 Updating with image: {image}")
    if container_app.template.containers:
        container_app.template.containers[0].image = image
        container_app.template.containers[0].env = env_vars
    
    # Ensure external ingress
    if not container_app.configuration.ingress.external:
        print("🌐 Setting ingress to external...")
        container_app.configuration.ingress.external = True
    
    print("⏳ Deploying...")
    async_operation = client.container_apps.begin_create_or_update(
        resource_group, 
        container_app_name, 
        container_app
    )
    
    result = async_operation.result()
    print(f"✅ Deployment successful!")
    print(f"   Container App: {result.name}")
    print(f"   Status: {result.provisioning_state}")
    print(f"   URL: https://{result.configuration.ingress.fqdn}")
    
except Exception as e:
    print(f"❌ Error: {e}", file=sys.stderr)
    import traceback
    traceback.print_exc()
    sys.exit(1)
