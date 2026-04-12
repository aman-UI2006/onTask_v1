import React from "react";

const Icon = ({ name, size = 18, color = "currentColor", style }) => {
  const paths = {
    dashboard: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9",
    analytics: "M18 20V10 M12 20V4 M6 20V14",
    plus: "M12 5v14 M5 12h14",
    zap: "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
    review: "M9 11l3 3L22 4 M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11",
    users: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8",
    logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9",
    edit: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7 M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z",
    chevronLeft: "M15 18l-6-6 6-6",
    bell: "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 0 1-3.46 0",
    mic: "M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z M19 10v2a7 7 0 0 1-14 0v-2 M12 19v4 M8 23h8",
    send: "M22 2L11 13 M22 2l-7 20-4-9-9-4 20-7z",
    robot: "M12 8V4H8 M12 8v4h4 M7 11h10a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2z M9 15h.01 M15 15h.01",
    x: "M18 6L6 18 M6 6l12 12",
    volume2: "M11 5L6 9H2v6h4l5 4V5z M19.07 4.93a10 10 0 0 1 0 14.14 M15.54 8.46a5 5 0 0 1 0 7.07",
    loader: "M12 2v4 M12 18v4 M4.93 4.93l2.83 2.83 M16.24 16.24l2.83 2.83 M2 12h4 M18 12h4 M4.93 19.07l2.83-2.83 M16.24 7.76l2.83-2.83",
    clipboard: "M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2 M9 2h6 a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1H9 a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z"
  };

  return (
    <svg 
      width={size} height={size} viewBox="0 0 24 24" fill="none" 
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
      style={{ verticalAlign: "middle", ...style }}
    >
      <circle cx="12" cy="12" r="1" fill={color} style={{ display: name === 'loader' ? 'none' : 'none' }} />
      {name === "loader" ? (
        <g strokeWidth="3">
          <path d={paths.loader} />
        </g>
      ) : (
        <path d={paths[name] || ""} />
      )}
    </svg>
  );
};

export default Icon;
