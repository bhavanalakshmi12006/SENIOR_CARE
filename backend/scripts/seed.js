import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import * as XLSX from "xlsx";
import path from "node:path";
import { fileURLToPath } from "node:url";

import User from "../models/User.js";
import Senior from "../models/Senior.js";
import Caregiver from "../models/Caregiver.js";
import FamilyMember from "../models/FamilyMember.js";
import Volunteer from "../models/Volunteer.js";
import Checkin from "../models/Checkin.js";
import Emergency from "../models/Emergency.js";
import Appointment from "../models/Appointment.js";
import AssistanceRequest from "../models/AssistanceRequest.js";
import Fee from "../models/Fee.js";
import Payment from "../models/Payment.js";
import Notification from "../models/Notification.js";
import NotificationPreference from "../models/NotificationPreference.js";
import RecentlyAccessed from "../models/RecentlyAccessed.js";
import AuditLog from "../models/AuditLog.js";
import CareData from "../models/CareData.js";
import ModuleRecord from "../models/ModuleRecord.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017";
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || "senior_care";
const password = process.env.TESTER_PASSWORD || "SeniorCare@2026!";

async function seed() {
  console.log(`Connecting to MongoDB: ${MONGODB_URI} (${MONGODB_DB_NAME})...`);
  await mongoose.connect(MONGODB_URI, { dbName: MONGODB_DB_NAME });
  console.log("Connected to MongoDB!");

  const passwordHash = await bcrypt.hash(password, 10);

  // 1. Seed Users
  const userSeeds = [
    { email: "admin.test@seniorcare.local", displayName: "Administrator Rajesh", firstName: "Rajesh", lastName: "Sharma", role: "admin", phone: "+91 98765 00001", address: "Anna Nagar, Chennai" },
    { email: "staff.test@seniorcare.local", displayName: "Staff Murugan", firstName: "Murugan", lastName: "Pillai", role: "staff", phone: "+91 98765 00002", address: "T. Nagar, Chennai" },
    { email: "senior.test@seniorcare.local", displayName: "Lakshmi Devi", firstName: "Lakshmi", lastName: "Devi", role: "senior_citizen", phone: "+91 98765 43210", address: "Flat 104, Senior Haven, Adyar, Chennai" },
    { email: "family.test@seniorcare.local", displayName: "Priya Ramesh", firstName: "Priya", lastName: "Ramesh", role: "family_member", phone: "+91 98765 00003", address: "Velachery, Chennai" },
    { email: "caretaker.test@seniorcare.local", displayName: "Anitha Krishnan", firstName: "Anitha", lastName: "Krishnan", role: "caretaker", phone: "+91 98765 00004", address: "Mylapore, Chennai" },
    { email: "caregiver.test@seniorcare.local", displayName: "Anitha Krishnan", firstName: "Anitha", lastName: "Krishnan", role: "caretaker", phone: "+91 98765 00004", address: "Mylapore, Chennai" },
    { email: "volunteer.test@seniorcare.local", displayName: "Karthik Raman", firstName: "Karthik", lastName: "Raman", role: "volunteer", phone: "+91 98765 00005", address: "Thiruvanmiyur, Chennai" }
  ];

  const createdUsers = {};
  for (const u of userSeeds) {
    const user = await User.findOneAndUpdate(
      { email: u.email },
      { ...u, passwordHash, status: "active", preferredLanguage: "en", themePreference: "light" },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    createdUsers[u.role] = user;
    if (u.email.includes("senior")) createdUsers.seniorUser = user;
    if (u.email.includes("caretaker")) createdUsers.caretakerUser = user;
  }
  console.log("✓ Users seeded");

  // 2. Seed Seniors
  await Senior.deleteMany({});
  const seniorDocs = await Senior.insertMany([
    {
      userId: createdUsers.seniorUser._id,
      name: "Lakshmi Devi",
      age: 72,
      gender: "Female",
      phone: "+91 98765 43210",
      address: "Flat 104, Senior Haven, Adyar, Chennai",
      emergencyContactName: "Priya Ramesh (Daughter)",
      emergencyContactPhone: "+91 98765 00003",
      emergencyContactRelation: "Daughter",
      bloodGroup: "O+",
      medicalNotes: "Hypertension, Mild Type-2 Diabetes. Regular morning BP check needed.",
      roomNumber: "Room 104",
      assignedCaregiverId: createdUsers.caretakerUser._id,
      assignedCaregiverName: "Anitha Krishnan",
      familyMemberUserIds: [createdUsers.family_member._id],
      safetyStatus: "safe",
      lastCheckinAt: new Date(),
      checkinStreak: 14,
      status: "active"
    },
    {
      name: "Ramasamy Sundaram",
      age: 78,
      gender: "Male",
      phone: "+91 98765 43211",
      address: "Room 108, Senior Haven, Adyar, Chennai",
      emergencyContactName: "Suresh Sundaram (Son)",
      emergencyContactPhone: "+91 98765 11111",
      emergencyContactRelation: "Son",
      bloodGroup: "B+",
      medicalNotes: "Post knee replacement recovery, requires cane assistance.",
      roomNumber: "Room 108",
      assignedCaregiverId: createdUsers.caretakerUser._id,
      assignedCaregiverName: "Anitha Krishnan",
      safetyStatus: "safe",
      lastCheckinAt: new Date(Date.now() - 3600000 * 2),
      checkinStreak: 9,
      status: "active"
    },
    {
      name: "Meenakshi Ammal",
      age: 81,
      gender: "Female",
      phone: "+91 98765 43212",
      address: "Room 202, Senior Haven, Adyar, Chennai",
      emergencyContactName: "Geetha Mohan (Niece)",
      emergencyContactPhone: "+91 98765 22222",
      emergencyContactRelation: "Niece",
      bloodGroup: "A+",
      medicalNotes: "Mild memory lapses, arthritis, cataract surgery scheduled.",
      roomNumber: "Room 202",
      assignedCaregiverId: createdUsers.caretakerUser._id,
      assignedCaregiverName: "Anitha Krishnan",
      safetyStatus: "safe",
      lastCheckinAt: new Date(Date.now() - 3600000 * 4),
      checkinStreak: 5,
      status: "active"
    },
    {
      name: "Gopalakrishnan V",
      age: 75,
      gender: "Male",
      phone: "+91 98765 43213",
      address: "Room 205, Senior Haven, Adyar, Chennai",
      emergencyContactName: "Venkat G (Son)",
      emergencyContactPhone: "+91 98765 33333",
      emergencyContactRelation: "Son",
      bloodGroup: "AB+",
      medicalNotes: "Pacemaker implanted 2022, routine cardiac review.",
      roomNumber: "Room 205",
      assignedCaregiverId: createdUsers.caretakerUser._id,
      assignedCaregiverName: "Anitha Krishnan",
      safetyStatus: "safe",
      lastCheckinAt: new Date(Date.now() - 3600000 * 26),
      checkinStreak: 12,
      status: "active"
    },
    {
      name: "Saraswathi Natarajan",
      age: 69,
      gender: "Female",
      phone: "+91 98765 43214",
      address: "Room 301, Senior Haven, Adyar, Chennai",
      emergencyContactName: "Natarajan S (Husband)",
      emergencyContactPhone: "+91 98765 44444",
      emergencyContactRelation: "Husband",
      bloodGroup: "O-",
      medicalNotes: "Asthma, inhaler on bedside table.",
      roomNumber: "Room 301",
      assignedCaregiverId: createdUsers.caretakerUser._id,
      assignedCaregiverName: "Anitha Krishnan",
      safetyStatus: "safe",
      lastCheckinAt: new Date(Date.now() - 3600000 * 1),
      checkinStreak: 21,
      status: "active"
    }
  ]);
  console.log(`✓ Seniors seeded (${seniorDocs.length})`);
  const primarySenior = seniorDocs[0];

  // 3. Seed Caregiver & FamilyMember & Volunteer profiles
  await Caregiver.deleteMany({});
  await Caregiver.create({
    userId: createdUsers.caretakerUser._id,
    name: "Anitha Krishnan",
    phone: "+91 98765 00004",
    email: "caretaker.test@seniorcare.local",
    specialization: "Geriatric Nursing & Medication Supervision",
    assignedSeniorIds: seniorDocs.map(s => s._id),
    shift: "Morning",
    rating: 4.9,
    status: "active"
  });

  await FamilyMember.deleteMany({});
  await FamilyMember.create({
    userId: createdUsers.family_member._id,
    name: "Priya Ramesh",
    phone: "+91 98765 00003",
    email: "family.test@seniorcare.local",
    relation: "Daughter",
    linkedSeniorIds: [primarySenior._id],
    emergencyContact: true
  });

  await Volunteer.deleteMany({});
  await Volunteer.create({
    userId: createdUsers.volunteer._id,
    name: "Karthik Raman",
    phone: "+91 98765 00005",
    email: "volunteer.test@seniorcare.local",
    skills: ["Medicine Pickup", "Grocery Shopping", "Tech Assistance", "Wheelchair Support"],
    availability: "Weekdays 8am - 6pm",
    tasksCompleted: 42,
    status: "active"
  });
  console.log("✓ Caregiver, Family & Volunteer profiles seeded");

  // 4. Seed Checkins
  await Checkin.deleteMany({});
  const checkins = [
    { seniorId: primarySenior._id, seniorName: primarySenior.name, userId: createdUsers.seniorUser._id, status: "safe", mood: "good", notes: "Feeling great today, completed morning walk.", method: "self", timestamp: new Date() },
    { seniorId: primarySenior._id, seniorName: primarySenior.name, userId: createdUsers.seniorUser._id, status: "safe", mood: "good", notes: "Took morning medications on time.", method: "self", timestamp: new Date(Date.now() - 86400000) },
    { seniorId: primarySenior._id, seniorName: primarySenior.name, userId: createdUsers.seniorUser._id, status: "safe", mood: "okay", notes: "Slight joint ache, applied ointment.", method: "self", timestamp: new Date(Date.now() - 86400000 * 2) },
    { seniorId: seniorDocs[1]._id, seniorName: seniorDocs[1].name, status: "safe", mood: "good", notes: "Physiotherapy exercises done.", method: "caregiver", timestamp: new Date() },
    { seniorId: seniorDocs[2]._id, seniorName: seniorDocs[2].name, status: "safe", mood: "good", notes: "All good, had breakfast.", method: "caregiver", timestamp: new Date() },
    { seniorId: seniorDocs[3]._id, seniorName: seniorDocs[3].name, status: "safe", mood: "okay", notes: "Resting comfortably.", method: "self", timestamp: new Date(Date.now() - 86400000) }
  ];
  await Checkin.insertMany(checkins);
  console.log("✓ Check-ins seeded");

  // 5. Seed Emergencies
  await Emergency.deleteMany({});
  const emergencies = [
    {
      emergencyCode: "EMG-1024",
      seniorId: primarySenior._id,
      seniorName: primarySenior.name,
      triggeredBy: createdUsers.seniorUser._id,
      triggeredRole: "senior_citizen",
      status: "active",
      severity: "critical",
      location: "Room 104 - Bedside",
      notes: "Severe shortness of breath reported. Caregiver dispatched.",
      acknowledgedBy: "Anitha Krishnan (Caregiver)",
      acknowledgedAt: new Date(Date.now() - 600000),
      actionsTaken: [
        { note: "Emergency triggered via mobile dashboard", actionTime: new Date(Date.now() - 900000), by: "Lakshmi Devi" },
        { note: "Caregiver Anitha acknowledged alert and reached room", actionTime: new Date(Date.now() - 600000), by: "Anitha Krishnan" }
      ]
    },
    {
      emergencyCode: "EMG-1022",
      seniorId: seniorDocs[1]._id,
      seniorName: seniorDocs[1].name,
      triggeredBy: createdUsers.caretakerUser._id,
      triggeredRole: "caretaker",
      status: "resolved",
      severity: "high",
      location: "Garden Walking Track",
      notes: "Mild dizziness during morning walk. Vitals checked, blood pressure 130/85. Resolved with rest and glucose water.",
      acknowledgedBy: "Anitha Krishnan",
      acknowledgedAt: new Date(Date.now() - 86400000 * 3),
      resolvedBy: "Anitha Krishnan",
      resolvedAt: new Date(Date.now() - 86400000 * 3 + 3600000)
    }
  ];
  await Emergency.insertMany(emergencies);
  console.log("✓ Emergencies seeded");

  // 6. Seed Appointments
  await Appointment.deleteMany({});
  const appointments = [
    {
      appointmentCode: "APT-201",
      seniorId: primarySenior._id,
      seniorName: primarySenior.name,
      doctorName: "Dr. S. Kumar, MD (Cardiology)",
      department: "Cardiology",
      hospital: "Apollo Senior Health Center",
      appointmentDate: new Date(Date.now() + 86400000 * 1),
      timeSlot: "10:30 AM",
      status: "Upcoming",
      notes: "Quarterly ECG and hypertension review.",
      reminderSent: true
    },
    {
      appointmentCode: "APT-202",
      seniorId: seniorDocs[1]._id,
      seniorName: seniorDocs[1].name,
      doctorName: "Dr. R. Malathi, MS (Ophthalmology)",
      department: "Ophthalmology",
      hospital: "Sankara Nethralaya",
      appointmentDate: new Date(Date.now() + 86400000 * 3),
      timeSlot: "02:00 PM",
      status: "Upcoming",
      notes: "Post-op cataract check."
    },
    {
      appointmentCode: "APT-203",
      seniorId: seniorDocs[2]._id,
      seniorName: seniorDocs[2].name,
      doctorName: "Dr. P. Vijay, MS (Orthopedics)",
      department: "Orthopedics",
      hospital: "Fortis Malar Hospital",
      appointmentDate: new Date(Date.now() + 86400000 * 5),
      timeSlot: "11:15 AM",
      status: "Upcoming",
      notes: "Knee arthritis assessment."
    },
    {
      appointmentCode: "APT-195",
      seniorId: primarySenior._id,
      seniorName: primarySenior.name,
      doctorName: "Dr. K. Narayanan (General Physician)",
      department: "General Medicine",
      hospital: "Apollo Senior Health Center",
      appointmentDate: new Date(Date.now() - 86400000 * 7),
      timeSlot: "09:30 AM",
      status: "Completed",
      notes: "Routine quarterly physical examination - all vitals stable."
    }
  ];
  await Appointment.insertMany(appointments);
  console.log("✓ Appointments seeded");

  // 7. Seed Assistance Requests
  await AssistanceRequest.deleteMany({});
  const assistanceRequests = [
    {
      seniorId: primarySenior._id,
      seniorName: primarySenior.name,
      category: "Medicine Pickup",
      title: "Prescription Refill for BP & Diabetes",
      description: "Needs 1 month supply of Amlodipine 5mg and Metformin 500mg from Apollo Pharmacy.",
      priority: "High",
      status: "In Progress",
      requestedBy: createdUsers.seniorUser._id,
      assignedTo: createdUsers.volunteer._id,
      assignedToName: "Karthik Raman (Volunteer)",
      assignedRole: "volunteer",
      notes: "Volunteer picked up prescription, expected delivery 4:00 PM."
    },
    {
      seniorId: primarySenior._id,
      seniorName: primarySenior.name,
      category: "Food Assistance",
      title: "Low-Sodium Diabetic Lunch Delivery",
      description: "Special diet meal box from Care Nutrition Center.",
      priority: "Normal",
      status: "Completed",
      requestedBy: createdUsers.seniorUser._id,
      assignedTo: createdUsers.caretakerUser._id,
      assignedToName: "Anitha Krishnan (Caregiver)",
      assignedRole: "caretaker",
      completedAt: new Date(Date.now() - 3600000 * 3),
      notes: "Lunch delivered to Room 104."
    },
    {
      seniorId: seniorDocs[1]._id,
      seniorName: seniorDocs[1].name,
      category: "Travel Assistance",
      title: "Wheelchair escort to Eye Clinic",
      description: "Needs escort for appointment on Thursday afternoon.",
      priority: "Normal",
      status: "Accepted",
      assignedTo: createdUsers.volunteer._id,
      assignedToName: "Karthik Raman",
      assignedRole: "volunteer"
    },
    {
      seniorId: seniorDocs[2]._id,
      seniorName: seniorDocs[2].name,
      category: "Home Assistance",
      title: "Bathroom Anti-slip Mat Installation",
      description: "Install safety grip mats in shower area.",
      priority: "High",
      status: "Requested",
      requestedBy: createdUsers.staff._id
    }
  ];
  await AssistanceRequest.insertMany(assistanceRequests);
  console.log("✓ Assistance Requests seeded");

  // 8. Seed Fees & Payments
  await Fee.deleteMany({});
  const feeDocs = await Fee.insertMany([
    {
      feeCode: "FEE-301",
      seniorId: primarySenior._id,
      seniorName: primarySenior.name,
      title: "October 2026 Monthly Care & Assisted Living",
      category: "Monthly Care",
      totalAmount: 12000,
      paidAmount: 8000,
      remainingAmount: 4000,
      dueDate: new Date(Date.now() + 86400000 * 10),
      status: "Partially Paid",
      notes: "Includes daily nurse visits, food management, and 24/7 emergency response."
    },
    {
      feeCode: "FEE-302",
      seniorId: seniorDocs[1]._id,
      seniorName: seniorDocs[1].name,
      title: "Physiotherapy Package (10 Sessions)",
      category: "Physiotherapy",
      totalAmount: 5000,
      paidAmount: 5000,
      remainingAmount: 0,
      dueDate: new Date(Date.now() - 86400000 * 2),
      status: "Paid",
      notes: "Post knee surgery rehabilitation sessions."
    },
    {
      feeCode: "FEE-303",
      seniorId: seniorDocs[2]._id,
      seniorName: seniorDocs[2].name,
      title: "Specialist Geriatric Consultation & Labs",
      category: "Medical Consultation",
      totalAmount: 3500,
      paidAmount: 0,
      remainingAmount: 3500,
      dueDate: new Date(Date.now() - 86400000 * 4),
      status: "Overdue",
      notes: "Blood panel and cardiologist review."
    },
    {
      feeCode: "FEE-304",
      seniorId: primarySenior._id,
      seniorName: primarySenior.name,
      title: "Dietary Nutrition Plan (Quarterly)",
      category: "Meals",
      totalAmount: 4500,
      paidAmount: 4500,
      remainingAmount: 0,
      dueDate: new Date(Date.now() - 86400000 * 20),
      status: "Paid",
      notes: "Custom diabetic meals for 3 months."
    }
  ]);
  console.log("✓ Fees seeded");

  await Payment.deleteMany({});
  await Payment.insertMany([
    {
      paymentCode: "PAY-901",
      feeId: feeDocs[0]._id,
      seniorId: primarySenior._id,
      seniorName: primarySenior.name,
      amount: 8000,
      paymentMethod: "UPI",
      transactionRef: "UPI/20261001/99281726",
      paidAt: new Date(Date.now() - 86400000 * 3),
      recordedBy: createdUsers.staff._id,
      recordedByName: "Staff Murugan",
      notes: "Part payment received from Priya Ramesh via GPay."
    },
    {
      paymentCode: "PAY-902",
      feeId: feeDocs[1]._id,
      seniorId: seniorDocs[1]._id,
      seniorName: seniorDocs[1].name,
      amount: 5000,
      paymentMethod: "Credit/Debit Card",
      transactionRef: "TXN-8827361",
      paidAt: new Date(Date.now() - 86400000 * 5),
      recordedBy: createdUsers.admin._id,
      recordedByName: "Admin Rajesh",
      notes: "Full payment settled."
    },
    {
      paymentCode: "PAY-903",
      feeId: feeDocs[3]._id,
      seniorId: primarySenior._id,
      seniorName: primarySenior.name,
      amount: 4500,
      paymentMethod: "Net Banking",
      transactionRef: "NEFT-HDFC-9921",
      paidAt: new Date(Date.now() - 86400000 * 21),
      recordedBy: createdUsers.staff._id,
      recordedByName: "Staff Murugan",
      notes: "Quarterly meal plan paid in full."
    }
  ]);
  console.log("✓ Payments seeded");

  // 9. Seed Notifications
  await Notification.deleteMany({});
  await Notification.insertMany([
    {
      recipientUserId: createdUsers.seniorUser._id,
      recipientRole: "senior_citizen",
      type: "emergency",
      title: "🚨 Emergency Alert Active",
      message: "Emergency assistance EMG-1024 has been acknowledged by Caregiver Anitha.",
      priority: "critical",
      link: "/emergencies",
      createdAt: new Date(Date.now() - 600000)
    },
    {
      recipientUserId: createdUsers.seniorUser._id,
      recipientRole: "senior_citizen",
      type: "checkin",
      title: "✓ Safety Check-in Recorded",
      message: "Your daily check-in was successfully recorded. Keep up the streak!",
      priority: "normal",
      link: "/safety",
      createdAt: new Date(Date.now() - 3600000 * 2)
    },
    {
      recipientUserId: createdUsers.seniorUser._id,
      recipientRole: "senior_citizen",
      type: "appointment",
      title: "📅 Appointment Tomorrow",
      message: "Dr. S. Kumar at Apollo Senior Health Center at 10:30 AM.",
      priority: "high",
      link: "/appointments",
      createdAt: new Date(Date.now() - 3600000 * 5)
    },
    {
      recipientUserId: createdUsers.family_member._id,
      recipientRole: "family_member",
      type: "emergency",
      title: "🚨 Emergency Notification",
      message: "Lakshmi Devi has triggered emergency alert EMG-1024. Caregiver is attending.",
      priority: "critical",
      link: "/emergencies",
      createdAt: new Date(Date.now() - 900000)
    },
    {
      recipientUserId: createdUsers.caretakerUser._id,
      recipientRole: "caretaker",
      type: "emergency",
      title: "🚨 Emergency Alert: Lakshmi Devi",
      message: "Immediate attention requested in Room 104. Shortness of breath.",
      priority: "critical",
      link: "/emergencies",
      createdAt: new Date(Date.now() - 900000)
    },
    {
      recipientUserId: createdUsers.volunteer._id,
      recipientRole: "volunteer",
      type: "assistance",
      title: "🤝 Assistance Request Assigned",
      message: "You have been assigned to medicine pickup for Lakshmi Devi.",
      priority: "high",
      link: "/assistance",
      createdAt: new Date(Date.now() - 3600000 * 6)
    }
  ]);
  console.log("✓ Notifications seeded");

  // 10. Seed Notification Preferences
  await NotificationPreference.deleteMany({});
  for (const r of Object.keys(createdUsers)) {
    const user = createdUsers[r];
    if (user?._id) {
      await NotificationPreference.findOneAndUpdate(
        { userId: user._id },
        {
          userId: user._id,
          emergency: { inApp: true, email: true, sms: true, whatsapp: true },
          appointments: { inApp: true, email: true, sms: true, whatsapp: false },
          checkins: { inApp: true, email: false, sms: false, whatsapp: false },
          fees: { inApp: true, email: true, sms: false, whatsapp: false }
        },
        { upsert: true }
      );
    }
  }

  // 11. Seed Recently Accessed
  await RecentlyAccessed.deleteMany({});
  await RecentlyAccessed.insertMany([
    {
      userId: createdUsers.admin._id,
      itemType: "senior",
      itemId: primarySenior._id.toString(),
      title: primarySenior.name,
      subtitle: "Senior Profile · Room 104",
      accessedAt: new Date(Date.now() - 120000)
    },
    {
      userId: createdUsers.admin._id,
      itemType: "emergency",
      itemId: "EMG-1024",
      title: "EMG-1024 · Lakshmi Devi",
      subtitle: "Critical Emergency Alert",
      accessedAt: new Date(Date.now() - 300000)
    },
    {
      userId: createdUsers.admin._id,
      itemType: "appointment",
      itemId: "APT-201",
      title: "APT-201 · Dr. S. Kumar",
      subtitle: "Cardiology · Tomorrow 10:30 AM",
      accessedAt: new Date(Date.now() - 600000)
    }
  ]);

  // 12. Seed Audit Log
  await AuditLog.deleteMany({});
  await AuditLog.insertMany([
    { action: "EMERGENCY_TRIGGERED", performedBy: createdUsers.seniorUser._id, performedByName: "Lakshmi Devi", performedByRole: "senior_citizen", targetEntity: "Emergency", targetId: "EMG-1024", details: "Emergency alert triggered from room 104", timestamp: new Date(Date.now() - 900000) },
    { action: "EMERGENCY_ACKNOWLEDGED", performedBy: createdUsers.caretakerUser._id, performedByName: "Anitha Krishnan", performedByRole: "caretaker", targetEntity: "Emergency", targetId: "EMG-1024", details: "Caregiver acknowledged and attended", timestamp: new Date(Date.now() - 600000) },
    { action: "CHECKIN_RECORDED", performedBy: createdUsers.seniorUser._id, performedByName: "Lakshmi Devi", performedByRole: "senior_citizen", targetEntity: "Checkin", targetId: "CHECK-01", details: "Daily wellness check-in completed", timestamp: new Date(Date.now() - 3600000 * 2) },
    { action: "PAYMENT_RECORDED", performedBy: createdUsers.staff._id, performedByName: "Staff Murugan", performedByRole: "staff", targetEntity: "Payment", targetId: "PAY-901", details: "Recorded ₹8,000 via UPI for FEE-301", timestamp: new Date(Date.now() - 86400000 * 3) }
  ]);
  console.log("✓ Audit Logs seeded");

  // 13. Generate sample_data.xlsx in project root
  const wb = XLSX.utils.book_new();

  // Users sheet
  const usersSheetData = [
    ["Email", "Full Name", "Role", "Phone", "Address"],
    ...userSeeds.map(u => [u.email, u.displayName, u.role, u.phone, u.address])
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(usersSheetData), "Users");

  // Seniors sheet
  const seniorsSheetData = [
    ["Name", "Age", "Gender", "Phone", "Room", "Blood Group", "Medical Notes", "Emergency Contact", "Emergency Phone"],
    ...seniorDocs.map(s => [s.name, s.age, s.gender, s.phone, s.roomNumber, s.bloodGroup, s.medicalNotes, s.emergencyContactName, s.emergencyContactPhone])
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(seniorsSheetData), "Seniors");

  // Family Members sheet
  const familySheetData = [
    ["Name", "Phone", "Email", "Relation", "Linked Senior"],
    ["Priya Ramesh", "+91 98765 00003", "family.test@seniorcare.local", "Daughter", "Lakshmi Devi"]
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(familySheetData), "Family Members");

  // Caregivers sheet
  const caregiverSheetData = [
    ["Name", "Phone", "Email", "Specialization", "Shift", "Rating"],
    ["Anitha Krishnan", "+91 98765 00004", "caretaker.test@seniorcare.local", "Geriatric Care", "Morning", 4.9]
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(caregiverSheetData), "Caregivers");

  // Volunteers sheet
  const volunteerSheetData = [
    ["Name", "Phone", "Email", "Skills", "Availability", "Tasks Completed"],
    ["Karthik Raman", "+91 98765 00005", "volunteer.test@seniorcare.local", "Medicine, Grocery, Tech", "Weekdays 8am - 6pm", 42]
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(volunteerSheetData), "Volunteers");

  // Check-ins sheet
  const checkinsSheetData = [
    ["Senior Name", "Status", "Mood", "Notes", "Timestamp"],
    ...checkins.map(c => [c.seniorName, c.status, c.mood, c.notes, c.timestamp.toISOString()])
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(checkinsSheetData), "Check-ins");

  // Emergencies sheet
  const emergenciesSheetData = [
    ["Emergency Code", "Senior Name", "Status", "Severity", "Location", "Notes"],
    ...emergencies.map(e => [e.emergencyCode, e.seniorName, e.status, e.severity, e.location, e.notes])
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(emergenciesSheetData), "Emergencies");

  // Appointments sheet
  const appointmentsSheetData = [
    ["Appointment Code", "Senior Name", "Doctor", "Department", "Hospital", "Date/Time", "Status"],
    ...appointments.map(a => [a.appointmentCode, a.seniorName, a.doctorName, a.department, a.hospital, `${a.appointmentDate.toISOString().split("T")[0]} ${a.timeSlot}`, a.status])
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(appointmentsSheetData), "Appointments");

  // Assistance Requests sheet
  const assistanceSheetData = [
    ["Senior Name", "Category", "Title", "Priority", "Status", "Assigned To"],
    ...assistanceRequests.map(r => [r.seniorName, r.category, r.title, r.priority, r.status, r.assignedToName || "Unassigned"])
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(assistanceSheetData), "Assistance Requests");

  // Fees sheet
  const feesSheetData = [
    ["Fee Code", "Senior Name", "Title", "Category", "Total", "Paid", "Remaining", "Status"],
    ...feeDocs.map(f => [f.feeCode, f.seniorName, f.title, f.category, f.totalAmount, f.paidAmount, f.remainingAmount, f.status])
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(feesSheetData), "Fees");

  // Payments sheet
  const paymentsSheetData = [
    ["Payment Code", "Senior Name", "Amount", "Method", "Transaction Ref", "Recorded By"],
    ["PAY-901", "Lakshmi Devi", 8000, "UPI", "UPI/20261001/99281726", "Staff Murugan"],
    ["PAY-902", "Ramasamy Sundaram", 5000, "Credit/Debit Card", "TXN-8827361", "Admin Rajesh"],
    ["PAY-903", "Lakshmi Devi", 4500, "Net Banking", "NEFT-HDFC-9921", "Staff Murugan"]
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(paymentsSheetData), "Payments");

  const excelPath = path.resolve(__dirname, "../../sample_data.xlsx");
  XLSX.writeFile(wb, excelPath);
  console.log(`✓ Generated realistic Excel sample file: ${excelPath}`);

  await mongoose.disconnect();
  console.log("\n=======================================================");
  console.log("SEEDED ALL DATA SUCCESSFULLY INTO MONGODB COMPASS!");
  console.log("Database: senior_care");
  console.log("Collections: users, seniors, caregivers, familymembers,");
  console.log("             volunteers, checkins, emergencies, appointments,");
  console.log("             assistancerequests, fees, payments, notifications,");
  console.log("             notificationpreferences, recentlyaccesseds, auditlogs");
  console.log("Password for all test accounts: SeniorCare@2026!");
  console.log("=======================================================\n");
}

seed().catch(err => {
  console.error("Seed error:", err);
  process.exit(1);
});
