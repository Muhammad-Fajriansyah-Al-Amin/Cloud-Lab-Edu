"use client";

import React, { useState } from "react";
import {
  Cloud,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User as UserIcon,
  Hash,
  ArrowRight,
  ShieldCheck,
  Server,
  Layers,
} from "lucide-react";
import { apiRequest, setToken } from "@/lib/api";
import { User, UserRole } from "@/lib/types";

interface AuthScreenProps {
  onSuccess: (user: User) => void;
}

const DEMO_ACCOUNTS: { label: string; role: UserRole; email: string; desc: string }[] = [
  {
    label: "Mahasiswa (Praktikan)",
    role: "student",
    email: "rizky.pratama@student.unmul.ac.id",
    desc: "Join kelas, unggah tugas, cek nilai & feedback",
  },
  {
    label: "Asisten Laboratorium",
    role: "assistant",
    email: "fajriansyah@labkom.unmul.ac.id",
    desc: "Kelola kelas/modul, nilai tugas & ekspor CSV",
  },
  {
    label: "Dosen Pengampu",
    role: "lecturer",
    email: "hendra.wijaya@fkip.unmul.ac.id",
    desc: "Monitoring progres kelas & rekap nilai",
  },
  {
    label: "System Admin",
    role: "admin",
    email: "admin@cloudlab.unmul.ac.id",
    desc: "Manajemen RBAC, API health & system logs",
  },
];

