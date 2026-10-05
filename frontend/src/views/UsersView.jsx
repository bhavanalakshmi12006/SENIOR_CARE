import React, { useState, useEffect } from "react";
import { UserCog, Shield, Users, Activity, Clock, CheckCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import api from "../api";

export default function UsersView() {
  const { user, t, lang } = useAuth();
  const { showToast } = useToast();

  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [activeTab, setActiveTab] = useState("users");
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [uRes, lRes] = await Promise.all([
        api.get("/users"),
        api.get("/users/audit/logs")
      ]);
      setUsers(uRes.data.users || []);
      setLogs(lRes.data.logs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.patch(`/users/${id}`, { status });
      showToast(lang === "ta" ? "பயனர் நிலை புதுப்பிக்கப்பட்டது" : "User status updated", "success");
      loadData();
    } catch (err) {
      showToast("Failed to update status", "error");
    }
  };

  return (
    <div className="view-page-container">
      <div className="view-header-bar">
        <div>
          <h2>{t.usersManagement} & {t.auditLogs}</h2>
          <p>{lang === "ta" ? "அனைத்து பதிவு செய்யப்பட்ட பயனர்கள், அனுமதிகள் மற்றும் கணினி தணிக்கை பதிவுகள்" : "System users directory, roles permissions, and immutable security audit trail"}</p>
        </div>
      </div>

      <div className="view-filter-bar">
        <div className="filter-pills-row">
          <button
            className={`filter-pill ${activeTab === "users" ? "active" : ""}`}
            onClick={() => setActiveTab("users")}
          >
            <Users size={16} /> {lang === "ta" ? "பயனர்கள் பட்டியல்" : "System Users"} ({users.length})
          </button>
          <button
            className={`filter-pill ${activeTab === "logs" ? "active" : ""}`}
            onClick={() => setActiveTab("logs")}
          >
            <Activity size={16} /> {t.auditLogs} ({logs.length})
          </button>
        </div>
      </div>

      {activeTab === "users" ? (
        <div className="users-table-card">
          <div className="responsive-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t.fullName}</th>
                  <th>{t.emailAddress}</th>
                  <th>Role</th>
                  <th>{lang === "ta" ? "தொலைபேசி" : "Phone"}</th>
                  <th>{t.status}</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id}>
                    <td><strong>{u.displayName}</strong></td>
                    <td>{u.email}</td>
                    <td><span className="role-tag-pill">{t[u.role] || u.role}</span></td>
                    <td>{u.phone || "—"}</td>
                    <td>
                      <span className={`status-pill ${u.status === "active" ? "status-safe" : "status-danger"}`}>
                        {u.status}
                      </span>
                    </td>
                    <td>
                      {u._id !== user._id && (
                        <button
                          className="btn-outline-small"
                          onClick={() => handleUpdateStatus(u._id, u.status === "active" ? "suspended" : "active")}
                        >
                          {u.status === "active" ? "Suspend" : "Activate"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="audit-logs-card">
          <div className="responsive-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Performed By</th>
                  <th>Role</th>
                  <th>Target Entity</th>
                  <th>Details</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l._id}>
                    <td><strong className="text-primary">{l.action}</strong></td>
                    <td>{l.performedByName}</td>
                    <td><span className="role-tag-pill">{l.performedByRole}</span></td>
                    <td>{l.targetEntity} #{l.targetId}</td>
                    <td><small>{l.details}</small></td>
                    <td><small>{new Date(l.timestamp).toLocaleString()}</small></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
