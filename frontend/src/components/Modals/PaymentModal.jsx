import React, { useState } from "react";
import { CreditCard, X, CheckCircle, IndianRupee } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import api from "../../api";

export default function PaymentModal({ isOpen, onClose, fee, onPaymentRecorded }) {
  const { t, lang } = useAuth();
  const { showToast } = useToast();
  const [amount, setAmount] = useState(() => fee?.remainingAmount || "");
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [transactionRef, setTransactionRef] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen || !fee) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payAmt = Number(amount);
    if (!payAmt || payAmt <= 0) {
      showToast("Please enter a valid payment amount", "warning");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post(`/fees/${fee._id}/pay`, {
        amount: payAmt,
        paymentMethod,
        transactionRef,
        notes
      });
      showToast(
        lang === "ta"
          ? `✓ கட்டணம் ₹${payAmt.toLocaleString()} வெற்றிகரமாக பதிவு செய்யப்பட்டது! ரசீது: ${res.data.payment.paymentCode}`
          : `✓ Payment of ₹${payAmt.toLocaleString()} recorded successfully! Receipt: ${res.data.payment.paymentCode}`,
        "success"
      );
      if (onPaymentRecorded) onPaymentRecorded(res.data.fee, res.data.payment);
      onClose();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to record payment", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-with-icon">
            <CreditCard size={22} className="text-primary" />
            <h3>{t.recordPayment}</h3>
          </div>
          <button className="modal-close-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="payment-summary-strip">
          <div>
            <small>{lang === "ta" ? "கட்டண விவரம்" : "Fee Item"}</small>
            <strong>{fee.title}</strong>
          </div>
          <div className="text-right">
            <small>{lang === "ta" ? "மீதமுள்ள தொகை" : "Remaining Due"}</small>
            <strong className="text-primary">₹{fee.remainingAmount?.toLocaleString()}</strong>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>{lang === "ta" ? "செலுத்தும் தொகை (₹) *" : "Payment Amount (₹) *"}</label>
            <input
              type="number"
              required
              min="1"
              max={fee.remainingAmount}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label>{t.paymentMethod}</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                <option value="Credit/Debit Card">Credit / Debit Card</option>
                <option value="Net Banking">Net Banking (NEFT/IMPS)</option>
                <option value="Cash">Cash at Counter</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>

            <div className="form-group">
              <label>{lang === "ta" ? "பரிவர்த்தனை குறிப்பு எண்" : "Transaction / Ref ID"}</label>
              <input
                type="text"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                placeholder="e.g. UPI/20261004/88219"
              />
            </div>
          </div>

          <div className="form-group">
            <label>{t.notes}</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Paid by daughter Priya"
            />
          </div>

          <div className="modal-actions-row">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
              {t.cancel}
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              <CheckCircle size={18} />
              {loading ? t.loading : (lang === "ta" ? "கட்டணம் உறுதிப்படுத்து" : "Confirm Payment")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
