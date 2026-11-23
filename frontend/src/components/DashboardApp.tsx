"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Cloud,
  LayoutDashboard,
  BookOpen,
  FileText,
  History,
  Award,
  User as UserIcon,
  LogOut,
  Menu,
  X,
  FolderPlus,
  Inbox,
  FileSpreadsheet,
  BarChart3,
  Shield,
  Activity,
  Terminal,
  Bell,
  ChevronRight,
} from "lucide-react";
import { PracticumClass, PracticumModule, Submission, User, UserRole } from "@/lib/types";
import { apiRequest, setToken } from "@/lib/api";
import StudentViews from "./StudentViews";
import AssistantViews from "./AssistantViews";
import LecturerViews from "./LecturerViews";
import AdminViews from "./AdminViews";

interface DashboardAppProps {
  user: User;
  onLogout: () => void;
  onSwitchUser: (u: User) => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const ROLE_NAVS: Record<UserRole, NavItem[]> = {
  student: [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "classes", label: "My Classes", icon: BookOpen },
    { id: "assignments", label: "Assignments", icon: FileText },
    { id: "history", label: "Submission History", icon: History },
    { id: "grades", label: "Grades & Feedback", icon: Award },
    { id: "profile", label: "Profile", icon: UserIcon },
  ],
  assistant: [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "classes", label: "My Classes", icon: BookOpen },
    { id: "modules", label: "Manage Modules", icon: FolderPlus },
    { id: "submissions", label: "Submissions", icon: Inbox },
    { id: "grading", label: "Grade & Feedback", icon: Award },
    { id: "export", label: "Export Grades", icon: FileSpreadsheet },
    { id: "profile", label: "Profile", icon: UserIcon },
  ],
  lecturer: [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "monitoring", label: "Class Monitoring", icon: BookOpen },
    { id: "grades", label: "Grade Summary", icon: Award },
    { id: "statistics", label: "Submission Statistics", icon: BarChart3 },
    { id: "export", label: "Export CSV", icon: FileSpreadsheet },
    { id: "profile", label: "Profile", icon: UserIcon },
  ],
  admin: [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "users", label: "User & Role Management", icon: Shield },
    { id: "health", label: "API Health & Storage", icon: Activity },
    { id: "logs", label: "System Logs", icon: Terminal },
    { id: "profile", label: "Profile", icon: UserIcon },
  ],
};

const ROLE_LABELS: Record<UserRole, string> = {
  student: "Student (Praktikan)",
  assistant: "Laboratory Assistant",
  lecturer: "Lecturer (Dosen)",
  admin: "System Administrator",
};

const DEMO_SWITCH_EMAILS: Record<UserRole, string> = {
  student: "rizky.pratama@student.unmul.ac.id",
  assistant: "fajriansyah@labkom.unmul.ac.id",
  lecturer: "hendra.wijaya@fkip.unmul.ac.id",
  admin: "admin@cloudlab.unmul.ac.id",
};

