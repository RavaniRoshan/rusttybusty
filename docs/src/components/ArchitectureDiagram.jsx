import React, { useState } from 'react';

export default function ArchitectureDiagram() {
  const [hoveredLayer, setHoveredLayer] = useState(null);

  const getOpacity = (layerIndex) => {
    if (hoveredLayer === null) return 1;
    return hoveredLayer === layerIndex ? 1 : 0.3;
  };

  const getScale = (layerIndex) => {
    return hoveredLayer === layerIndex ? 'scale(1.02)' : 'scale(1)';
  };

  return (
    <div style={{ position: 'relative' }}>
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
        color: 'var(--text-secondary)',
        zIndex: 10
      }}>
        Hover to explore
      </div>
      <svg 
        viewBox="0 0 800 500" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg" 
        style={{ width: '100%', height: 'auto', maxWidth: '800px', margin: '0 auto', display: 'block' }}
        onMouseLeave={() => setHoveredLayer(null)}
      >
        <defs>
          <linearGradient id="rustGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--accent-primary)"/>
            <stop offset="100%" stopColor="var(--accent-primary)"/>
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="var(--accent-primary)"/>
          </marker>
        </defs>
        
        {/* Layer 1 */}
        <g 
          onMouseEnter={() => setHoveredLayer(1)}
          style={{ 
            opacity: getOpacity(1), 
            transform: getScale(1), 
            transformOrigin: 'center 70px',
            transition: 'all 0.5s cubic-bezier(0.32, 0.72, 0, 1)',
            cursor: 'pointer'
          }}
        >
          <rect x="50" y="20" width="700" height="100" rx="8" fill="var(--bg-surface)" stroke="var(--border-medium)" strokeWidth="1"/>
          <text x="70" y="70" fontFamily="var(--font-sans)" fontSize="14" fill="var(--text-secondary)" fontWeight="600">LAYER 1</text>
          <text x="140" y="70" fontFamily="var(--font-serif)" fontSize="24" fill="var(--text-primary)" fontWeight="600">Node Structure</text>
          <text x="450" y="70" fontFamily="var(--font-mono)" fontSize="13" fill="var(--text-secondary)" textAnchor="middle">Arc + ImVector + ImHashMap</text>
        </g>

        {/* Connection */}
        <path 
          d="M400 120 L400 170" 
          stroke="var(--border-medium)" 
          strokeWidth="2" 
          strokeDasharray="4 4" 
          markerEnd="url(#arrowhead)"
          style={{ opacity: hoveredLayer === null ? 1 : 0.3, transition: 'opacity 0.3s' }}
        />
        
        {/* Layer 2 */}
        <g 
          onMouseEnter={() => setHoveredLayer(2)}
          style={{ 
            opacity: getOpacity(2), 
            transform: getScale(2), 
            transformOrigin: 'center 230px',
            transition: 'all 0.5s cubic-bezier(0.32, 0.72, 0, 1)',
            cursor: 'pointer'
          }}
        >
          <rect x="50" y="180" width="700" height="100" rx="8" fill="var(--bg-surface)" stroke="var(--border-medium)" strokeWidth="1"/>
          <text x="70" y="230" fontFamily="var(--font-sans)" fontSize="14" fill="var(--text-secondary)" fontWeight="600">LAYER 2</text>
          <text x="140" y="230" fontFamily="var(--font-serif)" fontSize="24" fill="var(--text-primary)" fontWeight="600">Tree Builder & Mutate</text>
          <text x="450" y="230" fontFamily="var(--font-mono)" fontSize="13" fill="var(--text-secondary)" textAnchor="middle">Recursive path-based cloning</text>
        </g>

        {/* Connection */}
        <path 
          d="M400 280 L400 330" 
          stroke="var(--border-medium)" 
          strokeWidth="2" 
          strokeDasharray="4 4" 
          markerEnd="url(#arrowhead)"
          style={{ opacity: hoveredLayer === null ? 1 : 0.3, transition: 'opacity 0.3s' }}
        />
        
        {/* Layer 3 */}
        <g 
          onMouseEnter={() => setHoveredLayer(3)}
          style={{ 
            opacity: getOpacity(3), 
            transform: getScale(3), 
            transformOrigin: 'center 390px',
            transition: 'all 0.5s cubic-bezier(0.32, 0.72, 0, 1)',
            cursor: 'pointer'
          }}
        >
          <rect x="50" y="340" width="700" height="100" rx="8" fill="var(--bg-surface)" stroke="var(--border-medium)" strokeWidth="1"/>
          <text x="70" y="390" fontFamily="var(--font-sans)" fontSize="14" fill="var(--text-secondary)" fontWeight="600">LAYER 3</text>
          <text x="140" y="390" fontFamily="var(--font-serif)" fontSize="24" fill="var(--text-primary)" fontWeight="600">Concurrent Reader</text>
          <text x="450" y="390" fontFamily="var(--font-mono)" fontSize="13" fill="var(--text-secondary)" textAnchor="middle">Lock-free traversal</text>
        </g>
      </svg>
    </div>
  );
}