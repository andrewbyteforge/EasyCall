# =============================================================================
# FILE: easycall/backend/apps/settings_manager/views.py
# =============================================================================
# API views for settings management.
#
# This module provides:
# - Global settings management (singleton)
# - API credential CRUD operations
# - Credential testing endpoints
# =============================================================================
"""
Views for the settings manager application.
"""

# =============================================================================
# IMPORTS
# =============================================================================

import logging
from typing import Any

from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response

from apps.settings_manager.models import GlobalSettings, APICredential
from apps.settings_manager.serializers import (
    GlobalSettingsSerializer,
    APICredentialListSerializer,
    APICredentialSerializer,
    APICredentialCreateSerializer,
    APICredentialTestSerializer,
)

# =============================================================================
# LOGGER
# =============================================================================

logger = logging.getLogger(__name__)


# =============================================================================
# GLOBAL SETTINGS VIEWSET
# =============================================================================


class GlobalSettingsViewSet(viewsets.ViewSet):
    """
    ViewSet for managing global application settings.
    
    This is a singleton - only one settings instance exists.
    
    Endpoints:
        GET    /api/v1/settings/           - Get current settings
        PUT    /api/v1/settings/           - Update settings
        PATCH  /api/v1/settings/           - Partial update settings
        POST   /api/v1/settings/reset/     - Reset to defaults
    """
    
    permission_classes = [AllowAny]
    
    def list(self, request: Request) -> Response:
        """
        Get current global settings.
        
        Args:
            request: HTTP request
            
        Returns:
            Response with current settings
        """
        logger.info("Getting global settings")
        settings = GlobalSettings.load()
        serializer = GlobalSettingsSerializer(settings)
        return Response(serializer.data)
    
    def update(self, request: Request) -> Response:
        """
        Update global settings (full update).
        
        Args:
            request: HTTP request with settings data
            
        Returns:
            Response with updated settings
        """
        logger.info("Updating global settings (full)")
        settings = GlobalSettings.load()
        serializer = GlobalSettingsSerializer(
            settings,
            data=request.data,
            partial=False
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        logger.info("Global settings updated successfully")
        return Response(serializer.data)
    
    def partial_update(self, request: Request) -> Response:
        """
        Partially update global settings.
        
        Args:
            request: HTTP request with partial settings data
            
        Returns:
            Response with updated settings
        """
        logger.info("Updating global settings (partial)")
        settings = GlobalSettings.load()
        serializer = GlobalSettingsSerializer(
            settings,
            data=request.data,
            partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        logger.info("Global settings updated successfully")
        return Response(serializer.data)
    
    @action(detail=False, methods=["post"])
    def reset(self, request: Request) -> Response:
        """
        Reset global settings to defaults.
        
        Args:
            request: HTTP request
            
        Returns:
            Response with reset settings
        """
        logger.warning("Resetting global settings to defaults")
        
        # Delete existing settings
        try:
            settings = GlobalSettings.objects.get(pk=1)
            settings.delete()
        except GlobalSettings.DoesNotExist:
            pass
        
        # Load will create new default settings
        settings = GlobalSettings.load()
        serializer = GlobalSettingsSerializer(settings)
        
        logger.info("Global settings reset to defaults")
        return Response(
            {
                "message": "Settings reset to defaults",
                "settings": serializer.data
            },
            status=status.HTTP_200_OK
        )


# =============================================================================
# API CREDENTIAL VIEWSET
# =============================================================================


class APICredentialViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing API credentials.
    
    Endpoints:
        GET    /api/v1/settings/credentials/              - List credentials
        POST   /api/v1/settings/credentials/              - Create credential
        GET    /api/v1/settings/credentials/{uuid}/       - Get credential
        PUT    /api/v1/settings/credentials/{uuid}/       - Update credential
        PATCH  /api/v1/settings/credentials/{uuid}/       - Partial update
        DELETE /api/v1/settings/credentials/{uuid}/       - Delete credential
        POST   /api/v1/settings/credentials/{uuid}/test/  - Test credential
        POST   /api/v1/settings/credentials/{uuid}/set_default/ - Set as default
        POST   /api/v1/settings/credentials/test_new/    - Test without saving
    """
    
    queryset = APICredential.objects.filter(is_active=True)
    permission_classes = [AllowAny]
    lookup_field = "uuid"
    
    def get_serializer_class(self):
        """Use appropriate serializer based on action."""
        if self.action == "list":
            return APICredentialListSerializer
        elif self.action in ["create", "update", "partial_update"]:
            return APICredentialCreateSerializer
        return APICredentialSerializer
    
    def list(self, request: Request, *args, **kwargs) -> Response:
        """List all active API credentials."""
        logger.info("Listing API credentials")
        
        # Optional filtering by provider
        provider = request.query_params.get("provider")
        queryset = self.get_queryset()
        
        if provider:
            queryset = queryset.filter(provider=provider)
            logger.info(f"Filtered credentials by provider: {provider}")
        
        # Order by default first, then provider
        queryset = queryset.order_by("-is_default", "provider", "label")
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    def create(self, request: Request, *args, **kwargs) -> Response:
        """Create a new API credential."""
        logger.info(
            f"Creating API credential: {request.data.get('provider')} - "
            f"{request.data.get('label')}"
        )
        return super().create(request, *args, **kwargs)
    
    def retrieve(self, request: Request, *args, **kwargs) -> Response:
        """Get API credential by UUID."""
        credential = self.get_object()
        logger.info(
            f"Retrieving credential: {credential.provider} - {credential.label}"
        )
        return super().retrieve(request, *args, **kwargs)
    
    def update(self, request: Request, *args, **kwargs) -> Response:
        """Update API credential."""
        credential = self.get_object()
        logger.info(
            f"Updating credential: {credential.provider} - {credential.label}"
        )
        return super().update(request, *args, **kwargs)
    
    def destroy(self, request: Request, *args, **kwargs) -> Response:
        """Soft delete API credential."""
        credential = self.get_object()
        credential.soft_delete()
        logger.info(
            f"Soft deleted credential: {credential.provider} - {credential.label}"
        )
        
        return Response(
            {
                "message": f"Credential '{credential.label}' deleted successfully"
            },
            status=status.HTTP_204_NO_CONTENT
        )
    
    @action(detail=True, methods=["post"])
    def test(self, request: Request, uuid=None) -> Response:
        """
        Test API credential connection.
        
        Args:
            request: HTTP request
            uuid: Credential UUID
            
        Returns:
            Response with test results
        """
        credential = self.get_object()
        logger.info(
            f"Testing credential: {credential.provider} - {credential.label}"
        )
        
        try:
            # Get decrypted keys
            api_key = credential.get_api_key()
            api_secret = credential.get_api_secret()
            api_url = credential.api_url or None
            
            # Test based on provider
            if credential.provider == "chainalysis":
                result = self._test_chainalysis(api_key, api_url)
            elif credential.provider == "trm_labs":
                result = self._test_trm(api_key, api_secret, api_url)
            else:
                return Response(
                    {
                        "success": False,
                        "message": f"Testing not implemented for {credential.provider}"
                    },
                    status=status.HTTP_501_NOT_IMPLEMENTED
                )
            
            # Update verification status
            credential.mark_as_verified(result["success"])
            credential.mark_as_used()
            
            logger.info(
                f"Credential test result: {result['success']} - {result['message']}"
            )
            
            return Response(result)
            
        except Exception as e:
            logger.error(f"Credential test failed: {e}")
            return Response(
                {
                    "success": False,
                    "message": str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=["post"])
    def set_default(self, request: Request, uuid=None) -> Response:
        """
        Set credential as default for its provider.
        
        Args:
            request: HTTP request
            uuid: Credential UUID
            
        Returns:
            Response confirming default status
        """
        credential = self.get_object()
        logger.info(
            f"Setting as default: {credential.provider} - {credential.label}"
        )
        
        credential.set_as_default()
        
        return Response(
            {
                "message": f"'{credential.label}' set as default for {credential.get_provider_display()}",
                "uuid": str(credential.uuid),
                "is_default": True
            }
        )
    
    @action(detail=False, methods=["post"])
    def test_new(self, request: Request) -> Response:
        """
        Test new API credentials without saving.
        
        Args:
            request: HTTP request with credential data
            
        Returns:
            Response with test results
        """
        serializer = APICredentialTestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        provider = serializer.validated_data["provider"]
        api_key = serializer.validated_data["api_key"]
        api_secret = serializer.validated_data.get("api_secret")
        api_url = serializer.validated_data.get("api_url")
        
        logger.info(f"Testing new {provider} credentials")
        
        try:
            if provider == "chainalysis":
                result = self._test_chainalysis(api_key, api_url)
            elif provider == "trm_labs":
                result = self._test_trm(api_key, api_secret, api_url)
            else:
                return Response(
                    {
                        "success": False,
                        "message": f"Testing not implemented for {provider}"
                    },
                    status=status.HTTP_501_NOT_IMPLEMENTED
                )
            
            logger.info(f"New credential test result: {result['success']}")
            return Response(result)
            
        except Exception as e:
            logger.error(f"New credential test failed: {e}")
            return Response(
                {
                    "success": False,
                    "message": str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    # -------------------------------------------------------------------------
    # Helper Methods for API Testing
    # -------------------------------------------------------------------------
    
    def _test_chainalysis(self, api_key: str, api_url: str = None) -> dict:
        """
        Test Chainalysis API credentials.
        
        Args:
            api_key: Chainalysis API token
            api_url: Optional custom API URL
            
        Returns:
            Dict with test results
        """
        # Import here to avoid circular imports
        try:
            from apps.integrations.chainalysis_client import ChainalysisClient
            
            client = ChainalysisClient(api_key, api_url)
            
            # Test with Satoshi's genesis address
            test_address = "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
            
            import time
            start = time.time()
            result = client.get_cluster_name_and_category(
                address=test_address,
                asset="bitcoin"
            )
            elapsed = time.time() - start
            
            return {
                "success": True,
                "message": "Connection successful",
                "response_time": round(elapsed, 2),
                "cluster_name": result.get("clusterName", "N/A")
            }
            
        except Exception as e:
            return {
                "success": False,
                "message": str(e),
                "response_time": None
            }
    
    def _test_trm(
        self, 
        api_key: str, 
        api_secret: str = None, 
        api_url: str = None
    ) -> dict:
        """
        Test TRM Labs API credentials.
        
        Args:
            api_key: TRM Labs API key
            api_secret: TRM Labs API secret (if applicable)
            api_url: Optional custom API URL
            
        Returns:
            Dict with test results
        """
        # Import here to avoid circular imports
        try:
            from apps.integrations.trm_client import TRMLabsClient
            
            client = TRMLabsClient(api_key, api_url)
            
            # Test with a simple attribution query
            test_address = "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
            
            import time
            start = time.time()
            result = client.get_address_attribution(
                blockchain_address=test_address,
                chain="bitcoin"
            )
            elapsed = time.time() - start
            
            return {
                "success": True,
                "message": "Connection successful",
                "response_time": round(elapsed, 2),
                "entity_count": result.get("meta", {}).get("count", 0)
            }
            
        except Exception as e:
            return {
                "success": False,
                "message": str(e),
                "response_time": None
            }