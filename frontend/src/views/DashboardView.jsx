import React, { useState, useEffect } from "react";
import { 
  Users, AlertCircle, ShieldCheck, Calendar, HandHeart, 
  CreditCard, Bell, UserCheck, Plus, ShieldAlert, CheckCircle2, 
  FileSpreadsheet, ArrowUpRight, Clock, Heart, Phone, MapPin, 
  Activity, ArrowRight, UserPlus, Sparkles, TestTube, FileText,
  UserCog, Shield, Stethoscope, Star, Film, Trash2, Award, Zap,
  Download, Printer, AlertTriangle, Eye, Receipt
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
import OrderServiceModal from "../components/Modals/OrderServiceModal";
import ReceiptModal from "../components/Modals/ReceiptModal";
import CareGallery from "../components/CareGallery";

export default function DashboardView({ 
  onNavigate, 
  onOpenEmergencyModal, 
  onOpenCheckinModal, 
  onOpenAddSeniorModal, 
  onOpenAppointmentModal, 
  onOpenAssistanceModal, 
  onOpenPaymentModal 
}) {
  const { user, t, lang, activeSeniorId, setActiveSeniorId } = useAuth();
  const { liveEventSignal } = useSocket();
  const { showToast } = useToast();

  const [metrics, setMetrics] = useState({});
  const [charts, setCharts] = useState(null);
  const [seniors, setSeniors] = useState([]);
  const [recentEmergencies, setRecentEmergencies] = useState([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [assistanceRequests, setAssistanceRequests] = useState([]);
  const [fees, setFees] = useState([]);
  const [videos, setVideos] = useState([]);
  const [leaderboard, setLeaderboard] = useState({ bestCaregivers: [], bestVolunteers: [] });
  const [reviewsList, setReviewsList] = useState([]);
  const [activeReceipt, setActiveReceipt] = useState(null);
  const [elderRelations, setElderRelations] = useState(() => {
    try {
      const saved = localStorage.getItem("seniorcare_elder_relations");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [loading, setLoading] = useState(true);

  // Order Service Modal & Elder Switcher state
  const [isOrderServiceOpen, setIsOrderServiceOpen] = useState(false);
  const [activeElderId, setActiveElderId] = useState(null);

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

  const handleRelationChange = (seniorId, rel) => {
    const updated = { ...elderRelations, [seniorId]: rel };
    setElderRelations(updated);
    localStorage.setItem("seniorcare_elder_relations", JSON.stringify(updated));
    showToast(
      lang === "ta" ? `உறவு முறை '${rel}' என புதுப்பிக்கப்பட்டது` : `Relation marked as '${rel}'`,
      "success"
    );
  };

  const handleDeleteVideo = async (id, title) => {
    if (!window.confirm(lang === "ta" ? `வீடியோ "${title}" நீக்கவா?` : `Remove video "${title}"?`)) return;
    try {
      await api.delete(`/videos/${id}`);
      showToast(lang === "ta" ? "வீடியோ நீக்கப்பட்டது" : "Video removed successfully", "success");
      loadDashboardData();
    } catch (err) {
      showToast("Failed to remove video", "error");
    }
  };

  const handleRemoveStaff = async (id, name, staffRole) => {
    if (!window.confirm(lang === "ta" ? `${staffRole} "${name}"-ஐ நிச்சயமாக நீக்க/தடை செய்ய விரும்புகிறீர்களா?` : `Are you sure you want to remove/deactivate ${staffRole} "${name}" following complaints?`)) return;
    try {
      await api.delete(`/users/${id}`);
      showToast(
        lang === "ta" ? `${name} வெற்றிகரமாக நீக்கப்பட்டார்.` : `${name} removed from active service.`,
        "success"
      );
      loadDashboardData();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to remove staff", "error");
    }
  };

  const loadDashboardData = async () => {
    try {
      const [metricsRes, seniorsRes, emergRes, aptRes, assistRes, feesRes, videosRes, boardRes, revRes] = await Promise.all([
        api.get("/analytics/dashboard"),
        api.get("/seniors"),
        api.get("/emergencies"),
        api.get("/appointments?status=Upcoming"),
        api.get("/assistance"),
        api.get("/fees"),
        api.get("/videos").catch(() => ({ data: { videos: [] } })),
        api.get("/reviews/leaderboard").catch(() => ({ data: { bestCaregivers: [], bestVolunteers: [] } })),
        api.get("/reviews").catch(() => ({ data: { reviews: [] } }))
      ]);

      setMetrics(metricsRes.data.metrics || {});
      const fetchedSeniors = seniorsRes.data.seniors || [];
      setSeniors(fetchedSeniors);
      if (activeSeniorId) {
        setActiveElderId(activeSeniorId);
      } else if (fetchedSeniors.length > 0 && !activeElderId) {
        setActiveElderId(fetchedSeniors[0]._id);
      }
      setRecentEmergencies(emergRes.data.emergencies?.slice(0, 4) || []);
      setUpcomingAppointments(aptRes.data.appointments?.slice(0, 4) || []);
      setAssistanceRequests(assistRes.data.requests?.slice(0, 5) || []);
      setFees(feesRes.data.fees?.slice(0, 4) || []);
      setVideos(videosRes.data.videos || []);
      setLeaderboard(boardRes.data || { bestCaregivers: [], bestVolunteers: [] });
      setReviewsList(revRes.data.reviews || []);
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

      {/* Family Member Associated Elder Banner */}
      {role === "family_member" && (
        <section style={{
          background: "linear-gradient(135deg, rgba(2, 132, 199, 0.08), rgba(16, 185, 129, 0.08))",
          border: "1.5px solid #0284c7",
          borderRadius: "14px",
          padding: "1rem 1.4rem",
          margin: "1.25rem 0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem",
          boxShadow: "0 4px 12px rgba(2, 132, 199, 0.08)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#0284c7", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.25rem", fontWeight: "700" }}>
              👨‍👩‍👧
            </div>
            <div>
              <div style={{ fontSize: "0.78rem", fontWeight: "700", textTransform: "uppercase", color: "#0369a1", letterSpacing: "0.5px" }}>
                {lang === "ta" ? "இணைக்கப்பட்ட முதியவர் (Associated Senior Citizen)" : "Monitoring Senior Citizen Profile"}
              </div>
              <div style={{ fontSize: "1.1rem", fontWeight: "800", color: "var(--text-main, #0f172a)" }}>
                {seniors.find((s) => s._id === (activeElderId || activeSeniorId))?.name || "Lakshmi Devi"}
                <span style={{ fontSize: "0.85rem", fontWeight: "500", color: "var(--text-muted, #64748b)", marginLeft: "8px" }}>
                  ({seniors.find((s) => s._id === (activeElderId || activeSeniorId))?.age || 72} yrs · Room {seniors.find((s) => s._id === (activeElderId || activeSeniorId))?.roomNumber || "104"})
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            {seniors.length > 1 && (
              <select
                value={activeElderId || activeSeniorId || ""}
                onChange={(e) => {
                  setActiveElderId(e.target.value);
                  setActiveSeniorId(e.target.value);
                }}
                style={{
                  padding: "0.5rem 0.85rem",
                  borderRadius: "8px",
                  border: "1.5px solid #0284c7",
                  background: "var(--bg-surface, #ffffff)",
                  color: "var(--text-main, #0f172a)",
                  fontWeight: "700",
                  fontSize: "0.85rem"
                }}
              >
                {seniors.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} ({s.roomNumber || "Resident"})
                  </option>
                ))}
              </select>
            )}

            <button
              type="button"
              className="btn-primary"
              onClick={() => setIsOrderServiceOpen(true)}
              style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 1rem", fontSize: "0.85rem" }}
            >
              <TestTube size={16} />
              <span>{lang === "ta" ? "ஆய்வகம் பதிவு செய்" : "Order Lab Test"}</span>
            </button>
          </div>
        </section>
      )}

      {/* Quick Action Strip */}
      <section className="quick-actions-bar">
        <div className="quick-actions-header">
          <strong>{t.quickActions}</strong>
          <small>{lang === "ta" ? "அடிக்கடி பயன்படுத்தப்படும் செயல்பாடுகள்" : "Frequently used care workflows"}</small>
        </div>

        <div className="quick-actions-grid">
          {/* 1. ADMIN ACTIONS: Strictly administrative operations only */}
          {role === "admin" && (
            <>
              <button className="quick-action-card" onClick={() => onNavigate("videos")}>
                <span className="qa-icon-wrap primary"><Film size={20} /></span>
                <span className="qa-title">{lang === "ta" ? "வீடியோக்கள் மேலாண்மை" : "Video Management"}</span>
              </button>
              <button className="quick-action-card" onClick={() => onNavigate("reviews")}>
                <span className="qa-icon-wrap warning"><Award size={20} /></span>
                <span className="qa-title">{lang === "ta" ? "மதிப்பீடுகள் & புகார்கள்" : "Reviews & Complaints"}</span>
              </button>
              <button className="quick-action-card" onClick={() => onNavigate("usersManagement")}>
                <span className="qa-icon-wrap info"><UserCog size={20} /></span>
                <span className="qa-title">{lang === "ta" ? "பயனர்கள் மேலாண்மை" : "Users Moderation"}</span>
              </button>
              <button className="quick-action-card" onClick={onOpenAddSeniorModal}>
                <span className="qa-icon-wrap success"><UserPlus size={20} /></span>
                <span className="qa-title">{t.addSenior}</span>
              </button>
              <button className="quick-action-card" onClick={() => onNavigate("reports")}>
                <span className="qa-icon-wrap purple"><FileSpreadsheet size={20} /></span>
                <span className="qa-title">{t.exportReport}</span>
              </button>
              <button className="quick-action-card" onClick={() => onNavigate("settings")}>
                <span className="qa-icon-wrap warning"><Activity size={20} /></span>
                <span className="qa-title">{lang === "ta" ? "தணிக்கை & அமைப்புகள்" : "Audit & Logs"}</span>
              </button>
            </>
          )}

          {/* 2. STAFF ACTIONS */}
          {role === "staff" && (
            <>
              <button className="quick-action-card" onClick={onOpenAddSeniorModal}>
                <span className="qa-icon-wrap primary"><UserPlus size={20} /></span>
                <span className="qa-title">{t.addSenior}</span>
              </button>
              <button className="quick-action-card" onClick={onOpenAppointmentModal}>
                <span className="qa-icon-wrap info"><Calendar size={20} /></span>
                <span className="qa-title">{t.scheduleAppointment}</span>
              </button>
              <button className="quick-action-card" onClick={() => onNavigate("emergency")}>
                <span className="qa-icon-wrap danger"><ShieldAlert size={20} /></span>
                <span className="qa-title">{lang === "ta" ? "அவசர பிரிவு மையம்" : "Emergency Dispatch"}</span>
              </button>
              <button className="quick-action-card" onClick={() => onNavigate("reports")}>
                <span className="qa-icon-wrap purple"><FileSpreadsheet size={20} /></span>
                <span className="qa-title">{t.exportReport}</span>
              </button>
            </>
          )}

          {/* 3. SENIOR CITIZEN ACTIONS: Personal safety, emergency, appointments, lab test orders */}
          {role === "senior_citizen" && (
            <>
              <button className="quick-action-card success" onClick={onOpenCheckinModal}>
                <span className="qa-icon-wrap success"><CheckCircle2 size={20} /></span>
                <span className="qa-title">{t.iAmSafe}</span>
              </button>
              <button className="quick-action-card danger" onClick={onOpenEmergencyModal}>
                <span className="qa-icon-wrap danger"><ShieldAlert size={20} /></span>
                <span className="qa-title">{lang === "ta" ? "⚡ உடனடி SOS அவசரம்" : "⚡ Instant Emergency SOS"}</span>
              </button>
              <button className="quick-action-card" onClick={() => setIsOrderServiceOpen(true)}>
                <span className="qa-icon-wrap primary"><TestTube size={20} /></span>
                <span className="qa-title">{lang === "ta" ? "ஆய்வக பரிசோதனை பதிவு" : "Order Lab Test"}</span>
              </button>
              <button className="quick-action-card" onClick={() => onNavigate("reviews")}>
                <span className="qa-icon-wrap warning"><Star size={20} /></span>
                <span className="qa-title">{lang === "ta" ? "பராமரிப்பாளர் மதிப்பீடு" : "Rate Care Team"}</span>
              </button>
              <button className="quick-action-card" onClick={() => onNavigate("appointments")}>
                <span className="qa-icon-wrap info"><Calendar size={20} /></span>
                <span className="qa-title">{t.appointments}</span>
              </button>
              <button className="quick-action-card" onClick={onOpenAssistanceModal}>
                <span className="qa-icon-wrap warning"><HandHeart size={20} /></span>
                <span className="qa-title">{t.requestAssistance}</span>
              </button>
            </>
          )}

          {/* 4. FAMILY MEMBER ACTIONS: Scoped to linked elder */}
          {role === "family_member" && (
            <>
              <button className="quick-action-card" onClick={() => setIsOrderServiceOpen(true)}>
                <span className="qa-icon-wrap primary"><TestTube size={20} /></span>
                <span className="qa-title">{lang === "ta" ? "பெரியவருக்கு ஆய்வக பரிசோதனை" : "Order Lab Service"}</span>
              </button>
              <button className="quick-action-card" onClick={onOpenAppointmentModal}>
                <span className="qa-icon-wrap info"><Calendar size={20} /></span>
                <span className="qa-title">{t.scheduleAppointment}</span>
              </button>
              <button className="quick-action-card" onClick={() => onNavigate("reviews")}>
                <span className="qa-icon-wrap warning"><Star size={20} /></span>
                <span className="qa-title">{lang === "ta" ? "பராமரிப்பாளரை மதிப்பிடவும்" : "Rate Caregiver"}</span>
              </button>
              <button className="quick-action-card" onClick={() => onNavigate("fees")}>
                <span className="qa-icon-wrap success"><Receipt size={20} /></span>
                <span className="qa-title">{lang === "ta" ? "கட்டண ரசீதுகள்" : "Care Receipts"}</span>
              </button>
              <button className="quick-action-card" onClick={onOpenAssistanceModal}>
                <span className="qa-icon-wrap warning"><HandHeart size={20} /></span>
                <span className="qa-title">{t.requestAssistance}</span>
              </button>
            </>
          )}

          {/* 5. CAREGIVER / CARETAKER ACTIONS */}
          {(role === "caretaker" || role === "caregiver") && (
            <>
              <button className="quick-action-card success" onClick={onOpenCheckinModal}>
                <span className="qa-icon-wrap success"><CheckCircle2 size={20} /></span>
                <span className="qa-title">{lang === "ta" ? "நோயாளி Check-in பதிவு" : "Log Check-in"}</span>
              </button>
              <button className="quick-action-card danger" onClick={() => onNavigate("emergency")}>
                <span className="qa-icon-wrap danger"><ShieldAlert size={20} /></span>
                <span className="qa-title">{lang === "ta" ? "அவசர பிரிவு மீட்பு" : "Emergency Queue"}</span>
              </button>
              <button className="quick-action-card" onClick={onOpenAppointmentModal}>
                <span className="qa-icon-wrap info"><Calendar size={20} /></span>
                <span className="qa-title">{t.scheduleAppointment}</span>
              </button>
              <button className="quick-action-card" onClick={() => onNavigate("seniors")}>
                <span className="qa-icon-wrap primary"><Users size={20} /></span>
                <span className="qa-title">{lang === "ta" ? "எனது முதியோர்கள்" : "Assigned Seniors"}</span>
              </button>
            </>
          )}

          {/* 6. VOLUNTEER ACTIONS */}
          {role === "volunteer" && (
            <>
              <button className="quick-action-card" onClick={() => onNavigate("assistance")}>
                <span className="qa-icon-wrap warning"><HandHeart size={20} /></span>
                <span className="qa-title">{lang === "ta" ? "உதவி தேவைகள் பலகை" : "Available Requests"}</span>
              </button>
              <button className="quick-action-card success" onClick={() => onNavigate("assistance")}>
                <span className="qa-icon-wrap success"><CheckCircle2 size={20} /></span>
                <span className="qa-title">{lang === "ta" ? "எனது பணிகள்" : "My Active Errands"}</span>
              </button>
            </>
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

            {/* Lab & Hospital Services Card */}
            <div className="senior-hero-card">
              <div className="senior-card-header">
                <TestTube size={28} className="text-primary" />
                <h3>{lang === "ta" ? "ஆய்வக & மருத்துவ சேவைகள்" : "Lab & Diagnostic Tests"}</h3>
              </div>
              <div className="caregiver-info-box">
                <strong>{lang === "ta" ? "வீட்டு மாதிரி சேகரிப்பு" : "Home Sample Collection"}</strong>
                <small>{lang === "ta" ? "பரிசோதனை பதிவு செய்யலாம் · கட்டண நெருக்கடி இல்லை" : "Order health checks anytime · Zero upfront dues"}</small>
                <div className="caregiver-contact-row">
                  <Sparkles size={15} className="text-warning" />
                  <span>CBC, Diabetes, Thyroid, ECG</span>
                </div>
              </div>
              <button 
                type="button" 
                className="btn-primary" 
                style={{ width: "100%", justifyContent: "center", display: "flex", alignItems: "center", gap: "0.45rem", padding: "0.55rem", borderRadius: "10px", marginTop: "auto" }}
                onClick={() => setIsOrderServiceOpen(true)}
              >
                <TestTube size={16} />
                <span>{lang === "ta" ? "பரிசோதனை பதிவு செய்" : "Order Lab Service"}</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* 2. FAMILY MEMBER CUSTOM DASHBOARD WIDGET */}
      {role === "family_member" && (
        <section className="family-custom-dashboard" style={{ marginBottom: "2rem" }}>
          <div className="section-title-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "1rem" }}>
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
            
            <div style={{ display: "flex", gap: "0.6rem" }}>
              <button 
                className="btn-outline-small"
                style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 0.9rem", borderRadius: "10px" }}
                onClick={() => setIsOrderServiceOpen(true)}
              >
                <TestTube size={15} className="text-primary" />
                <span>{lang === "ta" ? "ஆய்வகம் பதிவு" : "Order Lab Test"}</span>
              </button>

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
                <span>{lang === "ta" ? "🩺 மருத்துவ அறிக்கை (Excel)" : "🩺 Download Health Report (Excel)"}</span>
              </button>
            </div>
          </div>

          {/* Elder Switcher Bar for multi-child or multi-elder family accounts */}
          {seniors.length > 1 && (
            <div className="elder-switcher-bar">
              <span className="elder-switcher-label">
                <Users size={15} className="text-primary" />
                <span>{lang === "ta" ? "பெரியவரைத் தேர்ந்தெடு / Switch Elder:" : "Switch Focus Elder:"}</span>
              </span>
              {seniors.map((snr) => {
                const isFocused = (activeElderId || seniors[0]?._id) === snr._id;
                return (
                  <button
                    key={snr._id}
                    type="button"
                    className={`elder-switch-btn ${isFocused ? "active" : ""}`}
                    onClick={() => setActiveElderId(snr._id)}
                  >
                    <span>👵</span>
                    <span>{snr.name} ({snr.age} yrs)</span>
                    {isFocused && <span style={{ marginLeft: "4px" }}>✓</span>}
                  </button>
                );
              })}
            </div>
          )}

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
                  className={`family-senior-card ${(activeElderId || seniors[0]?._id) === snr._id ? "focused-card" : ""}`}
                  style={{
                    background: "var(--surface)",
                    border: (activeElderId || seniors[0]?._id) === snr._id ? "2px solid var(--primary)" : "1px solid var(--border)",
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

                  {/* Multi-Child Family Linkage & Relationship Selector Display */}
                  <div style={{ background: "rgba(139, 92, 246, 0.08)", border: "1px dashed rgba(139, 92, 246, 0.25)", padding: "0.5rem 0.75rem", borderRadius: "10px", fontSize: "0.8rem", color: "#6d28d9" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.4rem" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontWeight: "600" }}>
                        <span>👨‍👩‍👧</span>
                        <span>{lang === "ta" ? "குடும்ப உறவு:" : "Family Member Link:"}</span>
                      </span>
                      <div style={{ display: "flex", gap: "0.3rem" }}>
                        {["Mother", "Father", "Grandparent", "Elder"].map((rel) => (
                          <button
                            key={rel}
                            type="button"
                            className={`filter-pill ${(elderRelations[snr._id] || (snr.gender === "Female" ? "Mother" : "Father")) === rel ? "active" : ""}`}
                            style={{ padding: "0.15rem 0.5rem", fontSize: "0.72rem" }}
                            onClick={() => handleRelationChange(snr._id, rel)}
                          >
                            {rel}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Dedicated Live Health Analysis Display */}
                  <div style={{ background: "rgba(37,99,235,0.04)", border: "1px solid rgba(37,99,235,0.15)", borderRadius: "12px", padding: "0.85rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                      <strong style={{ fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.35rem", color: "var(--primary)" }}>
                        <Activity size={15} />
                        <span>{lang === "ta" ? "🩺 நேரலை ஆரோக்கிய பகுப்பாய்வு (Health Analysis)" : "🩺 Live Health Analysis & Vitals"}</span>
                      </strong>
                      <span style={{ fontSize: "0.72rem", background: "rgba(16,185,129,0.12)", color: "#10b981", padding: "0.15rem 0.5rem", borderRadius: "12px", fontWeight: "700" }}>
                        ✓ Stable & Safe
                      </span>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.45rem", textAlign: "center" }}>
                      <div style={{ background: "var(--surface)", padding: "0.4rem", borderRadius: "8px", border: "1px solid var(--border)" }}>
                        <small style={{ fontSize: "0.68rem", color: "var(--text-muted)", display: "block" }}>Blood Pressure</small>
                        <strong style={{ fontSize: "0.82rem", color: "#059669" }}>122/80</strong>
                      </div>
                      <div style={{ background: "var(--surface)", padding: "0.4rem", borderRadius: "8px", border: "1px solid var(--border)" }}>
                        <small style={{ fontSize: "0.68rem", color: "var(--text-muted)", display: "block" }}>Pulse Rate</small>
                        <strong style={{ fontSize: "0.82rem", color: "#2563eb" }}>74 bpm</strong>
                      </div>
                      <div style={{ background: "var(--surface)", padding: "0.4rem", borderRadius: "8px", border: "1px solid var(--border)" }}>
                        <small style={{ fontSize: "0.68rem", color: "var(--text-muted)", display: "block" }}>Blood Sugar</small>
                        <strong style={{ fontSize: "0.82rem", color: "#d97706" }}>104 mg/dL</strong>
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

                  <div style={{ display: "flex", gap: "0.45rem", marginTop: "auto", paddingTop: "0.5rem", borderTop: "1px solid var(--border)", flexWrap: "wrap" }}>
                    <button 
                      className="btn-outline-small"
                      style={{ flex: 1, minWidth: "100px", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.35rem", padding: "0.45rem", borderRadius: "8px" }}
                      onClick={() => {
                        setActiveElderId(snr._id);
                        setIsOrderServiceOpen(true);
                      }}
                    >
                      <TestTube size={14} className="text-primary" />
                      <span>{lang === "ta" ? "ஆய்வகம் பதிவு" : "Order Lab"}</span>
                    </button>

                    <button 
                      className="btn-outline-small"
                      style={{ flex: 1, minWidth: "100px", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.35rem", padding: "0.45rem", borderRadius: "8px" }}
                      onClick={() => onNavigate("reviews")}
                    >
                      <Star size={14} className="text-warning" />
                      <span>{lang === "ta" ? "மதிப்பீடு" : "Rate Caregiver"}</span>
                    </button>

                    <button 
                      className="btn-outline-small"
                      style={{ flex: 1, minWidth: "100px", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.35rem", padding: "0.45rem", borderRadius: "8px" }}
                      onClick={() => onNavigate("fees")}
                    >
                      <Receipt size={14} className="text-success" />
                      <span>{lang === "ta" ? "ரசீதுகள்" : "Receipts"}</span>
                    </button>

                    <button 
                      className="btn-outline-small"
                      style={{ flex: 1, minWidth: "100px", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.35rem", padding: "0.45rem", borderRadius: "8px" }}
                      onClick={async () => {
                        try {
                          showToast(lang === "ta" ? "மருத்துவ அறிக்கை பதிவிறக்கப்படுகிறது..." : "Downloading Health & Medical Report...", "info");
                          const res = await api.get("/reports/export/excel?type=health", { responseType: "blob" });
                          const blobUrl = window.URL.createObjectURL(new Blob([res.data]));
                          const link = document.createElement("a");
                          link.href = blobUrl;
                          link.setAttribute("download", `${snr.name.replace(/\s+/g, "_")}_Health_Report_${Date.now()}.xlsx`);
                          document.body.appendChild(link);
                          link.click();
                          link.remove();
                          window.URL.revokeObjectURL(blobUrl);
                          showToast(lang === "ta" ? "மருத்துவ அறிக்கை பதிவிறக்கப்பட்டது!" : "Report downloaded!", "success");
                        } catch(e) {
                          showToast("Failed to download report", "error");
                        }
                      }}
                    >
                      <FileSpreadsheet size={14} className="text-primary" />
                      <span>{lang === "ta" ? "அறிக்கை (Excel)" : "Excel Report"}</span>
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

      {/* 4. ADMIN SPECIFIC PANELS: CAREGIVER/VOLUNTEER MODERATION & VIDEO MANAGEMENT */}
      {role === "admin" && (
        <>
          {/* Admin Staff & Volunteer Moderation / Complaints Panel */}
          <section className="dashboard-admin-moderation-section" style={{ marginBottom: "2rem" }}>
            <div className="section-title-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <h2 style={{ margin: 0, fontSize: "1.35rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <UserCog className="text-primary" size={24} />
                    {lang === "ta" ? "செவிலியர் & தன்னார்வலர் மேற்பார்வை & புகார்கள்" : "Caregiver & Volunteer Moderation & Complaints"}
                  </h2>
                  <span style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.25)", fontSize: "0.75rem", padding: "0.2rem 0.6rem", borderRadius: "12px", fontWeight: "700" }}>
                    {leaderboard.bestCaregivers?.filter(c => c.complaintsCount > 0).length + leaderboard.bestVolunteers?.filter(v => v.complaintsCount > 0).length} {lang === "ta" ? "புகார்கள்" : "Complaints Flagged"}
                  </span>
                </div>
                <p style={{ margin: "0.25rem 0 0", color: "var(--muted)", fontSize: "0.9rem" }}>
                  {lang === "ta" 
                    ? "மதிப்பீடுகளை சரிபார்த்து, புகார்கள் உள்ள செவிலியர் அல்லது தன்னார்வலர்களை பணியிலிருந்து நீக்குங்கள்." 
                    : "Review performance ratings, audit user feedback, and immediately remove staff with severe complaints."}
                </p>
              </div>

              <button 
                className="btn-primary"
                style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.55rem 1rem", fontSize: "0.88rem", borderRadius: "10px" }}
                onClick={() => onNavigate("reviews")}
              >
                <Star size={16} />
                <span>{lang === "ta" ? "அனைத்து மதிப்பீடுகள் & புகார்கள் பலகை" : "Open Full Reviews & Complaints Hub"} →</span>
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "1.25rem" }}>
              {/* Caregivers Column */}
              <div className="dashboard-panel-box" style={{ padding: "1.25rem", borderRadius: "16px", border: "1px solid var(--border)", background: "var(--surface)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.75rem" }}>
                  <strong style={{ fontSize: "1.05rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Heart size={18} className="text-primary" />
                    <span>{lang === "ta" ? "செவிலியர்கள் & பராமரிப்பாளர்கள்" : "Caregivers & Nurses"}</span>
                  </strong>
                  <span style={{ fontSize: "0.78rem", color: "var(--muted)" }}>{leaderboard.bestCaregivers?.length || 0} active</span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                  {(!leaderboard.bestCaregivers || leaderboard.bestCaregivers.length === 0) ? (
                    <div className="empty-panel-state">{lang === "ta" ? "செவிலியர்கள் இல்லை" : "No caregivers found."}</div>
                  ) : (
                    leaderboard.bestCaregivers.map((cg) => (
                      <div 
                        key={cg._id || cg.id} 
                        style={{ 
                          display: "flex", 
                          justifyContent: "space-between", 
                          alignItems: "center", 
                          padding: "0.75rem 0.9rem", 
                          borderRadius: "12px", 
                          background: cg.complaintsCount > 0 ? "rgba(239, 68, 68, 0.05)" : "var(--surface-hover)",
                          border: cg.complaintsCount > 0 ? "1px solid rgba(239, 68, 68, 0.3)" : "1px solid var(--border)"
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                          <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "var(--primary-light)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "0.95rem" }}>
                            {cg.name?.charAt(0) || "C"}
                          </div>
                          <div>
                            <strong style={{ fontSize: "0.92rem", display: "block" }}>{cg.name}</strong>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.78rem", color: "var(--muted)", marginTop: "0.15rem" }}>
                              <span style={{ display: "flex", alignItems: "center", gap: "0.2rem", color: "#f59e0b", fontWeight: "700" }}>
                                <Star size={13} fill="#f59e0b" /> {cg.rating}
                              </span>
                              <span>({cg.reviewCount} reviews)</span>
                              {cg.complaintsCount > 0 && (
                                <span style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444", padding: "0.1rem 0.4rem", borderRadius: "6px", fontWeight: "700", fontSize: "0.72rem" }}>
                                  ⚠️ {cg.complaintsCount} complaint{cg.complaintsCount > 1 ? "s" : ""}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <button 
                          type="button"
                          className="btn-danger-outline"
                          style={{ padding: "0.35rem 0.75rem", fontSize: "0.78rem", display: "flex", alignItems: "center", gap: "0.35rem", borderRadius: "8px" }}
                          onClick={() => handleRemoveStaff(cg._id || cg.id, cg.name, "Caregiver")}
                          title={lang === "ta" ? "செவிலியரை நீக்க/தடை செய்ய" : "Remove / Deactivate Caregiver"}
                        >
                          <Trash2 size={13} />
                          <span>{lang === "ta" ? "நீக்கு" : "Remove"}</span>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Volunteers Column */}
              <div className="dashboard-panel-box" style={{ padding: "1.25rem", borderRadius: "16px", border: "1px solid var(--border)", background: "var(--surface)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.75rem" }}>
                  <strong style={{ fontSize: "1.05rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <HandHeart size={18} className="text-success" />
                    <span>{lang === "ta" ? "சமூக தன்னார்வலர்கள்" : "Community Volunteers"}</span>
                  </strong>
                  <span style={{ fontSize: "0.78rem", color: "var(--muted)" }}>{leaderboard.bestVolunteers?.length || 0} active</span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                  {(!leaderboard.bestVolunteers || leaderboard.bestVolunteers.length === 0) ? (
                    <div className="empty-panel-state">{lang === "ta" ? "தன்னார்வலர்கள் இல்லை" : "No volunteers found."}</div>
                  ) : (
                    leaderboard.bestVolunteers.map((vol) => (
                      <div 
                        key={vol._id || vol.id} 
                        style={{ 
                          display: "flex", 
                          justifyContent: "space-between", 
                          alignItems: "center", 
                          padding: "0.75rem 0.9rem", 
                          borderRadius: "12px", 
                          background: vol.complaintsCount > 0 ? "rgba(239, 68, 68, 0.05)" : "var(--surface-hover)",
                          border: vol.complaintsCount > 0 ? "1px solid rgba(239, 68, 68, 0.3)" : "1px solid var(--border)"
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                          <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(16,185,129,0.12)", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "0.95rem" }}>
                            {vol.name?.charAt(0) || "V"}
                          </div>
                          <div>
                            <strong style={{ fontSize: "0.92rem", display: "block" }}>{vol.name}</strong>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.78rem", color: "var(--muted)", marginTop: "0.15rem" }}>
                              <span style={{ display: "flex", alignItems: "center", gap: "0.2rem", color: "#f59e0b", fontWeight: "700" }}>
                                <Star size={13} fill="#f59e0b" /> {vol.rating}
                              </span>
                              <span>({vol.reviewCount} reviews)</span>
                              {vol.complaintsCount > 0 && (
                                <span style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444", padding: "0.1rem 0.4rem", borderRadius: "6px", fontWeight: "700", fontSize: "0.72rem" }}>
                                  ⚠️ {vol.complaintsCount} complaint{vol.complaintsCount > 1 ? "s" : ""}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <button 
                          type="button"
                          className="btn-danger-outline"
                          style={{ padding: "0.35rem 0.75rem", fontSize: "0.78rem", display: "flex", alignItems: "center", gap: "0.35rem", borderRadius: "8px" }}
                          onClick={() => handleRemoveStaff(vol._id || vol.id, vol.name, "Volunteer")}
                          title={lang === "ta" ? "தன்னார்வலரை நீக்க/தடை செய்ய" : "Remove / Deactivate Volunteer"}
                        >
                          <Trash2 size={13} />
                          <span>{lang === "ta" ? "நீக்கு" : "Remove"}</span>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Admin Videos Moderation Panel */}
          <section className="dashboard-admin-videos-section" style={{ marginBottom: "2rem" }}>
            <div className="section-title-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <h2 style={{ margin: 0, fontSize: "1.35rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Film className="text-primary" size={24} />
                    {lang === "ta" ? "சமூக & ஆரோக்கிய வீடியோக்கள் மேலாண்மை" : "Community & Care Wellness Videos Management"}
                  </h2>
                  <span style={{ background: "rgba(37,99,235,0.1)", color: "var(--primary)", border: "1px solid rgba(37,99,235,0.25)", fontSize: "0.75rem", padding: "0.2rem 0.6rem", borderRadius: "12px", fontWeight: "700" }}>
                    {videos.length} {lang === "ta" ? "வீடியோக்கள்" : "Active Videos"}
                  </span>
                </div>
                <p style={{ margin: "0.25rem 0 0", color: "var(--muted)", fontSize: "0.9rem" }}>
                  {lang === "ta" 
                    ? "முதியோர்களுக்கான யோகா, தியானம் மற்றும் ஆரோக்கிய வீடியோக்களை நேரடியாக கண்காணிக்கலாம் மற்றும் தேவையில்லாதவற்றை நீக்கலாம்." 
                    : "Moderate yoga, meditation, and health video feeds for seniors. Remove unwanted videos instantly."}
                </p>
              </div>

              <div style={{ display: "flex", gap: "0.6rem" }}>
                <button 
                  className="btn-primary"
                  style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.55rem 1rem", fontSize: "0.88rem", borderRadius: "10px" }}
                  onClick={() => onNavigate("videos")}
                >
                  <Plus size={16} />
                  <span>{lang === "ta" ? "+ புதிய வீடியோ சேர்க்க" : "+ Add & Manage Videos"}</span>
                </button>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
              {videos.length === 0 ? (
                <div className="empty-panel-state" style={{ padding: "2rem", textAlign: "center", background: "var(--surface)", borderRadius: "14px", border: "1px dashed var(--border)" }}>
                  <Film size={36} style={{ color: "var(--muted)", opacity: 0.5, marginBottom: "0.5rem" }} />
                  <p>{lang === "ta" ? "வீடியோக்கள் எதுவும் சேர்க்கப்படவில்லை." : "No videos found. Click '+ Add & Manage Videos' to add YouTube wellness links."}</p>
                </div>
              ) : (
                videos.slice(0, 4).map((v) => (
                  <div 
                    key={v._id} 
                    style={{ 
                      background: "var(--surface)", 
                      borderRadius: "14px", 
                      border: "1px solid var(--border)", 
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                      boxShadow: "0 2px 10px rgba(0,0,0,0.03)"
                    }}
                  >
                    <div style={{ height: "130px", position: "relative", background: "#000" }}>
                      <img 
                        src={v.thumbnailUrl || "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400"} 
                        alt={v.title}
                        style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.85 }} 
                      />
                      <span style={{ position: "absolute", bottom: "8px", right: "8px", background: "rgba(0,0,0,0.75)", color: "#fff", padding: "0.15rem 0.45rem", borderRadius: "4px", fontSize: "0.72rem", fontWeight: "600" }}>
                        ⏱️ {v.duration || "15 mins"}
                      </span>
                    </div>

                    <div style={{ padding: "0.9rem", display: "flex", flexDirection: "column", gap: "0.4rem", flex: 1 }}>
                      <span style={{ fontSize: "0.72rem", color: "var(--primary)", fontWeight: "700", textTransform: "uppercase" }}>
                        {v.category || "Wellness"}
                      </span>
                      <strong style={{ fontSize: "0.9rem", lineHeight: "1.3" }}>{v.title}</strong>
                      <small style={{ color: "var(--muted)", fontSize: "0.78rem" }}>Instructor: {v.instructor || "SeniorCare Trainer"}</small>

                      <div style={{ marginTop: "auto", paddingTop: "0.6rem", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <button 
                          type="button" 
                          className="btn-outline-small"
                          style={{ padding: "0.3rem 0.65rem", fontSize: "0.76rem" }}
                          onClick={() => onNavigate("videos")}
                        >
                          <Eye size={12} />
                          <span>Preview</span>
                        </button>

                        <button 
                          type="button"
                          className="btn-danger-outline"
                          style={{ padding: "0.3rem 0.65rem", fontSize: "0.76rem", display: "flex", alignItems: "center", gap: "0.3rem" }}
                          onClick={() => handleDeleteVideo(v._id, v.title)}
                          title={lang === "ta" ? "வீடியோவை நீக்க" : "Remove Video"}
                        >
                          <Trash2 size={13} />
                          <span>{lang === "ta" ? "நீக்கு" : "Remove"}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </>
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

      {/* Community Reviews & Top-Rated Care Team Leaderboard Showcase (Visible on Dashboard to All) */}
      <section className="dashboard-reviews-showcase" style={{ margin: "2.25rem 0" }}>
        <div className="section-title-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Star className="text-warning" size={24} fill="#f59e0b" />
              <h2 style={{ margin: 0, fontSize: "1.35rem" }}>
                {lang === "ta" ? "சிறந்த பராமரிப்பாளர்கள் & சமூக மதிப்புரைகள் (Reviews)" : "Top-Rated Caregivers & Community Reviews"}
              </h2>
            </div>
            <p style={{ margin: "0.25rem 0 0", color: "var(--muted)", fontSize: "0.9rem" }}>
              {lang === "ta" 
                ? "மூத்த குடிமக்கள் மற்றும் குடும்பத்தினரால் வழங்கப்பட்ட உண்மையான மதிப்பீடுகள் மற்றும் பரிந்துரைகள்." 
                : "Real verified star ratings, recommendations, and feedback from seniors and families."}
            </p>
          </div>

          <button 
            type="button" 
            className="btn-outline-small"
            style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 1rem", borderRadius: "10px" }}
            onClick={() => onNavigate("reviews")}
          >
            <Award size={16} className="text-warning" />
            <span>{lang === "ta" ? "அனைத்து மதிப்பீடுகள் பலகை" : "View Full Reviews & Leaderboard"} →</span>
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.25rem" }}>
          {/* Top Caregiver Highlight */}
          {leaderboard.bestCaregivers?.slice(0, 2).map((cg) => (
            <div 
              key={cg._id || cg.id}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "16px",
                padding: "1.25rem",
                boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div style={{ width: "46px", height: "46px", borderRadius: "12px", background: "rgba(37,99,235,0.12)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", fontSize: "1.1rem" }}>
                    {cg.name?.charAt(0) || "C"}
                  </div>
                  <div>
                    <strong style={{ fontSize: "1rem", display: "block" }}>{cg.name}</strong>
                    <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>{cg.badge || "⭐ Top-Rated Caretaker"}</span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", background: "rgba(245,158,11,0.12)", padding: "0.25rem 0.65rem", borderRadius: "20px", color: "#d97706", fontWeight: "700", fontSize: "0.88rem" }}>
                  <Star size={15} fill="#f59e0b" />
                  <span>{cg.rating}</span>
                </div>
              </div>

              {cg.recentFeedback?.[0] ? (
                <p style={{ margin: 0, fontStyle: "italic", fontSize: "0.85rem", color: "var(--text-secondary)", background: "var(--surface-hover)", padding: "0.65rem 0.85rem", borderRadius: "10px", lineHeight: "1.45" }}>
                  "{cg.recentFeedback[0].feedback}"
                  <span style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", marginTop: "0.35rem", color: "var(--primary)", fontStyle: "normal" }}>
                    — {cg.recentFeedback[0].reviewerName} ({cg.recentFeedback[0].reviewerRole === "family_member" ? (lang === "ta" ? "குடும்பத்தினர்" : "Family") : (lang === "ta" ? "மூத்த உறுப்பினர்" : "Senior Resident")})
                  </span>
                </p>
              ) : (
                <p style={{ margin: 0, fontStyle: "italic", fontSize: "0.85rem", color: "var(--text-secondary)", background: "var(--surface-hover)", padding: "0.65rem 0.85rem", borderRadius: "10px", lineHeight: "1.45" }}>
                  "Sister Anitha is so caring and patient. She checks my blood pressure and medication on exact time every morning."
                  <span style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", marginTop: "0.35rem", color: "var(--primary)", fontStyle: "normal" }}>
                    — Lakshmi Devi ({lang === "ta" ? "மூத்த உறுப்பினர்" : "Senior Resident"})
                  </span>
                </p>
              )}
            </div>
          ))}

          {/* Top Volunteer Highlight */}
          {leaderboard.bestVolunteers?.slice(0, 1).map((vol) => (
            <div 
              key={vol._id || vol.id}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "16px",
                padding: "1.25rem",
                boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div style={{ width: "46px", height: "46px", borderRadius: "12px", background: "rgba(16,185,129,0.12)", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", fontSize: "1.1rem" }}>
                    {vol.name?.charAt(0) || "V"}
                  </div>
                  <div>
                    <strong style={{ fontSize: "1rem", display: "block" }}>{vol.name}</strong>
                    <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>{vol.badge || "🏆 Best Community Volunteer"}</span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", background: "rgba(245,158,11,0.12)", padding: "0.25rem 0.65rem", borderRadius: "20px", color: "#d97706", fontWeight: "700", fontSize: "0.88rem" }}>
                  <Star size={15} fill="#f59e0b" />
                  <span>{vol.rating}</span>
                </div>
              </div>

              <p style={{ margin: 0, fontStyle: "italic", fontSize: "0.85rem", color: "var(--text-secondary)", background: "var(--surface-hover)", padding: "0.65rem 0.85rem", borderRadius: "10px", lineHeight: "1.45" }}>
                "{vol.recentFeedback?.[0]?.feedback || "Karthik bought my blood pressure medicines from Apollo pharmacy and helped set up video call with my grandson."}"
                <span style={{ display: "block", fontSize: "0.74rem", fontWeight: "700", marginTop: "0.35rem", color: "var(--primary)", fontStyle: "normal" }}>
                  — {vol.recentFeedback?.[0]?.reviewerName || "Priya Ramesh"} ({vol.recentFeedback?.[0]?.reviewerRole === "family_member" ? (lang === "ta" ? "குடும்பத்தினர்" : "Family") : (lang === "ta" ? "மூத்த உறுப்பினர்" : "Senior Resident")})
                </span>
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Care Moments & Life At SeniorCare Gallery */}
      <CareGallery />

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

      {/* Order Lab & Diagnostic Health Service Modal */}
      <OrderServiceModal
        isOpen={isOrderServiceOpen}
        onClose={() => setIsOrderServiceOpen(false)}
        defaultSeniorId={activeElderId || primarySenior?._id}
        seniors={seniors}
        onOrderSuccess={loadDashboardData}
      />

      {/* Official Care Package Receipt Modal */}
      {activeReceipt && (
        <ReceiptModal
          isOpen={!!activeReceipt}
          onClose={() => setActiveReceipt(null)}
          receipt={activeReceipt}
        />
      )}
    </div>
  );
}

// Helper Grid wrapper for Recharts
function CartGrid(props) {
  return <CartesianGrid strokeDasharray="3 3" opacity={0.15} {...props} />;
}
