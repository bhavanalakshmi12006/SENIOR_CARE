import React, { useState, useEffect } from "react";
import { 
  Users, AlertCircle, ShieldCheck, Calendar, HandHeart, 
  CreditCard, Bell, UserCheck, Plus, ShieldAlert, CheckCircle2, 
  FileSpreadsheet, ArrowUpRight, Clock, Heart, Phone, MapPin, 
  Activity, ArrowRight, UserPlus, Sparkles 
} from "lucide-react";
import { 
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, 
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, 
  PieChart, Pie, Cell, Legend 
} from "recharts";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { useToast } from "../context/ToastContext";
import api from "../api";
import PostcardModal from "../components/Modals/PostcardModal";

export default function DashboardView({ 
  onNavigate, 
  onOpenEmergencyModal, 
  onOpenCheckinModal, 
  onOpenAddSeniorModal, 
  onOpenAppointmentModal, 
  onOpenAssistanceModal, 
  onOpenPaymentModal 
}) {
  const { user, t, lang } = useAuth();
  const { liveEventSignal } = useSocket();
  const { showToast } = useToast();

  const [metrics, setMetrics] = useState({});
  const [charts, setCharts] = useState(null);
  const [seniors, setSeniors] = useState([]);
  const [recentEmergencies, setRecentEmergencies] = useState([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [assistanceRequests, setAssistanceRequests] = useState([]);
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Postcard modal state
  const [postcardData, setPostcardData] = useState(null);
  const [postcardType, setPostcardType] = useState("senior");
  const [isPostcardOpen, setIsPostcardOpen] = useState(false);

  const openPostcard = (data, type) => {
    setPostcardData(data);
    setPostcardType(type);
    setIsPostcardOpen(true);
  };

  const role = user?.role || "senior_citizen";

  const loadDashboardData = async () => {
    try {
      const [metricsRes, seniorsRes, emergRes, aptRes, assistRes, feesRes] = await Promise.all([
        api.get("/analytics/dashboard"),
        api.get("/seniors"),
        api.get("/emergencies"),
        api.get("/appointments?status=Upcoming"),
        api.get("/assistance"),
        api.get("/fees")
      ]);

      setMetrics(metricsRes.data.metrics || {});
      setCharts(metricsRes.data.charts || null);
      setSeniors(seniorsRes.data.seniors || []);
      setRecentEmergencies(emergRes.data.emergencies?.slice(0, 4) || []);
      setUpcomingAppointments(aptRes.data.appointments?.slice(0, 4) || []);
      setAssistanceRequests(assistRes.data.requests?.slice(0, 5) || []);
      setFees(feesRes.data.fees?.slice(0, 4) || []);
    } catch (err) {
      console.error("Dashboard data load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [liveEventSignal]);

  const primarySenior = seniors[0] || null;

  // Chart Color Palette
  const CHART_COLORS = ["#2563eb", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4"];

  return (
    <div className="dashboard-content-wrapper">
      {/* Welcome Banner */}
      <section className="dashboard-hero-banner">
        <div className="hero-welcome-text">
          <div className="welcome-role-tag">
            <span className="role-dot" /> {t[role] || role}
          </div>
          <h1>
            {t.seniorWelcome}, {user?.displayName}!
          </h1>
          <p>
            {role === "senior_citizen"
              ? (lang === "ta" ? "உங்கள் உடல்நலம் மற்றும் பாதுகாப்பை உறுதிப்படுத்த நாங்கள் எப்போதும் தயாராக உள்ளோம்." : "Your wellness and safety companion. We are here to support you 24/7.")
              : (lang === "ta" ? "மூத்த குடிமக்களின் பாதுகாப்பு, தேவைகள் மற்றும் சந்திப்புகளை எளிதாக நிர்வகிக்கவும்." : "Real-time care coordination, emergency dispatch, and safety compliance.")}
          </p>
        </div>

        {/* Hero Quick Badge / Trigger */}
        <div className="hero-action-slot">
          {role === "senior_citizen" ? (
            <div className="senior-hero-buttons">
              <button 
                className="btn-hero-safe pulse-success" 
                onClick={onOpenCheckinModal}
                title="Confirm safety check-in"
              >
                <CheckCircle2 size={24} />
                <span>{t.iAmSafe}</span>
              </button>

              <button 
                className="btn-hero-emergency pulse-danger" 
                onClick={onOpenEmergencyModal}
                title="Trigger immediate emergency alert"
              >
                <ShieldAlert size={24} />
                <span>{t.triggerEmergency}</span>
              </button>
            </div>
          ) : (
            <div className="hero-status-pill">
              <Sparkles size={18} className="text-warning" />
              <span>{lang === "ta" ? "கணினி நேரலையில் இயங்குகிறது" : "System Live & Operational"}</span>
            </div>
          )}
        </div>
      </section>

      {/* Quick Action Strip */}
      <section className="quick-actions-bar">
        <div className="quick-actions-header">
          <strong>{t.quickActions}</strong>
          <small>{lang === "ta" ? "அடிக்கடி பயன்படுத்தப்படும் செயல்பாடுகள்" : "Frequently used care workflows"}</small>
        </div>

        <div className="quick-actions-grid">
          {(role === "admin" || role === "staff") && (
            <button className="quick-action-card" onClick={onOpenAddSeniorModal}>
              <span className="qa-icon-wrap primary"><UserPlus size={20} /></span>
              <span className="qa-title">{t.addSenior}</span>
            </button>
          )}

          <button className="quick-action-card danger" onClick={onOpenEmergencyModal}>
            <span className="qa-icon-wrap danger"><ShieldAlert size={20} /></span>
            <span className="qa-title">{t.triggerEmergency}</span>
          </button>

          <button className="quick-action-card success" onClick={onOpenCheckinModal}>
            <span className="qa-icon-wrap success"><CheckCircle2 size={20} /></span>
            <span className="qa-title">{t.iAmSafe}</span>
          </button>

          {(role === "admin" || role === "staff" || role === "family_member" || role === "senior_citizen") && (
            <button className="quick-action-card" onClick={onOpenAppointmentModal}>
              <span className="qa-icon-wrap info"><Calendar size={20} /></span>
              <span className="qa-title">{t.scheduleAppointment}</span>
            </button>
          )}

          <button className="quick-action-card" onClick={onOpenAssistanceModal}>
            <span className="qa-icon-wrap warning"><HandHeart size={20} /></span>
            <span className="qa-title">{t.requestAssistance}</span>
          </button>

          {(role === "admin" || role === "staff" || role === "family_member") && fees.length > 0 && (
            <button className="quick-action-card" onClick={() => onOpenPaymentModal(fees[0])}>
              <span className="qa-icon-wrap success"><CreditCard size={20} /></span>
              <span className="qa-title">{t.recordPayment}</span>
            </button>
          )}

          {(role === "admin" || role === "staff") && (
            <button className="quick-action-card" onClick={() => onNavigate("reports")}>
              <span className="qa-icon-wrap purple"><FileSpreadsheet size={20} /></span>
              <span className="qa-title">{t.exportReport}</span>
            </button>
          )}
        </div>
      </section>

      {/* Interactive Metric Cards */}
      <section className="metric-cards-grid">
        <div className="metric-card clickable" onClick={() => onNavigate("seniors")}>
          <div className="metric-card-top">
            <span className="metric-icon-box blue"><Users size={22} /></span>
            <span className="metric-trend up">+12 this mo</span>
          </div>
          <strong className="metric-value">{metrics.totalSeniors || seniors.length || 0}</strong>
          <span className="metric-label">{t.totalSeniors}</span>
          <span className="metric-link-text">{t.seniors} →</span>
        </div>

        <div className={`metric-card clickable ${metrics.activeEmergencies > 0 ? "has-danger-alert" : ""}`} onClick={() => onNavigate("emergency")}>
          <div className="metric-card-top">
            <span className="metric-icon-box red"><AlertCircle size={22} /></span>
            {metrics.activeEmergencies > 0 && <span className="metric-trend danger">ACTION REQ</span>}
          </div>
          <strong className="metric-value text-danger">{metrics.activeEmergencies || 0}</strong>
          <span className="metric-label">{t.activeEmergencies}</span>
          <span className="metric-link-text">{t.emergency} →</span>
        </div>

        <div className="metric-card clickable" onClick={() => onNavigate("safety")}>
          <div className="metric-card-top">
            <span className="metric-icon-box green"><ShieldCheck size={22} /></span>
            <span className="metric-trend success">96% compliant</span>
          </div>
          <strong className="metric-value text-success">{metrics.todayCheckins || 0}</strong>
          <span className="metric-label">{t.todayCheckins}</span>
          <span className="metric-link-text">{t.safety} →</span>
        </div>

        <div className="metric-card clickable" onClick={() => onNavigate("safety")}>
          <div className="metric-card-top">
            <span className="metric-icon-box orange"><Clock size={22} /></span>
          </div>
          <strong className="metric-value text-warning">{metrics.missedCheckins || 0}</strong>
          <span className="metric-label">{t.missedCheckins}</span>
          <span className="metric-link-text">{t.safety} →</span>
        </div>

        <div className="metric-card clickable" onClick={() => onNavigate("appointments")}>
          <div className="metric-card-top">
            <span className="metric-icon-box teal"><Calendar size={22} /></span>
            <span className="metric-trend info">Next 7 days</span>
          </div>
          <strong className="metric-value">{metrics.upcomingAppointments || upcomingAppointments.length || 0}</strong>
          <span className="metric-label">{t.upcomingAppointments}</span>
          <span className="metric-link-text">{t.appointments} →</span>
        </div>

        <div className="metric-card clickable" onClick={() => onNavigate("assistance")}>
          <div className="metric-card-top">
            <span className="metric-icon-box purple"><HandHeart size={22} /></span>
          </div>
          <strong className="metric-value">{metrics.pendingAssistance || assistanceRequests.length || 0}</strong>
          <span className="metric-label">{t.pendingAssistance}</span>
          <span className="metric-link-text">{t.assistance} →</span>
        </div>

        <div className="metric-card clickable" onClick={() => onNavigate("fees")}>
          <div className="metric-card-top">
            <span className="metric-icon-box amber"><CreditCard size={22} /></span>
          </div>
          <strong className="metric-value text-primary">₹{(metrics.pendingFeesAmount || 0).toLocaleString()}</strong>
          <span className="metric-label">{t.pendingFees} ({metrics.pendingFeesCount || 0})</span>
          <span className="metric-link-text">{t.fees} →</span>
        </div>

        <div className="metric-card clickable" onClick={() => onNavigate("settings")}>
          <div className="metric-card-top">
            <span className="metric-icon-box pink"><UserCheck size={22} /></span>
          </div>
          <strong className="metric-value">{metrics.activeCaregivers || 2}</strong>
          <span className="metric-label">{t.activeCaregivers}</span>
          <span className="metric-link-text">{lang === "ta" ? "விபரங்கள்" : "View Care Team"} →</span>
        </div>
      </section>

      {/* ============================================================== */}
      {/* ROLE-SPECIFIC VIEWS                                            */}
      {/* ============================================================== */}

      {/* 1. SENIOR CITIZEN CUSTOM DASHBOARD WIDGETS */}
      {role === "senior_citizen" && (
        <section className="senior-custom-dashboard">
          <div className="senior-cards-grid">
            {/* Safety Status Card */}
            <div className="senior-hero-card card-safe">
              <div className="senior-card-header">
                <ShieldCheck size={28} className="text-success" />
                <h3>{t.seniorSafeStatus}</h3>
              </div>
              <div className="senior-safe-indicator">
                <span className="status-badge-big safe">✓ {t.safeConfirmed}</span>
                <p className="senior-safe-meta">
                  {t.lastCheckin}: {primarySenior?.lastCheckinAt ? new Date(primarySenior.lastCheckinAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Today, 08:30 AM"}
                </p>
                <p className="streak-text">🔥 <strong>{primarySenior?.checkinStreak || 14} {t.streakDays}</strong></p>
              </div>
              <button className="btn-senior-checkin" onClick={onOpenCheckinModal}>
                <CheckCircle2 size={20} />
                <span>{lang === "ta" ? "மீண்டும் Check-in செய்" : "Update Today's Check-in"}</span>
              </button>
            </div>

            {/* My Caregiver Card */}
            <div className="senior-hero-card">
              <div className="senior-card-header">
                <Heart size={28} className="text-primary" />
                <h3>{t.myCaregiver}</h3>
              </div>
              <div className="caregiver-info-box">
                <strong>{primarySenior?.assignedCaregiverName || "Anitha Krishnan"}</strong>
                <small>{lang === "ta" ? "முதன்மை செவிலியர் & பராமரிப்பாளர்" : "Primary Geriatric Nurse & Caregiver"}</small>
                <div className="caregiver-contact-row">
                  <Phone size={16} />
                  <span>+91 98765 00004</span>
                </div>
              </div>
              <a href="tel:+919876500004" className="btn-call-caregiver">
                <Phone size={18} />
                <span>{t.callCaregiver}</span>
              </a>
            </div>

            {/* My Family Card */}
            <div className="senior-hero-card">
              <div className="senior-card-header">
                <Users size={28} className="text-purple" />
                <h3>{t.myFamily}</h3>
              </div>
              <div className="caregiver-info-box">
                <strong>{primarySenior?.emergencyContactName || "Priya Ramesh (Daughter)"}</strong>
                <small>{primarySenior?.emergencyContactRelation || "Daughter"}</small>
                <div className="caregiver-contact-row">
                  <Phone size={16} />
                  <span>{primarySenior?.emergencyContactPhone || "+91 98765 00003"}</span>
                </div>
              </div>
              <a href={`tel:${primarySenior?.emergencyContactPhone || "+919876500003"}`} className="btn-call-family">
                <Phone size={18} />
                <span>{t.callFamily}</span>
              </a>
            </div>
          </div>
        </section>
      )}

      {/* 2. FAMILY MEMBER CUSTOM DASHBOARD WIDGET */}
      {role === "family_member" && (
        <section className="family-custom-dashboard" style={{ marginBottom: "2rem" }}>
          <div className="section-title-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <h2 style={{ margin: 0, fontSize: "1.35rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Users className="text-primary" size={24} />
                  {lang === "ta" ? "எனது குடும்பப் பெரியவர்கள் (இணைக்கப்பட்ட மூத்தவர்கள்)" : "My Family Elders (Associated Seniors)"}
                </h2>
                <span style={{ background: "rgba(37,99,235,0.1)", color: "var(--primary)", border: "1px solid rgba(37,99,235,0.25)", fontSize: "0.75rem", padding: "0.2rem 0.6rem", borderRadius: "12px", fontWeight: "700" }}>
                  {seniors.length} / 2 {lang === "ta" ? "அதிகபட்சம்" : "Max Limit"}
                </span>
              </div>
              <p style={{ margin: "0.25rem 0 0", color: "var(--muted)", fontSize: "0.9rem" }}>
                {lang === "ta" 
                  ? "உங்கள் குடும்ப கணக்குடன் இணைக்கப்பட்டுள்ள 1 அல்லது 2 மூத்த உறுப்பினர்களின் நேரலை ஆரோக்கியம் மற்றும் மருத்துவ விபரங்கள்." 
                  : "Live wellness, medical records, and reports scoped specifically to your 1 or 2 associated elders."}
              </p>
            </div>
            
            <button 
              className="btn-primary" 
              style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.55rem 1rem", fontSize: "0.88rem", borderRadius: "10px" }}
              onClick={async () => {
                try {
                  showToast(lang === "ta" ? "மருத்துவ அறிக்கை பதிவிறக்கப்படுகிறது..." : "Downloading Health & Medical Report...", "info");
                  const res = await api.get("/reports/export/excel?type=health", { responseType: "blob" });
                  const blobUrl = window.URL.createObjectURL(new Blob([res.data]));
                  const link = document.createElement("a");
                  link.href = blobUrl;
                  link.setAttribute("download", `Family_Elders_Health_Report_${Date.now()}.xlsx`);
                  document.body.appendChild(link);
                  link.click();
                  link.remove();
                  window.URL.revokeObjectURL(blobUrl);
                  showToast(lang === "ta" ? "மருத்துவ அறிக்கை வெற்றிகரமாக பதிவிறக்கப்பட்டது!" : "Health report downloaded successfully!", "success");
                } catch(e) {
                  showToast("Failed to download report", "error");
                }
              }}
            >
              <FileSpreadsheet size={16} />
              <span>{lang === "ta" ? "🩺 முழு மருத்துவ அறிக்கை (Excel)" : "🩺 Download Health Report (Excel)"}</span>
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "1.25rem" }}>
            {seniors.length === 0 ? (
              <div className="empty-panel-state" style={{ padding: "2.5rem", textAlign: "center", background: "var(--surface)", borderRadius: "16px", border: "1px dashed var(--border)" }}>
                <Users size={40} style={{ color: "var(--muted)", opacity: 0.5, marginBottom: "0.75rem" }} />
                <p style={{ margin: "0.5rem 0", fontWeight: "600" }}>{lang === "ta" ? "இணைக்கப்பட்ட மூத்த குடிமக்கள் இல்லை" : "No associated senior citizens found."}</p>
                <small style={{ color: "var(--muted)" }}>{lang === "ta" ? "நிர்வாகி அல்லது செவிலியர் உங்கள் கணக்குடன் 1 அல்லது 2 உறுப்பினர்களை இணைப்பார்." : "Staff or Administrator will link up to 2 seniors to your family account."}</small>
              </div>
            ) : (
              seniors.map((snr) => (
                <div 
                  key={snr._id} 
                  className="family-senior-card"
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: "16px",
                    padding: "1.4rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "1rem",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
                    position: "relative"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
                    <div style={{ width: "64px", height: "64px", borderRadius: "14px", overflow: "hidden", background: "var(--surface-hover)", flexShrink: 0, border: "2px solid var(--primary-light)" }}>
                      <img 
                        src={snr.photoUrl || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150"} 
                        alt={snr.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: "700" }}>{snr.name}</h3>
                        <span style={{ 
                          fontSize: "0.75rem", 
                          padding: "0.2rem 0.6rem", 
                          borderRadius: "20px", 
                          fontWeight: "600",
                          background: snr.status === "active" ? "rgba(16,185,129,0.12)" : "rgba(245,158,11,0.12)",
                          color: snr.status === "active" ? "#10b981" : "#f59e0b"
                        }}>
                          {snr.status === "active" ? (lang === "ta" ? "செயலில்" : "Active Care") : snr.status}
                        </span>
                      </div>
                      <p style={{ margin: "0.2rem 0 0.5rem", color: "var(--muted)", fontSize: "0.85rem" }}>
                        {snr.age} {lang === "ta" ? "வயது" : "years"} · {snr.gender} · 🩸 <strong style={{ color: "#ef4444" }}>{snr.bloodGroup || "O+"}</strong>
                      </p>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                        <MapPin size={14} className="text-muted" />
                        <span>{snr.roomNumber ? `${lang === "ta" ? "அறை" : "Room"} ${snr.roomNumber}` : (snr.address || "Main Care Facility")}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ 
                    display: "grid", 
                    gridTemplateColumns: "1fr 1fr", 
                    gap: "0.6rem", 
                    background: "var(--surface-hover)", 
                    padding: "0.85rem", 
                    borderRadius: "10px",
                    fontSize: "0.82rem"
                  }}>
                    <div>
                      <span style={{ color: "var(--muted)", display: "block", fontSize: "0.75rem" }}>{t.myCaregiver}</span>
                      <strong style={{ display: "flex", alignItems: "center", gap: "0.3rem", marginTop: "0.15rem" }}>
                        <Heart size={13} className="text-primary" />
                        {snr.assignedCaregiverName || "Primary Nurse"}
                      </strong>
                    </div>
                    <div>
                      <span style={{ color: "var(--muted)", display: "block", fontSize: "0.75rem" }}>{t.lastCheckin}</span>
                      <strong style={{ display: "flex", alignItems: "center", gap: "0.3rem", marginTop: "0.15rem", color: "#10b981" }}>
                        <CheckCircle2 size={13} />
                        {snr.lastCheckinAt ? new Date(snr.lastCheckinAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Safe (Today)"}
                      </strong>
                    </div>
                  </div>

                  {snr.medicalConditions && snr.medicalConditions.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                      {snr.medicalConditions.map((cond, i) => (
                        <span key={i} style={{ fontSize: "0.73rem", background: "rgba(239,68,68,0.08)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)", padding: "0.15rem 0.5rem", borderRadius: "6px" }}>
                          ⚠️ {cond}
                        </span>
                      ))}
                    </div>
                  )}

                  <div style={{ display: "flex", gap: "0.5rem", marginTop: "auto", paddingTop: "0.5rem", borderTop: "1px solid var(--border)" }}>
                    <button 
                      className="btn-outline-small"
                      style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.35rem", padding: "0.45rem", borderRadius: "8px" }}
                      onClick={() => openPostcard(snr, "senior")}
                    >
                      <Sparkles size={14} className="text-primary" />
                      <span>{lang === "ta" ? "தபால் அட்டை" : "Postcard"}</span>
                    </button>

                    <button 
                      className="btn-outline-small"
                      style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.35rem", padding: "0.45rem", borderRadius: "8px" }}
                      onClick={() => onOpenAppointmentModal()}
                    >
                      <Calendar size={14} className="text-primary" />
                      <span>{t.appointments}</span>
                    </button>

                    <button 
                      className="btn-outline-small"
                      style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.35rem", padding: "0.45rem", borderRadius: "8px" }}
                      onClick={() => onNavigate("reports")}
                    >
                      <FileSpreadsheet size={14} className="text-primary" />
                      <span>{lang === "ta" ? "அறிக்கைகள்" : "Reports"}</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {/* 3. ADMIN RECHARTS ANALYTICS SECTION */}
      {(role === "admin" || role === "staff") && charts && (
        <section className="analytics-charts-section">
          <div className="section-title-row">
            <div>
              <h2>{lang === "ta" ? "செயல்திறன் மற்றும் போக்கு பகுப்பாய்வு" : "Operations & Compliance Analytics"}</h2>
              <p>{lang === "ta" ? "நேரலை தரவுகளிலிருந்து உருவாக்கப்பட்ட வரைபடங்கள்" : "Real-time trends rendered from MongoDB collections"}</p>
            </div>
            <button className="btn-outline-small" onClick={() => onNavigate("reports")}>
              {t.reports} →
            </button>
          </div>

          <div className="charts-grid-2">
            {/* Chart 1: Senior Registrations Trend */}
            <div className="chart-card">
              <div className="chart-card-header">
                <strong>{lang === "ta" ? "மூத்த குடிமக்கள் பதிவு போக்கு" : "Senior Registration Trend"}</strong>
                <small>{lang === "ta" ? "கடந்த 6 மாதங்கள்" : "Last 6 Months"}</small>
              </div>
              <div className="chart-container-box">
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={charts.registrationTrend || []}>
                    <defs>
                      <linearGradient id="colorSeniors" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="month" stroke="var(--muted)" />
                    <YAxis stroke="var(--muted)" />
                    <Tooltip contentStyle={{ background: "var(--surface)", borderColor: "var(--border)", borderRadius: 10 }} />
                    <Area type="monotone" dataKey="seniors" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorSeniors)" name="Seniors" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Fee Collections vs Dues */}
            <div className="chart-card">
              <div className="chart-card-header">
                <strong>{lang === "ta" ? "கட்டண வசூல் மற்றும் நிலுவைகள்" : "Fee Collections vs Remaining Dues"}</strong>
                <small>₹ Indian Rupees</small>
              </div>
              <div className="chart-container-box">
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={charts.feeCollection || []}>
                    <CartGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="name" stroke="var(--muted)" />
                    <YAxis stroke="var(--muted)" />
                    <Tooltip contentStyle={{ background: "var(--surface)", borderColor: "var(--border)", borderRadius: 10 }} />
                    <Bar dataKey="collected" fill="#10b981" radius={[4, 4, 0, 0]} name="Collected (₹)" />
                    <Bar dataKey="remaining" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Remaining (₹)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 3: Emergency Trends */}
            <div className="chart-card">
              <div className="chart-card-header">
                <strong>{lang === "ta" ? "அவசர எச்சரிக்கைகள் மற்றும் தீர்வுகள்" : "Emergency Incidents & Resolutions"}</strong>
                <small>{lang === "ta" ? "செயலில் vs தீர்க்கப்பட்டது" : "Active vs Resolved"}</small>
              </div>
              <div className="chart-container-box">
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={charts.emergencyTrend || []}>
                    <CartGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="month" stroke="var(--muted)" />
                    <YAxis stroke="var(--muted)" />
                    <Tooltip contentStyle={{ background: "var(--surface)", borderColor: "var(--border)", borderRadius: 10 }} />
                    <Bar dataKey="resolved" fill="#2563eb" radius={[4, 4, 0, 0]} name="Resolved" />
                    <Bar dataKey="active" fill="#ef4444" radius={[4, 4, 0, 0]} name="Active" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 4: Daily Safety Check-in Compliance */}
            <div className="chart-card">
              <div className="chart-card-header">
                <strong>{lang === "ta" ? "தினசரி Check-in இணக்க விகிதம்" : "Daily Check-in Compliance Rate (%)"}</strong>
                <small>Mon — Sun</small>
              </div>
              <div className="chart-container-box">
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={charts.checkinCompliance || []}>
                    <CartGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="day" stroke="var(--muted)" />
                    <YAxis stroke="var(--muted)" domain={[80, 100]} />
                    <Tooltip contentStyle={{ background: "var(--surface)", borderColor: "var(--border)", borderRadius: 10 }} />
                    <Line type="monotone" dataKey="rate" stroke="#10b981" strokeWidth={3} dot={{ r: 5 }} name="Compliance %" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Operational Two-Column Section: Appointments & Assistance Requests */}
      <section className="dashboard-operations-row">
        {/* Upcoming Appointments */}
        <div className="dashboard-panel-box">
          <div className="panel-box-header">
            <div>
              <h3>{t.upcomingAppointments}</h3>
              <small>{lang === "ta" ? "மருத்துவ சந்திப்புகள் மற்றும் பரிசோதனைகள்" : "Scheduled consultations and hospital visits"}</small>
            </div>
            <button className="panel-header-link" onClick={() => onNavigate("appointments")}>
              {lang === "ta" ? "அனைத்தும் பார்" : "View All"} →
            </button>
          </div>

          <div className="panel-list-content">
            {upcomingAppointments.length === 0 ? (
              <div className="empty-panel-state">{t.noData}</div>
            ) : (
              upcomingAppointments.map((apt) => (
                <div 
                  key={apt._id} 
                  className="appointment-mini-item postcard-clickable-row"
                  onClick={() => openPostcard(apt, "appointment")}
                  title={lang === "ta" ? "தபால் அட்டையைக் காண தொடவும்" : "Touch / Click to open Postcard"}
                >
                  <div className="apt-calendar-badge">
                    <span className="month">{new Date(apt.appointmentDate).toLocaleString("default", { month: "short" })}</span>
                    <span className="day">{new Date(apt.appointmentDate).getDate()}</span>
                  </div>
                  <div className="apt-mini-info">
                    <strong>{apt.seniorName} — {apt.doctorName}</strong>
                    <small>{apt.department} · {apt.hospital}</small>
                    <span className="apt-time-slot">⏰ {apt.timeSlot}</span>
                  </div>
                  <span className="status-pill-small upcoming">{apt.status}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Assistance Requests */}
        <div className="dashboard-panel-box">
          <div className="panel-box-header">
            <div>
              <h3>{t.assistance}</h3>
              <small>{lang === "ta" ? "உணவு, மருந்து, பயண தேவைகள்" : "Care, grocery, and medicine assistance"}</small>
            </div>
            <button className="panel-header-link" onClick={() => onNavigate("assistance")}>
              {lang === "ta" ? "அனைத்தும் பார்" : "View All"} →
            </button>
          </div>

          <div className="panel-list-content">
            {assistanceRequests.length === 0 ? (
              <div className="empty-panel-state">{t.noData}</div>
            ) : (
              assistanceRequests.map((req) => (
                <div 
                  key={req._id} 
                  className="assistance-mini-item postcard-clickable-row"
                  onClick={() => openPostcard(req, "assistance")}
                  title={lang === "ta" ? "தபால் அட்டையைக் காண தொடவும்" : "Touch / Click to open Postcard"}
                >
                  <div className="assist-icon-circle">
                    <HandHeart size={18} />
                  </div>
                  <div className="assist-mini-info">
                    <strong>{req.title}</strong>
                    <small>{req.seniorName} · {req.category}</small>
                  </div>
                  <span className={`status-pill-small status-${req.status.toLowerCase().replace(/\s+/g, "-")}`}>
                    {req.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Recent Emergencies strip if any */}
      {recentEmergencies.length > 0 && (
        <section className="dashboard-emergencies-panel">
          <div className="panel-box-header">
            <div>
              <h3 className="text-danger">🚨 {lang === "ta" ? "அவசர சம்பவங்கள் பதிவு" : "Emergency Incidents Audit"}</h3>
              <small>{lang === "ta" ? "சமீபத்திய அவசர எச்சரிக்கைகள் மற்றும் அவற்றின் தீர்வுகள்" : "Recent emergency activations and resolution log"}</small>
            </div>
            <button className="panel-header-link" onClick={() => onNavigate("emergency")}>
              {t.emergency} →
            </button>
          </div>

          <div className="emergencies-cards-strip">
            {recentEmergencies.map((em) => (
              <div 
                key={em._id} 
                className={`emergency-summary-card ${em.status === "active" ? "active-alert" : ""} postcard-clickable-row`}
                onClick={() => openPostcard(em, "emergency")}
                title={lang === "ta" ? "தபால் அட்டையைக் காண தொடவும்" : "Touch / Click to open Postcard"}
              >
                <div className="em-card-top">
                  <span className="em-code-tag">{em.emergencyCode}</span>
                  <span className={`em-status-badge ${em.status}`}>{em.status.toUpperCase()}</span>
                </div>
                <strong>{em.seniorName}</strong>
                <p className="em-location-line">📍 {em.location || "Room"}</p>
                <small className="em-notes-snippet">{em.notes}</small>
                <div className="em-time-row">
                  <Clock size={12} />
                  <span>{new Date(em.createdAt).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Interactive Postcard Detail Modal */}
      <PostcardModal
        isOpen={isPostcardOpen}
        onClose={() => setIsPostcardOpen(false)}
        data={postcardData}
        type={postcardType}
        onAction={(data) => {
          if (postcardType === "appointment") onNavigate("appointments");
          else if (postcardType === "assistance") onNavigate("assistance");
          else if (postcardType === "emergency") onNavigate("emergency");
          else if (postcardType === "senior") onNavigate("seniors");
        }}
      />
    </div>
  );
}

// Helper Grid wrapper for Recharts
function CartGrid(props) {
  return <CartesianGrid strokeDasharray="3 3" opacity={0.15} {...props} />;
}
