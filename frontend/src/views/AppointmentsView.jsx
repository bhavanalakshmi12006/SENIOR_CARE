import React, { useState, useEffect } from "react";
import { Calendar, Plus, CheckCircle, Clock, Hospital, User, Trash2, Check } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { useToast } from "../context/ToastContext";
import api from "../api";
import AppointmentModal from "../components/Modals/AppointmentModal";
import ConfirmModal from "../components/Modals/ConfirmModal";

export default function AppointmentsView({ onOpenAppointmentModal }) {
  const { user, t, lang } = useAuth();
  const { liveEventSignal } = useSocket();
  const { showToast } = useToast();

  const [appointments, setAppointments] = useState([]);
  const [filter, setFilter] = useState("all");
  const [cancellingApt, setCancellingApt] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadAppointments = async () => {
    try {
      const res = await api.get("/appointments");
      setAppointments(res.data.appointments || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, [liveEventSignal]);

  const handleMarkCompleted = async (id) => {
    try {
      await api.patch(`/appointments/${id}`, { status: "Completed" });
      showToast(lang === "ta" ? "சந்திப்பு முடிவடைந்தது என குறிக்கப்பட்டது" : "Appointment marked as completed", "success");
      loadAppointments();
    } catch (err) {
      showToast("Failed to update status", "error");
    }
  };

  const handleCancelAppointment = async () => {
    if (!cancellingApt) return;
    try {
      await api.patch(`/appointments/${cancellingApt._id}`, { status: "Cancelled" });
      showToast(lang === "ta" ? "சந்திப்பு ரத்து செய்யப்பட்டது" : "Appointment cancelled", "info");
      setCancellingApt(null);
      loadAppointments();
    } catch (err) {
      showToast("Failed to cancel appointment", "error");
    }
  };

  const filtered = appointments.filter((a) => {
    if (filter === "all") return true;
    return a.status.toLowerCase() === filter.toLowerCase();
  });

  return (
    <div className="view-page-container">
      <div className="view-header-bar">
        <div>
          <h2>{t.appointments}</h2>
          <p>{lang === "ta" ? "மூத்த குடிமக்களின் மருத்துவ பரிசோதனைகள் மற்றும் சந்திப்புகள்" : "Scheduled consultations, hospital visits, and reminders"}</p>
        </div>

        <button className="btn-primary" onClick={onOpenAppointmentModal}>
          <Plus size={18} />
          <span>{t.scheduleAppointment}</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="view-filter-bar">
        <div className="filter-pills-row">
          <button
            className={`filter-pill ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            {lang === "ta" ? "அனைத்தும்" : "All"} ({appointments.length})
          </button>
          <button
            className={`filter-pill ${filter === "upcoming" ? "active" : ""}`}
            onClick={() => setFilter("upcoming")}
          >
            📅 {t.upcoming} ({appointments.filter((a) => a.status === "Upcoming").length})
          </button>
          <button
            className={`filter-pill ${filter === "completed" ? "active" : ""}`}
            onClick={() => setFilter("completed")}
          >
            ✓ {t.completed} ({appointments.filter((a) => a.status === "Completed").length})
          </button>
          <button
            className={`filter-pill ${filter === "cancelled" ? "active" : ""}`}
            onClick={() => setFilter("cancelled")}
          >
            ✕ {t.cancelled} ({appointments.filter((a) => a.status === "Cancelled").length})
          </button>
        </div>
      </div>

      {/* Appointments Cards Grid */}
      <div className="appointments-cards-grid">
        {filtered.length === 0 ? (
          <div className="empty-panel-state col-span-full">{t.noData}</div>
        ) : (
          filtered.map((apt) => (
            <div key={apt._id} className="appointment-card-item">
              <div className="apt-card-top-row">
                <span className="apt-code-tag">{apt.appointmentCode}</span>
                <span className={`status-pill status-${apt.status.toLowerCase()}`}>
                  {apt.status}
                </span>
              </div>

              <div className="apt-card-body">
                <strong className="apt-senior-name">{apt.seniorName}</strong>
                <h4 className="apt-doctor-name">{apt.doctorName}</h4>
                <p className="apt-dept-line">
                  <Hospital size={14} />
                  <span>{apt.department} · {apt.hospital}</span>
                </p>
                <div className="apt-datetime-badge">
                  <Calendar size={14} />
                  <span>{new Date(apt.appointmentDate).toLocaleDateString()} at {apt.timeSlot}</span>
                </div>
                {apt.notes && <p className="apt-notes-text">📝 {apt.notes}</p>}
              </div>

              <div className="apt-card-footer">
                {apt.status === "Upcoming" && (
                  <>
                    <button
                      className="btn-complete-apt"
                      onClick={() => handleMarkCompleted(apt._id)}
                      title="Mark Completed"
                    >
                      <Check size={16} />
                      <span>{t.completed}</span>
                    </button>
                    <button
                      className="btn-cancel-apt"
                      onClick={() => setCancellingApt(apt)}
                      title="Cancel"
                    >
                      <Trash2 size={16} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Cancel Confirmation Modal */}
      {cancellingApt && (
        <ConfirmModal
          isOpen={!!cancellingApt}
          title={lang === "ta" ? "சந்திப்பை ரத்து செய்யவா?" : "Cancel Appointment?"}
          message={`Are you sure you want to cancel appointment ${cancellingApt.appointmentCode} with ${cancellingApt.doctorName}?`}
          onClose={() => setCancellingApt(null)}
          onConfirm={handleCancelAppointment}
        />
      )}
    </div>
  );
}
