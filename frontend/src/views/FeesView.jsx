import React, { useState, useEffect } from "react";
import { CreditCard, Plus, CheckCircle, AlertCircle, Clock, IndianRupee, Receipt } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { useToast } from "../context/ToastContext";
import api from "../api";
import PaymentModal from "../components/Modals/PaymentModal";

export default function FeesView({ onOpenPaymentModal }) {
  const { user, t, lang } = useAuth();
  const { liveEventSignal } = useSocket();
  const { showToast } = useToast();

  const [fees, setFees] = useState([]);
  const [summary, setSummary] = useState({ totalDue: 0, totalPaid: 0, totalRemaining: 0 });
  const [payments, setPayments] = useState([]);
  const [activeFeeToPay, setActiveFeeToPay] = useState(null);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const loadFeeData = async () => {
    try {
      const [feesRes, payRes] = await Promise.all([
        api.get("/fees"),
        api.get("/fees/payments")
      ]);
      setFees(feesRes.data.fees || []);
      setSummary(feesRes.data.summary || { totalDue: 0, totalPaid: 0, totalRemaining: 0 });
      setPayments(payRes.data.payments || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeeData();
  }, [liveEventSignal]);

  const filtered = fees.filter((f) => {
    if (filter === "all") return true;
    return f.status.toLowerCase().replace(/\s+/g, "-") === filter.toLowerCase();
  });

  return (
    <div className="view-page-container">
      <div className="view-header-bar">
        <div>
          <h2>{t.fees}</h2>
          <p>{lang === "ta" ? "பராமரிப்பு கட்டணங்கள், நிலுவைகள் மற்றும் ரசீதுகள்" : "Assisted living dues, medical consultation fees, and payment receipts"}</p>
        </div>
      </div>

      {/* Financial Summary Strip */}
      <div className="fee-summary-cards-grid">
        <div className="fee-stat-card total">
          <small>{t.totalAmount}</small>
          <strong>₹{summary.totalDue?.toLocaleString()}</strong>
          <span className="stat-note">{fees.length} {lang === "ta" ? "பில்கள்" : "fee items billed"}</span>
        </div>

        <div className="fee-stat-card paid">
          <small>{t.paidAmount}</small>
          <strong className="text-success">₹{summary.totalPaid?.toLocaleString()}</strong>
          <span className="stat-note">
            {summary.totalDue > 0 ? Math.round((summary.totalPaid / summary.totalDue) * 100) : 100}% {t.paid}
          </span>
        </div>

        <div className="fee-stat-card remaining">
          <small>{t.remainingAmount}</small>
          <strong className="text-primary">₹{summary.totalRemaining?.toLocaleString()}</strong>
          <span className="stat-note">{lang === "ta" ? "நிலுவையில் உள்ளது" : "Total pending collection"}</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="view-filter-bar">
        <div className="filter-pills-row">
          <button
            className={`filter-pill ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            {lang === "ta" ? "அனைத்தும்" : "All"} ({fees.length})
          </button>
          <button
            className={`filter-pill ${filter === "pending" ? "active" : ""}`}
            onClick={() => setFilter("pending")}
          >
            ⏳ {t.pending} ({fees.filter((f) => f.status === "Pending").length})
          </button>
          <button
            className={`filter-pill ${filter === "partially-paid" ? "active" : ""}`}
            onClick={() => setFilter("partially-paid")}
          >
            ⚡ {t.partiallyPaid} ({fees.filter((f) => f.status === "Partially Paid").length})
          </button>
          <button
            className={`filter-pill ${filter === "paid" ? "active" : ""}`}
            onClick={() => setFilter("paid")}
          >
            ✓ {t.paid} ({fees.filter((f) => f.status === "Paid").length})
          </button>
          <button
            className={`filter-pill ${filter === "overdue" ? "active" : ""}`}
            onClick={() => setFilter("overdue")}
          >
            ⚠️ {t.overdue} ({fees.filter((f) => f.status === "Overdue").length})
          </button>
        </div>
      </div>

      {/* Fee Cards Grid */}
      <div className="fees-cards-grid">
        {filtered.length === 0 ? (
          <div className="empty-panel-state col-span-full">{t.noData}</div>
        ) : (
          filtered.map((fee) => {
            const pctPaid = fee.totalAmount > 0 ? Math.round((fee.paidAmount / fee.totalAmount) * 100) : 0;
            return (
              <div key={fee._id} className="fee-item-card">
                <div className="fee-card-top">
                  <span className="fee-code-badge">{fee.feeCode}</span>
                  <span className={`status-pill status-${fee.status.toLowerCase().replace(/\s+/g, "-")}`}>
                    {fee.status}
                  </span>
                </div>

                <div className="fee-card-body">
                  <h4>{fee.title}</h4>
                  <p className="fee-senior-name">👵 <strong>{fee.seniorName}</strong> · <small>{fee.category}</small></p>

                  <div className="fee-amounts-row">
                    <div>
                      <small>{t.totalAmount}</small>
                      <strong>₹{fee.totalAmount?.toLocaleString()}</strong>
                    </div>
                    <div>
                      <small>{t.paidAmount}</small>
                      <strong className="text-success">₹{fee.paidAmount?.toLocaleString()}</strong>
                    </div>
                    <div>
                      <small>{t.remainingAmount}</small>
                      <strong className="text-danger">₹{fee.remainingAmount?.toLocaleString()}</strong>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="fee-progress-track">
                    <div className="fee-progress-fill" style={{ width: `${pctPaid}%` }} />
                  </div>
                  <small className="progress-label">{pctPaid}% {t.paid}</small>

                  <div className="fee-due-date">
                    <Clock size={13} />
                    <span>{t.dueDate}: {new Date(fee.dueDate).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="fee-card-footer">
                  {fee.remainingAmount > 0 && (
                    <button
                      className="btn-pay-action"
                      onClick={() => setActiveFeeToPay(fee)}
                    >
                      <CreditCard size={16} />
                      <span>{t.payNow}</span>
                    </button>
                  )}
                  {fee.status === "Paid" && (
                    <span className="paid-settled-text">
                      <CheckCircle size={16} className="text-success" /> {t.paid}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Payment Receipts History Table */}
      <div className="payments-history-section">
        <div className="panel-box-header">
          <div>
            <h3>{lang === "ta" ? "பரிவர்த்தனை மற்றும் ரசீதுகள் வரலாறு" : "Payment & Settlement Receipts"}</h3>
            <small>{lang === "ta" ? "செலுத்தப்பட்ட கட்டணங்களின் விவரங்கள்" : "Audit trail of verified payment transactions"}</small>
          </div>
        </div>

        <div className="responsive-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Receipt Code</th>
                <th>{t.seniors}</th>
                <th>{lang === "ta" ? "தொகை (₹)" : "Amount (₹)"}</th>
                <th>{t.paymentMethod}</th>
                <th>Transaction Ref</th>
                <th>{lang === "ta" ? "செலுத்திய தேதி" : "Payment Date"}</th>
                <th>{lang === "ta" ? "பதிவு செய்தவர்" : "Recorded By"}</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p._id}>
                  <td><strong>{p.paymentCode}</strong></td>
                  <td>{p.seniorName}</td>
                  <td className="text-success font-bold">₹{p.amount?.toLocaleString()}</td>
                  <td><span className="method-tag">{p.paymentMethod}</span></td>
                  <td><small>{p.transactionRef}</small></td>
                  <td>{new Date(p.paidAt).toLocaleString()}</td>
                  <td>{p.recordedByName || "Staff"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Modal */}
      {activeFeeToPay && (
        <PaymentModal
          isOpen={!!activeFeeToPay}
          fee={activeFeeToPay}
          onClose={() => setActiveFeeToPay(null)}
          onPaymentRecorded={() => {
            loadFeeData();
            setActiveFeeToPay(null);
          }}
        />
      )}
    </div>
  );
}
