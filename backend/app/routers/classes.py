import random
import string
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, PracticumClass, Enrollment
from app.schemas import ClassCreate, ClassUpdate, ClassOut, JoinClassRequest, UserOut
from app.security import get_current_user, require_roles
from app.seed import log_event

router = APIRouter(prefix="/classes", tags=["Practicum Classes"])


def generate_unique_code(db: Session, course_code: str) -> str:
    prefix = "".join(ch for ch in course_code.upper() if ch.isalpha())[:3] or "LAB"
    for _ in range(20):
        suffix = "".join(random.choices(string.ascii_uppercase + string.digits, k=4))
        candidate = f"{prefix}-{suffix}"
        if not db.query(PracticumClass).filter(PracticumClass.class_code == candidate).first():
            return candidate
    return f"CLS-{random.randint(10000, 99999)}"


def serialize_class(cls: PracticumClass, current_user: User) -> ClassOut:
    enrolled_ids = {e.student_id for e in cls.enrollments}
    return ClassOut(
        id=cls.id,
        name=cls.name,
        course_code=cls.course_code,
        class_code=cls.class_code,
        schedule=cls.schedule,
        room=cls.room,
        semester=cls.semester,
        description=cls.description or "",
        assistant_id=cls.assistant_id,
        assistant_name=cls.assistant.full_name if cls.assistant else "Asisten Lab",
        lecturer_name=cls.lecturer_name,
        enrolled_count=len(cls.enrollments),
        modules_count=len(cls.modules),
        is_enrolled=(current_user.id in enrolled_ids),
    )


@router.get("", response_model=List[ClassOut])
def list_classes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    all_classes = db.query(PracticumClass).order_by(PracticumClass.id.asc()).all()
    if current_user.role == "student":
        enrolled_class_ids = {
            e.class_id
            for e in db.query(Enrollment).filter(Enrollment.student_id == current_user.id).all()
        }
        filtered = [c for c in all_classes if c.id in enrolled_class_ids]
        return [serialize_class(c, current_user) for c in filtered]
    return [serialize_class(c, current_user) for c in all_classes]


@router.post("", response_model=ClassOut, status_code=status.HTTP_201_CREATED)
def create_class(
    payload: ClassCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("assistant", "admin")),
):
    code = (
        payload.class_code.strip().upper()
        if payload.class_code and payload.class_code.strip()
        else generate_unique_code(db, payload.course_code)
    )
    if db.query(PracticumClass).filter(PracticumClass.class_code == code).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Kode kelas '{code}' sudah digunakan. Gunakan kode lain atau kosongkan untuk generate otomatis.",
        )

    new_cls = PracticumClass(
        name=payload.name.strip(),
        course_code=payload.course_code.strip().upper(),
        class_code=code,
        schedule=payload.schedule.strip(),
        room=payload.room.strip(),
        semester=payload.semester.strip(),
        description=payload.description or "",
        assistant_id=current_user.id,
        lecturer_name=payload.lecturer_name.strip(),
    )
    db.add(new_cls)
    db.commit()
    db.refresh(new_cls)

    log_event(db, "INFO", "class-service", f"Class created: {new_cls.name} ({new_cls.class_code}) by {current_user.email}")
    return serialize_class(new_cls, current_user)


@router.put("/{class_id}", response_model=ClassOut)
def update_class(
    class_id: int,
    payload: ClassUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("assistant", "admin")),
):
    cls = db.query(PracticumClass).filter(PracticumClass.id == class_id).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Kelas praktikum tidak ditemukan.")

    for field, val in payload.model_dump(exclude_unset=True).items():
        if val is not None:
            setattr(cls, field, val)
    db.commit()
    db.refresh(cls)
    return serialize_class(cls, current_user)


@router.delete("/{class_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_class(
    class_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("assistant", "admin")),
):
    cls = db.query(PracticumClass).filter(PracticumClass.id == class_id).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Kelas praktikum tidak ditemukan.")
    db.delete(cls)
    db.commit()
    log_event(db, "WARN", "class-service", f"Class ID {class_id} deleted by {current_user.email}")
    return None


@router.post("/join", response_model=ClassOut)
def join_class(
    payload: JoinClassRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("student")),
):
    code = payload.class_code.strip().upper()
    cls = db.query(PracticumClass).filter(PracticumClass.class_code == code).first()
    if not cls:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Kode kelas '{code}' tidak ditemukan. Periksa kembali kode dari Asisten Lab.",
        )

    existing = (
        db.query(Enrollment)
        .filter(Enrollment.student_id == current_user.id, Enrollment.class_id == cls.id)
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Kamu sudah terdaftar di kelas praktikum ini.",
        )

    enrollment = Enrollment(student_id=current_user.id, class_id=cls.id)
    db.add(enrollment)
    db.commit()
    db.refresh(cls)

    log_event(db, "INFO", "class-service", f"Student {current_user.email} joined class {cls.class_code}")
    return serialize_class(cls, current_user)


@router.get("/{class_id}/students", response_model=List[UserOut])
def get_class_students(
    class_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cls = db.query(PracticumClass).filter(PracticumClass.id == class_id).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Kelas tidak ditemukan.")
    return [UserOut.model_validate(e.student) for e in cls.enrollments if e.student]
