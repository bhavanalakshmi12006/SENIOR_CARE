import React, { useState, useEffect } from "react";
import { FileSpreadsheet, Download, Printer, UploadCloud, Search, CheckCircle, FileText } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import api, { API_BASE_URL } from "../api";
import ExcelImportModal from "../components/Modals/ExcelImportModal";

export default function ReportsView() {
  const { user, t, lang } = useAuth();
  const { showToast } = useToast();

  const [activeReportType, setActiveReportType] = useState("senior");
  const [reportData, setReportData] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);

  const reportTabs = [
    { id: "health", label: lang === "ta" ? "🩺 உடல்நல அறிக்கை (Health)" : "🩺 Health & Medical Records" },
    { id: "senior", label: t.seniorReport },
    { id: "emergency", label: t.emergencyReport },
    { id: "checkin", label: t.checkinReport },
    { id: "appointment", label: t.appointmentReport },
    { id: "fee", label: t.feeReport },
    { id: "assistance", label: t.assistanceReport }
  ];

  const fetchReport = async (type) => {
    setLoading(true);
    try {
      const res = await api.get(`/reports/${type}`);
      setReportData(res.data);
    } catch (err) {
      showToast("Failed to generate report", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(activeReportType);
  }, [activeReportType]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = async () => {
    try {
      showToast(lang === "ta" ? "Excel அறிக்கை பதிவிறக்கப்படுகிறது..." : "Downloading Excel report...", "info");
      const res = await api.get(`/reports/export/excel?type=${activeReportType}`, {
        responseType: "blob"
      });
      const blobUrl = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = blobUrl;
      link.setAttribute("download", `SeniorCare_${activeReportType}_Report_${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
      showToast(lang === "ta" ? "Excel அறிக்கை வெற்றிகரமாக பதிவிறக்கப்பட்டது!" : "Excel report downloaded successfully!", "success");
    } catch (err) {
      showToast(lang === "ta" ? "பதிவிறக்கம் தோல்வியடைந்தது" : "Failed to download Excel report", "error");
    }
  };

  const filteredRows = reportData?.rows?.filter((row) => {
    if (!search.trim()) return true;
    return row.some((cell) => String(cell).toLowerCase().includes(search.toLowerCase()));
  }) || [];

  return (
    <div className="view-page-container printable-report-area">
      <div className="view-header-bar hide-on-print">
        <div>
          <h2>{t.reportsTitle}</h2>
          <p>{lang === "ta" ? "விரிவான தணிக்கை அறிக்கைகள், Excel ஏற்றுமதி மற்றும் கோப்பு பதிவேற்றம்" : "Generate regulatory care audits, download spreadsheets, or import sample data"}</p>
        </div>

        <div className="reports-top-actions">
          <button className="btn-secondary" onClick={() => setIsImportOpen(true)}>
            <UploadCloud size={18} />
            <span>{t.importExcel}</span>
          </button>
          <button className="btn-primary" onClick={handleExportExcel}>
            <Download size={18} />
            <span>{t.downloadExcel}</span>
          </button>
          <button className="btn-secondary" onClick={handlePrint}>
            <Printer size={18} />
            <span>{t.downloadPdf}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="reports-tab-strip hide-on-print">
        {reportTabs.map((tab) => (
          <button
            key={tab.id}
            className={`report-tab-pill ${activeReportType === tab.id ? "active" : ""}`}
            onClick={() => {
              setActiveReportType(tab.id);
              setSearch("");
            }}
          >
            <FileSpreadsheet size={16} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Report Document Box */}
      <div className="report-paper-card">
        <div className="report-doc-header">
          <div className="doc-brand">
            <h1>SeniorCare (SCS)</h1>
            <p>Senior Citizen Management & Safety Support System</p>
          </div>
          <div className="doc-meta">
            <h3>{reportData?.title}</h3>
            <small>Generated: {reportData ? new Date(reportData.generatedAt).toLocaleString() : ""}</small>
          </div>
        </div>

        {/* Summary Stats bar */}
        {reportData?.summary && (
          <div className="report-summary-bar">
            {Object.entries(reportData.summary).map(([k, v]) => (
              <div key={k} className="summary-metric-pill">
                <small>{k.replace(/([A-Z])/g, " $1").toUpperCase()}:</small>
                <strong>{typeof v === "number" ? (k.includes("totalBilled") || k.includes("totalPaid") || k.includes("totalRemaining") ? `₹${v.toLocaleString()}` : v) : String(v)}</strong>
              </div>
            ))}
          </div>
        )}

        {/* Filter input */}
        <div className="report-search-bar hide-on-print">
          <Search size={16} />
          <input
            type="text"
            placeholder={lang === "ta" ? "அறிக்கையில் தேட..." : "Filter records in this report..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Report Table */}
        <div className="responsive-table-wrapper">
          <table className="data-table report-table">
            <thead>
              <tr>
                {reportData?.columns?.map((col, idx) => (
                  <th key={idx}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={reportData?.columns?.length || 4} className="text-center py-6">
                    {loading ? t.loading : t.noData}
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, rIdx) => (
                  <tr key={rIdx}>
                    {row.map((cell, cIdx) => (
                      <td key={cIdx}>{cell}</td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="report-doc-footer">
          <small>SeniorCare System · Official Audit Log · Confidential Care Record</small>
        </div>
      </div>

      {/* Excel Import Modal */}
      {isImportOpen && (
        <ExcelImportModal
          isOpen={isImportOpen}
          onClose={() => setIsImportOpen(false)}
          onImportSuccess={() => fetchReport(activeReportType)}
        />
      )}
    </div>
  );
}
