import React, { useState, useEffect } from "react";
import { ShieldCheck, CheckCircle2, Clock, AlertTriangle, Smile, Meh, Frown, Filter, Search } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { useToast } from "../context/ToastContext";
import api from "../api";

export default function SafetyView({ onOpenCheckinModal }) {
  const { user, t, lang } = useAuth();
  const { liveEventSignal } = useSocket();
  const { showToast } = useToast();

  const [checkins, setCheckins] = useState([]);
  const [summary, setSummary] = useState({ totalSeniors: 0, checkedInToday: 0, missedToday: 0 });
  const [filterMood, setFilterMood] = useState("all");
  const [loading, setLoading] = useState(true);

  const loadSafetyData = async () => {
    try {
      const [checkinsRes, summaryRes] = await Promise.all([
        api.get("/checkins"),
        api.get("/checkins/today-summary")
      ]);
      setCheckins(checkinsRes.data.checkins || []);
      setSummary(summaryRes.data || { totalSeniors: 0, checkedInToday: 0, missedToday: 0 });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSafetyData();
  }, [liveEventSignal]);

  const filtered = checkins.filter((c) => {
    if (filterMood === "all") return true;
    return c.mood === filterMood;
  });

  return (
    <div className="view-page-container">
      {/* Header */}
      <div className="view-header-bar">
        <div>
          <h2>{t.safety}</h2>
          <p>{lang === "ta" ? "தினசரி பாதுகாப்பு உறுதிப்படுத்தல் மற்றும் நலம் கண்காணிப்பு" : "Daily wellness monitoring and 'I AM SAFE' compliance logs"}</p>
        </div>

        <button className="btn-success-large" onClick={onOpenCheckinModal}>
          <CheckCircle2 size={22} />
          <span>{t.iAmSafe}</span>
        </button>
      </div>

      {/* Compliance Stats Cards */}
      <div className="safety-compliance-strip">
        <div className="compliance-card safe">
          <div className="comp-card-top">
            <span className="comp-icon"><CheckCircle2 size={24} /></span>
            <span className="comp-pct">
              {summary.totalSeniors > 0 ? Math.round((summary.checkedInToday / summary.totalSeniors) * 100) : 100}%
            </span>
          </div>
          <strong className="comp-value">{summary.checkedInToday}</strong>
          <span className="comp-label">{lang === "ta" ? "இன்று பாதுகாப்பு உறுதி செய்தவர்கள்" : "Checked-in Today"}</span>
        </div>

        <div className="compliance-card missed">
          <div className="comp-card-top">
            <span className="comp-icon"><Clock size={24} /></span>
          </div>
          <strong className="comp-value text-warning">{summary.missedToday}</strong>
          <span className="comp-label">{lang === "ta" ? "இன்று விடுபட்டவர்கள்" : "Pending Check-ins Today"}</span>
        </div>

        <div className="compliance-card total">
          <div className="comp-card-top">
            <span className="comp-icon"><ShieldCheck size={24} /></span>
          </div>
          <strong className="comp-value">{summary.totalSeniors}</strong>
          <span className="comp-label">{t.totalSeniors}</span>
        </div>
      </div>

      {/* History Log Table */}
      <div className="safety-table-card">
        <div className="panel-box-header">
          <div>
            <h3>{t.checkinHistory}</h3>
            <small>{lang === "ta" ? "நேரலை பாதுகாப்பு பதிவுகள் பட்டியல்" : "Live check-in feed and health moods"}</small>
          </div>

          <div className="filter-pills-row">
            <button
              className={`filter-pill ${filterMood === "all" ? "active" : ""}`}
              onClick={() => setFilterMood("all")}
            >
              {lang === "ta" ? "அனைத்தும்" : "All"} ({checkins.length})
            </button>
            <button
              className={`filter-pill ${filterMood === "good" ? "active" : ""}`}
              onClick={() => setFilterMood("good")}
            >
              😊 {t.good}
            </button>
            <button
              className={`filter-pill ${filterMood === "okay" ? "active" : ""}`}
              onClick={() => setFilterMood("okay")}
            >
              😐 {t.okay}
            </button>
            <button
              className={`filter-pill ${filterMood === "tired" ? "active" : ""}`}
              onClick={() => setFilterMood("tired")}
            >
              🥱 {t.tired}
            </button>
          </div>
        </div>

        <div className="responsive-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t.seniors}</th>
                <th>{t.status}</th>
                <th>{t.mood}</th>
                <th>{lang === "ta" ? "பதிவு முறை" : "Method"}</th>
                <th>{lang === "ta" ? "நேரம்" : "Timestamp"}</th>
                <th>{t.notes}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-4">{t.noData}</td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c._id}>
                    <td><strong>{c.seniorName}</strong></td>
                    <td>
                      <span className="status-pill status-safe">
                        ✓ {c.status.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <span className="mood-badge-tag">
                        {c.mood === "good" ? "😊 " + t.good : c.mood === "okay" ? "😐 " + t.okay : "🥱 " + t.tired}
                      </span>
                    </td>
                    <td><span className="method-tag">{c.method || "self"}</span></td>
                    <td>{new Date(c.timestamp).toLocaleString()}</td>
                    <td>{c.notes}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
