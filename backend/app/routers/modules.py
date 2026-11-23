from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, PracticumClass, PracticumModule, Enrollment
from app.schemas import ModuleCreate, ModuleUpdate, ModuleOut
from app.security import get_current_user, require_roles
from app.seed import log_event

router = APIRouter(prefix="/modules", tags=["Practicum Modules"])


def serialize_module(mod: PracticumModule) -> ModuleOut:
    return ModuleOut(
        id=mod.id,
        class_id=mod.class_id,
        class_name=mod.practicum_class.name if mod.practicum_class else "",
        course_code=mod.practicum_class.course_code if mod.practicum_class else "",
        title=mod.title,
        meeting_number=mod.meeting_number,
        description=mod.description,
        instructions=mod.instructions,
        allowed_extensions=mod.allowed_extensions,
        max_size_mb=mod.max_size_mb,
        deadline=mod.deadline,
        status=mod.status,
        submissions_count=len(mod.submissions),
    )


@router.get("", response_model=List[ModuleOut])
def list_modules(
    class_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(PracticumModule)
    if class_id:
        query = query.filter(PracticumModule.class_id == class_id)

    modules = query.order_by(PracticumModule.class_id.asc(), PracticumModule.meeting_number.asc()).all()

    if current_user.role == "student":
        enrolled_class_ids = {
            e.class_id
            for e in db.query(Enrollment).filter(Enrollment.student_id == current_user.id).all()
        }
        modules = [m for m in modules if m.class_id in enrolled_class_ids]

    return [serialize_module(m) for m in modules]


@router.post("", response_model=ModuleOut, status_code=status.HTTP_201_CREATED)
def create_module(
    payload: ModuleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("assistant", "admin")),
):
    cls = db.query(PracticumClass).filter(PracticumClass.id == payload.class_id).first()
    if not cls:
        raise HTTPException(status_code=404, detail="Kelas praktikum tujuan tidak ditemukan.")

    mod = PracticumModule(
        class_id=payload.class_id,
        title=payload.title.strip(),
        meeting_number=payload.meeting_number,
        description=payload.description.strip(),
        instructions=payload.instructions.strip(),
        allowed_extensions=payload.allowed_extensions.strip().lower(),
        max_size_mb=payload.max_size_mb,
        deadline=payload.deadline.strip(),
        status=payload.status,
    )
    db.add(mod)
    db.commit()
    db.refresh(mod)

    log_event(db, "INFO", "module-service", f"Module '{mod.title}' created in class {cls.class_code}")
    return serialize_module(mod)


@router.put("/{module_id}", response_model=ModuleOut)
def update_module(
    module_id: int,
    payload: ModuleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("assistant", "admin")),
):
    mod = db.query(PracticumModule).filter(PracticumModule.id == module_id).first()
    if not mod:
        raise HTTPException(status_code=404, detail="Modul praktikum tidak ditemukan.")

    for field, val in payload.model_dump(exclude_unset=True).items():
        if val is not None:
            setattr(mod, field, val)
    db.commit()
    db.refresh(mod)
    return serialize_module(mod)


@router.delete("/{module_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_module(
    module_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("assistant", "admin")),
):
    mod = db.query(PracticumModule).filter(PracticumModule.id == module_id).first()
    if not mod:
        raise HTTPException(status_code=404, detail="Modul praktikum tidak ditemukan.")
    db.delete(mod)
    db.commit()
    return None
