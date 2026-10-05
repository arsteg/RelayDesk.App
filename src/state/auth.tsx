import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/api/client";
import { clearSession, loadSession, saveSession, type StoredSession } from "@/api/session";
import type { AcceptInvitationRequest, CustomerAuthResponse } from "@relaydesk/shared";

interface AuthContextValue {
  session: StoredSession | null;
  loading: boolean;
  login: (email: string, password: string, businessId: string) => Promise<void>;
  accept: (token: string, body: AcceptInvitationRequest) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<StoredSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSession()
      .then(setSession)
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      loading,
      async login(email, password, businessId) {
        const data = await apiFetch<CustomerAuthResponse>("/customer/auth/login", {
          body: { email, password, businessId },
        });
        setSession(await saveSession(data));
      },
      async accept(token, body) {
        const data = await apiFetch<CustomerAuthResponse>(`/invitations/${token}/accept`, { body });
        setSession(await saveSession(data));
      },
      async logout() {
        if (session) {
          await apiFetch("/customer/auth/logout", { token: session.token, method: "POST" }).catch(() => {});
        }
        await clearSession();
        setSession(null);
      },
    }),
    [session, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
