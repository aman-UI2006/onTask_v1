import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { aiManagerChat } from "../api/projects";
import Icon from "./Icon";

const UI = {
  primary: "#6366f1",
  cyan: "#06b6d4",
  slate: "#1e293b",
  glass: "rgba(255, 255, 255, 0.7)",
  border: "rgba(226, 232, 240, 0.8)",
  shadow: "0 20px 50px rgba(0, 0, 0, 0.15)"
};

const VoiceAssistant = ({ selectedProjectId }) => {
  const { dbUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);
  
  const recognitionRef = useRef(null);
  const scrollRef = useRef(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = (event) => {
        console.error("Speech Recognition Error:", event.error);
        setError("Microphone access denied or error occurred.");
        setIsListening(false);
      };
      
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        handleSendQuery(transcript);
      };

      recognitionRef.current = recognition;
    } else {
      setError("Speech recognition not supported in this browser.");
    }
  }, []);

  // Auto Greeting
  useEffect(() => {
    if (dbUser) {
      const timer = setTimeout(() => {
        const greeting = `Hello ${dbUser.name.split(' ')[0]}, I'm your AI assistant. I can help you manage projects, analyze employee performance, or find resources. How can I assist you today?`;
        speak(greeting);
        setMessages([{ role: "ai", text: greeting, timestamp: new Date() }]);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [dbUser]);

  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const speak = (text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    
    // Attempt to find a higher quality voice
    const voices = window.speechSynthesis.getVoices();
    const premiumVoice = voices.find(v => v.name.includes("Google") || v.name.includes("Enhanced"));
    if (premiumVoice) utterance.voice = premiumVoice;

    window.speechSynthesis.speak(utterance);
  };

  const startListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setError(null);
      window.speechSynthesis.cancel();
      recognitionRef.current?.start();
    }
  };

  const handleSendQuery = async (query) => {
    if (!query.trim()) return;
    
    setMessages(prev => [...prev, { role: "user", text: query, timestamp: new Date() }]);
    setIsProcessing(true);
    
    try {
      const reply = await aiManagerChat(query, selectedProjectId);
      setMessages(prev => [...prev, { role: "ai", text: reply, timestamp: new Date() }]);
      speak(reply);
    } catch (err) {
      setError("Failed to reach Neural Link.");
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const styles = {
    container: {
      position: "fixed",
      bottom: "30px",
      right: "30px",
      zIndex: 2000,
      fontFamily: "'Inter', sans-serif"
    },
    orb: {
      width: "64px",
      height: "64px",
      borderRadius: "32px",
      background: isListening ? "#ef4444" : UI.slate,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      boxShadow: UI.shadow,
      transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
      position: "relative",
      border: `2px solid ${isListening ? "rgba(239, 68, 68, 0.5)" : "rgba(99, 102, 241, 0.3)"}`,
      animation: (isSpeaking || isListening) ? "pulseOrb 2s infinite" : "none"
    },
    chatWindow: {
      position: "absolute",
      bottom: "80px",
      right: 0,
      width: "380px",
      height: "520px",
      background: UI.glass,
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      borderRadius: "24px",
      border: `1px solid ${UI.border}`,
      boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
      overflow: "hidden",
      display: isOpen ? "flex" : "none",
      flexDirection: "column",
      transformOrigin: "bottom right",
      animation: "slideIn 0.3s ease-out"
    },
    header: {
      padding: "20px",
      background: "rgba(255, 255, 255, 0.4)",
      borderBottom: `1px solid ${UI.border}`,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    },
    headerTitle: { fontSize: "15px", fontWeight: "800", color: UI.slate, display: "flex", alignItems: "center", gap: "8px" },
    messagesArea: { flex: 1, padding: "20px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "16px" },
    userMsg: { 
      alignSelf: "flex-end", 
      background: UI.slate, 
      color: "white", 
      padding: "12px 16px", 
      borderRadius: "18px 18px 2px 18px", 
      fontSize: "14px", 
      maxWidth: "80%",
      boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
    },
    aiMsg: { 
      alignSelf: "flex-start", 
      background: "white", 
      color: UI.slate, 
      padding: "12px 16px", 
      borderRadius: "18px 18px 18px 2px", 
      fontSize: "14px", 
      maxWidth: "80%", 
      border: `1px solid ${UI.border}`,
      boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
    },
    inputArea: {
      padding: "16px",
      background: "rgba(255, 255, 255, 0.5)",
      borderTop: `1px solid ${UI.border}`,
      display: "flex",
      gap: "10px",
      alignItems: "center"
    },
    input: {
      flex: 1,
      background: "white",
      border: `1px solid ${UI.border}`,
      borderRadius: "12px",
      padding: "10px 14px",
      fontSize: "14px",
      outline: "none"
    },
    actionBtn: {
      width: "38px",
      height: "38px",
      borderRadius: "10px",
      border: "none",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      transition: "background 0.2s"
    },
    waveform: {
      display: isListening ? "flex" : "none",
      alignItems: "center",
      gap: "3px",
      height: "15px"
    },
    waveBar: {
      width: "3px",
      height: "100%",
      background: "white",
      borderRadius: "2px"
    }
  };

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes pulseOrb {
          0% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.4); }
          70% { box-shadow: 0 0 0 15px rgba(99, 102, 241, 0); }
          100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: scale(0.9) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes wave {
          0%, 100% { transform: scaleY(0.5); }
          50% { transform: scaleY(1.5); }
        }
      `}</style>
      
      <div style={styles.chatWindow}>
        <div style={styles.header}>
          <div style={styles.headerTitle}>
            <Icon name="robot" size={20} color={UI.primary} /> Neural Assistant
          </div>
          <button style={{ ...styles.actionBtn, background: "transparent" }} onClick={() => setIsOpen(false)}>
            <Icon name="x" size={18} color={UI.slate} />
          </button>
        </div>
        
        <div style={styles.messagesArea} ref={scrollRef}>
          {messages.map((m, i) => (
            <div key={i} style={m.role === "user" ? styles.userMsg : styles.aiMsg}>
              {m.text}
            </div>
          ))}
          {isProcessing && (
            <div style={styles.aiMsg}>
              <Icon name="loader" size={16} color={UI.primary} className="rotating" />
            </div>
          )}
          {error && (
            <div style={{ ...styles.aiMsg, color: "#ef4444", fontSize: "12px", background: "#fef2f2" }}>
              {error}
            </div>
          )}
        </div>

        <div style={styles.inputArea}>
          <button 
            style={{ ...styles.actionBtn, background: isListening ? "#ef4444" : "#f1f5f9" }}
            onClick={startListening}
          >
            <Icon name="mic" size={18} color={isListening ? "white" : UI.slate} />
          </button>
          <input 
            style={styles.input} 
            placeholder="Type or speak a command..."
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSendQuery(e.target.value);
                e.target.value = "";
              }
            }}
          />
        </div>
      </div>

      <div 
        style={styles.orb} 
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => !isOpen && speak("")} // Just to warm up synthesis
      >
        {isListening ? (
          <div style={styles.waveform}>
            {[1,2,3,4].map(i => (
              <div key={i} style={{ ...styles.waveBar, animation: `wave 0.6s infinite ease-in-out ${i * 0.1}s` }} />
            ))}
          </div>
        ) : (
          <Icon name={isSpeaking ? "volume2" : "mic"} size={28} color="white" />
        )}
      </div>
    </div>
  );
};

export default VoiceAssistant;
