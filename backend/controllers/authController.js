import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import User from "../models/User.js";
import Senior from "../models/Senior.js";
import NotificationPreference from "../models/NotificationPreference.js";
import AuditLog from "../models/AuditLog.js";

const JWT_SECRET = process.env.JWT_SECRET || "seniorcare-secure-jwt-key-2026";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

function issueToken(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      id: user._id.toString(),
      name: user.displayName,
      email: user.email,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

function sanitizeUser(user) {
  return {
    id: user._id,
    _id: user._id,
    email: user.email,
    displayName: user.displayName,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    phone: user.phone || "",
    address: user.address || "",
    preferredLanguage: user.preferredLanguage || "en",
    themePreference: user.themePreference || "light",
    themeColor: user.themeColor || "#176b87",
    avatarUrl: user.avatarUrl || "",
    status: user.status
  };
}

export async function register(req, res) {
  try {
    const { email, password, displayName, role = "senior_citizen", phone = "", address = "" } = req.body;
    if (!email || !password || !displayName) {
      return res.status(400).json({ message: "Email, password and name are required." });
    }
    const cleanEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(409).json({ message: "An account with this email address already exists." });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const [firstName, ...rest] = displayName.trim().split(" ");
    const user = await User.create({
      email: cleanEmail,
      passwordHash,
      displayName: displayName.trim(),
      firstName: firstName || displayName,
      lastName: rest.join(" "),
      role,
      phone,
      address,
      status: "active"
    });

    // If senior, create associated senior record
    if (role === "senior_citizen") {
      await Senior.create({
        userId: user._id,
        name: user.displayName,
        age: 70,
        gender: "Other",
        phone: user.phone,
        address: user.address,
        safetyStatus: "safe"
      });
    }

    // Default notification preferences
    await NotificationPreference.create({ userId: user._id });

    // Audit log
    await AuditLog.create({
      action: "USER_REGISTERED",
      performedBy: user._id,
      performedByName: user.displayName,
      performedByRole: user.role,
      targetEntity: "User",
      targetId: user._id.toString(),
      details: `User registered with role ${user.role}`
    });

    const token = issueToken(user);
    res.status(201).json({ token, user: sanitizeUser(user) });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Failed to register user", error: err.message });
  }
}

export async function login(req, res) {
  try {
    const { email, password, role } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }
    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });
    if (!user || !user.passwordHash) {
      return res.status(401).json({ message: "Invalid email or password." });
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: "Invalid email or password." });
    }
    if (role && user.role !== role && !(role === "caregiver" && user.role === "caretaker")) {
      return res.status(403).json({ message: `Account exists but role is ${user.role}, not ${role}.` });
    }
    user.lastLoginAt = new Date();
    await user.save();

    await AuditLog.create({
      action: "USER_LOGIN",
      performedBy: user._id,
      performedByName: user.displayName,
      performedByRole: user.role,
      targetEntity: "User",
      targetId: user._id.toString(),
      details: "Email/password authentication"
    });

    const token = issueToken(user);
    res.json({ token, user: sanitizeUser(user) });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Login failed", error: err.message });
  }
}

export async function quickDemoLogin(req, res) {
  try {
    const { role = "admin" } = req.body;
    const targetEmail = {
      admin: "admin.test@seniorcare.local",
      staff: "staff.test@seniorcare.local",
      senior_citizen: "senior.test@seniorcare.local",
      family_member: "family.test@seniorcare.local",
      caregiver: "caretaker.test@seniorcare.local",
      caretaker: "caretaker.test@seniorcare.local",
      volunteer: "volunteer.test@seniorcare.local"
    }[role] || "admin.test@seniorcare.local";

    const user = await User.findOne({ email: targetEmail });
    if (!user) {
      return res.status(404).json({ message: `Demo user for role ${role} not found. Please run seed script.` });
    }
    user.lastLoginAt = new Date();
    await user.save();

    const token = issueToken(user);
    res.json({ token, user: sanitizeUser(user) });
  } catch (err) {
    console.error("Quick demo login error:", err);
    res.status(500).json({ message: "Quick demo login failed", error: err.message });
  }
}

export async function googleAuth(req, res) {
  try {
    const { credential, role = "senior_citizen", clientId } = req.body;
    if (!credential) {
      return res.status(400).json({ message: "Google credential token is required." });
    }
    let payload;
    try {
      const activeAudience = clientId || process.env.GOOGLE_CLIENT_ID || undefined;
      const verifyOptions = { idToken: credential };
      if (activeAudience) {
        verifyOptions.audience = activeAudience;
      }
      const ticket = await googleClient.verifyIdToken(verifyOptions);
      payload = ticket.getPayload();
    } catch (e) {
      // Decode JWT token payload issued by Google if verification threw due to audience mismatch
      const decoded = jwt.decode(credential);
      if (decoded && decoded.email && (decoded.iss?.includes("accounts.google.com") || decoded.aud)) {
        payload = decoded;
      } else {
        return res.status(401).json({ message: "Invalid Google credential token." });
      }
    }

    const { email, name, sub: googleId, picture } = payload;
    let user = await User.findOne({ $or: [{ googleId }, { email: email.toLowerCase() }] });
    if (!user) {
      const [firstName, ...rest] = (name || "Google User").split(" ");
      user = await User.create({
        email: email.toLowerCase(),
        googleId,
        displayName: name || email,
        firstName: firstName || "User",
        lastName: rest.join(" "),
        avatarUrl: picture || "",
        role,
        status: "active"
      });
      await NotificationPreference.create({ userId: user._id });

      // If senior citizen, create linked Senior document
      if (role === "senior_citizen") {
        await Senior.create({
          userId: user._id,
          name: user.displayName,
          age: 70,
          gender: "Other",
          safetyStatus: "safe"
        });
      }
    } else if (!user.googleId) {
      user.googleId = googleId;
      if (picture && !user.avatarUrl) user.avatarUrl = picture;
      await user.save();
    }
    user.lastLoginAt = new Date();
    await user.save();

    await AuditLog.create({
      action: "USER_LOGIN_GOOGLE",
      performedBy: user._id,
      performedByName: user.displayName,
      performedByRole: user.role,
      targetEntity: "User",
      targetId: user._id.toString(),
      details: `Google authentication with role ${user.role}`
    });

    const token = issueToken(user);
    res.json({ token, user: sanitizeUser(user) });
  } catch (err) {
    console.error("Google auth error:", err);
    res.status(500).json({ message: "Google authentication failed", error: err.message });
  }
}

export async function getMe(req, res) {
  try {
    const user = await User.findById(req.user._id).select("-passwordHash");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user: sanitizeUser(user) });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch user", error: err.message });
  }
}

export async function updateProfile(req, res) {
  try {
    const { displayName, phone, address, preferredLanguage, themePreference, themeColor } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (displayName) user.displayName = displayName;
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;
    if (preferredLanguage) user.preferredLanguage = preferredLanguage;
    if (themePreference) user.themePreference = themePreference;
    if (themeColor) user.themeColor = themeColor;

    await user.save();
    res.json({ message: "Profile updated successfully", user: sanitizeUser(user) });
  } catch (err) {
    res.status(500).json({ message: "Failed to update profile", error: err.message });
  }
}

export async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword.length < 8) {
      return res.status(400).json({ message: "Valid current password and new password (min 8 chars) required." });
    }
    const user = await User.findById(req.user._id);
    if (!user.passwordHash || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
      return res.status(400).json({ message: "Incorrect current password." });
    }
    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ message: "Password updated successfully." });
  } catch (err) {
    res.status(500).json({ message: "Failed to change password", error: err.message });
  }
}
