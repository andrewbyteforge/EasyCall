"""
Test workflow execution with database nodes.

Run this script to test Phase 6 Part B implementation.
Usage: python test_workflow_execution.py
"""

import requests
import json
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:8000"
API_URL = f"{BASE_URL}/api/v1"

print("=" * 70)
print("TESTING WORKFLOW EXECUTION - Phase 6 Part B")
print("=" * 70)
print()

# Test 1: Create a simple workflow
print("[TEST 1] Creating test workflow...")
workflow_data = {
    "name": f"Test Database Node Execution - {datetime.now().strftime('%H:%M:%S')}",
    "description": "Testing database node execution functionality",
    "canvas_data": {
        "nodes": [
            {
                "id": "node_1",
                "type": "single_address",
                "position": {"x": 100, "y": 100},
                "data": {
                    "label": "Bitcoin Address",
                    "configValues": {
                        "address": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
                        "blockchain": "bitcoin"
                    }
                }
            },
            {
                "id": "node_2",
                "type": "console_log",
                "position": {"x": 400, "y": 100},
                "data": {
                    "label": "Console Output",
                    "configValues": {}
                }
            }
        ],
        "edges": [
            {
                "id": "edge_1",
                "source": "node_1",
                "target": "node_2",
                "sourceHandle": "address",
                "targetHandle": "input"
            }
        ]
    }
}

try:
    response = requests.post(
        f"{API_URL}/workflows/",
        json=workflow_data,
        headers={"Content-Type": "application/json"}
    )
    
    if response.status_code in [200, 201]:
        workflow = response.json()
        workflow_uuid = workflow.get('uuid')
        print(f"✅ Workflow created successfully!")
        print(f"   UUID: {workflow_uuid}")
        print(f"   Name: {workflow.get('name')}")
    else:
        print(f"❌ Failed to create workflow")
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text}")
        exit(1)
        
except Exception as e:
    print(f"❌ Error creating workflow: {e}")
    exit(1)

print()

# Test 2: Execute the workflow
print("[TEST 2] Executing workflow...")
try:
    response = requests.post(
        f"{API_URL}/workflows/{workflow_uuid}/execute/",
        headers={"Content-Type": "application/json"}
    )
    
    if response.status_code == 200:
        result = response.json()
        print(f"✅ Workflow executed successfully!")
        print(f"   Status: {result.get('status')}")
        
        # Show execution log
        if 'execution_log' in result:
            print(f"\n📋 Execution Log:")
            for log_entry in result['execution_log'][:10]:  # First 10 lines
                print(f"   {log_entry}")
            
            if len(result['execution_log']) > 10:
                print(f"   ... ({len(result['execution_log']) - 10} more lines)")
        
        # Show node outputs
        if 'node_outputs' in result:
            print(f"\n📤 Node Outputs:")
            for node_id, outputs in result['node_outputs'].items():
                print(f"   {node_id}: {list(outputs.keys())}")
    else:
        print(f"❌ Failed to execute workflow")
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text}")
        
except Exception as e:
    print(f"❌ Error executing workflow: {e}")

print()

# Test 3: List all workflows
print("[TEST 3] Listing workflows...")
try:
    response = requests.get(f"{API_URL}/workflows/")
    
    if response.status_code == 200:
        workflows = response.json()
        count = len(workflows) if isinstance(workflows, list) else workflows.get('count', 0)
        print(f"✅ Found {count} workflow(s)")
        
        if isinstance(workflows, list) and workflows:
            print(f"\n📋 Recent Workflows:")
            for wf in workflows[:5]:
                print(f"   - {wf.get('name')} ({wf.get('uuid')})")
    else:
        print(f"❌ Failed to list workflows")
        print(f"   Status: {response.status_code}")
        
except Exception as e:
    print(f"❌ Error listing workflows: {e}")

print()
print("=" * 70)
print("✅ TESTING COMPLETE")
print("=" * 70)
print()
print("Next steps:")
print("1. Check Django admin for OpenAPI specs")
print("2. Upload and parse a spec to generate database nodes")
print("3. Create a workflow with database nodes")
print("4. Execute it!")
print()