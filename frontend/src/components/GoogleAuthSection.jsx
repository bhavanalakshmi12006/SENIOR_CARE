import React, { useState } from "react";
import { UserCheck, Settings as SettingsIcon, AlertCircle, CheckCircle2, X } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export default function GoogleAuthSection({ defaultRole = "senior_citizen", onRoleChange }) {
  const { googleAuth, googleClientId, saveGoogleClientId, lang, t } = useAuth();
  const { showToast } = useToast();

  const [selectedRole, setSelectedRole] = useState(defaultRole);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [inputClientId, setInputClientId] = useState(googleClientId || "");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleRoleSelect = (roleId) => {
    setSelectedRole(roleId);
    if (onRoleChange) onRoleChange(roleId);
  };

  const handleGoogleSuccess = async (response) => {
    setLoading(true);
    setErrorMsg("");
    const res = await googleAuth(response.credential, selectedRole);
    setLoading(false);
    if (!res.success) {
      setErrorMsg(res.message);
      showToast(res.message, "error");
    } else {
      showToast(
        lang === "ta" 
          ? "Google மூலம் வெற்றிகரமாக உள்நுழைந்தீர்கள்!" 
          : "Signed in with Google successfully!", 
        "success"
      );
    }
  };

  const handleGoogleError = () => {
    setErrorMsg(
      lang === "ta"
        ? "Google உள்நுழைவு தோல்வியடைந்தது அல்லது ரத்து செய்யப்பட்டது."
        : "Google sign-in was cancelled or failed."
    );
    showToast("Google sign-in failed", "error");
  };

  const handleSaveClientId = (e) => {
    e.preventDefault();
    const cleanId = inputClientId.trim();
    if (!cleanId) {
      showToast(
        lang === "ta" ? "Google Client ID உள்ளிடவும்" : "Please paste your Google Client ID",
        "warning"
      );
      return;
    }
    saveGoogleClientId(cleanId);
    setShowConfigModal(false);
    showToast(
      lang === "ta" ? "Google Client ID சேமிக்கப்பட்டது!" : "Google Client ID connected!",
      "success"
    );
  };

  return (
    <div className="google-auth-container">
      {/* Role Selection for Google */}
      <div className="google-role-select-box">
        <label className="google-role-label">
          <UserCheck size={14} className="text-primary" />
          <span>{lang === "ta" ? "Google கணக்கிற்கான உங்கள் பங்கு (Role):" : "Select Role for Google Account:"}</span>
        </label>
        <div className="google-role-buttons-grid">
          {[
            { id: "senior_citizen", icon: "👵", label: lang === "ta" ? "மூத்த குடிமகன்" : "Senior Citizen" },
            { id: "family_member", icon: "👨‍👩‍👧", label: lang === "ta" ? "குடும்பத்தினர்" : "Family Member" },
            { id: "caregiver", icon: "👩‍⚕️", label: lang === "ta" ? "பராமரிப்பாளர்" : "Caregiver" },
            { id: "volunteer", icon: "🤝", label: lang === "ta" ? "தன்னார்வலர்" : "Volunteer" },
            { id: "staff", icon: "👔", label: lang === "ta" ? "பணியாளர்" : "Staff" },
            { id: "admin", icon: "🛡️", label: lang === "ta" ? "நிர்வாகி" : "Admin" }
          ].map((r) => (
            <button
              key={r.id}
              type="button"
              className={`google-role-btn-chip ${selectedRole === r.id ? "active" : ""}`}
              onClick={() => handleRoleSelect(r.id)}
            >
              <span>{r.icon}</span>
              <span>{r.label}</span>
            </button>
          ))}
        </div>
      </div>

      {errorMsg && (
        <div className="auth-error-banner" style={{ margin: "10px 0" }}>
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Prominent Continue with Google Button */}
      <div className="google-button-wrapper">
        {googleClientId ? (
          <div className="google-oauth-rendered-box">
            <div className="google-login-btn-target">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                useOneTap={false}
                text="continue_with"
                shape="pill"
                size="large"
                width="100%"
              />
            </div>
            <button
              type="button"
              className="btn-configure-google-link"
              onClick={() => {
                setInputClientId(googleClientId);
                setShowConfigModal(true);
              }}
            >
              ⚙️ {lang === "ta" ? "Google Client ID மாற்றம்" : "Change Google Client ID"}
            </button>
          </div>
        ) : (
          <div className="google-oauth-rendered-box">
            <button
              type="button"
              className="btn-continue-with-google"
              onClick={() => setShowConfigModal(true)}
              title="Sign in with real Google Account"
            >
              <svg className="google-logo-svg" viewBox="0 0 24 24" width="20" height="20">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>{lang === "ta" ? "Google மூலம் தொடரவும் (Continue with Google)" : "Continue with Google"}</span>
            </button>
            <small className="google-hint-subtext">
              {lang === "ta" 
                ? "💡 உங்கள் .env ஃபைலில் VITE_GOOGLE_CLIENT_ID போடலாம் அல்லது மேலே உள்ள பட்டனை அழுத்தவும்"
                : "💡 Set VITE_GOOGLE_CLIENT_ID in .env or click above to paste your Google Client ID"}
            </small>
          </div>
        )}
      </div>

      {/* Modal to paste Google Client ID */}
      {showConfigModal && (
        <div className="modal-backdrop-overlay" onClick={() => setShowConfigModal(false)}>
          <div className="google-config-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="google-modal-header">
              <div className="google-modal-header-title">
                <span className="google-modal-g-badge">G</span>
                <div>
                  <h4>{lang === "ta" ? "உண்மையான Google Authentication" : "Real Google Authentication Setup"}</h4>
                  <small>{lang === "ta" ? "உங்கள் Google Cloud Console Web Client ID-ஐ இணைக்கவும்" : "Connect your Google Cloud OAuth Web Client ID"}</small>
                </div>
              </div>
              <button 
                type="button" 
                className="google-modal-close-btn" 
                onClick={() => setShowConfigModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveClientId} className="google-modal-form">
              <div className="form-group">
                <label>
                  {lang === "ta" ? "Google OAuth Web Client ID:" : "Google OAuth Web Client ID:"}
                </label>
                <input
                  type="text"
                  autoFocus
                  required
                  placeholder="xxxxxx.apps.googleusercontent.com"
                  value={inputClientId}
                  onChange={(e) => setInputClientId(e.target.value)}
                  className="google-modal-input"
                />
                <span className="input-helper-note">
                  {lang === "ta" 
                    ? "💡 குறிப்பு: இதை உங்கள் frontend/.env ஃபைலிலும் VITE_GOOGLE_CLIENT_ID-ஆக சேமிக்கலாம்."
                    : "💡 Tip: You can also set this directly in frontend/.env as VITE_GOOGLE_CLIENT_ID."}
                </span>
              </div>

              <div className="google-modal-footer">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setShowConfigModal(false)}
                >
                  {t.cancel || "Cancel"}
                </button>
                <button
                  type="submit"
                  className="btn-modal-save-google"
                >
                  <CheckCircle2 size={16} />
                  <span>{lang === "ta" ? "இணைக்கவும் (Connect & Enable)" : "Connect & Enable"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
