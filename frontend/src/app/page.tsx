"use client";

import React, { useEffect, useState } from "react";
import { User } from "@/lib/types";
import { apiRequest, getToken, setToken } from "@/lib/api";
import AuthScreen from "@/components/AuthScreen";
import DashboardApp from "@/components/DashboardApp";

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setCheckingAuth(false);
      return;
    }
    apiRequest<User>("/auth/me")
      .then((u) => setUser(u))
      .catch(() => setToken(null))
      .finally(() => setCheckingAuth(false));
  }, []);

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="text-sm font-semibold text-[#64748B]">
          Memuat sesi CloudLab Edu...
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen onSuccess={(u) => setUser(u)} />;
  }

  return (
    <DashboardApp
      user={user}
      onLogout={() => {
        setToken(null);
        setUser(null);
      }}
      onSwitchUser={(u) => setUser(u)}
    />
  );
}
