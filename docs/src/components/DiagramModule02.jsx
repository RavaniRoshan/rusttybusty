import React, { useState } from 'react';

export default function DiagramModule02() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className="diagram-bg"
      style={{ position: 'relative', cursor: 'pointer' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={{
        position: 'absolute',
        top: '1rem',
        right: '1rem',
        background: 'var(--bg-surface)',
        padding: '0.25rem 0.5rem',
        borderRadius: '4px',
        border: '1px solid var(--border-light)',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.65rem',
        color: 'var(--text-secondary)'
      }}>
        Hover to interact
      </div>

      <svg 
        width="200" 
        height="200" 
        viewBox="0 0 200 200" 
        fill="none" 
        stroke="var(--accent-primary)" 
        strokeWidth="1.5"
        style={{ 
          transform: isHovered ? 'scale(1.05)' : 'scale(1)', 
          transition: 'all 0.5s cubic-bezier(0.32, 0.72, 0, 1)' 
        }}
      >
        <circle 
          cx="100" cy="100" r="80" 
          strokeDasharray="4 4" 
          stroke="var(--border-medium)" 
          style={{ 
            transformOrigin: '100px 100px',
            transform: isHovered ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 1s cubic-bezier(0.32, 0.72, 0, 1)'
          }}
        />
        <rect 
          x="70" y="70" width="60" height="60" rx="8" 
          fill="var(--bg-surface)" 
          stroke={isHovered ? 'var(--accent-primary)' : 'var(--border-medium)'}
          style={{ transition: 'all 0.3s ease' }}
        />
        <path 
          d="M85 100 L115 100 M100 85 L100 115" 
          stroke={isHovered ? 'var(--accent-primary)' : 'var(--text-secondary)'}
          style={{ 
            transformOrigin: '100px 100px',
            transform: isHovered ? 'rotate(45deg)' : 'rotate(0deg)',
            transition: 'transform 0.5s cubic-bezier(0.32, 0.72, 0, 1), stroke 0.3s ease'
          }}
        />
      </svg>
    </div>
  );
}
