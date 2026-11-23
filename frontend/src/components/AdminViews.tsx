"use client";

import React, { useEffect, useState } from "react";
import {
  Activity,
  Database,
  HardDrive,
  RefreshCw,
  Shield,
  Terminal,
  Users,
} from "lucide-react";
import { apiRequest, formatDateTime } from "@/lib/api";
import { HealthResponse, SystemLog, User, UserRole } from "@/lib/types";

interface AdminViewsProps {
  activeTab: string;
  notify: (msg: string, type?: "success" | "error") => void;
}

export default function AdminViews({ activeTab, notify }: AdminViewsProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [pinging, setPinging] = useState(false);

  const loadAdminData = async () => {
    try {
      const [overview, healthRes] = await Promise.all([
        apiRequest<{ users: User[]; logs: SystemLog[] }>("/admin/overview"),
        apiRequest<HealthResponse>("/health"),
      ]);
      setUsers(overview.users);
      setLogs(overview.logs);
      setHealth(healthRes);
    } catch (err: any) {
      notify(err.message || "Gagal memuat data sistem admin.", "error");
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleRoleChange = async (userId: number, newRole: UserRole) => {
    try {
      await apiRequest(`/admin/users/${userId}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role: newRole }),
      });
      notify("Peran pengguna (RBAC) berhasil diperbarui.");
      await loadAdminData();
    } catch (err: any) {
      notify(err.message || "Gagal mengubah peran pengguna.", "error");
    }
  };

  const handleHealthPing = async () => {
    setPinging(true);
    try {
      const res = await apiRequest<HealthResponse>("/health");
      setHealth(res);
      notify(`Health Check OK — DB Latency ${res.db_latency_ms} ms`);
    } catch (err: any) {
      notify("Health Check gagal terhubung ke Backend API.", "error");
    } finally {
      setPinging(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Infrastructure Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B]">API Status</span>
            <Activity className="w-4 h-4 text-[#16A34A]" />
          </div>
          <div className="text-2xl font-bold text-[#16A34A] mt-2 uppercase">
            {health?.status || "ONLINE"}
          </div>
          <p className="text-xs text-[#64748B] mt-1">
            Uptime: {health ? `${health.uptime_seconds}s` : "-"}
          </p>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B]">PostgreSQL Latency</span>
            <Database className="w-4 h-4 text-[#0D9488]" />
          </div>
          <div className="text-2xl font-bold text-[#0F172A] mt-2">
            {health ? `${health.db_latency_ms} ms` : "-"}
          </div>
          <p className="text-xs text-[#64748B] mt-1">Target NFR-02: ≤ 500 ms</p>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B]">Object Storage Quota</span>
            <HardDrive className="w-4 h-4 text-[#14243A]" />
          </div>
          <div className="text-2xl font-bold text-[#0F172A] mt-2">
            {health ? `${health.storage.used_mb} MB` : "0 MB"}
          </div>
          <p className="text-xs text-[#64748B] mt-1">
            {health?.storage.file_count || 0} berkas / 1024 MB free-tier
          </p>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748B]">Total Akun Terdaftar</span>
            <Users className="w-4 h-4 text-[#0D9488]" />
          </div>
          <div className="text-2xl font-bold text-[#0F172A] mt-2">{users.length}</div>
          <p className="text-xs text-[#64748B] mt-1">4 peran RBAC aktif</p>
        </div>
      </div>

      {/* User & Role Management */}
      {(activeTab === "overview" || activeTab === "users") && (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-[#E2E8F0] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#0D9488]" />
              <div>
                <h3 className="text-base font-bold text-[#0F172A]">
                  Manajemen Pengguna &amp; Hak Akses (RBAC)
                </h3>
                <p className="text-xs text-[#64748B]">
                  Ubah peran pengguna secara dinamis tanpa me-restart kontainer layanan.
                </p>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-xs font-semibold text-[#64748B]">
                  <th className="py-3 px-5">Nama Pengguna</th>
                  <th className="py-3 px-5">NIM / NIP</th>
                  <th className="py-3 px-5">Email</th>
                  <th className="py-3 px-5">Peran (Role)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] text-sm">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-5 font-semibold text-[#0F172A]">{u.full_name}</td>
                    <td className="py-3 px-5 font-mono text-xs text-[#64748B]">
                      {u.nim_or_nip || "-"}
                    </td>
                    <td className="py-3 px-5 text-xs text-[#64748B]">{u.email}</td>
                    <td className="py-3 px-5">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                        className="px-3 py-1.5 text-xs font-semibold border border-[#E2E8F0] rounded-lg bg-white"
                      >
                        <option value="student">Student (Praktikan)</option>
                        <option value="assistant">Laboratory Assistant</option>
                        <option value="lecturer">Lecturer (Dosen)</option>
                        <option value="admin">System Admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* API Health & System Logs */}
      {(activeTab === "overview" || activeTab === "health" || activeTab === "logs") && (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-[#14243A]" />
              <div>
                <h3 className="text-base font-bold text-[#0F172A]">
                  Structured System Logs &amp; Health Check
                </h3>
                <p className="text-xs text-[#64748B]">
                  Log aktivitas kontainer backend, autentikasi, dan transaksi penyimpanan objek.
                </p>
              </div>
            </div>
            <button
              onClick={handleHealthPing}
              disabled={pinging}
              className="px-4 py-2 rounded-xl bg-[#14243A] hover:bg-[#1E3A5F] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${pinging ? "animate-spin" : ""}`} />
              Ping /api/v1/health
            </button>
          </div>

          <div className="bg-[#0F172A] text-slate-200 rounded-xl p-4 font-mono text-xs space-y-2 max-h-72 overflow-y-auto">
            {logs.map((log) => (
              <div key={log.id} className="flex items-start gap-2.5">
                <span className="text-slate-400 shrink-0">
                  [{formatDateTime(log.created_at)}]
                </span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                    log.level === "WARN"
                      ? "bg-amber-500/20 text-amber-300"
                      : log.level === "ERROR"
                      ? "bg-red-500/20 text-red-300"
                      : "bg-teal-500/20 text-teal-300"
                  }`}
                >
                  {log.level}
                </span>
                <span className="text-sky-300 shrink-0">({log.service})</span>
                <span className="text-slate-100">{log.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
