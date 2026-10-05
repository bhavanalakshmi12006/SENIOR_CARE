import React, { useState } from "react";
import { AlertOctagon, X, PhoneCall, ShieldAlert, Check } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import api from "../../api";

export default function EmergencyModal({ isOpen, onClose, onEmergencyTriggered }) {
  const { t, lang } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState("Home / Bedside");
  const [notes, setNotes] = useState("");
  const [severity, setSeverity] = useState("critical");

  if (!isOpen) return null;

  const handleTrigger = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/emergencies", {
        location,
        notes: notes || (lang === "ta" ? "அவசர உதவி கோரப்பட்டது" : "Emergency assistance requested by senior"),
        severity
      });
      showToast(
        lang === "ta"
          ? `🚨 அவசர எச்சரிக்கை உருவாக்கப்பட்டது (${res.data.emergency.emergencyCode})! பராமரிப்பாளர் மற்றும் குடும்பத்தினருக்கு அறிவிக்கப்பட்டது.`
          : `🚨 Emergency Alert created (${res.data.emergency.emergencyCode})! Care team notified.`,
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
      <div className="modal-dialog emergency-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="emergency-modal-header">
          <div className="emergency-icon-circle pulse-danger">
            <AlertOctagon size={36} />
          </div>
          <button className="modal-close-icon" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body text-center">
          <h2 className="modal-danger-title">{t.triggerEmergencyTitle}</h2>
          <p className="modal-desc">{t.triggerEmergencyDesc}</p>

          <div className="emergency-notify-checklist">
            <div className="checklist-item">
              <Check size={16} className="text-success" />
              <span>{lang === "ta" ? "பராமரிப்பாளர் மற்றும் செவிலியருக்கு நேரலை அழைப்பு" : "Caregiver & On-duty Nurse Alert"}</span>
            </div>
            <div className="checklist-item">
              <Check size={16} className="text-success" />
              <span>{lang === "ta" ? "குடும்ப உறுப்பினர்களுக்கு SMS & WhatsApp அறிவிப்பு" : "Family Members SMS & WhatsApp Alert"}</span>
            </div>
            <div className="checklist-item">
              <Check size={16} className="text-success" />
              <span>{lang === "ta" ? "கணினி நிர்வாகி & ஊழியர் Dashboard எச்சரிக்கை" : "Staff & Admin Real-time Dashboard Beacon"}</span>
            </div>
          </div>

          <form onSubmit={handleTrigger} className="emergency-quick-form">
            <div className="form-group text-left">
              <label>{t.location}</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Room 104, Living Room, Garden"
                required
              />
            </div>

            <div className="form-group text-left">
              <label>{t.notes}</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Shortness of breath, sudden fall, dizziness"
              />
            </div>

            <div className="modal-actions-row">
              <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
                {t.cancel}
              </button>
              <button type="submit" className="btn-emergency-danger" disabled={loading}>
                <ShieldAlert size={20} />
                {loading ? t.loading : t.confirmEmergencyBtn}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
