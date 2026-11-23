"use client";

import React, { useState } from "react";
import {
  BookOpen,
  Users,
  Clock,
  CheckCircle2,
  Plus,
  Trash2,
  Download,
  Award,
  FileSpreadsheet,
  X,
  FileText,
} from "lucide-react";
import { PracticumClass, PracticumModule, Submission, User } from "@/lib/types";
import { apiRequest, downloadProtectedFile, formatBytes, formatDateTime } from "@/lib/api";

interface AssistantViewsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: User;
  classes: PracticumClass[];
  modules: PracticumModule[];
  submissions: Submission[];
  onRefresh: () => Promise<void>;
  notify: (msg: string, type?: "success" | "error") => void;
}

export default function AssistantViews({
  activeTab,
  setActiveTab,
  user,
  classes,
  modules,
  submissions,
  onRefresh,
  notify,
}: AssistantViewsProps) {
  // Filter states
  const [filterClassId, setFilterClassId] = useState<string>("all");
  const [filterModuleId, setFilterModuleId] = useState<string>("all");

  // Create Class Modal
  const [showClassModal, setShowClassModal] = useState(false);
  const [clsName, setClsName] = useState("");
  const [clsCourseCode, setClsCourseCode] = useState("");
  const [clsCustomCode, setClsCustomCode] = useState("");
  const [clsSchedule, setClsSchedule] = useState("Selasa, 10:00 - 12:30 WITA");
  const [clsRoom, setClsRoom] = useState("Lab Komputer 1 FKIP");
  const [clsLecturer, setClsLecturer] = useState("Dr. Hendra Wijaya, M.Kom.");
  const [clsDesc, setClsDesc] = useState("");

  // Create Module Modal
  const [showModModal, setShowModModal] = useState(false);
  const [modClassId, setModClassId] = useState<number>(classes[0]?.id || 1);
  const [modTitle, setModTitle] = useState("");
  const [modMeeting, setModMeeting] = useState(1);
  const [modDesc, setModDesc] = useState("");
  const [modInstructions, setModInstructions] = useState("");
  const [modDeadline, setModDeadline] = useState("2026-12-05 23:59");

  // Grading Modal
  const [gradingSub, setGradingSub] = useState<Submission | null>(null);
  const [scoreVal, setScoreVal] = useState<string>("90");
  const [feedbackVal, setFeedbackVal] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const totalStudents = classes.reduce((acc, c) => acc + c.enrolled_count, 0);
  const pendingSubs = submissions.filter((s) => s.status !== "graded");

  const filteredSubmissions = submissions.filter((s) => {
    if (filterClassId !== "all" && String(s.class_id) !== filterClassId) return false;
    if (filterModuleId !== "all" && String(s.module_id) !== filterModuleId) return false;
    return true;
  });

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const created = await apiRequest<PracticumClass>("/classes", {
        method: "POST",
        body: JSON.stringify({
          name: clsName,
          course_code: clsCourseCode,
          class_code: clsCustomCode || null,
          schedule: clsSchedule,
          room: clsRoom,
          lecturer_name: clsLecturer,
          description: clsDesc,
        }),
      });
      notify(`Kelas '${created.name}' dibuat dengan kode gabung: ${created.class_code}`);
      setShowClassModal(false);
      setClsName("");
      setClsCourseCode("");
      setClsCustomCode("");
      setClsDesc("");
      await onRefresh();
    } catch (err: any) {
      notify(err.message || "Gagal membuat kelas.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClass = async (id: number) => {
    try {
      await apiRequest(`/classes/${id}`, { method: "DELETE" });
      notify("Kelas praktikum berhasil dihapus.");
      await onRefresh();
    } catch (err: any) {
      notify(err.message || "Gagal menghapus kelas.", "error");
    }
  };

  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiRequest("/modules", {
        method: "POST",
        body: JSON.stringify({
          class_id: Number(modClassId),
          title: modTitle,
          meeting_number: Number(modMeeting),
          description: modDesc,
          instructions: modInstructions,
          allowed_extensions: ".pdf,.zip,.py,.sql",
          max_size_mb: 10,
          deadline: modDeadline,
          status: "active",
        }),
      });
      notify("Modul praktikum baru berhasil diterbitkan!");
      setShowModModal(false);
      setModTitle("");
      setModDesc("");
      setModInstructions("");
      await onRefresh();
    } catch (err: any) {
      notify(err.message || "Gagal membuat modul.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteModule = async (id: number) => {
    try {
      await apiRequest(`/modules/${id}`, { method: "DELETE" });
      notify("Modul praktikum dihapus.");
      await onRefresh();
    } catch (err: any) {
      notify(err.message || "Gagal menghapus modul.", "error");
    }
  };

  const openGradingModal = (sub: Submission) => {
    setGradingSub(sub);
    setScoreVal(sub.score !== null ? String(sub.score) : "90");
    setFeedbackVal(sub.feedback || "");
  };

  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingSub) return;
    setSaving(true);
    try {
      await apiRequest(`/submissions/${gradingSub.id}/grade`, {
        method: "PUT",
        body: JSON.stringify({
          score: Number(scoreVal),
          feedback: feedbackVal,
        }),
      });
      notify(`Nilai untuk ${gradingSub.student_name} berhasil disimpan!`);
      setGradingSub(null);
      await onRefresh();
    } catch (err: any) {
      notify(err.message || "Gagal menyimpan nilai.", "error");
    } finally {
      setSaving(false);
    }
  };

  const renderModals = () => (
    <>
      {/* Create Class Modal */}
      {showClassModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl max-w-lg w-full p-6 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0]">
              <h3 className="text-lg font-bold text-[#0F172A]">Buat Kelas Praktikum Baru</h3>
              <button onClick={() => setShowClassModal(false)} className="p-1 text-[#64748B]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateClass} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Nama Mata Kuliah Praktikum</label>
                <input
                  type="text"
                  required
                  value={clsName}
                  onChange={(e) => setClsName(e.target.value)}
                  placeholder="Contoh: Komputasi Awan & Virtualisasi"
                  className="w-full px-3.5 py-2 text-sm border border-[#E2E8F0] rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Kode Mata Kuliah</label>
                  <input
                    type="text"
                    required
                    value={clsCourseCode}
                    onChange={(e) => setClsCourseCode(e.target.value)}
                    placeholder="PKOM-401"
                    className="w-full px-3.5 py-2 text-sm border border-[#E2E8F0] rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Kode Gabung (Opsional)</label>
                  <input
                    type="text"
                    value={clsCustomCode}
                    onChange={(e) => setClsCustomCode(e.target.value)}
                    placeholder="Auto-generate jika kosong"
                    className="w-full px-3.5 py-2 text-sm border border-[#E2E8F0] rounded-xl"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Jadwal Sesi Lab</label>
                  <input
                    type="text"
                    value={clsSchedule}
                    onChange={(e) => setClsSchedule(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border border-[#E2E8F0] rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Ruang Laboratorium</label>
                  <input
                    type="text"
                    value={clsRoom}
                    onChange={(e) => setClsRoom(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border border-[#E2E8F0] rounded-xl"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Dosen Pengampu</label>
                <input
                  type="text"
                  value={clsLecturer}
                  onChange={(e) => setClsLecturer(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-[#E2E8F0] rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Deskripsi Singkat</label>
                <textarea
                  rows={2}
                  value={clsDesc}
                  onChange={(e) => setClsDesc(e.target.value)}
                  placeholder="Deskripsi capaian praktikum..."
                  className="w-full px-3.5 py-2 text-sm border border-[#E2E8F0] rounded-xl"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowClassModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-[#64748B]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-sm font-semibold bg-[#0D9488] text-white rounded-xl cursor-pointer"
                >
                  {saving ? "Menyimpan..." : "Simpan Kelas"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Module Modal */}
      {showModModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl max-w-lg w-full p-6 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0]">
              <h3 className="text-lg font-bold text-[#0F172A]">Tambah Modul Praktikum</h3>
              <button onClick={() => setShowModModal(false)} className="p-1 text-[#64748B]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateModule} className="space-y-4 mt-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold mb-1">Kelas Praktikum</label>
                  <select
                    value={modClassId}
                    onChange={(e) => setModClassId(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-[#E2E8F0] rounded-xl"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.course_code} — {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Pertemuan Ke-</label>
                  <input
                    type="number"
                    min={1}
                    value={modMeeting}
                    onChange={(e) => setModMeeting(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-[#E2E8F0] rounded-xl"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Judul Modul Tugas</label>
                <input
                  type="text"
                  required
                  value={modTitle}
                  onChange={(e) => setModTitle(e.target.value)}
                  placeholder="Contoh: Modul 3: Kontainerisasi Layanan dengan Docker"
                  className="w-full px-3.5 py-2 text-sm border border-[#E2E8F0] rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Ringkasan Materi</label>
                <input
                  type="text"
                  required
                  value={modDesc}
                  onChange={(e) => setModDesc(e.target.value)}
                  placeholder="Tujuan singkat modul praktikum..."
                  className="w-full px-3.5 py-2 text-sm border border-[#E2E8F0] rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Instruksi Pengerjaan</label>
                <textarea
                  rows={3}
                  required
                  value={modInstructions}
                  onChange={(e) => setModInstructions(e.target.value)}
                  placeholder="Langkah-langkah tugas dan ketentuan format file..."
                  className="w-full px-3.5 py-2 text-sm border border-[#E2E8F0] rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Batas Waktu (Deadline)</label>
                <input
                  type="text"
                  required
                  value={modDeadline}
                  onChange={(e) => setModDeadline(e.target.value)}
                  placeholder="YYYY-MM-DD HH:MM"
                  className="w-full px-3.5 py-2 text-sm border border-[#E2E8F0] rounded-xl"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-[#64748B]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-sm font-semibold bg-[#0D9488] text-white rounded-xl cursor-pointer"
                >
                  {saving ? "Menerbitkan..." : "Terbitkan Modul"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grading Modal */}
      {gradingSub && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl max-w-lg w-full p-6 shadow-xl">
            <div className="flex items-start justify-between pb-4 border-b border-[#E2E8F0]">
              <div>
                <span className="text-xs font-semibold text-[#0D9488] uppercase">
                  Penilaian Tugas Praktikum
                </span>
                <h3 className="text-lg font-bold text-[#0F172A] mt-0.5">
                  {gradingSub.student_name} ({gradingSub.student_nim})
                </h3>
                <p className="text-xs text-[#64748B]">{gradingSub.module_title}</p>
              </div>
              <button onClick={() => setGradingSub(null)} className="p-1 text-[#64748B]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-4 p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between">
              <div className="text-xs">
                <div className="font-bold text-[#0F172A]">{gradingSub.file_name}</div>
                <div className="text-[#64748B] mt-0.5">
                  Catatan Praktikan: {gradingSub.notes || "-"}
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  downloadProtectedFile(`/submissions/${gradingSub.id}/download`, gradingSub.file_name)
                }
                className="px-3 py-1.5 rounded-lg bg-white border border-[#E2E8F0] hover:bg-slate-100 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Unduh File
              </button>
            </div>

            <form onSubmit={handleSaveGrade} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Nilai Evaluasi (0 – 100)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step="0.5"
                  required
                  value={scoreVal}
                  onChange={(e) => setScoreVal(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm font-bold border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0D9488]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">
                  Catatan Umpan Balik (Feedback)
                </label>
                <textarea
                  rows={3}
                  required
                  value={feedbackVal}
                  onChange={(e) => setFeedbackVal(e.target.value)}
                  placeholder="Berikan catatan evaluasi struktur kode, kelengkapan laporan, atau saran perbaikan..."
                  className="w-full px-3.5 py-2 text-sm border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0D9488]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setGradingSub(null)}
                  className="px-4 py-2 text-sm font-semibold text-[#64748B]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-sm font-semibold bg-[#0D9488] hover:bg-[#0F766E] text-white rounded-xl cursor-pointer"
                >
                  {saving ? "Menyimpan..." : "Simpan Nilai & Feedback"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );

  // --- TAB: OVERVIEW ---
  if (activeTab === "overview") {
    return (
      <div className="space-y-6">
        {renderModals()}
        <div className="bg-[#14243A] text-white rounded-2xl p-6 lg:p-7 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <span className="inline-block px-2.5 py-1 rounded-md bg-white/10 text-[#2DD4BF] text-xs font-semibold mb-2">
              Dashboard Asisten Laboratorium
            </span>
            <h2 className="text-xl lg:text-2xl font-bold">Selamat Bertugas, {user.full_name}</h2>
            <p className="text-sm text-slate-300 mt-1">
              Kelola modul praktikum, periksa berkas pengumpulan mahasiswa, dan rekap penilaian secara terpusat.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => setShowClassModal(true)}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Kelas Baru
            </button>
            <button
              onClick={() => {
                setModClassId(classes[0]?.id || 1);
                setShowModModal(true);
              }}
              className="px-4 py-2.5 bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Modul Tugas
            </button>
          </div>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#64748B]">Total Kelas Diampu</span>
              <BookOpen className="w-4 h-4 text-[#14243A]" />
            </div>
            <div className="text-2xl font-bold text-[#0F172A] mt-2">{classes.length}</div>
            <p className="text-xs text-[#64748B] mt-1">{modules.length} modul aktif</p>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#64748B]">Total Praktikan</span>
              <Users className="w-4 h-4 text-[#0D9488]" />
            </div>
            <div className="text-2xl font-bold text-[#0F172A] mt-2">{totalStudents}</div>
            <p className="text-xs text-[#64748B] mt-1">Mahasiswa terdaftar</p>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#64748B]">Antrian Penilaian</span>
              <Clock className="w-4 h-4 text-[#F59E0B]" />
            </div>
            <div className="text-2xl font-bold text-[#0F172A] mt-2">{pendingSubs.length}</div>
            <p className="text-xs text-[#F59E0B] mt-1">Menunggu koreksi asisten</p>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#64748B]">Total Pengumpulan</span>
              <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
            </div>
            <div className="text-2xl font-bold text-[#0F172A] mt-2">{submissions.length}</div>
            <p className="text-xs text-[#16A34A] mt-1">Berkas di Object Storage</p>
          </div>
        </div>

        {/* Recent Submissions Queue */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-[#0F172A]">Pengumpulan Terbaru</h3>
              <p className="text-xs text-[#64748B]">Klik tombol Nilai untuk mengunduh berkas dan memberikan skor.</p>
            </div>
            <button
              onClick={() => setActiveTab("submissions")}
              className="text-xs font-semibold text-[#0D9488] hover:underline"
            >
              Lihat Semua Pengumpulan
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-xs font-semibold text-[#64748B]">
                  <th className="py-3 px-4">Praktikan</th>
                  <th className="py-3 px-4">Modul</th>
                  <th className="py-3 px-4">Berkas</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] text-sm">
                {submissions.slice(0, 6).map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#0F172A]">{sub.student_name}</div>
                      <div className="text-xs text-[#64748B]">{sub.student_nim}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-[#0F172A]">{sub.module_title}</div>
                      <div className="text-xs text-[#64748B]">{sub.class_name}</div>
                    </td>
                    <td className="py-3 px-4 text-xs text-[#14243A] font-medium">{sub.file_name}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          sub.status === "graded"
                            ? "bg-emerald-50 text-[#16A34A]"
                            : "bg-amber-50 text-[#F59E0B]"
                        }`}
                      >
                        {sub.status === "graded" ? `Dinilai (${sub.score})` : "Perlu Dinilai"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => openGradingModal(sub)}
                        className="px-3 py-1.5 rounded-lg bg-[#14243A] hover:bg-[#1E3A5F] text-white text-xs font-semibold cursor-pointer"
                      >
                        {sub.status === "graded" ? "Edit Nilai" : "Nilai"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // --- TAB: MY CLASSES ---
  if (activeTab === "classes") {
    return (
      <div className="space-y-5">
        {renderModals()}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#0F172A]">Daftar Kelas Praktikum</h3>
            <p className="text-xs text-[#64748B]">Bagikan kode unik kelas kepada mahasiswa untuk bergabung.</p>
          </div>
          <button
            onClick={() => setShowClassModal(true)}
            className="px-4 py-2.5 bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Buat Kelas Baru
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {classes.map((cls) => (
            <div key={cls.id} className="bg-white border border-[#E2E8F0] rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-1 rounded-lg bg-[#14243A] text-white text-xs font-semibold">
                    {cls.course_code}
                  </span>
                  <span className="px-3 py-1 rounded-lg bg-teal-50 border border-teal-200 text-[#0D9488] font-mono text-xs font-bold">
                    Kode Gabung: {cls.class_code}
                  </span>
                </div>
                <h4 className="text-lg font-bold text-[#0F172A]">{cls.name}</h4>
                <p className="text-xs text-[#64748B] mt-1">{cls.description}</p>
                <div className="mt-4 pt-3 border-t border-[#E2E8F0] grid grid-cols-2 gap-2 text-xs text-[#64748B]">
                  <div>Jadwal: <strong className="text-[#0F172A]">{cls.schedule}</strong></div>
                  <div>Ruang: <strong className="text-[#0F172A]">{cls.room}</strong></div>
                  <div>Praktikan: <strong className="text-[#0F172A]">{cls.enrolled_count} Mahasiswa</strong></div>
                  <div>Modul: <strong className="text-[#0F172A]">{cls.modules_count} Pertemuan</strong></div>
                </div>
              </div>
              <div className="mt-5 pt-4 border-t border-[#E2E8F0] flex justify-end">
                <button
                  onClick={() => handleDeleteClass(cls.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#DC2626] hover:bg-red-50 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Hapus Kelas
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // --- TAB: MANAGE MODULES ---
  if (activeTab === "modules") {
    return (
      <div className="space-y-5">
        {renderModals()}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#0F172A]">Manajemen Modul &amp; Tugas Praktikum</h3>
            <p className="text-xs text-[#64748B]">Atur instruksi pengerjaan, format berkas yang diizinkan, dan batas waktu.</p>
          </div>
          <button
            onClick={() => {
              setModClassId(classes[0]?.id || 1);
              setShowModModal(true);
            }}
            className="px-4 py-2.5 bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Tambah Modul
          </button>
        </div>

        <div className="space-y-4">
          {modules.map((mod) => (
            <div key={mod.id} className="bg-white border border-[#E2E8F0] rounded-2xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded bg-slate-100 text-[#14243A] text-xs font-bold">
                    {mod.course_code} • {mod.class_name}
                  </span>
                  <span className="text-xs text-[#64748B]">Pertemuan {mod.meeting_number}</span>
                </div>
                <h4 className="text-base font-bold text-[#0F172A]">{mod.title}</h4>
                <p className="text-xs text-[#64748B]">{mod.description}</p>
                <div className="text-xs text-[#0F172A] pt-1">
                  Deadline: <strong>{mod.deadline}</strong> • Format: <strong>{mod.allowed_extensions}</strong> • Terkumpul: <strong>{mod.submissions_count} berkas</strong>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleDeleteModule(mod.id)}
                  className="px-3 py-1.5 rounded-xl border border-red-200 text-[#DC2626] hover:bg-red-50 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // --- TAB: EXPORT GRADES ---
  if (activeTab === "export") {
    return (
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-8 max-w-2xl">
        <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#0D9488] flex items-center justify-center mb-4">
          <FileSpreadsheet className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-[#0F172A]">Ekspor Rekapitulasi Nilai Praktikum (CSV)</h3>
        <p className="text-sm text-[#64748B] mt-1 leading-relaxed">
          Unduh rekapitulasi lengkap nilai mahasiswa, status pengumpulan, waktu unggah, dan catatan evaluasi ke dalam format spreadsheet <strong>.CSV</strong>.
        </p>

        <div className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
              Pilih Kelas Praktikum
            </label>
            <select
              value={filterClassId}
              onChange={(e) => setFilterClassId(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border border-[#E2E8F0] rounded-xl"
            >
              <option value="all">Semua Kelas Praktikum ({submissions.length} data pengumpulan)</option>
              {classes.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.course_code} — {c.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => {
              const query = filterClassId !== "all" ? `?class_id=${filterClassId}` : "";
              downloadProtectedFile(`/reports/export-csv${query}`, "rekap_nilai_cloudlab.csv");
              notify("File CSV rekapitulasi nilai sedang diunduh!");
            }}
            className="px-5 py-2.5 bg-[#0D9488] hover:bg-[#0F766E] text-white text-sm font-semibold rounded-xl inline-flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Unduh Rekap Nilai (.CSV)
          </button>
        </div>
      </div>
    );
  }

  // --- TAB: SUBMISSIONS & GRADE FEEDBACK ---
  return (
    <div className="space-y-5">
      {renderModals()}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap gap-3">
          <select
            value={filterClassId}
            onChange={(e) => setFilterClassId(e.target.value)}
            className="px-3.5 py-2 text-xs font-semibold border border-[#E2E8F0] rounded-xl bg-white"
          >
            <option value="all">Semua Kelas</option>
            {classes.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.course_code} — {c.name}
              </option>
            ))}
          </select>

          <select
            value={filterModuleId}
            onChange={(e) => setFilterModuleId(e.target.value)}
            className="px-3.5 py-2 text-xs font-semibold border border-[#E2E8F0] rounded-xl bg-white"
          >
            <option value="all">Semua Modul</option>
            {modules.map((m) => (
              <option key={m.id} value={String(m.id)}>
                {m.title}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() =>
            downloadProtectedFile("/reports/export-csv", "rekap_nilai_cloudlab.csv")
          }
          className="px-4 py-2 rounded-xl border border-[#E2E8F0] hover:bg-slate-50 text-xs font-semibold text-[#14243A] inline-flex items-center gap-1.5 cursor-pointer"
        >
          <FileSpreadsheet className="w-4 h-4 text-[#0D9488]" />
          Ekspor CSV
        </button>
      </div>

      <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-xs font-semibold text-[#64748B]">
                <th className="py-3.5 px-5">Praktikan</th>
                <th className="py-3.5 px-5">Kelas &amp; Modul</th>
                <th className="py-3.5 px-5">Berkas Tugas</th>
                <th className="py-3.5 px-5">Waktu Unggah</th>
                <th className="py-3.5 px-5">Nilai</th>
                <th className="py-3.5 px-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-sm">
              {filteredSubmissions.map((sub) => (
                <tr key={sub.id} className="hover:bg-slate-50/70">
                  <td className="py-3.5 px-5">
                    <div className="font-semibold text-[#0F172A]">{sub.student_name}</div>
                    <div className="text-xs text-[#64748B]">{sub.student_nim}</div>
                  </td>
                  <td className="py-3.5 px-5">
                    <div className="font-medium text-[#0F172A]">{sub.module_title}</div>
                    <div className="text-xs text-[#64748B]">{sub.class_name}</div>
                  </td>
                  <td className="py-3.5 px-5">
                    <button
                      onClick={() =>
                        downloadProtectedFile(`/submissions/${sub.id}/download`, sub.file_name)
                      }
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0D9488] hover:underline cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      {sub.file_name} ({formatBytes(sub.file_size_bytes)})
                    </button>
                  </td>
                  <td className="py-3.5 px-5 text-xs text-[#64748B]">
                    {formatDateTime(sub.submitted_at)}
                  </td>
                  <td className="py-3.5 px-5">
                    {sub.status === "graded" ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-[#16A34A]">
                        {sub.score} / 100
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-[#F59E0B]">
                        Belum Dinilai
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <button
                      onClick={() => openGradingModal(sub)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-semibold cursor-pointer"
                    >
                      <Award className="w-3.5 h-3.5" />
                      {sub.status === "graded" ? "Ubah Nilai" : "Beri Nilai"}
                    </button>
                  </td>
                </tr>
              ))}
              {filteredSubmissions.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm text-[#64748B]">
                    Tidak ada pengumpulan tugas sesuai filter yang dipilih.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
