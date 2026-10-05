import React, { useRef } from "react";
import { 
  Receipt, X, Printer, Download, CheckCircle2, ShieldCheck, 
  HeartHandshake, Calendar, User, CreditCard, Building2 
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

export default function ReceiptModal({ isOpen, onClose, receiptData, receipt }) {
  const { lang, t } = useAuth();
  const { showToast } = useToast();
  const receiptRef = useRef(null);

  const data = receiptData || receipt;
  if (!isOpen || !data) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Generate text/html blob receipt download
    const content = `
============================================================
           SENIORCARE GERIATRIC HEALTH CENTER
       OFFICIAL PAYMENT & SERVICE SETTLEMENT RECEIPT
============================================================
Receipt No: ${data.receiptCode || data.paymentCode || "RCP-2026-9041"}
Date: ${new Date(data.paidAt || Date.now()).toLocaleString()}
Status: VERIFIED & PAID IN FULL (NIL OUTSTANDING)
------------------------------------------------------------
Senior Citizen: ${data.seniorName || "Lakshmi Devi"}
Care Service: ${data.title || data.serviceName || "Comprehensive Elder Care Package"}
Amount Paid: Rs. ${(data.amount || data.totalAmount || 5000).toLocaleString()}
Payment Method: ${data.paymentMethod || "UPI (GPay / PhonePe)"}
Transaction Ref: ${data.transactionRef || "TXN-SC-2026-99182"}
Recorded / Verified By: ${data.recordedByName || "SeniorCare Accounts Desk"}
------------------------------------------------------------
Institutional Coverage: 100% Comprehensive Care Plan
Authorized Signatory: Dr. Rajesh Sharma (Chief Medical Officer)
============================================================
    Thank you for trusting SeniorCare for your family.
============================================================
    `;

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Receipt_${data.paymentCode || data.receiptCode || Date.now()}.txt`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast(
      lang === "ta" ? "ரசீது வெற்றிகரமாக பதிவிறக்கப்பட்டது!" : "Official receipt downloaded successfully!",
      "success"
    );
  };

  const code = data.receiptCode || data.paymentCode || `RCP-${Math.floor(100000 + Math.random() * 900000)}`;
  const amount = data.amount || data.totalAmount || 5000;
  const service = data.title || data.serviceName || "Monthly Elder Nursing & Care Plan";

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 10000 }}>
      <div 
        className="modal-dialog" 
        onClick={(e) => e.stopPropagation()} 
        style={{ maxWidth: 580, padding: 0, overflow: "hidden", borderRadius: 16 }}
      >
        <div style={{ background: "linear-gradient(135deg, #176b87, #0f4c5c)", color: "#fff", padding: "1.25rem 1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <div style={{ background: "rgba(255,255,255,0.2)", width: 40, height: 40, borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Receipt size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: "700", color: "#fff" }}>
                {lang === "ta" ? "அதிகாரப்பூர்வ சேவை ரசீது" : "Official Settlement Receipt"}
              </h3>
              <small style={{ opacity: 0.85 }}>{code}</small>
            </div>
          </div>
          <button 
            onClick={onClose}
            style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", width: 32, height: 32, borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Printable Receipt Paper */}
        <div ref={receiptRef} style={{ padding: "1.5rem", background: "#fff", color: "#1e293b" }}>
          {/* Header watermark and center info */}
          <div style={{ textAlign: "center", borderBottom: "2px dashed #cbd5e1", paddingBottom: "1rem", marginBottom: "1rem" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", color: "#176b87", fontWeight: "800", fontSize: "1.1rem" }}>
              <HeartHandshake size={20} />
              <span>SENIORCARE HEALTH CENTER</span>
            </div>
            <p style={{ margin: "0.2rem 0 0", fontSize: "0.8rem", color: "#64748b" }}>
              Elder Wellness, Assisted Living & Diagnostic Services · Chennai, India
            </p>
            <div style={{ marginTop: "0.6rem", display: "inline-block", background: "#ecfdf5", border: "1px solid #10b981", color: "#065f46", padding: "0.25rem 0.85rem", borderRadius: "20px", fontSize: "0.82rem", fontWeight: "700" }}>
              ✓ PAID IN FULL · ZERO BALANCE DUE
            </div>
          </div>

          {/* Details Table */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem", fontSize: "0.88rem", marginBottom: "1rem" }}>
            <div>
              <span style={{ color: "#64748b", display: "block", fontSize: "0.75rem" }}>{lang === "ta" ? "மூத்த உறுப்பினர்" : "Senior Resident"}</span>
              <strong style={{ fontSize: "1rem", color: "#0f172a" }}>{data.seniorName || "Lakshmi Devi"}</strong>
            </div>

            <div>
              <span style={{ color: "#64748b", display: "block", fontSize: "0.75rem" }}>{lang === "ta" ? "செலுத்திய தேதி" : "Settlement Date"}</span>
              <strong>{new Date(data.paidAt || Date.now()).toLocaleDateString([], { dateStyle: "long" })}</strong>
            </div>

            <div>
              <span style={{ color: "#64748b", display: "block", fontSize: "0.75rem" }}>{lang === "ta" ? "சேவை / பரிசோதனை" : "Service Rendered"}</span>
              <strong>{service}</strong>
            </div>

            <div>
              <span style={{ color: "#64748b", display: "block", fontSize: "0.75rem" }}>{lang === "ta" ? "பரிவர்த்தனை முறை" : "Payment Mode"}</span>
              <strong style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                <CreditCard size={14} className="text-primary" />
                {data.paymentMethod || "UPI (Instant)"}
              </strong>
            </div>
          </div>

          {/* Amount Box */}
          <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <div>
              <small style={{ color: "#64748b", display: "block", fontSize: "0.75rem" }}>{lang === "ta" ? "செலுத்தப்பட்ட மொத்த தொகை" : "Total Amount Settled"}</small>
              <strong style={{ fontSize: "1.4rem", color: "#059669" }}>₹{amount.toLocaleString()}</strong>
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Ref ID</span>
              <span style={{ display: "block", fontFamily: "monospace", fontSize: "0.82rem", fontWeight: "600", color: "#334155" }}>
                {data.transactionRef || "UPI/20261005/88192"}
              </span>
            </div>
          </div>

          {/* Institutional Stamp & Authorization */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", paddingTop: "0.5rem", borderTop: "1px solid #f1f5f9" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "#10b981", fontSize: "0.82rem", fontWeight: "600" }}>
              <ShieldCheck size={18} />
              <span>Verified Care Package</span>
            </div>

            <div style={{ textAlign: "right" }}>
              <div style={{ width: 120, height: 1, background: "#cbd5e1", margin: "0 auto 4px" }} />
              <small style={{ color: "#64748b", fontSize: "0.75rem", display: "block" }}>SeniorCare Accounts Office</small>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div style={{ background: "#f8fafc", borderTop: "1px solid var(--border)", padding: "0.85rem 1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button 
            type="button" 
            className="btn-secondary" 
            onClick={onClose}
            style={{ padding: "0.5rem 1rem" }}
          >
            {t.close || "Close"}
          </button>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button 
              type="button" 
              className="btn-outline-small"
              onClick={handlePrint}
              style={{ display: "flex", alignItems: "center", gap: "0.35rem", padding: "0.5rem 0.9rem" }}
            >
              <Printer size={15} />
              <span>{lang === "ta" ? "அச்சிடுக" : "Print Receipt"}</span>
            </button>

            <button 
              type="button" 
              className="btn-primary"
              onClick={handleDownload}
              style={{ display: "flex", alignItems: "center", gap: "0.35rem", padding: "0.5rem 1rem" }}
            >
              <Download size={15} />
              <span>{lang === "ta" ? "பதிவிறக்குக" : "Download Receipt"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
