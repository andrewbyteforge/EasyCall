# =============================================================================
# FILE: easycall/backend/tests/conftest.py
# =============================================================================
# Pytest configuration and shared fixtures for all test modules.
#
# This file is automatically loaded by pytest and provides:
# - Database fixtures for test isolation
# - API client fixtures for endpoint testing
# - Sample data fixtures for consistent test data
# - Mock fixtures for external services
# =============================================================================
"""
Pytest configuration and shared fixtures.
"""

# =============================================================================
# IMPORTS
# =============================================================================

import os
import uuid
from typing import Any, Dict, Generator

import pytest
from django.conf import settings
from rest_framework.test import APIClient

# =============================================================================
# DJANGO SETUP
# =============================================================================

# Ensure Django settings are configured for tests
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")


# =============================================================================
# API CLIENT FIXTURES
# =============================================================================


@pytest.fixture
def api_client() -> APIClient:
    """
    Provide a DRF API test client.

    Returns:
        APIClient: Instance for making test requests.

    Example:
        def test_health_check(api_client):
            response = api_client.get("/api/v1/health/")
            assert response.status_code == 200
    """
    return APIClient()


# =============================================================================
# UUID FIXTURES
# =============================================================================


@pytest.fixture
def sample_uuid() -> str:
    """
    Generate a sample UUID for testing.

    Returns:
        str: A valid UUID4 string.
    """
    return str(uuid.uuid4())


@pytest.fixture
def multiple_uuids() -> list[str]:
    """
    Generate multiple UUIDs for batch testing.

    Returns:
        list[str]: List of 5 valid UUID4 strings.
    """
    return [str(uuid.uuid4()) for _ in range(5)]


# =============================================================================
# BLOCKCHAIN ADDRESS FIXTURES
# =============================================================================


@pytest.fixture
def sample_bitcoin_address() -> str:
    """
    Provide a sample Bitcoin address for testing.

    Returns:
        str: A valid-format Bitcoin address (not a real address).
    """
    return "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"


@pytest.fixture
def sample_ethereum_address() -> str:
    """
    Provide a sample Ethereum address for testing.

    Returns:
        str: A valid-format Ethereum address (not a real address).
    """
    return "0x742d35Cc6634C0532925a3b844Bc9e7595f0bC00"


@pytest.fixture
def sample_addresses() -> Dict[str, str]:
    """
    Provide sample addresses for multiple networks.

    Returns:
        dict: Dictionary of network -> address mappings.
    """
    return {
        "bitcoin": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
        "ethereum": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bC00",
        "litecoin": "LQ3B36Yv2rBz8vmaBqnYLpKmjxTqQwN8bN",
    }


@pytest.fixture
def sample_tx_hash() -> str:
    """
    Provide a sample transaction hash for testing.

    Returns:
        str: A valid-format transaction hash.
    """
    return "a" * 64  # 64 character hex string


# =============================================================================
# WORKFLOW DATA FIXTURES
# =============================================================================


@pytest.fixture
def sample_workflow_data() -> Dict[str, Any]:
    """
    Provide sample workflow data for testing.

    Returns:
        dict: Dictionary representing a basic workflow structure.
    """
    return {
        "name": "Test Workflow",
        "description": "A workflow for testing purposes",
        "canvas_data": {
            "nodes": [],
            "edges": [],
            "viewport": {"x": 0, "y": 0, "zoom": 1},
        },
    }


@pytest.fixture
def sample_node_data() -> Dict[str, Any]:
    """
    Provide sample node data for testing.

    Returns:
        dict: Dictionary representing a basic node structure.
    """
    return {
        "node_type": "single_address",
        "node_label": "Test Address Input",
        "position_x": 100.0,
        "position_y": 200.0,
        "config": {
            "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bC00",
            "network": "ethereum",
        },
    }


@pytest.fixture
def sample_connection_data() -> Dict[str, Any]:
    """
    Provide sample connection data for testing.

    Returns:
        dict: Dictionary representing a node connection.
    """
    return {
        "source_node": str(uuid.uuid4()),
        "target_node": str(uuid.uuid4()),
        "source_pin": "output",
        "target_pin": "input",
    }


# =============================================================================
# API CREDENTIAL FIXTURES
# =============================================================================


@pytest.fixture
def sample_api_credentials() -> Dict[str, str]:
    """
    Provide sample API credentials for testing.

    Returns:
        dict: Dictionary with sample API key and secret.
    """
    return {
        "api_key": "test-api-key-12345",
        "api_secret": "test-api-secret-67890",
        "api_url": "https://api.example.com",
    }


# =============================================================================
# FILE FIXTURES
# =============================================================================


@pytest.fixture
def sample_csv_content() -> str:
    """
    Provide sample CSV content for file processing tests.

    Returns:
        str: CSV content with sample addresses.
    """
    return """address,network,label
0x742d35Cc6634C0532925a3b844Bc9e7595f0bC00,ethereum,Test Address 1
1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa,bitcoin,Test Address 2
LQ3B36Yv2rBz8vmaBqnYLpKmjxTqQwN8bN,litecoin,Test Address 3"""


@pytest.fixture
def sample_json_data() -> Dict[str, Any]:
    """
    Provide sample JSON data for testing.

    Returns:
        dict: Sample JSON structure.
    """
    return {
        "addresses": [
            {"address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bC00", "network": "ethereum"},
            {"address": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa", "network": "bitcoin"},
        ],
        "metadata": {
            "source": "test",
            "timestamp": "2024-01-15T10:30:00Z",
        },
    }


# =============================================================================
# SETTINGS FIXTURES
# =============================================================================


@pytest.fixture
def sample_settings() -> Dict[str, Any]:
    """
    Provide sample application settings for testing.

    Returns:
        dict: Sample settings dictionary.
    """
    return {
        "batch_size_limit": 10000,
        "execution_timeout": 3600,
        "rate_limits": {
            "chainalysis": 60,
            "trm": 60,
        },
    }


# =============================================================================
# MOCK FIXTURES
# =============================================================================


@pytest.fixture
def mock_chainalysis_response() -> Dict[str, Any]:
    """
    Provide mock Chainalysis API response.

    Returns:
        dict: Mock API response structure.
    """
    return {
        "cluster": {
            "name": "Test Exchange",
            "category": "exchange",
            "rootAddress": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
        },
        "exposures": [],
    }


@pytest.fixture
def mock_trm_response() -> Dict[str, Any]:
    """
    Provide mock TRM Labs API response.

    Returns:
        dict: Mock API response structure.
    """
    return {
        "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bC00",
        "chain": "ethereum",
        "riskScore": 25,
        "entities": [],
    }


# =============================================================================
# DATABASE FIXTURES
# =============================================================================


@pytest.fixture
def db_access_without_rollback_and_truncate(
    request,
    django_db_setup,
    django_db_blocker
) -> Generator:
    """
    Provide database access without automatic rollback.

    Use this for tests that need to commit transactions.
    """
    django_db_blocker.unblock()
    yield
    django_db_blocker.restore()