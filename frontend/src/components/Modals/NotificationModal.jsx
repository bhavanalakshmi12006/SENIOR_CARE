import React, { useState } from "react";
import { 
  Bell, X, ShieldAlert, CheckCircle2, Calendar, CreditCard, 
  HandHeart, Trash2, Check, ExternalLink, Sparkles, AlertCircle,
  Send, MessageCircle, Mail, Phone
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import api from "../../api";

export default function NotificationModal({ 
  isOpen, 
  onClose, 
  notifications = [], 
  selectedNotification, 
  onSelectNotification,
  onMarkRead, 
  onMarkAllRead, 
  onDeleteNotification,
  onNavigate 
}) {
  const { lang, t, user } = useAuth();
  const { showToast } = useToast();
  const [dispatchingChannel, setDispatchingChannel] = useState(null);

  if (!isOpen) return null;

  const handleForwardAlert = async (n, channel) => {
    if (!n) return;
    setDispatchingChannel(channel);
    try {
      await api.post("/notifications/dispatch", {
        title: n.title,
        message: n.message,
        channels: [channel],
        type: n.type,
        priority: n.priority,
        seniorId: n.seniorId
      });
      showToast(
        lang === "ta"
          ? `${channel.toUpperCase()} வழியாக அறிவிப்பு வெற்றிகரமாக அனுப்பப்பட்டது!`
          : `Alert successfully dispatched via ${channel.toUpperCase()}!`,
        "success"
      );
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to dispatch", "error");
    } finally {
      setDispatchingChannel(null);
    }
  };

  const handleForwardAll = async (n) => {
    if (!n) return;
    setDispatchingChannel("all");
    try {
      await api.post("/notifications/dispatch", {
        title: n.title,
        message: n.message,
        channels: ["whatsapp", "sms", "email"],
        type: n.type,
        priority: n.priority,
        seniorId: n.seniorId
      });
      showToast(
        lang === "ta"
          ? "WhatsApp, SMS மற்றும் Email ஆகிய மூன்றிலும் எச்சரிக்கை அனுப்பப்பட்டது!"
          : "Dispatched simultaneously to WhatsApp, SMS & Google Email!",
        "success"
      );
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to dispatch", "error");
    } finally {
      setDispatchingChannel(null);
    }
  };

  // Breakdown counts by type
  const counts = {
    total: notifications.length,
    unread: notifications.filter((n) => !n.readAt).length,
    emergency: notifications.filter((n) => n.type === "emergency" || n.priority === "high" || n.priority === "critical").length,
    checkin: notifications.filter((n) => n.type === "checkin" || n.title?.toLowerCase().includes("check-in") || n.title?.toLowerCase().includes("safe")).length,
    appointment: notifications.filter((n) => n.type === "appointment" || n.title?.toLowerCase().includes("appointment")).length,
    fee: notifications.filter((n) => n.type === "fee" || n.title?.toLowerCase().includes("fee") || n.title?.toLowerCase().includes("payment")).length,
    assistance: notifications.filter((n) => n.type === "assistance" || n.title?.toLowerCase().includes("assistance") || n.title?.toLowerCase().includes("help")).length
  };

  const activeNotif = selectedNotification || notifications[0] || null;

  const getTypeIcon = (n) => {
    const text = (n?.type + " " + n?.title).toLowerCase();
    if (text.includes("emergency") || n?.priority === "critical" || n?.priority === "high") {
      return <ShieldAlert size={18} className="text-danger" />;
    }
    if (text.includes("check-in") || text.includes("safe")) {
      return <CheckCircle2 size={18} className="text-success" />;
    }
    if (text.includes("appointment") || text.includes("doctor")) {
      return <Calendar size={18} className="text-info" />;
    }
    if (text.includes("fee") || text.includes("pay")) {
      return <CreditCard size={18} className="text-warning" />;
    }
    return <Bell size={18} className="text-primary" />;
  };

  const handleActionClick = (n) => {
    if (!n) return;
    if (n.link) {
      onNavigate(n.link.replace("/", ""));
    } else {
      const text = (n.type + " " + n.title).toLowerCase();
      if (text.includes("emergency")) onNavigate("emergency");
      else if (text.includes("appointment")) onNavigate("appointments");
      else if (text.includes("fee")) onNavigate("fees");
      else if (text.includes("check-in") || text.includes("safe")) onNavigate("safety");
      else onNavigate("dashboard");
    }
    onClose();
  };

  return (
    <div className="modal-backdrop-overlay" onClick={onClose}>
      <div className="postcard-modal-container notif-postcard-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Airmail Border Strip */}
        <div className="postcard-airmail-strip notif-strip" />

        {/* Close Button */}
        <button className="postcard-close-btn" onClick={onClose} aria-label="Close Notifications">
          <X size={20} />
        </button>

        <div className="postcard-inner-body">
          {/* Top Title & Postal Stamp */}
          <div className="postcard-top-row">
            <div>
              <div className="notif-modal-eyebrow">
                <Bell size={16} />
                <span>{lang === "ta" ? "அறிவிப்புகள் தகவல் மையம்" : "Notification Intelligence Hub"}</span>
              </div>
              <h2 className="postcard-title">{t.notificationPostcard || "Notification Center"}</h2>
              <p className="postcard-subtitle">
                {lang === "ta" 
                  ? `மொத்தம் ${counts.total} அறிவிப்புகள் உள்ளன (${counts.unread} படிக்காதவை)`
                  : `Total ${counts.total} notifications logged (${counts.unread} unread)`}
              </p>
            </div>

            <div className="postcard-stamp-box notif-stamp">
              <div className="stamp-inner">
                <span className="stamp-icon">🔔</span>
                <span className="stamp-text">OFFICIAL NOTICE</span>
                <span className="stamp-postmark">{counts.unread} UNREAD</span>
              </div>
            </div>
          </div>

          {/* Type Breakdown Badges (answering: இத்தனை notifications இருக்கு, எந்த மாதிரி notifications) */}
          <div className="notif-types-breakdown-bar">
            <span className="breakdown-label">{lang === "ta" ? "அறிவிப்பு வகைகள்:" : "Notification Types:"}</span>
            <div className="breakdown-chips-list">
              <span className="breakdown-chip danger">🚨 {counts.emergency} {lang === "ta" ? "அவசரநிலை" : "Emergencies"}</span>
              <span className="breakdown-chip success">✓ {counts.checkin} {lang === "ta" ? "பாதுகாப்பு" : "Safety"}</span>
              <span className="breakdown-chip info">📅 {counts.appointment} {lang === "ta" ? "சந்திப்புகள்" : "Appointments"}</span>
              <span className="breakdown-chip warning">💳 {counts.fee} {lang === "ta" ? "கட்டணங்கள்" : "Fees"}</span>
              {counts.assistance > 0 && (
                <span className="breakdown-chip purple">🤝 {counts.assistance} {lang === "ta" ? "உதவிகள்" : "Assistance"}</span>
              )}
            </div>
          </div>

          <div className="postcard-divider-line" />

          {/* Two Pane Layout: Left is Selected Postcard, Right is Clickable Notification Cards */}
          <div className="postcard-grid notif-grid">
            {/* Left Pane: Detailed Postcard for Selected Notification */}
            <div className="postcard-left-col">
              <h4 className="postcard-col-title">
                {lang === "ta" ? "தேர்ந்தெடுக்கப்பட்ட அறிவிப்பு தபால் அட்டை" : "Selected Notice Card"}
              </h4>

              {activeNotif ? (
                <div className="active-notif-card-box">
                  <div className="active-notif-header">
                    <span className="active-notif-type-icon">{getTypeIcon(activeNotif)}</span>
                    <div>
                      <h3 className="active-notif-title">{activeNotif.title}</h3>
                      <small className="active-notif-date">
                        {new Date(activeNotif.createdAt).toLocaleString(lang === "ta" ? "ta-IN" : "en-IN")}
                      </small>
                    </div>
                  </div>

                  <div className="active-notif-message-body">
                    <p>{activeNotif.message}</p>
                  </div>

                  <div className="active-notif-meta-tags">
                    <span className={`meta-tag priority-${activeNotif.priority}`}>
                      {lang === "ta" ? "முன்னுரிமை: " : "Priority: "} {activeNotif.priority?.toUpperCase() || "NORMAL"}
                    </span>
                    <span className={`meta-tag status-${activeNotif.readAt ? "read" : "unread"}`}>
                      {activeNotif.readAt 
                        ? (lang === "ta" ? "படிக்கப்பட்டது" : "Read") 
                        : (lang === "ta" ? "புதிய அறிவிப்பு" : "Unread")}
                    </span>
                  </div>

                  {/* Instant Multi-Channel Dispatch Bar (WhatsApp, SMS, Google Mail) */}
                  <div className="notif-forward-channels-bar" style={{ marginTop: "0.85rem", padding: "0.75rem", background: "var(--surface-hover)", borderRadius: "10px", border: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                      <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                        <Send size={13} className="text-primary" />
                        {lang === "ta" ? "நேரலை அறிவிப்பு அனுப்பு:" : "Direct Alert Dispatch:"}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleForwardAll(activeNotif)}
                        disabled={dispatchingChannel !== null}
                        style={{ fontSize: "0.72rem", background: "var(--primary)", color: "#fff", border: "none", padding: "0.2rem 0.55rem", borderRadius: "6px", cursor: "pointer", fontWeight: 600 }}
                      >
                        {dispatchingChannel === "all" ? "..." : (lang === "ta" ? "அனைத்திலும் அனுப்பு (All 3)" : "Send to All (WA/SMS/Mail)")}
                      </button>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.4rem" }}>
                      <button
                        type="button"
                        onClick={() => handleForwardAlert(activeNotif, "whatsapp")}
                        disabled={dispatchingChannel !== null}
                        style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.3rem", padding: "0.4rem", background: "rgba(16,185,129,0.12)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "7px", fontSize: "0.76rem", fontWeight: 700, cursor: "pointer" }}
                      >
                        <span>📱</span> WhatsApp
                      </button>
                      <button
                        type="button"
                        onClick={() => handleForwardAlert(activeNotif, "sms")}
                        disabled={dispatchingChannel !== null}
                        style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.3rem", padding: "0.4rem", background: "rgba(37,99,235,0.12)", color: "#2563eb", border: "1px solid rgba(37,99,235,0.3)", borderRadius: "7px", fontSize: "0.76rem", fontWeight: 700, cursor: "pointer" }}
                      >
                        <span>💬</span> SMS
                      </button>
                      <button
                        type="button"
                        onClick={() => handleForwardAlert(activeNotif, "email")}
                        disabled={dispatchingChannel !== null}
                        style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.3rem", padding: "0.4rem", background: "rgba(234,67,53,0.12)", color: "#ea4335", border: "1px solid rgba(234,67,53,0.3)", borderRadius: "7px", fontSize: "0.76rem", fontWeight: 700, cursor: "pointer" }}
                      >
                        <span>📧</span> Email
                      </button>
                    </div>
                  </div>

                  <div className="active-notif-actions" style={{ marginTop: "0.85rem" }}>
                    <button 
                      className="btn-postcard-action primary"
                      onClick={() => handleActionClick(activeNotif)}
                    >
                      <ExternalLink size={16} />
                      <span>{t.openRecord || "Open View"}</span>
                    </button>

                    {!activeNotif.readAt && onMarkRead && (
                      <button 
                        className="btn-postcard-action check"
                        onClick={() => onMarkRead(activeNotif._id)}
                      >
                        <Check size={16} />
                        <span>{lang === "ta" ? "படித்ததாகக் குறி" : "Mark Read"}</span>
                      </button>
                    )}

                    {onDeleteNotification && (
                      <button 
                        className="btn-postcard-action delete"
                        onClick={() => onDeleteNotification(activeNotif._id)}
                      >
                        <Trash2 size={16} />
                        <span>{t.delete || "Delete"}</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="no-notif-selected">
                  <Bell size={32} className="muted-icon" />
                  <p>{t.noNotifications}</p>
                </div>
              )}
            </div>

            {/* Right Pane: Scrollable Touch/Click Notification Cards */}
            <div className="postcard-right-col notif-right-pane">
              <div className="pane-header-actions">
                <h4 className="postcard-col-title" style={{ margin: 0 }}>
                  {lang === "ta" ? "அனைத்து அறிவிப்புகள் (தொடவும்)" : "Touch Any Notification to View"}
                </h4>
                {counts.unread > 0 && onMarkAllRead && (
                  <button className="mark-all-read-btn" onClick={onMarkAllRead}>
                    {t.markAllRead || "Mark All Read"}
                  </button>
                )}
              </div>

              <div className="notif-touchable-cards-scroll">
                {notifications.length === 0 ? (
                  <div className="empty-notif-box">
                    <p>{t.noNotifications || "No notifications"}</p>
                  </div>
                ) : (
                  notifications.map((item) => {
                    const isSelected = activeNotif?._id === item._id;
                    return (
                      <div
                        key={item._id}
                        className={`touchable-notif-card ${isSelected ? "selected" : ""} ${item.readAt ? "read" : "unread"}`}
                        onClick={() => onSelectNotification && onSelectNotification(item)}
                      >
                        <div className="touch-card-icon">{getTypeIcon(item)}</div>
                        <div className="touch-card-text">
                          <strong className="touch-card-title">{item.title}</strong>
                          <p className="touch-card-snippet">{item.message}</p>
                          <small className="touch-card-time">
                            {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </small>
                        </div>
                        {!item.readAt && <span className="unread-dot" />}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
