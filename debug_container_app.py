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
    
    # Print available attributes
    print("Available attributes:")
    for attr in dir(container_app):
        if not attr.startswith('_'):
            print(f"  {attr}")
    
    # Try to access ingress
    if hasattr(container_app, 'ingress'):
        print(f"\nIngress (direct): {container_app.ingress}")
    if hasattr(container_app, 'properties'):
        print(f"Properties: {container_app.properties}")
        if hasattr(container_app.properties, 'ingress'):
            print(f"  Properties.ingress: {container_app.properties.ingress}")
    
except Exception as e:
    print(f"❌ Error: {e}", file=sys.stderr)
    import traceback
    traceback.print_exc()
    sys.exit(1)
