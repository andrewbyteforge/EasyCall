# =============================================================================
# FILE: easycall/backend/apps/nodes/node_result.py
# =============================================================================
# Node execution result container.
# Provides standardized format for node execution outcomes.
# =============================================================================
"""
Node execution result for workflow execution.
"""

# =============================================================================
# IMPORTS
# =============================================================================

from typing import Any, Dict, Optional


# =============================================================================
# NODE RESULT CLASS
# =============================================================================


class NodeResult:
    """
    Container for node execution results.
    
    Provides a standardized format for nodes to return execution outcomes,
    including success/failure status, output data, error messages, and
    execution metadata.
    
    Attributes:
        status: Execution status ('SUCCESS', 'FAILED', 'SKIPPED')
        output_data: Dict of output pin data {pin_id: value}
        error_message: Error description if status is FAILED
        message: Human-readable status message
        metadata: Additional execution metadata
    """
    
    def __init__(
        self,
        status: str,
        output_data: Optional[Dict[str, Any]] = None,
        error_message: Optional[str] = None,
        message: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> None:
        """
        Initialize node result.
        
        Args:
            status: Execution status ('SUCCESS', 'FAILED', 'SKIPPED')
            output_data: Dict mapping output pins to values
            error_message: Error description (if failed)
            message: Human-readable status message
            metadata: Additional execution metadata
        """
        # Validate status
        valid_statuses = ['SUCCESS', 'FAILED', 'SKIPPED']
        if status not in valid_statuses:
            raise ValueError(
                f"Invalid status '{status}'. Must be one of: {valid_statuses}"
            )
        
        self.status = status
        self.output_data = output_data or {}
        self.error_message = error_message or ""
        self.message = message or ""
        self.metadata = metadata or {}
    
    # -------------------------------------------------------------------------
    # STATUS CHECKS
    # -------------------------------------------------------------------------
    
    @property
    def is_success(self) -> bool:
        """Check if execution was successful."""
        return self.status == 'SUCCESS'
    
    @property
    def is_failed(self) -> bool:
        """Check if execution failed."""
        return self.status == 'FAILED'
    
    @property
    def is_skipped(self) -> bool:
        """Check if execution was skipped."""
        return self.status == 'SKIPPED'
    
    @property
    def is_retryable(self) -> bool:
        """Check if failed execution is retryable."""
        return self.metadata.get('retryable', False)
    
    # -------------------------------------------------------------------------
    # DATA ACCESS METHODS
    # -------------------------------------------------------------------------
    
    def get_output(self, pin_id: str, default: Any = None) -> Any:
        """
        Get output value for a specific pin.
        
        Args:
            pin_id: Output pin identifier
            default: Default value if pin not found
            
        Returns:
            Output value or default
        """
        return self.output_data.get(pin_id, default)
    
    def has_output(self, pin_id: str) -> bool:
        """
        Check if result has output for a pin.
        
        Args:
            pin_id: Output pin identifier
            
        Returns:
            True if pin has data
        """
        return pin_id in self.output_data
    
    def set_output(self, pin_id: str, value: Any) -> None:
        """
        Set output value for a pin.
        
        Args:
            pin_id: Output pin identifier
            value: Output value
        """
        self.output_data[pin_id] = value
    
    # -------------------------------------------------------------------------
    # METADATA METHODS
    # -------------------------------------------------------------------------
    
    def set_metadata(self, key: str, value: Any) -> None:
        """
        Set metadata value.
        
        Args:
            key: Metadata key
            value: Metadata value
        """
        self.metadata[key] = value
    
    def get_metadata(self, key: str, default: Any = None) -> Any:
        """
        Get metadata value.
        
        Args:
            key: Metadata key
            default: Default value if key not found
            
        Returns:
            Metadata value or default
        """
        return self.metadata.get(key, default)
    
    # -------------------------------------------------------------------------
    # SERIALIZATION
    # -------------------------------------------------------------------------
    
    def to_dict(self) -> Dict[str, Any]:
        """
        Convert result to dictionary.
        
        Returns:
            Dict representation of result
        """
        return {
            'status': self.status,
            'output_data': self.output_data,
            'error_message': self.error_message,
            'message': self.message,
            'metadata': self.metadata,
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'NodeResult':
        """
        Create NodeResult from dictionary.
        
        Args:
            data: Dict with result data
            
        Returns:
            NodeResult instance
        """
        return cls(
            status=data['status'],
            output_data=data.get('output_data'),
            error_message=data.get('error_message'),
            message=data.get('message'),
            metadata=data.get('metadata'),
        )
    
    # -------------------------------------------------------------------------
    # FACTORY METHODS
    # -------------------------------------------------------------------------
    
    @classmethod
    def success(
        cls,
        output_data: Optional[Dict[str, Any]] = None,
        message: Optional[str] = None,
        **metadata
    ) -> 'NodeResult':
        """
        Create a success result.
        
        Args:
            output_data: Output pin data
            message: Success message
            **metadata: Additional metadata
            
        Returns:
            NodeResult with SUCCESS status
        """
        return cls(
            status='SUCCESS',
            output_data=output_data,
            message=message,
            metadata=metadata
        )
    
    @classmethod
    def failure(
        cls,
        error_message: str,
        retryable: bool = False,
        **metadata
    ) -> 'NodeResult':
        """
        Create a failure result.
        
        Args:
            error_message: Error description
            retryable: Whether execution can be retried
            **metadata: Additional metadata
            
        Returns:
            NodeResult with FAILED status
        """
        metadata['retryable'] = retryable
        return cls(
            status='FAILED',
            error_message=error_message,
            metadata=metadata
        )
    
    @classmethod
    def skipped(
        cls,
        reason: Optional[str] = None,
        **metadata
    ) -> 'NodeResult':
        """
        Create a skipped result.
        
        Args:
            reason: Reason for skipping
            **metadata: Additional metadata
            
        Returns:
            NodeResult with SKIPPED status
        """
        return cls(
            status='SKIPPED',
            message=reason,
            metadata=metadata
        )
    
    # -------------------------------------------------------------------------
    # STRING REPRESENTATION
    # -------------------------------------------------------------------------
    
    def __str__(self) -> str:
        """Return string representation."""
        if self.is_success:
            return f"NodeResult(SUCCESS: {self.message or 'OK'})"
        elif self.is_failed:
            return f"NodeResult(FAILED: {self.error_message})"
        else:
            return f"NodeResult(SKIPPED: {self.message or 'N/A'})"
    
    def __repr__(self) -> str:
        """Return detailed string representation."""
        return (
            f"NodeResult("
            f"status='{self.status}', "
            f"outputs={len(self.output_data)}, "
            f"message='{self.message or self.error_message}')"
        )