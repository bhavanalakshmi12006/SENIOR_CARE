import React, { useState } from "react";
import { CheckCircle2, X, Smile, Meh, Frown, AlertCircle } from "lucide-react";
import confetti from "canvas-confetti";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import api from "../../api";

export default function CheckinModal({ isOpen, onClose, onCheckinRecorded }) {
  const { t, lang } = useAuth();
  const { showToast } = useToast();
  const [mood, setMood] = useState("good");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/checkins", {
        mood,
        notes: notes || (lang === "ta" ? "தினசரி பாதுகாப்பு உறுதி செய்யப்பட்டது. நலம்." : "Daily safety check-in completed. Feeling good.")
      });

      // Confetti celebration
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {
        // ignore if canvas-confetti fails
      }

      showToast(
        lang === "ta"
          ? "✓ உங்களின் இன்றைய பாதுகாப்பு check-in வெற்றிகரமாக பதிவு செய்யப்பட்டது! நலமாக இருங்கள்."
          : "✓ Your safety check-in was successfully recorded! Thank you for staying connected.",
        "success"
      );

      if (onCheckinRecorded) onCheckinRecorded(res.data.checkin);
      onClose();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to record check-in", "error");
    } finally {
      setLoading(false);
    }
  };

  const moods = [
    { id: "good", label: t.good, icon: Smile, color: "var(--success)" },
    { id: "okay", label: t.okay, icon: Meh, color: "var(--warning)" },
    { id: "tired", label: t.tired, icon: Frown, color: "var(--info)" },
    { id: "unwell", label: t.unwell, icon: AlertCircle, color: "var(--danger)" }
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog checkin-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-with-icon">
            <CheckCircle2 size={24} className="text-success" />
            <h3>{t.iAmSafe}</h3>
          </div>
          <button className="modal-close-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <p className="modal-desc">
            {lang === "ta" 
              ? "உங்கள் தற்போதைய உடல்நிலை மற்றும் மனநிலையைத் தேர்வு செய்து இன்றைய check-in-ஐ உறுதிப்படுத்தவும்." 
              : "Confirm your daily safety check-in. This notifies your loved ones and caregivers that you are well."}
          </p>

          <label className="form-section-title">{t.mood}</label>
          <div className="mood-selector-grid">
            {moods.map((m) => {
              const Icon = m.icon;
              return (
                <button
                  type="button"
                  key={m.id}
                  className={`mood-select-card ${mood === m.id ? "selected" : ""}`}
                  onClick={() => setMood(m.id)}
                >
                  <Icon size={28} style={{ color: m.color }} />
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>

          <div className="form-group" style={{ marginTop: 16 }}>
            <label>{t.notes}</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={lang === "ta" ? "எ.கா. நடைப்பயிற்சி முடித்தேன், காலை உணவு உண்டேன்" : "e.g. Completed morning walk, vitals normal"}
            />
          </div>

          <div className="modal-actions-row">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
              {t.cancel}
            </button>
            <button type="submit" className="btn-success" disabled={loading}>
              <CheckCircle2 size={18} />
              {loading ? t.loading : (lang === "ta" ? "✓ பாதுகாப்பை உறுதி செய்" : "✓ Confirm I'm Safe")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
