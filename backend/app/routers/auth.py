from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User
from app.schemas import UserRegister, UserLogin, TokenResponse, UserOut
from app.security import hash_password, verify_password, create_access_token, get_current_user
from app.seed import log_event

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: UserRegister, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email sudah terdaftar. Silakan gunakan email lain atau login.",
        )

    valid_roles = {"student", "assistant", "lecturer", "admin"}
    role = payload.role if payload.role in valid_roles else "student"

    user = User(
        full_name=payload.full_name.strip(),
        nim_or_nip=payload.nim_or_nip.strip() if payload.nim_or_nip else "",
        email=payload.email.lower().strip(),
        hashed_password=hash_password(payload.password),
        role=role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    log_event(db, "INFO", "auth-service", f"New user registered: {user.email} (role={user.role})")
    token = create_access_token(user.id, user.role, user.email)
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))


@router.post("/login", response_model=TokenResponse)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        log_event(db, "WARN", "auth-service", f"Failed login attempt for email: {payload.email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email atau kata sandi salah.",
        )

    log_event(db, "INFO", "auth-service", f"User logged in: {user.email} (role={user.role})")
    token = create_access_token(user.id, user.role, user.email)
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return UserOut.model_validate(current_user)
