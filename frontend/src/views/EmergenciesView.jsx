import React, { useState, useEffect } from "react";
import { 
  ShieldAlert, AlertOctagon, CheckCircle2, PhoneCall, 
  ArrowUpRight, Clock, MapPin, User, ChevronRight, Check 
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { useToast } from "../context/ToastContext";
import api from "../api";

export default function EmergenciesView({ onOpenEmergencyModal }) {
  const { user, t, lang } = useAuth();
  const { liveEventSignal } = useSocket();
  const { showToast } = useToast();

  const [emergencies, setEmergencies] = useState([]);
  const [selectedEmergency, setSelectedEmergency] = useState(null);
  const [actionNote, setActionNote] = useState("");
  const [loading, setLoading] = useState(true);

  const loadEmergencies = async () => {
    try {
      const res = await api.get("/emergencies");
      setEmergencies(res.data.emergencies || []);
      if (!selectedEmergency && res.data.emergencies?.length > 0) {
        setSelectedEmergency(res.data.emergencies[0]);
      } else if (selectedEmergency) {
        const updated = res.data.emergencies?.find((e) => e._id === selectedEmergency._id);
        if (updated) setSelectedEmergency(updated);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmergencies();
  }, [liveEventSignal]);

  const handleUpdateStatus = async (status) => {
    if (!selectedEmergency) return;
    try {
      const res = await api.patch(`/emergencies/${selectedEmergency._id}/status`, {
        status,
        note: actionNote || `Status transitioned to ${status}`
      });
      showToast(lang === "ta" ? `அவசர நிலை மாற்றப்பட்டது: ${status}` : `Emergency status updated to ${status}`, "success");
      setActionNote("");
      loadEmergencies();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update status", "error");
    }
  };

  const activeEmergencies = emergencies.filter((e) => e.status !== "resolved");
  const resolvedEmergencies = emergencies.filter((e) => e.status === "resolved");

  return (
    <div className="view-page-container">
      {/* Header */}
      <div className="view-header-bar">
        <div>
          <h2>{t.emergency}</h2>
          <p>{lang === "ta" ? "24/7 நேரலை அவசர எச்சரிக்கைகள் மற்றும் மீட்பு மேலாண்மை" : "Active incident response, escalation, and resolution audit"}</p>
        </div>

        <button className="btn-emergency-danger" onClick={onOpenEmergencyModal}>
          <ShieldAlert size={22} />
          <span>{t.triggerEmergency}</span>
        </button>
      </div>

      <div className="emergencies-two-col-layout">
        {/* Left: Emergencies List */}
        <div className="emergencies-list-pane">
          <div className="emergencies-list-section">
            <h3 className="section-sub-title text-danger">
              <span className="live-dot" /> {lang === "ta" ? "செயலில் உள்ள அவசரங்கள்" : "Active Incident Queue"} ({activeEmergencies.length})
            </h3>
            {activeEmergencies.length === 0 ? (
              <div className="empty-panel-state">
                <CheckCircle2 size={32} className="text-success" />
                <p>{lang === "ta" ? "செயலில் உள்ள அவசர எச்சரிக்கைகள் எதுவும் இல்லை! அனைத்தும் பாதுகாப்பானது." : "No active emergency alerts. All senior residents are safe."}</p>
              </div>
            ) : (
              activeEmergencies.map((em) => (
                <div
                  key={em._id}
                  className={`emergency-ticket-item ${selectedEmergency?._id === em._id ? "selected" : ""} active-border`}
                  onClick={() => setSelectedEmergency(em)}
                >
                  <div className="ticket-top-row">
                    <span className="ticket-code">{em.emergencyCode}</span>
                    <span className={`status-pill status-${em.status}`}>{em.status.toUpperCase()}</span>
                  </div>
                  <strong>{em.seniorName}</strong>
                  <p className="ticket-loc"><MapPin size={13} /> {em.location || "Room"}</p>
                  <small className="ticket-time"><Clock size={12} /> {new Date(em.createdAt).toLocaleString()}</small>
                </div>
              ))
            )}
          </div>

          <div className="emergencies-list-section" style={{ marginTop: 24 }}>
            <h3 className="section-sub-title">
              {lang === "ta" ? "தீர்க்கப்பட்ட சம்பவங்கள்" : "Resolved Incidents History"} ({resolvedEmergencies.length})
            </h3>
            {resolvedEmergencies.map((em) => (
              <div
                key={em._id}
                className={`emergency-ticket-item ${selectedEmergency?._id === em._id ? "selected" : ""}`}
                onClick={() => setSelectedEmergency(em)}
              >
                <div className="ticket-top-row">
                  <span className="ticket-code">{em.emergencyCode}</span>
                  <span className="status-pill status-safe">RESOLVED</span>
                </div>
                <strong>{em.seniorName}</strong>
                <small className="ticket-time">{new Date(em.createdAt).toLocaleDateString()}</small>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Detailed Emergency Status Card & Actions */}
        <div className="emergency-detail-pane">
          {selectedEmergency ? (
            <div className="emergency-status-card">
              <div className="em-card-banner-header">
                <div>
                  <span className="em-status-pill">{selectedEmergency.status.toUpperCase()}</span>
                  <h2>{selectedEmergency.emergencyCode} — {selectedEmergency.seniorName}</h2>
                </div>
                <div className="em-time-badge">
                  <Clock size={16} />
                  <span>{new Date(selectedEmergency.createdAt).toLocaleTimeString()}</span>
                </div>
              </div>

              <div className="em-detail-grid">
                <div className="em-stat-box">
                  <small>{t.location}</small>
                  <strong>{selectedEmergency.location || "Resident Room"}</strong>
                </div>
                <div className="em-stat-box">
                  <small>{t.severity}</small>
                  <strong className="text-danger">{selectedEmergency.severity.toUpperCase()}</strong>
                </div>
                <div className="em-stat-box">
                  <small>{lang === "ta" ? "ஏற்றுக்கொண்டவர்" : "Acknowledged By"}</small>
                  <strong>{selectedEmergency.acknowledgedBy || "Pending"}</strong>
                </div>
                <div className="em-stat-box">
                  <small>{lang === "ta" ? "தீர்த்தவர்" : "Resolved By"}</small>
                  <strong>{selectedEmergency.resolvedBy || "Pending"}</strong>
                </div>
              </div>

              <div className="em-notes-full">
                <strong>{t.notes}:</strong>
                <p>{selectedEmergency.notes}</p>
              </div>

              {/* Action Buttons for Caregiver / Staff / Admin */}
              {selectedEmergency.status !== "resolved" && (
                <div className="em-action-controls">
                  <h4>{lang === "ta" ? "அவசர மேலாண்மை செயல்கள்" : "Emergency Response Actions"}</h4>
                  <div className="em-buttons-row">
                    <a href="tel:+919876500004" className="btn-action call">
                      <PhoneCall size={18} />
                      <span>{t.callCaregiver}</span>
                    </a>

                    {selectedEmergency.status === "active" && (
                      <button className="btn-action ack" onClick={() => handleUpdateStatus("acknowledged")}>
                        <Check size={18} />
                        <span>{t.acknowledge}</span>
                      </button>
                    )}

                    {selectedEmergency.status !== "escalated" && (
                      <button className="btn-action escalate" onClick={() => handleUpdateStatus("escalated")}>
                        <AlertOctagon size={18} />
                        <span>{t.escalate}</span>
                      </button>
                    )}

                    <button className="btn-action resolve" onClick={() => handleUpdateStatus("resolved")}>
                      <CheckCircle2 size={18} />
                      <span>{t.resolve}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Incident Response Audit Timeline */}
              <div className="em-audit-timeline">
                <h4>{lang === "ta" ? "நடவடிக்கை வரலாறு" : "Actions Taken Timeline"}</h4>
                <div className="timeline-items-list">
                  {selectedEmergency.actionsTaken?.map((act, idx) => (
                    <div key={idx} className="timeline-item">
                      <div className="timeline-dot" />
                      <div className="timeline-info">
                        <strong>{act.note}</strong>
                        <small>{act.by} · {new Date(act.actionTime).toLocaleTimeString()}</small>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-panel-state">{t.noData}</div>
          )}
        </div>
      </div>
    </div>
  );
}
