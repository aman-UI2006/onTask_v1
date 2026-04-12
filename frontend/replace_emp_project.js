import fs from 'fs';
import path from 'path';

const filePath = 'D:/team_velora/new_tech/Ai_project_manager_complete/frontend/src/pages/EmployeeProjectPage.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// Replace hex codes with CSS variables
const colorMap = {
  '#0f0f0f': 'var(--bg-primary)',
  '#1a1a1a': 'var(--bg-surface)',
  '#151515': 'var(--bg-subtle)',
  '#2d2d2d': 'var(--border-color)',
  '#404040': 'var(--border-color)',
  '#374151': 'var(--border-color)',
  '#4b5563': 'var(--text-muted)',
  '#6b7280': 'var(--text-secondary)',
  '#9ca3af': 'var(--text-muted)',
  '#fff': 'var(--text-primary)',
  '#ffffff': 'var(--text-primary)',
  '#10b981': 'var(--accent-green)',
  '#ef4444': 'var(--accent-red)',
  '#3b82f6': 'var(--accent-blue)',
  '#60a5fa': 'var(--accent-blue)',
  '#a78bfa': 'var(--accent-purple)',
  '#8b5cf6': 'var(--accent-purple)',
  '#ea580c': 'var(--accent-red)',
  '#f97316': 'var(--accent-red)',
  '#fb923c': 'var(--accent-red)',
  '#d1fae5': 'var(--bg-surface)',
};

// Also replace hex codes with opacity like #10b98122
content = content.replace(/#10b98122/g, 'var(--bg-subtle)');
content = content.replace(/#10b98144/g, 'var(--border-color)');
content = content.replace(/#10b98111/g, 'var(--bg-subtle)');
content = content.replace(/#ef444422/g, 'var(--bg-subtle)');
content = content.replace(/#37415133/g, 'var(--bg-subtle)');

for (const [hex, variable] of Object.entries(colorMap)) {
  const regex = new RegExp(hex + '(?=[^a-zA-Z0-9]|$)', 'gi'); 
  content = content.replace(regex, variable);
}

const newStyles = `const styles = {
  page: { minHeight: "100vh", background: "var(--bg-primary)", color: "var(--text-primary)", fontFamily: "var(--font-family)" },
  center: { minHeight: "100vh", background: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "center" },
  errorBanner: { background: "var(--bg-subtle)", border: "1px solid var(--accent-red)", color: "var(--accent-red)", padding: "12px 16px", borderRadius: "8px", fontSize: "14px", marginBottom: "20px" },
  successBanner: { background: "var(--bg-subtle)", border: "1px solid var(--accent-green)", color: "var(--accent-green)", padding: "12px 16px", borderRadius: "8px", fontSize: "14px", marginBottom: "20px" },
  celebrationBanner: { position: "relative", overflow: "hidden", background: "linear-gradient(135deg, var(--accent-green) 0%, var(--accent-blue) 100%)", padding: "48px 32px" },
  backButton: { background: "transparent", border: "none", color: "var(--accent-blue)", fontSize: "14px", cursor: "pointer", padding: "0 0 8px", display: "block", marginBottom: "16px", transition: "var(--transition-fast)" },
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: "24px" },
  modalBox: { background: "var(--bg-surface)", border: "1px solid var(--border-color)", borderRadius: "16px", padding: "32px", width: "100%", maxWidth: "448px", boxShadow: "var(--shadow-hover)" },
};`;

const splitIndex = content.indexOf('const styles = {');
if (splitIndex !== -1) {
  content = content.substring(0, splitIndex) + newStyles;
}

fs.writeFileSync(filePath, content, 'utf8');
