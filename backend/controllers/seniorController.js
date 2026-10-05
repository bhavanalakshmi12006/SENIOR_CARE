import Senior from "../models/Senior.js";
import Checkin from "../models/Checkin.js";
import Emergency from "../models/Emergency.js";
import Appointment from "../models/Appointment.js";
import Fee from "../models/Fee.js";
import AssistanceRequest from "../models/AssistanceRequest.js";
import AuditLog from "../models/AuditLog.js";

export async function getSeniors(req, res) {
  try {
    const { search = "", status, safetyStatus } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (safetyStatus) filter.safetyStatus = safetyStatus;

    // Role scoping: A family member should only be associated to 1 or 2 seniors
    if (req.user?.role === "family_member") {
      let famSeniors = await Senior.find({
        $or: [
          { familyMemberUserIds: req.user._id },
          { emergencyContactPhone: req.user.phone || "---" }
        ]
      }).limit(2);

      // If no seniors associated yet, link top 2 seniors to this family member
      if (famSeniors.length === 0) {
        const topSeniors = await Senior.find({ status: "active" }).limit(2);
        for (const s of topSeniors) {
          if (!s.familyMemberUserIds.some(uid => uid.toString() === req.user._id.toString())) {
            s.familyMemberUserIds.push(req.user._id);
            await s.save();
          }
        }
        famSeniors = topSeniors;
      }
      filter._id = { $in: famSeniors.map(s => s._id) };
    } else if (req.user?.role === "senior_citizen") {
      let mySenior = await Senior.findOne({
        $or: [
          { userId: req.user._id },
          { phone: req.user.phone || "---" }
        ]
      });
      if (!mySenior) {
        mySenior = await Senior.findOne({ status: "active" });
        if (mySenior) {
          mySenior.userId = req.user._id;
          await mySenior.save();
        }
      }
      filter._id = mySenior ? mySenior._id : null;
    }

    if (search) {
      const searchTerms = [
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { roomNumber: { $regex: search, $options: "i" } }
      ];
      if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, { $or: searchTerms }];
        delete filter.$or;
      } else {
        filter.$or = searchTerms;
      }
    }
    const seniors = await Senior.find(filter).sort({ name: 1 });
    res.json({ seniors });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch seniors", error: err.message });
  }
}

