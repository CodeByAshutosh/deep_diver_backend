#!/usr/bin/env python3
import sys
import os
import json
from dotenv import load_dotenv
from azure.identity import InteractiveBrowserCredential
from azure.mgmt.appcontainers import ContainerAppsAPIClient
from azure.mgmt.appcontainers.models import Container, Template

# Load environment variables from .env file
load_dotenv()

subscription_id = "4e78cd80-41c7-4f58-b92b-334cde20f39b"
tenant_id = "2b08247b-be82-4b00-ad96-ca1606b8b51a"
resource_group = "deep-diver-rg"
container_app_name = "deep-diver-backend"
image = "shuklaashu1/pr-slides-backend:v13"

# Environment variables from .env file
env_vars = [
    {"name": "PORT", "value": os.getenv("PORT", "3000")},
    {"name": "GITHUB_TOKEN", "value": os.getenv("GITHUB_TOKEN")},
    {"name": "GITHUB_WEBHOOK_SECRET", "value": os.getenv("GITHUB_WEBHOOK_SECRET")},
    {"name": "ALIBABA_CLOUD_API_KEY", "value": os.getenv("ALIBABA_CLOUD_API_KEY")},
    {"name": "OPENROUTER_API_KEY", "value": os.getenv("OPENROUTER_API_KEY")},
    {"name": "LLM_API_KEY", "value": os.getenv("LLM_API_KEY")},
    {"name": "PUBLIC_BASE_URL", "value": os.getenv("PUBLIC_BASE_URL")},
    {"name": "STORAGE_DIR", "value": os.getenv("STORAGE_DIR", "generated")},
    {"name": "JWT_SECRET", "value": os.getenv("JWT_SECRET")},
    {"name": "ADMIN_EMAIL", "value": os.getenv("ADMIN_EMAIL")},
    {"name": "GITHUB_OAUTH_CLIENT_ID", "value": os.getenv("GITHUB_OAUTH_CLIENT_ID")},
    {"name": "GITHUB_OAUTH_CLIENT_SECRET", "value": os.getenv("GITHUB_OAUTH_CLIENT_SECRET")},
    {"name": "GOOGLE_OAUTH_CLIENT_ID", "value": os.getenv("GOOGLE_OAUTH_CLIENT_ID")},
    {"name": "GOOGLE_OAUTH_CLIENT_SECRET", "value": os.getenv("GOOGLE_OAUTH_CLIENT_SECRET")},
    {"name": "MICROSOFT_OAUTH_CLIENT_ID", "value": os.getenv("MICROSOFT_OAUTH_CLIENT_ID")},
    {"name": "MICROSOFT_OAUTH_CLIENT_SECRET", "value": os.getenv("MICROSOFT_OAUTH_CLIENT_SECRET")},
    {"name": "MICROSOFT_OAUTH_TENANT", "value": os.getenv("MICROSOFT_OAUTH_TENANT", "common")}
]

try:
    # Authenticate
    print("Logging in to Azure...")
    credential = InteractiveBrowserCredential(tenant_id=tenant_id)
    
    # Create client
    client = ContainerAppsAPIClient(credential, subscription_id)
    
    print(f"Fetching container app: {container_app_name}")
    # Get existing container app
    container_app = client.container_apps.get(resource_group, container_app_name)
    
    # Update the template with new image and env vars
    if container_app.template.containers:
        container_app.template.containers[0].image = image
        container_app.template.containers[0].env = env_vars
    
    print(f"Updating container app with image: {image}")
    # Ensure ingress is external
    if not container_app.configuration.ingress.external:
        print("⚠️ Ingress is internal, making it external...")
        container_app.configuration.ingress.external = True
    
    print(f"Updating container app with image: {image}")
    # Update the container app
    async_operation = client.container_apps.begin_create_or_update(
        resource_group, 
        container_app_name, 
        container_app
    )
    
    result = async_operation.result()
    print(f"[SUCCESS] Deployment successful!")
    print(f"Container App: {result.name}")
    print(f"Provisioning State: {result.provisioning_state}")
    print(f"Ingress External: {result.configuration.ingress.external}")
    print(f"Target Port: {result.configuration.ingress.target_port}")
    print(f"Public FQDN: https://{result.configuration.ingress.fqdn}")
    
except Exception as e:
    print(f"[ERROR] {e}", file=sys.stderr)
    sys.exit(1)





