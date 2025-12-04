# =============================================================================
# FILE: easycall/backend/tests/integration/test_api_health.py
# =============================================================================
# Integration tests for health check and system info API endpoints.
# =============================================================================
"""
Integration tests for core API endpoints.
"""

# =============================================================================
# IMPORTS
# =============================================================================

import pytest
from rest_framework import status
from rest_framework.test import APIClient


# =============================================================================
# TEST MARKERS
# =============================================================================

pytestmark = [
    pytest.mark.integration,
    pytest.mark.django_db,
]


# =============================================================================
# HEALTH CHECK TESTS
# =============================================================================


class TestHealthCheckEndpoint:
    """Tests for the /api/v1/health/ endpoint."""

    def test_health_check_returns_200(self, api_client: APIClient) -> None:
        """Test that health check returns 200 OK."""
        response = api_client.get("/api/v1/health/")
        assert response.status_code == status.HTTP_200_OK

    def test_health_check_returns_healthy_status(
        self, api_client: APIClient
    ) -> None:
        """Test that health check returns healthy status."""
        response = api_client.get("/api/v1/health/")
        assert response.data["status"] == "healthy"

    def test_health_check_includes_timestamp(
        self, api_client: APIClient
    ) -> None:
        """Test that health check includes timestamp."""
        response = api_client.get("/api/v1/health/")
        assert "timestamp" in response.data
        assert response.data["timestamp"].endswith("Z")


class TestDetailedHealthCheckEndpoint:
    """Tests for the /api/v1/health/detailed/ endpoint."""

    def test_detailed_health_check_returns_200(
        self, api_client: APIClient
    ) -> None:
        """Test that detailed health check returns 200 OK."""
        response = api_client.get("/api/v1/health/detailed/")
        assert response.status_code == status.HTTP_200_OK

    def test_detailed_health_check_includes_components(
        self, api_client: APIClient
    ) -> None:
        """Test that detailed health check includes components."""
        response = api_client.get("/api/v1/health/detailed/")
        assert "components" in response.data
        assert "database" in response.data["components"]

    def test_database_component_has_latency(
        self, api_client: APIClient
    ) -> None:
        """Test that database component includes latency."""
        response = api_client.get("/api/v1/health/detailed/")
        db_status = response.data["components"]["database"]
        assert "status" in db_status
        if db_status["status"] == "healthy":
            assert "latency_ms" in db_status


# =============================================================================
# SYSTEM INFO TESTS
# =============================================================================


class TestSystemInfoEndpoint:
    """Tests for the /api/v1/info/ endpoint."""

    def test_system_info_returns_200(self, api_client: APIClient) -> None:
        """Test that system info returns 200 OK."""
        response = api_client.get("/api/v1/info/")
        assert response.status_code == status.HTTP_200_OK

    def test_system_info_includes_application(
        self, api_client: APIClient
    ) -> None:
        """Test that system info includes application details."""
        response = api_client.get("/api/v1/info/")
        assert "application" in response.data
        assert response.data["application"]["name"] == "EasyCall"

    def test_system_info_includes_version(
        self, api_client: APIClient
    ) -> None:
        """Test that system info includes version."""
        response = api_client.get("/api/v1/info/")
        assert "version" in response.data["application"]

    def test_system_info_includes_system_details(
        self, api_client: APIClient
    ) -> None:
        """Test that system info includes system details."""
        response = api_client.get("/api/v1/info/")
        assert "system" in response.data
        assert "python_version" in response.data["system"]
        assert "django_version" in response.data["system"]

    def test_system_info_includes_configuration(
        self, api_client: APIClient
    ) -> None:
        """Test that system info includes configuration."""
        response = api_client.get("/api/v1/info/")
        assert "configuration" in response.data
        assert "batch_size_limit" in response.data["configuration"]


# =============================================================================
# PING TESTS
# =============================================================================


class TestPingEndpoint:
    """Tests for the /api/v1/ping/ endpoint."""

    def test_ping_returns_200(self, api_client: APIClient) -> None:
        """Test that ping returns 200 OK."""
        response = api_client.get("/api/v1/ping/")
        assert response.status_code == status.HTTP_200_OK

    def test_ping_returns_pong(self, api_client: APIClient) -> None:
        """Test that ping returns pong message."""
        response = api_client.get("/api/v1/ping/")
        assert response.data["message"] == "pong"