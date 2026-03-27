#!/usr/bin/env python3
import sys
import json
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
    
    print("\n=== Container Configuration ===")
    print(f"Name: {container_app.name}")
    print(f"Provisioning State: {container_app.provisioning_state}")
    print(f"Running Status: {container_app.running_status}")
    
    print("\n=== Ingress Configuration ===")
    ingress = container_app.configuration.ingress
    print(f"External: {ingress.external}")
    print(f"FQDN: {ingress.fqdn}")
    print(f"Target Port: {ingress.target_port}")
    print(f"Transport: {ingress.transport}")
    
    print("\n=== Latest Revision ===")
    print(f"Latest Revision Name: {container_app.latest_revision_name}")
    print(f"Latest Revision FQDN: {container_app.latest_revision_fqdn}")
    
    print("\n=== Template Configuration ===")
    if container_app.template.containers:
        for i, cont in enumerate(container_app.template.containers):
            print(f"\nContainer {i}:")
            print(f"  Name: {cont.name}")
            print(f"  Image: {cont.image}")
            print(f"  CPU: {cont.cpu}")
            print(f"  Memory: {cont.memory}")
            if cont.resources and cont.resources.cpu:
                print(f"  Resources CPU: {cont.resources.cpu}")
    
except Exception as e:
    print(f"❌ Error: {e}", file=sys.stderr)
    import traceback
    traceback.print_exc()
    sys.exit(1)
