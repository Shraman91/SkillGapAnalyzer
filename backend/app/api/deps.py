from fastapi import Header, HTTPException, Depends
from typing import Optional, Dict, Any
from app.core.firebase import verify_token
import logging

logger = logging.getLogger(__name__)

async def get_optional_user(authorization: Optional[str] = Header(None)) -> Optional[Dict[str, Any]]:
    """Extracts and verifies Firebase Bearer token if present."""
    if not authorization:
        return None

    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        return None

    user = verify_token(token)
    return user

async def get_current_user(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    """Requires valid Firebase Bearer token."""
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")

    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(status_code=401, detail="Invalid Bearer authentication scheme")

    user = verify_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired Firebase token")

    return user
