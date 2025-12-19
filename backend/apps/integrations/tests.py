# =============================================================================
# FILE: backend/apps/integrations/tests.py
# =============================================================================
# Unit tests for integrations app.
# =============================================================================
"""
Tests for API integration functionality.
"""

# =============================================================================
# IMPORTS
# =============================================================================

import os
import json
import tempfile
from django.test import TestCase, override_settings
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APITestCase
from rest_framework import status

from apps.integrations.models import OpenAPISpec, APIProvider
from apps.integrations.openapi_parser import OpenAPIParser, OpenAPIParseError
from apps.integrations.node_generator import NodeGenerator


# =============================================================================
# MODEL TESTS
# =============================================================================

class OpenAPISpecModelTests(TestCase):
    """Tests for OpenAPISpec model."""
    
    def setUp(self):
        """Set up test data."""
        self.spec = OpenAPISpec.objects.create(
            provider=APIProvider.TRM_LABS,
            name="Test API Spec",
            version="1.0",
            description="Test specification",
        )
    
    def test_str_representation(self):
        """Test string representation."""
        expected = f"TRM Labs 1.0 - Test API Spec"
        self.assertEqual(str(self.spec), expected)
    
    def test_get_endpoint_count_empty(self):
        """Test endpoint count with no parsed data."""
        self.assertEqual(self.spec.get_endpoint_count(), 0)
    
    def test_get_endpoint_count_with_data(self):
        """Test endpoint count with parsed data."""
        self.spec.parsed_data = {
            "endpoints": [
                {"path": "/test1", "method": "GET"},
                {"path": "/test2", "method": "POST"},
            ]
        }
        self.spec.save()
        self.assertEqual(self.spec.get_endpoint_count(), 2)
    
    def test_mark_as_parsed(self):
        """Test marking spec as parsed."""
        parsed_data = {
            "api_info": {"title": "Test API"},
            "endpoints": [{"path": "/test", "method": "GET"}],
        }
        
        self.spec.mark_as_parsed(parsed_data)
        
        self.assertTrue(self.spec.is_parsed)
        self.assertEqual(self.spec.parsed_data, parsed_data)
        self.assertEqual(self.spec.parse_error, "")
    
    def test_mark_parse_failed(self):
        """Test marking spec as failed."""
        error_message = "Parse error occurred"
        
        self.spec.mark_parse_failed(error_message)
        
        self.assertFalse(self.spec.is_parsed)
        self.assertEqual(self.spec.parse_error, error_message)
        self.assertEqual(self.spec.parsed_data, {})
    
    def test_to_dict(self):
        """Test dictionary conversion."""
        result = self.spec.to_dict()
        
        self.assertIn("provider", result)
        self.assertIn("provider_display", result)
        self.assertIn("name", result)
        self.assertIn("version", result)
        self.assertIn("endpoint_count", result)
        self.assertEqual(result["name"], "Test API Spec")


# =============================================================================
# PARSER TESTS
# =============================================================================

