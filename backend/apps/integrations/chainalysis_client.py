"""
Chainalysis Reactor IAPI client.

Based on API Integration Specification documentation.
Base URL: https://iapi.chainalysis.com
Authentication: Token header with API key
"""
import logging
import time
import requests
from typing import Optional
from django.conf import settings

logger = logging.getLogger(__name__)


class ChainalysisAPIError(Exception):
    """Chainalysis API error with status code and message."""

    ERROR_CODES = {
        400: "Bad request - invalid parameters",
        401: "Unauthorized - invalid API key",
        403: "Forbidden - check API key permissions",
        404: "Not found - address not in database",
        410: "Gone - endpoint deprecated or moved (check API version)",
        429: "Rate limit exceeded",
        500: "Internal server error",
        503: "Service unavailable"
    }

    def __init__(self, status_code: int,  message: str):
        self.status_code = status_code
        self.message = message
        self.user_message = self.ERROR_CODES.get(status_code, f"API error {status_code}")
        super().__init__(f"Chainalysis API Error {status_code}: {message}")


class ChainalysisClient:
    """
    Client for Chainalysis Reactor IAPI.

    Endpoints:
        GET /clusters/{address} - Cluster info (name, category)
        GET /clusters/{address}/{asset}/summary - Balance and transfer stats
        GET /clusters/{address}/{asset}/counterparties - Counterparty addresses
        GET /exposures/clusters/{address}/{asset}/directions/{direction} - Exposure by category
    """

    # Asset name mapping (frontend uses lowercase, API may need different format)
    ASSET_MAP = {
        'bitcoin': 'BTC',
        'ethereum': 'ETH',
        'litecoin': 'LTC',
        'bitcoin_cash': 'BCH',
        'dogecoin': 'DOGE',
        'tron': 'TRX',
        'solana': 'SOL',
        'binance_smart_chain': 'BSC',
        'polygon': 'MATIC',
        'ripple': 'XRP',
    }

    def __init__(self, api_key: Optional[str] = None, base_url: Optional[str] = None):
        """
        Initialize client with API key from settings or override.

        Args:
            api_key: Optional override (defaults to settings.CHAINALYSIS_CONFIG)
            base_url: Optional override (defaults to settings.CHAINALYSIS_CONFIG)
        """
        # Use provided key or fall back to settings
        config = getattr(settings, 'CHAINALYSIS_CONFIG', {})
        self.api_key = api_key or config.get('api_key', '')
        self.base_url = (base_url or config.get('api_url', 'https://iapi.chainalysis.com')).rstrip('/')

        if not self.api_key:
            raise ValueError("Chainalysis API key not configured. Set CHAINALYSIS_API_KEY in .env")

        self.session = requests.Session()
        self.session.headers.update({
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Token": self.api_key  # Chainalysis uses 'Token' header
        })

        logger.info(f"ChainalysisClient initialized with base URL: {self.base_url}")

    def _normalize_asset(self, asset: str) -> str:
        """
        Normalize asset name to API format.

        The API may accept either format, but we try mapped format first.
        Common formats: 'bitcoin' -> 'BTC', 'ethereum' -> 'ETH'
        """
        # If already uppercase (like BTC), return as-is
        if asset.isupper():
            return asset
        # Try mapping, fall back to original if not found
        return self.ASSET_MAP.get(asset.lower(), asset)

    def _make_request(
        self,
        method: str,
        path: str,
        params: Optional[dict] = None,
        timeout: int = 30
    ) -> dict:
        """
        Make API request with error handling.

        Args:
            method: HTTP method (GET, POST)
            path: API path (e.g., "/clusters/{address}")
            params: Query parameters
            timeout: Request timeout in seconds

        Returns:
            JSON response data

        Raises:
            ChainalysisAPIError: On API errors
        """
        url = f"{self.base_url}{path}"

        # Verbose logging for debugging
        logger.info(f"Chainalysis API request: {method} {url}")
        logger.info(f"  params: {params}")
        logger.info(f"  base_url: {self.base_url}")

        try:
            response = self.session.request(
                method=method,
                url=url,
                params=params,
                timeout=timeout
            )

            # Log response status and details
            logger.info(f"Chainalysis API response: {response.status_code}")
            logger.info(f"  response URL: {response.url}")

            if response.status_code != 200:
                error_text = response.text[:500] if response.text else "No response body"
                logger.error(f"Chainalysis API error: {response.status_code} - {error_text}")
                logger.error(f"  Full URL: {response.url}")
                logger.error(f"  Request path: {path}")
                logger.error(f"  Request params: {params}")
                raise ChainalysisAPIError(
                    status_code=response.status_code,
                    message=f"{error_text} (URL: {response.url})"
                )

            return response.json()

        except requests.Timeout:
            logger.error(f"Chainalysis API timeout for {path}")
            raise ChainalysisAPIError(
                status_code=408,
                message="Request timeout"
            )
        except requests.RequestException as e:
            logger.error(f"Chainalysis API connection error: {e}")
            raise ChainalysisAPIError(
                status_code=500,
                message=str(e)
            )

    def get_cluster_info(self, address: str, asset: str = "bitcoin") -> dict:
        """
        Get cluster name and category for an address.

        API Endpoint: GET /clusters/{address}

        Args:
            address: Blockchain address
            asset: Asset type (bitcoin, ethereum, etc.)

        Returns:
            {
                "clusterName": "Binance",
                "category": "exchange",
                "rootAddress": "..."
            }
        """
        normalized_asset = self._normalize_asset(asset)
        path = f"/clusters/{address}"
        params = {"filterAsset": normalized_asset}

        logger.info(f"get_cluster_info: asset={asset} -> normalized={normalized_asset}")
        return self._make_request("GET", path, params=params)

    def get_cluster_balance(
        self,
        address: str,
        asset: str = "bitcoin",
        output_asset: str = "NATIVE"
    ) -> dict:
        """
        Get cluster balance and transfer statistics.

        API Endpoint: GET /clusters/{address}/{asset}/summary

        Args:
            address: Blockchain address
            asset: Asset type (bitcoin, ethereum, etc.)
            output_asset: "NATIVE" or "USD"

        Returns:
            {
                "addressCount": 150,
                "transferCount": 5000,
                "depositCount": 2500,
                "withdrawalCount": 2500,
                "balance": 125.5,
                "totalSent": 10000.0,
                "totalReceived": 10125.5,
                "totalSentFees": 1.5,
                "totalReceivedFees": 0.0
            }
        """
        normalized_asset = self._normalize_asset(asset)
        path = f"/clusters/{address}/{normalized_asset}/summary"
        params = {"outputAsset": output_asset}

        logger.info(f"get_cluster_balance: asset={asset} -> normalized={normalized_asset}")
        return self._make_request("GET", path, params=params)

    def get_cluster_counterparties(
        self,
        address: str,
        asset: str = "bitcoin",
        output_asset: str = "NATIVE",
        direction: Optional[str] = None,
        limit: Optional[str] = None,
        offset: Optional[str] = None
    ) -> dict:
        """
        Get counterparty addresses for a cluster.

        API Endpoint: GET /clusters/{address}/{asset}/counterparties

        Args:
            address: Blockchain address
            asset: Asset type
            output_asset: "NATIVE" or "USD"
            direction: Optional "sent" or "received"
            limit: Optional max results per page
            offset: Optional pagination offset

        Returns:
            List of counterparty addresses with transaction volumes
        """
        normalized_asset = self._normalize_asset(asset)
        path = f"/clusters/{address}/{normalized_asset}/counterparties"
        params = {
            "outputAsset": output_asset
        }
        # Only add optional params if specified
        if direction:
            params["direction"] = direction
        if limit is not None:
            params["limit"] = limit
        if offset is not None:
            params["offset"] = offset

        logger.info(f"get_cluster_counterparties: asset={asset} -> normalized={normalized_asset}")
        return self._make_request("GET", path, params=params)

    def get_exposure_by_category(
        self,
        address: str,
        asset: str = "bitcoin",
        direction: str = "sent",
        output_asset: str = "USD"
    ) -> dict:
        """
        Get exposure analysis by category.

        API Endpoint: GET /exposures/clusters/{address}/{asset}/directions/{direction}

        Args:
            address: Blockchain address
            asset: Asset type
            direction: "sent" or "received"
            output_asset: "NATIVE" or "USD"

        Returns:
            {
                "direct": [{"category": "exchange", "value": 1000, "percentage": 50}],
                "indirect": [{"category": "darknet", "value": 100, "percentage": 5}]
            }
        """
        normalized_asset = self._normalize_asset(asset)
        path = f"/exposures/clusters/{address}/{normalized_asset}/directions/{direction}"
        params = {"outputAsset": output_asset}

        logger.info(f"get_exposure_by_category: asset={asset} -> normalized={normalized_asset}")
        return self._make_request("GET", path, params=params)

    def get_transaction_details(
        self,
        tx_hash: str,
        asset: str = "bitcoin",
        output_asset: str = "NATIVE"
    ) -> dict:
        """
        Get transaction details.

        API Endpoint: GET /transactions/{hash}/{asset}/details

        Args:
            tx_hash: Transaction hash
            asset: Asset type (bitcoin, ethereum, etc.)
            output_asset: "NATIVE" or "USD"

        Returns:
            Transaction details including inputs, outputs, fees, etc.
        """
        normalized_asset = self._normalize_asset(asset)
        path = f"/transactions/{tx_hash}/{normalized_asset}/details"
        params = {"outputAsset": output_asset}

        logger.info(f"get_transaction_details: tx_hash={tx_hash[:16]}..., asset={asset} -> normalized={normalized_asset}")
        return self._make_request("GET", path, params=params)

    def get_exposure_by_service(
        self,
        address: str,
        asset: str = "bitcoin",
        direction: str = "sent",
        output_asset: str = "USD"
    ) -> dict:
        """
        Get exposure analysis by service.

        API Endpoint: GET /exposures/clusters/{address}/{asset}/directions/{direction}/services

        Args:
            address: Blockchain address
            asset: Asset type
            direction: "sent" or "received"
            output_asset: "NATIVE" or "USD"

        Returns:
            {
                "direct": [{"service": "Binance", "value": 1000, "percentage": 50}],
                "indirect": [{"service": "Unknown Mixer", "value": 100, "percentage": 5}]
            }
        """
        normalized_asset = self._normalize_asset(asset)
        path = f"/exposures/clusters/{address}/{normalized_asset}/directions/{direction}/services"
        params = {"outputAsset": output_asset}

        logger.info(f"get_exposure_by_service: asset={asset} -> normalized={normalized_asset}")
        return self._make_request("GET", path, params=params)

    def test_connection(self, test_address: str = "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa") -> dict:
        """
        Test API connection with a known address.

        Args:
            test_address: Address to test with (defaults to Satoshi's genesis address)

        Returns:
            {
                "success": True/False,
                "message": "...",
                "response_time": 0.5
            }
        """

        try:
            start = time.time()
            result = self.get_cluster_info(address=test_address, asset="bitcoin")
            elapsed = time.time() - start

            return {
                "success": True,
                "message": "Connection successful",
                "response_time": round(elapsed, 2),
                "cluster_name": result.get("clusterName", "N/A")
            }

        except ChainalysisAPIError as e:
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
