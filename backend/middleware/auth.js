import jwt from "jsonwebtoken";
import User from "../models/User.js";

export async function authenticate(req, res, next) {
  const header = req.headers.authorization || "";
  const token = (header.startsWith("Bearer ") ? header.slice(7) : null) || req.query.token;
  if (!token) return res.status(401).json({ message: "Authentication required" });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || "seniorcare-secure-jwt-key-2026");
    const user = await User.findById(payload.sub).select("-passwordHash");
    if (!user || user.status !== "active") return res.status(401).json({ message: "Invalid or inactive session" });
    
    // Normalize role so caretaker and caregiver are equivalent
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

export async function authenticateOptional(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return next();
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || "seniorcare-secure-jwt-key-2026");
    const user = await User.findById(payload.sub).select("-passwordHash");
    if (user && user.status === "active") {
      req.user = user;
    }
  } catch (err) {
    // optional, continue
  }
  next();
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: "Authentication required" });
    const userRole = req.user.role;
    const allowed = roles.some(r => {
      if (r === "caregiver" && (userRole === "caregiver" || userRole === "caretaker")) return true;
      if (r === "caretaker" && (userRole === "caregiver" || userRole === "caretaker")) return true;
      return r === userRole;
    });
    if (!allowed && userRole !== "admin") {
      return res.status(403).json({ message: "Insufficient permissions for this operation" });
    }
    next();
  };
}
