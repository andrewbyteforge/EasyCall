# =============================================================================
# FILE: easycall/backend/apps/integrations/trm_client.py
# =============================================================================
# TRM Labs API client.
#
# Based on API Integration Specification documentation.
# Base URL: https://api.trmlabs.com
# Authentication: Basic Auth with API key as username, empty password
# =============================================================================
"""
TRM Labs API client.

TRM Labs provides blockchain intelligence and risk assessment services.
This client implements methods for:
- Address attribution (entity identification)
- Total exposure (risk analysis)
- Address transfers (transaction history)
- Address summary (metrics)
- Network intelligence (IP address data)
"""

# =============================================================================
# IMPORTS
# =============================================================================

import logging
import time
import requests
from typing import Dict, Optional, Any
from django.conf import settings

# =============================================================================
# LOGGER
# =============================================================================

logger = logging.getLogger(__name__)

# =============================================================================
# EXCEPTIONS
# =============================================================================


class TRMLabsAPIError(Exception):
    """TRM Labs API error with status code and message."""

    ERROR_CODES = {
        400: "Bad request - check parameters",
        401: "Unauthorized - invalid API key",
        404: "Not found",
        405: "Method not allowed",
        406: "Not acceptable",
        429: "Rate limit exceeded - retry after delay",
        500: "Internal server error",
        503: "Service unavailable"
    }

    def __init__(self, status_code: int, message: str):
        self.status_code = status_code
        self.message = message
        self.user_message = self.ERROR_CODES.get(
            status_code,
            f"API error {status_code}"
        )
        super().__init__(f"TRM Labs API Error {status_code}: {message}")


class TRMLabsRateLimitError(TRMLabsAPIError):
    """TRM Labs rate limit error with retry-after information."""

    def __init__(self, retry_after: int, message: str):
        self.retry_after = retry_after
        super().__init__(status_code=429, message=message)


# =============================================================================
# TRM LABS CLIENT
# =============================================================================


