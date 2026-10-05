import React, { useState, useEffect } from "react";
import { HandHeart, X, Pill, Utensils, ShoppingBag, Car, Home, HelpCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import api from "../../api";

export default function AssistanceModal({ isOpen, onClose, onAssistanceCreated }) {
  const { t, lang } = useAuth();
  const { showToast } = useToast();
  const [seniors, setSeniors] = useState([]);
  const [formData, setFormData] = useState({
    seniorId: "",
    category: "Medicine Pickup",
    title: "",
    description: "",
    priority: "Normal"
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      api.get("/seniors").then((res) => {
        setSeniors(res.data.seniors || []);
        if (res.data.seniors?.length > 0 && !formData.seniorId) {
          setFormData((prev) => ({ ...prev, seniorId: res.data.seniors[0]._id }));
        }
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const categories = [
    { id: "Medicine Pickup", label: t.medicinePickup, icon: Pill },
    { id: "Food Assistance", label: t.foodAssistance, icon: Utensils },
    { id: "Shopping", label: t.shopping, icon: ShoppingBag },
    { id: "Travel Assistance", label: t.travelAssistance, icon: Car },
    { id: "Home Assistance", label: t.homeAssistance, icon: Home },
    { id: "Other", label: t.other, icon: HelpCircle }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title) {
      showToast("Please enter a short title for your request", "warning");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/assistance", formData);
      showToast(
        lang === "ta"
          ? "✓ உதவி கோரிக்கை சமர்ப்பிக்கப்பட்டது! தன்னார்வலர்/பராமரிப்பாளர் விரைவில் இணைவார்."
          : "✓ Assistance request submitted! Volunteers and care staff notified.",
        "success"
      );
      if (onAssistanceCreated) onAssistanceCreated(res.data.request);
      onClose();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to submit request", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-with-icon">
            <HandHeart size={22} className="text-primary" />
            <h3>{t.requestAssistance}</h3>
          </div>
          <button className="modal-close-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>{t.seniors}</label>
            <select
              value={formData.seniorId}
              onChange={(e) => setFormData({ ...formData, seniorId: e.target.value })}
            >
              {seniors.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} ({s.roomNumber || "Resident"})
                </option>
              ))}
            </select>
          </div>

          <label className="form-section-title">{t.category}</label>
          <div className="category-select-grid">
            {categories.map((c) => {
              const Icon = c.icon;
              return (
                <button
                  type="button"
                  key={c.id}
                  className={`category-chip ${formData.category === c.id ? "active" : ""}`}
                  onClick={() => setFormData({ ...formData, category: c.id })}
                >
                  <Icon size={16} />
                  <span>{c.label}</span>
                </button>
              );
            })}
          </div>

          <div className="form-group" style={{ marginTop: 14 }}>
            <label>{lang === "ta" ? "கோரிக்கை தலைப்பு *" : "Request Title *"}</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder={lang === "ta" ? "எ.கா. இரத்த அழுத்த மாத்திரைகள் மருந்துக்கடையில் வாங்க வேண்டும்" : "e.g. Refill blood pressure prescription from pharmacy"}
            />
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label>{t.priority}</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              >
                <option value="Normal">Normal</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>

            <div className="form-group">
              <label>{lang === "ta" ? "கூடுதல் விபரம்" : "Additional Details"}</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Specific instructions, delivery time..."
              />
            </div>
          </div>

          <div className="modal-actions-row">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
              {t.cancel}
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              <HandHeart size={18} />
              {loading ? t.loading : t.requestAssistance}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