class OpenAPIParserTests(TestCase):
    """Tests for OpenAPIParser."""
    
    def setUp(self):
        """Set up test parser."""
        self.parser = OpenAPIParser()
        
        # Sample OpenAPI spec
        self.sample_spec = {
            "openapi": "3.0.0",
            "info": {
                "title": "Test API",
                "version": "1.0.0",
                "description": "Test API description",
            },
            "servers": [
                {"url": "https://api.test.com", "description": "Production"}
            ],
            "paths": {
                "/users/{id}": {
                    "get": {
                        "operationId": "getUser",
                        "summary": "Get user by ID",
                        "parameters": [
                            {
                                "name": "id",
                                "in": "path",
                                "required": True,
                                "schema": {"type": "string"}
                            }
                        ],
                        "responses": {
                            "200": {
                                "description": "Success",
                                "content": {
                                    "application/json": {
                                        "schema": {
                                            "type": "object",
                                            "properties": {
                                                "id": {"type": "string"},
                                                "name": {"type": "string"},
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "components": {
                "securitySchemes": {
                    "bearerAuth": {
                        "type": "http",
                        "scheme": "bearer",
                    }
                }
            }
        }
    
    def test_parse_content_yaml(self):
        """Test parsing YAML content."""
        import yaml
        
        yaml_content = yaml.dump(self.sample_spec)
        result = self.parser.parse_content(yaml_content, "yaml")
        
        self.assertIn("api_info", result)
        self.assertIn("servers", result)
        self.assertIn("endpoints", result)
        self.assertEqual(result["api_info"]["title"], "Test API")
    
    def test_parse_content_json(self):
        """Test parsing JSON content."""
        json_content = json.dumps(self.sample_spec)
        result = self.parser.parse_content(json_content, "json")
        
        self.assertIn("api_info", result)
        self.assertEqual(result["api_info"]["version"], "1.0.0")
    
    def test_extract_api_info(self):
        """Test extracting API info."""
        self.parser.spec_data = self.sample_spec
        api_info = self.parser._extract_api_info()
        
        self.assertEqual(api_info["title"], "Test API")
        self.assertEqual(api_info["version"], "1.0.0")
        self.assertEqual(api_info["description"], "Test API description")
    
    def test_extract_servers(self):
        """Test extracting servers."""
        self.parser.spec_data = self.sample_spec
        servers = self.parser._extract_servers()
        
        self.assertEqual(len(servers), 1)
        self.assertEqual(servers[0]["url"], "https://api.test.com")
    
    def test_extract_endpoints(self):
        """Test extracting endpoints."""
        self.parser.spec_data = self.sample_spec
        endpoints = self.parser._extract_endpoints()
        
        self.assertEqual(len(endpoints), 1)
        self.assertEqual(endpoints[0]["path"], "/users/{id}")
        self.assertEqual(endpoints[0]["method"], "GET")
        self.assertEqual(endpoints[0]["operation_id"], "getUser")
    
    def test_validate_openapi_version_valid(self):
        """Test validating valid OpenAPI version."""
        self.parser.spec_data = {"openapi": "3.0.0"}
        self.parser._validate_openapi_version()  # Should not raise
    
    def test_validate_openapi_version_invalid(self):
        """Test validating invalid OpenAPI version."""
        self.parser.spec_data = {"openapi": "2.0"}
        
        with self.assertRaises(OpenAPIParseError):
            self.parser._validate_openapi_version()
    
    def test_parse_invalid_yaml(self):
        """Test parsing invalid YAML."""
        invalid_yaml = "{ invalid: yaml: content"
        
        with self.assertRaises(OpenAPIParseError):
            self.parser.parse_content(invalid_yaml, "yaml")


# =============================================================================
# NODE GENERATOR TESTS
# =============================================================================

class NodeGeneratorTests(TestCase):
    """Tests for NodeGenerator."""
    
    def setUp(self):
        """Set up test generator."""
        self.generator = NodeGenerator()
        
        self.sample_endpoint = {
            "path": "/address/{address}",
            "method": "GET",
            "operation_id": "getAddress",
            "summary": "Get address details",
            "description": "Retrieve details for a blockchain address",
            "parameters": [
                {
                    "name": "address",
                    "in": "path",
                    "required": True,
                    "schema": {"type": "string"},
                    "description": "Blockchain address",
                }
            ],
            "responses": {
                "200": {
                    "description": "Success",
                    "content_type": "application/json",
                    "schema": {
                        "type": "object",
                        "properties": {
                            "address": {"type": "string"},
                            "balance": {"type": "number"},
                        }
                    }
                }
            }
        }
    
    def test_generate_nodes(self):
        """Test generating nodes from endpoints."""
        endpoints = [self.sample_endpoint]
        nodes = self.generator.generate_nodes(endpoints, "trm_labs", "query")
        
        self.assertEqual(len(nodes), 1)
        self.assertIn("type", nodes[0])
        self.assertIn("name", nodes[0])
        self.assertIn("inputs", nodes[0])
        self.assertIn("outputs", nodes[0])
    
    def test_generate_node_type(self):
        """Test generating node type identifier."""
        node_type = self.generator._generate_node_type(self.sample_endpoint, "trm_labs")
        
        self.assertEqual(node_type, "trm_labs_getaddress")
    
    def test_generate_node_name(self):
        """Test generating node name."""
        node_name = self.generator._generate_node_name(self.sample_endpoint)
        
        self.assertEqual(node_name, "Get address details")
    
    def test_extract_node_inputs(self):
        """Test extracting node inputs."""
        inputs = self.generator._extract_node_inputs(self.sample_endpoint)
        
        # Should have credentials + address parameter
        self.assertGreaterEqual(len(inputs), 2)
        
        # Check for credentials input
        cred_input = next((i for i in inputs if i["id"] == "credentials"), None)
        self.assertIsNotNone(cred_input)
        self.assertEqual(cred_input["type"], "CREDENTIALS")
        
        # Check for address input
        addr_input = next((i for i in inputs if i["id"] == "address"), None)
        self.assertIsNotNone(addr_input)
        self.assertEqual(addr_input["type"], "ADDRESS")
    
    def test_extract_node_outputs(self):
        """Test extracting node outputs."""
        outputs = self.generator._extract_node_outputs(self.sample_endpoint)
        
        self.assertGreater(len(outputs), 0)
        
        # Check for specific outputs from schema
        output_ids = [o["id"] for o in outputs]
        self.assertIn("address", output_ids)
        self.assertIn("balance", output_ids)
    
    def test_map_openapi_type(self):
        """Test mapping OpenAPI types to workflow types."""
        self.assertEqual(self.generator._map_openapi_type("string"), "STRING")
        self.assertEqual(self.generator._map_openapi_type("integer"), "NUMBER")
        self.assertEqual(self.generator._map_openapi_type("boolean"), "BOOLEAN")
        self.assertEqual(self.generator._map_openapi_type("array"), "ADDRESS_LIST")
        self.assertEqual(self.generator._map_openapi_type("object"), "JSON_DATA")
        self.assertEqual(self.generator._map_openapi_type("unknown"), "JSON_DATA")


# =============================================================================
# API TESTS
# =============================================================================

@override_settings(MEDIA_ROOT=tempfile.mkdtemp())
class OpenAPISpecAPITests(APITestCase):
    """Tests for OpenAPI Spec API endpoints."""
    
    def setUp(self):
        """Set up test client and data."""
        self.list_url = "/api/v1/integrations/specs/"
    
    def test_list_specs(self):
        """Test listing specifications."""
        # Create test specs
        OpenAPISpec.objects.create(
            provider=APIProvider.TRM_LABS,
            name="Test Spec 1",
            version="1.0",
        )
        OpenAPISpec.objects.create(
            provider=APIProvider.CHAINALYSIS,
            name="Test Spec 2",
            version="2.0",
        )
        
        response = self.client.get(self.list_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
    
    def test_create_spec_with_file(self):
        """Test creating spec with file upload."""
        # Create a simple OpenAPI spec file
        spec_content = json.dumps({
            "openapi": "3.0.0",
            "info": {"title": "Test", "version": "1.0"},
            "paths": {}
        })
        
        spec_file = SimpleUploadedFile(
            "test_spec.json",
            spec_content.encode(),
            content_type="application/json"
        )
        
        data = {
            "provider": APIProvider.CUSTOM,
            "name": "Test Upload",
            "version": "1.0",
            "spec_file": spec_file,
        }
        
        response = self.client.post(self.list_url, data, format="multipart")
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["name"], "Test Upload")
        self.assertTrue(response.data["is_parsed"])
    
    def test_retrieve_spec(self):
        """Test retrieving a single spec."""
        spec = OpenAPISpec.objects.create(
            provider=APIProvider.TRM_LABS,
            name="Test Spec",
            version="1.0",
        )
        
        url = f"/api/v1/integrations/specs/{spec.uuid}/"
        response = self.client.get(url)
        
        self.assertEqual(response.status.HTTP_200_OK)
        self.assertEqual(response.data["name"], "Test Spec")
    
    def test_delete_spec(self):
        """Test deleting a spec (soft delete)."""
        spec = OpenAPISpec.objects.create(
            provider=APIProvider.TRM_LABS,
            name="Test Spec",
            version="1.0",
        )
        
        url = f"/api/v1/integrations/specs/{spec.uuid}/"
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        # Verify soft delete
        spec.refresh_from_db()
        self.assertFalse(spec.is_active)