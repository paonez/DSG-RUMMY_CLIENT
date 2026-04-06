import React, { useState, useEffect } from 'react';

export default function LandscapeGuard({ children }) {
  const [isPortrait, setIsPortrait] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    function check() {
      const mobile = window.innerWidth <= 900 || /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
      const portrait = window.innerHeight > window.innerWidth;
      setIsMobile(mobile);
      setIsPortrait(mobile && portrait);
    }
    check();
    window.addEventListener('resize', check);
    window.addEventListener('orientationchange', check);
    return () => {
      window.removeEventListener('resize', check);
      window.removeEventListener('orientationchange', check);
    };
  }, []);

  if (isPortrait) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        background: '#0f1f15',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '2rem', textAlign: 'center',
      }}>
        {/* Animated rotate icon */}
        <div style={{ marginBottom: 24, animation: 'rotateHint 2s ease-in-out infinite' }}>
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
            <rect x="20" y="10" width="40" height="60" rx="6" stroke="#c9a84c" strokeWidth="2.5" fill="none"/>
            <rect x="28" y="18" width="24" height="36" rx="2" fill="rgba(201,168,76,0.15)"/>
            <circle cx="40" cy="62" r="3" fill="#c9a84c"/>
            <path d="M55 38 Q70 25 65 12" stroke="#c9a84c" strokeWidth="2" fill="none" strokeLinecap="round"/>
            <path d="M62 10 L65 12 L63 16" stroke="#c9a84c" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <div style={{ fontSize: 22, fontWeight: 700, color: '#c9a84c', marginBottom: 10 }}>
          Rotate your phone
        </div>
        <div style={{ fontSize: 14, color: '#8a9e8f', lineHeight: 1.6, maxWidth: 260 }}>
          DSG Rummy plays best in <strong style={{ color: '#fdf6e3' }}>landscape mode</strong>.
          Please rotate your device sideways to continue.
        </div>

        <div style={{ marginTop: 32, fontSize: 12, color: '#5a6e60' }}>
          ♣ DSG Fun Lovers ♠
        </div>

        <style>{`
          @keyframes rotateHint {
            0%   { transform: rotate(0deg); }
            30%  { transform: rotate(-90deg); }
            60%  { transform: rotate(-90deg); }
            90%  { transform: rotate(0deg); }
            100% { transform: rotate(0deg); }
          }
        `}</style>
      </div>
    );
  }

  return children;
}
