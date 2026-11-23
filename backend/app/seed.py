import os
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.models import (
    User,
    PracticumClass,
    Enrollment,
    PracticumModule,
    Submission,
    SystemLog,
)
from app.security import hash_password
from app.config import settings


def log_event(db: Session, level: str, service: str, message: str):
    entry = SystemLog(level=level, service=service, message=message)
    db.add(entry)
    db.commit()


def seed_initial_data(db: Session):
    if db.query(User).count() > 0:
        return

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    now = datetime.now(timezone.utc)

    # 1. Users across 4 RBAC Roles
    assistant = User(
        full_name="Muhammad Fajriansyah Al Amin",
        nim_or_nip="2205176001",
        email="fajriansyah@labkom.unmul.ac.id",
        hashed_password=hash_password("demo123"),
        role="assistant",
    )
    student1 = User(
        full_name="Rizky Pratama",
        nim_or_nip="2305176014",
        email="rizky.pratama@student.unmul.ac.id",
        hashed_password=hash_password("demo123"),
        role="student",
    )
    student2 = User(
        full_name="Siti Aisyah",
        nim_or_nip="2305176022",
        email="siti.aisyah@student.unmul.ac.id",
        hashed_password=hash_password("demo123"),
        role="student",
    )
    student3 = User(
        full_name="Dimas Saputra",
        nim_or_nip="2305176035",
        email="dimas.saputra@student.unmul.ac.id",
        hashed_password=hash_password("demo123"),
        role="student",
    )
    lecturer = User(
        full_name="Dr. Hendra Wijaya, M.Kom.",
        nim_or_nip="198405122010121003",
        email="hendra.wijaya@fkip.unmul.ac.id",
        hashed_password=hash_password("demo123"),
        role="lecturer",
    )
    admin = User(
        full_name="Admin Labkom",
        nim_or_nip="ADM-LAB-01",
        email="admin@cloudlab.unmul.ac.id",
        hashed_password=hash_password("demo123"),
        role="admin",
    )

    db.add_all([assistant, student1, student2, student3, lecturer, admin])
    db.commit()
    for u in [assistant, student1, student2, student3, lecturer, admin]:
        db.refresh(u)

    # 2. Practicum Classes
    cls1 = PracticumClass(
        name="Algoritma & Pemrograman Python",
        course_code="PKOM-201",
        class_code="ALG-2026A",
        schedule="Senin, 08:00 - 10:30 WITA",
        room="Lab Komputer 1 FKIP",
        semester="Ganjil 2026/2027",
        description="Praktikum dasar pemrograman terstruktur, fungsi, rekursi, dan pemecahan masalah algoritmik menggunakan Python 3.12.",
        assistant_id=assistant.id,
        lecturer_name=lecturer.full_name,
    )
    cls2 = PracticumClass(
        name="Sistem Basis Data & SQL",
        course_code="PKOM-204",
        class_code="BDL-2026B",
        schedule="Rabu, 13:00 - 15:30 WITA",
        room="Lab Basis Data & Cloud",
        semester="Ganjil 2026/2027",
        description="Perancangan ERD, normalisasi tabel, DDL/DML PostgreSQL, indexing, serta optimasi kueri relasional.",
        assistant_id=assistant.id,
        lecturer_name=lecturer.full_name,
    )
    cls3 = PracticumClass(
        name="Struktur Data & Analisis Algoritma",
        course_code="PKOM-302",
        class_code="STD-2026A",
        schedule="Jumat, 09:00 - 11:30 WITA",
        room="Lab Komputer 2 FKIP",
        semester="Ganjil 2026/2027",
        description="Implementasi Stack, Queue, Linked List, Binary Search Tree, dan Graph Traversal (BFS/DFS).",
        assistant_id=assistant.id,
        lecturer_name=lecturer.full_name,
    )
    db.add_all([cls1, cls2, cls3])
    db.commit()
    for c in [cls1, cls2, cls3]:
        db.refresh(c)

    # 3. Enrollments
    enrollments = [
        Enrollment(student_id=student1.id, class_id=cls1.id),
        Enrollment(student_id=student1.id, class_id=cls2.id),
        Enrollment(student_id=student2.id, class_id=cls1.id),
        Enrollment(student_id=student2.id, class_id=cls2.id),
        Enrollment(student_id=student2.id, class_id=cls3.id),
        Enrollment(student_id=student3.id, class_id=cls1.id),
    ]
    db.add_all(enrollments)
    db.commit()

    # 4. Practicum Modules
    mod1 = PracticumModule(
        class_id=cls1.id,
        title="Modul 1: Percabangan, Perulangan & Fungsi Modular",
        meeting_number=1,
        description="Implementasi kalkulator indeks prestasi mahasiswa menggunakan fungsi modular Python.",
        instructions="""1. Buat program Python (.py) berisi minimal 3 fungsi terpisah.
2. Tangani input tidak valid menggunakan try-except.
3. Sertakan screenshot output eksekusi di dalam laporan PDF atau arsip ZIP.""",
        allowed_extensions=".pdf,.zip,.py",
        max_size_mb=10,
        deadline=(now - timedelta(days=3)).strftime("%Y-%m-%d 23:59"),
        status="active",
    )
    mod2 = PracticumModule(
        class_id=cls1.id,
        title="Modul 2: Rekursi & Pengurutan Data (Sorting)",
        meeting_number=2,
        description="Perbandingan kompleksitas waktu algoritma Bubble Sort, Merge Sort, dan Quick Sort.",
        instructions="""1. Implementasikan algoritma Merge Sort dan Quick Sort tanpa library bawaan.
2. Ukur waktu eksekusi untuk N=1000 dan N=5000 data acak.
3. Unggah kode sumber (.py) atau bundel proyek (.zip).""",
        allowed_extensions=".py,.zip,.pdf",
        max_size_mb=10,
        deadline=(now + timedelta(days=4)).strftime("%Y-%m-%d 23:59"),
        status="active",
    )
    mod3 = PracticumModule(
        class_id=cls2.id,
        title="Modul 1: DDL, Relasi Foreign Key & Kueri Agregasi PostgreSQL",
        meeting_number=1,
        description="Pembuatan skema database perpustakaan kampus beserta kueri JOIN dan GROUP BY.",
        instructions="""1. Tulis skrip SQL lengkap (CREATE TABLE, INSERT, SELECT JOIN).
2. Pastikan seluruh constraint PRIMARY KEY dan FOREIGN KEY terdefinisi.
3. Unggah dalam format .sql atau .pdf.""",
        allowed_extensions=".sql,.pdf,.zip",
        max_size_mb=10,
        deadline=(now + timedelta(days=2)).strftime("%Y-%m-%d 23:59"),
        status="active",
    )
    mod4 = PracticumModule(
        class_id=cls3.id,
        title="Modul 1: Implementasi Linked List & Stack Antrian Lab",
        meeting_number=1,
        description="Simulasi antrian sesi praktikum menggunakan Doubly Linked List.",
        instructions="""1. Buat kelas Node dan DoublyLinkedList pada Python.
2. Implementasikan operasi enqueue, dequeue, dan cetak antrian.
3. Unggah file .py atau .zip sebelum tenggat waktu.""",
        allowed_extensions=".py,.zip,.pdf",
        max_size_mb=10,
        deadline=(now + timedelta(days=6)).strftime("%Y-%m-%d 23:59"),
        status="active",
    )
    db.add_all([mod1, mod2, mod3, mod4])
    db.commit()
    for m in [mod1, mod2, mod3, mod4]:
        db.refresh(m)

    # Create sample physical files in /app/uploads
    sample_py_path = os.path.join(settings.UPLOAD_DIR, "seed_rizky_modul1_algoritma.py")
    with open(sample_py_path, "w", encoding="utf-8") as f:
        f.write("""# Tugas Praktikum Modul 1 - Rizky Pratama (2305176014)
def hitung_ipk(daftar_nilai):
    if not daftar_nilai:
        return 0.0
    return round(sum(daftar_nilai) / len(daftar_nilai), 2)

if __name__ == '__main__':
    print('IPK Semester:', hitung_ipk([3.85, 4.00, 3.70]))
""")

    sample_sql_path = os.path.join(settings.UPLOAD_DIR, "seed_rizky_modul1_basisdata.sql")
    with open(sample_sql_path, "w", encoding="utf-8") as f:
        f.write("""-- Tugas Praktikum Basis Data - Rizky Pratama (2305176014)
CREATE TABLE anggota_lab (
    id SERIAL PRIMARY KEY,
    nim VARCHAR(20) UNIQUE NOT NULL,
    nama VARCHAR(100) NOT NULL
);
SELECT * FROM anggota_lab;
""")

    sample_siti_path = os.path.join(settings.UPLOAD_DIR, "seed_siti_modul2_sorting.py")
    with open(sample_siti_path, "w", encoding="utf-8") as f:
        f.write("""# Tugas Praktikum Modul 2 - Siti Aisyah (2305176022)
def merge_sort(arr):
    if len(arr) <= 1:
        return arr
    mid = len(arr) // 2
    left = merge_sort(arr[:mid])
    right = merge_sort(arr[mid:])
    return sorted(left + right)
""")

    # 5. Submissions
    sub1 = Submission(
        module_id=mod1.id,
        student_id=student1.id,
        file_name="Tugas1_Algoritma_RizkyPratama.py",
        stored_path=sample_py_path,
        file_size_bytes=os.path.getsize(sample_py_path),
        notes="Sudah menggunakan exception handling pada input nilai.",
        status="graded",
        score=94.0,
        feedback="Struktur fungsi sangat rapi, penanganan error input sudah tepat. Pertahankan konsistensi penamaan variabel!",
        submitted_at=now - timedelta(days=4),
        graded_at=now - timedelta(days=2),
    )
    sub2 = Submission(
        module_id=mod3.id,
        student_id=student1.id,
        file_name="Skema_Perpustakaan_Rizky.sql",
        stored_path=sample_sql_path,
        file_size_bytes=os.path.getsize(sample_sql_path),
        notes="Skrip DDL dan kueri agregasi sudah diuji di PostgreSQL 16.",
        status="submitted",
        score=None,
        feedback=None,
        submitted_at=now - timedelta(hours=5),
    )
    sub3 = Submission(
        module_id=mod2.id,
        student_id=student2.id,
        file_name="Sorting_Benchmark_SitiAisyah.py",
        stored_path=sample_siti_path,
        file_size_bytes=os.path.getsize(sample_siti_path),
        notes="Benchmark N=1000 dan N=5000 terlampir di komentar bawah.",
        status="submitted",
        score=None,
        feedback=None,
        submitted_at=now - timedelta(hours=2),
    )
    sub4 = Submission(
        module_id=mod1.id,
        student_id=student2.id,
        file_name="Laporan_Modul1_SitiAisyah.py",
        stored_path=sample_py_path,
        file_size_bytes=os.path.getsize(sample_py_path),
        notes="Pengumpulan tepat waktu.",
        status="graded",
        score=89.0,
        feedback="Logika program benar dan bersih. Tambahkan docstring pada setiap fungsi untuk nilai maksimal.",
        submitted_at=now - timedelta(days=4),
        graded_at=now - timedelta(days=2),
    )
    db.add_all([sub1, sub2, sub3, sub4])
    db.commit()

    # 6. Initial System Logs
    logs = [
        SystemLog(level="INFO", service="db-init", message="PostgreSQL 16 schema initialized and seeded with demo practicum classes."),
        SystemLog(level="INFO", service="object-storage", message="Local S3-compatible volume mounted at /app/uploads (quota limit: 1024 MB)."),
        SystemLog(level="INFO", service="auth-service", message="JWT HS256 stateless authentication & RBAC guard active."),
        SystemLog(level="INFO", service="health-monitor", message="Health check endpoint /api/v1/health ready (status: 200 OK)."),
    ]
    db.add_all(logs)
    db.commit()