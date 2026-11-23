# CloudLab Edu — Cloud-Native Laboratory Practicum Management System

**CloudLab Edu** adalah aplikasi web *cloud-native* untuk manajemen kegiatan praktikum laboratorium komputer (kelas praktikum, modul tugas, pengumpulan berkas, penilaian otomatis/manual oleh asisten lab, umpan balik mahasiswa, rekapitulasi CSV dosen, serta pemantauan kesehatan API).

Proyek ini disusun berdasarkan rancangan arsitektur **3-Tier Stateless Cloud-Native** (LKM 9 — Komputasi Awan, Program Studi S1 Pendidikan Komputer, Universitas Mulawarman) dan telah dikemas penuh menggunakan **Docker Compose** agar ringan dan siap dijalankan di laptop lokal.

---

## 1. Arsitektur & Tech Stack

| Layer | Teknologi | Image Docker | Port Lokal |
| :--- | :--- | :--- | :--- |
| **Frontend Web** | Next.js 15 (App Router) + React 19 + Tailwind CSS v4 + Lucide Icons | `node:20-alpine` (Standalone) | `http://localhost:3000` |
| **Backend REST API** | Python FastAPI + Uvicorn + SQLAlchemy + PyJWT + Bcrypt | `python:3.12-slim` | `http://localhost:8000` |
| **API Docs (Swagger)** | OpenAPI 3.1 Interactive Documentation | Terintegrasi di Backend | `http://localhost:8000/docs` |
| **Database** | PostgreSQL 16 (Persistent Volume `postgres_data`) | `postgres:16-alpine` | `localhost:5432` |
| **Object Storage** | Local Persistent Volume (`uploads_data` -> siap migrasi ke Supabase S3) | Mounted ke `/app/uploads` | Internal Container |

---

## 2. Prasyarat Sebelum Menjalankan

Pastikan di laptop kamu sudah terpasang:
1. **Docker Desktop** (pastikan status Docker Engine sudah *Running* / ikon paus hijau menyala).
2. Port **`3000`**, **`8000`**, dan **`5432`** tidak sedang dipakai oleh aplikasi lain.

---

## 3. Cara Menjalankan di Laptop Lokal (Langkah demi Langkah)

### Langkah 1 — Ekstrak Folder Proyek
Ekstrak file `cloudlab-edu.zip` ke direktori kerja kamu, misalnya:
```text
D:\cloudlab-edu\
```

### Langkah 2 — Buka Terminal / PowerShell di Folder Proyek
Buka **PowerShell** (Windows) atau **Terminal** (macOS/Linux), lalu arahkan ke folder hasil ekstrak:
```powershell
cd "D:\cloudlab-edu"
```

*(Opsional)* Salin file `.env.example` menjadi `.env` jika ingin menyesuaikan kredensial:
```powershell
copy .env.example .env
```

### Langkah 3 — Build & Jalankan Semua Kontainer dengan Docker Compose
Jalankan perintah berikut untuk membangun image (`frontend`, `backend`) dan menyalakan database `db`:
```powershell
docker compose up --build -d
```
> **Catatan:** Pada proses *build* pertama kali, Docker akan mengunduh base image `python:3.12-slim`, `node:20-alpine`, dan `postgres:16-alpine` (sekitar 2–4 menit tergantung kecepatan internet). Proses selanjutnya hanya membutuhkan beberapa detik.

### Langkah 4 — Verifikasi Status Kontainer
Pastikan ketiga layanan (`cloudlab_db`, `cloudlab_backend`, dan `cloudlab_frontend`) berstatus `Up` / `healthy`:
```powershell
docker compose ps
```

### Langkah 5 — Akses Aplikasi di Browser
* **Aplikasi Web Utama (Frontend):** [http://localhost:3000](http://localhost:3000)
* **Dokumentasi Interaktif API (Swagger UI):** [http://localhost:8000/docs](http://localhost:8000/docs)
* **Health Check Endpoint:** [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)

---

## 4. Akun Demo Siap Pakai (Pre-Seeded Data)

Saat pertama kali menyala, *backend* otomatis mengisi database PostgreSQL dengan data awal untuk **4 peran pengguna (RBAC)**. Kamu bisa langsung menekan tombol **1-Click Demo Login** di halaman awal atau masuk menggunakan kredensial berikut:

| Peran (Role) | Nama Pengguna | Email | Password |
| :--- | :--- | :--- | :--- |
| **Mahasiswa (Praktikan)** | Rizky Pratama | `rizky.pratama@student.unmul.ac.id` | `demo123` |
| **Asisten Laboratorium** | Muhammad Fajriansyah Al Amin | `fajriansyah@labkom.unmul.ac.id` | `demo123` |
| **Dosen Pengampu** | Dr. Hendra Wijaya, M.Kom. | `hendra.wijaya@fkip.unmul.ac.id` | `demo123` |
| **System Administrator** | Admin Labkom | `admin@cloudlab.unmul.ac.id` | `demo123` |

### Skenario Uji Coba End-to-End (Demo Tugas Kuliah):
1. **Login sebagai Mahasiswa** (`Rizky Pratama`) $ightarrow$ Buka menu **My Classes**, masukkan kode kelas **`STD-2026A`** untuk bergabung ke kelas *Struktur Data & Graf*.
2. Buka menu **Assignments** $ightarrow$ Pilih modul aktif dan unggah berkas tugas (`.pdf`, `.zip`, `.py`, atau `.sql`, maksimal `10 MB`).
3. **Logout** lalu **Login sebagai Asisten Lab** (`Muhammad Fajriansyah Al Amin`) $ightarrow$ Buka menu **Submissions** atau **Grade & Feedback**, unduh berkas mahasiswa, input skor (`0–100`) beserta catatan evaluasi, lalu simpan.
4. Klik **Export Grades** untuk mengunduh rekapitulasi nilai kelas dalam format **`.csv`**.
5. **Login sebagai Dosen Pengampu** untuk memantau statistik ketepatan waktu kelas, atau **Admin** untuk menguji *API Health Check* (`/api/v1/health`) dan manajemen *role* pengguna.

---

## 5. Perintah Docker yang Sering Digunakan

* **Melihat log aplikasi secara real-time:**
  ```powershell
  docker compose logs -f
  ```
* **Melihat log khusus backend atau frontend:**
  ```powershell
  docker compose logs -f backend
  docker compose logs -f frontend
  ```
* **Menghentikan sementara semua kontainer (data database tetap aman):**
  ```powershell
  docker compose down
  ```
* **Reset total (menghapus kontainer beserta volume database & file upload):**
  ```powershell
  docker compose down -v
  ```
* **Membangun ulang setelah mengubah kode:**
  ```powershell
  docker compose up --build -d
  ```

---

## 6. Panduan Singkat Migrasi ke Cloud (Render / Railway + Vercel + Supabase)

Karena aplikasi ini dirancang *stateless* dan berbasis *environment variables*:
1. **Database:** Buat proyek di **Supabase**, lalu salin *Connection String PostgreSQL* ke variabel `DATABASE_URL` pada layanan backend.
2. **Backend API:** Hubungkan folder `backend/` ke **Render** atau **Railway** (otomatis mendeteksi `backend/Dockerfile`) dan atur `JWT_SECRET_KEY` serta `CORS_ORIGINS` ke domain Vercel.
3. **Frontend Web:** Hubungkan folder `frontend/` ke **Vercel** dan atur `NEXT_PUBLIC_API_URL` menuju URL backend publik (misal `https://cloudlab-api.onrender.com/api/v1`).
