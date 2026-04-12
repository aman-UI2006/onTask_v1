// EmployeeAI.jsx
// Floating AI Task Assistant for Employees
import { useState, useRef, useEffect } from "react";
import axios from "axios";

export default function EmployeeAI() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([{ role: "assistant", text: "Hi! I'm your AI Workspace Assistant. Need help with a task or report?" }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const q = input;
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: q }]);
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post("http://localhost:5000/api/ai/employee-chat", 
        { query: q },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages(prev => [...prev, { role: "assistant", text: res.data.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: "assistant", text: "I'm having trouble connecting right now. Please try again soon." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.dock}>
      {isOpen && (
        <div style={styles.panel}>
          <div style={styles.header}>
            <div style={styles.headerIcon}>✨</div>
            <div style={{ flex: 1 }}>
              <div style={styles.headerTitle}>AI Assistant</div>
              <div style={styles.headerStatus}>Online</div>
            </div>
            <button style={styles.closeBtn} onClick={() => setIsOpen(false)}>✕</button>
          </div>
          <div style={styles.messages} ref={scrollRef}>
            {messages.map((m, i) => (
              <div key={i} style={m.role === "user" ? styles.msgUser : styles.msgAi}>
                {m.text}
              </div>
            ))}
            {loading && (
              <div style={styles.msgAi}>
                <div style={styles.typingDot}>.</div>
                <div style={styles.typingDot}>.</div>
                <div style={styles.typingDot}>.</div>
              </div>
            )}
          </div>
          <div style={styles.inputArea}>
            <input 
              style={styles.input} 
              placeholder="Ask me anything..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
            <button style={styles.sendBtn} onClick={handleSend}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </div>
        </div>
      )}
      <button style={{...styles.toggleBtn, ...(isOpen ? styles.toggleBtnOpen : {})}} onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? "✕" : "✨ AI Help"}
      </button>
    </div>
  );
}

const styles = {
  dock: { position: "fixed", bottom: "32px", right: "32px", zIndex: 1000 },
  panel: { 
    width: "360px", 
    height: "520px", 
    background: "#fff", 
    borderRadius: "28px", 
    boxShadow: "0 20px 50px rgba(0,0,0,0.15)", 
    display: "flex", 
    flexDirection: "column", 
    marginBottom: "20px", 
    overflow: "hidden",
    border: "1px solid #eee",
    animation: "slideUp 0.3s ease-out"
  },
  header: { 
    background: "#111", 
    color: "#fff", 
    padding: "20px 24px", 
    display: "flex", 
    alignItems: "center", 
    gap: "12px" 
  },
  headerIcon: { width: "32px", height: "32px", background: "rgba(255,255,255,0.1)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" },
  headerTitle: { fontSize: "15px", fontWeight: "800", letterSpacing: "0.3px" },
  headerStatus: { fontSize: "11px", color: "#10b981", fontWeight: "700", textTransform: "uppercase" },
  closeBtn: { background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: "16px", cursor: "pointer", padding: "4px" },
  
  messages: { flex: 1, padding: "24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "16px", background: "#fbfbfb" },
  msgUser: { alignSelf: "flex-end", background: "var(--primary)", color: "#fff", padding: "12px 18px", borderRadius: "18px 18px 4px 18px", fontSize: "14px", fontWeight: "500", maxWidth: "85%", boxShadow: "0 4px 12px rgba(109,93,252,0.15)" },
  msgAi: { alignSelf: "flex-start", background: "#fff", color: "#111", padding: "12px 18px", borderRadius: "18px 18px 18px 4px", fontSize: "14px", fontWeight: "500", maxWidth: "85%", border: "1px solid #eee", boxShadow: "0 2px 6px rgba(0,0,0,0.02)" },
  
  inputArea: { borderTop: "1px solid #eee", padding: "20px 24px", display: "flex", gap: "12px", background: "#fff", alignItems: "center" },
  input: { flex: 1, border: "none", outline: "none", fontSize: "14px", fontWeight: "500", color: "#111" },
  sendBtn: { background: "none", border: "none", color: "var(--primary)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "transform 0.2s" },
  
  toggleBtn: { 
    background: "#111", color: "#fff", border: "none", padding: "16px 28px", 
    borderRadius: "18px", fontWeight: "800", cursor: "pointer", 
    boxShadow: "0 10px 25px rgba(0,0,0,0.2)", 
    display: "flex", alignItems: "center", gap: "10px", fontSize: "14px",
    transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
  },
  toggleBtnOpen: { transform: "scale(0.9) rotate(5deg)", opacity: 0.8 },
  typingDot: { width: "4px", height: "4px", background: "#999", borderRadius: "50%", display: "inline-block", margin: "0 1px", animation: "bounce 0.6s infinite alternate" }
};