export async function getSeniorById(req, res) {
  try {
    const { id } = req.params;
    const senior = await Senior.findById(id);
    if (!senior) return res.status(404).json({ message: "Senior citizen not found" });

    // Strict Role-Based Access Control
    if (req.user?.role === "senior_citizen") {
      const isOwner = (senior.userId && senior.userId.toString() === req.user._id.toString()) || 
                      (senior.phone && senior.phone === req.user.phone);
      if (!isOwner) {
        return res.status(403).json({ message: "Access denied. Senior citizens can only access their own records." });
      }
    } else if (req.user?.role === "family_member") {
      const isLinked = (senior.familyMemberUserIds && senior.familyMemberUserIds.some(uid => uid.toString() === req.user._id.toString())) ||
                       (senior.emergencyContactPhone && senior.emergencyContactPhone === req.user.phone);
      if (!isLinked) {
        return res.status(403).json({ message: "Access denied. You can only view your associated family elders." });
      }
    } else if (req.user?.role === "caretaker" || req.user?.role === "caregiver") {
      const isAssigned = (senior.assignedCaregiverId && senior.assignedCaregiverId.toString() === req.user._id.toString()) ||
                         (senior.assignedCaregiverName && senior.assignedCaregiverName.toLowerCase() === req.user.displayName.toLowerCase());
      // Caregiver can view assigned resident details
    }

    // Parallel fetch related details
    const [checkins, emergencies, appointments, fees, assistanceRequests] = await Promise.all([
      Checkin.find({ seniorId: id }).sort({ timestamp: -1 }).limit(10),
      Emergency.find({ seniorId: id }).sort({ createdAt: -1 }),
      Appointment.find({ seniorId: id }).sort({ appointmentDate: -1 }),
      Fee.find({ seniorId: id }).sort({ dueDate: -1 }),
      AssistanceRequest.find({ seniorId: id }).sort({ createdAt: -1 })
    ]);

    res.json({
      senior,
      checkins,
      emergencies,
      appointments,
      fees,
      assistanceRequests
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch senior profile", error: err.message });
  }
}

export async function createSenior(req, res) {
  try {
    const {
      name, age, gender, phone = "", address = "",
      emergencyContactName = "", emergencyContactPhone = "", emergencyContactRelation = "",
      bloodGroup = "O+", medicalNotes = "", roomNumber = "", assignedCaregiverName = ""
    } = req.body;

    if (!name || !age || !gender) {
      return res.status(400).json({ message: "Name, age, and gender are required" });
    }

    const senior = await Senior.create({
      name,
      age: Number(age),
      gender,
      phone,
      address,
      emergencyContactName,
      emergencyContactPhone,
      emergencyContactRelation,
      bloodGroup,
      medicalNotes,
      roomNumber,
      assignedCaregiverName,
      safetyStatus: "safe",
      lastCheckinAt: new Date()
    });

    await AuditLog.create({
      action: "SENIOR_CREATED",
      performedBy: req.user?._id,
      performedByName: req.user?.displayName || "Staff",
      performedByRole: req.user?.role || "staff",
      targetEntity: "Senior",
      targetId: senior._id.toString(),
      details: `Created senior citizen profile for ${senior.name}`
    });

    res.status(201).json({ message: "Senior citizen created successfully", senior });
  } catch (err) {
    res.status(500).json({ message: "Failed to create senior", error: err.message });
  }
}

export async function updateSenior(req, res) {
  try {
    const { id } = req.params;
    const senior = await Senior.findByIdAndUpdate(id, req.body, { new: true });
    if (!senior) return res.status(404).json({ message: "Senior not found" });

    await AuditLog.create({
      action: "SENIOR_UPDATED",
      performedBy: req.user?._id,
      performedByName: req.user?.displayName,
      performedByRole: req.user?.role,
      targetEntity: "Senior",
      targetId: senior._id.toString(),
      details: `Updated details for ${senior.name}`
    });

    res.json({ message: "Senior profile updated", senior });
  } catch (err) {
    res.status(500).json({ message: "Failed to update senior", error: err.message });
  }
}

export async function deleteSenior(req, res) {
  try {
    const { id } = req.params;
    const senior = await Senior.findByIdAndDelete(id);
    if (!senior) return res.status(404).json({ message: "Senior not found" });

    await AuditLog.create({
      action: "SENIOR_DELETED",
      performedBy: req.user?._id,
      performedByName: req.user?.displayName,
      performedByRole: req.user?.role,
      targetEntity: "Senior",
      targetId: id,
      details: `Deleted senior citizen profile ${senior.name}`
    });

    res.json({ message: "Senior citizen deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete senior", error: err.message });
  }
}

export async function getFamilyAssociatedSeniors(req, res) {
  try {
    let seniors = await Senior.find({
      $or: [
        { familyMemberUserIds: req.user._id },
        { emergencyContactPhone: req.user.phone || "---" }
      ]
    }).limit(2);

    if (seniors.length === 0) {
      const topSeniors = await Senior.find({ status: "active" }).limit(2);
      for (const s of topSeniors) {
        if (!s.familyMemberUserIds.some(uid => uid.toString() === req.user._id.toString())) {
          s.familyMemberUserIds.push(req.user._id);
          await s.save();
        }
      }
      seniors = topSeniors;
    }

    res.json({ seniors, count: seniors.length });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch family associated seniors", error: err.message });
  }
}

export async function associateSeniorWithFamily(req, res) {
  try {
    const { id } = req.params;
    const senior = await Senior.findById(id);
    if (!senior) return res.status(404).json({ message: "Senior not found" });

    // Enforce max 2 seniors per family member
    const existingCount = await Senior.countDocuments({ 
      familyMemberUserIds: req.user._id,
      _id: { $ne: senior._id }
    });
    const isAlreadyLinked = senior.familyMemberUserIds.some(uid => uid.toString() === req.user._id.toString());

    if (!isAlreadyLinked) {
      if (existingCount >= 2) {
        return res.status(400).json({ message: "A family member can be associated with at most 2 seniors." });
      }
      senior.familyMemberUserIds.push(req.user._id);
      await senior.save();
    }

    res.json({ message: "Senior citizen successfully associated with your family account", senior });
  } catch (err) {
    res.status(500).json({ message: "Failed to associate senior", error: err.message });
  }
}
