# =============================================================================
# FILE: backend/test_integration.py
# =============================================================================
# Script to test OpenAPI integration functionality.
# =============================================================================
"""
Test script for OpenAPI spec upload and node generation.

Usage:
    python test_integration.py
"""

import os
import sys
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.integrations.models import OpenAPISpec, APIProvider
from apps.integrations.openapi_parser import OpenAPIParser
from apps.integrations.node_generator import NodeGenerator


def main():
    """Run integration tests."""
    print("=" * 80)
    print("TESTING OPENAPI INTEGRATION")
    print("=" * 80)
    
    # Test 1: Parse TRM Labs sample spec
    print("\n[TEST 1] Parsing TRM Labs sample spec...")
    try:
        parser = OpenAPIParser()
        trm_result = parser.parse_file("test_data/trm_labs_sample.yaml")
        
        print(f"✓ Parsed successfully")
        print(f"  API: {trm_result['api_info']['title']}")
        print(f"  Version: {trm_result['api_info']['version']}")
        print(f"  Endpoints: {len(trm_result['endpoints'])}")
        
        # List endpoints
        print("\n  Endpoints:")
        for endpoint in trm_result['endpoints']:
            print(f"    - {endpoint['method']} {endpoint['path']}")
        
    except Exception as e:
        print(f"✗ Failed: {e}")
        return False
    
    # Test 2: Parse Chainalysis sample spec
    print("\n[TEST 2] Parsing Chainalysis sample spec...")
    try:
        parser = OpenAPIParser()
        chain_result = parser.parse_file("test_data/chainalysis_sample.json")
        
        print(f"✓ Parsed successfully")
        print(f"  API: {chain_result['api_info']['title']}")
        print(f"  Version: {chain_result['api_info']['version']}")
        print(f"  Endpoints: {len(chain_result['endpoints'])}")
        
    except Exception as e:
        print(f"✗ Failed: {e}")
        return False
    
    # Test 3: Generate nodes from TRM Labs spec
    print("\n[TEST 3] Generating nodes from TRM Labs spec...")
    try:
        generator = NodeGenerator()
        nodes = generator.generate_nodes(
            endpoints=trm_result['endpoints'],
            provider="trm_labs",
            category="query"
        )
        
        print(f"✓ Generated {len(nodes)} nodes")
        print("\n  Generated Nodes:")
        for node in nodes:
            print(f"    - {node['name']}")
            print(f"      Type: {node['type']}")
            print(f"      Inputs: {len(node['inputs'])}")
            print(f"      Outputs: {len(node['outputs'])}")
        
    except Exception as e:
        print(f"✗ Failed: {e}")
        return False
    
    # Test 4: Generate nodes from Chainalysis spec
    print("\n[TEST 4] Generating nodes from Chainalysis spec...")
    try:
        generator = NodeGenerator()
        nodes = generator.generate_nodes(
            endpoints=chain_result['endpoints'],
            provider="chainalysis",
            category="query"
        )
        
        print(f"✓ Generated {len(nodes)} nodes")
        
    except Exception as e:
        print(f"✗ Failed: {e}")
        return False
    
    # Test 5: Database operations
    print("\n[TEST 5] Testing database operations...")
    try:
        # Create spec
        spec = OpenAPISpec.objects.create(
            provider=APIProvider.TRM_LABS,
            name="Test Spec",
            version="1.0.0",
            description="Test specification"
        )
        print(f"✓ Created spec: {spec.uuid}")
        
        # Mark as parsed
        spec.mark_as_parsed(trm_result)
        print(f"✓ Marked as parsed with {spec.get_endpoint_count()} endpoints")
        
        # Test to_dict
        spec_dict = spec.to_dict()
        print(f"✓ Converted to dict with {len(spec_dict)} fields")
        
        # Clean up
        spec.delete()
        print(f"✓ Deleted test spec")
        
    except Exception as e:
        print(f"✗ Failed: {e}")
        return False
    
    print("\n" + "=" * 80)
    print("ALL TESTS PASSED ✓")
    print("=" * 80)
    return True


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)