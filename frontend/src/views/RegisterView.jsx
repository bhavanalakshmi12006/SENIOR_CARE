import React, { useState } from "react";
import { HeartHandshake, UserPlus, Mail, Lock, User, Phone, MapPin, ArrowLeft } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import GoogleAuthSection from "../components/GoogleAuthSection";

export default function RegisterView({ onSwitchToLogin }) {
  const { register, lang, t } = useAuth();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    displayName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "senior_citizen",
    phone: "",
    address: ""
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (formData.password !== formData.confirmPassword) {
      setErrorMsg(lang === "ta" ? "கடவுச்சொற்கள் பொருந்தவில்லை" : "Passwords do not match");
      return;
    }
    if (formData.password.length < 8) {
      setErrorMsg(lang === "ta" ? "கடவுச்சொல் குறைந்தது 8 எழுத்துக்கள் இருக்க வேண்டும்" : "Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    const res = await register(formData);
    setLoading(false);

    if (!res.success) {
      setErrorMsg(res.message);
      showToast(res.message, "error");
    } else {
      showToast(lang === "ta" ? "கணக்கு உருவாக்கப்பட்டது!" : "Account created successfully!", "success");
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card-box register-card">
        <button className="back-to-login-link" onClick={onSwitchToLogin}>
          <ArrowLeft size={16} />
          <span>{lang === "ta" ? "உள்நுழைவுக்குத் திரும்பு" : "Back to Sign In"}</span>
        </button>

        <div className="auth-card-header">
          <div className="brand-logo-inline" style={{ justifyContent: "center", marginBottom: 8 }}>
            <HeartHandshake size={28} className="text-primary" />
            <span>SeniorCare</span>
          </div>
          <h2>{t.signUp}</h2>
          <p>{lang === "ta" ? "உங்கள் விபரங்களை உள்ளிட்டு பதிவு செய்யுங்கள்" : "Fill in your details to create an account"}</p>
        </div>

        {errorMsg && <div className="auth-error-banner">{errorMsg}</div>}

        {/* Real Google Authentication */}
        <GoogleAuthSection 
          defaultRole={formData.role} 
          onRoleChange={(r) => setFormData(prev => ({ ...prev, role: r }))} 
        />

        <div className="oauth-divider">
          <span>{lang === "ta" ? "அல்லது மின்னஞ்சல் மூலம் பதிவு செய்க" : "OR REGISTER WITH EMAIL"}</span>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>{t.fullName} *</label>
            <div className="input-with-icon">
              <User size={18} className="input-icon" />
              <input
                type="text"
                required
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                placeholder="e.g. Lakshmi Devi"
              />
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label>{t.emailAddress} *</label>
              <div className="input-with-icon">
                <Mail size={18} className="input-icon" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div className="form-group">
              <label>{lang === "ta" ? "பயனர் பங்கு (Role) *" : "User Role *"}</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="senior_citizen">{t.senior_citizen}</option>
                <option value="family_member">{t.family_member}</option>
                <option value="caretaker">{t.caregiver}</option>
                <option value="volunteer">{t.volunteer}</option>
                <option value="staff">{t.staff}</option>
              </select>
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label>{t.password} *</label>
              <div className="input-with-icon">
                <Lock size={18} className="input-icon" />
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Min 8 characters"
                />
              </div>
            </div>

            <div className="form-group">
              <label>{lang === "ta" ? "கடவுச்சொல் உறுதிப்படுத்து *" : "Confirm Password *"}</label>
              <div className="input-with-icon">
                <Lock size={18} className="input-icon" />
                <input
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="Re-enter password"
                />
              </div>
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label>{lang === "ta" ? "தொலைபேசி எண்" : "Phone Number"}</label>
              <div className="input-with-icon">
                <Phone size={18} className="input-icon" />
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>

            <div className="form-group">
              <label>{lang === "ta" ? "முகவரி" : "Address"}</label>
              <div className="input-with-icon">
                <MapPin size={18} className="input-icon" />
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Chennai, India"
                />
              </div>
            </div>
          </div>

          <button type="submit" className="btn-auth-submit" disabled={loading}>
            <UserPlus size={18} />
            {loading ? t.loading : t.signUp}
          </button>
        </form>

        <div className="auth-card-footer">
          <span>{lang === "ta" ? "ஏற்கனவே கணக்கு உள்ளதா?" : "Already have an account?"}</span>
          <button type="button" className="btn-link" onClick={onSwitchToLogin}>
            {t.signIn}
          </button>
        </div>
      </div>
    </div>
  );
}
