"""
Debug script for Test 3 - DELETE verification issue
Run in Django shell or as standalone Python script
"""

import requests
import json

BASE_URL = "http://localhost:8000/api/v1/workflows/"

print("\n" + "="*70)
print("  DEBUG: Delete Verification Issue")
print("="*70)

# Step 1: Check what the list endpoint returns
print("\n📋 Step 1: Check list endpoint response format")
try:
    response = requests.get(BASE_URL)
    print(f"Status Code: {response.status_code}")
    print(f"Content-Type: {response.headers.get('Content-Type')}")
    print(f"Response Length: {len(response.text)} bytes")
    print(f"Response Text (first 500 chars):\n{response.text[:500]}")
    
    # Try to parse JSON
    try:
        data = response.json()
        print(f"\n✅ JSON parsed successfully")
        print(f"Type: {type(data)}")
        
        # Check structure
        if isinstance(data, list):
            print(f"📊 Direct list with {len(data)} items")
        elif isinstance(data, dict):
            print(f"📊 Dictionary response")
            print(f"Keys: {list(data.keys())}")
            if "results" in data:
                print(f"   - results: {len(data['results'])} items")
            if "count" in data:
                print(f"   - count: {data['count']}")
    except json.JSONDecodeError as e:
        print(f"\n❌ JSON parse error: {e}")
        print("This is the issue! Response is not valid JSON.")
        
except Exception as e:
    print(f"❌ Error: {e}")

# Step 2: Create a workflow and immediately check it's in the list
print("\n" + "="*70)
print("📝 Step 2: Create workflow and verify it appears in list")
print("="*70)

workflow_data = {
    "name": "Debug Test Workflow",
    "description": "Testing list visibility",
    "canvas_data": {"nodes": [], "edges": [], "viewport": {"x": 0, "y": 0, "zoom": 1}}
}

try:
    # Create workflow
    create_response = requests.post(BASE_URL, json=workflow_data)
    if create_response.status_code == 201:
        workflow = create_response.json()
        workflow_uuid = workflow["uuid"]
        print(f"✅ Created workflow: {workflow_uuid}")
        
        # Check it's in the list
        list_response = requests.get(BASE_URL)
        if list_response.status_code == 200:
            data = list_response.json()
            
            # Handle both list and paginated response
            workflows = data if isinstance(data, list) else data.get("results", [])
            
            found = any(w["uuid"] == workflow_uuid for w in workflows)
            if found:
                print(f"✅ Workflow found in list ({len(workflows)} total workflows)")
            else:
                print(f"❌ Workflow NOT found in list ({len(workflows)} total workflows)")
        else:
            print(f"❌ List request failed: {list_response.status_code}")
    else:
        print(f"❌ Create failed: {create_response.status_code}")
        print(create_response.text)
        
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()

# Step 3: Delete the workflow and verify it's gone
print("\n" + "="*70)
print("🗑️  Step 3: Delete workflow and verify it's gone")
print("="*70)

try:
    # Delete
    delete_response = requests.delete(f"{BASE_URL}{workflow_uuid}/")
    print(f"Delete Status: {delete_response.status_code}")
    print(f"Delete Response Length: {len(delete_response.text)} bytes")
    
    if delete_response.status_code == 204:
        print("✅ Delete returned 204 No Content (correct)")
        
        # Wait a moment for database to update
        import time
        time.sleep(0.5)
        
        # Check list again
        print("\n📋 Checking list after delete...")
        list_response = requests.get(BASE_URL)
        print(f"List Status: {list_response.status_code}")
        print(f"List Content-Type: {list_response.headers.get('Content-Type')}")
        print(f"List Response Length: {len(list_response.text)} bytes")
        
        if list_response.status_code == 200:
            # This is where the error occurred before
            try:
                if not list_response.text.strip():
                    print("⚠️  Response is EMPTY - this is the bug!")
                    print("Expected: JSON array or paginated response")
                else:
                    data = list_response.json()
                    workflows = data if isinstance(data, list) else data.get("results", [])
                    
                    still_visible = any(w["uuid"] == workflow_uuid for w in workflows)
                    
                    if not still_visible:
                        print(f"✅ Workflow correctly removed from list ({len(workflows)} remaining)")
                    else:
                        print(f"❌ Workflow STILL in list ({len(workflows)} total)")
            except json.JSONDecodeError as e:
                print(f"❌ JSON parse error: {e}")
                print(f"Response text: {list_response.text[:200]}")
        else:
            print(f"❌ List request failed: {list_response.status_code}")
    else:
        print(f"❌ Delete failed: {delete_response.status_code}")
        print(delete_response.text)
        
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "="*70 + "\n")