"""
Security Utilities for ResonanceDB API

Handles API key generation, hashing, and verification.
"""

import secrets
import hashlib
import hmac
from typing import Tuple

from .config import settings


def generate_api_key() -> Tuple[str, str]:
    """
    Generate a new API key and its hash.
    
    Returns:
        Tuple of (plaintext_key, hashed_key)
        - plaintext_key: Return to user once, never store
        - hashed_key: Store in database
    
    Example:
        >>> key, hashed = generate_api_key()
        >>> key
        'rdb_live_a7b3c9d2e5f8...'
    """
    # Generate 32 random bytes (256 bits of entropy)
    random_bytes = secrets.token_hex(32)
    plaintext_key = f"{settings.API_KEY_PREFIX}{random_bytes}"
    
    # Hash for storage
    hashed_key = hash_api_key(plaintext_key)
    
    return plaintext_key, hashed_key


def hash_api_key(api_key: str) -> str:
    """
    Create a secure hash of an API key for storage.
    
    Uses HMAC-SHA256 with the API_KEY_SECRET as the key.
    """
    return hmac.new(
        settings.API_KEY_SECRET.encode(),
        api_key.encode(),
        hashlib.sha256
    ).hexdigest()


def verify_api_key(plaintext_key: str, stored_hash: str) -> bool:
    """
    Verify an API key against its stored hash.
    
    Uses constant-time comparison to prevent timing attacks.
    """
    computed_hash = hash_api_key(plaintext_key)
    return hmac.compare_digest(computed_hash, stored_hash)


def is_valid_api_key_format(api_key: str) -> bool:
    """Check if API key has valid format (prefix + 64 hex chars)."""
    if not api_key.startswith(settings.API_KEY_PREFIX):
        return False
    
    suffix = api_key[len(settings.API_KEY_PREFIX):]
    if len(suffix) != 64:
        return False
    
    try:
        int(suffix, 16)  # Check if valid hex
        return True
    except ValueError:
        return False
