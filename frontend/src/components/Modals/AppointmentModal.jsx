import React, { useState, useEffect } from "react";
import { Calendar, X, Clock, Hospital, User } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import api from "../../api";

export default function AppointmentModal({ isOpen, onClose, onAppointmentCreated }) {
  const { t, lang } = useAuth();
  const { showToast } = useToast();
  const [seniors, setSeniors] = useState([]);
  const [formData, setFormData] = useState({
    seniorId: "",
    doctorName: "",
    department: "Cardiology",
    hospital: "Apollo Senior Health Center",
    appointmentDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
    timeSlot: "10:30 AM",
    notes: ""
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.doctorName || !formData.appointmentDate) {
      showToast("Doctor Name and Date are required", "warning");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/appointments", formData);
      showToast(
        lang === "ta"
          ? `✓ மருத்துவ சந்திப்பு வெற்றிகரமாக திட்டமிடப்பட்டது (${res.data.appointment.appointmentCode})`
          : `✓ Appointment scheduled successfully (${res.data.appointment.appointmentCode})`,
        "success"
      );
      if (onAppointmentCreated) onAppointmentCreated(res.data.appointment);
      onClose();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to schedule appointment", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-with-icon">
            <Calendar size={22} className="text-primary" />
            <h3>{t.scheduleAppointment}</h3>
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

          <div className="form-group">
            <label>{t.doctor} *</label>
            <input
              type="text"
              required
              value={formData.doctorName}
              onChange={(e) => setFormData({ ...formData, doctorName: e.target.value })}
              placeholder="e.g. Dr. S. Kumar, MD"
            />
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label>{t.department}</label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              >
                <option value="General Medicine">General Medicine</option>
                <option value="Cardiology">Cardiology</option>
                <option value="Ophthalmology">Ophthalmology</option>
                <option value="Orthopedics">Orthopedics</option>
                <option value="Neurology">Neurology</option>
                <option value="Geriatrics">Geriatrics</option>
                <option value="Dentistry">Dentistry</option>
              </select>
            </div>

            <div className="form-group">
              <label>{t.hospital}</label>
              <input
                type="text"
                value={formData.hospital}
                onChange={(e) => setFormData({ ...formData, hospital: e.target.value })}
                placeholder="e.g. City Care Hospital"
              />
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label>{lang === "ta" ? "சந்திப்பு தேதி *" : "Appointment Date *"}</label>
              <input
                type="date"
                required
                value={formData.appointmentDate}
                onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>{lang === "ta" ? "நேரம்" : "Time Slot"}</label>
              <select
                value={formData.timeSlot}
                onChange={(e) => setFormData({ ...formData, timeSlot: e.target.value })}
              >
                <option value="09:00 AM">09:00 AM</option>
                <option value="10:30 AM">10:30 AM</option>
                <option value="11:45 AM">11:45 AM</option>
                <option value="02:00 PM">02:00 PM</option>
                <option value="03:30 PM">03:30 PM</option>
                <option value="05:00 PM">05:00 PM</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>{t.notes}</label>
            <input
              type="text"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="e.g. Follow-up for blood pressure review"
            />
          </div>

          <div className="modal-actions-row">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
              {t.cancel}
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              <Calendar size={18} />
              {loading ? t.loading : t.scheduleAppointment}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
