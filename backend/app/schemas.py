from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


# --- Auth & Users ---
class UserRegister(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=120)
    nim_or_nip: Optional[str] = Field(default="", max_length=40)
    email: str = Field(..., min_length=5, max_length=150)
    password: str = Field(..., min_length=4, max_length=100)
    role: str = Field(default="student")


class UserLogin(BaseModel):
    email: str
    password: str


class UserOut(BaseModel):
    id: int
    full_name: str
    nim_or_nip: Optional[str] = None
    email: str
    role: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class RoleUpdate(BaseModel):
    role: str


# --- Classes ---
class ClassCreate(BaseModel):
    name: str = Field(..., min_length=3, max_length=150)
    course_code: str = Field(..., min_length=2, max_length=40)
    class_code: Optional[str] = None
    schedule: str = "Senin, 08:00 - 10:30 WITA"
    room: str = "Lab Komputer 1 FKIP"
    semester: str = "Ganjil 2026/2027"
    description: Optional[str] = ""
    lecturer_name: str = "Dr. Hendra Wijaya, M.Kom."


class ClassUpdate(BaseModel):
    name: Optional[str] = None
    course_code: Optional[str] = None
    schedule: Optional[str] = None
    room: Optional[str] = None
    semester: Optional[str] = None
    description: Optional[str] = None
    lecturer_name: Optional[str] = None


class JoinClassRequest(BaseModel):
    class_code: str


class ClassOut(BaseModel):
    id: int
    name: str
    course_code: str
    class_code: str
    schedule: str
    room: str
    semester: str
    description: Optional[str] = ""
    assistant_id: int
    assistant_name: str = ""
    lecturer_name: str
    enrolled_count: int = 0
    modules_count: int = 0
    is_enrolled: bool = False

    class Config:
        from_attributes = True


# --- Modules ---
class ModuleCreate(BaseModel):
    class_id: int
    title: str = Field(..., min_length=3, max_length=180)
    meeting_number: int = 1
    description: str
    instructions: str
    allowed_extensions: str = ".pdf,.zip,.py,.sql"
    max_size_mb: int = 10
    deadline: str
    status: str = "active"


class ModuleUpdate(BaseModel):
    title: Optional[str] = None
    meeting_number: Optional[int] = None
    description: Optional[str] = None
    instructions: Optional[str] = None
    allowed_extensions: Optional[str] = None
    max_size_mb: Optional[int] = None
    deadline: Optional[str] = None
    status: Optional[str] = None


class ModuleOut(BaseModel):
    id: int
    class_id: int
    class_name: str = ""
    course_code: str = ""
    title: str
    meeting_number: int
    description: str
    instructions: str
    allowed_extensions: str
    max_size_mb: int
    deadline: str
    status: str
    submissions_count: int = 0

    class Config:
        from_attributes = True


# --- Submissions & Grading ---
class GradeRequest(BaseModel):
    score: float = Field(..., ge=0, le=100)
    feedback: str = ""


class SubmissionOut(BaseModel):
    id: int
    module_id: int
    module_title: str = ""
    class_id: int = 0
    class_name: str = ""
    student_id: int
    student_name: str = ""
    student_nim: str = ""
    file_name: str
    file_size_bytes: int
    notes: Optional[str] = ""
    status: str
    score: Optional[float] = None
    feedback: Optional[str] = None
    submitted_at: Optional[datetime] = None
    graded_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# --- Admin & Logs ---
class SystemLogOut(BaseModel):
    id: int
    level: str
    service: str
    message: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
