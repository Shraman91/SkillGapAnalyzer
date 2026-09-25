import logging
from fastapi import APIRouter, HTTPException
from app.models.schemas import AuthVerifyRequest
from app.core.firebase import verify_token, get_firestore_db

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/verify")
def verify_auth_token(payload: AuthVerifyRequest):
    """
    Verify Firebase ID token, create/fetch user profile in Firestore.
    Returns user info on success.
    """
    if not payload.id_token:
        raise HTTPException(status_code=400, detail="Token required.")

    decoded = verify_token(payload.id_token)
    if not decoded:
        raise HTTPException(status_code=401, detail="Invalid or expired token.")

    uid = decoded.get("uid", "")
    email = decoded.get("email", "")
    name = decoded.get("name", decoded.get("email", "Student"))

    # Create or update user profile in Firestore
    db = get_firestore_db()
    if db:
        try:
            import datetime
            user_ref = db.collection("users").document(uid)
            user_doc = user_ref.get()
            if user_doc.exists:
                user_ref.update({"last_login": datetime.datetime.utcnow().isoformat()})
            else:
                user_ref.set({
                    "uid": uid,
                    "email": email,
                    "name": name,
                    "created_at": datetime.datetime.utcnow().isoformat(),
                    "last_login": datetime.datetime.utcnow().isoformat()
                })
        except Exception as e:
            logger.error(f"Firestore user profile error: {e}")

    return {
        "status": "success",
        "uid": uid,
        "email": email,
        "name": name,
        "message": "Authenticated successfully."
    }
