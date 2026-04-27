export default function ArchitectureDiagram() {
  return (
    <svg viewBox="0 0 800 500" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: 'auto', maxWidth: '800px', margin: '0 auto', display: 'block' }}>
      <defs>
        <linearGradient id="rustGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#b7410e"/>
          <stop offset="100%" stopColor="#cd531c"/>
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="blur"/>
          <feMerge>
            <feMergeNode in="blur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#b7410e"/>
        </marker>
      </defs>
      
      {/* Layer 1 */}
      <rect x="50" y="20" width="700" height="100" rx="24" fill="rgba(25,25,25,0.6)" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
      <text x="70" y="70" fontFamily="Inter, sans-serif" fontSize="14" fill="#b7410e" fontWeight="600">LAYER 1</text>
      <text x="120" y="70" fontFamily="Playfair Display, serif" fontSize="24" fill="#f5f5f5" fontWeight="600">Node Structure</text>
      <text x="400" y="110" fontFamily="Inter, sans-serif" fontSize="13" fill="rgba(245,245,245,0.6)" textAnchor="middle">Arc + ImVector + ImHashMap</text>
      
      {/* Connection */}
      <path d="M400 120 L400 170" stroke="#b7410e" strokeWidth="2" strokeDasharray="4 4" markerEnd="url(#arrowhead)"/>
      
      {/* Layer 2 */}
      <rect x="50" y="180" width="700" height="100" rx="24" fill="rgba(25,25,25,0.6)" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
      <text x="70" y="230" fontFamily="Inter, sans-serif" fontSize="14" fill="#b7410e" fontWeight="600">LAYER 2</text>
      <text x="120" y="230" fontFamily="Playfair Display, serif" fontSize="24" fill="#f5f5f5" fontWeight="600">Tree Builder & Mutate</text>
      <text x="400" y="270" fontFamily="Inter, sans-serif" fontSize="13" fill="rgba(245,245,245,0.6)" textAnchor="middle">Recursive path-based cloning</text>
      
      {/* Connection */}
      <path d="M400 280 L400 330" stroke="#b7410e" strokeWidth="2" strokeDasharray="4 4" markerEnd="url(#arrowhead)"/>
      
      {/* Layer 3 */}
      <rect x="50" y="340" width="700" height="100" rx="24" fill="rgba(25,25,25,0.6)" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
      <text x="70" y="390" fontFamily="Inter, sans-serif" fontSize="14" fill="#b7410e" fontWeight="600">LAYER 3</text>
      <text x="120" y="390" fontFamily="Playfair Display, serif" fontSize="24" fill="#f5f5f5" fontWeight="600">Concurrent Reader</text>
      <text x="400" y="430" fontFamily="Inter, sans-serif" fontSize="13" fill="rgba(245,245,245,0.6)" textAnchor="middle">Lock-free traversal</text>
    </svg>
  );
}