import { useRef, useEffect, useState } from "react";
import DashboardSVGUrl from "../assets/dashboard.svg";

export default function DashboardIllustration() {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const [svgContent, setSvgContent] = useState(null);

  // Load and inline the SVG
  useEffect(() => {
    fetch(DashboardSVGUrl)
      .then(response => response.text())
      .then(svgText => {
        setSvgContent(svgText);
      })
      .catch(error => console.error('Error loading SVG:', error));
  }, []);

  // Apply professional SaaS animations
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || !svgContent) return;

    const applyAnimations = () => {
      // ONLY animate leaves/plants - everything else stays static
      const leaves = svg.querySelectorAll('path[style*="fill:#008890"], path[style*="fill:#006B6B"]');
      leaves.forEach((leaf, i) => {
        leaf.style.transformOrigin = 'bottom center';
        leaf.style.animation = `leafSway ${5 + i * 1.2}s ease-in-out infinite`;
        leaf.style.animationDelay = `${i * 0.5}s`;
      });
    };

    applyAnimations();

  }, [svgContent]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "transparent",
        overflow: "hidden",
      }}
    >
      <style>{`
        /* LEAVES/BACKGROUND - Sway animation */
        @keyframes leafSway {
          0%, 100% { transform: rotate(-5deg) scaleY(1); }
          50% { transform: rotate(5deg) scaleY(1.03); }
        }
      `}</style>
      
      {svgContent && (
        <div
          ref={svgRef}
          dangerouslySetInnerHTML={{ __html: svgContent }}
          style={{
            width: "100%",
            height: "100%",
            maxWidth: "700px",
            maxHeight: "700px",
            objectFit: "contain",
            filter: "none",
            background: "transparent",
          }}
        />
      )}
    </div>
  );
}
