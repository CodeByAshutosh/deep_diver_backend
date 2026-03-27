#!/usr/bin/env python3
import sys
from azure.identity import InteractiveBrowserCredential
from azure.mgmt.appcontainers import ContainerAppsAPIClient

subscription_id = "4e78cd80-41c7-4f58-b92b-334cde20f39b"
tenant_id = "2b08247b-be82-4b00-ad96-ca1606b8b51a"
resource_group = "deep-diver-rg"
container_app_name = "deep-diver-backend"

try:
    print("Logging in to Azure...")
    credential = InteractiveBrowserCredential(tenant_id=tenant_id)
    client = ContainerAppsAPIClient(credential, subscription_id)
    
    print(f"Fetching container app: {container_app_name}")
    container_app = client.container_apps.get(resource_group, container_app_name)
    
    print(f"Current ingress external: {container_app.configuration.ingress.external}")
    
    # Update ingress to be external
    container_app.configuration.ingress.external = True
    
    print("Updating container app to expose ingress externally...")
    async_operation = client.container_apps.begin_create_or_update(
        resource_group, 
        container_app_name, 
        container_app
    )
    
    result = async_operation.result()
    print(f"✅ Update successful!")
    print(f"Container App: {result.name}")
    print(f"Ingress external: {result.configuration.ingress.external}")
    print(f"FQDN: {result.configuration.ingress.fqdn}")
    
except Exception as e:
    print(f"❌ Error: {e}", file=sys.stderr)
    sys.exit(1)