export default function DashboardApp({
  user,
  onLogout,
  onSwitchUser,
}: DashboardAppProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [classes, setClasses] = useState<PracticumClass[]>([]);
  const [modules, setModules] = useState<PracticumModule[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(
    null
  );

  const notify = useCallback((msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const fetchAllData = useCallback(async () => {
    try {
      const [clsRes, modRes, subRes] = await Promise.all([
        apiRequest<PracticumClass[]>("/classes"),
        apiRequest<PracticumModule[]>("/modules"),
        apiRequest<Submission[]>("/submissions"),
      ]);
      setClasses(clsRes);
      setModules(modRes);
      setSubmissions(subRes);
    } catch (err: any) {
      notify(err.message || "Gagal memuat data praktikum.", "error");
    } finally {
      setLoadingData(false);
    }
  }, [notify]);

  useEffect(() => {
    setActiveTab("overview");
    setLoadingData(true);
    fetchAllData();
  }, [user.id, fetchAllData]);

  const handleQuickRoleSwitch = async (targetRole: UserRole) => {
    if (targetRole === user.role) return;
    try {
      const res = await apiRequest<{ access_token: string; user: User }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: DEMO_SWITCH_EMAILS[targetRole],
          password: "demo123",
        }),
      });
      setToken(res.access_token);
      onSwitchUser(res.user);
      notify(`Beralih ke akun ${ROLE_LABELS[targetRole]}`);
    } catch (err: any) {
      notify(err.message || "Gagal berpindah peran demo.", "error");
    }
  };

  const navItems = ROLE_NAVS[user.role] || ROLE_NAVS.student;
  const currentNav = navItems.find((n) => n.id === activeTab) || navItems[0];

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[#14243A] text-white w-[240px]">
      {/* Brand */}
      <div className="h-16 px-5 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#0D9488] flex items-center justify-center">
            <Cloud className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-bold text-sm tracking-tight block leading-none">
              CloudLab Edu
            </span>
            <span className="text-[10px] text-slate-400">Labkom Unmul</span>
          </div>
        </div>
        <button
          onClick={() => setMobileMenuOpen(false)}
          className="lg:hidden p-1 text-slate-300 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Role Pill */}
      <div className="px-4 py-3 border-b border-white/10">
        <div className="px-3 py-2 rounded-xl bg-white/5 border border-white/10">
          <div className="text-[10px] uppercase tracking-wider text-[#2DD4BF] font-semibold">
            Active Role
          </div>
          <div className="text-xs font-bold text-white truncate mt-0.5">
            {ROLE_LABELS[user.role]}
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                isActive
                  ? "bg-[#0D9488] text-white shadow-xs"
                  : "text-slate-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div className="p-3 border-t border-white/10">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-red-300 hover:bg-red-500/15 hover:text-red-200 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-[#F8FAFC] text-[#0F172A]">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl shadow-lg text-xs font-semibold text-white flex items-center gap-2 ${
            toast.type === "error" ? "bg-[#DC2626]" : "bg-[#14243A]"
          }`}
        >
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Desktop Fixed Sidebar (240px) */}
      <aside className="hidden lg:block w-[240px] shrink-0">
        <div className="fixed inset-y-0 left-0 w-[240px] z-30">
          <SidebarContent />
        </div>
      </aside>

      {/* Mobile Drawer Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/50"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-10">
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-[#E2E8F0] px-4 lg:px-8 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl border border-[#E2E8F0] text-[#0F172A]"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-1.5 text-[11px] text-[#64748B]">
                <span>CloudLab Edu</span>
                <ChevronRight className="w-3 h-3" />
                <span className="font-semibold text-[#0D9488]">{currentNav.label}</span>
              </div>
              <h1 className="text-base font-bold text-[#0F172A] leading-tight">
                {currentNav.label}
              </h1>
            </div>
          </div>

          {/* Right Controls: Quick Demo Role Switcher & User Badge */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-1.5 bg-[#F8FAFC] border border-[#E2E8F0] px-2.5 py-1.5 rounded-xl">
              <span className="text-[11px] font-semibold text-[#64748B]">Demo Switch:</span>
              <select
                value={user.role}
                onChange={(e) => handleQuickRoleSwitch(e.target.value as UserRole)}
                className="text-xs font-bold text-[#14243A] bg-transparent focus:outline-none cursor-pointer"
              >
                <option value="student">Student</option>
                <option value="assistant">Asisten Lab</option>
                <option value="lecturer">Dosen</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <button
              onClick={() => notify("Semua layanan CloudLab Edu berjalan normal.")}
              className="p-2 rounded-xl border border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] relative"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="w-2 h-2 rounded-full bg-[#0D9488] absolute top-1.5 right-1.5" />
            </button>

            <div className="flex items-center gap-2.5 pl-2 border-l border-[#E2E8F0]">
              <div className="w-8 h-8 rounded-full bg-[#14243A] text-white text-xs font-bold flex items-center justify-center">
                {user.full_name.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold text-[#0F172A] leading-none">
                  {user.full_name}
                </div>
                <div className="text-[11px] text-[#64748B] mt-0.5">{user.email}</div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">
          {loadingData ? (
            <div className="space-y-4">
              <div className="h-32 bg-white border border-[#E2E8F0] rounded-2xl animate-pulse" />
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-24 bg-white border border-[#E2E8F0] rounded-2xl animate-pulse"
                  />
                ))}
              </div>
            </div>
          ) : activeTab === "profile" ? (
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 max-w-xl space-y-4">
              <h3 className="text-lg font-bold text-[#0F172A]">Profil Pengguna Akademik</h3>
              <div className="grid grid-cols-2 gap-4 text-sm pt-2 border-t border-[#E2E8F0]">
                <div>
                  <span className="text-xs text-[#64748B] block">Nama Lengkap</span>
                  <strong className="text-[#0F172A]">{user.full_name}</strong>
                </div>
                <div>
                  <span className="text-xs text-[#64748B] block">NIM / NIP</span>
                  <strong className="text-[#0F172A]">{user.nim_or_nip || "-"}</strong>
                </div>
                <div>
                  <span className="text-xs text-[#64748B] block">Email</span>
                  <strong className="text-[#0F172A]">{user.email}</strong>
                </div>
                <div>
                  <span className="text-xs text-[#64748B] block">Hak Akses (Role)</span>
                  <strong className="text-[#0D9488]">{ROLE_LABELS[user.role]}</strong>
                </div>
              </div>
            </div>
          ) : user.role === "student" ? (
            <StudentViews
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              user={user}
              classes={classes}
              modules={modules}
              submissions={submissions}
              onRefresh={fetchAllData}
              notify={notify}
            />
          ) : user.role === "assistant" ? (
            <AssistantViews
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              user={user}
              classes={classes}
              modules={modules}
              submissions={submissions}
              onRefresh={fetchAllData}
              notify={notify}
            />
          ) : user.role === "lecturer" ? (
            <LecturerViews
              activeTab={activeTab}
              user={user}
              classes={classes}
              modules={modules}
              submissions={submissions}
              notify={notify}
            />
          ) : (
            <AdminViews activeTab={activeTab} notify={notify} />
          )}
        </main>
      </div>
    </div>
  );
}
