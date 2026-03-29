#!/usr/bin/env python3
import sys
import os
from datetime import datetime
from dotenv import load_dotenv
from azure.identity import InteractiveBrowserCredential
from azure.mgmt.appcontainers import ContainerAppsAPIClient

# Load environment variables
load_dotenv()

subscription_id = "4e78cd80-41c7-4f58-b92b-334cde20f39b"
tenant_id = "2b08247b-be82-4b00-ad96-ca1606b8b51a"
resource_group = "deep-diver-rg"
container_app_name = "deep-diver-backend"

# Use timestamp tag to force new deployment
timestamp = datetime.now().strftime("%s")  # Unix timestamp
image_tag = f"shuklaashu1/deep-diver-backend:{timestamp}"

print(f"Using image tag: {image_tag}")
print("Note: Make sure to build and push this image first!")

# Environment variables from .env file
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
    print("Logging in to Azure...")
    credential = InteractiveBrowserCredential(tenant_id=tenant_id)
    client = ContainerAppsAPIClient(credential, subscription_id)
    
    print(f"Fetching container app: {container_app_name}")
    container_app = client.container_apps.get(resource_group, container_app_name)
    
    # Update container image and env vars
    if container_app.template.containers:
        container_app.template.containers[0].image = image_tag
        container_app.template.containers[0].env = env_vars
    
    # Ensure ingress is external
    if not container_app.configuration.ingress.external:
        print("⚠️ Setting ingress to external...")
        container_app.configuration.ingress.external = True
    
    print(f"Updating container app with image: {image_tag}")
    async_operation = client.container_apps.begin_create_or_update(
        resource_group, 
        container_app_name, 
        container_app
    )
    
    result = async_operation.result()
    print(f"✅ Deployment successful!")
    print(f"Container App: {result.name}")
    print(f"Provisioning State: {result.provisioning_state}")
    print(f"Public FQDN: https://{result.configuration.ingress.fqdn}")
    print(f"Latest Revision: {result.latest_revision_name}")
    
except Exception as e:
    print(f"❌ Error: {e}", file=sys.stderr)
    sys.exit(1)
