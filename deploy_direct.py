#!/usr/bin/env python3
"""
Direct Azure deployment using managed identity or CLI token.
Make sure you're logged in with: az login
"""
import subprocess
import json
import sys

subscription_id = "4e78cd80-41c7-4f58-b92b-334cde20f39b"
resource_group = "deep-diver-rg"
container_app_name = "pr-slides-backend"
image = "shuklaashu1/pr-slides-backend:v12"

def run_az_cli(cmd):
    """Run Azure CLI command and return output"""
    try:
        result = subprocess.run(f"az {cmd}", shell=True, capture_output=True, text=True, check=True)
        return result.stdout
    except subprocess.CalledProcessError as e:
        print(f"❌ CLI Error: {e.stderr}")
        return None

try:
    print("Checking Azure CLI credentials...")
    account_info = run_az_cli("account show --query id -o json")
    if not account_info:
        print("❌ Not logged in to Azure. Run: az login")
        sys.exit(1)
    
    print(f"✅ Logged in to Azure")
    
    print(f"\nFetching container app: {container_app_name}...")
    get_cmd = f'containerapp show --resource-group {resource_group} --name {container_app_name} -o json'
    container_app_json = run_az_cli(get_cmd)
    if not container_app_json:
        print("❌ Failed to fetch container app")
        sys.exit(1)
    
    container_app = json.loads(container_app_json)
    
    print(f"Updating image to: {image}")
    container_app["properties"]["template"]["containers"][0]["image"] = image
    
    # Write temp file
    import tempfile
    with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
        json.dump(container_app, f)
        temp_file = f.name
    
    print(f"Updating container app...")
    update_cmd = f'containerapp update --resource-group {resource_group} --name {container_app_name} --yaml {temp_file}'
    # Actually, we'll use a simpler approach
    
    # Use simpler Azure CLI to update just the image
    update_cmd = f'containerapp update --resource-group {resource_group} --name {container_app_name} --image {image}'
    result = subprocess.run(f"az {update_cmd}", shell=True, capture_output=True, text=True)
    
    if result.returncode == 0:
        print("✅ Deployment update sent!")
        print("Note: Container app update may take 1-3 minutes to complete")
    else:
        print(f"❌ Update failed: {result.stderr}")
        sys.exit(1)
        
except Exception as e:
    print(f"❌ Error: {e}")
    sys.exit(1)
