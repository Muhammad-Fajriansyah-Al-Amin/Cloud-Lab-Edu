import os
import csv
import io
import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, PracticumModule, Submission, PracticumClass
from app.schemas import SubmissionOut, GradeRequest
from app.security import get_current_user, require_roles
from app.config import settings
from app.seed import log_event

router = APIRouter(tags=["Submissions & Grading"])

ALLOWED_EXTENSIONS = {".pdf", ".zip", ".py", ".sql"}


def serialize_submission(sub: Submission) -> SubmissionOut:
    mod = sub.module
    cls = mod.practicum_class if mod else None
    stu = sub.student
    return SubmissionOut(
        id=sub.id,
        module_id=sub.module_id,
        module_title=mod.title if mod else "",
        class_id=cls.id if cls else 0,
        class_name=cls.name if cls else "",
        student_id=sub.student_id,
        student_name=stu.full_name if stu else "",
        student_nim=stu.nim_or_nip or "" if stu else "",
        file_name=sub.file_name,
        file_size_bytes=sub.file_size_bytes,
        notes=sub.notes or "",
        status=sub.status,
        score=sub.score,
        feedback=sub.feedback,
        submitted_at=sub.submitted_at,
        graded_at=sub.graded_at,
    )


@router.get("/submissions", response_model=List[SubmissionOut])
def list_submissions(
    class_id: Optional[int] = None,
    module_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Submission)
    if current_user.role == "student":
        query = query.filter(Submission.student_id == current_user.id)
    if module_id:
        query = query.filter(Submission.module_id == module_id)

    subs = query.order_by(Submission.submitted_at.desc()).all()
    if class_id:
        subs = [s for s in subs if s.module and s.module.class_id == class_id]
    return [serialize_submission(s) for s in subs]


@router.post("/submissions/upload", response_model=SubmissionOut, status_code=status.HTTP_201_CREATED)
async def upload_submission(
    module_id: int = Form(...),
    notes: str = Form(""),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("student")),
):
    mod = db.query(PracticumModule).filter(PracticumModule.id == module_id).first()
    if not mod:
        raise HTTPException(status_code=404, detail="Modul praktikum tidak ditemukan.")

    if mod.status != "active":
        raise HTTPException(
            status_code=400,
            detail="Modul ini sudah ditutup dan tidak menerima pengumpulan baru.",
        )

    original_name = file.filename or "tugas_praktikum"
    _, ext = os.path.splitext(original_name.lower())
    module_allowed = {e.strip().lower() for e in mod.allowed_extensions.split(",") if e.strip()}
    allowed = module_allowed or ALLOWED_EXTENSIONS

    if ext not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Format file '{ext}' tidak diizinkan. Format yang didukung: {', '.join(sorted(allowed))}",
        )

    content = await file.read()
    max_bytes = (mod.max_size_mb or settings.MAX_UPLOAD_MB) * 1024 * 1024
    if len(content) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ukuran file melebihi batas maksimal {mod.max_size_mb} MB.",
        )

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    safe_key = f"mod{module_id}_stu{current_user.id}_{uuid.uuid4().hex[:8]}{ext}"
    stored_path = os.path.join(settings.UPLOAD_DIR, safe_key)

    with open(stored_path, "wb") as f:
        f.write(content)

    now = datetime.now(timezone.utc)
    existing = (
        db.query(Submission)
        .filter(Submission.module_id == module_id, Submission.student_id == current_user.id)
        .first()
    )

    if existing:
        if existing.stored_path and os.path.exists(existing.stored_path) and "seed_" not in existing.stored_path:
            try:
                os.remove(existing.stored_path)
            except OSError:
                pass
        existing.file_name = original_name
        existing.stored_path = stored_path
        existing.file_size_bytes = len(content)
        existing.notes = notes
        existing.status = "submitted"
        existing.submitted_at = now
        db.commit()
        db.refresh(existing)
        sub = existing
    else:
        sub = Submission(
            module_id=module_id,
            student_id=current_user.id,
            file_name=original_name,
            stored_path=stored_path,
            file_size_bytes=len(content),
            notes=notes,
            status="submitted",
            submitted_at=now,
        )
        db.add(sub)
        db.commit()
        db.refresh(sub)

    log_event(
        db,
        "INFO",
        "object-storage",
        f"Uploaded '{original_name}' ({len(content)} bytes) by {current_user.email} for module ID {module_id}",
    )
    return serialize_submission(sub)


@router.get("/submissions/{submission_id}/download")
def download_submission(
    submission_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sub = db.query(Submission).filter(Submission.id == submission_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Data pengumpulan tidak ditemukan.")

    if current_user.role == "student" and sub.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Anda tidak memiliki akses ke berkas mahasiswa lain.")

    if not os.path.exists(sub.stored_path):
        raise HTTPException(status_code=404, detail="Berkas fisik tidak ditemukan di Object Storage.")

    return FileResponse(
        path=sub.stored_path,
        filename=sub.file_name,
        media_type="application/octet-stream",
    )


@router.put("/submissions/{submission_id}/grade", response_model=SubmissionOut)
def grade_submission(
    submission_id: int,
    payload: GradeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("assistant", "admin")),
):
    sub = db.query(Submission).filter(Submission.id == submission_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Data pengumpulan tidak ditemukan.")

    sub.score = round(payload.score, 2)
    sub.feedback = payload.feedback.strip()
    sub.status = "graded"
    sub.graded_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(sub)

    log_event(
        db,
        "INFO",
        "grading-service",
        f"Submission ID {submission_id} graded ({sub.score}/100) by {current_user.email}",
    )
    return serialize_submission(sub)


@router.get("/reports/export-csv")
def export_grades_csv(
    class_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("assistant", "lecturer", "admin")),
):
    subs = db.query(Submission).order_by(Submission.id.asc()).all()
    if class_id:
        subs = [s for s in subs if s.module and s.module.class_id == class_id]

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "ID",
        "Kode Kelas",
        "Nama Kelas",
        "Modul Praktikum",
        "NIM",
        "Nama Mahasiswa",
        "Nama Berkas",
        "Waktu Unggah",
        "Status",
        "Nilai (0-100)",
        "Catatan Evaluasi",
    ])

    for s in subs:
        cls = s.module.practicum_class if s.module else None
        writer.writerow([
            s.id,
            cls.course_code if cls else "-",
            cls.name if cls else "-",
            s.module.title if s.module else "-",
            s.student.nim_or_nip if s.student else "-",
            s.student.full_name if s.student else "-",
            s.file_name,
            s.submitted_at.strftime("%Y-%m-%d %H:%M:%S") if s.submitted_at else "-",
            "Sudah Dinilai" if s.status == "graded" else "Menunggu Penilaian",
            s.score if s.score is not None else "Belum Dinilai",
            s.feedback or "-",
        ])

    output.seek(0)
    filename = f"rekap_nilai_cloudlab_{datetime.now().strftime('%Y%m%d_%H%M')}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
