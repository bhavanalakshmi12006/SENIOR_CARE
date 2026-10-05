import React, { useState, useEffect } from "react";
import { History, Users, AlertCircle, Calendar, CreditCard, HandHeart, ChevronRight, Clock } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../api";

export default function RecentlyAccessedView({ onNavigate }) {
  const { t, lang } = useAuth();
  const [recents, setRecents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/search/recently-accessed")
      .then((res) => {
        setRecents(res.data.recentlyAccessed || []);
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  const getItemIcon = (type) => {
    switch (type) {
      case "senior": return <Users size={20} className="text-primary" />;
      case "emergency": return <AlertCircle size={20} className="text-danger" />;
      case "appointment": return <Calendar size={20} className="text-info" />;
      case "fee": return <CreditCard size={20} className="text-success" />;
      default: return <HandHeart size={20} className="text-warning" />;
    }
  };

  const handleOpenItem = (item) => {
    if (item.itemType === "senior") onNavigate("seniors", item.itemId);
    else if (item.itemType === "emergency") onNavigate("emergency", item.itemId);
    else if (item.itemType === "appointment") onNavigate("appointments");
    else if (item.itemType === "fee") onNavigate("fees");
    else if (item.itemType === "assistance") onNavigate("assistance");
  };

  return (
    <div className="view-page-container">
      <div className="view-header-bar">
        <div>
          <h2>{t.recentlyAccessed}</h2>
          <p>{lang === "ta" ? "நீங்கள் சமீபத்தில் பார்வையிட்ட பதிவுகள் மற்றும் கோப்புகள்" : "Quickly jump back into senior profiles, emergencies, and medical records"}</p>
        </div>
      </div>

      <div className="recently-accessed-timeline">
        {recents.length === 0 ? (
          <div className="empty-panel-state">
            <History size={32} className="muted-icon" />
            <p>{lang === "ta" ? "சமீபத்தில் பார்த்த பதிவுகள் எதுவும் இல்லை." : "No recently viewed records yet. Browse seniors, emergencies or appointments to see them here."}</p>
          </div>
        ) : (
          recents.map((item) => (
            <div
              key={item._id}
              className="recent-timeline-item"
              onClick={() => handleOpenItem(item)}
            >
              <div className="timeline-icon-box">
                {getItemIcon(item.itemType)}
              </div>
              <div className="timeline-content-box">
                <div className="timeline-item-title-row">
                  <strong>{item.title}</strong>
                  <span className="timeline-type-pill">{item.itemType.toUpperCase()}</span>
                </div>
                {item.subtitle && <p className="timeline-subtitle">{item.subtitle}</p>}
                <small className="timeline-time">
                  <Clock size={12} /> {new Date(item.accessedAt).toLocaleString()}
                </small>
              </div>
              <ChevronRight size={18} className="timeline-arrow" />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
