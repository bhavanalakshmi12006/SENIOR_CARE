import React, { useState, useEffect } from "react";
import { 
  Users, Search, UserPlus, Filter, ShieldCheck, AlertCircle, 
  Phone, MapPin, Heart, Calendar, CreditCard, ChevronRight, 
  Clock, Edit, Trash2, ArrowLeft, Activity 
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import api from "../api";
import AddSeniorModal from "../components/Modals/AddSeniorModal";
import ConfirmModal from "../components/Modals/ConfirmModal";

export default function SeniorsView({ initialSelectedId, onOpenEmergencyModal }) {
  const { user, t, lang } = useAuth();
  const { showToast } = useToast();

  const [seniors, setSeniors] = useState([]);
  const [selectedSenior, setSelectedSenior] = useState(null);
  const [seniorDetails, setSeniorDetails] = useState(null);
  const [activeTab, setActiveTab] = useState("info");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [loading, setLoading] = useState(true);

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingSenior, setEditingSenior] = useState(null);
  const [deletingSenior, setDeletingSenior] = useState(null);

  const isStaffOrAdmin = user?.role === "admin" || user?.role === "staff";

  const loadSeniors = async () => {
    try {
      const res = await api.get("/seniors");
      setSeniors(res.data.seniors || []);
      if (initialSelectedId) {
        const found = res.data.seniors?.find((s) => s._id === initialSelectedId);
        if (found) viewSeniorDetails(found);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSeniors();
  }, [initialSelectedId]);

  const viewSeniorDetails = async (senior) => {
    setSelectedSenior(senior);
    setActiveTab("info");
    try {
      const res = await api.get(`/seniors/${senior._id}`);
      setSeniorDetails(res.data);

      // Record recently accessed
      await api.post("/search/recently-accessed", {
        itemType: "senior",
        itemId: senior._id,
        title: senior.name,
        subtitle: `Room ${senior.roomNumber || "Resident"} · ${senior.phone || ""}`
      });
    } catch (err) {
      console.error("Failed to load senior details:", err);
    }
  };

  const handleDeleteSenior = async () => {
    if (!deletingSenior) return;
    try {
      await api.delete(`/seniors/${deletingSenior._id}`);
      showToast(lang === "ta" ? "மூத்த குடிமகன் நீக்கப்பட்டார்" : "Senior citizen deleted", "info");
      setSelectedSenior(null);
      loadSeniors();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to delete", "error");
    }
  };

  const filtered = seniors.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.roomNumber && s.roomNumber.toLowerCase().includes(search.toLowerCase())) ||
      (s.phone && s.phone.includes(search));
    
    if (filterStatus === "safe") return matchesSearch && s.safetyStatus === "safe";
    if (filterStatus === "attention") return matchesSearch && s.safetyStatus !== "safe";
    return matchesSearch;
  });

  return (
    <div className="view-page-container">
      {/* If viewing detailed profile */}
      {selectedSenior ? (
        <div className="senior-profile-page">
          <div className="profile-top-nav">
            <button className="btn-back-link" onClick={() => setSelectedSenior(null)}>
              <ArrowLeft size={18} />
              <span>{lang === "ta" ? "பட்டியலுக்குத் திரும்பு" : "Back to Seniors Directory"}</span>
            </button>

            {isStaffOrAdmin && (
              <div className="profile-actions-bar">
                <button
                  className="btn-outline-small"
                  onClick={() => {
                    setEditingSenior(selectedSenior);
                    setIsAddOpen(true);
                  }}
                >
                  <Edit size={16} />
                  <span>{lang === "ta" ? "திருத்துக" : "Edit Profile"}</span>
                </button>
                {user?.role === "admin" && (
                  <button
                    className="btn-danger-small"
                    onClick={() => setDeletingSenior(selectedSenior)}
                  >
                    <Trash2 size={16} />
                    <span>{t.delete}</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Profile Header Card */}
          <div className="senior-profile-header-card">
            <div className="profile-avatar-large">
              {selectedSenior.name.charAt(0).toUpperCase()}
            </div>
            <div className="profile-header-info">
              <div className="profile-name-row">
                <h2>{selectedSenior.name}</h2>
                <span className={`status-pill ${selectedSenior.safetyStatus === "safe" ? "status-safe" : "status-danger"}`}>
                  {selectedSenior.safetyStatus.toUpperCase()}
                </span>
              </div>
              <p className="profile-meta-line">
                <span>🎂 {selectedSenior.age} {lang === "ta" ? "வயது" : "years"}</span>
                <span>•</span>
                <span>{selectedSenior.gender}</span>
                <span>•</span>
                <span>🩸 {selectedSenior.bloodGroup || "O+"}</span>
                <span>•</span>
                <span>🚪 {selectedSenior.roomNumber || "Room 104"}</span>
              </p>
              <div className="profile-contact-badges">
                <span className="contact-badge"><Phone size={14} /> {selectedSenior.phone || "No phone"}</span>
                <span className="contact-badge"><MapPin size={14} /> {selectedSenior.address || "Senior Haven Community"}</span>
              </div>
            </div>

            <div className="profile-streak-box">
              <span className="streak-icon">🔥</span>
              <div>
                <strong>{selectedSenior.checkinStreak || 1} {lang === "ta" ? "நாட்கள்" : "Days"}</strong>
                <small>{lang === "ta" ? "பாதுகாப்பு தொடர்ச்சி" : "Safety Streak"}</small>
              </div>
            </div>
          </div>

          {/* Profile Tabs */}
          <div className="profile-tabs-header">
            <button
              className={`profile-tab-btn ${activeTab === "info" ? "active" : ""}`}
              onClick={() => setActiveTab("info")}
            >
              {lang === "ta" ? "தனிப்பட்ட & மருத்துவ தகவல்" : "Personal & Medical"}
            </button>
            <button
              className={`profile-tab-btn ${activeTab === "safety" ? "active" : ""}`}
              onClick={() => setActiveTab("safety")}
            >
              {lang === "ta" ? "பாதுகாப்பு & Check-ins" : "Safety & Check-ins"}
            </button>
            <button
              className={`profile-tab-btn ${activeTab === "appointments" ? "active" : ""}`}
              onClick={() => setActiveTab("appointments")}
            >
              {t.appointments} ({seniorDetails?.appointments?.length || 0})
            </button>
            <button
              className={`profile-tab-btn ${activeTab === "fees" ? "active" : ""}`}
              onClick={() => setActiveTab("fees")}
            >
              {t.fees} ({seniorDetails?.fees?.length || 0})
            </button>
          </div>

          {/* Tab Content */}
          <div className="profile-tab-content">
            {activeTab === "info" && (
              <div className="profile-grid-2">
                <div className="profile-detail-card">
                  <h3>{lang === "ta" ? "மருத்துவ நிலை & குறிப்புகள்" : "Medical Conditions & Notes"}</h3>
                  <div className="medical-notes-box">
                    <p>{selectedSenior.medicalNotes || "No recorded medical allergies or conditions."}</p>
                  </div>

                  <h3 style={{ marginTop: 20 }}>{lang === "ta" ? "ஒதுக்கப்பட்ட பராமரிப்பாளர்" : "Assigned Caregiver"}</h3>
                  <div className="care-contact-strip">
                    <Heart size={20} className="text-primary" />
                    <div>
                      <strong>{selectedSenior.assignedCaregiverName || "Anitha Krishnan"}</strong>
                      <small>Primary Geriatric Caregiver</small>
                    </div>
                  </div>
                </div>

                <div className="profile-detail-card">
                  <h3>{lang === "ta" ? "அவசர தொடர்பு நபர்" : "Emergency Contact"}</h3>
                  <div className="emergency-contact-box">
                    <strong>{selectedSenior.emergencyContactName || "Priya Ramesh"}</strong>
                    <p>{selectedSenior.emergencyContactRelation || "Daughter"}</p>
                    <div className="contact-phone-strip">
                      <Phone size={16} />
                      <a href={`tel:${selectedSenior.emergencyContactPhone}`}>{selectedSenior.emergencyContactPhone || "+91 98765 00003"}</a>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "safety" && (
              <div className="profile-detail-card">
                <h3>{lang === "ta" ? "சமீபத்திய பாதுகாப்பு பதிவுகள்" : "Recent Check-in Logs"}</h3>
                <div className="responsive-table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>{lang === "ta" ? "தேதி & நேரம்" : "Date & Time"}</th>
                        <th>{t.status}</th>
                        <th>{t.mood}</th>
                        <th>{t.notes}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {seniorDetails?.checkins?.map((c) => (
                        <tr key={c._id}>
                          <td>{new Date(c.timestamp).toLocaleString()}</td>
                          <td><span className="status-pill status-safe">✓ {c.status}</span></td>
                          <td>{c.mood}</td>
                          <td>{c.notes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "appointments" && (
              <div className="profile-detail-card">
                <h3>{t.appointments}</h3>
                <div className="appointments-grid-list">
                  {seniorDetails?.appointments?.map((apt) => (
                    <div key={apt._id} className="appointment-card-full">
                      <strong>{apt.doctorName}</strong>
                      <small>{apt.department} · {apt.hospital}</small>
                      <p>📅 {new Date(apt.appointmentDate).toLocaleDateString()} at {apt.timeSlot}</p>
                      <span className={`status-pill ${apt.status === "Upcoming" ? "status-upcoming" : "status-safe"}`}>{apt.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "fees" && (
              <div className="profile-detail-card">
                <h3>{t.fees}</h3>
                <div className="fees-table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>{t.feeTitle}</th>
                        <th>{t.totalAmount}</th>
                        <th>{t.paidAmount}</th>
                        <th>{t.remainingAmount}</th>
                        <th>{t.status}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {seniorDetails?.fees?.map((f) => (
                        <tr key={f._id}>
                          <td><strong>{f.title}</strong></td>
                          <td>₹{f.totalAmount?.toLocaleString()}</td>
                          <td className="text-success">₹{f.paidAmount?.toLocaleString()}</td>
                          <td className="text-danger">₹{f.remainingAmount?.toLocaleString()}</td>
                          <td><span className={`status-pill status-${f.status?.toLowerCase().replace(/\s+/g, "-")}`}>{f.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Seniors Directory List View */
        <>
          <div className="view-header-bar">
            <div>
              <h2>{t.seniors} ({filtered.length})</h2>
              <p>{lang === "ta" ? "மூத்த குடிமக்களின் விவரங்கள், இருப்பிடம் மற்றும் பாதுகாப்பு நிலவரம்" : "Directory of registered senior citizens and care status"}</p>
            </div>

            {isStaffOrAdmin && (
              <button
                className="btn-primary"
                onClick={() => {
                  setEditingSenior(null);
                  setIsAddOpen(true);
                }}
              >
                <UserPlus size={18} />
                <span>{t.addSenior}</span>
              </button>
            )}
          </div>

          {/* Filters Bar */}
          <div className="view-filter-bar">
            <div className="search-filter-input">
              <Search size={18} />
              <input
                type="text"
                placeholder={lang === "ta" ? "பெயர், அறை எண், தொலைபேசி மூலம் தேட..." : "Search by name, room, or phone..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="filter-pills-row">
              <button
                className={`filter-pill ${filterStatus === "all" ? "active" : ""}`}
                onClick={() => setFilterStatus("all")}
              >
                {lang === "ta" ? "அனைத்தும்" : "All"} ({seniors.length})
              </button>
              <button
                className={`filter-pill ${filterStatus === "safe" ? "active" : ""}`}
                onClick={() => setFilterStatus("safe")}
              >
                ✓ {lang === "ta" ? "பாதுகாப்பானவர்கள்" : "Safe"} ({seniors.filter((s) => s.safetyStatus === "safe").length})
              </button>
              <button
                className={`filter-pill ${filterStatus === "attention" ? "active" : ""}`}
                onClick={() => setFilterStatus("attention")}
              >
                ⚠️ {lang === "ta" ? "கவனம் தேவை" : "Attention Needed"} ({seniors.filter((s) => s.safetyStatus !== "safe").length})
              </button>
            </div>
          </div>

          {/* Seniors Cards Grid */}
          <div className="seniors-cards-grid">
            {filtered.map((s) => (
              <div
                key={s._id}
                className="senior-directory-card"
                onClick={() => viewSeniorDetails(s)}
              >
                <div className="directory-card-top">
                  <div className="directory-avatar">
                    {s.name.charAt(0).toUpperCase()}
                  </div>
                  <span className={`status-pill ${s.safetyStatus === "safe" ? "status-safe" : "status-danger"}`}>
                    {s.safetyStatus === "safe" ? "✓ SAFE" : "⚠️ ALERT"}
                  </span>
                </div>

                <div className="directory-card-body">
                  <strong>{s.name}</strong>
                  <p className="directory-meta">
                    {s.age} {lang === "ta" ? "வயது" : "yrs"} · {s.gender} · {s.roomNumber || "Resident"}
                  </p>
                  <small className="directory-phone">📞 {s.phone || "No phone"}</small>
                  <div className="directory-caregiver-line">
                    <Heart size={14} className="text-primary" />
                    <span>{s.assignedCaregiverName || "Anitha Krishnan"}</span>
                  </div>
                </div>

                <div className="directory-card-footer">
                  <span className="streak-tag">🔥 {s.checkinStreak || 1}d safe</span>
                  <span className="view-details-arrow">{lang === "ta" ? "விவரங்கள்" : "View"} <ChevronRight size={16} /></span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Add / Edit Senior Modal */}
      {isAddOpen && (
        <AddSeniorModal
          isOpen={isAddOpen}
          initialData={editingSenior}
          onClose={() => {
            setIsAddOpen(false);
            setEditingSenior(null);
          }}
          onSeniorAdded={() => {
            loadSeniors();
            if (editingSenior) setSelectedSenior(null);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingSenior && (
        <ConfirmModal
          isOpen={!!deletingSenior}
          title={lang === "ta" ? "மூத்தவரை நீக்கவா?" : "Delete Senior Citizen?"}
          message={`Are you sure you want to remove ${deletingSenior.name}? This action cannot be undone.`}
          onClose={() => setDeletingSenior(null)}
          onConfirm={handleDeleteSenior}
        />
      )}
    </div>
  );
}
