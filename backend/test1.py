"""Test database node execution"""
import requests

BASE_URL = "http://localhost:8000/api/v1"

# Create workflow with database node
workflow_data = {
    "name": "Test TRM Database Node",
    "canvas_data": {
        "nodes": [
            {
                "id": "addr",
                "type": "single_address",
                "data": {
                    "configValues": {
                        "address": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
                    }
                }
            },
            {
                "id": "creds",
                "type": "credential_trm",
                "data": {
                    "configValues": {
                        "api_key": "your_trm_api_key_here"
                    }
                }
            },
            {
                "id": "db_node",
                "type": "trm_labs_get_attribution",  # Database-generated node!
                "data": {
                    "configValues": {}
                }
            }
        ],
        "edges": [
            {
                "id": "e1",
                "source": "addr",
                "target": "db_node",
                "sourceHandle": "address",
                "targetHandle": "address"
            },
            {
                "id": "e2",
                "source": "creds",
                "target": "db_node",
                "sourceHandle": "credentials",
                "targetHandle": "credentials"
            }
        ]
    }
}

print("Creating workflow with database node...")
response = requests.post(f"{BASE_URL}/workflows/", json=workflow_data)
workflow = response.json()
workflow_uuid = workflow.get('uuid')

print(f"✅ Created workflow: {workflow_uuid}")

print("\nExecuting workflow...")
response = requests.post(f"{BASE_URL}/workflows/{workflow_uuid}/execute/")
result = response.json()

print(f"Status: {result.get('status')}")

# Look for database node execution in logs
if 'execution_log' in result:
    print("\n📋 Execution Log:")
    for log in result['execution_log']:
        if '[DATABASE]' in log:
            print(f"   {log}")

print("\n✅ Database node test complete!")
