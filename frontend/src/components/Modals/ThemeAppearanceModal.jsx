import React from "react";
import { X, Sun, Moon, Sparkles, Check, RotateCcw, Palette, Type } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function ThemeAppearanceModal({ isOpen, onClose }) {
  const { 
    theme, setTheme, 
    actionColor, setActionColor, 
    textColor, setTextColor, 
    resetAppearance, 
    lang, t 
  } = useAuth();

  if (!isOpen) return null;

  const ACCENT_PRESETS = [
    { label: t.colorTeal || "Teal", hex: "#176b87" },
    { label: t.colorBlue || "Sapphire", hex: "#2563eb" },
    { label: t.colorGreen || "Emerald", hex: "#059669" },
    { label: t.colorPurple || "Purple", hex: "#7c3aed" },
    { label: t.colorRose || "Rose", hex: "#e11d48" },
    { label: t.colorAmber || "Amber", hex: "#d97706" },
    { label: "Coral", hex: "#ea580c" },
    { label: "Gold", hex: "#ca8a04" },
    { label: "Cyan", hex: "#0891b2" }
  ];

  const TEXT_PRESETS = [
    { label: lang === "ta" ? "இயல்பு நிலை" : "Default", hex: "" },
    { label: lang === "ta" ? "வெள்ளை" : "Pure White", hex: "#ffffff" },
    { label: lang === "ta" ? "கருப்பு / கரி" : "Charcoal", hex: "#0f172a" },
    { label: lang === "ta" ? "நீலம்" : "Deep Navy", hex: "#1e3a8a" },
    { label: lang === "ta" ? "மரகதம்" : "Forest Slate", hex: "#064e3b" },
    { label: lang === "ta" ? "ஊதா" : "Plum Purple", hex: "#581c87" },
    { label: lang === "ta" ? "தங்கம்" : "Golden Glow", hex: "#fde047" },
    { label: lang === "ta" ? "புதினா" : "Mint Glow", hex: "#86efac" }
  ];

  return (
    <div className="modal-backdrop-overlay" onClick={onClose}>
      <div className="theme-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="theme-modal-header">
          <div className="theme-header-left">
            <span className="theme-header-icon">
              <Palette size={22} className="text-primary" />
            </span>
            <div>
              <h3>{t.themeCustomizer || "Theme & Color Customizer"}</h3>
              <p>{lang === "ta" ? "தீம், முதன்மை நிறம் மற்றும் எழுத்துகளின் நிறத்தை மாற்றவும்" : "Customize background mode, accent colors, and word/letter text colors"}</p>
            </div>
          </div>
          <button className="theme-modal-close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="theme-modal-body">
          {/* 1. Theme Mode Selection */}
          <div className="theme-section-block">
            <h4 className="theme-block-title">
              <Sun size={16} />
              <span>{lang === "ta" ? "1. காட்சி தீம் (Theme Mode)" : "1. Appearance Mode"}</span>
            </h4>
            <div className="theme-modes-grid">
              <button
                type="button"
                className={`theme-mode-card ${theme === "light" ? "active" : ""}`}
                onClick={() => setTheme("light")}
              >
                <div className="mode-icon-circle light">☀️</div>
                <strong>{t.themeLight || "Light"}</strong>
                <small>{lang === "ta" ? "பகல் பயன்முறை" : "Bright & Crisp"}</small>
              </button>

              <button
                type="button"
                className={`theme-mode-card ${theme === "dark" ? "active" : ""}`}
                onClick={() => setTheme("dark")}
              >
                <div className="mode-icon-circle dark">🌙</div>
                <strong>{t.themeDark || "Dark"}</strong>
                <small>{lang === "ta" ? "இரவு பயன்முறை" : "Modern Dark"}</small>
              </button>

              <button
                type="button"
                className={`theme-mode-card ${theme === "calm" ? "active" : ""}`}
                onClick={() => setTheme("calm")}
              >
                <div className="mode-icon-circle calm">🌊</div>
                <strong>{t.themeCalm || "Calm Slate"}</strong>
                <small>{lang === "ta" ? "அமைதி நீலம்" : "Soothing Eye-Care"}</small>
              </button>

              <button
                type="button"
                className={`theme-mode-card ${theme === "midnight" ? "active" : ""}`}
                onClick={() => setTheme("midnight")}
              >
                <div className="mode-icon-circle midnight">🌌</div>
                <strong>{t.themeMidnight || "Midnight OLED"}</strong>
                <small>{lang === "ta" ? "ஆழ்ந்த கருப்பு" : "Deep High Contrast"}</small>
              </button>
            </div>
          </div>

          {/* 2. Primary / Action Accent Color */}
          <div className="theme-section-block">
            <div className="theme-block-header-row">
              <h4 className="theme-block-title">
                <Sparkles size={16} />
                <span>{t.actionColor || "Action / Accent Color"}</span>
              </h4>
              <label className="custom-color-picker-label">
                <span>{t.customColor || "Custom"}:</span>
                <input
                  type="color"
                  value={actionColor}
                  onChange={(e) => setActionColor(e.target.value)}
                  className="native-color-picker"
                  title="Pick any color"
                />
                <span className="color-hex-tag">{actionColor}</span>
              </label>
            </div>

            <div className="theme-color-swatches-grid">
              {ACCENT_PRESETS.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  className={`color-swatch-circle ${actionColor.toLowerCase() === c.hex.toLowerCase() ? "active" : ""}`}
                  style={{ backgroundColor: c.hex }}
                  onClick={() => setActionColor(c.hex)}
                  title={c.label}
                >
                  {actionColor.toLowerCase() === c.hex.toLowerCase() && <Check size={16} color="#fff" />}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Words / Letters / Font Color (Text Color) */}
          <div className="theme-section-block">
            <div className="theme-block-header-row">
              <h4 className="theme-block-title">
                <Type size={16} />
                <span>{t.wordsColor || "Words & Letters Color (Font Color)"}</span>
              </h4>
              <label className="custom-color-picker-label">
                <span>{t.customColor || "Custom"}:</span>
                <input
                  type="color"
                  value={textColor || (theme === "dark" || theme === "midnight" ? "#f8fafc" : "#0f172a")}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="native-color-picker"
                  title="Pick custom text color"
                />
                <span className="color-hex-tag">{textColor || (lang === "ta" ? "தானியங்கு" : "Auto")}</span>
              </label>
            </div>

            <div className="theme-color-swatches-grid">
              {TEXT_PRESETS.map((tItem, idx) => {
                const isActive = tItem.hex === "" ? !textColor : textColor.toLowerCase() === tItem.hex.toLowerCase();
                return (
                  <button
                    key={idx}
                    type="button"
                    className={`color-swatch-circle ${isActive ? "active" : ""} ${tItem.hex === "" ? "default-swatch" : ""}`}
                    style={tItem.hex ? { backgroundColor: tItem.hex } : {}}
                    onClick={() => setTextColor(tItem.hex)}
                    title={tItem.label}
                  >
                    {tItem.hex === "" ? (
                      <span className="swatch-auto-text">A</span>
                    ) : (
                      isActive && <Check size={16} color={tItem.hex === "#ffffff" ? "#000" : "#fff"} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Live Interactive Preview Box */}
          <div className="theme-live-preview-box">
            <span className="preview-badge-label">{t.livePreview || "Live Preview"}</span>
            <div className="preview-content-card">
              <h2 className="preview-heading">SeniorCare Platform</h2>
              <p className="preview-text">
                {lang === "ta"
                  ? "மூத்த குடிமக்கள் பாதுகாப்பு மற்றும் பராமரிப்பு மேலாண்மை தளம் — எழுத்துகள் மற்றும் நிறங்கள் நேரலையில் மாறுகின்றன."
                  : "Senior citizen real-time care and emergency platform — text and action colors updated live."}
              </p>
              <div className="preview-buttons-row">
                <button className="preview-btn-sample primary">
                  <span>✓ {t.iAmSafe || "I AM SAFE"}</span>
                </button>
                <button className="preview-btn-sample outline">
                  <span>{t.appointments || "Appointments"}</span>
                </button>
                <span className="preview-badge-sample">Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="theme-modal-footer">
          <button type="button" className="btn-theme-reset" onClick={resetAppearance}>
            <RotateCcw size={15} />
            <span>{t.resetDefaultColors || "Reset to Defaults"}</span>
          </button>
          <button type="button" className="btn-theme-done" onClick={onClose}>
            <span>{t.save || "Done"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
