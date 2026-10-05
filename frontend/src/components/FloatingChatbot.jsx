import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Minus, Send, Bot, AlertTriangle, ShieldCheck, Calendar, CreditCard, HeartHandshake, PhoneCall } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import api from "../api";

export default function FloatingChatbot({ onTriggerEmergency, onQuickCheckin, onOpenAssistance, onOpenAppointment, onNavigate }) {
  const { lang, t } = useAuth();
  const { showToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: "init",
      sender: "bot",
      text: t.chatGreeting,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [quickReplies, setQuickReplies] = useState([]);
  const messagesEndRef = useRef(null);

  // Update greeting when language changes
  useEffect(() => {
    setMessages((prev) => [
      {
        ...prev[0],
        text: t.chatGreeting
      },
      ...prev.slice(1)
    ]);
  }, [lang, t.chatGreeting]);

  // Scroll to bottom
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping, isOpen, isMinimized]);

  const defaultQuickReplies = lang === "ta"
    ? [
        { label: "🚨 அவசரநிலை", text: "அவசரநிலையில் என்ன செய்ய வேண்டும்?" },
        { label: "📅 அடுத்த சந்திப்பு", text: "எனக்கு அடுத்த appointment எப்போது?" },
        { label: "💳 கட்டண விபரம்", text: "எனது கட்டணத்தை காட்டு" },
        { label: "✓ Safety Check-in", text: "Safety check-in எப்படி செய்வது?" },
        { label: "🤝 உதவி தேவை", text: "எனக்கு உதவி வேண்டும்" },
        { label: "👩‍⚕️ பராமரிப்பாளர்", text: "எனது பராமரிப்பாளரை தொடர்பு கொள்ள வேண்டும்" }
      ]
    : [
        { label: "🚨 Emergency", text: "What should I do during an emergency?" },
        { label: "📅 Next Appointment", text: "What is my next appointment?" },
        { label: "💳 Show Fees", text: "Show my fees" },
        { label: "✓ Safety Check-in", text: "How do I perform safety check-in?" },
        { label: "🤝 Request Help", text: "I need assistance" },
        { label: "👩‍⚕️ Caregiver Contact", text: "Contact my caregiver" }
      ];

  const handleSendMessage = async (textToSend) => {
    const query = textToSend || inputText;
    if (!query.trim()) return;

    const userMsg = {
      id: Date.now(),
      sender: "user",
      text: query,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsTyping(true);

    try {
      const res = await api.post("/chatbot/message", {
        message: query,
        language: lang
      });

      const botReply = {
        id: Date.now() + 1,
        sender: "bot",
        text: res.data.reply,
        action: res.data.action,
        time: res.data.timestamp || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };

      setMessages((prev) => [...prev, botReply]);
      if (res.data.quickReplies?.length > 0) {
        setQuickReplies(res.data.quickReplies.map((qr) => ({ label: qr, text: qr })));
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: "bot",
          text: lang === "ta" 
            ? "மன்னிக்கவும், தகவலைப் பெற முடியவில்லை. மீண்டும் முயற்சிக்கவும்." 
            : "Sorry, I couldn't retrieve that information right now. Please try again.",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleActionClick = (action) => {
    if (action.type === "trigger_emergency") {
      if (onTriggerEmergency) onTriggerEmergency();
    } else if (action.type === "do_checkin") {
      if (onQuickCheckin) onQuickCheckin();
    } else if (action.type === "open_assistance") {
      if (onOpenAssistance) onOpenAssistance();
    } else if (action.type === "open_appointment") {
      if (onOpenAppointment) onOpenAppointment();
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          className="floating-chatbot-btn"
          onClick={() => {
            setIsOpen(true);
            setIsMinimized(false);
          }}
          aria-label="Open SeniorCare Assistant"
        >
          <MessageSquare size={26} />
          <span className="bot-pulse-ring" />
          <span className="bot-hover-tooltip">{t.chatTitle}</span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className={`chatbot-window ${isMinimized ? "minimized" : ""}`}>
          {/* Header */}
          <div className="chatbot-header">
            <div className="bot-header-info">
              <div className="bot-avatar-badge">
                <Bot size={20} />
              </div>
              <div>
                <strong>{t.chatTitle}</strong>
                <small className="bot-online-indicator">
                  <span className="online-dot" /> {t.chatSubtitle}
                </small>
              </div>
            </div>

            <div className="bot-header-controls">
              <button
                className="bot-ctrl-btn"
                onClick={() => setIsMinimized(!isMinimized)}
                title={isMinimized ? "Expand" : "Minimize"}
              >
                <Minus size={16} />
              </button>
              <button
                className="bot-ctrl-btn"
                onClick={() => setIsOpen(false)}
                title="Close"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Message History */}
              <div className="chatbot-messages">
                <div className="chatbot-disclaimer-card">
                  <AlertTriangle size={14} />
                  <span>{t.chatDisclaimer}</span>
                </div>

                {messages.map((m) => (
                  <div key={m.id} className={`chat-bubble-row ${m.sender}`}>
                    <div className="chat-bubble">
                      <p>{m.text}</p>
                      {/* Interactive Emergency/Action button */}
                      {m.action && (
                        <button
                          className={`bot-action-pill ${m.action.type === "trigger_emergency" ? "danger" : "primary"}`}
                          onClick={() => handleActionClick(m.action)}
                        >
                          {m.action.label}
                        </button>
                      )}
                      <span className="chat-timestamp">{m.time}</span>
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="chat-bubble-row bot">
                    <div className="chat-bubble typing-bubble">
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Reply Chips */}
              <div className="chatbot-quick-chips">
                {(quickReplies.length > 0 ? quickReplies : defaultQuickReplies).map((chip, idx) => (
                  <button
                    key={idx}
                    className="quick-chip-btn"
                    onClick={() => handleSendMessage(chip.text)}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              {/* Input Bar */}
              <form
                className="chatbot-input-bar"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
              >
                <input
                  type="text"
                  placeholder={t.chatPlaceholder}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  aria-label="Chat query input"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || isTyping}
                  className="bot-send-btn"
                  aria-label="Send message"
                >
                  <Send size={16} />
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
}