export default function AuthScreen({ onSuccess }: AuthScreenProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [fullName, setFullName] = useState("");
  const [nimOrNip, setNimOrNip] = useState("");
  const [email, setEmail] = useState("rizky.pratama@student.unmul.ac.id");
  const [password, setPassword] = useState("demo123");
  const [role, setRole] = useState<UserRole>("student");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "login") {
        const res = await apiRequest<{ access_token: string; user: User }>("/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
        setToken(res.access_token);
        onSuccess(res.user);
      } else {
        const res = await apiRequest<{ access_token: string; user: User }>("/auth/register", {
          method: "POST",
          body: JSON.stringify({
            full_name: fullName,
            nim_or_nip: nimOrNip,
            email,
            password,
            role,
          }),
        });
        setToken(res.access_token);
        onSuccess(res.user);
      }
    } catch (err: any) {
      setError(err.message || "Gagal memproses autentikasi.");
    } finally {
      setLoading(false);
    }
  };

  const quickDemoLogin = async (demoEmail: string) => {
    setError(null);
    setLoading(true);
    try {
      const res = await apiRequest<{ access_token: string; user: User }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: demoEmail, password: "demo123" }),
      });
      setToken(res.access_token);
      onSuccess(res.user);
    } catch (err: any) {
      setError(err.message || "Pastikan kontainer backend FastAPI sudah berjalan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#F8FAFC]">
      {/* Left Enterprise Brand Panel */}
      <div className="lg:w-[46%] bg-[#14243A] text-white p-8 lg:p-14 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-[#0D9488] flex items-center justify-center shadow-sm">
              <Cloud className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight block leading-none">
                CloudLab Edu
              </span>
              <span className="text-xs text-slate-300 tracking-wide">
                Cloud-Native Practicum Platform
              </span>
            </div>
          </div>

          <h1 className="text-3xl lg:text-4xl font-bold leading-tight tracking-tight mb-4">
            Manajemen Praktikum Laboratorium Komputer Terpusat &amp; Berbasis Cloud.
          </h1>
          <p className="text-slate-300 text-sm lg:text-base leading-relaxed mb-8">
            Sentralisasi kelas praktikum, pengumpulan berkas kode dan laporan, penilaian
            terstruktur oleh asisten laboratorium, serta pemantauan akademik real-time.
          </p>

          <div className="space-y-4">
            <div className="flex items-start gap-3.5 bg-white/5 border border-white/10 rounded-xl p-4">
              <Layers className="w-5 h-5 text-[#2DD4BF] shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-white">
                  3-Tier Stateless Architecture
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Next.js Frontend + FastAPI Docker Container + PostgreSQL &amp; Persistent Object Storage.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3.5 bg-white/5 border border-white/10 rounded-xl p-4">
              <ShieldCheck className="w-5 h-5 text-[#2DD4BF] shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Role-Based Access Control (RBAC)
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Pemisahan hak akses terisolasi untuk Praktikan, Asisten Lab, Dosen Pengampu, dan Admin.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3.5 bg-white/5 border border-white/10 rounded-xl p-4">
              <Server className="w-5 h-5 text-[#2DD4BF] shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Program Studi S1 Pendidikan Komputer
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Universitas Mulawarman — Mata Kuliah Komputasi Awan.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 mt-8 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <span>CloudLab Edu v1.0.0 (Docker Deployment)</span>
          <span>REST API + JWT Auth</span>
        </div>
      </div>

      {/* Right Authentication Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm p-7 lg:p-8">
            <div className="flex gap-1 p-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl mb-6">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError(null);
                }}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${
                  mode === "login"
                    ? "bg-[#14243A] text-white shadow-xs"
                    : "text-[#64748B] hover:text-[#0F172A]"
                }`}
              >
                Masuk (Login)
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("register");
                  setError(null);
                }}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${
                  mode === "register"
                    ? "bg-[#14243A] text-white shadow-xs"
                    : "text-[#64748B] hover:text-[#0F172A]"
                }`}
              >
                Daftar Akun
              </button>
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-bold text-[#0F172A]">
                {mode === "login" ? "Selamat Datang Kembali" : "Buat Akun CloudLab Edu"}
              </h2>
              <p className="text-sm text-[#64748B] mt-1">
                {mode === "login"
                  ? "Masukkan kredensial akademik untuk mengakses ruang praktikum."
                  : "Lengkapi data diri Anda untuk bergabung ke sistem laboratorium."}
              </p>
            </div>

            {error && (
              <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-[#DC2626] font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "register" && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                      Nama Lengkap
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-[#64748B] absolute left-3.5 top-3" />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Contoh: Muhammad Fajriansyah"
                        className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-white border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0D9488]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                        NIM / NIP
                      </label>
                      <div className="relative">
                        <Hash className="w-4 h-4 text-[#64748B] absolute left-3.5 top-3" />
                        <input
                          type="text"
                          value={nimOrNip}
                          onChange={(e) => setNimOrNip(e.target.value)}
                          placeholder="2305176014"
                          className="w-full pl-10 pr-3 py-2.5 text-sm bg-white border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0D9488]"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                        Peran (Role)
                      </label>
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value as UserRole)}
                        className="w-full px-3 py-2.5 text-sm bg-white border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0D9488]"
                      >
                        <option value="student">Mahasiswa</option>
                        <option value="assistant">Asisten Lab</option>
                        <option value="lecturer">Dosen Pengampu</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                  Email Akademik
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#64748B] absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@student.unmul.ac.id"
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-white border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0D9488]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                  Kata Sandi
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#64748B] absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 text-sm bg-white border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-[#0D9488]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-[#64748B] hover:text-[#0F172A]"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-[#0D9488] hover:bg-[#0F766E] disabled:opacity-60 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                {loading
                  ? "Memproses..."
                  : mode === "login"
                  ? "Masuk ke Dashboard"
                  : "Daftar & Masuk"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* 1-Click Demo Role Access */}
            <div className="mt-7 pt-6 border-t border-[#E2E8F0]">
              <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-3">
                1-Click Demo Access (Password: demo123)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {DEMO_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.role}
                    type="button"
                    disabled={loading}
                    onClick={() => quickDemoLogin(acc.email)}
                    className="text-left p-2.5 rounded-xl border border-[#E2E8F0] hover:border-[#0D9488] hover:bg-teal-50/40 transition-colors cursor-pointer"
                  >
                    <div className="text-xs font-bold text-[#14243A]">{acc.label}</div>
                    <div className="text-[11px] text-[#64748B] line-clamp-1 mt-0.5">
                      {acc.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