class TRMLabsClient:
    """
    Client for TRM Labs API.

    Endpoints:
        GET  /public/v1/blockint/address-attribution - Entity identification
        GET  /public/v1/blockint/total-exposure - Risk exposure analysis
        POST /public/v1/blockint/metrics/address/summary - Address metrics
        POST /public/v1/blockint/transfers/by-address - Transaction history
        GET  /public/v1/blockint/net-intel/ip-addresses/{address} - IP data
    """

    # Blockchain name mapping (if needed)
    CHAIN_MAP = {
        'bitcoin': 'bitcoin',
        'ethereum': 'ethereum',
        'litecoin': 'litecoin',
        'tron': 'tron',
        'binance_smart_chain': 'bsc',
        'polygon': 'polygon',
    }

    # AFTER
    def __init__(self, api_key: Optional[str] = None, base_url: Optional[str] = None):
        """
        Initialize TRM Labs client.

        Args:
            api_key: Optional override (defaults to settings.TRM_CONFIG)
            base_url: Optional override (defaults to settings.TRM_CONFIG)
        """
        # Use provided key or fall back to settings
        config = getattr(settings, 'TRM_CONFIG', {})
        self.api_key = api_key or config.get('api_key', '')
        self.base_url = (base_url or config.get('api_url', 'https://api.trmlabs.com')).rstrip('/')

        if not self.api_key:
            raise ValueError("TRM Labs API key not configured. Set TRM_API_KEY in .env")

        # TRM uses Basic Auth with API key as username, empty password
        self.session = requests.Session()
        self.session.auth = (self.api_key, '')
        self.session.headers.update({
            "Content-Type": "application/json",
            "Accept": "application/json"
        })

        logger.info(f"TRMLabsClient initialized with base URL: {self.base_url}")

    def _normalize_chain(self, chain: str) -> str:
        """
        Normalize chain name to API format.

        Args:
            chain: Blockchain identifier

        Returns:
            Normalized chain name
        """
        return self.CHAIN_MAP.get(chain.lower(), chain)

    def _extract_rate_limit_info(self, response: requests.Response) -> Dict[str, Any]:
        """
        Extract rate limit information from response headers.

        Args:
            response: Response object

        Returns:
            Dict with rate limit information
        """
        return {
            'limit': response.headers.get('X-RateLimit-Limit'),
            'remaining': response.headers.get('X-RateLimit-Remaining'),
            'reset': response.headers.get('X-RateLimit-Reset')
        }

    def _make_request(
        self,
        method: str,
        path: str,
        params: Optional[Dict] = None,
        json_data: Optional[Dict] = None,
        timeout: int = 30
    ) -> dict:
        """
        Make API request with error handling.

        Args:
            method: HTTP method (GET, POST)
            path: API path
            params: Query parameters
            json_data: JSON body for POST requests
            timeout: Request timeout in seconds

        Returns:
            JSON response data

        Raises:
            TRMLabsAPIError: On API errors
            TRMLabsRateLimitError: On rate limit errors
        """
        url = f"{self.base_url}{path}"

        # Verbose logging for debugging
        logger.info(f"TRM Labs API request: {method} {url}")
        if params:
            logger.info(f"  params: {params}")
        if json_data:
            logger.info(f"  json_data keys: {list(json_data.keys())}")

        try:
            response = self.session.request(
                method=method,
                url=url,
                params=params,
                json=json_data,
                timeout=timeout
            )

            # Log response status
            logger.info(f"TRM Labs API response: {response.status_code}")

            # Extract rate limit info
            rate_limit = self._extract_rate_limit_info(response)
            logger.debug(f"Rate limit info: {rate_limit}")

            # Warn if approaching rate limit
            remaining = rate_limit.get('remaining')
            if remaining and int(remaining) < 10:
                logger.warning(
                    f"Approaching TRM Labs rate limit: {remaining} requests remaining"
                )

            # Check for rate limit error
            if response.status_code == 429:
                retry_after = int(response.headers.get('Retry-After', 60))
                logger.error(f"TRM Labs rate limit exceeded. Retry after {retry_after}s")
                raise TRMLabsRateLimitError(
                    retry_after=retry_after,
                    message=f"Rate limited. Retry after {retry_after}s"
                )

            # Check for other errors
            if response.status_code not in [200, 201]:
                error_text = response.text[:500] if response.text else "No response body"
                logger.error(f"TRM Labs API error: {response.status_code} - {error_text}")
                raise TRMLabsAPIError(
                    status_code=response.status_code,
                    message=error_text
                )

            return response.json()

        except requests.Timeout:
            logger.error(f"TRM Labs API timeout for {path}")
            raise TRMLabsAPIError(
                status_code=408,
                message="Request timeout"
            )
        except requests.RequestException as e:
            logger.error(f"TRM Labs API connection error: {e}")
            raise TRMLabsAPIError(
                status_code=500,
                message=str(e)
            )

    # -------------------------------------------------------------------------
    # API METHODS
    # -------------------------------------------------------------------------

    def get_address_attribution(
        self,
        blockchain_address: str,
        chain: str,
        external_id: Optional[str] = None  # ✅ Correct
    ) -> dict:
        """
        Get entities for a blockchain address.

        API Endpoint: GET /public/v1/blockint/address-attribution

        Args:
            blockchain_address: Address to query
            chain: Blockchain identifier (bitcoin, ethereum, etc.)
            external_id: Optional tracking ID

        Returns:
            {
                "data": [
                    {
                        "entity": "Binance",
                        "entityType": "exchange",
                        "category": "exchange",
                        "confidence": "high",
                        "lastObservedAt": "2024-01-15T10:30:00Z"
                    }
                ],
                "meta": {"count": 1}
            }
        """
        normalized_chain = self._normalize_chain(chain)
        params = {
            'blockchainAddress': blockchain_address,
            'chain': normalized_chain
        }

        if external_id:
            params['externalId'] = external_id

        logger.info(
            f"get_address_attribution: address={blockchain_address[:10]}..., "
            f"chain={chain} -> normalized={normalized_chain}"
        )

        return self._make_request(
            method='GET',
            path='/public/v1/blockint/address-attribution',
            params=params
        )

    # AFTER
    def get_total_exposure(
        self,
        blockchain_address: str,
        chain: str,
        tx_date_gte: Optional[str] = None,
        tx_date_lte: Optional[str] = None,
        external_id: Optional[str] = None,
        offset: int = 0,
        limit: int = 100
    ) -> dict:
        """
        Get total exposure for a blockchain address.

        API Endpoint: GET /public/v1/blockint/total-exposure

        Args:
            blockchain_address: Address to query
            chain: Blockchain identifier
            tx_date_gte: Start date (YYYY-MM-DD)
            tx_date_lte: End date (YYYY-MM-DD)
            external_id: Optional tracking ID
            offset: Pagination offset
            limit: Results per page (1-100)

        Returns:
            {
                "data": [
                    {
                        "entity": "Known Mixer",
                        "category": "mixer",
                        "totalVolume": 1000.0,
                        "direction": "sent",
                        "transferCount": 5
                    }
                ],
                "meta": {"count": 1}
            }
        """
        normalized_chain = self._normalize_chain(chain)
        params = {
            'blockchainAddress': blockchain_address,
            'chain': normalized_chain,
            'offset': offset,
            'limit': min(limit, 100)
        }

        if tx_date_gte:
            params['txDate[gte]'] = tx_date_gte
        if tx_date_lte:
            params['txDate[lte]'] = tx_date_lte
        if external_id:
            params['externalId'] = external_id

        logger.info(
            f"get_total_exposure: address={blockchain_address[:10]}..., "
            f"chain={chain} -> normalized={normalized_chain}"
        )

        return self._make_request(
            method='GET',
            path='/public/v1/blockint/total-exposure',
            params=params
        )

    def get_address_summary(
        self,
        blockchain_address: str,
        chain: str,
        external_id: Optional[str] = None
    ) -> dict:
        """
        Get address summary metrics.

        API Endpoint: POST /public/v1/blockint/metrics/address/summary

        Args:
            blockchain_address: Address to query
            chain: Blockchain identifier
            external_id: Optional tracking ID

        Returns:
            Address metrics and statistics
        """
        normalized_chain = self._normalize_chain(chain)
        request_body = {
            'blockchainAddress': blockchain_address,
            'chain': normalized_chain
        }

        if external_id:
            request_body['externalId'] = external_id

        logger.info(
            f"get_address_summary: address={blockchain_address[:10]}..., "
            f"chain={chain} -> normalized={normalized_chain}"
        )

        return self._make_request(
            method='POST',
            path='/public/v1/blockint/metrics/address/summary',
            json_data=request_body
        )

    def get_address_transfers(
        self,
        request_body: Dict
    ) -> dict:
        """
        Get transfers for a blockchain address.

        API Endpoint: POST /public/v1/blockint/transfers/by-address

        Args:
            request_body: Request body with filters
                {
                    "blockchainAddress": str (required),
                    "chain": str (required),
                    "txTimestamp": {"gte": datetime, "lte": datetime},
                    "direction": "IN" | "OUT" | "BOTH",
                    "includeAttribution": bool,
                    "page": {"after": str, "size": int}
                }

        Returns:
            {
                "data": [
                    {
                        "transactionHash": "...",
                        "transactionTimestamp": "2024-01-15T10:30:00Z",
                        "sender": {"address": "...", "chain": "..."},
                        "receiver": {"address": "...", "chain": "..."},
                        "amount": "1.5",
                        "amountUsd": 50000.0,
                        "direction": "IN"
                    }
                ],
                "meta": {
                    "nextCursor": "...",
                    "approximateCount": 100
                }
            }
        """
        # Normalize chain in request body
        if 'chain' in request_body:
            request_body['chain'] = self._normalize_chain(request_body['chain'])

        address = request_body.get('blockchainAddress', 'unknown')
        logger.info(f"get_address_transfers: address={address[:10]}...")

        return self._make_request(
            method='POST',
            path='/public/v1/blockint/transfers/by-address',
            json_data=request_body
        )

    def get_network_intelligence(
        self,
        ip_address: str,
        external_id: Optional[str] = None
    ) -> dict:
        """
        Get network intelligence for an IP address.

        API Endpoint: GET /public/v1/blockint/net-intel/ip-addresses/{address}

        Args:
            ip_address: IP address to query
            external_id: Optional tracking ID

        Returns:
            Network intelligence data
        """
        params = {}
        if external_id:
            params['externalId'] = external_id

        logger.info(f"get_network_intelligence: ip_address={ip_address}")

        return self._make_request(
            method='GET',
            path=f'/public/v1/blockint/net-intel/ip-addresses/{ip_address}',
            params=params
        )

    def test_connection(
        self,
        test_address: str = "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
        test_chain: str = "bitcoin"
    ) -> dict:
        """
        Test API connection with a known address.

        Args:
            test_address: Address to test with
            test_chain: Blockchain to test with

        Returns:
            {
                "success": True/False,
                "message": "...",
                "response_time": 0.5
            }
        """
        try:
            start = time.time()
            result = self.get_address_attribution(
                blockchain_address=test_address,
                chain=test_chain
            )
            elapsed = time.time() - start

            entity_count = result.get('meta', {}).get('count', 0)

            return {
                "success": True,
                "message": "Connection successful",
                "response_time": round(elapsed, 2),
                "entity_count": entity_count
            }

        except TRMLabsAPIError as e:
            return {
                "success": False,
                "message": e.user_message,
                "error": str(e),
                "response_time": None
            }
        except Exception as e:
            return {
                "success": False,
                "message": str(e),
                "response_time": None
            }
