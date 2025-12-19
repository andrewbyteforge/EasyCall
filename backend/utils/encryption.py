# =============================================================================
# FILE: easycall/backend/utils/encryption.py
# =============================================================================
# Encryption utilities for sensitive data like API keys.
# Uses Fernet (symmetric encryption) from cryptography library.
# =============================================================================
"""
Encryption utilities for API credentials.
"""

# =============================================================================
# IMPORTS
# =============================================================================

import logging
from typing import Optional

from cryptography.fernet import Fernet, InvalidToken
from django.conf import settings

# =============================================================================
# LOGGER
# =============================================================================

logger = logging.getLogger(__name__)


# =============================================================================
# ENCRYPTION KEY MANAGEMENT
# =============================================================================


def get_encryption_key() -> bytes:
    """
    Get encryption key from settings.
    
    Returns:
        Encryption key as bytes
        
    Raises:
        ValueError: If encryption key is not configured
    """
    key = getattr(settings, 'ENCRYPTION_KEY', None)
    
    if not key:
        raise ValueError(
            "ENCRYPTION_KEY not configured in settings. "
            "Run: python -c 'from cryptography.fernet import Fernet; "
            "print(Fernet.generate_key().decode())' to generate one."
        )
    
    # Convert to bytes if string
    if isinstance(key, str):
        key = key.encode()
    
    return key


def generate_encryption_key() -> str:
    """
    Generate a new Fernet encryption key.
    
    Returns:
        Base64-encoded encryption key as string
        
    Example:
        >>> key = generate_encryption_key()
        >>> print(key)
        'xzy123ABC...'  # 44 character base64 string
    """
    return Fernet.generate_key().decode()


# =============================================================================
# ENCRYPTION FUNCTIONS
# =============================================================================


def encrypt_value(plaintext: str) -> str:
    """
    Encrypt a plaintext value.
    
    Args:
        plaintext: String to encrypt
        
    Returns:
        Base64-encoded encrypted string
        
    Raises:
        ValueError: If encryption key is not configured
        
    Example:
        >>> encrypted = encrypt_value("my-secret-api-key")
        >>> print(encrypted)
        'gAAAAABf...'  # Fernet token
    """
    if not plaintext:
        return ""
    
    try:
        key = get_encryption_key()
        f = Fernet(key)
        
        # Convert to bytes, encrypt, convert back to string
        encrypted_bytes = f.encrypt(plaintext.encode())
        encrypted_str = encrypted_bytes.decode()
        
        logger.debug(f"Encrypted value (length: {len(plaintext)})")
        
        return encrypted_str
        
    except Exception as e:
        logger.error(f"Encryption failed: {e}")
        raise


def decrypt_value(encrypted: str) -> str:
    """
    Decrypt an encrypted value.
    
    Args:
        encrypted: Base64-encoded encrypted string
        
    Returns:
        Decrypted plaintext string
        
    Raises:
        ValueError: If encryption key is not configured
        InvalidToken: If encrypted value is invalid or corrupted
        
    Example:
        >>> decrypted = decrypt_value('gAAAAABf...')
        >>> print(decrypted)
        'my-secret-api-key'
    """
    if not encrypted:
        return ""
    
    try:
        key = get_encryption_key()
        f = Fernet(key)
        
        # Convert to bytes, decrypt, convert back to string
        decrypted_bytes = f.decrypt(encrypted.encode())
        decrypted_str = decrypted_bytes.decode()
        
        logger.debug(f"Decrypted value (length: {len(decrypted_str)})")
        
        return decrypted_str
        
    except InvalidToken:
        logger.error("Decryption failed: Invalid token (wrong key or corrupted data)")
        raise
    except Exception as e:
        logger.error(f"Decryption failed: {e}")
        raise


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================


def is_encrypted(value: str) -> bool:
    """
    Check if a value appears to be encrypted (Fernet token).
    
    Fernet tokens start with "gAAAAA" when base64 decoded.
    
    Args:
        value: String to check
        
    Returns:
        True if value appears to be a Fernet token
        
    Example:
        >>> is_encrypted('gAAAAABf...')
        True
        >>> is_encrypted('plaintext-key')
        False
    """
    if not value or len(value) < 10:
        return False
    
    # Fernet tokens are at least 60 characters
    if len(value) < 60:
        return False
    
    # Try to decrypt (if it works, it's encrypted)
    try:
        decrypt_value(value)
        return True
    except (InvalidToken, Exception):
        return False


def rotate_encryption_key(
    old_key: str,
    new_key: str,
    encrypted_value: str
) -> str:
    """
    Rotate encryption key by decrypting with old key and re-encrypting with new key.
    
    Args:
        old_key: Old encryption key
        new_key: New encryption key
        encrypted_value: Value encrypted with old key
        
    Returns:
        Value re-encrypted with new key
        
    Example:
        >>> old = "old-key-abc..."
        >>> new = "new-key-xyz..."
        >>> encrypted_old = "gAAAAABf..."
        >>> encrypted_new = rotate_encryption_key(old, new, encrypted_old)
    """
    # Decrypt with old key
    f_old = Fernet(old_key.encode() if isinstance(old_key, str) else old_key)
    plaintext = f_old.decrypt(encrypted_value.encode()).decode()
    
    # Encrypt with new key
    f_new = Fernet(new_key.encode() if isinstance(new_key, str) else new_key)
    new_encrypted = f_new.encrypt(plaintext.encode()).decode()
    
    logger.info("Successfully rotated encryption key")
    
    return new_encrypted


# =============================================================================
# TESTING UTILITIES
# =============================================================================


def test_encryption() -> bool:
    """
    Test encryption/decryption functionality.
    
    Returns:
        True if test passes
    """
    try:
        test_value = "test-api-key-12345"
        
        # Encrypt
        encrypted = encrypt_value(test_value)
        print(f"Original:  {test_value}")
        print(f"Encrypted: {encrypted}")
        
        # Decrypt
        decrypted = decrypt_value(encrypted)
        print(f"Decrypted: {decrypted}")
        
        # Verify
        if test_value == decrypted:
            print("✅ Encryption test PASSED")
            return True
        else:
            print("❌ Encryption test FAILED: Values don't match")
            return False
            
    except Exception as e:
        print(f"❌ Encryption test FAILED: {e}")
        return False


# =============================================================================
# USAGE EXAMPLE
# =============================================================================

if __name__ == "__main__":
    print("Encryption Utility Test")
    print("=" * 50)
    
    # Test encryption
    test_encryption()