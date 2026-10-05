import Fee from "../models/Fee.js";
import Payment from "../models/Payment.js";
import Senior from "../models/Senior.js";
import AuditLog from "../models/AuditLog.js";

export async function getFees(req, res) {
  try {
    const { status, seniorId } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (seniorId) filter.seniorId = seniorId;

    if (req.user.role === "senior_citizen") {
      const senior = await Senior.findOne({ userId: req.user._id });
      if (senior) filter.seniorId = senior._id;
    }

    const fees = await Fee.find(filter).sort({ dueDate: 1 });

    const totalDue = fees.reduce((acc, f) => acc + (f.totalAmount || 0), 0);
    const totalPaid = fees.reduce((acc, f) => acc + (f.paidAmount || 0), 0);
    const totalRemaining = fees.reduce((acc, f) => acc + (f.remainingAmount || 0), 0);

    res.json({
      fees,
      summary: {
        totalDue,
        totalPaid,
        totalRemaining
      }
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch fees", error: err.message });
  }
}

export async function createFee(req, res) {
  try {
    const { seniorId, title, category = "Monthly Care", totalAmount, dueDate, notes = "" } = req.body;
    const senior = await Senior.findById(seniorId);
    if (!senior) return res.status(404).json({ message: "Senior not found" });

    const codeNum = Math.floor(300 + Math.random() * 700);
    const feeCode = `FEE-${codeNum}`;

    const fee = await Fee.create({
      feeCode,
      seniorId: senior._id,
      seniorName: senior.name,
      title,
      category,
      totalAmount: Number(totalAmount),
      paidAmount: 0,
      remainingAmount: Number(totalAmount),
      dueDate: new Date(dueDate),
      status: "Pending",
      notes
    });

    await AuditLog.create({
      action: "FEE_CREATED",
      performedBy: req.user._id,
      performedByName: req.user.displayName,
      performedByRole: req.user.role,
      targetEntity: "Fee",
      targetId: feeCode,
      details: `Created fee ${feeCode} for ₹${totalAmount}`
    });

    res.status(201).json({ message: "Fee record created successfully", fee });
  } catch (err) {
    res.status(500).json({ message: "Failed to create fee", error: err.message });
  }
}

export async function recordPayment(req, res) {
  try {
    const { id } = req.params; // feeId
    const { amount, paymentMethod = "UPI", transactionRef = "", notes = "" } = req.body;
    const payAmt = Number(amount);
    if (!payAmt || payAmt <= 0) {
      return res.status(400).json({ message: "A positive payment amount is required" });
    }

    const fee = await Fee.findById(id);
    if (!fee) return res.status(404).json({ message: "Fee record not found" });

    fee.paidAmount = (fee.paidAmount || 0) + payAmt;
    fee.remainingAmount = Math.max(0, (fee.totalAmount || 0) - fee.paidAmount);

    if (fee.remainingAmount === 0) {
      fee.status = "Paid";
    } else {
      fee.status = "Partially Paid";
    }
    await fee.save();

    const codeNum = Math.floor(900 + Math.random() * 100);
    const paymentCode = `PAY-${codeNum}`;

    const payment = await Payment.create({
      paymentCode,
      feeId: fee._id,
      seniorId: fee.seniorId,
      seniorName: fee.seniorName,
      amount: payAmt,
      paymentMethod,
      transactionRef: transactionRef || `REF-${Date.now()}`,
      paidAt: new Date(),
      recordedBy: req.user._id,
      recordedByName: req.user.displayName,
      notes
    });

    await AuditLog.create({
      action: "PAYMENT_RECORDED",
      performedBy: req.user._id,
      performedByName: req.user.displayName,
      performedByRole: req.user.role,
      targetEntity: "Payment",
      targetId: paymentCode,
      details: `Recorded payment of ₹${payAmt} for ${fee.feeCode} via ${paymentMethod}`
    });

    res.status(201).json({
      message: "Payment recorded successfully",
      fee,
      payment
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to record payment", error: err.message });
  }
}

export async function getPayments(req, res) {
  try {
    const { seniorId } = req.query;
    const filter = {};
    if (seniorId) filter.seniorId = seniorId;

    if (req.user.role === "senior_citizen") {
      const senior = await Senior.findOne({ userId: req.user._id });
      if (senior) filter.seniorId = senior._id;
    }

    const payments = await Payment.find(filter).sort({ paidAt: -1 });
    res.json({ payments });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch payments", error: err.message });
  }
}
