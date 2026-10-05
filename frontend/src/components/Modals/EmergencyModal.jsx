import React, { useState } from "react";
import { AlertOctagon, X, PhoneCall, ShieldAlert, Check, Zap, Sparkles } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import api from "../../api";

export default function EmergencyModal({ isOpen, onClose, onEmergencyTriggered }) {
  const { t, lang, user } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState("Home / Bedside");
  const [notes, setNotes] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [channels, setChannels] = useState({
    whatsapp: true,
    sms: true,
    email: true
  });

  if (!isOpen) return null;

  const triggerInstantSOS = async () => {
    setLoading(true);
    const activeChannels = Object.keys(channels).filter(k => channels[k]);
    try {
      const res = await api.post("/emergencies", {
        location: location || "Resident Bedside / Home",
        notes: notes || (lang === "ta" ? "🚨 உடனடி அவசர உதவி கோரப்பட்டது (Instant SOS Triggered)" : "🚨 Immediate emergency alert initiated by resident — immediate dispatch"),
        severity: "critical",
        channels: activeChannels
      });

      showToast(
        lang === "ta"
          ? `🚨 உடனடி அவசர எச்சரிக்கை அனுப்பப்பட்டது (${res.data.emergency?.emergencyCode})! WhatsApp, SMS, மற்றும் Google Mail வழியாக தெரிவிக்கப்பட்டது.`
          : `🚨 Instant Emergency Alert dispatched (${res.data.emergency?.emergencyCode})! WhatsApp, SMS, and Google Mail teams alerted.`,
        "emergency",
        8000
      );

      if (onEmergencyTriggered) onEmergencyTriggered(res.data.emergency);
      onClose();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to trigger emergency", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog emergency-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <div className="emergency-modal-header">
          <div className="emergency-icon-circle pulse-danger">
            <AlertOctagon size={36} />
          </div>
          <button className="modal-close-icon" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body text-center">
          <h2 className="modal-danger-title" style={{ fontSize: "1.4rem" }}>
            {lang === "ta" ? "🚨 அவசர உதவி மையம் (Emergency SOS)" : "🚨 Instant Emergency SOS"}
          </h2>
          <p className="modal-desc" style={{ fontSize: "0.92rem", marginBottom: "1.25rem" }}>
            {lang === "ta" 
              ? "எந்த படிவமும் நிரப்ப தேவையில்லை. கீழே உள்ள உடனடி SOS பட்டனை அழுத்தவும்." 
              : "No questions or forms required. Click the button below for immediate care dispatch."}
          </p>

          {/* GIANT INSTANT 1-CLICK SOS BUTTON */}
          <button
            type="button"
            className="btn-emergency-danger pulse-danger"
            onClick={triggerInstantSOS}
            disabled={loading}
            style={{ 
              width: "100%", 
              padding: "1.1rem", 
              fontSize: "1.15rem", 
              fontWeight: "800",
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center", 
              gap: "0.6rem", 
              borderRadius: "14px",
              boxShadow: "0 6px 24px rgba(239, 68, 68, 0.45)",
              marginBottom: "1.25rem",
              border: "none",
              cursor: "pointer"
            }}
          >
            <Zap size={24} />
            <span>
              {loading 
                ? (lang === "ta" ? "அவசர உதவி அனுப்பப்படுகிறது..." : "Dispatching Emergency Teams...") 
                : (lang === "ta" ? "⚡ உடனடி அவசர உதவி (INSTANT SOS)" : "⚡ TRIGGER INSTANT SOS NOW")}
            </span>
          </button>

          {/* Automatic Multi-Channel Alert Badges */}
          <div className="emergency-notify-checklist" style={{ textAlign: "left", marginBottom: "1rem" }}>
            <div className="checklist-item">
              <Check size={16} className="text-success" />
              <span>📱 <strong>WhatsApp</strong> {lang === "ta" ? "செவிலியர் & குடும்பத்திற்கு நேரலை எச்சரிக்கை" : "Caregiver & Family Instant Alert"}</span>
            </div>
            <div className="checklist-item">
              <Check size={16} className="text-success" />
              <span>💬 <strong>SMS Gateway</strong> {lang === "ta" ? "முன்னுரிமை அவசர தகவல் அனுப்பப்படும்" : "Priority Dispatch to On-duty Staff"}</span>
            </div>
            <div className="checklist-item">
              <Check size={16} className="text-success" />
              <span>📧 <strong>Google Mail</strong> {lang === "ta" ? "மருத்துவ அறிக்கை எச்சரிக்கை" : "Formal Incident Alert & GPS Location"}</span>
            </div>
          </div>

          {/* Optional Details Toggle */}
          <div style={{ textAlign: "left", borderTop: "1px solid var(--border)", paddingTop: "0.75rem" }}>
            <button
              type="button"
              className="btn-link"
              onClick={() => setShowAdvanced(!showAdvanced)}
              style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}
            >
              {showAdvanced ? "▲ " : "▼ "}
              {lang === "ta" ? "விருப்பப்படி இடம் / குறிப்பு சேர்க்க (Optional Details)" : "Add optional location or notes"}
            </button>

            {showAdvanced && (
              <div style={{ marginTop: "0.75rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: "600", display: "block" }}>{t.location}</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Room 104, Bathroom, Living Hall"
                    style={{ width: "100%", padding: "0.5rem", borderRadius: "8px", border: "1px solid var(--border)", fontSize: "0.85rem" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: "600", display: "block" }}>{t.notes}</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Sudden dizziness, chest pain"
                    style={{ width: "100%", padding: "0.5rem", borderRadius: "8px", border: "1px solid var(--border)", fontSize: "0.85rem" }}
                  />
                </div>
              </div>
            )}
          </div>

          <div style={{ marginTop: "1rem" }}>
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading} style={{ width: "100%" }}>
              {t.cancel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
