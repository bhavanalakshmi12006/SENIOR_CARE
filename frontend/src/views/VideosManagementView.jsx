import React, { useState, useEffect } from "react";
import { 
  Play, Plus, Trash2, X, Film, Activity, Heart, Sparkles, 
  Clock, User, Check, ExternalLink, AlertTriangle 
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import api from "../api";

function getYouTubeEmbedUrl(url) {
  if (!url) return "";
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  if (match && match[1]) {
    return `https://www.youtube-nocookie.com/embed/${match[1]}?rel=0`;
  }
  return url;
}

function getYouTubeWatchUrl(url) {
  if (!url) return "";
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  if (match && match[1]) {
    return `https://www.youtube.com/watch?v=${match[1]}`;
  }
  return url;
}

export default function VideosManagementView() {
  const { user, lang, t } = useAuth();
  const { showToast } = useToast();

  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeVideo, setActiveVideo] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Add Video Modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    titleTa: "",
    category: "exercise",
    videoUrl: "",
    duration: "12 mins",
    instructor: "",
    description: ""
  });
  const [saving, setSaving] = useState(false);

  const isAdmin = user?.role === "admin";

  const loadVideos = async () => {
    try {
      const res = await api.get("/videos");
      setVideos(res.data.videos || []);
    } catch (err) {
      console.error("Failed to load videos:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVideos();
  }, []);

  const handleDeleteVideo = async (id, title) => {
    if (!window.confirm(lang === "ta" ? `இந்த வீடியோவை நிச்சயமாக நீக்க விரும்புகிறீர்களா: "${title}"?` : `Are you sure you want to remove the video: "${title}"?`)) {
      return;
    }
    try {
      await api.delete(`/videos/${id}`);
      showToast(
        lang === "ta" ? `வீடியோ "${title}" வெற்றிகரமாக நீக்கப்பட்டது.` : `Video "${title}" removed successfully.`,
        "success"
      );
      loadVideos();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to remove video", "error");
    }
  };

  const handleAddVideo = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.videoUrl) {
      showToast("Title and Video URL are required", "warning");
      return;
    }
    setSaving(true);
    try {
      await api.post("/videos", formData);
      showToast(
        lang === "ta" ? "புதிய வீடியோ வெற்றிகரமாக சேர்க்கப்பட்டது!" : "New video published successfully!",
        "success"
      );
      setIsAddOpen(false);
      setFormData({
        title: "",
        titleTa: "",
        category: "exercise",
        videoUrl: "",
        duration: "12 mins",
        instructor: "",
        description: ""
      });
      loadVideos();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to add video", "error");
    } finally {
      setSaving(false);
    }
  };

  const filtered = selectedCategory === "all" 
    ? videos 
    : videos.filter(v => v.category === selectedCategory);

  return (
    <div className="view-page-container">
      {/* Header bar */}
      <div className="view-header-bar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Film className="text-primary" size={26} />
            <h2 style={{ margin: 0 }}>
              {lang === "ta" ? "மூத்தோர் உடற்பயிற்சி & நல்வாழ்வு வீடியோக்கள்" : "Senior Wellness & Exercise Videos"}
            </h2>
          </div>
          <p style={{ margin: "0.25rem 0 0", color: "var(--text-muted)" }}>
            {lang === "ta" 
              ? "முதியோர்களுக்கான நாற்காலி யோகா, மூச்சுப் பயிற்சி, சமநிலை உடற்பயிற்சி மற்றும் உணவு ஆலோசனைகள்."
              : "Guided restorative yoga, breathing exercises, fall prevention routines, and healthy living."}
          </p>
        </div>

        {isAdmin && (
          <button 
            className="btn-primary" 
            onClick={() => setIsAddOpen(true)}
            style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.65rem 1.25rem", borderRadius: "10px", fontWeight: "600" }}
          >
            <Plus size={18} />
            <span>{lang === "ta" ? "புதிய வீடியோ சேர்க்க" : "+ Add New Video"}</span>
          </button>
        )}
      </div>

      {/* Admin Notice */}
      {isAdmin && (
        <div style={{ background: "rgba(37,99,235,0.06)", border: "1px dashed rgba(37,99,235,0.25)", padding: "0.85rem 1.2rem", borderRadius: "12px", marginBottom: "1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <span style={{ fontSize: "1.2rem" }}>🛡️</span>
            <div>
              <strong style={{ fontSize: "0.95rem" }}>{lang === "ta" ? "நிர்வாகி வீடியோ மேலாண்மை முறைமை" : "Administrator Video Management"}</strong>
              <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--text-muted)" }}>
                {lang === "ta" ? "தேவையற்ற அல்லது பழைய வீடியோக்களை உடனடியாக 'Remove' பட்டன் மூலம் நீக்கலாம்." : "Review published care videos and safely remove redundant or unwanted content anytime."}
              </p>
            </div>
          </div>
          <span style={{ fontSize: "0.8rem", color: "var(--primary)", fontWeight: "700" }}>{videos.length} Videos Live</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="view-filter-bar" style={{ marginBottom: "1.25rem" }}>
        <div className="filter-pills-row">
          <button 
            className={`filter-pill ${selectedCategory === "all" ? "active" : ""}`}
            onClick={() => setSelectedCategory("all")}
          >
            {lang === "ta" ? "அனைத்து வீடியோக்கள்" : "All Videos"} ({videos.length})
          </button>
          <button 
            className={`filter-pill ${selectedCategory === "exercise" ? "active" : ""}`}
            onClick={() => setSelectedCategory("exercise")}
          >
            🧘 {lang === "ta" ? "உடற்பயிற்சி & யோகா" : "Exercise & Yoga"}
          </button>
          <button 
            className={`filter-pill ${selectedCategory === "wellness" ? "active" : ""}`}
            onClick={() => setSelectedCategory("wellness")}
          >
            🌿 {lang === "ta" ? "மன அமைதி & மூச்சுப் பயிற்சி" : "Breathing & Wellness"}
          </button>
          <button 
            className={`filter-pill ${selectedCategory === "health" ? "active" : ""}`}
            onClick={() => setSelectedCategory("health")}
          >
            🍎 {lang === "ta" ? "சத்துணவு & நல்வாழ்வு" : "Nutrition & Health"}
          </button>
        </div>
      </div>

      {/* Video Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.25rem" }}>
        {filtered.length === 0 ? (
          <div className="empty-panel-state col-span-full" style={{ padding: "3rem", textAlign: "center" }}>
            <Film size={36} style={{ color: "var(--text-muted)", opacity: 0.5, marginBottom: "0.5rem" }} />
            <p>{lang === "ta" ? "வீடியோக்கள் எதுவும் இல்லை" : "No videos found in this category."}</p>
          </div>
        ) : (
          filtered.map((vid) => (
            <div 
              key={vid._id}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "16px",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
                position: "relative"
              }}
            >
              {/* Thumbnail / Play Preview */}
              <div 
                style={{ position: "relative", height: "190px", background: "#0f172a", cursor: "pointer", overflow: "hidden" }}
                onClick={() => setActiveVideo(vid)}
              >
                <img 
                  src={vid.thumbnail || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400"} 
                  alt={vid.title}
                  style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.85, transition: "transform 0.3s ease" }}
                />
                <div style={{
                  position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
                  width: 52, height: 52, borderRadius: "50%", background: "rgba(37,99,235,0.9)",
                  color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.4)"
                }}>
                  <Play size={24} fill="#fff" style={{ marginLeft: "3px" }} />
                </div>

                <span style={{ position: "absolute", bottom: 10, right: 10, background: "rgba(0,0,0,0.75)", color: "#fff", padding: "0.2rem 0.55rem", borderRadius: "6px", fontSize: "0.75rem", fontWeight: "600", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                  <Clock size={12} /> {vid.duration}
                </span>

                <span style={{ position: "absolute", top: 10, left: 10, background: "rgba(0,0,0,0.75)", color: "#fff", padding: "0.2rem 0.6rem", borderRadius: "12px", fontSize: "0.75rem", fontWeight: "700" }}>
                  {vid.category?.toUpperCase()}
                </span>
              </div>

              {/* Video Info */}
              <div style={{ padding: "1.1rem", display: "flex", flexDirection: "column", flex: 1, gap: "0.5rem" }}>
                <h4 style={{ margin: 0, fontSize: "1.05rem", fontWeight: "700", color: "var(--text-main)" }}>
                  {lang === "ta" && vid.titleTa ? vid.titleTa : vid.title}
                </h4>

                <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.4, flex: 1 }}>
                  {vid.description}
                </p>

                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                  <User size={13} className="text-primary" />
                  <span>{vid.instructor}</span>
                </div>

                {/* Footer with Watch & Admin Delete buttons */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border)", paddingTop: "0.75rem", marginTop: "0.5rem" }}>
                  <button 
                    className="btn-outline-small"
                    onClick={() => setActiveVideo(vid)}
                    style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}
                  >
                    <Play size={13} />
                    <span>{lang === "ta" ? "காணொளியைக் காண்க" : "Watch Video"}</span>
                  </button>

                  {isAdmin && (
                    <button 
                      className="btn-outline-small"
                      onClick={() => handleDeleteVideo(vid._id, vid.title)}
                      style={{ color: "#ef4444", borderColor: "rgba(239,68,68,0.3)", display: "flex", alignItems: "center", gap: "0.35rem" }}
                      title="Remove unwanted video"
                    >
                      <Trash2 size={13} />
                      <span>{lang === "ta" ? "நீக்குக (Remove)" : "Remove Video"}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Video Player Modal */}
      {activeVideo && (
        <div className="modal-overlay" onClick={() => setActiveVideo(null)} style={{ zIndex: 9999 }}>
          <div 
            className="modal-dialog large-modal" 
            onClick={(e) => e.stopPropagation()} 
            style={{ maxWidth: 800, padding: 0, overflow: "hidden", background: "var(--bg-surface, #ffffff)", borderRadius: "16px", border: "1px solid var(--border-color, #e2e8f0)", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)" }}
          >
            <div style={{ position: "relative", paddingTop: "56.25%", background: "#000" }}>
              <iframe
                src={getYouTubeEmbedUrl(activeVideo.videoUrl)}
                title={activeVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }}
              />
              <button 
                onClick={() => setActiveVideo(null)} 
                style={{ 
                  position: "absolute", top: 12, right: 12, 
                  background: "rgba(0,0,0,0.75)", color: "#fff", 
                  border: "none", borderRadius: "50%", width: 36, height: 36, 
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  zIndex: 10
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: "1.25rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
                <div>
                  <h3 style={{ margin: "0 0 0.35rem", fontSize: "1.25rem", color: "var(--text-main, #0f172a)", fontWeight: "700" }}>
                    {lang === "ta" && activeVideo.titleTa ? activeVideo.titleTa : activeVideo.title}
                  </h3>
                  <small style={{ color: "var(--text-muted, #64748b)" }}>{activeVideo.instructor} · ⏰ {activeVideo.duration}</small>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <a 
                    href={getYouTubeWatchUrl(activeVideo.videoUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.45rem",
                      padding: "0.5rem 1rem",
                      borderRadius: "8px",
                      background: "#ef4444",
                      color: "#fff",
                      fontWeight: "700",
                      fontSize: "0.85rem",
                      textDecoration: "none"
                    }}
                  >
                    <span>▶</span>
                    <span>{lang === "ta" ? "YouTube-ல் காண்க ↗" : "Watch on YouTube ↗"}</span>
                  </a>

                  {isAdmin && (
                    <button 
                      onClick={() => {
                        handleDeleteVideo(activeVideo._id, activeVideo.title);
                        setActiveVideo(null);
                      }}
                      style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)", padding: "0.5rem 0.8rem", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.82rem", fontWeight: "600" }}
                    >
                      <Trash2 size={14} />
                      <span>{lang === "ta" ? "நீக்குக" : "Delete"}</span>
                    </button>
                  )}
                </div>
              </div>

              <div style={{ marginTop: "0.75rem", padding: "0.6rem 0.85rem", background: "rgba(2, 132, 199, 0.08)", border: "1px solid rgba(2, 132, 199, 0.2)", borderRadius: "8px", fontSize: "0.82rem", color: "#0369a1" }}>
                <span>💡 {lang === "ta" ? "வீடியோ திரையில் இயங்கவில்லை என்றால், மேலே உள்ள 'YouTube-ல் காண்க ↗' பட்டனை அழுத்தி நேரடியாக யூடியூபில் பார்க்கலாம்." : "If the embedded player is blocked by your browser network, click 'Watch on YouTube ↗' to view directly."}</span>
              </div>

              <p style={{ margin: "0.75rem 0 0", color: "var(--text-secondary, #475569)", fontSize: "0.92rem", lineHeight: 1.5 }}>
                {activeVideo.description}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Add New Video Modal (Admin only) */}
      {isAddOpen && (
        <div className="modal-overlay" onClick={() => setIsAddOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <div className="modal-title-with-icon">
                <Plus size={22} className="text-primary" />
                <h3>{lang === "ta" ? "புதிய வீடியோ சேர்க்க" : "Publish New Community Video"}</h3>
              </div>
              <button className="modal-close-icon" onClick={() => setIsAddOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddVideo} className="modal-form">
              <div className="form-group">
                <label>{lang === "ta" ? "வீடியோ தலைப்பு (English) *" : "Video Title (English) *"}</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Chair Yoga for Knee Pain Relief"
                />
              </div>

              <div className="form-group">
                <label>{lang === "ta" ? "தலைப்பு (தமிழ்)" : "Tamil Title (Optional)"}</label>
                <input
                  type="text"
                  value={formData.titleTa}
                  onChange={(e) => setFormData({ ...formData, titleTa: e.target.value })}
                  placeholder="எ.கா. முழங்கால் வலி நிவாரண நாற்காலி யோகா"
                />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>{lang === "ta" ? "பிரிவு *" : "Category *"}</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="exercise">🧘 Exercise & Yoga</option>
                    <option value="wellness">🌿 Breathing & Wellness</option>
                    <option value="health">🍎 Nutrition & Health</option>
                    <option value="entertainment">🎵 Music & Entertainment</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>{lang === "ta" ? "கால அளவு *" : "Duration *"}</label>
                  <input
                    type="text"
                    required
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="e.g. 15 mins"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>{lang === "ta" ? "வீடியோ இணைப்பு (YouTube Embed URL) *" : "YouTube Embed URL *"}</label>
                <input
                  type="url"
                  required
                  value={formData.videoUrl}
                  onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                  placeholder="https://www.youtube.com/embed/..."
                />
                <small style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
                  Tip: Use YouTube embed format: https://www.youtube.com/embed/VIDEO_ID
                </small>
              </div>

              <div className="form-group">
                <label>{lang === "ta" ? "பயிற்றுநர் / மருத்துவர் பெயர்" : "Instructor / Doctor Name"}</label>
                <input
                  type="text"
                  value={formData.instructor}
                  onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                  placeholder="e.g. Dr. Lakshmi S. / Murugan Physiotherapist"
                />
              </div>

              <div className="form-group">
                <label>{lang === "ta" ? "விளக்கம்" : "Description"}</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief summary of benefits for senior citizens..."
                  style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--input-bg)", color: "var(--text-main)" }}
                />
              </div>

              <div className="modal-actions-row">
                <button type="button" className="btn-secondary" onClick={() => setIsAddOpen(false)} disabled={saving}>
                  {t.cancel}
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  <Check size={16} />
                  <span>{saving ? t.loading : (lang === "ta" ? "வெளியிடுக" : "Publish Video")}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
