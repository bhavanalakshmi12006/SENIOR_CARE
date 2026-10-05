import React from "react";
import { AlertCircle, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message, isDanger = true }) {
  const { t } = useAuth();
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog small-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-with-icon">
            <AlertCircle size={22} className={isDanger ? "text-danger" : "text-primary"} />
            <h3>{title || "Confirm Action"}</h3>
          </div>
          <button className="modal-close-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <p className="modal-desc">{message || "Are you sure you want to proceed? This action cannot be undone."}</p>
        </div>

        <div className="modal-actions-row">
          <button type="button" className="btn-secondary" onClick={onClose}>
            {t.cancel}
          </button>
          <button
            type="button"
            className={isDanger ? "btn-danger" : "btn-primary"}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {t.confirm}
          </button>
        </div>
      </div>
    </div>
  );
}
