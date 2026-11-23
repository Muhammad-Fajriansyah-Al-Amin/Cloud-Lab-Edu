from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Float,
    DateTime,
    ForeignKey,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship
from app.database import Base


def utcnow():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(120), nullable=False)
    nim_or_nip = Column(String(40), nullable=True)
    email = Column(String(150), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(30), nullable=False, default="student")  # student, assistant, lecturer, admin
    created_at = Column(DateTime(timezone=True), default=utcnow)

    owned_classes = relationship("PracticumClass", back_populates="assistant", cascade="all, delete-orphan")
    enrollments = relationship("Enrollment", back_populates="student", cascade="all, delete-orphan")
    submissions = relationship("Submission", back_populates="student", cascade="all, delete-orphan")


class PracticumClass(Base):
    __tablename__ = "practicum_classes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    course_code = Column(String(40), nullable=False)
    class_code = Column(String(30), unique=True, index=True, nullable=False)
    schedule = Column(String(120), nullable=False, default="Senin, 08:00 - 10:30 WITA")
    room = Column(String(80), nullable=False, default="Lab Komputer 1 FKIP")
    semester = Column(String(50), nullable=False, default="Ganjil 2026/2027")
    description = Column(Text, nullable=True)
    assistant_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    lecturer_name = Column(String(120), nullable=False, default="Dr. Hendra Wijaya, M.Kom.")
    created_at = Column(DateTime(timezone=True), default=utcnow)

    assistant = relationship("User", back_populates="owned_classes")
    enrollments = relationship("Enrollment", back_populates="practicum_class", cascade="all, delete-orphan")
    modules = relationship("PracticumModule", back_populates="practicum_class", cascade="all, delete-orphan")


class Enrollment(Base):
    __tablename__ = "enrollments"
    __table_args__ = (
        UniqueConstraint("student_id", "class_id", name="uq_student_class"),
    )

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    class_id = Column(Integer, ForeignKey("practicum_classes.id", ondelete="CASCADE"), nullable=False)
    enrolled_at = Column(DateTime(timezone=True), default=utcnow)

    student = relationship("User", back_populates="enrollments")
    practicum_class = relationship("PracticumClass", back_populates="enrollments")


class PracticumModule(Base):
    __tablename__ = "practicum_modules"

    id = Column(Integer, primary_key=True, index=True)
    class_id = Column(Integer, ForeignKey("practicum_classes.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(180), nullable=False)
    meeting_number = Column(Integer, nullable=False, default=1)
    description = Column(Text, nullable=False)
    instructions = Column(Text, nullable=False)
    allowed_extensions = Column(String(100), nullable=False, default=".pdf,.zip,.py,.sql")
    max_size_mb = Column(Integer, nullable=False, default=10)
    deadline = Column(String(60), nullable=False)
    status = Column(String(30), nullable=False, default="active")  # active, closed, draft
    created_at = Column(DateTime(timezone=True), default=utcnow)

    practicum_class = relationship("PracticumClass", back_populates="modules")
    submissions = relationship("Submission", back_populates="module", cascade="all, delete-orphan")


class Submission(Base):
    __tablename__ = "submissions"
    __table_args__ = (
        UniqueConstraint("student_id", "module_id", name="uq_student_module"),
    )

    id = Column(Integer, primary_key=True, index=True)
    module_id = Column(Integer, ForeignKey("practicum_modules.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    file_name = Column(String(255), nullable=False)
    stored_path = Column(String(500), nullable=False)
    file_size_bytes = Column(Integer, nullable=False, default=0)
    notes = Column(Text, nullable=True)
    status = Column(String(30), nullable=False, default="submitted")  # submitted, graded
    score = Column(Float, nullable=True)
    feedback = Column(Text, nullable=True)
    submitted_at = Column(DateTime(timezone=True), default=utcnow)
    graded_at = Column(DateTime(timezone=True), nullable=True)

    module = relationship("PracticumModule", back_populates="submissions")
    student = relationship("User", back_populates="submissions")


class SystemLog(Base):
    __tablename__ = "system_logs"

    id = Column(Integer, primary_key=True, index=True)
    level = Column(String(20), nullable=False, default="INFO")  # INFO, WARN, ERROR
    service = Column(String(60), nullable=False, default="backend-api")
    message = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow)
