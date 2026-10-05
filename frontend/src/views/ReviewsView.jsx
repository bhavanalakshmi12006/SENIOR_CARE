import React, { useState, useEffect } from "react";
import { 
  Star, Heart, HandHeart, Award, ThumbsUp, MessageSquare, 
  Plus, ShieldAlert, CheckCircle2, User, Filter, AlertTriangle, 
  Trash2, X, Send, Sparkles, Phone, Mail, ChevronRight
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import api from "../api";

export default function ReviewsView() {
  const { user, lang, t } = useAuth();
  const { showToast } = useToast();

  const [leaderboard, setLeaderboard] = useState({ bestCaregivers: [], bestVolunteers: [] });
  const [reviews, setReviews] = useState([]);
  const [filterType, setFilterType] = useState("all"); // 'all' | 'caregiver' | 'volunteer' | 'complaints'
  const [loading, setLoading] = useState(true);

  // Review Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [targetType, setTargetType] = useState("caregiver");
  const [targetName, setTargetName] = useState("");
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [isComplaint, setIsComplaint] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const availableTags = [
    "Punctual & Reliable",
    "Gentle & Compassionate",
    "Attentive to Vitals",
    "Polite & Respectful",
    "Excellent Communication",
    "Trustworthy & Safe",
    "Highly Recommended"
  ];

  const loadData = async () => {
    try {
      const [boardRes, revRes] = await Promise.all([
        api.get("/reviews/leaderboard"),
        api.get("/reviews")
      ]);
      setLeaderboard(boardRes.data);
      setReviews(revRes.data.reviews || []);
    } catch (err) {
      console.error("Failed to load reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenReviewModal = (type = "caregiver", name = "") => {
    setTargetType(type);
    setTargetName(name || (type === "caregiver" ? "Anitha Krishnan" : "Karthik Raman"));
    setRating(5);
    setFeedback("");
    setSelectedTags(["Gentle & Compassionate", "Highly Recommended"]);
    setIsComplaint(false);
    setModalOpen(true);
  };

  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!targetName.trim() || !feedback.trim()) {
      showToast("Please provide the person's name and feedback message", "warning");
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post("/reviews", {
        targetType,
        targetName,
        rating,
        feedback,
        tags: selectedTags,
        isComplaint
      });
      showToast(res.data.message, isComplaint ? "warning" : "success");
      setModalOpen(false);
      loadData();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to submit review", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReview = async (id) => {
    if (!window.confirm(lang === "ta" ? "இந்த மதிப்பீட்டை நீக்க விரும்புகிறீர்களா?" : "Delete this review?")) return;
    try {
      await api.delete(`/reviews/${id}`);
      showToast("Review deleted", "info");
      loadData();
    } catch (err) {
      showToast("Failed to delete review", "error");
    }
  };

  const filteredReviews = reviews.filter(r => {
    if (filterType === "caregiver") return r.targetType === "caregiver";
    if (filterType === "volunteer") return r.targetType === "volunteer";
    if (filterType === "complaints") return r.isComplaint || r.rating <= 2;
    return true;
  });

  const isSeniorOrFamily = user?.role === "senior_citizen" || user?.role === "family_member" || user?.role === "admin";

  return (
    <div className="view-page-container">
      {/* Header bar */}
      <div className="view-header-bar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Award className="text-warning" size={26} />
            <h2 style={{ margin: 0 }}>
              {lang === "ta" ? "பராமரிப்பாளர்கள் & தன்னார்வலர்கள் மதிப்பீடுகள்" : "Caregiver & Volunteer Reviews & Ratings"}
            </h2>
          </div>
          <p style={{ margin: "0.25rem 0 0", color: "var(--text-muted)" }}>
            {lang === "ta" 
              ? "முதியோர்கள் மற்றும் குடும்பத்தினரின் உண்மையான நட்சத்திர மதிப்பீடுகள் மற்றும் சிறந்த சேவையாளர்கள் பட்டியல்."
              : "Verified 5-star ratings, testimonials, and top-rated care champions."}
          </p>
        </div>

        {isSeniorOrFamily && (
          <button 
            className="btn-primary"
            onClick={() => handleOpenReviewModal("caregiver")}
            style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.65rem 1.25rem", borderRadius: "10px", fontWeight: "600" }}
          >
            <Star size={18} />
            <span>{lang === "ta" ? "⭐ மதிப்பீடு / கருத்து எழுதுக" : "⭐ Rate Caregiver or Volunteer"}</span>
          </button>
        )}
      </div>

      {/* Top Champions / Leaderboard Section */}
      <div className="leaderboard-showcase-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "1.25rem", marginBottom: "2rem" }}>
        {/* Best Caretakers Card */}
        <div className="leaderboard-column-card" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", padding: "1.25rem", boxShadow: "0 4px 16px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "1.4rem" }}>👩‍⚕️</span>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "700" }}>
                  {lang === "ta" ? "சிறந்த பராமரிப்பாளர்கள் (Best Caretakers)" : "Top-Rated Caregivers & Nurses"}
                </h3>
                <small style={{ color: "var(--text-muted)" }}>{lang === "ta" ? "அதிக நன்மதிப்பீடு பெற்றவர்கள்" : "Ranked by verified elder ratings"}</small>
              </div>
            </div>
            <span style={{ background: "rgba(37,99,235,0.1)", color: "var(--primary)", padding: "0.2rem 0.6rem", borderRadius: "12px", fontSize: "0.75rem", fontWeight: "700" }}>
              ⭐ High Rated
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {leaderboard.bestCaregivers?.map((cg, idx) => (
              <div 
                key={cg.id || idx} 
                style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "space-between", 
                  padding: "0.85rem", 
                  borderRadius: "12px", 
                  background: idx === 0 ? "rgba(245,158,11,0.08)" : "var(--surface-hover)",
                  border: idx === 0 ? "1px solid rgba(245,158,11,0.3)" : "1px solid var(--border)"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div style={{ 
                    width: 32, height: 32, borderRadius: "50%", 
                    background: idx === 0 ? "#f59e0b" : "var(--primary)", 
                    color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", 
                    fontWeight: "800", fontSize: "0.85rem" 
                  }}>
                    #{idx + 1}
                  </div>
                  <div>
                    <strong style={{ fontSize: "0.95rem", display: "block" }}>{cg.name}</strong>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{cg.badge}</span>
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", color: "#f59e0b", fontWeight: "700", fontSize: "1.05rem" }}>
                    <Star size={16} fill="#f59e0b" />
                    <span>{cg.rating}</span>
                  </div>
                  <small style={{ color: "var(--text-muted)", fontSize: "0.72rem" }}>
                    {cg.reviewCount} {lang === "ta" ? "மதிப்பீடுகள்" : "reviews"}
                  </small>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Best Volunteers Card */}
        <div className="leaderboard-column-card" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", padding: "1.25rem", boxShadow: "0 4px 16px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "1.4rem" }}>🤝</span>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "700" }}>
                  {lang === "ta" ? "சிறந்த தன்னார்வலர்கள் (Best Volunteers)" : "Best Community Volunteers"}
                </h3>
                <small style={{ color: "var(--text-muted)" }}>{lang === "ta" ? "சேவை மற்றும் அர்ப்பணிப்பு" : "Community assistance heroes"}</small>
              </div>
            </div>
            <span style={{ background: "rgba(16,185,129,0.1)", color: "#10b981", padding: "0.2rem 0.6rem", borderRadius: "12px", fontSize: "0.75rem", fontWeight: "700" }}>
              🏆 Champions
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {leaderboard.bestVolunteers?.map((vol, idx) => (
              <div 
                key={vol.id || idx} 
                style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "space-between", 
                  padding: "0.85rem", 
                  borderRadius: "12px", 
                  background: idx === 0 ? "rgba(16,185,129,0.08)" : "var(--surface-hover)",
                  border: idx === 0 ? "1px solid rgba(16,185,129,0.3)" : "1px solid var(--border)"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div style={{ 
                    width: 32, height: 32, borderRadius: "50%", 
                    background: idx === 0 ? "#10b981" : "#6366f1", 
                    color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", 
                    fontWeight: "800", fontSize: "0.85rem" 
                  }}>
                    #{idx + 1}
                  </div>
                  <div>
                    <strong style={{ fontSize: "0.95rem", display: "block" }}>{vol.name}</strong>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{vol.badge}</span>
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", color: "#f59e0b", fontWeight: "700", fontSize: "1.05rem" }}>
                    <Star size={16} fill="#f59e0b" />
                    <span>{vol.rating}</span>
                  </div>
                  <small style={{ color: "var(--text-muted)", fontSize: "0.72rem" }}>
                    {vol.reviewCount} {lang === "ta" ? "மதிப்பீடுகள்" : "reviews"}
                  </small>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filter Tabs for Reviews Stream */}
      <div className="view-filter-bar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1rem" }}>
        <div className="filter-pills-row">
          <button 
            className={`filter-pill ${filterType === "all" ? "active" : ""}`}
            onClick={() => setFilterType("all")}
          >
            {lang === "ta" ? "அனைத்து விமர்சனங்கள்" : "All Reviews"} ({reviews.length})
          </button>
          <button 
            className={`filter-pill ${filterType === "caregiver" ? "active" : ""}`}
            onClick={() => setFilterType("caregiver")}
          >
            👩‍⚕️ {lang === "ta" ? "பராமரிப்பாளர்" : "Caregivers"}
          </button>
          <button 
            className={`filter-pill ${filterType === "volunteer" ? "active" : ""}`}
            onClick={() => setFilterType("volunteer")}
          >
            🤝 {lang === "ta" ? "தன்னார்வலர்" : "Volunteers"}
          </button>
          <button 
            className={`filter-pill ${filterType === "complaints" ? "active" : ""}`}
            onClick={() => setFilterType("complaints")}
          >
            ⚠️ {lang === "ta" ? "புகார்கள் & சரிபார்ப்புகள்" : "Complaints & Flags"} ({reviews.filter(r => r.isComplaint || r.rating <= 2).length})
          </button>
        </div>

        {isSeniorOrFamily && (
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button 
              className="btn-outline-small"
              onClick={() => handleOpenReviewModal("caregiver")}
            >
              + {lang === "ta" ? "பராமரிப்பாளரை மதிப்பிடவும்" : "Review Caregiver"}
            </button>
            <button 
              className="btn-outline-small"
              onClick={() => handleOpenReviewModal("volunteer")}
            >
              + {lang === "ta" ? "தன்னார்வலரை மதிப்பிடவும்" : "Review Volunteer"}
            </button>
          </div>
        )}
      </div>

      {/* Reviews Cards Stream */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "1rem" }}>
        {filteredReviews.length === 0 ? (
          <div className="empty-panel-state col-span-full" style={{ padding: "3rem", textAlign: "center" }}>
            <MessageSquare size={36} style={{ color: "var(--text-muted)", opacity: 0.5, marginBottom: "0.5rem" }} />
            <p>{lang === "ta" ? "மதிப்பீடுகள் எதுவும் இன்னும் பதிவு செய்யப்படவில்லை." : "No reviews found in this category yet."}</p>
          </div>
        ) : (
          filteredReviews.map((rev) => (
            <div 
              key={rev._id} 
              style={{
                background: "var(--surface)",
                border: rev.isComplaint ? "1px solid rgba(239,68,68,0.3)" : "1px solid var(--border)",
                borderRadius: "14px",
                padding: "1.2rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
                boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                position: "relative"
              }}
            >
              {rev.isComplaint && (
                <div style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", padding: "0.2rem 0.6rem", borderRadius: "6px", fontSize: "0.75rem", fontWeight: "700", display: "inline-flex", alignItems: "center", gap: "0.3rem", alignSelf: "flex-start" }}>
                  <AlertTriangle size={13} />
                  <span>{lang === "ta" ? "நிர்வாகி பார்வைக்கு அனுப்பப்பட்ட புகார்" : "Flagged for Admin Review"}</span>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <span style={{ fontSize: "1.1rem" }}>{rev.targetType === "caregiver" ? "👩‍⚕️" : "🤝"}</span>
                    <strong style={{ fontSize: "1rem" }}>{rev.targetName}</strong>
                  </div>
                  <small style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>
                    {rev.targetType === "caregiver" ? "Caregiver / Nurse" : "Community Volunteer"}
                  </small>
                </div>

                {/* Stars */}
                <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star 
                      key={s} 
                      size={16} 
                      fill={s <= rev.rating ? "#f59e0b" : "transparent"} 
                      stroke="#f59e0b" 
                    />
                  ))}
                  <span style={{ fontWeight: "700", marginLeft: "4px", fontSize: "0.9rem" }}>{rev.rating}.0</span>
                </div>
              </div>

              {/* Feedback text */}
              <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--text-main)", lineHeight: 1.5, background: "var(--surface-hover)", padding: "0.75rem", borderRadius: "8px" }}>
                “{rev.feedback}”
              </p>

              {/* Tags */}
              {rev.tags && rev.tags.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                  {rev.tags.map((tg, i) => (
                    <span key={i} style={{ fontSize: "0.73rem", background: "rgba(37,99,235,0.08)", color: "var(--primary)", padding: "0.15rem 0.5rem", borderRadius: "12px", fontWeight: "600" }}>
                      ✓ {tg}
                    </span>
                  ))}
                </div>
              )}

              {/* Reviewer details & date */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border)", paddingTop: "0.6rem", fontSize: "0.78rem", color: "var(--text-muted)" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                  <User size={13} />
                  <span>{rev.reviewerName} ({rev.reviewerRole === "senior_citizen" ? (lang === "ta" ? "முதியவர்" : "Senior") : (lang === "ta" ? "குடும்பத்தினர்" : "Family")})</span>
                </span>
                <span>{new Date(rev.createdAt).toLocaleDateString()}</span>
              </div>

              {/* Admin or Reviewer Delete */}
              {(user?.role === "admin" || user?._id === rev.reviewerId) && (
                <button 
                  onClick={() => handleDeleteReview(rev._id)}
                  style={{ position: "absolute", top: 10, right: 10, background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
                  title="Delete review"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Review & Rating Submission Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <div className="modal-title-with-icon">
                <Star size={22} className="text-warning" />
                <h3>{lang === "ta" ? "பராமரிப்பாளர் / தன்னார்வலரை மதிப்பிடவும்" : "Submit Rating & Review"}</h3>
              </div>
              <button className="modal-close-icon" onClick={() => setModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="modal-form">
              {/* Type Switcher */}
              <div className="form-group">
                <label>{lang === "ta" ? "யாருக்கு மதிப்பீடு வழங்குகிறீர்கள்? *" : "Select Recipient Type *"}</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                  <button
                    type="button"
                    className={`filter-pill ${targetType === "caregiver" ? "active" : ""}`}
                    onClick={() => {
                      setTargetType("caregiver");
                      setTargetName("Anitha Krishnan");
                    }}
                    style={{ padding: "0.6rem", textAlign: "center", justifyContent: "center" }}
                  >
                    👩‍⚕️ {lang === "ta" ? "பராமரிப்பாளர் (Caregiver)" : "Caregiver / Nurse"}
                  </button>
                  <button
                    type="button"
                    className={`filter-pill ${targetType === "volunteer" ? "active" : ""}`}
                    onClick={() => {
                      setTargetType("volunteer");
                      setTargetName("Karthik Raman");
                    }}
                    style={{ padding: "0.6rem", textAlign: "center", justifyContent: "center" }}
                  >
                    🤝 {lang === "ta" ? "தன்னார்வலர் (Volunteer)" : "Community Volunteer"}
                  </button>
                </div>
              </div>

              {/* Name */}
              <div className="form-group">
                <label>{lang === "ta" ? "பெயர் *" : "Person's Name *"}</label>
                <input
                  type="text"
                  required
                  value={targetName}
                  onChange={(e) => setTargetName(e.target.value)}
                  placeholder="e.g. Anitha Krishnan"
                />
              </div>

              {/* Star Rating Selector */}
              <div className="form-group">
                <label>{lang === "ta" ? "நட்சத்திர மதிப்பீடு (Star Rating) *" : "Star Rating (1 to 5 Stars) *"}</label>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", padding: "0.5rem 0" }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setRating(s)}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: "4px" }}
                      title={`${s} Stars`}
                    >
                      <Star 
                        size={32} 
                        fill={s <= rating ? "#f59e0b" : "transparent"} 
                        stroke="#f59e0b" 
                      />
                    </button>
                  ))}
                  <strong style={{ marginLeft: "8px", fontSize: "1.1rem", color: "#f59e0b" }}>
                    {rating} / 5 Stars
                  </strong>
                </div>
              </div>

              {/* Feedback Message */}
              <div className="form-group">
                <label>{lang === "ta" ? "உங்கள் கருத்து & அனுபவம் *" : "Feedback & Experience *"}</label>
                <textarea
                  required
                  rows={3}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder={lang === "ta" ? "அவர்களின் கவனிப்பு, உதவி மற்றும் நடத்தை பற்றிய உங்கள் கருத்துக்களைப் பகிரவும்..." : "Share your feedback about their punctuality, warmth, and care..."}
                  style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--input-bg)", color: "var(--text-main)" }}
                />
              </div>

              {/* Tags */}
              <div className="form-group">
                <label>{lang === "ta" ? "சிறப்பு பண்புகள் (Tags):" : "Highlight Tags:"}</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                  {availableTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      className={`filter-pill ${selectedTags.includes(tag) ? "active" : ""}`}
                      onClick={() => toggleTag(tag)}
                      style={{ fontSize: "0.78rem" }}
                    >
                      {selectedTags.includes(tag) ? "✓ " : "+ "}{tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Complaint Checkbox */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  id="complaintCheckbox"
                  checked={isComplaint || rating <= 2}
                  onChange={(e) => setIsComplaint(e.target.checked)}
                />
                <label htmlFor="complaintCheckbox" style={{ fontSize: "0.85rem", color: "#ef4444", fontWeight: "600", cursor: "pointer" }}>
                  ⚠️ {lang === "ta" ? "இதை ஒரு புகாராக பதிவு செய்து நிர்வாகிக்கு அனுப்பவும்" : "Escalate this as a complaint for Administrator moderation"}
                </label>
              </div>

              <div className="modal-actions-row">
                <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)} disabled={submitting}>
                  {t.cancel}
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  <Send size={16} />
                  <span>{submitting ? t.loading : (lang === "ta" ? "மதிப்பீட்டை அனுப்புக" : "Submit Review")}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
