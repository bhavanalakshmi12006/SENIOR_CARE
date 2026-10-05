import React, { useState, useEffect } from "react";
import { 
  Calendar, X, Clock, Hospital, User, CheckCircle2, 
  Phone, Mail, MessageSquare, Send, Copy 
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import api from "../../api";

export default function AppointmentModal({ isOpen, onClose, onAppointmentCreated }) {
  const { t, lang, user } = useAuth();
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

  // Recipient Contact Details for Live Dispatch
  const [recipientPhone, setRecipientPhone] = useState("+91 98765 00003");
  const [recipientEmail, setRecipientEmail] = useState(user?.email || "family@seniorcare.local");

  // Notification Channels Selection
  const [channels, setChannels] = useState({
    whatsapp: true,
    sms: true,
    email: true
  });

  // Success view state with direct dispatch action buttons
  const [appointmentSuccessData, setAppointmentSuccessData] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setAppointmentSuccessData(null);
      api.get("/seniors").then((res) => {
        const fetchedSeniors = res.data.seniors || [];
        setSeniors(fetchedSeniors);
        if (fetchedSeniors.length > 0) {
          const first = fetchedSeniors[0];
          setFormData((prev) => ({ ...prev, seniorId: prev.seniorId || first._id }));
          setRecipientPhone(first.emergencyContactPhone || first.phone || "+91 98765 00003");
        }
      });
    }
  }, [isOpen]);

  const handleSeniorChange = (id) => {
    setFormData((prev) => ({ ...prev, seniorId: id }));
    const snr = seniors.find((s) => s._id === id);
    if (snr) {
      setRecipientPhone(snr.emergencyContactPhone || snr.phone || "+91 98765 00003");
    }
  };

  const toggleChannel = (key) => {
    setChannels((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.doctorName.trim() || !formData.appointmentDate) {
      showToast("Doctor Name and Date are required", "warning");
      return;
    }

    const activeChannels = Object.keys(channels).filter((k) => channels[k]);
    if (activeChannels.length === 0) {
      showToast(lang === "ta" ? "குறைந்தது ஒரு அறிவிப்பு வழியை தேர்ந்தெடுக்கவும்" : "Select at least one notification channel", "warning");
      return;
    }
    if (!recipientPhone.trim()) {
      showToast(lang === "ta" ? "மொபைல் எண் உள்ளிடவும்" : "Please enter recipient phone number", "warning");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        recipientPhone: recipientPhone.trim(),
        recipientEmail: recipientEmail.trim(),
        channels: activeChannels
      };

      const res = await api.post("/appointments", payload);
      const selectedSenior = seniors.find((s) => s._id === formData.seniorId);
      const seniorName = selectedSenior?.name || "Senior Resident";

      setAppointmentSuccessData({
        appointment: res.data.appointment,
        seniorName,
        doctorName: formData.doctorName,
        department: formData.department,
        hospital: formData.hospital,
        appointmentDate: formData.appointmentDate,
        timeSlot: formData.timeSlot,
        phone: recipientPhone.trim(),
        email: recipientEmail.trim(),
        channels: activeChannels
      });

      showToast(
        lang === "ta"
          ? `✓ மருத்துவ சந்திப்பு வெற்றிகரமாக திட்டமிடப்பட்டது (${res.data.appointment.appointmentCode})`
          : `✓ Appointment scheduled successfully (${res.data.appointment.appointmentCode})`,
        "success"
      );

      if (onAppointmentCreated) onAppointmentCreated(res.data.appointment);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to schedule appointment", "error");
    } finally {
      setLoading(false);
    }
  };

  // Generate Direct Action Links
  const getWhatsAppLink = (data) => {
    const cleanPhone = (data.phone || "919876500003").replace(/[^0-9]/g, "");
    const msg = encodeURIComponent(
      `🏥 *SeniorCare Appointment Confirmation*\n\n` +
      `Booking ID: *${data.appointment?.appointmentCode || "APT"}*\n` +
      `Resident: *${data.seniorName}*\n` +
      `Doctor: *${data.doctorName}* (${data.department})\n` +
      `Hospital / Clinic: *${data.hospital}*\n` +
      `Date & Slot: *${data.appointmentDate} at ${data.timeSlot}*\n` +
      `Status: *Confirmed*\n\n` +
      `_SeniorCare Geriatric Health Network_`
    );
    return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${msg}`;
  };

  const getSmsLink = (data) => {
    const cleanPhone = (data.phone || "+919876500003").replace(/[^0-9+]/g, "");
    const body = encodeURIComponent(
      `SeniorCare Alert: Appointment ${data.appointment?.appointmentCode || "APT"} confirmed for ${data.seniorName} with ${data.doctorName} on ${data.appointmentDate} at ${data.timeSlot} at ${data.hospital}.`
    );
    return `sms:${cleanPhone}?body=${body}`;
  };

  const getEmailLink = (data) => {
    const subject = encodeURIComponent(`SeniorCare Appointment Confirmation: ${data.doctorName} - ${data.seniorName}`);
    const body = encodeURIComponent(
      `Hello,\n\nYour appointment has been confirmed.\n\nBooking ID: ${data.appointment?.appointmentCode || "APT"}\nResident: ${data.seniorName}\nDoctor: ${data.doctorName} (${data.department})\nFacility: ${data.hospital}\nSchedule: ${data.appointmentDate} at ${data.timeSlot}\n\nPlease arrive 10 minutes prior.\n\nBest regards,\nSeniorCare Medical Services`
    );
    return `mailto:${data.email || "family@seniorcare.local"}?subject=${subject}&body=${body}`;
  };

  const copyDetailsToClipboard = (data) => {
    const text = 
      `SeniorCare Appointment Confirmation\n` +
      `Booking ID: ${data.appointment?.appointmentCode || "APT"}\n` +
      `Resident: ${data.seniorName}\n` +
      `Doctor: ${data.doctorName} (${data.department})\n` +
      `Hospital / Clinic: ${data.hospital}\n` +
      `Date & Slot: ${data.appointmentDate} at ${data.timeSlot}\n` +
      `Recipient Mobile: ${data.phone}\n` +
      `Recipient Email: ${data.email}\n` +
      `Status: Confirmed`;
    navigator.clipboard.writeText(text).then(() => {
      showToast(lang === "ta" ? "விவரங்கள் நகலெடுக்கப்பட்டது! (Copied to clipboard)" : "Copied details to clipboard!", "success");
    }).catch(() => {
      showToast("Copied details!", "info");
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1000 }}>
      <div 
        className="modal-dialog" 
        onClick={(e) => e.stopPropagation()} 
        style={{ 
          maxWidth: 560,
          background: "var(--bg-surface, #ffffff)",
          color: "var(--text-main, #0f172a)",
          border: "1px solid var(--border-color, #e2e8f0)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.45)",
          borderRadius: "16px",
          padding: "1.75rem"
        }}
      >
        <div className="modal-header">
          <div className="modal-title-with-icon">
            <Calendar size={22} className="text-primary" />
            <h3>{t.scheduleAppointment}</h3>
          </div>
          <button className="modal-close-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {appointmentSuccessData ? (
          /* SUCCESS & MULTI-CHANNEL DISPATCH ACTIONS CARD */
          <div style={{ padding: "0.5rem 0", display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ textAlign: "center", background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "14px", padding: "1.25rem" }}>
              <CheckCircle2 size={44} className="text-success" style={{ margin: "0 auto 0.5rem" }} />
              <h3 style={{ margin: "0 0 0.25rem", color: "#065f46", fontSize: "1.25rem" }}>
                {lang === "ta" ? "மருத்துவ சந்திப்பு உறுதி செய்யப்பட்டது!" : "Appointment Scheduled & Dispatched!"}
              </h3>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "#047857" }}>
                Token: <strong>{appointmentSuccessData.appointment?.appointmentCode || "APT"}</strong> · Resident: <strong>{appointmentSuccessData.seniorName}</strong>
              </p>
              <div style={{ fontSize: "0.82rem", marginTop: "0.4rem", color: "var(--muted)" }}>
                👨‍⚕️ {appointmentSuccessData.doctorName} ({appointmentSuccessData.department}) · 📅 {appointmentSuccessData.appointmentDate} ({appointmentSuccessData.timeSlot})
              </div>
            </div>

            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "14px", padding: "1rem" }}>
              <strong style={{ fontSize: "0.88rem", display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.75rem", color: "var(--text-main)" }}>
                <span>📲</span>
                <span>{lang === "ta" ? "நேரடி அறிவிப்பு வழிகள் (Direct Action Links):" : "Direct Multi-Channel Dispatch:"}</span>
              </strong>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                {/* WhatsApp Button */}
                {appointmentSuccessData.channels.includes("whatsapp") && (
                  <a 
                    href={getWhatsAppLink(appointmentSuccessData)}
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "space-between", 
                      padding: "0.75rem 1rem", 
                      borderRadius: "10px", 
                      background: "#25D366", 
                      color: "#fff", 
                      fontWeight: "700", 
                      fontSize: "0.9rem",
                      textDecoration: "none",
                      cursor: "pointer" 
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span>💬</span>
                      <span>{lang === "ta" ? "WhatsApp மூலம் அனுப்புக / Open WhatsApp" : "Send Confirmation via WhatsApp"}</span>
                    </span>
                    <span style={{ fontSize: "0.78rem", background: "rgba(0,0,0,0.18)", padding: "0.2rem 0.6rem", borderRadius: "12px" }}>
                      {appointmentSuccessData.phone} ↗
                    </span>
                  </a>
                )}

                {/* SMS Button */}
                {appointmentSuccessData.channels.includes("sms") && (
                  <a 
                    href={getSmsLink(appointmentSuccessData)}
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "space-between", 
                      padding: "0.75rem 1rem", 
                      borderRadius: "10px", 
                      background: "#2563eb", 
                      color: "#fff", 
                      fontWeight: "700", 
                      fontSize: "0.9rem",
                      textDecoration: "none",
                      cursor: "pointer" 
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span>📱</span>
                      <span>{lang === "ta" ? "SMS மூலம் அனுப்புக / Open SMS" : "Send SMS Alert"}</span>
                    </span>
                    <span style={{ fontSize: "0.78rem", background: "rgba(0,0,0,0.18)", padding: "0.2rem 0.6rem", borderRadius: "12px" }}>
                      {appointmentSuccessData.phone} ↗
                    </span>
                  </a>
                )}

                {/* Email Button */}
                {appointmentSuccessData.channels.includes("email") && (
                  <a 
                    href={getEmailLink(appointmentSuccessData)}
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "space-between", 
                      padding: "0.75rem 1rem", 
                      borderRadius: "10px", 
                      background: "#ea580c", 
                      color: "#fff", 
                      fontWeight: "700", 
                      fontSize: "0.9rem",
                      textDecoration: "none",
                      cursor: "pointer" 
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span>📧</span>
                      <span>{lang === "ta" ? "Google Mail மூலம் அனுப்புக / Send Email" : "Send Email Confirmation"}</span>
                    </span>
                    <span style={{ fontSize: "0.78rem", background: "rgba(0,0,0,0.18)", padding: "0.2rem 0.6rem", borderRadius: "12px" }}>
                      {appointmentSuccessData.email} ↗
                    </span>
                  </a>
                )}

                {/* Copy to Clipboard fallback */}
                <button
                  type="button"
                  onClick={() => copyDetailsToClipboard(appointmentSuccessData)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                    padding: "0.65rem 1rem",
                    borderRadius: "10px",
                    background: "var(--surface-variant, rgba(0,0,0,0.04))",
                    border: "1px solid var(--border-color, #cbd5e1)",
                    color: "var(--text-main, #334155)",
                    fontWeight: "600",
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    marginTop: "0.3rem"
                  }}
                >
                  <Copy size={15} />
                  <span>{lang === "ta" ? "📋 விவரங்களை நகலெடு (Copy Message & Details)" : "📋 Copy Confirmation Details to Clipboard"}</span>
                </button>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.5rem" }}>
              <button 
                type="button" 
                className="btn-primary" 
                onClick={onClose}
                style={{ padding: "0.6rem 1.5rem", borderRadius: "10px" }}
              >
                {lang === "ta" ? "✓ முடிந்தது (Done)" : "✓ Done / Close"}
              </button>
            </div>
          </div>
        ) : (
          /* APPOINTMENT FORM */
          <form onSubmit={handleSubmit} className="modal-form">
            <div className="form-group">
              <label>{t.seniors}</label>
              <select
                value={formData.seniorId}
                onChange={(e) => handleSeniorChange(e.target.value)}
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
                  min={new Date().toISOString().split("T")[0]}
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

            {/* Recipient Phone and Email Inputs */}
            <div style={{ background: "rgba(37,99,235,0.04)", border: "1px solid rgba(37,99,235,0.18)", padding: "0.85rem 1rem", borderRadius: "12px", margin: "0.85rem 0" }}>
              <strong style={{ fontSize: "0.88rem", display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--primary)", marginBottom: "0.6rem" }}>
                <Phone size={15} />
                <span>{lang === "ta" ? "தொடர்பு எண்கள் & அறிவிப்பு முகவரி (WhatsApp / SMS / Email):" : "Recipient Contact for Live Updates (WhatsApp / SMS / Email):"}</span>
              </strong>

              <div className="form-row-2">
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: "0.8rem", fontWeight: "600" }}>
                    📱 {lang === "ta" ? "மொபைல் எண் (WhatsApp & SMS) *" : "Mobile Number (WhatsApp & SMS) *"}
                  </label>
                  <input 
                    type="tel"
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    placeholder="+91 98765 00003"
                    required
                    style={{ fontSize: "0.88rem" }}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: "0.8rem", fontWeight: "600" }}>
                    📧 {lang === "ta" ? "மின்னஞ்சல் முகவரி (Google Mail) *" : "Email Address (Google Mail) *"}
                  </label>
                  <input 
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="family@seniorcare.local"
                    required
                    style={{ fontSize: "0.88rem" }}
                  />
                </div>
              </div>
            </div>

            {/* Notification Channels Options - Prompted to User */}
            <div className="form-group" style={{ marginTop: "0.5rem" }}>
              <label style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span>{lang === "ta" ? "தகவல் அனுப்பப்பட வேண்டிய வழிகள்:" : "Send Updates & Booking Slip via:"}</span>
              </label>
              <div className="notification-channels-selector" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.6rem", marginTop: "0.3rem" }}>
                <label className={`channel-toggle-chip ${channels.whatsapp ? "active" : ""}`} onClick={() => toggleChannel("whatsapp")}>
                  <input type="checkbox" checked={channels.whatsapp} onChange={() => {}} style={{ display: "none" }} />
                  <span className="channel-icon">💬</span>
                  <span className="channel-title">WhatsApp</span>
                  {channels.whatsapp && <span className="channel-check">✓</span>}
                </label>

                <label className={`channel-toggle-chip ${channels.sms ? "active" : ""}`} onClick={() => toggleChannel("sms")}>
                  <input type="checkbox" checked={channels.sms} onChange={() => {}} style={{ display: "none" }} />
                  <span className="channel-icon">📱</span>
                  <span className="channel-title">SMS</span>
                  {channels.sms && <span className="channel-check">✓</span>}
                </label>

                <label className={`channel-toggle-chip ${channels.email ? "active" : ""}`} onClick={() => toggleChannel("email")}>
                  <input type="checkbox" checked={channels.email} onChange={() => {}} style={{ display: "none" }} />
                  <span className="channel-icon">📧</span>
                  <span className="channel-title">Email</span>
                  {channels.email && <span className="channel-check">✓</span>}
                </label>
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

            <div className="modal-actions-row" style={{ marginTop: "1.25rem" }}>
              <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
                {t.cancel}
              </button>
              <button type="submit" className="btn-primary" disabled={loading}>
                <Calendar size={18} />
                <span>{loading ? t.loading : t.scheduleAppointment}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
