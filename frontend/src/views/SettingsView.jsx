import React, { useState, useEffect } from "react";
import { Settings, User, Bell, Lock, Globe, Sun, Moon, Save, Check, Palette, Type, Sparkles, RotateCcw } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import api from "../api";
import ThemeAppearanceModal from "../components/Modals/ThemeAppearanceModal";

export default function SettingsView() {
  const { 
    user, updateProfile, 
    lang, setLang, 
    theme, setTheme, 
    actionColor, setActionColor, 
    textColor, setTextColor, 
    resetAppearance,
    t 
  } = useAuth();
  const { showToast } = useToast();

  const [themeModalOpen, setThemeModalOpen] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [address, setAddress] = useState(user?.address || "");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [notifPrefs, setNotifPrefs] = useState({
    emergency: { inApp: true, email: true, sms: true, whatsapp: true },
    appointments: { inApp: true, email: true, sms: false, whatsapp: false },
    checkins: { inApp: true, email: false, sms: false, whatsapp: false },
    fees: { inApp: true, email: true, sms: false, whatsapp: false }
  });

  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [loadingPrefs, setLoadingPrefs] = useState(false);

  useEffect(() => {
    api.get("/notifications/preferences")
      .then((res) => {
        if (res.data.preferences) setNotifPrefs(res.data.preferences);
      })
      .catch((e) => console.error(e));
  }, []);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setLoadingProfile(true);
    const res = await updateProfile({ displayName, phone, address, preferredLanguage: lang, themePreference: theme });
    setLoadingProfile(false);
    if (res.success) {
      showToast(lang === "ta" ? "சுயவிவரம் சேமிக்கப்பட்டது!" : "Profile updated successfully!", "success");
    } else {
      showToast(res.message, "error");
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast("New passwords do not match", "warning");
      return;
    }
    setLoadingPassword(true);
    try {
      await api.post("/auth/change-password", { currentPassword, newPassword });
      showToast(lang === "ta" ? "கடவுச்சொல் வெற்றிகரமாக மாற்றப்பட்டது!" : "Password changed successfully!", "success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to change password", "error");
    } finally {
      setLoadingPassword(false);
    }
  };

  const handleSavePrefs = async () => {
    setLoadingPrefs(true);
    try {
      await api.patch("/notifications/preferences", notifPrefs);
      showToast(lang === "ta" ? "அறிவிப்பு விருப்பங்கள் புதுப்பிக்கப்பட்டன!" : "Notification preferences saved!", "success");
    } catch (err) {
      showToast("Failed to save preferences", "error");
    } finally {
      setLoadingPrefs(false);
    }
  };

  const handleTogglePref = (category, channel) => {
    setNotifPrefs((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [channel]: !prev[category]?.[channel]
      }
    }));
  };

  return (
    <div className="view-page-container">
      <div className="view-header-bar">
        <div>
          <h2>{t.settings}</h2>
          <p>{lang === "ta" ? "உங்கள் கணக்கு, பாதுகாப்பு மற்றும் அறிவிப்பு அமைப்புகள்" : "Manage your user profile, notifications, and visual preferences"}</p>
        </div>
      </div>

      <div className="settings-grid-layout">
        {/* Profile Details Form */}
        <div className="settings-card">
          <div className="settings-card-header">
            <User size={20} className="text-primary" />
            <h3>{lang === "ta" ? "சுயவிவர விபரங்கள்" : "Profile Information"}</h3>
          </div>

          <form onSubmit={handleSaveProfile} className="modal-form">
            <div className="form-group">
              <label>{t.fullName}</label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>{t.emailAddress}</label>
              <input type="email" disabled value={user?.email || ""} className="disabled-input" />
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label>{lang === "ta" ? "தொலைபேசி" : "Phone"}</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 00000"
                />
              </div>

              <div className="form-group">
                <label>{lang === "ta" ? "பயனர் பங்கு" : "Account Role"}</label>
                <input type="text" disabled value={t[user?.role] || user?.role || ""} className="disabled-input" />
              </div>
            </div>

            <div className="form-group">
              <label>{lang === "ta" ? "இருப்பிட முகவரி" : "Address"}</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="City, State"
              />
            </div>

            <button type="submit" className="btn-primary" disabled={loadingProfile}>
              <Save size={16} />
              <span>{loadingProfile ? t.loading : t.save}</span>
            </button>
          </form>
        </div>

        {/* Preferences: Language & Theme */}
        <div className="settings-card">
          <div className="settings-card-header">
            <Globe size={20} className="text-primary" />
            <h3>{lang === "ta" ? "மொழி & காட்சி தீம்" : "Language & Appearance"}</h3>
          </div>

          <div className="pref-setting-row">
            <div>
              <strong>{t.language}</strong>
              <small>{lang === "ta" ? "பயன்பாட்டு மொழி தேர்வு" : "Choose UI language"}</small>
            </div>
            <div className="lang-toggle-group">
              <button
                className={`lang-option-btn ${lang === "en" ? "active" : ""}`}
                onClick={() => setLang("en")}
              >
                English
              </button>
              <button
                className={`lang-option-btn ${lang === "ta" ? "active" : ""}`}
                onClick={() => setLang("ta")}
              >
                தமிழ்
              </button>
            </div>
          </div>

          {/* Appearance Mode */}
          <div className="pref-setting-row">
            <div>
              <strong>{lang === "ta" ? "காட்சி தீம்" : "Color Theme"}</strong>
              <small>{lang === "ta" ? "பகல், இரவு, அமைதி அல்லது ஆழ்ந்த கருப்பு" : "Switch between light, dark, calm, or midnight"}</small>
            </div>
            <div className="theme-toggle-group">
              <button
                type="button"
                className={`theme-option-btn ${theme === "light" ? "active" : ""}`}
                onClick={() => setTheme("light")}
              >
                <Sun size={15} /> {t.themeLight || "Light"}
              </button>
              <button
                type="button"
                className={`theme-option-btn ${theme === "dark" ? "active" : ""}`}
                onClick={() => setTheme("dark")}
              >
                <Moon size={15} /> {t.themeDark || "Dark"}
              </button>
              <button
                type="button"
                className={`theme-option-btn ${theme === "calm" ? "active" : ""}`}
                onClick={() => setTheme("calm")}
              >
                <span>🌊</span> {t.themeCalm || "Calm"}
              </button>
              <button
                type="button"
                className={`theme-option-btn ${theme === "midnight" ? "active" : ""}`}
                onClick={() => setTheme("midnight")}
              >
                <span>🌌</span> {t.themeMidnight || "Midnight"}
              </button>
            </div>
          </div>

          {/* Action / Accent Color */}
          <div className="pref-setting-row">
            <div className="pref-label-with-input">
              <strong>{t.actionColor || "Action / Accent Color"}</strong>
              <small>{t.chooseAccentColor || "Pick any custom accent color"}</small>
              <div className="custom-color-inline">
                <input
                  type="color"
                  value={actionColor}
                  onChange={(e) => setActionColor(e.target.value)}
                  className="native-color-picker"
                  title="Pick any color"
                />
                <span className="color-hex-tag">{actionColor}</span>
              </div>
            </div>
            <div className="action-color-picker-grid">
              {[
                { label: t.colorTeal || "Teal", hex: "#176b87" },
                { label: t.colorBlue || "Sapphire", hex: "#2563eb" },
                { label: t.colorGreen || "Emerald", hex: "#059669" },
                { label: t.colorPurple || "Purple", hex: "#7c3aed" },
                { label: t.colorRose || "Rose", hex: "#e11d48" },
                { label: t.colorAmber || "Amber", hex: "#d97706" }
              ].map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  className={`color-chip-btn ${actionColor === c.hex ? "active" : ""}`}
                  style={{ backgroundColor: c.hex }}
                  onClick={() => setActionColor(c.hex)}
                  title={c.label}
                >
                  {actionColor === c.hex && <Check size={16} color="#fff" />}
                </button>
              ))}
            </div>
          </div>

          {/* Words / Letters / Text Color */}
          <div className="pref-setting-row">
            <div className="pref-label-with-input">
              <strong>{t.wordsColor || "Words & Letters Color (Font Color)"}</strong>
              <small>{lang === "ta" ? "அனைத்து வார்த்தைகள் மற்றும் எழுத்துகளின் நிறத்தை மாற்றவும்" : "Change the color of all words and text throughout the app"}</small>
              <div className="custom-color-inline">
                <input
                  type="color"
                  value={textColor || (theme === "dark" || theme === "midnight" ? "#f8fafc" : "#0f172a")}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="native-color-picker"
                  title="Pick custom text color"
                />
                <span className="color-hex-tag">{textColor || (lang === "ta" ? "தானியங்கு" : "Auto")}</span>
              </div>
            </div>
            <div className="action-color-picker-grid">
              {[
                { label: "Default", hex: "" },
                { label: "White", hex: "#ffffff" },
                { label: "Charcoal", hex: "#0f172a" },
                { label: "Navy", hex: "#1e3a8a" },
                { label: "Slate", hex: "#064e3b" },
                { label: "Gold", hex: "#ca8a04" }
              ].map((tc, idx) => {
                const isActive = tc.hex === "" ? !textColor : textColor.toLowerCase() === tc.hex.toLowerCase();
                return (
                  <button
                    key={idx}
                    type="button"
                    className={`color-chip-btn ${isActive ? "active" : ""} ${tc.hex === "" ? "default-chip" : ""}`}
                    style={tc.hex ? { backgroundColor: tc.hex } : { background: "var(--bg-subtle)", color: "var(--text-main)" }}
                    onClick={() => setTextColor(tc.hex)}
                    title={tc.label}
                  >
                    {tc.hex === "" ? "Auto" : (isActive && <Check size={16} color={tc.hex === "#ffffff" ? "#000" : "#fff"} />)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Open Live Customizer Modal and Reset */}
          <div className="pref-setting-actions-row">
            <button
              type="button"
              className="btn-theme-customizer-open"
              onClick={() => setThemeModalOpen(true)}
            >
              <Palette size={16} />
              <span>{lang === "ta" ? "முழு தனிப்பயனாக்கி & நேரலை முன்னோட்டம்" : "Open Full Theme & Color Customizer (Live Preview)"}</span>
            </button>
            <button
              type="button"
              className="btn-theme-reset-subtle"
              onClick={resetAppearance}
              title="Reset default colors"
            >
              <RotateCcw size={14} />
              <span>{t.resetDefaultColors || "Reset Defaults"}</span>
            </button>
          </div>

          {/* Change Password */}
          <div className="settings-card-header" style={{ marginTop: 28 }}>
            <Lock size={20} className="text-primary" />
            <h3>{lang === "ta" ? "கடவுச்சொல் மாற்று" : "Change Password"}</h3>
          </div>

          <form onSubmit={handleChangePassword} className="modal-form">
            <div className="form-group">
              <label>{lang === "ta" ? "தற்போதைய கடவுச்சொல்" : "Current Password"}</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div className="form-row-2">
              <div className="form-group">
                <label>{lang === "ta" ? "புதிய கடவுச்சொல்" : "New Password"}</label>
                <input
                  type="password"
                  required
                  minLength="8"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>{lang === "ta" ? "உறுதிப்படுத்துக" : "Confirm Password"}</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>
            <button type="submit" className="btn-secondary" disabled={loadingPassword}>
              <span>{loadingPassword ? t.loading : (lang === "ta" ? "கடவுச்சொல் மாற்று" : "Update Password")}</span>
            </button>
          </form>
        </div>

        {/* Notification Channel Preferences */}
        <div className="settings-card col-span-full">
          <div className="settings-card-header">
            <Bell size={20} className="text-primary" />
            <div>
              <h3>{t.notificationPreferences}</h3>
              <small>{lang === "ta" ? "ஒவ்வொரு எச்சரிக்கைக்கும் உங்களுக்கு விருப்பமான தொடர்பு வழிகளைத் தேர்ந்தெடுக்கவும்" : "Configure alerts per event type across In-App, Email, SMS, and WhatsApp"}</small>
            </div>
          </div>

          <div className="notif-channels-table-wrapper">
            <table className="data-table notif-channels-table">
              <thead>
                <tr>
                  <th>Event Category</th>
                  <th className="text-center">{t.inApp}</th>
                  <th className="text-center">{t.email}</th>
                  <th className="text-center">{t.sms}</th>
                  <th className="text-center">{t.whatsapp}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>🚨 {t.emergency}</strong></td>
                  <td className="text-center">
                    <input
                      type="checkbox"
                      checked={notifPrefs.emergency?.inApp}
                      onChange={() => handleTogglePref("emergency", "inApp")}
                    />
                  </td>
                  <td className="text-center">
                    <input
                      type="checkbox"
                      checked={notifPrefs.emergency?.email}
                      onChange={() => handleTogglePref("emergency", "email")}
                    />
                  </td>
                  <td className="text-center">
                    <input
                      type="checkbox"
                      checked={notifPrefs.emergency?.sms}
                      onChange={() => handleTogglePref("emergency", "sms")}
                    />
                  </td>
                  <td className="text-center">
                    <input
                      type="checkbox"
                      checked={notifPrefs.emergency?.whatsapp}
                      onChange={() => handleTogglePref("emergency", "whatsapp")}
                    />
                  </td>
                </tr>

                <tr>
                  <td><strong>📅 {t.appointments}</strong></td>
                  <td className="text-center">
                    <input
                      type="checkbox"
                      checked={notifPrefs.appointments?.inApp}
                      onChange={() => handleTogglePref("appointments", "inApp")}
                    />
                  </td>
                  <td className="text-center">
                    <input
                      type="checkbox"
                      checked={notifPrefs.appointments?.email}
                      onChange={() => handleTogglePref("appointments", "email")}
                    />
                  </td>
                  <td className="text-center">
                    <input
                      type="checkbox"
                      checked={notifPrefs.appointments?.sms}
                      onChange={() => handleTogglePref("appointments", "sms")}
                    />
                  </td>
                  <td className="text-center">
                    <input
                      type="checkbox"
                      checked={notifPrefs.appointments?.whatsapp}
                      onChange={() => handleTogglePref("appointments", "whatsapp")}
                    />
                  </td>
                </tr>

                <tr>
                  <td><strong>✓ {t.safety}</strong></td>
                  <td className="text-center">
                    <input
                      type="checkbox"
                      checked={notifPrefs.checkins?.inApp}
                      onChange={() => handleTogglePref("checkins", "inApp")}
                    />
                  </td>
                  <td className="text-center">
                    <input
                      type="checkbox"
                      checked={notifPrefs.checkins?.email}
                      onChange={() => handleTogglePref("checkins", "email")}
                    />
                  </td>
                  <td className="text-center">
                    <input
                      type="checkbox"
                      checked={notifPrefs.checkins?.sms}
                      onChange={() => handleTogglePref("checkins", "sms")}
                    />
                  </td>
                  <td className="text-center">
                    <input
                      type="checkbox"
                      checked={notifPrefs.checkins?.whatsapp}
                      onChange={() => handleTogglePref("checkins", "whatsapp")}
                    />
                  </td>
                </tr>

                <tr>
                  <td><strong>💳 {t.fees}</strong></td>
                  <td className="text-center">
                    <input
                      type="checkbox"
                      checked={notifPrefs.fees?.inApp}
                      onChange={() => handleTogglePref("fees", "inApp")}
                    />
                  </td>
                  <td className="text-center">
                    <input
                      type="checkbox"
                      checked={notifPrefs.fees?.email}
                      onChange={() => handleTogglePref("fees", "email")}
                    />
                  </td>
                  <td className="text-center">
                    <input
                      type="checkbox"
                      checked={notifPrefs.fees?.sms}
                      onChange={() => handleTogglePref("fees", "sms")}
                    />
                  </td>
                  <td className="text-center">
                    <input
                      type="checkbox"
                      checked={notifPrefs.fees?.whatsapp}
                      onChange={() => handleTogglePref("fees", "whatsapp")}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: 16 }}>
            <button className="btn-primary" onClick={handleSavePrefs} disabled={loadingPrefs}>
              <Save size={16} />
              <span>{loadingPrefs ? t.loading : (lang === "ta" ? "விருப்பங்களை சேமிக்க" : "Save Notification Preferences")}</span>
            </button>
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
