import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../api";
import { translations } from "../i18n";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => {
    try {
      const saved = localStorage.getItem("seniorcare_session");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [lang, setLang] = useState(() => {
    return localStorage.getItem("seniorcare_lang") || "en";
  });

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("seniorcare_theme") || "light";
  });

  const [actionColor, setActionColor] = useState(() => {
    return localStorage.getItem("seniorcare_color") || "#176b87";
  });

  const [textColor, setTextColor] = useState(() => {
    return localStorage.getItem("seniorcare_text_color") || "";
  });

  const [googleClientId, setGoogleClientId] = useState(() => {
    const saved = localStorage.getItem("seniorcare_google_client_id") || "";
    const env = (import.meta.env.VITE_GOOGLE_CLIENT_ID || "").trim();
    if (saved && !saved.includes("your-google")) return saved;
    if (env && !env.includes("your-google")) return env;
    return "";
  });

  const [loading, setLoading] = useState(false);

  // Sync theme, lang, actionColor, and textColor attributes on documentElement
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.lang = lang;

    // Primary / Action accent
    document.documentElement.style.setProperty("--primary", actionColor);
    document.documentElement.style.setProperty("--accent-color", actionColor);
    document.documentElement.style.setProperty("--primary-hover", `color-mix(in srgb, ${actionColor} 82%, black)`);
    document.documentElement.style.setProperty("--primary-light", `color-mix(in srgb, ${actionColor} 15%, transparent)`);
    
    document.body.style.setProperty("--primary", actionColor);
    document.body.style.setProperty("--accent-color", actionColor);

    // Text / Words / Letters font color
    if (textColor) {
      document.documentElement.style.setProperty("--text-main", textColor);
      document.documentElement.style.setProperty("--heading-color", textColor);
      document.documentElement.style.setProperty("--text-secondary", `color-mix(in srgb, ${textColor} 80%, transparent)`);
      document.body.style.setProperty("--text-main", textColor);
      document.body.style.setProperty("--heading-color", textColor);
      document.body.style.setProperty("--text-secondary", `color-mix(in srgb, ${textColor} 80%, transparent)`);
    } else {
      document.documentElement.style.removeProperty("--text-main");
      document.documentElement.style.removeProperty("--heading-color");
      document.documentElement.style.removeProperty("--text-secondary");
      document.body.style.removeProperty("--text-main");
      document.body.style.removeProperty("--heading-color");
      document.body.style.removeProperty("--text-secondary");
    }

    localStorage.setItem("seniorcare_theme", theme);
    localStorage.setItem("seniorcare_lang", lang);
    localStorage.setItem("seniorcare_color", actionColor);
    if (textColor) {
      localStorage.setItem("seniorcare_text_color", textColor);
    } else {
      localStorage.removeItem("seniorcare_text_color");
    }
  }, [theme, lang, actionColor, textColor]);

  // Keep googleClientId in sync across tabs or custom dispatch
  useEffect(() => {
    const handleGoogleIdUpdate = () => {
      const saved = localStorage.getItem("seniorcare_google_client_id") || "";
      const env = (import.meta.env.VITE_GOOGLE_CLIENT_ID || "").trim();
      const raw = saved || env;
      const valid = (!raw || raw.includes("your-google") || raw.includes("your-google-web")) ? "" : raw.trim();
      setGoogleClientId(valid);
    };
    window.addEventListener("seniorcare-google-id-updated", handleGoogleIdUpdate);
    window.addEventListener("storage", handleGoogleIdUpdate);
    return () => {
      window.removeEventListener("seniorcare-google-id-updated", handleGoogleIdUpdate);
      window.removeEventListener("storage", handleGoogleIdUpdate);
    };
  }, []);

  const saveGoogleClientId = (newId) => {
    const trimmed = (newId || "").trim();
    setGoogleClientId(trimmed);
    localStorage.setItem("seniorcare_google_client_id", trimmed);
    window.dispatchEvent(new Event("seniorcare-google-id-updated"));
  };

  const resetAppearance = () => {
    setTheme("light");
    setActionColor("#176b87");
    setTextColor("");
    localStorage.removeItem("seniorcare_color");
    localStorage.removeItem("seniorcare_text_color");
    localStorage.setItem("seniorcare_theme", "light");
  };

  const user = session?.user || null;
  const token = session?.token || null;
  const t = translations[lang] || translations.en;

  const saveAuthSession = (data) => {
    const newSession = { token: data.token, user: data.user };
    localStorage.setItem("seniorcare_session", JSON.stringify(newSession));
    setSession(newSession);

    if (data.user?.preferredLanguage) {
      setLang(data.user.preferredLanguage);
    }
    if (data.user?.themePreference) {
      setTheme(data.user.themePreference);
    }
  };

  const login = async (email, password, role) => {
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password, role });
      saveAuthSession(res.data);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || "Invalid email or password"
      };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      const res = await api.post("/auth/register", userData);
      saveAuthSession(res.data);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || "Registration failed"
      };
    } finally {
      setLoading(false);
    }
  };

  const quickDemoLogin = async (role) => {
    setLoading(true);
    try {
      const res = await api.post("/auth/quick-demo-login", { role });
      saveAuthSession(res.data);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || "Demo login failed"
      };
    } finally {
      setLoading(false);
    }
  };

  const googleAuth = async (credential, role) => {
    setLoading(true);
    try {
      const res = await api.post("/auth/google", { credential, role, clientId: googleClientId });
      saveAuthSession(res.data);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || "Google sign-in failed"
      };
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (formData) => {
    try {
      const res = await api.patch("/auth/profile", formData);
      const updatedUser = res.data.user;
      const updatedSession = { ...session, user: updatedUser };
      localStorage.setItem("seniorcare_session", JSON.stringify(updatedSession));
      setSession(updatedSession);
      return { success: true, user: updatedUser };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || "Failed to update profile"
      };
    }
  };

  const logout = () => {
    localStorage.removeItem("seniorcare_session");
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        loading,
        lang,
        setLang,
        theme,
        setTheme,
        actionColor,
        setActionColor,
        textColor,
        setTextColor,
        googleClientId,
        saveGoogleClientId,
        resetAppearance,
        t,
        login,
        register,
        quickDemoLogin,
        googleAuth,
        updateProfile,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
