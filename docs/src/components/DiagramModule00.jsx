import React, { useState } from 'react';

export default function DiagramModule00() {
  const [isMutating, setIsMutating] = useState(false);

  return (
    <div 
      className="diagram-bg" 
      style={{ position: 'relative', overflow: 'hidden', cursor: 'pointer' }}
      onClick={() => setIsMutating(!isMutating)}
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
        Click to toggle state
      </div>

      <div style={{ 
        width: '250px', 
        background: 'var(--bg-surface)', 
        padding: '1.5rem', 
        border: `1px solid ${isMutating ? 'var(--accent-primary)' : 'var(--border-medium)'}`, 
        boxShadow: isMutating ? '0 8px 24px rgba(0,0,0,0.1)' : '0 4px 12px rgba(0,0,0,0.05)', 
        position: 'absolute', 
        top: '15%', 
        left: '10%',
        transition: 'all 0.3s ease'
      }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: isMutating ? 'var(--accent-primary)' : 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase', transition: 'color 0.3s ease' }}>
          JS Thread (Writer)
        </div>
        <code style={{ background: isMutating ? 'var(--bg-page)' : 'transparent', padding: '0.25rem', borderRadius: '4px' }}>
          {isMutating ? 'mutate() → root v2' : 'idle'}
        </code>
      </div>

      <div style={{ 
        width: '250px', 
        background: 'var(--bg-surface)', 
        padding: '1.5rem', 
        border: '1px solid var(--border-medium)', 
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)', 
        position: 'absolute', 
        bottom: '15%', 
        right: '10%',
        transition: 'all 0.3s ease'
      }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
          Layout Thread (Reader)
        </div>
        <code>
          reads {isMutating ? 'root v1 ✓' : 'root v1 ✓'}
        </code>
      </div>

      {/* Connection lines */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
        <line 
          x1="45%" y1="35%" 
          x2="55%" y2="65%" 
          stroke={isMutating ? 'var(--accent-primary)' : 'var(--border-medium)'} 
          strokeWidth={isMutating ? 2 : 1} 
          strokeDasharray={isMutating ? 'none' : '4 4'} 
          style={{ transition: 'all 0.3s ease' }}
        />
        {isMutating && (
          <circle cx="50%" cy="50%" r="4" fill="var(--accent-primary)">
            <animate attributeName="r" values="4;8;4" dur="1s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="1;0;1" dur="1s" repeatCount="indefinite" />
          </circle>
        )}
      </svg>
    </div>
  );
}
