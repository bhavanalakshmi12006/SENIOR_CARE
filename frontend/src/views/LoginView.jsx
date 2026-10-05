import React, { useState } from "react";
import { 
  HeartHandshake, LogIn, UserPlus, Shield, User, Heart, 
  HelpCircle, Sparkles, AlertCircle, CheckCircle2, Lock, Mail, 
  Palette, UserCheck, Settings as SettingsIcon 
} from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import ThemeAppearanceModal from "../components/Modals/ThemeAppearanceModal";
import GoogleAuthSection from "../components/GoogleAuthSection";

export default function LoginView({ onSwitchToRegister }) {
  const { 
    login, quickDemoLogin, 
    lang, setLang, theme, setTheme, 
    actionColor, t 
  } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [themeModalOpen, setThemeModalOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);
    const res = await login(email, password, role || undefined);
    setLoading(false);
    if (!res.success) {
      setErrorMsg(res.message);
      showToast(res.message, "error");
    } else {
      showToast(lang === "ta" ? "வெற்றிகரமாக உள்நுழைந்தீர்கள்!" : "Signed in successfully!", "success");
    }
  };

  const handleDemoLogin = async (demoRole) => {
    setErrorMsg("");
    setLoading(true);
    const res = await quickDemoLogin(demoRole);
    setLoading(false);
    if (!res.success) {
      setErrorMsg(res.message);
      showToast(res.message, "error");
    } else {
      showToast(
        lang === "ta"
          ? `${t[demoRole] || demoRole} கணக்கில் வெற்றிகரமாக உள்நுழைந்தீர்கள்!`
          : `Signed in as ${t[demoRole] || demoRole}!`,
        "success"
      );
    }
  };

  return (
    <div className="auth-page-container">
      {/* Top Bar on Login Page */}
      <div className="auth-top-bar">
        <div className="brand-logo-inline">
          <HeartHandshake size={24} className="text-primary" />
          <span>SeniorCare (SCS)</span>
        </div>

        <div className="auth-top-controls">
          <button
            className={`lang-pill ${lang === "en" ? "active" : ""}`}
            onClick={() => setLang("en")}
          >
            English
          </button>
          <button
            className={`lang-pill ${lang === "ta" ? "active" : ""}`}
            onClick={() => setLang("ta")}
          >
            தமிழ்
          </button>
          
          <button
            className="theme-pill"
            onClick={() => setThemeModalOpen(true)}
            title={t.themeCustomizer || "Theme & Colors"}
          >
            <Palette size={15} style={{ color: actionColor }} />
            <span>{lang === "ta" ? "தீம் / நிறங்கள்" : "Theme & Colors"}</span>
          </button>
        </div>
      </div>

      <div className="auth-split-layout">
        {/* Left Side: Hero Information */}
        <div className="auth-hero-panel">
          <span className="hero-eyebrow">SENIOR CITIZEN SAFETY & CARE SYSTEM</span>
          <h1 className="hero-main-title">{t.tagline}</h1>
          <p className="hero-sub-text">{t.subtitle}</p>

          <div className="auth-features-list">
            <div className="hero-feature-item">
              <span className="hero-icon-box">🚨</span>
              <div>
                <strong>{lang === "ta" ? "24/7 நேரலை அவசர உதவி" : "24/7 Real-Time Emergency Response"}</strong>
                <p>{lang === "ta" ? "ஒரே கிளிக்கில் குடும்பத்தினர், பராமரிப்பாளர்கள் மற்றும் அவசர குழுவிற்கு எச்சரிக்கை." : "Instant alert broadcast to family, caregivers, and medical emergency teams."}</p>
              </div>
            </div>

            <div className="hero-feature-item">
              <span className="hero-icon-box">✓</span>
              <div>
                <strong>{lang === "ta" ? "தினசரி பாதுகாப்பு Check-in" : "Daily 'I AM SAFE' Safety Check-ins"}</strong>
                <p>{lang === "ta" ? "மூத்த குடிமக்களின் நலம் மற்றும் உடல்நிலையை தினமும் எளிதாக பதிவு செய்தல்." : "Keep loved ones reassured with effortless one-tap daily wellness confirmations."}</p>
              </div>
            </div>

            <div className="hero-feature-item">
              <span className="hero-icon-box">💬</span>
              <div>
                <strong>{lang === "ta" ? "இருமொழி AI உதவி Chatbot" : "Bilingual AI Care Assistant (EN/தமிழ்)"}</strong>
                <p>{lang === "ta" ? "சந்திப்புகள், கட்டணங்கள், பராமரிப்பாளர் தகவல் அனைத்தையும் உடனே அறியலாம்." : "Smart assistance for upcoming visits, care fees, and caregiver contacts."}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Login Card & Role Switcher */}
        <div className="auth-form-panel">
          <div className="auth-card-box">
            <div className="auth-card-header">
              <h2>{t.signIn}</h2>
              <p>{lang === "ta" ? "உங்கள் கணக்கில் உள்நுழைந்து சேவைகளைப் பெறுங்கள்" : "Enter your credentials or choose a quick demo account"}</p>
            </div>

            {errorMsg && (
              <div className="auth-error-banner">
                <AlertCircle size={18} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Email + Password Form */}
            <form onSubmit={handleEmailLogin} className="auth-form">
              <div className="form-group">
                <label>{t.emailAddress}</label>
                <div className="input-with-icon">
                  <Mail size={18} className="input-icon" />
                  <input
                    type="email"
                    required
                    placeholder="senior.test@seniorcare.local"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>{t.password}</label>
                <div className="input-with-icon">
                  <Lock size={18} className="input-icon" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <button type="submit" className="btn-auth-submit" disabled={loading}>
                <LogIn size={18} />
                {loading ? t.loading : t.signIn}
              </button>
            </form>

            {/* Google OAuth Section */}
            <div className="oauth-divider">
              <span>{lang === "ta" ? "அல்லது Google மூலம் தொடரவும்" : "OR CONTINUE WITH GOOGLE"}</span>
            </div>

            <GoogleAuthSection defaultRole="senior_citizen" />

            {/* Pre-Seeded Local Accounts for Testing */}
            <div className="demo-accounts-section">
              <div className="demo-header-label">
                <Sparkles size={16} className="text-warning" />
                <strong>{lang === "ta" ? "உள்ளூர் சோதனை கணக்குகள் (Local Seed Logins)" : "Pre-Seeded Test Accounts (Local)"}</strong>
              </div>
              <div className="demo-buttons-grid">
                <button
                  type="button"
                  className="demo-role-btn admin"
                  onClick={() => handleDemoLogin("admin")}
                  disabled={loading}
                >
                  🛡️ {t.demoAdmin}
                </button>
                <button
                  type="button"
                  className="demo-role-btn staff"
                  onClick={() => handleDemoLogin("staff")}
                  disabled={loading}
                >
                  👔 {t.demoStaff}
                </button>
                <button
                  type="button"
                  className="demo-role-btn senior"
                  onClick={() => handleDemoLogin("senior_citizen")}
                  disabled={loading}
                >
                  👵 {t.demoSenior}
                </button>
                <button
                  type="button"
                  className="demo-role-btn family"
                  onClick={() => handleDemoLogin("family_member")}
                  disabled={loading}
                >
                  👨‍👩‍👧 {t.demoFamily}
                </button>
                <button
                  type="button"
                  className="demo-role-btn caregiver"
                  onClick={() => handleDemoLogin("caregiver")}
                  disabled={loading}
                >
                  👩‍⚕️ {t.demoCaregiver}
                </button>
                <button
                  type="button"
                  className="demo-role-btn volunteer"
                  onClick={() => handleDemoLogin("volunteer")}
                  disabled={loading}
                >
                  🤝 {t.demoVolunteer}
                </button>
              </div>
            </div>

            <div className="auth-card-footer">
              <span>{lang === "ta" ? "புதியவரா?" : "Don't have an account?"}</span>
              <button type="button" className="btn-link" onClick={onSwitchToRegister}>
                {t.signUp}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Full Theme & Custom Word/Letter Colors Modal */}
      <ThemeAppearanceModal 
        isOpen={themeModalOpen} 
        onClose={() => setThemeModalOpen(false)} 
      />
    </div>
  );
}
