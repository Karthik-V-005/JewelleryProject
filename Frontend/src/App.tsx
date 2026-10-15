import { useState, useEffect } from "react";
import { AdminLogin } from "./components/AdminLogin";
import { AdminDashboard } from "./components/AdminDashboard";
import { ForgotPassword } from "./components/ForgotPassword";
import { PublicStoreProfilePage } from "./components/public/PublicStoreProfilePage";
import { Toaster } from 'sonner';

import "./styles/variables.css";
import "./styles/typography.css";
import "./styles/premium-ui.css";

export default function App() {
  type View = "login" | "forgot" | "dashboard" | "public-store";
  const [view, setView] = useState<View>(() => {
    const path = window.location.pathname.toLowerCase();
    if (path.startsWith('/store/') || path.startsWith('/stores/')) {
      const parts = path.split('/').filter(Boolean);
      if (parts.length >= 2) {
        return "public-store";
      }
    }
    const token = sessionStorage.getItem("adminToken");
    return token ? "dashboard" : "login";
  });

  // Listen for browser popstate
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.toLowerCase();
      if (path.startsWith('/store/') || path.startsWith('/stores/')) {
        const parts = path.split('/').filter(Boolean);
        if (parts.length >= 2) {
          setView("public-store");
          return;
        }
      }
      const token = sessionStorage.getItem("adminToken");
      setView(token ? "dashboard" : "login");
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleLogin = () => {
    setView("dashboard");
  };

  const handleLogout = () => {
    sessionStorage.removeItem("adminToken");
    setView("login");
  };

  if (view === "public-store") {
    return (
      <div className="min-h-screen w-full flex flex-col">
        <Toaster position="top-right" expand={true} richColors />
        <PublicStoreProfilePage onNavigateBack={() => setView("login")} />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col">
      <Toaster position="top-right" expand={true} richColors />
      {view === "dashboard" ? (
        <AdminDashboard onLogout={handleLogout} />
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-white p-4">
          {view === "login" && (
            <AdminLogin
              onLogin={handleLogin}
              onForgotPassword={() => setView("forgot")}
            />
          )}

          {view === "forgot" && (
            <ForgotPassword onBack={() => setView("login")} />
          )}
        </div>
      )}
    </div>
  );
}
