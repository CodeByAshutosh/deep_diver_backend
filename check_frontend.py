import os
from azure.identity import AzureCliCredential
from azure.containerregistry import ContainerRegistryClient
from azure.containerapp.models import ContainerApp
from azure.containerapp import ContainerAppsClient

credential = AzureCliCredential()
client = ContainerAppsClient(
    subscription_id="$([System.Environment]::GetEnvironmentVariable('AZURE_SUBSCRIPTION_ID'))",
    resource_group_name="deep-diver-rg",
    credential=credential
)

try:
    app = client.container_apps.get("pr-slides-frontend")
    print(f"Frontend Status: {app.properties.provisioning_state}")
    print(f"Running: {app.properties.running_status}")
except Exception as e:
    print(f"Error: {e}")
