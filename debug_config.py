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
    
    # Check configuration
    if hasattr(container_app, 'configuration'):
        print("Configuration attributes:")
        for attr in dir(container_app.configuration):
            if not attr.startswith('_'):
                print(f"  {attr}")
        
        if hasattr(container_app.configuration, 'ingress'):
            print(f"\nIngress: {container_app.configuration.ingress}")
            print(f"Ingress external: {container_app.configuration.ingress.external}")
            print(f"Ingress FQDN: {container_app.configuration.ingress.fqdn}")
    
except Exception as e:
    print(f"❌ Error: {e}", file=sys.stderr)
    import traceback
    traceback.print_exc()
    sys.exit(1)
