"use client";

import React, { useState, useRef } from "react";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Award,
  Plus,
  UploadCloud,
  FileText,
  Download,
  Calendar,
  MapPin,
  User as UserIcon,
  AlertCircle,
  X,
} from "lucide-react";
import { PracticumClass, PracticumModule, Submission, User } from "@/lib/types";
import { apiRequest, downloadProtectedFile, formatBytes, formatDateTime } from "@/lib/api";

interface StudentViewsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: User;
  classes: PracticumClass[];
  modules: PracticumModule[];
  submissions: Submission[];
  onRefresh: () => Promise<void>;
  notify: (msg: string, type?: "success" | "error") => void;
}

export default function StudentViews({
  activeTab,
  setActiveTab,
  user,
  classes,
  modules,
  submissions,
  onRefresh,
  notify,
}: StudentViewsProps) {
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);

  // Upload modal state
  const [selectedModule, setSelectedModule] = useState<PracticumModule | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const subByModule = new Map<number, Submission>();
  submissions.forEach((s) => subByModule.set(s.module_id, s));

  const gradedSubs = submissions.filter((s) => s.status === "graded");
  const pendingModules = modules.filter((m) => !subByModule.has(m.id));
  const avgScore =
    gradedSubs.length > 0
      ? (
          gradedSubs.reduce((acc, s) => acc + (s.score || 0), 0) / gradedSubs.length
        ).toFixed(1)
      : "-";

  const handleJoinClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    setJoining(true);
    try {
      const joined = await apiRequest<PracticumClass>("/classes/join", {
        method: "POST",
        body: JSON.stringify({ class_code: joinCode.trim() }),
      });
      notify(`Berhasil bergabung ke kelas ${joined.name} (${joined.class_code})!`);
      setJoinCode("");
      await onRefresh();
    } catch (err: any) {
      notify(err.message || "Kode kelas tidak valid.", "error");
    } finally {
      setJoining(false);
    }
  };

  const handleFilePick = (file: File | undefined) => {
    if (!file) return;
    const ext = "." + (file.name.split(".").pop()?.toLowerCase() || "");
    const allowed = [".pdf", ".zip", ".py", ".sql"];
    if (!allowed.includes(ext)) {
      notify(`Format ${ext} tidak didukung. Gunakan PDF, ZIP, PY, atau SQL.`, "error");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      notify("Ukuran file melebihi batas maksimal 10 MB.", "error");
      return;
    }
    setSelectedFile(file);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModule || !selectedFile) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("module_id", String(selectedModule.id));
      formData.append("notes", notes);
      formData.append("file", selectedFile);

      await apiRequest<Submission>("/submissions/upload", {
        method: "POST",
        body: formData,
      });
      notify("Berkas tugas berhasil diunggah ke Cloud Object Storage!");
      setSelectedModule(null);
      setSelectedFile(null);
      setNotes("");
      await onRefresh();
    } catch (err: any) {
      notify(err.message || "Gagal mengunggah tugas.", "error");
    } finally {
      setUploading(false);
    }
  };

  const renderUploadModal = () => {
    if (!selectedModule) return null;
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
        <div className="bg-white border border-[#E2E8F0] rounded-2xl max-w-lg w-full p-6 shadow-xl">
          <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#E2E8F0]">
            <div>
              <span className="text-xs font-semibold text-[#0D9488] uppercase tracking-wider">
                Unggah Tugas Praktikum
              </span>
              <h3 className="text-lg font-bold text-[#0F172A] mt-0.5">
                {selectedModule.title}
              </h3>
              <p className="text-xs text-[#64748B] mt-0.5">
                {selectedModule.class_name} • Tenggat: {selectedModule.deadline}
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedModule(null);
                setSelectedFile(null);
              }}
              className="p-1.5 rounded-lg text-[#64748B] hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="my-4 p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#0F172A] whitespace-pre-line">
            <strong className="block mb-1 text-[#14243A]">Instruksi Pengerjaan:</strong>
            {selectedModule.instructions}
          </div>

          <form onSubmit={handleUploadSubmit} className="space-y-4">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragActive(false);
                handleFilePick(e.dataTransfer.files?.[0]);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                dragActive
                  ? "border-[#0D9488] bg-teal-50/60"
                  : "border-[#CBD5E1] hover:border-[#0D9488] bg-[#F8FAFC]"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.zip,.py,.sql"
                className="hidden"
                onChange={(e) => handleFilePick(e.target.files?.[0])}
              />
              <UploadCloud className="w-8 h-8 text-[#0D9488] mx-auto mb-2" />
              {selectedFile ? (
                <div>
                  <p className="text-sm font-bold text-[#0F172A]">{selectedFile.name}</p>
                  <p className="text-xs text-[#0D9488] mt-0.5">
                    {formatBytes(selectedFile.size)} • Siap diunggah
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-semibold text-[#0F172A]">
                    Seret &amp; lepas file ke sini, atau klik untuk memilih berkas
                  </p>
                  <p className="text-xs text-[#64748B] mt-1">
                    Format didukung: <strong>PDF, ZIP, PY, SQL</strong> (Maksimal 10 MB)
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                Catatan untuk Asisten Lab (Opsional)
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: Program sudah diuji menggunakan Python 3.12 tanpa error."
                className="w-full px-3.5 py-2 text-sm border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0D9488]"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedModule(null);
                  setSelectedFile(null);
                }}
                className="px-4 py-2 text-sm font-semibold text-[#64748B] hover:bg-slate-100 rounded-xl"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={!selectedFile || uploading}
                className="px-5 py-2 text-sm font-semibold bg-[#0D9488] hover:bg-[#0F766E] disabled:opacity-50 text-white rounded-xl cursor-pointer"
              >
                {uploading ? "Mengunggah..." : "Kirim Tugas Sekarang"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // --- TAB: OVERVIEW ---
  if (activeTab === "overview") {
    return (
      <div className="space-y-6">
        {renderUploadModal()}

        {/* Welcome Banner */}
        <div className="bg-[#14243A] text-white rounded-2xl p-6 lg:p-7 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <span className="inline-block px-2.5 py-1 rounded-md bg-white/10 text-[#2DD4BF] text-xs font-semibold mb-2">
              Portal Mahasiswa Praktikan • NIM {user.nim_or_nip || "-"}
            </span>
            <h2 className="text-xl lg:text-2xl font-bold">
              Halo, {user.full_name}
            </h2>
            <p className="text-sm text-slate-300 mt-1">
              Pantau jadwal modul praktikum, tenggat pengumpulan, serta nilai dan umpan balik asisten lab.
            </p>
          </div>
          <form onSubmit={handleJoinClass} className="flex gap-2 shrink-0">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="Kode Kelas (mis. STD-2026A)"
              className="px-3.5 py-2.5 text-sm bg-white text-[#0F172A] rounded-xl focus:outline-none w-48 sm:w-56"
            />
            <button
              type="submit"
              disabled={joining}
              className="px-4 py-2.5 bg-[#0D9488] hover:bg-[#0F766E] text-white text-sm font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Gabung
            </button>
          </form>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#64748B]">Kelas Aktif</span>
              <BookOpen className="w-4 h-4 text-[#14243A]" />
            </div>
            <div className="text-2xl font-bold text-[#0F172A] mt-2">{classes.length}</div>
            <p className="text-xs text-[#64748B] mt-1">Terdaftar semester ini</p>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#64748B]">Tugas Terkumpul</span>
              <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
            </div>
            <div className="text-2xl font-bold text-[#0F172A] mt-2">{submissions.length}</div>
            <p className="text-xs text-[#16A34A] mt-1">Tersimpan di Cloud Storage</p>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#64748B]">Belum Dikumpulkan</span>
              <Clock className="w-4 h-4 text-[#F59E0B]" />
            </div>
            <div className="text-2xl font-bold text-[#0F172A] mt-2">{pendingModules.length}</div>
            <p className="text-xs text-[#F59E0B] mt-1">Perlu segera diunggah</p>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#64748B]">Sudah Dinilai / Rata-rata</span>
              <Award className="w-4 h-4 text-[#0D9488]" />
            </div>
            <div className="text-2xl font-bold text-[#0F172A] mt-2">
              {gradedSubs.length} <span className="text-sm font-medium text-[#64748B]">({avgScore})</span>
            </div>
            <p className="text-xs text-[#64748B] mt-1">Skor evaluasi praktikum</p>
          </div>
        </div>

        {/* Two-column summary: My Classes & Upcoming Deadlines */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[#0F172A]">Kelas Praktikum Saya</h3>
              <button
                onClick={() => setActiveTab("classes")}
                className="text-xs font-semibold text-[#0D9488] hover:underline"
              >
                Lihat Semua
              </button>
            </div>
            <div className="space-y-3">
              {classes.map((cls) => (
                <div
                  key={cls.id}
                  className="p-4 rounded-xl border border-[#E2E8F0] hover:border-[#0D9488] transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-[#14243A]">
                      {cls.course_code} • {cls.class_code}
                    </span>
                    <span className="text-xs text-[#64748B]">{cls.modules_count} Modul</span>
                  </div>
                  <h4 className="text-sm font-bold text-[#0F172A] mt-2">{cls.name}</h4>
                  <p className="text-xs text-[#64748B] mt-1">
                    Aslab: {cls.assistant_name} • {cls.schedule}
                  </p>
                </div>
              ))}
              {classes.length === 0 && (
                <p className="text-sm text-[#64748B] py-4 text-center">
                  Belum bergabung ke kelas mana pun. Masukkan kode kelas di atas.
                </p>
              )}
            </div>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[#0F172A]">Status Modul &amp; Tenggat</h3>
              <button
                onClick={() => setActiveTab("assignments")}
                className="text-xs font-semibold text-[#0D9488] hover:underline"
              >
                Buka Tugas
              </button>
            </div>
            <div className="space-y-3">
              {modules.map((mod) => {
                const sub = subByModule.get(mod.id);
                return (
                  <div
                    key={mod.id}
                    className="p-4 rounded-xl border border-[#E2E8F0] flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#64748B]">{mod.class_name}</p>
                      <h4 className="text-sm font-bold text-[#0F172A] truncate">{mod.title}</h4>
                      <p className="text-xs text-[#64748B] mt-0.5">Deadline: {mod.deadline}</p>
                    </div>
                    {sub ? (
                      <span
                        className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          sub.status === "graded"
                            ? "bg-emerald-50 text-[#16A34A] border border-emerald-200"
                            : "bg-teal-50 text-[#0D9488] border border-teal-200"
                        }`}
                      >
                        {sub.status === "graded" ? `Dinilai: ${sub.score}` : "Terkumpul"}
                      </span>
                    ) : (
                      <button
                        onClick={() => setSelectedModule(mod)}
                        className="shrink-0 px-3 py-1.5 rounded-xl bg-[#14243A] hover:bg-[#1E3A5F] text-white text-xs font-semibold cursor-pointer"
                      >
                        Unggah
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- TAB: MY CLASSES ---
  if (activeTab === "classes") {
    return (
      <div className="space-y-6">
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-[#0F172A]">Gabung Kelas Praktikum Baru</h3>
            <p className="text-xs text-[#64748B] mt-0.5">
              Masukkan kode unik yang dibagikan oleh Asisten Laboratorium (contoh: <strong>STD-2026A</strong>).
            </p>
          </div>
          <form onSubmit={handleJoinClass} className="flex gap-2">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="Masukkan kode kelas..."
              className="px-3.5 py-2 text-sm border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0D9488]"
            />
            <button
              type="submit"
              disabled={joining}
              className="px-4 py-2 bg-[#0D9488] hover:bg-[#0F766E] text-white text-sm font-semibold rounded-xl cursor-pointer"
            >
              {joining ? "Memproses..." : "Gabung Kelas"}
            </button>
          </form>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {classes.map((cls) => (
            <div key={cls.id} className="bg-white border border-[#E2E8F0] rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-1 rounded-lg bg-[#14243A] text-white text-xs font-semibold">
                    {cls.course_code}
                  </span>
                  <span className="text-xs font-mono font-bold text-[#0D9488] bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">
                    Kode: {cls.class_code}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-[#0F172A]">{cls.name}</h3>
                <p className="text-xs text-[#64748B] mt-1.5 leading-relaxed">
                  {cls.description || "Praktikum laboratorium komputer terstruktur."}
                </p>

                <div className="mt-4 pt-4 border-t border-[#E2E8F0] space-y-2 text-xs text-[#64748B]">
                  <div className="flex items-center gap-2">
                    <UserIcon className="w-3.5 h-3.5 text-[#14243A]" />
                    <span>Asisten Lab: <strong className="text-[#0F172A]">{cls.assistant_name}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-[#14243A]" />
                    <span>{cls.schedule} ({cls.semester})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-[#14243A]" />
                    <span>{cls.room}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-[#E2E8F0] flex items-center justify-between">
                <span className="text-xs font-semibold text-[#64748B]">
                  {cls.modules_count} Modul Praktikum
                </span>
                <button
                  onClick={() => setActiveTab("assignments")}
                  className="px-3.5 py-1.5 rounded-xl bg-[#F8FAFC] hover:bg-slate-100 border border-[#E2E8F0] text-xs font-semibold text-[#14243A] cursor-pointer"
                >
                  Lihat Modul Tugas
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // --- TAB: ASSIGNMENTS ---
  if (activeTab === "assignments") {
    return (
      <div className="space-y-5">
        {renderUploadModal()}
        {modules.map((mod) => {
          const sub = subByModule.get(mod.id);
          return (
            <div key={mod.id} className="bg-white border border-[#E2E8F0] rounded-2xl p-6">
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                <div className="space-y-2 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-[#14243A] text-xs font-bold">
                      {mod.course_code} • {mod.class_name}
                    </span>
                    <span className="text-xs text-[#64748B]">Pertemuan {mod.meeting_number}</span>
                    {sub ? (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-[#16A34A] border border-emerald-200">
                        {sub.status === "graded" ? `Sudah Dinilai (${sub.score}/100)` : "Sudah Dikumpulkan"}
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-[#F59E0B] border border-amber-200">
                        Belum Dikumpulkan
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-[#0F172A]">{mod.title}</h3>
                  <p className="text-sm text-[#64748B]">{mod.description}</p>
                  <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#0F172A] whitespace-pre-line">
                    {mod.instructions}
                  </div>
                </div>

                <div className="lg:w-64 shrink-0 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 space-y-3">
                  <div className="text-xs space-y-1">
                    <div className="text-[#64748B]">Batas Waktu:</div>
                    <div className="font-bold text-[#0F172A]">{mod.deadline}</div>
                  </div>
                  <div className="text-xs space-y-1">
                    <div className="text-[#64748B]">Format &amp; Batas Ukuran:</div>
                    <div className="font-semibold text-[#0F172A]">
                      {mod.allowed_extensions.toUpperCase()} (Maks {mod.max_size_mb} MB)
                    </div>
                  </div>
                  {sub && (
                    <div className="text-xs pt-2 border-t border-[#E2E8F0]">
                      <div className="text-[#64748B]">File Terunggah:</div>
                      <div className="font-semibold text-[#0D9488] truncate">{sub.file_name}</div>
                      <div className="text-[11px] text-[#64748B]">{formatDateTime(sub.submitted_at)}</div>
                    </div>
                  )}
                  <button
                    onClick={() => setSelectedModule(mod)}
                    className="w-full py-2 px-3 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <UploadCloud className="w-4 h-4" />
                    {sub ? "Unggah Ulang Revisi" : "Unggah Tugas"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // --- TAB: SUBMISSION HISTORY ---
  if (activeTab === "history") {
    return (
      <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-[#E2E8F0]">
          <h3 className="text-base font-bold text-[#0F172A]">Riwayat Pengumpulan Tugas</h3>
          <p className="text-xs text-[#64748B] mt-0.5">
            Daftar seluruh berkas praktikum yang telah berhasil diunggah ke penyimpanan cloud.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-xs font-semibold text-[#64748B]">
                <th className="py-3.5 px-5">Kelas &amp; Modul</th>
                <th className="py-3.5 px-5">Nama Berkas</th>
                <th className="py-3.5 px-5">Ukuran</th>
                <th className="py-3.5 px-5">Waktu Unggah</th>
                <th className="py-3.5 px-5">Status</th>
                <th className="py-3.5 px-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-sm">
              {submissions.map((sub) => (
                <tr key={sub.id} className="hover:bg-slate-50/70">
                  <td className="py-3.5 px-5">
                    <div className="font-semibold text-[#0F172A]">{sub.module_title}</div>
                    <div className="text-xs text-[#64748B]">{sub.class_name}</div>
                  </td>
                  <td className="py-3.5 px-5">
                    <div className="flex items-center gap-2 font-medium text-[#14243A]">
                      <FileText className="w-4 h-4 text-[#0D9488]" />
                      {sub.file_name}
                    </div>
                  </td>
                  <td className="py-3.5 px-5 text-xs text-[#64748B]">
                    {formatBytes(sub.file_size_bytes)}
                  </td>
                  <td className="py-3.5 px-5 text-xs text-[#64748B]">
                    {formatDateTime(sub.submitted_at)}
                  </td>
                  <td className="py-3.5 px-5">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        sub.status === "graded"
                          ? "bg-emerald-50 text-[#16A34A]"
                          : "bg-teal-50 text-[#0D9488]"
                      }`}
                    >
                      {sub.status === "graded" ? "Sudah Dinilai" : "Menunggu Penilaian"}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <button
                      onClick={() =>
                        downloadProtectedFile(`/submissions/${sub.id}/download`, sub.file_name)
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E2E8F0] hover:bg-slate-100 text-xs font-semibold text-[#0F172A] cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Unduh
                    </button>
                  </td>
                </tr>
              ))}
              {submissions.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm text-[#64748B]">
                    Belum ada riwayat pengumpulan tugas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // --- TAB: GRADES & FEEDBACK ---
  return (
    <div className="space-y-4">
      {submissions.map((sub) => (
        <div key={sub.id} className="bg-white border border-[#E2E8F0] rounded-2xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold text-[#64748B]">{sub.class_name}</span>
              <h3 className="text-base font-bold text-[#0F172A] mt-0.5">{sub.module_title}</h3>
              <p className="text-xs text-[#64748B] mt-1">
                Berkas: <strong>{sub.file_name}</strong> • Dikumpulkan {formatDateTime(sub.submitted_at)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {sub.status === "graded" ? (
                <div className="px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-right">
                  <div className="text-[11px] font-semibold text-[#16A34A] uppercase">Nilai Akhir</div>
                  <div className="text-xl font-bold text-[#16A34A]">{sub.score} / 100</div>
                </div>
              ) : (
                <div className="px-4 py-2 rounded-xl bg-amber-50 border border-amber-200 text-xs font-semibold text-[#F59E0B] flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" />
                  Menunggu Evaluasi Aslab
                </div>
              )}
            </div>
          </div>

          {sub.feedback && (
            <div className="mt-4 p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <div className="text-xs font-bold text-[#14243A] mb-1">
                Catatan Evaluasi Asisten Laboratorium:
              </div>
              <p className="text-sm text-[#0F172A]">{sub.feedback}</p>
            </div>
          )}
        </div>
      ))}
      {submissions.length === 0 && (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-10 text-center text-sm text-[#64748B]">
          Belum ada data penilaian praktikum yang tersedia.
        </div>
      )}
    </div>
  );
}
