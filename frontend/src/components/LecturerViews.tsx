"use client";

import React, { useState } from "react";
import {
  BookOpen,
  Users,
  CheckCircle2,
  Award,
  Download,
  BarChart3,
} from "lucide-react";
import { PracticumClass, PracticumModule, Submission, User } from "@/lib/types";
import { downloadProtectedFile, formatDateTime } from "@/lib/api";

interface LecturerViewsProps {
  activeTab: string;
  user: User;
  classes: PracticumClass[];
  modules: PracticumModule[];
  submissions: Submission[];
  notify: (msg: string, type?: "success" | "error") => void;
}

export default function LecturerViews({
  activeTab,
  user,
  classes,
  modules,
  submissions,
  notify,
}: LecturerViewsProps) {
  const [selectedClassId, setSelectedClassId] = useState<string>("all");

  const totalStudents = classes.reduce((acc, c) => acc + c.enrolled_count, 0);
  const gradedSubs = submissions.filter((s) => s.status === "graded" && s.score !== null);
  const avgGrade =
    gradedSubs.length > 0
      ? (gradedSubs.reduce((acc, s) => acc + (s.score || 0), 0) / gradedSubs.length).toFixed(1)
      : "0.0";

  const completionRate =
    submissions.length > 0
      ? Math.round((gradedSubs.length / submissions.length) * 100)
      : 0;

  // Grade distribution buckets
  const dist = {
    A: gradedSubs.filter((s) => (s.score || 0) >= 85).length,
    B: gradedSubs.filter((s) => (s.score || 0) >= 70 && (s.score || 0) < 85).length,
    C: gradedSubs.filter((s) => (s.score || 0) >= 55 && (s.score || 0) < 70).length,
    D: gradedSubs.filter((s) => (s.score || 0) < 55).length,
  };

  const filteredSubs =
    selectedClassId === "all"
      ? submissions
      : submissions.filter((s) => String(s.class_id) === selectedClassId);

  if (activeTab === "export") {
    return (
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-8 max-w-2xl">
        <h3 className="text-lg font-bold text-[#0F172A]">Ekspor Laporan Akademik Praktikum (CSV)</h3>
        <p className="text-sm text-[#64748B] mt-1">
          Unduh rekapitulasi nilai akhir praktikum mahasiswa untuk divalidasi dan diinput ke sistem akademik.
        </p>
        <div className="mt-5 space-y-4">
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm border border-[#E2E8F0] rounded-xl"
          >
            <option value="all">Semua Kelas Praktikum</option>
            {classes.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.course_code} — {c.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => {
              const q = selectedClassId !== "all" ? `?class_id=${selectedClassId}` : "";
              downloadProtectedFile(`/reports/export-csv${q}`, "laporan_nilai_dosen_cloudlab.csv");
              notify("Laporan CSV berhasil diunduh!");
            }}
            className="px-5 py-2.5 bg-[#14243A] hover:bg-[#1E3A5F] text-white text-sm font-semibold rounded-xl inline-flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Unduh Laporan Nilai (.CSV)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#14243A] text-white rounded-2xl p-6 lg:p-7 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <span className="inline-block px-2.5 py-1 rounded-md bg-white/10 text-[#2DD4BF] text-xs font-semibold mb-2">
            Portal Monitoring Dosen Pengampu (Read-Only)
          </span>
          <h2 className="text-xl lg:text-2xl font-bold">{user.full_name}</h2>
          <p className="text-sm text-slate-300 mt-1">
            Pemantauan progres ketercapaian modul praktikum, evaluasi asisten, dan distribusi nilai mahasiswa.
          </p>
        </div>
        <button
          onClick={() => {
            downloadProtectedFile("/reports/export-csv", "rekap_nilai_dosen.csv");
            notify("Rekap nilai CSV diunduh!");
          }}
          className="px-4 py-2.5 bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-semibold rounded-xl inline-flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          Ekspor Rekap CSV
        </button>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B]">Total Kelas Praktikum</span>
            <BookOpen className="w-4 h-4 text-[#14243A]" />
          </div>
          <div className="text-2xl font-bold text-[#0F172A] mt-2">{classes.length}</div>
          <p className="text-xs text-[#64748B] mt-1">{modules.length} modul berjalan</p>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B]">Total Mahasiswa</span>
            <Users className="w-4 h-4 text-[#0D9488]" />
          </div>
          <div className="text-2xl font-bold text-[#0F172A] mt-2">{totalStudents}</div>
          <p className="text-xs text-[#64748B] mt-1">Peserta aktif praktikum</p>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B]">Rasio Penilaian Selesai</span>
            <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
          </div>
          <div className="text-2xl font-bold text-[#0F172A] mt-2">{completionRate}%</div>
          <p className="text-xs text-[#16A34A] mt-1">
            {gradedSubs.length} dari {submissions.length} berkas dinilai
          </p>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B]">Rata-Rata Nilai Kelas</span>
            <Award className="w-4 h-4 text-[#0D9488]" />
          </div>
          <div className="text-2xl font-bold text-[#0F172A] mt-2">{avgGrade}</div>
          <p className="text-xs text-[#64748B] mt-1">Skala penilaian 0–100</p>
        </div>
      </div>

      {/* Charts Section: Class Progress & Grade Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-[#0D9488]" />
            <h3 className="text-base font-bold text-[#0F172A]">Progres Pengumpulan per Kelas</h3>
          </div>
          <div className="space-y-4">
            {classes.map((cls) => {
              const clsSubs = submissions.filter((s) => s.class_id === cls.id);
              const expected = Math.max(cls.enrolled_count * Math.max(cls.modules_count, 1), 1);
              const pct = Math.min(100, Math.round((clsSubs.length / expected) * 100));
              return (
                <div key={cls.id}>
                  <div className="flex justify-between text-xs font-semibold mb-1.5">
                    <span className="text-[#0F172A]">
                      {cls.course_code} — {cls.name}
                    </span>
                    <span className="text-[#0D9488]">
                      {clsSubs.length} berkas ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#0D9488] rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-[#64748B] mt-1">
                    Asisten: {cls.assistant_name} • {cls.enrolled_count} mahasiswa
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6">
          <h3 className="text-base font-bold text-[#0F172A] mb-4">Distribusi Predikat Nilai Praktikum</h3>
          <div className="space-y-4">
            {[
              { label: "Sangat Baik (A: ≥ 85)", count: dist.A, color: "bg-[#16A34A]" },
              { label: "Baik (B: 70 – 84)", count: dist.B, color: "bg-[#0D9488]" },
              { label: "Cukup (C: 55 – 69)", count: dist.C, color: "bg-[#F59E0B]" },
              { label: "Kurang (D: < 55)", count: dist.D, color: "bg-[#DC2626]" },
            ].map((item) => {
              const pct =
                gradedSubs.length > 0 ? Math.round((item.count / gradedSubs.length) * 100) : 0;
              return (
                <div key={item.label}>
                  <div className="flex justify-between text-xs font-semibold mb-1.5">
                    <span className="text-[#0F172A]">{item.label}</span>
                    <span className="text-[#64748B]">
                      {item.count} mahasiswa ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-full`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Student Grade Summary Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-[#0F172A]">Tabel Rekapitulasi Nilai Mahasiswa</h3>
            <p className="text-xs text-[#64748B]">Data sinkron langsung dari penilaian Asisten Laboratorium.</p>
          </div>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="px-3.5 py-2 text-xs font-semibold border border-[#E2E8F0] rounded-xl"
          >
            <option value="all">Semua Kelas</option>
            {classes.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.course_code} — {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-xs font-semibold text-[#64748B]">
                <th className="py-3 px-5">NIM</th>
                <th className="py-3 px-5">Nama Mahasiswa</th>
                <th className="py-3 px-5">Kelas &amp; Modul</th>
                <th className="py-3 px-5">Waktu Kumpul</th>
                <th className="py-3 px-5">Skor</th>
                <th className="py-3 px-5">Evaluasi Asisten</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-sm">
              {filteredSubs.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-5 font-mono text-xs text-[#64748B]">{s.student_nim}</td>
                  <td className="py-3 px-5 font-semibold text-[#0F172A]">{s.student_name}</td>
                  <td className="py-3 px-5">
                    <div className="text-xs font-bold text-[#14243A]">{s.class_name}</div>
                    <div className="text-xs text-[#64748B]">{s.module_title}</div>
                  </td>
                  <td className="py-3 px-5 text-xs text-[#64748B]">{formatDateTime(s.submitted_at)}</td>
                  <td className="py-3 px-5">
                    {s.score !== null ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-[#16A34A]">
                        {s.score}
                      </span>
                    ) : (
                      <span className="text-xs text-[#F59E0B] font-semibold">Pending</span>
                    )}
                  </td>
                  <td className="py-3 px-5 text-xs text-[#64748B] max-w-xs truncate">
                    {s.feedback || "-"}
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
