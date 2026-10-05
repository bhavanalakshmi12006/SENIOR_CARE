import React, { useState } from "react";
import { UploadCloud, FileSpreadsheet, X, CheckCircle, AlertTriangle, AlertCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import api from "../../api";

export default function ExcelImportModal({ isOpen, onClose, onImportSuccess }) {
  const { t, lang } = useAuth();
  const { showToast } = useToast();
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [importResult, setImportResult] = useState(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
        showToast("Please upload an Excel spreadsheet (.xlsx)", "warning");
        return;
      }
      setSelectedFile(file);
      setImportResult(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      showToast("Please select an Excel file first", "warning");
      return;
    }
    setLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = reader.result.split(",")[1];
          const res = await api.post("/reports/import/excel", { base64Data });
          setImportResult(res.data.report);
          showToast(res.data.message, "success");
          if (onImportSuccess) onImportSuccess();
        } catch (err) {
          showToast(err.response?.data?.message || "Import failed", "error");
        } finally {
          setLoading(false);
        }
      };
      reader.readAsDataURL(selectedFile);
    } catch (e) {
      setLoading(false);
      showToast("Error reading file", "error");
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-with-icon">
            <FileSpreadsheet size={22} className="text-primary" />
            <h3>{t.importExcel}</h3>
          </div>
          <button className="modal-close-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <p className="modal-desc">{t.importInstructions}</p>

          <div className="file-drop-zone">
            <UploadCloud size={40} className="text-primary" />
            <p>
              {selectedFile ? (
                <strong>{selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</strong>
              ) : (
                <span>{lang === "ta" ? "Excel கோப்பைத் தேர்ந்தெடுக்க கிளிக் செய்யவும்" : "Click to browse and upload sample_data.xlsx"}</span>
              )}
            </p>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="hidden-file-input"
            />
          </div>

          {importResult && (
            <div className="import-validation-results">
              <div className="validation-stat-row">
                <div className="val-stat valid">
                  <CheckCircle size={18} />
                  <span>{importResult.validRecords} {lang === "ta" ? "சரியான பதிவுகள்" : "records valid"}</span>
                </div>
                {importResult.errorRecords > 0 && (
                  <div className="val-stat errors">
                    <AlertTriangle size={18} />
                    <span>{importResult.errorRecords} {lang === "ta" ? "பிழைகள் உள்ளன" : "records with warnings"}</span>
                  </div>
                )}
              </div>

              {importResult.errors?.length > 0 && (
                <div className="import-error-list">
                  <strong>{lang === "ta" ? "பிழை விபரங்கள்:" : "Validation Details:"}</strong>
                  <ul>
                    {importResult.errors.slice(0, 5).map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-actions-row">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
            {t.cancel}
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={handleUpload}
            disabled={loading || !selectedFile}
          >
            {loading ? t.loading : (lang === "ta" ? "சரிபார்த்து உள்ளேற்று" : "Validate & Import")}
          </button>
        </div>
      </div>
    </div>
  );
}
