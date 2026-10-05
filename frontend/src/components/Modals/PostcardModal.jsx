import React from "react";
import { 
  X, Phone, Mail, MapPin, Calendar, Clock, AlertTriangle, 
  ShieldCheck, Heart, User, Sparkles, ExternalLink, CheckCircle2 
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function PostcardModal({ isOpen, onClose, data, type = "senior", onAction }) {
  const { lang, t } = useAuth();

  if (!isOpen || !data) return null;

  const renderBadge = () => {
    switch (type) {
      case "senior":
        return <span className="postcard-badge senior">👵 {lang === "ta" ? "மூத்த குடிமகன் அட்டை" : "Senior Care Card"}</span>;
      case "emergency":
        return <span className="postcard-badge emergency">🚨 {lang === "ta" ? "அவசர எச்சரிக்கை அட்டை" : "Emergency Alert Card"}</span>;
      case "appointment":
        return <span className="postcard-badge appointment">📅 {lang === "ta" ? "மருத்துவ சந்திப்பு அட்டை" : "Appointment Card"}</span>;
      case "checkin":
        return <span className="postcard-badge checkin">✓ {lang === "ta" ? "பாதுகாப்பு அட்டை" : "Safety Check-in Card"}</span>;
      case "assistance":
        return <span className="postcard-badge assistance">🤝 {lang === "ta" ? "உதவி கோரிக்கை அட்டை" : "Assistance Card"}</span>;
      case "fee":
        return <span className="postcard-badge fee">💳 {lang === "ta" ? "கட்டண அட்டை" : "Care Fee Card"}</span>;
      default:
        return <span className="postcard-badge default">📋 {t.postcardTitle}</span>;
    }
  };

  return (
    <div className="modal-backdrop-overlay" onClick={onClose}>
      <div className="postcard-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Airmail / Postcard Top Strip */}
        <div className="postcard-airmail-strip" />

        {/* Close Button */}
        <button className="postcard-close-btn" onClick={onClose} aria-label="Close Postcard">
          <X size={20} />
        </button>

        <div className="postcard-inner-body">
          {/* Postcard Header with Stamp */}
          <div className="postcard-top-row">
            <div className="postcard-header-meta">
              {renderBadge()}
              <h2 className="postcard-title">{data.title || data.name || data.seniorName || "SeniorCare Record"}</h2>
              <p className="postcard-subtitle">{data.subtitle || data.roomNumber || data.department || data.location || ""}</p>
            </div>

            {/* Vintage Postcard Stamp */}
            <div className="postcard-stamp-box">
              <div className="stamp-inner">
                <span className="stamp-icon">📮</span>
                <span className="stamp-text">SC AIRMAIL</span>
                <span className="stamp-postmark">{new Date().toLocaleDateString(lang === "ta" ? "ta-IN" : "en-IN")}</span>
              </div>
            </div>
          </div>

          <div className="postcard-divider-line" />

          {/* Postcard 2-Column Content */}
          <div className="postcard-grid">
            {/* Left Side: Attributes / Details Rows */}
            <div className="postcard-left-col">
              <h4 className="postcard-col-title">{lang === "ta" ? "முக்கிய விபரங்கள்" : "Primary Details"}</h4>
              
              <div className="postcard-details-list">
                {data.phone && (
                  <div className="postcard-row">
                    <span className="row-icon"><Phone size={16} /></span>
                    <span className="row-label">{lang === "ta" ? "தொலைபேசி" : "Phone"}:</span>
                    <span className="row-val"><a href={`tel:${data.phone}`}>{data.phone}</a></span>
                  </div>
                )}

                {data.address && (
                  <div className="postcard-row">
                    <span className="row-icon"><MapPin size={16} /></span>
                    <span className="row-label">{lang === "ta" ? "முகவரி" : "Address"}:</span>
                    <span className="row-val">{data.address}</span>
                  </div>
                )}

                {data.status && (
                  <div className="postcard-row">
                    <span className="row-icon"><CheckCircle2 size={16} /></span>
                    <span className="row-label">{lang === "ta" ? "நிலை" : "Status"}:</span>
                    <span className={`row-badge status-${data.status.toLowerCase()}`}>{data.status}</span>
                  </div>
                )}

                {data.age && (
                  <div className="postcard-row">
                    <span className="row-icon"><User size={16} /></span>
                    <span className="row-label">{lang === "ta" ? "வயது / பாலினம்" : "Age / Gender"}:</span>
                    <span className="row-val">{data.age} {lang === "ta" ? "வயது" : "yrs"} · {data.gender || "N/A"}</span>
                  </div>
                )}

                {data.doctorName && (
                  <div className="postcard-row">
                    <span className="row-icon"><Heart size={16} /></span>
                    <span className="row-label">{lang === "ta" ? "மருத்துவர்" : "Doctor"}:</span>
                    <span className="row-val">{data.doctorName} ({data.hospital})</span>
                  </div>
                )}

                {data.appointmentDate && (
                  <div className="postcard-row">
                    <span className="row-icon"><Calendar size={16} /></span>
                    <span className="row-label">{lang === "ta" ? "தேதி & நேரம்" : "Date & Time"}:</span>
                    <span className="row-val">{new Date(data.appointmentDate).toLocaleDateString()} at {data.timeSlot}</span>
                  </div>
                )}

                {data.amount !== undefined && (
                  <div className="postcard-row">
                    <span className="row-icon"><Sparkles size={16} /></span>
                    <span className="row-label">{lang === "ta" ? "கட்டணத் தொகை" : "Amount"}:</span>
                    <span className="row-val font-bold">₹{Number(data.amount).toLocaleString()} (Due: ₹{Number(data.remainingAmount || 0).toLocaleString()})</span>
                  </div>
                )}

                {data.caregiverName && (
                  <div className="postcard-row">
                    <span className="row-icon"><Heart size={16} /></span>
                    <span className="row-label">{lang === "ta" ? "பராமரிப்பாளர்" : "Caregiver"}:</span>
                    <span className="row-val">{data.caregiverName}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right Side: Notes, Message & Action Buttons */}
            <div className="postcard-right-col">
              <h4 className="postcard-col-title">{lang === "ta" ? "குறிப்புகள் & நடவடிக்கைகள்" : "Notes & Quick Actions"}</h4>
              
              <div className="postcard-notes-box">
                <p>
                  {data.notes || data.message || data.description || (lang === "ta" 
                    ? "இந்த பதிவிற்கான மேலதிக தகவல்கள் அனைத்தும் கணினியில் பத்திரமாக சேமிக்கப்பட்டுள்ளன." 
                    : "Active care record monitored under the SeniorCare real-time management system.")}
                </p>
              </div>

              <div className="postcard-actions-wrapper">
                {onAction && (
                  <button 
                    className="btn-postcard-action primary"
                    onClick={() => {
                      onAction(data);
                      onClose();
                    }}
                  >
                    <ExternalLink size={16} />
                    <span>{t.openRecord || "View Full Record"}</span>
                  </button>
                )}

                {data.phone && (
                  <a href={`tel:${data.phone}`} className="btn-postcard-action call">
                    <Phone size={16} />
                    <span>{lang === "ta" ? "நேரடியாக அழைக்கவும்" : "Call Contact"}</span>
                  </a>
                )}

                <button className="btn-postcard-action close" onClick={onClose}>
                  <span>{t.cancel || "Close"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
