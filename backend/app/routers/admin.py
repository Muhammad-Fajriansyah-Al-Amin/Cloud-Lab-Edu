import os
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, SystemLog
from app.schemas import UserOut, RoleUpdate, SystemLogOut
from app.security import require_roles
from app.config import settings
from app.seed import log_event

router = APIRouter(prefix="/admin", tags=["System Administration"])


def get_storage_stats():
    total_bytes = 0
    file_count = 0
    if os.path.exists(settings.UPLOAD_DIR):
        for fname in os.listdir(settings.UPLOAD_DIR):
            fpath = os.path.join(settings.UPLOAD_DIR, fname)
            if os.path.isfile(fpath):
                total_bytes += os.path.getsize(fpath)
                file_count += 1
    return {
        "file_count": file_count,
        "used_bytes": total_bytes,
        "used_mb": round(total_bytes / (1024 * 1024), 3),
        "quota_mb": 1024,
    }


@router.get("/overview")
def admin_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin")),
):
    users = db.query(User).order_by(User.id.asc()).all()
    logs = db.query(SystemLog).order_by(SystemLog.id.desc()).limit(30).all()
    return {
        "users": [UserOut.model_validate(u) for u in users],
        "logs": [SystemLogOut.model_validate(l) for l in logs],
        "storage": get_storage_stats(),
    }


@router.patch("/users/{user_id}/role", response_model=UserOut)
def update_user_role(
    user_id: int,
    payload: RoleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("admin")),
):
    valid_roles = {"student", "assistant", "lecturer", "admin"}
    if payload.role not in valid_roles:
        raise HTTPException(status_code=400, detail="Peran pengguna tidak valid.")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Pengguna tidak ditemukan.")

    old_role = user.role
    user.role = payload.role
    db.commit()
    db.refresh(user)

    log_event(
        db,
        "INFO",
        "rbac-admin",
        f"Role changed for {user.email}: {old_role} -> {user.role} by {current_user.email}",
    )
    return UserOut.model_validate(user)
