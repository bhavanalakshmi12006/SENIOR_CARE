import Appointment from "../models/Appointment.js";
import Fee from "../models/Fee.js";
import Senior from "../models/Senior.js";
import Caregiver from "../models/Caregiver.js";

export async function handleChatMessage(req, res) {
  try {
    const { message = "", language = "en" } = req.body;
    const isTamil = language === "ta" || /[\u0B80-\u0BFF]/.test(message);
    const text = message.toLowerCase().trim();

    // Look up current senior context if available
    let senior = null;
    if (req.user?._id) {
      senior = await Senior.findOne({ userId: req.user._id });
    }
    if (!senior) {
      senior = await Senior.findOne();
    }

    let reply = "";
    let action = null; // e.g. { type: 'emergency_button', label: '🚨 Trigger Emergency Now' }
    let quickReplies = [];

    // 1. Emergency intent
    if (
      text.includes("emergency") ||
      text.includes("அவசர") ||
      text.includes("chest pain") ||
      text.includes("breath") ||
      text.includes("danger") ||
      text.includes("ஆபத்") ||
      text.includes("உயிர்")
    ) {
      if (isTamil) {
        reply = "அவசர நிலையில், தயவுசெய்து உடனடியாக கீழே உள்ள 'அவசர எச்சரிக்கை' (🚨 EMERGENCY) பட்டனை அழுத்தவும் அல்லது அவசர சேவை 112-ஐ தொடர்பு கொள்ளவும். இந்த Chatbot அவசர சேவை அல்ல. எங்களின் குழு உடனடியாக உங்களுக்கு உதவ தயாராக உள்ளது.";
        action = { type: "trigger_emergency", label: "🚨 அவசர உதவி கோருங்கள் (Send Emergency Alert)" };
      } else {
        reply = "If this is a life-threatening medical emergency, immediately click the 'Send Emergency Alert' button below or dial 112. Note: This chatbot is NOT an emergency service. Our care response team is on standby to assist you immediately.";
        action = { type: "trigger_emergency", label: "🚨 Send Emergency Alert Now" };
      }
      quickReplies = isTamil
        ? ["பராமரிப்பாளரை அழைக்கவும்", "மருத்துவ சந்திப்புகள்", "நான் பாதுகாப்பாக உள்ளேன்"]
        : ["Call Caregiver", "My Appointments", "I am safe"];
    }

    // 2. Appointment intent
    else if (
      text.includes("appointment") ||
      text.includes("சந்திப்") ||
      text.includes("doctor") ||
      text.includes("மருத்துவ") ||
      text.includes("hospital")
    ) {
      const nextApt = await Appointment.findOne({
        seniorId: senior._id,
        status: "Upcoming"
      }).sort({ appointmentDate: 1 });

      if (nextApt) {
        const dateStr = new Date(nextApt.appointmentDate).toLocaleDateString(isTamil ? "ta-IN" : "en-IN");
        if (isTamil) {
          reply = `உங்களின் அடுத்த மருத்துவ சந்திப்பு: ${nextApt.doctorName} (${nextApt.department}), ${nextApt.hospital}. தேதி: ${dateStr}, நேரம்: ${nextApt.timeSlot}.`;
        } else {
          reply = `Your next appointment is with ${nextApt.doctorName} (${nextApt.department}) at ${nextApt.hospital} on ${dateStr} at ${nextApt.timeSlot}.`;
        }
      } else {
        reply = isTamil
          ? "உங்களுக்கு தற்போது வரவிருக்கும் புதிய மருத்துவ சந்திப்புகள் எதுவும் திட்டமிடப்படவில்லை."
          : "You do not have any upcoming appointments scheduled right now.";
      }
      quickReplies = isTamil
        ? ["புதிய சந்திப்பு கோரவும்", "கட்டண விபரம்", "பாதுகாப்பு check-in"]
        : ["Book Appointment", "Show Fees", "Safety Check-in"];
    }

    // 3. Fee intent
    else if (
      text.includes("fee") ||
      text.includes("payment") ||
      text.includes("கட்டண") ||
      text.includes("due") ||
      text.includes("பணம்")
    ) {
      const pendingFees = await Fee.find({
        seniorId: senior._id,
        status: { $in: ["Pending", "Partially Paid", "Overdue"] }
      });
      const remainingTotal = pendingFees.reduce((acc, f) => acc + (f.remainingAmount || 0), 0);

      if (pendingFees.length > 0) {
        if (isTamil) {
          reply = `உங்களிடம் ${pendingFees.length} நிலுவைக் கட்டணங்கள் உள்ளன. மொத்த நிலுவைத் தொகை: ₹${remainingTotal.toLocaleString()}. '${pendingFees[0].title}' கட்டணம் செலுத்தப்பட வேண்டும்.`;
        } else {
          reply = `You have ${pendingFees.length} pending fee item(s). Total remaining due is ₹${remainingTotal.toLocaleString()}. Recent fee: ${pendingFees[0].title} (₹${pendingFees[0].remainingAmount} due).`;
        }
      } else {
        reply = isTamil
          ? "உங்களுக்கு நிலுவைக் கட்டணங்கள் எதுவும் இல்லை. அனைத்து கட்டணங்களும் செலுத்தப்பட்டுவிட்டன! நன்றி."
          : "You have no pending fees. All care and hospital fees are fully paid! Thank you.";
      }
      quickReplies = isTamil
        ? ["கட்டணம் செலுத்த", "மருத்துவ சந்திப்புகள்", "உதவி தேவை"]
        : ["Pay Fees", "Appointments", "Request Help"];
    }

    // 4. Safety checkin intent
    else if (
      text.includes("check-in") ||
      text.includes("checkin") ||
      text.includes("safe") ||
      text.includes("பாதுகாப்") ||
      text.includes("நலம்")
    ) {
      if (isTamil) {
        reply = "தினசரி பாதுகாப்பு check-in செய்ய உங்கள் Dashboard-ல் உள்ள '✓ I AM SAFE' (நான் பாதுகாப்பாக உள்ளேன்) பட்டனை அழுத்தவும். இது உங்களின் குடும்பத்தினருக்கும் பராமரிப்பாளருக்கும் உங்கள் நலனை உடனடியாக உறுதிப்படுத்தும்!";
      } else {
        reply = "To complete your daily safety check-in, simply click the green '✓ I AM SAFE' button on your dashboard. This instantly logs your safety status and notifies your loved ones and caregivers!";
      }
      action = { type: "do_checkin", label: isTamil ? "✓ நான் பாதுகாப்பாக உள்ளேன்" : "✓ I AM SAFE" };
      quickReplies = isTamil
        ? ["பராமரிப்பாளர் யார்?", "அவசர உதவி", "மருந்து உதவி"]
        : ["Contact Caregiver", "Emergency Alert", "Medicine Assistance"];
    }

    // 5. Caregiver contact intent
    else if (
      text.includes("caregiver") ||
      text.includes("caretaker") ||
      text.includes("பராமரிப்") ||
      text.includes("nurse") ||
      text.includes("அழைக்க")
    ) {
      const caregiver = await Caregiver.findOne({ status: "active" });
      const name = caregiver ? caregiver.name : "Anitha Krishnan";
      const phone = caregiver ? caregiver.phone : "+91 98765 00004";
      if (isTamil) {
        reply = `உங்கள் முதன்மை பராமரிப்பாளர்: ${name}. தொலைபேசி எண்: ${phone}. ஷிப்ட்: ${caregiver?.shift || "காலை"}. உங்களுக்கு ஏதேனும் உடல்நல உதவி தேவைப்பட்டால் உடனே அழைக்கலாம்.`;
      } else {
        reply = `Your primary caregiver is ${name}. Phone: ${phone} (Shift: ${caregiver?.shift || "Morning"}). You can contact them directly or request care assistance through the platform.`;
      }
      quickReplies = isTamil
        ? ["உதவி கோரிக்கை", "மருத்துவ சந்திப்பு", "பாதுகாப்பு check-in"]
        : ["Request Assistance", "Appointments", "Safety Check-in"];
    }

    // 6. Assistance intent
    else if (
      text.includes("assistance") ||
      text.includes("help") ||
      text.includes("உதவி") ||
      text.includes("food") ||
      text.includes("medicine") ||
      text.includes("உணவு") ||
      text.includes("மருந்து")
    ) {
      if (isTamil) {
        reply = "நாங்கள் உணவு உதவி, மருந்து வாங்குதல், மளிகைக் கடை செல்லுதல், மருத்துவமனை பயணம் போன்ற உதவிகளை வழங்குகிறோம். 'Request Assistance' மெனுவிலிருந்து புதிய கோரிக்கையை உடனடியாக சமர்ப்பிக்கலாம்.";
      } else {
        reply = "We offer voluntary and staff assistance for: Medicine Pickup, Food Delivery, Grocery Shopping, Hospital Travel Escort, and Home Care. Click 'Request Assistance' to post a request!";
      }
      action = { type: "open_assistance", label: isTamil ? "🤝 உதவி கோருங்கள்" : "🤝 Request Assistance" };
      quickReplies = isTamil
        ? ["மருந்து உதவி", "உணவு உதவி", "பராமரிப்பாளரை அழைக்கவும்"]
        : ["Medicine Pickup", "Food Delivery", "Contact Caregiver"];
    }

    // Default response
    else {
      if (isTamil) {
        reply = "வணக்கம்! நான் உங்கள் SeniorCare உதவியாளர். மருத்துவ சந்திப்புகள், கட்டண நிலவரம், பாதுகாப்பு check-in, பராமரிப்பாளர் தொடர்பு அல்லது அவசர உதவி குறித்து நீங்கள் என்னிடம் கேட்கலாம்.";
      } else {
        reply = "Hello! I am your SeniorCare assistant. You can ask me about your next appointment, pending fees, safety check-in, caregiver contact, assistance requests, or emergency procedures.";
      }
      quickReplies = isTamil
        ? ["🚨 அவசரநிலை", "📅 அடுத்த சந்திப்பு", "💳 கட்டணம்", "✓ Safety Check-in"]
        : ["🚨 Emergency", "📅 Next Appointment", "💳 Fee Status", "✓ Safety Check-in"];
    }

    res.json({
      reply,
      action,
      quickReplies,
      timestamp: new Date().toLocaleTimeString(isTamil ? "ta-IN" : "en-US", { hour: "2-digit", minute: "2-digit" })
    });
  } catch (err) {
    res.status(500).json({ message: "Chatbot error", error: err.message });
  }
}
